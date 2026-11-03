require_relative 'research_engine'

module ExteriorOutreach
  class SeedData
    def self.seed(db)
      puts "[SeedData] Initializing production business settings..."
      settings = {
        'company_name' => "Gerry's Window Services",
        'company_phone' => '(612) 666-7720',
        'company_email' => 'masongerry991@gmail.com',
        'company_website' => 'https://gerryswindows.com',
        'smtp_host' => 'smtp-relay.brevo.com',
        'smtp_port' => '587',
        'smtp_user' => 'bd52ae001@smtp-brevo.com',
        'smtp_password' => 'xsmtpsib-74faa5afed0b2f32aa2795e6b4ba82ab95f2b8a0bf7b4b78c749933390ee91e6-sAS14WBzcxH8ZRdV',
        'smtp_from' => 'masongerry991@gmail.com',
        'lead_technician' => 'Mason Gerry',
        'quiet_hours_enabled' => 'true',
        'quiet_hours_start' => '20:00',
        'quiet_hours_end' => '08:00',
        'twilio_account_sid' => '',
        'twilio_auth_token' => '',
        'twilio_phone_number' => '',
        'sendgrid_api_key' => '',
        'auto_suggest_rebuttals' => 'true'
      }

      settings.each do |k, v|
        db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", k, v)
      end

      camp_count = db.get_first_row("SELECT COUNT(*) as count FROM campaigns WHERE name = 'Speed-to-Lead Instant Quote Follow-Up'")['count'] || 0
      if camp_count == 0
        puts "[SeedData] Seeding high-converting campaigns for Gerry's Window Services..."
        camp_sql = "INSERT INTO campaigns (name, description, channel, target_audience, status) VALUES (?, ?, ?, ?, ?)"
        step_sql = "INSERT INTO campaign_steps (campaign_id, step_order, channel, delay_hours, subject, body_template) VALUES (?, ?, ?, ?, ?, ?)"

        # Campaign 1: Speed-to-Lead Instant Quote Follow-Up
        db.execute(camp_sql, 'Speed-to-Lead Instant Quote Follow-Up', 'Rapid multi-channel sequence triggered immediately after a homeowner submits an estimate request. Combines fast SMS engagement with rich visual email quotes.', 'Omnichannel', 'New Estimate Leads', 'Active')
        c1_id = db.last_insert_row_id

        c1_step1 = "Hi {{first_name}}, this is Mason from Gerry's Window Services! Received your quote request for {{service_interest}} at {{address}}. To lock in an exact price, could you snap a quick photo of the area, or is it okay if we use aerial satellite imagery?{{opt_out_footer}}"
        db.execute(step_sql, c1_id, 1, 'SMS', 0, nil, c1_step1)

        c1_step2 = "Hi {{first_name}},\n\nThank you for requesting an exterior cleaning quote for your property at {{address}}.\n\nBased on your window count and property specs, your comprehensive estimate for {{service_interest}} is {{quote_amount}}.\n\nHere is what is included in our signature service:\n• 100% Spotless 0 PPM Pure DI Water Wash: Zero mineral spots, pristine glass, and detailed frames.\n• Dedicated Low-Pressure SoftWash & Window Glass detailing: No high pressure on siding or stucco—zero risk of water intrusion.\n• Plant & Landscaping Protection: Pre-hydrated shrubs and eco-safe botanical wash.\n• $2,000,000 General Liability Insurance for complete peace of mind.\n\nIf you have any questions or would like to lock in our truck while we are on your street in {{city}}, simply reply to this email or call/text Mason directly at {{company_phone}}."
        db.execute(step_sql, c1_id, 2, 'Email', 4, "Your Customized Exterior Estimate for {{address}} | Gerry's Window Services", c1_step2)

        c1_step3 = "Hey {{first_name}}, Mason here from Gerry's Window Services! Our Pure DI water rig truck is scheduled near {{address}} this week. If we add you to that neighborhood route, I can take $40 off your quote plus include complimentary front entry glass detailing. Would this week work?{{opt_out_footer}}"
        db.execute(step_sql, c1_id, 3, 'SMS', 48, nil, c1_step3)

        c1_step4 = "Hi {{first_name}},\n\nJust checking in regarding your exterior cleaning estimate for {{address}}.\n\nWe are finalizing our upcoming Twin Cities schedule and wanted to make sure you had all the information needed. If you would prefer to hold off or have questions regarding screens, hard-to-reach glass, or scheduling, please let us know!\n\nYou can reply directly or call Mason at {{company_phone}} anytime. Have a wonderful week!"
        db.execute(step_sql, c1_id, 4, 'Email', 96, 'Courtesy check-in: Should we hold your exterior cleaning slot, {{first_name}}?', c1_step4)

        # Campaign 2: Spring Curb Appeal Revival
        db.execute(camp_sql, 'Spring Curb Appeal Revival', 'Re-engagement drip designed to reactivate past clients and cold prospects as pollen and winter grime clear up.', 'Omnichannel', 'Past Customers & Cold Leads', 'Active')
        c2_id = db.last_insert_row_id

        c2_step1 = "Hi {{first_name}}, spring sunshine is showing every water spot on exterior glass! Gerry's Window Services is reserving priority early-season wash slots. Reply YES to reserve your preferred weekend before our calendar fills up!{{opt_out_footer}}"
        db.execute(step_sql, c2_id, 1, 'SMS', 0, nil, c2_step1)

        c2_step2 = "Hi {{first_name}},\n\nWinter road salt, dirt, and spring pollen quickly cloud exterior windows and dull siding.\n\nFor the next 14 days, we are offering our VIP Spring Curb Appeal Bundle:\n1. 100% Spotless 0 PPM Pure DI Window Cleaning (Exterior & Sills)\n2. Interior Hand Detailing & Track Vacuuming\n3. Screen Scrub & Protectant\n\nAs a valued homeowner at {{address}}, claim an automatic $50 early-bird route discount.\n\nReply to this email or call {{company_phone}} to book your preferred day!"
        db.execute(step_sql, c2_id, 2, 'Email', 72, 'Early Bird Spring Exterior Package: Save $50 this month at {{address}}', c2_step2)

        # Campaign 3: Fall Gutter Armor & Glass Polish
        db.execute(camp_sql, 'Fall Gutter Armor & Glass Polish', 'Urgency-driven campaign focusing on leaf buildup, clogged downspouts, and clean glass before winter freeze.', 'Omnichannel', 'Wooded Neighborhoods & Twin Cities Metro', 'Active')
        c3_id = db.last_insert_row_id

        c3_step1 = "Gerry's Window Services Alert: Clogged gutters cause heavy freeze damage & ice dams once Minnesota winter hits. We are clearing gutters and detailing windows near {{address}} next week. Reply WINDOW for a quick flat quote!{{opt_out_footer}}"
        db.execute(step_sql, c3_id, 1, 'SMS', 0, nil, c3_step1)

        c3_step2 = "Hi {{first_name}},\n\nDid you know that overflowing gutters are the #1 cause of roof leaks and ice dams during Minnesota winters?\n\nOur 5-Star Fall Protection Service includes:\n• Complete hand and vacuum extraction of all gutter debris\n• High-flow downspout flushing & underground drain test\n• Spotless Pure DI exterior window cleaning\n\nProtect {{address}} before the heavy seasonal freezes. Reply here to lock in your maintenance visit."
        db.execute(step_sql, c3_id, 2, 'Email', 48, 'Prevent costly winter freeze damage at {{address}}', c3_step2)

        # Campaign 4: Commercial & HOA Property Maintenance
        db.execute(camp_sql, 'Commercial & HOA Property Maintenance', 'B2B outreach directed at HOA board presidents, storefront owners, and property management firms across the Twin Cities.', 'Email', 'Commercial / HOA Managers', 'Active')
        c4_id = db.last_insert_row_id

        c4_step1 = "Dear {{first_name}},\n\nAre mineral stains on clubhouse glass or dirty common sidewalks impacting property value at {{address}}?\n\n{{company_name}} provides specialized pure-water window cleaning and exterior washing for townhome communities, HOA clubhouses, and retail centers throughout the Twin Cities metro.\n\nWe offer:\n• Spotless 0 PPM Pure Deionized Water Cleaning (up to 4 stories without lifts)\n• Plant-safe eco-neutralizing solutions\n• Full $2M liability insurance certificates naming your association as additionally insured\n\nMay we send over our commercial exterior portfolio or schedule a 10-minute on-site walkthrough?"
        db.execute(step_sql, c4_id, 1, 'Email', 0, 'Commercial Exterior Maintenance & Window Care - Gerry\'s Window Services', c4_step1)
      end

      puts "[SeedData] Ready for live production use with clean contacts and jobs."
    end
  end
end
