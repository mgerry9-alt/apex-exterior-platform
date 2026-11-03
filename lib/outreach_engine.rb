require 'time'
require_relative 'messaging_provider'
require_relative 'research_engine'

module ExteriorOutreach
  class OutreachEngine
    def initialize(db)
      @db = db
    end

    def get_settings
      rows = @db.execute("SELECT key, value FROM settings")
      rows.each_with_object({}) { |r, h| h[r['key']] = r['value'] }
    end

    # Checks if current time falls within compliant communication hours (8am - 8pm)
    def within_quiet_hours?
      now = Time.now
      start_hour = 8
      end_hour = 20 # 8:00 PM
      now.hour >= start_hour && now.hour < end_hour
    end

    # Enroll a contact into a campaign
    def enroll_contact(contact_id, campaign_id)
      @db.execute <<-SQL, campaign_id, contact_id, Time.now.strftime('%Y-%m-%d %H:%M:%S'), Time.now.strftime('%Y-%m-%d %H:%M:%S')
        INSERT OR REPLACE INTO campaign_enrollments (campaign_id, contact_id, current_step, status, enrolled_at, next_run_at)
        VALUES (?, ?, 1, 'Active', ?, ?);
      SQL
    end

    # Process pending drip sequence steps
    def process_pending_drips(force_bypass_quiet_hours = false)
      results = []
      settings = get_settings

      # Find active enrollments
      enrollments = @db.execute <<-SQL
        SELECT ce.*, c.first_name, c.last_name, c.phone, c.email, c.address, c.city,
               c.property_type, c.property_sqft, c.service_interest, c.quote_amount,
               c.opt_out_sms, c.opt_out_email, cmp.name as campaign_name, cmp.status as campaign_status
        FROM campaign_enrollments ce
        JOIN contacts c ON ce.contact_id = c.id
        JOIN campaigns cmp ON ce.campaign_id = cmp.id
        WHERE ce.status = 'Active' AND cmp.status = 'Active'
      SQL

      enrollments.each do |enr|
        # Fetch current step
        step = @db.get_first_row <<-SQL, enr['campaign_id'], enr['current_step']
          SELECT * FROM campaign_steps
          WHERE campaign_id = ? AND step_order = ?
          LIMIT 1
        SQL

        unless step
          # No more steps - campaign finished for this contact
          @db.execute("UPDATE campaign_enrollments SET status = 'Completed' WHERE id = ?", enr['id'])
          next
        end

        # Check opt-out
        if step['channel'] == 'SMS' && enr['opt_out_sms'] == 1
          @db.execute("UPDATE campaign_enrollments SET status = 'Skipped_OptOut' WHERE id = ?", enr['id'])
          results << { status: 'skipped', reason: 'Contact opted out of SMS', contact: enr['first_name'] }
          next
        end

        if step['channel'] == 'Email' && enr['opt_out_email'] == 1
          @db.execute("UPDATE campaign_enrollments SET status = 'Skipped_OptOut' WHERE id = ?", enr['id'])
          results << { status: 'skipped', reason: 'Contact opted out of Email', contact: enr['first_name'] }
          next
        end

        # TCPA Quiet Hours Check for SMS
        if step['channel'] == 'SMS' && !within_quiet_hours? && !force_bypass_quiet_hours
          results << { status: 'deferred', reason: 'Quiet hours active (Outside 8AM - 8PM)', contact: enr['first_name'] }
          next
        end

        # Render message content
        rendered_body = render_template(step['body_template'], enr, settings, step['channel'])
        rendered_subject = step['subject'] ? render_template(step['subject'], enr, settings, step['channel']) : nil

        # Dispatch message
        if step['channel'] == 'SMS'
          send_result = MessagingProvider.send_sms(
            to: enr['phone'],
            body: rendered_body,
            settings: settings
          )
        else
          html_body = format_email_html(rendered_body, settings, enr)
          send_result = MessagingProvider.send_email(
            to: enr['email'],
            subject: rendered_subject || "Exterior Care Update from #{settings['company_name'] || 'Apex Exterior'}",
            body_html: html_body,
            body_text: rendered_body,
            settings: settings
          )
        end

        # Log outbound message
        @db.execute <<-SQL, enr['contact_id'], enr['campaign_id'], step['id'], step['channel'], 'outbound', settings['company_phone'] || 'ApexExterior', enr['phone'] || enr['email'], rendered_subject, rendered_body, send_result[:status] || 'sent', Time.now.strftime('%Y-%m-%d %H:%M:%S')
          INSERT INTO messages (contact_id, campaign_id, step_id, channel, direction, sender, recipient, subject, body, status, sent_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        SQL

        # Advance enrollment
        next_step_num = enr['current_step'] + 1
        has_next = @db.get_first_row("SELECT id FROM campaign_steps WHERE campaign_id = ? AND step_order = ?", enr['campaign_id'], next_step_num)

        if has_next
          @db.execute <<-SQL, next_step_num, Time.now.strftime('%Y-%m-%d %H:%M:%S'), enr['id']
            UPDATE campaign_enrollments
            SET current_step = ?, last_sent_at = ?
            WHERE id = ?
          SQL
        else
          @db.execute <<-SQL, Time.now.strftime('%Y-%m-%d %H:%M:%S'), enr['id']
            UPDATE campaign_enrollments
            SET status = 'Completed', last_sent_at = ?
            WHERE id = ?
          SQL
        end

        results << {
          status: 'sent',
          channel: step['channel'],
          contact: "#{enr['first_name']} #{enr['last_name']}",
          campaign: enr['campaign_name'],
          step: step['step_order']
        }
      end

      results
    end

    # Handle incoming SMS or Email response
    def receive_inbound(sender_identifier, body, channel = 'SMS', manual_contact_id = nil)
      # Find contact
      contact = nil
      if manual_contact_id
        contact = @db.get_first_row("SELECT * FROM contacts WHERE id = ?", manual_contact_id)
      else
        if channel == 'SMS'
          contact = @db.get_first_row("SELECT * FROM contacts WHERE phone = ?", sender_identifier)
        else
          contact = @db.get_first_row("SELECT * FROM contacts WHERE email = ?", sender_identifier)
        end
      end

      unless contact
        # Create unassigned contact
        @db.execute <<-SQL, "Prospect", sender_identifier, channel == 'SMS' ? sender_identifier : '', channel == 'Email' ? sender_identifier : '', 'Inbound Lead'
          INSERT INTO contacts (first_name, last_name, phone, email, lead_source)
          VALUES (?, ?, ?, ?, ?);
        SQL
        contact = @db.get_first_row("SELECT * FROM contacts WHERE id = ?", @db.last_insert_row_id)
      end

      # Log message
      @db.execute <<-SQL, contact['id'], channel, 'inbound', sender_identifier, 'ApexExterior', "Re: Exterior Service", body, 'received', Time.now.strftime('%Y-%m-%d %H:%M:%S')
        INSERT INTO messages (contact_id, channel, direction, sender, recipient, subject, body, status, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      SQL
      message_id = @db.last_insert_row_id

      # Analyze through ResearchEngine
      analysis = ResearchEngine.analyze_response(body, contact)

      # Handle opt out compliance
      if analysis[:intent_category] == 'OPT_OUT'
        if channel == 'SMS'
          @db.execute("UPDATE contacts SET opt_out_sms = 1, status = 'Unsubscribed' WHERE id = ?", contact['id'])
        else
          @db.execute("UPDATE contacts SET opt_out_email = 1, status = 'Unsubscribed' WHERE id = ?", contact['id'])
        end
        # Pause any active campaign enrollments
        @db.execute("UPDATE campaign_enrollments SET status = 'Opted_Out' WHERE contact_id = ?", contact['id'])
      elsif analysis[:intent_category] == 'BOOKING_READY'
        @db.execute("UPDATE contacts SET status = 'Booked' WHERE id = ?", contact['id'])
      end

      # Store response research analysis
      @db.execute <<-SQL, message_id, contact['id'], body, channel, analysis[:sentiment], analysis[:sentiment_score], analysis[:intent_category], analysis[:objection_detail], analysis[:key_phrases].to_json, analysis[:recommended_reply], analysis[:conversion_outcome], Time.now.strftime('%Y-%m-%d %H:%M:%S')
        INSERT INTO responses (message_id, contact_id, inbound_text, channel, sentiment, sentiment_score, intent_category, objection_detail, key_phrases, recommended_reply, conversion_outcome, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      SQL
      response_id = @db.last_insert_row_id

      # Autonomous AI Auto-Pilot: If enabled, immediately dispatch recommended reply
      auto_replied = false
      settings = get_settings
      if settings['ai_autopilot_enabled'] == 'true' && analysis[:intent_category] != 'OPT_OUT' && analysis[:recommended_reply] && !analysis[:recommended_reply].strip.empty?
        reply_res = send_direct_reply(contact['id'], analysis[:recommended_reply], channel)
        auto_replied = true if reply_res[:success]
      end

      {
        message_id: message_id,
        response_id: response_id,
        contact_id: contact['id'],
        contact_name: "#{contact['first_name']} #{contact['last_name']}",
        channel: channel,
        analysis: analysis,
        auto_replied: auto_replied
      }
    end

    # Send a direct one-off reply to a contact
    def send_direct_reply(contact_id, body, channel = 'SMS')
      contact = @db.get_first_row("SELECT * FROM contacts WHERE id = ?", contact_id)
      return { success: false, error: 'Contact not found' } unless contact

      settings = get_settings

      if channel == 'SMS'
        res = MessagingProvider.send_sms(to: contact['phone'], body: body, settings: settings)
      else
        res = MessagingProvider.send_email(
          to: contact['email'],
          subject: "Re: Exterior Service Quote - #{settings['company_name'] || 'Apex Exterior'}",
          body_html: format_email_html(body, settings, contact),
          body_text: body,
          settings: settings
        )
      end

      @db.execute <<-SQL, contact['id'], channel, 'outbound', settings['company_phone'] || 'ApexExterior', contact['phone'] || contact['email'], "Outreach Message", body, 'sent', Time.now.strftime('%Y-%m-%d %H:%M:%S')
        INSERT INTO messages (contact_id, channel, direction, sender, recipient, subject, body, status, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      SQL

      { success: true, channel: channel, body: body }
    end

    private

    def render_template(template, contact, settings, channel)
      company_name = settings['company_name'] || 'Apex Exterior Services'
      phone = settings['company_phone'] || '(512) 894-2200'
      opt_out_footer = channel == 'SMS' ? "\n\nReply STOP to opt out." : "\n\nTo unsubscribe, reply UNSUBSCRIBE."

      quote_str = contact['quote_amount'] && contact['quote_amount'].to_f > 0 ? "$#{contact['quote_amount'].to_i}" : "$289"

      template
        .gsub('{{first_name}}', contact['first_name'].to_s)
        .gsub('{{last_name}}', contact['last_name'].to_s)
        .gsub('{{address}}', contact['address'].to_s)
        .gsub('{{city}}', contact['city'].to_s)
        .gsub('{{property_type}}', contact['property_type'].to_s)
        .gsub('{{service_interest}}', contact['service_interest'].to_s)
        .gsub('{{quote_amount}}', quote_str)
        .gsub('{{company_name}}', company_name)
        .gsub('{{company_phone}}', phone)
        .gsub('{{opt_out_footer}}', opt_out_footer)
    end

    def format_email_html(text, settings, contact)
      company = settings['company_name'] || 'Apex Exterior Services'
      phone = settings['company_phone'] || '(512) 894-2200'
      paragraphs = text.split("\n\n").map { |p| "<p style='margin: 0 0 14px 0; line-height: 1.6; color: #374151;'>#{p.gsub("\n", "<br/>")}</p>" }.join

      <<-HTML
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
            .header { background: #0f172a; padding: 24px; color: #ffffff; text-align: center; }
            .content { padding: 32px 24px; }
            .badge { display: inline-block; background: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
            .footer { background: #f9fafb; padding: 18px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
            .button { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700;">#{company}</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Professional Softwash & Exterior Property Care</p>
            </div>
            <div class="content">
              <div class="badge">Eco-Safe & Insured Property Specialists</div>
              #{paragraphs}
              <div style="text-align: center; margin-top: 24px;">
                <a href="#" class="button">View Interactive Quote & Availability</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 6px 0;">#{company} • #{phone} • Licensed & Insured ($2M Liability Coverage)</p>
              <p style="margin: 0;">100% Plant & Pet Safe Detergents • Zero-Pressure Softwash Guarantee</p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af;">To manage email preferences or unsubscribe, reply UNSUBSCRIBE.</p>
            </div>
          </div>
        </body>
        </html>
      HTML
    end
  end
end
