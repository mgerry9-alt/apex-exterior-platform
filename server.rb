require 'webrick'
require 'json'
require 'uri'
require_relative 'lib/database'
require_relative 'lib/messaging_provider'
require_relative 'lib/research_engine'
require_relative 'lib/outreach_engine'
require_relative 'lib/seed_data'

module ExteriorOutreach
  class Server
    PORT = ENV['PORT'] ? ENV['PORT'].to_i : 3000

    def self.start
      db = Database.instance
      SeedData.seed(db)
      outreach = OutreachEngine.new(db)

      server = WEBrick::HTTPServer.new(
        Port: PORT,
        Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO),
        AccessLog: []
      )

      trap('INT') { server.shutdown }
      trap('TERM') { server.shutdown }

      # Mount Static Files with String-buffered reader to prevent sendfile Errno::EPERM
      server.mount('/', StaticFileServlet, File.expand_path('../public', __FILE__))
      server.mount('/api', ApiServlet, db, outreach)

      # Start background autonomous outreach dispatcher (runs every 60s)
      Thread.new do
        loop do
          sleep 60
          begin
            outreach.process_pending_drips(false)
          rescue => e
            STDERR.puts "[AutoDispatcher] #{e.message}"
          end
        end
      end

      puts "================================================================="
      puts " ApexExterior Automated Outreach & Response Intelligence Platform"
      puts " Server running at: http://localhost:#{PORT}"
      puts " Background Auto-Dispatcher: ACTIVE (60s tick)"
      puts "================================================================="

      server.start
    end

    class StaticFileServlet < WEBrick::HTTPServlet::AbstractServlet
      def initialize(server, root)
        super(server)
        @root = root
      end

      def do_GET(req, res)
        rel_path = req.path == '/' ? 'index.html' : req.path.gsub(%r{^/}, '')
        file_path = File.expand_path(rel_path, @root)

        if file_path.start_with?(@root) && File.file?(file_path)
          ext = File.extname(file_path).downcase
          mime = case ext
                 when '.html' then 'text/html'
                 when '.css'  then 'text/css'
                 when '.js'   then 'application/javascript'
                 when '.json' then 'application/json'
                 when '.png'  then 'image/png'
                 when '.svg'  then 'image/svg+xml'
                 when '.jpg', '.jpeg' then 'image/jpeg'
                 else 'text/plain'
                 end
          res['Content-Type'] = "#{mime}; charset=utf-8"
          res.body = File.binread(file_path)
        else
          res.status = 404
          res.body = "Not found"
        end
      end
    end

    class ApiServlet < WEBrick::HTTPServlet::AbstractServlet
      def initialize(server, db, outreach)
        super(server)
        @db = db
        @outreach = outreach
      end

      def do_OPTIONS(req, res)
        add_cors(res)
        res.status = 200
      end

      def do_GET(req, res)
        add_cors(res)
        res['Content-Type'] = 'application/json'

        uri = req.path.gsub(%r{^/api/?}, '')
        parts = uri.split('/')

        case parts[0]
        when 'dashboard'
          handle_dashboard(res)
        when 'research'
          handle_research(res)
        when 'campaigns'
          handle_campaigns(res)
        when 'contacts'
          handle_contacts(req, res)
        when 'inbox'
          handle_inbox(req, res)
        when 'messages'
          handle_messages(req, res)
        when 'schedule'
          handle_schedule(res)
        when 'd2d'
          handle_d2d(res)
        when 'growth_ideas'
          handle_growth_ideas(req, res)
        when 'invoices'
          handle_invoices(req, res)
        when 'estimates'
          handle_estimates(req, res)
        when 'settings'
          handle_get_settings(res)
        when 'nearby_route'
          handle_nearby_route(req, res)
        when 'iot'
          handle_iot_get(req, res, parts)
        else
          res.status = 404
          res.body = { error: 'Not found' }.to_json
        end
      rescue => e
        res.status = 500
        res.body = { error: e.message, backtrace: e.backtrace.first(3) }.to_json
      end

      def do_POST(req, res)
        add_cors(res)
        res['Content-Type'] = 'application/json'

        uri = req.path.gsub(%r{^/api/?}, '')
        parts = uri.split('/')
        payload = parse_json(req.body)

        case parts[0]
        when 'research'
          if parts[1] == 'analyze'
            text = payload['text'] || ''
            contact_id = payload['contact_id']
            contact = contact_id ? @db.get_first_row("SELECT * FROM contacts WHERE id = ?", contact_id) : nil
            analysis = ResearchEngine.analyze_response(text, contact)
            res.body = analysis.to_json
          else
            res.status = 404
            res.body = { error: 'Unknown research action' }.to_json
          end
        when 'campaigns'
          if parts[1] == 'dispatch'
            bypass = payload['bypass_quiet_hours'] == true
            results = @outreach.process_pending_drips(bypass)
            res.body = { success: true, count: results.size, results: results }.to_json
          elsif parts[2] == 'toggle'
            camp_id = parts[1].to_i
            camp = @db.get_first_row("SELECT status FROM campaigns WHERE id = ?", camp_id)
            new_status = camp && camp['status'] == 'Active' ? 'Paused' : 'Active'
            @db.execute("UPDATE campaigns SET status = ? WHERE id = ?", new_status, camp_id)
            res.body = { success: true, new_status: new_status }.to_json
          else
            # Create campaign
            @db.execute <<-SQL, payload['name'], payload['description'], payload['channel'] || 'Omnichannel', payload['target_audience'] || 'All Leads', 'Active'
              INSERT INTO campaigns (name, description, channel, target_audience, status)
              VALUES (?, ?, ?, ?, ?);
            SQL
            cid = @db.last_insert_row_id

            # Steps
            (payload['steps'] || []).each_with_index do |st, idx|
              @db.execute <<-SQL, cid, idx + 1, st['channel'] || 'SMS', st['delay_hours'].to_i, st['subject'], st['body_template']
                INSERT INTO campaign_steps (campaign_id, step_order, channel, delay_hours, subject, body_template)
                VALUES (?, ?, ?, ?, ?, ?);
              SQL
            end
            res.body = { success: true, id: cid }.to_json
          end
        when 'contacts'
          if parts[1] == 'import'
            # Bulk import contacts / HOAs
            list = payload['contacts'] || []
            camp_id = payload['campaign_id'] ? payload['campaign_id'].to_i : nil
            imported = 0
            list.each do |c|
              fname = c['first_name'] || (c['name'] ? c['name'].split(' ').first : 'Property')
              lname = c['last_name'] || (c['name'] ? c['name'].split(' ').drop(1).join(' ') : 'Manager')
              phone = c['phone']
              email = c['email']
              addr = c['address'] || ''
              city = c['city'] || 'Austin'
              ptype = c['property_type'] || 'HOA / Commercial'
              sqft = (c['property_sqft'] || 5000).to_i
              service = c['service_interest'] || 'Commercial Exterior Maintenance'
              source = c['lead_source'] || 'Bulk Import'
              quote = (c['quote_amount'] || 1200.0).to_f

              @db.execute <<-SQL, fname, lname, phone, email, addr, city, ptype, sqft, service, source, 'New Lead', quote
                INSERT INTO contacts (first_name, last_name, phone, email, address, city, property_type, property_sqft, service_interest, lead_source, status, quote_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
              SQL
              new_id = @db.last_insert_row_id
              if camp_id
                @outreach.enroll_contact(new_id, camp_id)
              end
              imported += 1
            end
            res.body = { success: true, count: imported }.to_json
          elsif parts[2] == 'enroll'
            contact_id = parts[1].to_i
            camp_id = payload['campaign_id'].to_i
            @outreach.enroll_contact(contact_id, camp_id)
            res.body = { success: true, message: 'Contact enrolled' }.to_json
          else
            # Add contact
            @db.execute <<-SQL, payload['first_name'], payload['last_name'], payload['phone'], payload['email'], payload['address'], payload['city'] || 'Austin', payload['property_type'] || 'Single Family', payload['property_sqft'].to_i, payload['service_interest'] || 'House Washing', payload['lead_source'] || 'Manual Entry', 'New Lead', payload['quote_amount'].to_f
              INSERT INTO contacts (first_name, last_name, phone, email, address, city, property_type, property_sqft, service_interest, lead_source, status, quote_amount)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            SQL
            new_id = @db.last_insert_row_id
            if payload['campaign_id']
              @outreach.enroll_contact(new_id, payload['campaign_id'].to_i)
            end
            res.body = { success: true, id: new_id }.to_json
          end
        when 'inbox'
          if parts[1] == 'reply'
            contact_id = payload['contact_id'].to_i
            body = payload['body'] || ''
            channel = payload['channel'] || 'SMS'
            result = @outreach.send_direct_reply(contact_id, body, channel)
            res.body = result.to_json
          elsif parts[1] == 'simulate_inbound'
            contact_id = payload['contact_id'].to_i
            text = payload['text'] || ''
            channel = payload['channel'] || 'SMS'
            contact = @db.get_first_row("SELECT * FROM contacts WHERE id = ?", contact_id)
            identifier = contact ? (channel == 'SMS' ? contact['phone'] : contact['email']) : 'Prospect'
            result = @outreach.receive_inbound(identifier, text, channel, contact_id)
            res.body = result.to_json
          else
            res.status = 404
            res.body = { error: 'Unknown inbox action' }.to_json
          end
        when 'webhook'
          first_name = payload['first_name'] || (payload['name'] ? payload['name'].split(' ').first : 'Homeowner')
          last_name = payload['last_name'] || (payload['name'] ? payload['name'].split(' ').drop(1).join(' ') : '')
          phone = payload['phone']
          email = payload['email']
          address = payload['address'] || payload['street'] || ''
          service = payload['service'] || payload['service_interest'] || 'House Washing'
          source = payload['source'] || 'Inbound Webhook'
          quote = (payload['quote_amount'] || 350.0).to_f

          city = payload['city'] || 'Wayzata'
          @db.execute <<-SQL, first_name, last_name, phone, email, address, city, 'Single Family', 2500, service, source, 'New Lead', quote
            INSERT INTO contacts (first_name, last_name, phone, email, address, city, property_type, property_sqft, service_interest, lead_source, status, quote_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          SQL
          new_id = @db.last_insert_row_id
          @outreach.enroll_contact(new_id, 1)
          dispatch_results = @outreach.process_pending_drips(true)
          res.body = { success: true, contact_id: new_id, auto_dispatched: dispatch_results }.to_json
        when 'sms'
          if parts[1] == 'inbound'
            # Support both Twilio x-www-form-urlencoded and JSON
            from_num = payload['From'] || payload['from'] || payload['phone'] || payload['sender']
            body_text = payload['Body'] || payload['body'] || payload['text'] || payload['message'] || ''

            if (from_num.nil? || from_num.empty?) && req.body && req.body.include?('=')
              form_params = URI.decode_www_form(req.body).to_h rescue {}
              from_num ||= form_params['From'] || form_params['phone']
              body_text = form_params['Body'] if body_text.empty?
            end

            from_num ||= 'Inbound SMS'
            result = @outreach.receive_inbound(from_num, body_text, 'SMS')

            if req['User-Agent'].to_s.downcase.include?('twilio') || req.path.include?('twilio')
              res['Content-Type'] = 'text/xml'
              res.body = "<Response></Response>"
            else
              res.body = result.to_json
            end
          else
            res.status = 404
            res.body = { error: 'Unknown SMS action' }.to_json
          end
        when 'settings'
          if parts[1] == 'test_email'
            to_email = payload['to'] || 'info@gerryswindows.com'
            settings = @outreach.get_settings
            if payload['settings']
              settings = settings.merge(payload['settings'])
            end
            provider_name = settings['smtp_host'].to_s.include?('zeptomail') ? 'Zoho ZeptoMail ($2.50 / 10k Token)' : (settings['smtp_host'].to_s.include?('brevo') ? 'Brevo Relay' : 'Custom SMTP')
            res_test = MessagingProvider.send_email(
              to: to_email,
              subject: "Test Connection - Gerry's Window Services",
              body_html: "<div style='font-family:sans-serif;padding:20px;border-left:4px solid #3b82f6;'><h2>Connection Successful!</h2><p>Your <strong>#{provider_name}</strong> outreach engine is operational and authenticated to send from <strong>#{settings['company_email']}</strong>.</p><p>Gerry's Window Services | Twin Cities, MN | (612) 666-7720</p></div>",
              body_text: "Connection Successful! Your #{provider_name} outreach engine is operational and authenticated to send from #{settings['company_email']}.",
              settings: settings
            )
            res.body = res_test.to_json
          else
            (payload || {}).each do |k, v|
              @db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", k.to_s, v.to_s)
            end
            res.body = { success: true, settings: @outreach.get_settings }.to_json
          end
        when 'schedule'
          if parts[1] == 'status'
            job_id = payload['job_id'].to_i
            new_status = payload['status'] || 'Scheduled'
            @db.execute("UPDATE scheduled_jobs SET status = ? WHERE id = ?", new_status, job_id)

            # Autonomous Franchise Workflow: If technician marks job 'Completed',
            # automatically enroll client into Campaign 5 (Post-Job 5-Star Review & Referral Multiplier)
            auto_enrolled = nil
            if new_status == 'Completed'
              job = @db.get_first_row("SELECT * FROM scheduled_jobs WHERE id = ?", job_id)
              if job
                contact = @db.get_first_row("SELECT * FROM contacts WHERE phone = ? OR (first_name || ' ' || last_name) = ? LIMIT 1", job['phone'], job['customer_name'])
                if !contact && !job['phone'].to_s.empty?
                  names = job['customer_name'].split(' ')
                  fname = names.first || 'Customer'
                  lname = names.drop(1).join(' ')
                  @db.execute <<-SQL, fname, lname, job['phone'], '', job['address'], job['city'], 'Single Family', 3000, job['services'], 'Technician Job Completed', 'Completed', job['amount']
                    INSERT INTO contacts (first_name, last_name, phone, email, address, city, property_type, property_sqft, service_interest, lead_source, status, quote_amount)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                  SQL
                  cid = @db.last_insert_row_id
                  contact = @db.get_first_row("SELECT * FROM contacts WHERE id = ?", cid)
                end

                if contact
                  camp5 = @db.get_first_row("SELECT id FROM campaigns WHERE name LIKE '%Review%' LIMIT 1")
                  if camp5
                    @outreach.enroll_contact(contact['id'], camp5['id'])
                    auto_enrolled = { contact_id: contact['id'], campaign_id: camp5['id'] }
                  end
                end

                # Auto-generate digital invoice upon completion (Flyra / Jobber style)
                existing_inv = @db.get_first_row("SELECT id FROM invoices WHERE job_id = ?", job_id)
                if !existing_inv
                  inv_num = "INV-#{1000 + job_id}"
                  items_json = [{ desc: job['services'], amt: job['amount'] }].to_json
                  @db.execute <<-SQL, inv_num, job_id, (contact ? contact['id'] : nil), job['customer_name'], job['phone'], (contact ? contact['email'] : ''), job['address'], job['city'], job['amount'], 0.0, job['amount'], 0.0, 'Sent', items_json
                    INSERT INTO invoices (invoice_number, job_id, contact_id, customer_name, phone, email, address, city, subtotal, tax, total_amount, tip_amount, status, line_items_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                  SQL
                end

                # Auto-generate IoT Digital Water Purity & Clarity Certificate
                existing_cert = @db.get_first_row("SELECT id, cert_number FROM clarity_certificates WHERE job_id = ?", job_id)
                if !existing_cert
                  cert_num = "CERT-#{Time.now.strftime('%y%m')}-#{rand(1000..9999)}"
                  expires_at = (Time.now + (48 * 3600)).strftime('%Y-%m-%d %H:%M:%S')
                  tech = @db.get_first_row("SELECT * FROM technicians WHERE id = ?", job['technician_id'])
                  tech_name = tech ? tech['name'] : "Mason Gerry (Lead Tech)"
                  truck_name = tech ? tech['truck_name'] : "Truck 1 - Pure DI Water Rig"
                  
                  @db.execute <<-SQL, cert_num, job_id, (contact ? contact['id'] : nil), job['customer_name'], job['address'], job['city'], tech_name, truck_name, 284, 0, 42.0, 32, expires_at, 'TDS Verified: 0 PPM Process Water', 'simulated'
                    INSERT INTO clarity_certificates (cert_number, job_id, contact_id, customer_name, address, city, technician_name, truck_name, municipal_inflow_ppm, purified_outflow_ppm, gallons_used, panes_cleaned, rain_shield_expires_at, status, source_mode)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                  SQL

                  if job['phone'] && !job['phone'].empty?
                    cert_sms = "🏆 Gerry's Window Services: Your job at #{job['address']} is verified complete! Cleaned with 000 PPM lab-grade pure DI water. View your IoT Clarity Certificate & 48-Hour Rain Shield: https://sig-flu-cheque-designers.trycloudflare.com/certificate.html?cert=#{cert_num}"
                    @db.execute <<-SQL, (contact ? contact['id'] : nil), 'SMS', 'outbound', cert_sms, 'Sent'
                      INSERT INTO messages (contact_id, channel, direction, body, status)
                      VALUES (?, ?, ?, ?, ?);
                    SQL
                  end
                end
              end
            end
            res.body = { success: true, job_id: job_id, status: new_status, auto_enrolled: auto_enrolled }.to_json
          elsif parts[1] == 'on_my_way'
            job_id = payload['job_id'].to_i
            eta = (payload['eta_minutes'] || 15).to_i
            job = @db.get_first_row("SELECT * FROM scheduled_jobs WHERE id = ?", job_id)
            if job
              tech = @db.get_first_row("SELECT * FROM technicians WHERE id = ?", job['technician_id'])
              tech_name = tech ? tech['name'] : "Mason Gerry (Lead Tech)"
              truck_name = tech ? tech['truck_name'] : "Truck 1 - Pure DI Water Rig"
              
              msg_text = "🚗 On My Way! #{tech_name} from Gerry's Window Services is en route in #{truck_name} (ETA: ~#{eta} mins) to #{job['address']}. Please ensure side gates are unlocked and pets are safe inside! See you shortly."
              
              @db.execute("UPDATE scheduled_jobs SET status = 'En Route' WHERE id = ?", job_id)
              
              contact = @db.get_first_row("SELECT id FROM contacts WHERE phone = ? OR address = ? LIMIT 1", job['phone'], job['address'])
              cid = contact ? contact['id'] : nil
              @db.execute <<-SQL, cid, 'SMS', 'outbound', msg_text, 'Sent'
                INSERT INTO messages (contact_id, channel, direction, body, status)
                VALUES (?, ?, ?, ?, ?);
              SQL

              res.body = { 
                success: true, 
                job_id: job_id, 
                status: 'En Route', 
                technician: tech_name, 
                truck: truck_name, 
                eta_minutes: eta, 
                message: msg_text 
              }.to_json
            else
              res.status = 404
              res.body = { error: 'Job not found' }.to_json
            end
          else
            cust = payload['customer_name'] || 'Customer'
            phone = payload['phone'] || ''
            addr = payload['address'] || ''
            city = payload['city'] || 'Wayzata'
            date = payload['job_date'] || Time.now.strftime('%Y-%m-%d')
            time = payload['time_slot'] || '09:00 AM'
            serv = payload['services'] || 'Pure DI Window Cleaning'
            amt = (payload['amount'] || 350.0).to_f
            tech_id = (payload['technician_id'] || 1).to_i
            notes = payload['notes'] || ''
            booked_by = payload['booked_by'] || 'Direct'

            # Resource conflict double-booking prevention (REQ-001)
            existing_conflict = @db.get_first_row(<<-SQL, tech_id, date, time)
              SELECT id, customer_name, time_slot FROM scheduled_jobs
              WHERE technician_id = ? AND job_date = ? AND time_slot = ? AND status != 'Cancelled'
            SQL

            if existing_conflict
              res.status = 409
              res.body = {
                error: "Schedule Conflict: Technician/truck is already booked for this slot.",
                conflicting_job_id: existing_conflict['id'],
                technician_id: tech_id,
                job_date: date,
                time_slot: time
              }.to_json
              return
            end

            @db.execute <<-SQL, cust, phone, addr, city, date, time, serv, amt, 'Scheduled', notes, booked_by, tech_id
              INSERT INTO scheduled_jobs (customer_name, phone, address, city, job_date, time_slot, services, amount, status, notes, booked_by, technician_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            SQL
            new_id = @db.last_insert_row_id
            res.body = { success: true, id: new_id }.to_json
          end
        when 'd2d'
          if parts[1] == 'knocks'
            rep = payload['rep_name'] || 'Field Rep'
            addr = payload['address'] || ''
            city = payload['city'] || 'Minnetonka'
            neigh = payload['neighborhood'] || 'Lake Minnetonka South'
            owner = payload['homeowner_name'] || 'Homeowner'
            phone = payload['phone'] || ''
            email = payload['email'] || ''
            status = payload['status'] || 'Interested'
            stories = (payload['stories'] || 2).to_i
            panes = (payload['panes_estimate'] || 30).to_i
            serv = payload['services'] || 'Pure DI Window Cleaning'
            amt = (payload['quote_amount'] || 0.0).to_f
            notes = payload['notes'] || ''

            scheduled_job_id = nil
            if status == 'Booked on Spot' && payload['job_date'] && !payload['job_date'].empty?
              date = payload['job_date']
              time = payload['time_slot'] || '10:00 AM'
              tech_id = (payload['technician_id'] || 1).to_i
              @db.execute <<-SQL, owner, phone, addr, city, date, time, serv, amt, 'Scheduled', notes, "Rep #{rep} (D2D)", tech_id
                INSERT INTO scheduled_jobs (customer_name, phone, address, city, job_date, time_slot, services, amount, status, notes, booked_by, technician_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
              SQL
              scheduled_job_id = @db.last_insert_row_id
            end

            @db.execute <<-SQL, rep, addr, city, neigh, owner, phone, email, status, stories, panes, serv, amt, notes, scheduled_job_id
              INSERT INTO d2d_knocks (rep_name, address, city, neighborhood, homeowner_name, phone, email, status, stories, panes_estimate, services, quote_amount, notes, scheduled_job_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            SQL
            knock_id = @db.last_insert_row_id

            # Auto-sync to CRM contacts table if contact info provided
            if (!phone.empty? || !email.empty?) && owner != 'Homeowner'
              names = owner.split(' ')
              fname = names.first || 'Homeowner'
              lname = names.drop(1).join(' ')
              contact_status = (status == 'Booked on Spot' ? 'Booked' : 'Quoted')
              @db.execute <<-SQL, fname, lname, phone, email, addr, city, 'Single Family', panes * 75, serv, "D2D Rep (#{rep})", contact_status, amt
                INSERT INTO contacts (first_name, last_name, phone, email, address, city, property_type, property_sqft, service_interest, lead_source, status, quote_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
              SQL
              new_contact_id = @db.last_insert_row_id
              if status == 'Interested'
                @outreach.enroll_contact(new_contact_id, 1) # Speed to lead follow-up
              end
            end

            res.body = { success: true, knock_id: knock_id, scheduled_job_id: scheduled_job_id }.to_json
          else
            res.status = 404
            res.body = { error: 'Unknown D2D action' }.to_json
          end
        when 'calls'
          if parts[1] == 'log'
            contact_id = payload['contact_id'].to_i
            disposition = payload['disposition'] || 'Spoke with Contact'
            notes = payload['notes'] || ''
            trigger_followup = payload['trigger_followup'] == true
            
            contact = @db.get_first_row("SELECT * FROM contacts WHERE id = ?", contact_id)
            if contact
              @db.execute <<-SQL, contact_id, 'Phone Call', 'outbound', 'Rep', contact['phone'], "Call Disposition: #{disposition}", "Call logged: #{disposition}. Notes: #{notes}", 'completed'
                INSERT INTO messages (contact_id, channel, direction, sender, recipient, subject, body, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
              SQL

              if trigger_followup && contact['email'] && !contact['email'].empty?
                settings = @outreach.get_settings
                MessagingProvider.send_email(
                  to: contact['email'],
                  subject: "Quick follow-up from Gerry's Window Services",
                  body_html: "<div style='font-family:sans-serif;padding:16px;'><h3>Gerry's Window Services</h3><p>Hi #{contact['first_name']},</p><p>We tried reaching you briefly by phone regarding your exterior cleaning and pure water window service quote for <strong>#{contact['address']}</strong>.</p><p>Our trucks are in your area this week. You can reply directly to this email or call us at (612) 666-7720 to lock in your date!</p><p>Best regards,<br>Gerry's Window Services</p></div>",
                  body_text: "Hi #{contact['first_name']}, tried reaching you by phone regarding exterior cleaning for #{contact['address']}. Call us at (612) 666-7720 or reply here!",
                  settings: settings
                )
              end
            end
            res.body = { success: true, message: 'Call logged successfully' }.to_json
          elsif parts[1] == 'dispatch_voice_agent'
            contact_id = payload['contact_id'].to_i
            phone = payload['phone']
            name = payload['customer_name'] || 'Homeowner'
            contact = contact_id > 0 ? @db.get_first_row("SELECT * FROM contacts WHERE id = ?", contact_id) : nil

            target_phone = contact ? contact['phone'] : phone
            target_name = contact ? "#{contact['first_name']} #{contact['last_name']}" : name
            target_addr = contact ? contact['address'] : 'Twin Cities Metro'

            settings = @outreach.get_settings
            caller_number = settings['company_phone'] || '(612) 666-7720'

            # Voice Agent Outbound Record
            call_log_text = "🤖 AI Voice Agent 'Alex' initiated call to #{target_name} (#{target_phone}). Caller ID: #{caller_number}. Script: 10 Discovery Questions + Window Pricing Formula (10=$100, 20=$200, 30=$300, 40=$390, 50=$480, 60=$570, 70=$660, Int: +$10/win, Scr: $5/scr)."

            @db.execute <<-SQL, (contact ? contact['id'] : nil), 'AI Voice Agent', 'outbound', 'AI Voice Agent (Alex)', target_phone, "AI Voice Call Initiated", call_log_text, 'In Progress'
              INSERT INTO messages (contact_id, channel, direction, sender, recipient, subject, body, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            SQL

            res.body = {
              success: true,
              message: "AI Voice Agent dispatched to #{target_name} at #{target_phone}!",
              details: {
                target_name: target_name,
                target_phone: target_phone,
                caller_id: caller_number,
                address: target_addr,
                script: "10 Discovery Questions + Window Pricing Matrix"
              }
            }.to_json
          else
            res.status = 404
            res.body = { error: 'Unknown call action' }.to_json
          end
        when 'growth_ideas'
          if parts[1] == 'launch'
            idea_id = payload['idea_id'].to_i
            idea = @db.get_first_row("SELECT * FROM growth_ideas WHERE id = ?", idea_id)
            if idea
              camp = @db.get_first_row("SELECT id FROM campaigns WHERE name LIKE ? LIMIT 1", "%#{idea['category']}%") ||
                     @db.get_first_row("SELECT id FROM campaigns WHERE id = 1")
              enrolled = 0
              if camp
                contacts = @db.execute("SELECT id FROM contacts WHERE status != 'Unsubscribed' AND id NOT IN (SELECT contact_id FROM drip_queue WHERE campaign_id = ?) LIMIT 10", camp['id'])
                contacts.each do |c|
                  @outreach.enroll_contact(c['id'], camp['id'])
                  enrolled += 1
                end
              end
              res.body = { success: true, idea: clean_row(idea), enrolled_count: enrolled, campaign_id: camp ? camp['id'] : nil }.to_json
            else
              res.status = 404
              res.body = { error: 'Idea not found' }.to_json
            end
          else
            res.status = 404
            res.body = { error: 'Unknown growth action' }.to_json
          end
        when 'invoices'
          if parts[1] == 'create'
            job_id = payload['job_id'] ? payload['job_id'].to_i : nil
            contact_id = payload['contact_id'] ? payload['contact_id'].to_i : nil
            cust_name = payload['customer_name'] || 'Customer'
            phone = payload['phone'] || ''
            email = payload['email'] || ''
            addr = payload['address'] || ''
            city = payload['city'] || 'Wayzata'
            subtotal = (payload['subtotal'] || payload['amount'] || 350.0).to_f
            tax = (payload['tax'] || 0.0).to_f
            total = subtotal + tax
            items_json = payload['line_items'] ? payload['line_items'].to_json : '[{"desc":"Pure DI Window Detailing","amt":' + subtotal.to_s + '}]'
            inv_num = "INV-#{Time.now.to_i % 100000}"

            @db.execute <<-SQL, inv_num, job_id, contact_id, cust_name, phone, email, addr, city, subtotal, tax, total, 0.0, 'Sent', items_json
              INSERT INTO invoices (invoice_number, job_id, contact_id, customer_name, phone, email, address, city, subtotal, tax, total_amount, tip_amount, status, line_items_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            SQL
            new_id = @db.last_insert_row_id
            res.body = { success: true, id: new_id, invoice_number: inv_num }.to_json
          elsif parts[1] == 'pay'
            inv_id = payload['invoice_id'].to_i
            tip = (payload['tip_amount'] || 0.0).to_f.round(2)
            method = payload['payment_method'] || 'Credit Card'
            inv = @db.get_first_row("SELECT * FROM invoices WHERE id = ?", inv_id)
            if inv
              sub = (inv['subtotal'] || 0.0).to_f.round(2)
              tax = (inv['tax'] || 0.0).to_f.round(2)
              new_total = (sub + tax + tip).round(2)
              paid_time = Time.now.strftime('%Y-%m-%d %H:%M')
              @db.execute("UPDATE invoices SET status = 'Paid', tip_amount = ?, total_amount = ?, payment_method = ?, paid_at = ? WHERE id = ?", tip, new_total, method, paid_time, inv_id)
              res.body = { success: true, invoice_id: inv_id, subtotal: sub, tax: tax, tip_amount: tip, total_paid: new_total, status: 'Paid' }.to_json
            else
              res.status = 404
              res.body = { error: 'Invoice not found' }.to_json
            end
          else
            res.status = 404
            res.body = { error: 'Unknown invoice action' }.to_json
          end
        when 'estimates'
          if parts[1] == 'calculate'
            panes = (payload['panes_count'] || 30).to_i
            panes = 10 if panes < 10
            screens = (payload['screens_count'] || 0).to_i
            hard_reach_severity = payload['hard_reach_severity'] || 'None'

            # User pricing:
            # 10=$100, 20=$200, 30=$300, 40=$390, 50=$480, 60=$570, 70=$660
            base_ext = if panes <= 30
              panes * 10.0
            else
              300.0 + (panes - 30) * 9.0
            end.round(2)

            # Interior is $10 per window
            interior_cost = (panes * 10.0).round(2)
            sig_in_out = (base_ext + interior_cost).round(2)

            # Screens are $5 per screen
            screen_cost = (screens * 5.0).round(2)
            master_pkg = (sig_in_out + screen_cost).round(2)

            res.body = {
              success: true,
              panes_count: panes,
              screens_count: screens,
              exterior_price: base_ext,
              interior_price: interior_cost,
              screens_price: screen_cost,
              bronze: { 
                title: "Essential Pure DI Exterior Wash", 
                price: base_ext, 
                desc: "100% Spotless 0 PPM Pure DI Water Wash for all #{panes} exterior windows & sills ($10/pane up to 30, $9/pane after)." 
              },
              silver: { 
                title: "Signature Interior & Exterior Wash", 
                price: sig_in_out, 
                desc: "Spotless Pure DI Exterior Wash + interior hand detailing ($10/window) for all #{panes} panes." 
              },
              gold: { 
                title: "Master Complete Care (In/Out + Screens)", 
                price: master_pkg, 
                desc: "Full interior & exterior wash + #{screens > 0 ? screens : panes} screens removed & cleaned ($5/screen)." 
              },
              reminder: "Always ask if there are screens ($5/screen to remove & clean) and hard-to-reach windows (extra charge TBD depending on severity)."
            }.to_json
          elsif parts[1] == 'accept'
            est_id = payload['estimate_id'] ? payload['estimate_id'].to_i : nil
            selected_tier = payload['selected_tier'] || 'Signature Interior & Exterior + Screens'
            pref_date = payload['preferred_date'] || (Time.now + 86400 * 2).strftime('%Y-%m-%d')
            time_slot = payload['time_slot'] || '10:00 AM'
            
            # Resource conflict double-booking prevention (REQ-001)
            existing_conflict = @db.get_first_row(<<-SQL, 1, pref_date, time_slot)
              SELECT id, customer_name, time_slot FROM scheduled_jobs
              WHERE technician_id = ? AND job_date = ? AND time_slot = ? AND status != 'Cancelled'
            SQL

            if existing_conflict
              res.status = 409
              res.body = {
                error: "Schedule Conflict: Slot is already booked. Please choose an alternate slot.",
                conflicting_job_id: existing_conflict['id'],
                technician_id: 1,
                job_date: pref_date,
                time_slot: time_slot
              }.to_json
              return
            end

            est = est_id ? @db.get_first_row("SELECT * FROM estimates WHERE id = ?", est_id) : nil
            cust_name = est ? est['customer_name'] : (payload['customer_name'] || 'Customer')
            phone = est ? est['phone'] : (payload['phone'] || '')
            addr = est ? est['address'] : (payload['address'] || '')
            city = est ? est['city'] : (payload['city'] || 'Wayzata')
            amt = (payload['amount'] || 465.0).to_f
            serv = "#{selected_tier} Detailing"

            if est_id
              @db.execute("UPDATE estimates SET status = 'Accepted', selected_tier = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?", selected_tier, est_id)
            end

            # Auto-schedule on dispatch board
            @db.execute <<-SQL, cust_name, phone, addr, city, pref_date, time_slot, serv, amt, 'Scheduled', "Client accepted #{selected_tier} Tier via online estimate", "Online Estimate", 1
              INSERT INTO scheduled_jobs (customer_name, phone, address, city, job_date, time_slot, services, amount, status, notes, booked_by, technician_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            SQL
            job_id = @db.last_insert_row_id
            res.body = { success: true, job_id: job_id, scheduled_date: pref_date, status: 'Scheduled' }.to_json
          else
            res.status = 404
            res.body = { error: 'Unknown estimate action' }.to_json
          end
        when 'calls'
          if parts[1] == 'log'
            contact_id = payload['contact_id'] ? payload['contact_id'].to_i : nil
            phone = payload['phone'] || ''
            cust_name = payload['customer_name'] || 'Homeowner'
            outcome = payload['outcome'] || 'Connected'
            notes = payload['notes'] || ''
            duration = payload['duration'] || '1m'
            
            call_body = "📞 Outbound Phone Call with #{cust_name} (#{phone})\nOutcome: #{outcome}\nDuration: #{duration}\nNotes: #{notes}"
            @db.execute <<-SQL, contact_id, 'Phone Call', 'outbound', call_body, 'Completed'
              INSERT INTO messages (contact_id, channel, direction, body, status)
              VALUES (?, ?, ?, ?, ?);
            SQL

            if contact_id && contact_id > 0
              if outcome == 'Booked on Call'
                @db.execute("UPDATE contacts SET status = 'Booked' WHERE id = ?", contact_id)
              elsif outcome == 'Needs Follow-Up'
                @db.execute("UPDATE contacts SET status = 'Nurturing' WHERE id = ?", contact_id)
              elsif outcome == 'Left Voicemail' || outcome == 'Connected'
                @db.execute("UPDATE contacts SET status = 'Contacted' WHERE id = ? AND status = 'New Lead'", contact_id)
              end
            end

            res.body = { success: true, message: 'Call logged successfully', outcome: outcome }.to_json
          else
            res.status = 404
            res.body = { error: 'Unknown call action' }.to_json
          end
        when 'iot'
          handle_iot_post(req, res, parts, payload)
        else
          res.status = 404
          res.body = { error: 'Not found' }.to_json
        end
      rescue => e
        res.status = 500
        res.body = { error: e.message, backtrace: e.backtrace.first(3) }.to_json
      end

      private

      def add_cors(res)
        res['Access-Control-Allow-Origin'] = '*'
        res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        res['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
      end

      def parse_json(body)
        return {} if body.nil? || body.strip.empty?
        JSON.parse(body)
      rescue
        {}
      end

      def handle_dashboard(res)
        contacts_count = @db.get_first_row("SELECT COUNT(*) as count FROM contacts")['count']
        sent_count = @db.get_first_row("SELECT COUNT(*) as count FROM messages WHERE direction = 'outbound'")['count']
        recv_count = @db.get_first_row("SELECT COUNT(*) as count FROM messages WHERE direction = 'inbound'")['count']
        booked_count = @db.get_first_row("SELECT COUNT(*) as count FROM contacts WHERE status = 'Booked'")['count']
        pipeline_val = @db.get_first_row("SELECT SUM(quote_amount) as total FROM contacts WHERE status != 'Lost' AND status != 'Unsubscribed'")['total'] || 0.0

        positive_count = @db.get_first_row("SELECT COUNT(*) as count FROM responses WHERE sentiment = 'Positive'")['count']
        total_resp = @db.get_first_row("SELECT COUNT(*) as count FROM responses")['count']

        res.body = {
          contacts_count: contacts_count,
          sent_count: sent_count,
          received_count: recv_count,
          reply_rate: sent_count > 0 ? (recv_count.to_f / sent_count * 100).round(1) : 0,
          booked_count: booked_count,
          pipeline_value: pipeline_val.to_f.round(2),
          positive_sentiment_rate: total_resp > 0 ? (positive_count.to_f / total_resp * 100).round(1) : 0,
          quiet_hours_active: !@outreach.within_quiet_hours?
        }.to_json
      end

      def handle_research(res)
        report = ResearchEngine.generate_intelligence_report(@db)
        # Add battlecards
        battlecards = [
          {
            objection: 'Plant / Garden Chemical Fear',
            trigger_keywords: ['plants', 'flowers', 'bleach', 'dog', 'safe for lawn'],
            root_cause: 'Homeowners spent $1,000s landscaping and fear caustic bleach runoff.',
            rebuttal_script: 'We use dedicated low-pressure SoftWash with pre-hydration soaking and plant-neutralizing botanical surfactants. We guarantee zero landscaping damage.',
            conversion_lift: '+28%'
          },
          {
            objection: 'High Price vs Uninsured Competitor',
            trigger_keywords: ['expensive', 'cheaper', 'flyer', 'other guy', 'cost too much'],
            root_cause: 'Flyer shock from handymen with standard 4,000 PSI pressure washers.',
            rebuttal_script: 'Offer the $50 Neighbor Route Discount or bundle a free $85 front walkway wash. Highlight $2M liability insurance and siding warranty protection.',
            conversion_lift: '+35%'
          },
          {
            objection: 'Delaying until Spring / Warm Weather',
            trigger_keywords: ['spring', 'next month', 'wait until', 'winter'],
            root_cause: 'Assuming exterior cleaning is only done in April/May.',
            rebuttal_script: 'Offer Priority Spring VIP reservation with zero deposit to lock in current pricing before spring price hikes.',
            conversion_lift: '+42%'
          },
          {
            objection: 'Spouse / Landlord Consultation',
            trigger_keywords: ['husband', 'wife', 'spouse', 'hoa board'],
            root_cause: 'Polite stalling or authentic co-owner decision making.',
            rebuttal_script: 'Send a clean 1-page summary PDF with before/after photos and COI so both decision makers have facts immediately.',
            conversion_lift: '+21%'
          }
        ]
        report[:battlecards] = battlecards
        res.body = report.to_json
      end

      def handle_campaigns(res)
        campaigns = @db.execute("SELECT * FROM campaigns ORDER BY id ASC")
        campaigns_with_details = campaigns.map do |c|
          steps = @db.execute("SELECT * FROM campaign_steps WHERE campaign_id = ? ORDER BY step_order ASC", c['id'])
          active_enrolled = @db.get_first_row("SELECT COUNT(*) as count FROM campaign_enrollments WHERE campaign_id = ? AND status = 'Active'", c['id'])['count']
          completed_enrolled = @db.get_first_row("SELECT COUNT(*) as count FROM campaign_enrollments WHERE campaign_id = ? AND status = 'Completed'", c['id'])['count']
          c.merge(
            'steps' => steps,
            'active_enrolled' => active_enrolled,
            'completed_enrolled' => completed_enrolled
          )
        end
        res.body = campaigns_with_details.to_json
      end

      def clean_rows(rows)
        return [] unless rows
        rows.map { |r| clean_row(r) }
      end

      def clean_row(r)
        return nil unless r
        r.is_a?(Hash) ? r.reject { |k, _| k.is_a?(Integer) } : r
      end

      def handle_contacts(req, res)
        query = req.query || {}
        search = query['search'] ? "%#{query['search']}%" : nil
        status_filter = query['status']

        sql = "SELECT c.*, (SELECT COUNT(*) FROM messages WHERE contact_id = c.id) as message_count FROM contacts c WHERE 1=1"
        args = []

        if search
          sql += " AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.address LIKE ? OR c.phone LIKE ?)"
          args += [search, search, search, search]
        end

        if status_filter && !status_filter.empty? && status_filter != 'All'
          sql += " AND c.status = ?"
          args << status_filter
        end

        sql += " ORDER BY c.id DESC LIMIT 100"
        rows = @db.execute(sql, *args)
        res.body = clean_rows(rows).to_json
      end

      def handle_inbox(req, res)
        contacts = @db.execute <<-SQL
          SELECT c.*,
                 (SELECT body FROM messages WHERE contact_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
                 (SELECT sent_at FROM messages WHERE contact_id = c.id ORDER BY id DESC LIMIT 1) as last_activity,
                 (SELECT intent_category FROM responses WHERE contact_id = c.id ORDER BY id DESC LIMIT 1) as last_intent,
                 (SELECT sentiment FROM responses WHERE contact_id = c.id ORDER BY id DESC LIMIT 1) as last_sentiment,
                 (SELECT recommended_reply FROM responses WHERE contact_id = c.id ORDER BY id DESC LIMIT 1) as recommended_reply
          FROM contacts c
          WHERE (SELECT COUNT(*) FROM messages WHERE contact_id = c.id) > 0
          ORDER BY last_activity DESC
        SQL

        res.body = clean_rows(contacts).to_json
      end

      def handle_messages(req, res)
        contact_id = req.query && req.query['contact_id'] ? req.query['contact_id'].to_i : nil
        if contact_id
          msgs = @db.execute("SELECT * FROM messages WHERE contact_id = ? ORDER BY id ASC", contact_id)
          responses = @db.execute("SELECT * FROM responses WHERE contact_id = ? ORDER BY id ASC", contact_id)
          contact = @db.get_first_row("SELECT * FROM contacts WHERE id = ?", contact_id)
          res.body = { contact: clean_row(contact), messages: clean_rows(msgs), responses: clean_rows(responses) }.to_json
        else
          msgs = @db.execute("SELECT * FROM messages ORDER BY id DESC LIMIT 50")
          res.body = clean_rows(msgs).to_json
        end
      end

      def handle_get_settings(res)
        res.body = @outreach.get_settings.to_json
      end

      def handle_schedule(res)
        techs = @db.execute("SELECT * FROM technicians ORDER BY id")
        jobs = @db.execute(<<-SQL)
          SELECT j.*, t.name as tech_name, t.truck_name, t.color_code as tech_color
          FROM scheduled_jobs j
          LEFT JOIN technicians t ON j.technician_id = t.id
          ORDER BY j.job_date ASC, j.time_slot ASC
        SQL
        res.body = { success: true, technicians: clean_rows(techs), jobs: clean_rows(jobs) }.to_json
      end

      def handle_d2d(res)
        knocks = @db.execute("SELECT * FROM d2d_knocks ORDER BY id DESC LIMIT 100")
        total_knocks = @db.get_first_row("SELECT COUNT(*) as count FROM d2d_knocks")['count'] || 0
        booked_knocks = @db.get_first_row("SELECT COUNT(*) as count FROM d2d_knocks WHERE status = 'Booked on Spot'")['count'] || 0
        interested_knocks = @db.get_first_row("SELECT COUNT(*) as count FROM d2d_knocks WHERE status LIKE '%Interested%'")['count'] || 0
        total_revenue = @db.get_first_row("SELECT SUM(quote_amount) as total FROM d2d_knocks WHERE status = 'Booked on Spot'")['total'] || 0.0

        leaderboard = @db.execute(<<-SQL)
          SELECT rep_name,
                 COUNT(*) as total_knocks,
                 SUM(CASE WHEN status = 'Booked on Spot' THEN 1 ELSE 0 END) as booked,
                 SUM(quote_amount) as total_quoted,
                 SUM(CASE WHEN status = 'Booked on Spot' THEN quote_amount ELSE 0 END) as revenue
          FROM d2d_knocks
          GROUP BY rep_name
          ORDER BY booked DESC, total_knocks DESC
        SQL

        res.body = {
          success: true,
          knocks: clean_rows(knocks),
          stats: {
            total_knocks: total_knocks,
            booked_knocks: booked_knocks,
            interested_knocks: interested_knocks,
            total_revenue: total_revenue.to_f,
            close_rate: total_knocks > 0 ? (booked_knocks.to_f / total_knocks * 100).round(1) : 0
          },
          leaderboard: clean_rows(leaderboard)
        }.to_json
      end

      def handle_growth_ideas(req, res)
        category = req.query && req.query['category'] ? req.query['category'] : nil
        sql = "SELECT * FROM growth_ideas"
        args = []
        if category && !category.empty? && category != 'All'
          sql += " WHERE category = ?"
          args << category
        end
        sql += " ORDER BY id ASC"
        rows = @db.execute(sql, *args)
        res.body = { success: true, ideas: clean_rows(rows) }.to_json
      end

      def handle_invoices(req, res)
        id = req.query && req.query['id'] ? req.query['id'].to_i : nil
        if id
          inv = @db.get_first_row("SELECT * FROM invoices WHERE id = ?", id)
          res.body = { success: true, invoice: clean_row(inv) }.to_json
        else
          rows = @db.execute("SELECT * FROM invoices ORDER BY id DESC LIMIT 50")
          total_revenue = @db.get_first_row("SELECT SUM(total_amount) as total FROM invoices WHERE status = 'Paid'")['total'] || 0.0
          pending_revenue = @db.get_first_row("SELECT SUM(total_amount) as total FROM invoices WHERE status = 'Sent' OR status = 'Unpaid'")['total'] || 0.0
          total_tips = @db.get_first_row("SELECT SUM(tip_amount) as total FROM invoices WHERE status = 'Paid'")['total'] || 0.0
          res.body = {
            success: true,
            invoices: clean_rows(rows),
            stats: {
              paid_total: total_revenue.to_f,
              pending_total: pending_revenue.to_f,
              tips_total: total_tips.to_f,
              count: rows.size
            }
          }.to_json
        end
      end

      def handle_estimates(req, res)
        id = req.query && req.query['id'] ? req.query['id'].to_i : nil
        if id
          est = @db.get_first_row("SELECT * FROM estimates WHERE id = ?", id)
          res.body = { success: true, estimate: clean_row(est) }.to_json
        else
          rows = @db.execute("SELECT * FROM estimates ORDER BY id DESC LIMIT 50")
          res.body = { success: true, estimates: clean_rows(rows) }.to_json
        end
      end

      def handle_nearby_route(req, res)
        city = (req.query && req.query['city'] && !req.query['city'].empty?) ? req.query['city'] : 'Wayzata'
        nearby_job = @db.get_first_row(<<-SQL, city)
          SELECT j.*, t.name as tech_name, t.truck_name
          FROM scheduled_jobs j
          LEFT JOIN technicians t ON j.technician_id = t.id
          WHERE (j.city = ? OR ? = '') AND j.status != 'Cancelled'
          ORDER BY j.job_date ASC
          LIMIT 1
        SQL

        if nearby_job
          res.body = {
            has_nearby: true,
            city: nearby_job['city'] || city,
            technician_name: nearby_job['tech_name'] || 'Mason Gerry (Lead Tech)',
            truck_name: nearby_job['truck_name'] || 'Truck 1 - Pure DI Water Rig',
            date: nearby_job['job_date'],
            time_slot: nearby_job['time_slot'],
            discount_amount: 40.0,
            headline: "⚡ Route Density Discount Available!",
            message: "Our #{nearby_job['truck_name']} is scheduled near #{nearby_job['city']} on #{nearby_job['job_date']}. Select this neighborhood route to save an automatic $40!"
          }.to_json
        else
          res.body = {
            has_nearby: false,
            city: city,
            discount_amount: 0.0,
            headline: "Twin Cities Route Scheduling",
            message: "Standard routes available for Wayzata, Minnetonka, Edina, Eden Prairie & Plymouth."
          }.to_json
        end
      end

      def handle_iot_get(req, res, parts)
        if parts[1] == 'telemetry'
          rows = @db.execute("SELECT * FROM iot_telemetry ORDER BY id ASC")
          total_purified = rows.map { |r| r['gallons_filtered_today'].to_f }.sum
          res.body = {
            success: true,
            telemetry: clean_rows(rows),
            system_summary: {
              active_rigs: rows.size,
              fleet_purity: "0.00 PPM",
              inflow_avg: 284,
              total_gallons_purified: total_purified.round(1),
              status: "Operational - Lab Grade Pure"
            }
          }.to_json
        elsif parts[1] == 'certificate'
          cert_id = (parts[2] && !parts[2].empty?) ? parts[2] : (req.query && (req.query['cert'] || req.query['id']))
          if cert_id && !cert_id.to_s.strip.empty?
            c_str = cert_id.to_s.strip.force_encoding('UTF-8')
            cert = @db.get_first_row("SELECT * FROM clarity_certificates WHERE cert_number = ?", c_str)
            cert ||= @db.get_first_row("SELECT * FROM clarity_certificates WHERE cert_number LIKE ?", "%#{c_str}%")
            cert ||= @db.get_first_row("SELECT * FROM clarity_certificates WHERE id = ?", c_str.to_i) if c_str =~ /^\d+$/
            cert ||= @db.get_first_row("SELECT * FROM clarity_certificates ORDER BY id DESC LIMIT 1") if c_str == 'latest'
            
            if cert
              res.body = { success: true, certificate: clean_row(cert) }.to_json
            else
              res.status = 404
              res.body = { error: 'Certificate not found', queried: c_str }.to_json
            end
          else
            rows = @db.execute("SELECT * FROM clarity_certificates ORDER BY id DESC LIMIT 50")
            res.body = { success: true, certificates: clean_rows(rows) }.to_json
          end
        else
          res.status = 404
          res.body = { error: 'Unknown IoT endpoint' }.to_json
        end
      end

      def handle_iot_post(req, res, parts, payload)
        if parts[1] == 'generate_certificate'
          job_id = payload['job_id'] ? payload['job_id'].to_i : nil
          cust_name = payload['customer_name'] || 'Homeowner'
          address = payload['address'] || 'Wayzata, MN'
          city = payload['city'] || 'Wayzata'
          phone = payload['phone'] || ''
          panes = (payload['panes_cleaned'] || 30).to_i
          gallons = (payload['gallons_used'] || 42.0).to_f
          tech_name = payload['technician_name'] || 'Mason Gerry (Lead Tech)'
          truck_name = payload['truck_name'] || 'Truck 1 - Pure DI Water Rig'
          source_mode = (payload['source_mode'] || 'simulated').to_s.downcase
          source_mode = 'simulated' unless ['live', 'simulated'].include?(source_mode)
          
          cert_num = "CERT-#{Time.now.strftime('%y%m')}-#{rand(1000..9999)}"
          expires_at = (Time.now + (48 * 3600)).strftime('%Y-%m-%d %H:%M:%S')

          contact = @db.get_first_row("SELECT id FROM contacts WHERE phone = ? OR address = ? LIMIT 1", phone, address)
          cid = contact ? contact['id'] : nil

          @db.execute <<-SQL, cert_num, job_id, cid, cust_name, address, city, tech_name, truck_name, 284, 0, gallons, panes, expires_at, 'TDS Verified: 0 PPM Process Water', source_mode
            INSERT INTO clarity_certificates (cert_number, job_id, contact_id, customer_name, address, city, technician_name, truck_name, municipal_inflow_ppm, purified_outflow_ppm, gallons_used, panes_cleaned, rain_shield_expires_at, status, source_mode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          SQL
          new_id = @db.last_insert_row_id
          cert = @db.get_first_row("SELECT * FROM clarity_certificates WHERE id = ?", new_id)

          res.body = {
            success: true,
            certificate_number: cert_num,
            certificate_url: "/certificate.html?cert=#{cert_num}",
            certificate: clean_row(cert)
          }.to_json
        elsif parts[1] == 'update_telemetry'
          truck_id = (payload['technician_id'] || payload['id'] || 1).to_i
          inflow = (payload['inflow_ppm'] || 284).to_i
          outflow = (payload['outflow_ppm'] || 0).to_i
          gpm = (payload['flow_rate_gpm'] || 1.8).to_f.round(2)
          psi = (payload['system_pressure_psi'] || 65).to_i
          resin = (payload['resin_life_percent'] || 94).to_i
          gallons = (payload['gallons_filtered_today'] || 112.5).to_f.round(2)
          status = payload['status'] || 'Active - Purifying'
          source_mode = (payload['source_mode'] || 'simulated').to_s.downcase
          source_mode = 'simulated' unless ['live', 'simulated'].include?(source_mode)

          # Rigorous Telemetry Envelope & Sensor Range Validation (REQ-003)
          validation_errors = []
          validation_errors << "inflow_ppm must be between 0 and 1500 PPM" if inflow < 0 || inflow > 1500
          validation_errors << "outflow_ppm must be between 0 and 100 PPM" if outflow < 0 || outflow > 100
          validation_errors << "flow_rate_gpm must be between 0.0 and 15.0 GPM" if gpm < 0.0 || gpm > 15.0
          validation_errors << "system_pressure_psi must be between 0 and 250 PSI" if psi < 0 || psi > 250
          validation_errors << "resin_life_percent must be between 0 and 100%" if resin < 0 || resin > 100
          validation_errors << "gallons_filtered_today cannot be negative" if gallons < 0.0

          if validation_errors.any?
            res.status = 422
            res.body = { 
              error: "Unprocessable Telemetry: sensor bounds violated", 
              details: validation_errors,
              submitted: { inflow_ppm: inflow, outflow_ppm: outflow, flow_rate_gpm: gpm, system_pressure_psi: psi, resin_life_percent: resin }
            }.to_json
            return
          end

          @db.execute <<-SQL, inflow, outflow, gpm, psi, resin, gallons, status, source_mode, truck_id, truck_id
            UPDATE iot_telemetry
            SET inflow_ppm = ?, outflow_ppm = ?, flow_rate_gpm = ?, system_pressure_psi = ?, resin_life_percent = ?, gallons_filtered_today = ?, status = ?, source_mode = ?, last_reading_at = CURRENT_TIMESTAMP
            WHERE id = ? OR technician_id = ?;
          SQL
          res.body = { 
            success: true, 
            message: 'IoT Telemetry updated',
            telemetry: {
              technician_id: truck_id,
              inflow_ppm: inflow,
              outflow_ppm: outflow,
              flow_rate_gpm: gpm,
              system_pressure_psi: psi,
              resin_life_percent: resin,
              source_mode: source_mode
            }
          }.to_json
        else
          res.status = 404
          res.body = { error: 'Unknown IoT action' }.to_json
        end
      end
    end
  end
end

if __FILE__ == $0
  ExteriorOutreach::Server.start
end
