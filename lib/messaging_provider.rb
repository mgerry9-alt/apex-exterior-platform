require 'net/http'
require 'uri'
require 'json'

module ExteriorOutreach
  class MessagingProvider
    def self.send_sms(to:, body:, settings: {})
      return simulate_sms(to, body) unless ENV['APEX_ENABLE_LIVE_MESSAGING'] == 'true'

      twilio_sid = ENV['TWILIO_ACCOUNT_SID']
      twilio_auth = ENV['TWILIO_AUTH_TOKEN']
      twilio_from = ENV['TWILIO_PHONE_NUMBER']

      if twilio_sid && !twilio_sid.empty? && twilio_auth && !twilio_auth.empty? && twilio_from && !twilio_from.empty?
        send_twilio_sms(to, twilio_from, body, twilio_sid, twilio_auth)
      else
        simulate_sms(to, body)
      end
    end

    def self.send_email(to:, subject:, body_html:, body_text:, settings: {})
      return simulate_email(to, settings['company_email'] || 'no-reply@example.invalid', subject, body_text) unless ENV['APEX_ENABLE_LIVE_MESSAGING'] == 'true'

      sendgrid_key = ENV['SENDGRID_API_KEY']
      smtp_host = settings['smtp_host'] || ENV['SMTP_HOST']
      from_email = settings['company_email'].to_s.strip
      from_name = settings['company_name'].to_s.strip
      from_email = 'no-reply@example.invalid' if from_email.empty?
      from_name = 'Apex Exterior Demo' if from_name.empty?

      if smtp_host && !smtp_host.empty? && ENV['SMTP_PASSWORD'] && !ENV['SMTP_PASSWORD'].empty?
        send_smtp_email(to, from_email, from_name, subject, body_html, body_text, settings)
      elsif sendgrid_key && !sendgrid_key.empty?
        send_sendgrid_email(to, from_email, from_name, subject, body_html, body_text, sendgrid_key)
      else
        simulate_email(to, from_email, subject, body_text)
      end
    end

    private

    def self.send_twilio_sms(to, from, body, sid, token)
      uri = URI.parse("https://api.twilio.com/2010-04-01/Accounts/#{sid}/Messages.json")
      req = Net::HTTP::Post.new(uri)
      req.basic_auth(sid, token)
      req.set_form_data('To' => to, 'From' => from, 'Body' => body)

      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
        http.request(req)
      end

      if res.code.to_i.between?(200, 299)
        parsed = JSON.parse(res.body) rescue {}
        { success: true, provider: 'twilio', id: parsed['sid'], status: 'sent' }
      else
        { success: false, provider: 'twilio', error: res.body, status: 'failed' }
      end
    rescue => e
      { success: false, provider: 'twilio', error: e.message, status: 'failed' }
    end

    def self.send_sendgrid_email(to, from_email, from_name, subject, html, text, api_key)
      uri = URI.parse("https://api.sendgrid.com/v3/mail/send")
      req = Net::HTTP::Post.new(uri)
      req['Authorization'] = "Bearer #{api_key}"
      req['Content-Type'] = 'application/json'
      payload = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from_email, name: from_name },
        subject: subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html }
        ]
      }
      req.body = payload.to_json

      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
        http.request(req)
      end

      if res.code.to_i.between?(200, 299)
        { success: true, provider: 'sendgrid', status: 'sent' }
      else
        { success: false, provider: 'sendgrid', error: res.body, status: 'failed' }
      end
    rescue => e
      { success: false, provider: 'sendgrid', error: e.message, status: 'failed' }
    end

    def self.send_smtp_email(to, from_email, from_name, subject, html, text, settings)
      host = settings['smtp_host']
      port = (settings['smtp_port'] || 587).to_i
      user = settings['smtp_user'] || from_email
      pass = ENV['SMTP_PASSWORD']
      marker = "BOUNDARY_GERRYS_WINDOWS_#{Time.now.to_i}"

      clean_name = from_name.gsub('"', '')
      msg = <<~EOF
        From: "#{clean_name}" <#{from_email}>
        Reply-To: "#{clean_name}" <#{from_email}>
        To: #{to}
        Subject: #{subject}
        MIME-Version: 1.0
        Content-Type: multipart/alternative; boundary=#{marker}

        --#{marker}
        Content-Type: text/plain; charset=utf-8

        #{text}
        --#{marker}
        Content-Type: text/html; charset=utf-8

        #{html}
        --#{marker}--
      EOF

      require 'net/smtp'
      smtp = Net::SMTP.new(host, port)
      smtp.enable_starttls_auto if port == 587
      smtp.enable_tls if port == 465
      begin
        smtp.start(host, user, pass, :login) do |s|
          s.send_message(msg, from_email, to)
        end
      rescue => auth_err
        smtp.start(host, user, pass, :plain) do |s|
          s.send_message(msg, from_email, to)
        end
      end
      { success: true, provider: 'smtp', status: 'sent' }
    rescue => e
      { success: false, provider: 'smtp', error: e.message, status: 'failed' }
    end

    def self.simulate_sms(to, body)
      {
        success: true,
        provider: 'simulator',
        id: "sim_sms_#{Time.now.to_i}_#{rand(1000..9999)}",
        status: 'simulated',
        delivered_at: Time.now.strftime('%Y-%m-%d %H:%M:%S'),
        note: 'Simulated carrier delivery via local outreach gateway'
      }
    end

    def self.simulate_email(to, from, subject, body)
      {
        success: true,
        provider: 'simulator',
        id: "sim_eml_#{Time.now.to_i}_#{rand(1000..9999)}",
        status: 'simulated',
        delivered_at: Time.now.strftime('%Y-%m-%d %H:%M:%S'),
        note: 'Simulated inbox delivery via local outreach gateway'
      }
    end
  end
end
