module ExteriorOutreach
  class SeedData
    # Keep fresh local installs free of customer records, credentials, and
    # pre-approved outreach. Operators must configure their own reviewed data.
    def self.seed(db)
      settings = {
        'company_name' => 'Apex Exterior Demo',
        'company_phone' => '',
        'company_email' => '',
        'company_website' => '',
        'smtp_host' => '',
        'smtp_port' => '587',
        'smtp_user' => '',
        'smtp_from' => '',
        'lead_technician' => '',
        'quiet_hours_enabled' => 'true',
        'quiet_hours_start' => '20:00',
        'quiet_hours_end' => '08:00',
        'twilio_account_sid' => '',
        'twilio_phone_number' => '',
        'ai_autopilot_enabled' => 'false',
        'auto_suggest_rebuttals' => 'true'
      }

      settings.each do |key, value|
        db.execute('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', key, value)
      end
    end
  end
end
