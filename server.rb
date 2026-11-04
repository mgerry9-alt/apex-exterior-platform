require 'webrick'
require 'json'
require 'uri'
require 'date'
require 'time'
require 'cgi'
require 'securerandom'
require 'openssl'
require 'base64'
require 'digest'
require_relative 'lib/database'
require_relative 'lib/messaging_provider'
require_relative 'lib/research_engine'
require_relative 'lib/outreach_engine'
require_relative 'lib/seed_data'

module ExteriorOutreach
  class Server
    PORT = (ENV['APEX_PORT'] || ENV['PORT'] || '3001').to_i

    def self.start
      ENV['TZ'] ||= ENV['APEX_TIMEZONE'] || 'America/Chicago'
      db = Database.instance
      SeedData.seed(db)
      outreach = OutreachEngine.new(db)
      bind_address = ENV['APEX_BIND_ADDRESS'] || '127.0.0.1'
      admin_token = ENV['APEX_ADMIN_TOKEN']
      if admin_token.to_s.empty?
        raise 'Set APEX_ADMIN_TOKEN before binding beyond loopback.' unless ['127.0.0.1', '::1', 'localhost'].include?(bind_address)
        admin_token = SecureRandom.hex(32)
        puts "Admin API token (local session): #{admin_token}"
      elsif admin_token.length < 32
        raise 'APEX_ADMIN_TOKEN must contain at least 32 characters.'
      end

      server = WEBrick::HTTPServer.new(
        Port: PORT,
        BindAddress: bind_address,
        Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO),
        AccessLog: []
      )

      trap('INT') { server.shutdown }
      trap('TERM') { server.shutdown }

      # Mount Static Files with String-buffered reader to prevent sendfile Errno::EPERM
      server.mount('/', StaticFileServlet, File.expand_path('../public', __FILE__))
      server.mount('/api', ApiServlet, db, outreach, admin_token,
        ENV.fetch('APEX_ALLOWED_ORIGINS', '').split(',').map(&:strip).reject(&:empty?))

      # Process campaign queues only after an explicit live-messaging opt-in.
      if ENV['APEX_ENABLE_LIVE_MESSAGING'] == 'true'
        Thread.new do
          loop do
            sleep 60
            begin
              outreach.process_pending_drips
            rescue => e
              STDERR.puts "[MessageDispatcher] #{e.message}"
            end
          end
        end
      end
      puts "================================================================="
      puts " Apex Exterior Demo — Local Evidence Review"
      puts " Server running at: http://#{bind_address}:#{PORT}"
      puts " Live messaging: #{ENV['APEX_ENABLE_LIVE_MESSAGING'] == 'true' ? 'explicitly enabled' : 'disabled by default'}"
      puts "================================================================="

      server.start
    end

    class StaticFileServlet < WEBrick::HTTPServlet::AbstractServlet
      def initialize(server, root)
        super(server)
        @root = File.realpath(root)
      end

      def do_GET(req, res)
        rel_path = req.path == '/' ? 'index.html' : req.path.gsub(%r{^/}, '')
        file_path = File.expand_path(rel_path, @root)

        if file_path.start_with?(@root + File::SEPARATOR) && File.file?(file_path) && File.realpath(file_path).start_with?(@root + File::SEPARATOR)
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
      def initialize(server, db, outreach, admin_token, allowed_origins)
        super(server)
        @db = db
        @outreach = outreach
        @admin_token = admin_token
        @allowed_origins = allowed_origins
        @rate_limit = Hash.new { |hash, key| hash[key] = [] }
        @rate_limit_mutex = Mutex.new
      end

      def do_OPTIONS(req, res)
        if cors_origin_allowed?(req)
          add_cors(req, res)
          res.status = 204
        else
          res.status = 403
        end
      end

      def do_GET(req, res)
        add_cors(req, res)
        res['Content-Type'] = 'application/json'

        unless public_request?(req) || admin_authenticated?(req)
          res['WWW-Authenticate'] = 'Bearer realm="APEX Admin"'
          res.status = 401
          res.body = { error: 'Admin authentication required' }.to_json
          return
        end

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
        warn "[API GET] #{e.class}: #{e.message}"
        res.status = 500
        res.body = { error: 'Request failed' }.to_json
      end

      def do_POST(req, res)
        add_cors(req, res)
        res['Content-Type'] = 'application/json'

        if ['/api/webhook', '/api/sms/inbound'].include?(req.path) && !public_intake_enabled?
          res.status = 503
          res.body = { error: 'Public intake is disabled.' }.to_json
          return
        end

        if req.body.to_s.bytesize > 1_000_000
          res.status = 413
          res.body = { error: 'Request body is too large.' }.to_json
          return
        end

        unless public_request?(req) || admin_authenticated?(req)
          res['WWW-Authenticate'] = 'Bearer realm="APEX Admin"'
          res.status = 401
          res.body = { error: 'Admin authentication required' }.to_json
          return
        end
        if public_write_request?(req) && rate_limited?(req)
          res.status = 429
          res.body = { error: 'Too many requests; try again later.' }.to_json
          return
        end

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
            results = @outreach.process_pending_drips
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
              city = c['city'] || 'Demo City'
              ptype = c['property_type'] || 'HOA / Commercial'
              sqft = (c['property_sqft'] || 5000).to_i
              service = c['service_interest'] || 'Commercial Exterior Maintenance'
              source = c['lead_source'] || 'Bulk Import'
              quote = (c['quote_amount'] || 1200.0).to_f
              sms_consent = c['sms_consent'] == true || c['sms_consent'].to_s.downcase == 'yes' || c['sms_consent'].to_s == '1'
              email_consent = c['email_consent'] == true || c['email_consent'].to_s.downcase == 'yes' || c['email_consent'].to_s == '1'
              consent_at = (sms_consent || email_consent) ? Time.now.strftime('%Y-%m-%d %H:%M:%S') : nil

              @db.execute <<-SQL, fname, lname, phone, email, addr, city, ptype, sqft, service, source, 'New Lead', quote, sms_consent ? 1 : 0, email_consent ? 1 : 0, consent_at
                INSERT INTO contacts (first_name, last_name, phone, email, address, city, property_type, property_sqft, service_interest, lead_source, status, quote_amount, sms_consent, email_consent, consent_recorded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
            sms_consent = payload['sms_consent'] == true
            email_consent = payload['email_consent'] == true
            consent_at = (sms_consent || email_consent) ? Time.now.strftime('%Y-%m-%d %H:%M:%S') : nil
            @db.execute <<-SQL, payload['first_name'], payload['last_name'], payload['phone'], payload['email'], payload['address'], payload['city'] || 'Demo City', payload['property_type'] || 'Single Family', payload['property_sqft'].to_i, payload['service_interest'] || 'House Washing', payload['lead_source'] || 'Manual Entry', 'New Lead', payload['quote_amount'].to_f, sms_consent ? 1 : 0, email_consent ? 1 : 0, consent_at
              INSERT INTO contacts (first_name, last_name, phone, email, address, city, property_type, property_sqft, service_interest, lead_source, status, quote_amount, sms_consent, email_consent, consent_recorded_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
          quote = (payload['quote_amount'] || 0.0).to_f

          city = payload['city'] || 'Demo City'
          if payload['website'].to_s != '' || phone.to_s.strip.empty? || address.to_s.strip.empty?
            res.status = 422
            res.body = { error: 'A valid phone number and property address are required.' }.to_json
            return
          end
          sms_consent = payload['sms_consent'] == true
          email_consent = payload['email_consent'] == true
          consent_at = (sms_consent || email_consent) ? Time.now.strftime('%Y-%m-%d %H:%M:%S') : nil
          @db.execute <<-SQL, first_name.to_s[0, 100], last_name.to_s[0, 100], phone.to_s[0, 40], email.to_s[0, 254], address.to_s[0, 300], city.to_s[0, 100], 'Single Family', 2500, service.to_s[0, 120], source.to_s[0, 120], 'New Lead', quote, sms_consent ? 1 : 0, email_consent ? 1 : 0, consent_at
            INSERT INTO contacts (first_name, last_name, phone, email, address, city, property_type, property_sqft, service_interest, lead_source, status, quote_amount, sms_consent, email_consent, consent_recorded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          SQL
          new_id = @db.last_insert_row_id
          res.body = { success: true, contact_id: new_id, message: 'Request received; no automated message was sent.' }.to_json
        when 'sms'
          if parts[1] == 'inbound'
            unless valid_twilio_signature?(req)
              res.status = 403
              res.body = { error: 'Invalid provider signature.' }.to_json
              return
            end
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
            to_email = payload['to'] || 'no-reply@example.invalid'
            settings = @outreach.get_settings

            res_test = MessagingProvider.send_email(
              to: to_email,
              subject: 'APEX prototype email check',
              body_html: '<p>Prototype email check. This message does not verify production readiness.</p>',
              body_text: 'Prototype email check. This message does not verify production readiness.',
              settings: settings
            )
            res.body = res_test.to_json
          else
            (payload || {}).each do |k, v|
              next if ['smtp_password', 'twilio_auth_token', 'sendgrid_api_key', 'ai_autopilot_enabled'].include?(k.to_s)
              @db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", k.to_s, v.to_s)
            end
            res.body = { success: true, settings: @outreach.get_settings }.to_json
          end
        when 'schedule'
          if parts[1] == 'status'
            job_id = payload['job_id'].to_i
            new_status = payload['status'] || 'Scheduled'
            job_state = @db.get_first_row("SELECT status FROM scheduled_jobs WHERE id = ?", job_id)
            unless job_state
              res.status = 404
              res.body = { error: 'Job not found' }.to_json
              return
            end
            allowed_next = {
              'Scheduled' => ['En Route', 'Cancelled'],
              'En Route' => ['In Progress', 'Cancelled'],
              'In Progress' => ['Completed', 'Cancelled']
            }
            if new_status != job_state['status'] && !allowed_next.fetch(job_state['status'], []).include?(new_status)
              res.status = 409
              res.body = { error: "Invalid job transition from #{job_state['status']} to #{new_status}." }.to_json
              return
            end
            @db.execute("UPDATE scheduled_jobs SET status = ? WHERE id = ?", new_status, job_id)

            # Job completion only creates a draft invoice for internal review.
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

                # Create a draft invoice record; this is not a customer-ready invoice.
                existing_inv = @db.get_first_row("SELECT id FROM invoices WHERE job_id = ?", job_id)
                if !existing_inv
                  inv_num = "INV-#{1000 + job_id}"
                  items_json = [{ desc: job['services'], amt: job['amount'] }].to_json
                  @db.execute <<-SQL, inv_num, job_id, (contact ? contact['id'] : nil), job['customer_name'], job['phone'], (contact ? contact['email'] : ''), job['address'], job['city'], job['amount'], 0.0, job['amount'], 0.0, 'Draft', items_json
                    INSERT INTO invoices (invoice_number, job_id, contact_id, customer_name, phone, email, address, city, subtotal, tax, total_amount, tip_amount, status, line_items_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                  SQL
                end


              end
            end
            res.body = { success: true, job_id: job_id, status: new_status }.to_json
          elsif parts[1] == 'on_my_way'
            job_id = payload['job_id'].to_i
            eta = (payload['eta_minutes'] || 15).to_i
            job = @db.get_first_row("SELECT * FROM scheduled_jobs WHERE id = ?", job_id)
            if job
              unless ['Scheduled', 'En Route'].include?(job['status'])
                res.status = 409
                res.body = { error: 'Only scheduled jobs can be marked en route.' }.to_json
                return
              end
              tech = @db.get_first_row("SELECT * FROM technicians WHERE id = ?", job['technician_id'])
              tech_name = tech ? tech['name'] : "Demo Technician"
              truck_name = tech ? tech['truck_name'] : 'Demo vehicle'

              msg_text = "A team member is en route to your scheduled appointment (estimated arrival in #{eta} minutes). This is a prototype notification."

              @db.execute("UPDATE scheduled_jobs SET status = 'En Route' WHERE id = ?", job_id)

              contact = @db.get_first_row("SELECT * FROM contacts WHERE phone = ? OR address = ? LIMIT 1", job['phone'], job['address'])
              notification = contact ? @outreach.send_direct_reply(contact['id'], msg_text, 'SMS') : { success: false, error: 'No matching contact' }

              res.body = {
                success: true,
                job_id: job_id,
                status: 'En Route',
                technician: tech_name,
                truck: truck_name,
                eta_minutes: eta,
                message: msg_text,
                notification_status: notification[:status] || (notification[:success] ? 'simulated' : 'not_sent'),
                notification_error: notification[:success] ? nil : notification[:error]
              }.to_json
            else
              res.status = 404
              res.body = { error: 'Job not found' }.to_json
            end
          else
            cust = payload['customer_name'] || 'Customer'
            phone = payload['phone'] || ''
            addr = payload['address'] || ''
            city = payload['city'] || 'Demo City'
            date = payload['job_date'] || Time.now.strftime('%Y-%m-%d')
            time = payload['time_slot'] || '09:00 AM'
            normalized_slot = normalize_schedule_slot(date, time)
            unless normalized_slot
              res.status = 422
              res.body = { error: 'Use a valid ISO date and a time in h:mm AM/PM format.' }.to_json
              return
            end
            date, time = normalized_slot
            serv = payload['services'] || 'Demo service'
            amt = (payload['amount'] || 0.0).to_f
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
            city = payload['city'] || 'Demo City'
            neigh = payload['neighborhood'] || 'Demo neighborhood'
            owner = payload['homeowner_name'] || 'Homeowner'
            phone = payload['phone'] || ''
            email = payload['email'] || ''
            status = payload['status'] || 'Interested'
            stories = (payload['stories'] || 2).to_i
            panes = (payload['panes_estimate'] || 30).to_i
            serv = payload['services'] || 'Demo service'
            amt = (payload['quote_amount'] || 0.0).to_f
            notes = payload['notes'] || ''

            scheduled_job_id = nil
            if status == 'Booked on Spot' && payload['job_date'] && !payload['job_date'].empty?
              date = payload['job_date']
              time = payload['time_slot'] || '10:00 AM'
              normalized_slot = normalize_schedule_slot(date, time)
              unless normalized_slot
                res.status = 422
                res.body = { error: 'Use a valid ISO date and a time in h:mm AM/PM format.' }.to_json
                return
              end
              date, time = normalized_slot
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
                followup = "Thank you for speaking with our team. A team member can follow up with current information. This message does not confirm a price, appointment, or service term."
                followup_result = @outreach.send_direct_reply(contact['id'], followup, 'Email')
              end
            end
            res.body = { success: true, message: 'Call logged', followup_status: (followup_result && (followup_result[:status] || (followup_result[:success] ? 'simulated' : 'not_sent'))) }.to_json
          elsif parts[1] == 'dispatch_voice_agent'
            res.status = 501
            res.body = { success: false, error: 'Outbound voice calling is not implemented in this prototype.' }.to_json
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
            city = payload['city'] || 'Demo City'
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
            method = payload['payment_method'] || 'Manual confirmation'
            inv = @db.get_first_row("SELECT * FROM invoices WHERE id = ?", inv_id)
            if inv
              if inv['status'] == 'Paid'
                res.status = 409
                res.body = { error: 'Invoice is already recorded as paid.' }.to_json
                return
              end
              unless payload['confirm_received'] == true && tip >= 0 && ['Cash', 'Check', 'Bank Transfer', 'Manual confirmation'].include?(method)
                res.status = 422
                res.body = { error: 'Record a received manual payment with a supported method. Online payment processing is not configured.' }.to_json
                return
              end
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
          res.status = 503
          res.body = { error: 'Estimate calculation and booking are disabled pending review of prices and service claims.' }.to_json
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
              # A call outcome is a note; it does not establish a booking or
              # change a contact's workflow state.
            end

            res.body = { success: true, message: 'Call note logged; contact status unchanged', outcome: outcome }.to_json
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
        warn "[API POST] #{e.class}: #{e.message}"
        if defined?(SQLite3::ConstraintException) && e.is_a?(SQLite3::ConstraintException)
          res.status = 409
          res.body = { error: 'The requested resource conflicts with an existing record.' }.to_json
        else
          res.status = 500
          res.body = { error: 'Request failed' }.to_json
        end
      end

      private

      def cors_origin_allowed?(req)
        origin = req['Origin']
        origin && @allowed_origins.include?(origin)
      end

      def add_cors(req, res)
        return unless cors_origin_allowed?(req)
        res['Access-Control-Allow-Origin'] = req['Origin']
        res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        res['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Twilio-Signature'
        res['Access-Control-Max-Age'] = '600'
        res['Vary'] = 'Origin'
      end

      def public_request?(req)
        return false unless public_intake_enabled?
        return true if req.request_method == 'POST' && req.path == '/api/webhook'
        req.request_method == 'POST' && req.path == '/api/sms/inbound' && valid_twilio_signature?(req)
      end

      def public_write_request?(req)
        return false unless public_intake_enabled?
        req.request_method == 'POST' && ['/api/webhook', '/api/sms/inbound'].include?(req.path)
      end

      def public_intake_enabled?
        ENV['APEX_ENABLE_PUBLIC_INTAKE'] == 'true'
      end

      def admin_authenticated?(req)
        supplied = req['Authorization'].to_s.sub(/^Bearer\s+/i, '')
        return false if supplied.empty?
        expected_hash = Digest::SHA256.hexdigest(@admin_token)
        supplied_hash = Digest::SHA256.hexdigest(supplied)
        OpenSSL.fixed_length_secure_compare(expected_hash, supplied_hash)
      rescue ArgumentError
        false
      end

      def rate_limited?(req)
        now = Time.now.to_i
        key = req.peeraddr[3].to_s
        @rate_limit_mutex.synchronize do
          @rate_limit[key].reject! { |stamp| stamp < now - 60 }
          return true if @rate_limit[key].length >= 10
          @rate_limit[key] << now
          false
        end
      end

      def valid_twilio_signature?(req)
        auth_token = ENV['TWILIO_AUTH_TOKEN'].to_s
        public_base = ENV['APEX_PUBLIC_BASE_URL'].to_s.sub(%r{/+$}, '')
        signature = req['X-Twilio-Signature'].to_s
        return false if auth_token.empty? || public_base.empty? || signature.empty?
        pairs = URI.decode_www_form(req.body.to_s).sort
        signature_input = public_base + req.request_uri.to_s.split('?').first + pairs.map { |key, value| key + value }.join
        expected = Base64.strict_encode64(OpenSSL::HMAC.digest('sha1', auth_token, signature_input))
        OpenSSL.fixed_length_secure_compare(Digest::SHA256.hexdigest(expected), Digest::SHA256.hexdigest(signature))
      rescue ArgumentError, URI::InvalidURIError
        false
      end

      def parse_json(body)
        return {} if body.nil? || body.strip.empty?
        JSON.parse(body)
      rescue
        {}
      end

      def normalize_schedule_slot(date, time_slot)
        parsed_date = Date.iso8601(date.to_s)
        parsed_time = Time.strptime(time_slot.to_s.strip.upcase, '%I:%M %p')
        [parsed_date.strftime('%Y-%m-%d'), parsed_time.strftime('%I:%M %p')]
      rescue ArgumentError, TypeError
        nil
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
        report[:battlecards] = []
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
        settings = @outreach.get_settings.reject { |key, _value| ['smtp_password', 'twilio_auth_token', 'sendgrid_api_key'].include?(key) }
        settings['live_messaging_enabled'] = ENV['APEX_ENABLE_LIVE_MESSAGING'] == 'true'
        settings['smtp_secret_configured'] = !ENV['SMTP_PASSWORD'].to_s.empty?
        settings['twilio_secret_configured'] = !ENV['TWILIO_AUTH_TOKEN'].to_s.empty?
        settings['sendgrid_secret_configured'] = !ENV['SENDGRID_API_KEY'].to_s.empty?
        settings['ai_autopilot_enabled'] = 'false'
        res.body = settings.to_json
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

      def handle_estimates(_req, res)
        res.status = 503
        res.body = { error: 'Estimate records are unavailable while price and service claims are reviewed.' }.to_json
      end
      def handle_nearby_route(_req, res)
        res.status = 503
        res.body = { error: 'Route recommendations are disabled until service-area and discount claims are verified.' }.to_json
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
              fleet_purity: rows.empty? ? nil : rows.map { |r| r['outflow_ppm'].to_f }.sum / rows.size,
              inflow_avg: rows.empty? ? nil : (rows.map { |r| r['inflow_ppm'].to_f }.sum / rows.size).round(1),
              total_gallons_purified: total_purified.round(1),
              source_mode: 'simulated',
              status: "SIMULATED DEMO DATA — NOT LIVE HARDWARE"
            }
          }.to_json
        elsif parts[1] == 'certificate'
          cert_id = (parts[2] && !parts[2].empty?) ? parts[2] : (req.query && (req.query['cert'] || req.query['id']))
          if cert_id && !cert_id.to_s.strip.empty?
            c_str = cert_id.to_s.strip.force_encoding('UTF-8')
            cert = @db.get_first_row("SELECT * FROM clarity_certificates WHERE cert_number = ?", c_str)
            if cert
              res.body = { success: true, certificate: clean_row(cert) }.to_json
            else
              res.status = 404
              res.body = { error: 'Certificate not found', queried: c_str }.to_json
            end
          else
            res.status = 400
            res.body = { error: 'A certificate number is required.' }.to_json
          end
        else
          res.status = 404
          res.body = { error: 'Unknown IoT endpoint' }.to_json
        end
      end

      def handle_iot_post(_req, res, parts, _payload)
        action = parts[1]
        if ['generate_certificate', 'update_telemetry'].include?(action)
          res.status = 503
          res.body = { error: 'Telemetry updates and certificate generation are disabled until field provenance is verified.' }.to_json
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
