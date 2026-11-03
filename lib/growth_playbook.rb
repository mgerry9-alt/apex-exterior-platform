module ExteriorOutreach
  class GrowthPlaybook
    PLAYBOOKS = [
      {
        id: 1,
        category: 'Luxury Lakeside Niche',
        badge_color: '#8b5cf6',
        title: 'The Lake Minnetonka Spider & Water Spot Shield',
        hook: 'Lakeside homes suffer 3x more spider webs and hard water lake spray spots than inland homes.',
        description: 'Combine 0 PPM pure deionized water window detailing with an eco-safe botanical peppermint/citrus spider-deterrent treatment around eaves and soffits.',
        blueprint: [
          '1. Target homes within 500 meters of Lake Minnetonka, Prior Lake, and White Bear Lake.',
          '2. Clean exterior glass with 0 PPM Pure DI water (dissolves lake spray mineral haze).',
          '3. Apply a pet-safe, organic botanical web-shield barrier around window frames and upper eaves.',
          '4. Offer a 90-day Spider-Free Eaves Guarantee.'
        ].join("\n"),
        script_template: "Hi {{first_name}}, lakeside windows around {{city}} get hit twice as hard by lake midges and spider webs under eaves. Gerry's Window Services provides our Lake Estate Protection Package: spotless 0 PPM pure DI water glass cleaning plus a pet-safe botanical spider-deterrent around your roofline. Would you like a quick quote for {{address}}?",
        metric_impact: '+$350 Average Order Value ($650 – $1,200/job) • 85% Annual Retention',
        difficulty: 'Easy',
        status: 'Ready'
      },
      {
        id: 2,
        category: 'Route Density Hack',
        badge_color: '#3b82f6',
        title: 'The Cul-de-Sac Golden Ticket ($50 Neighbor Pass)',
        hook: 'The highest cost in exterior cleaning is truck drive time between jobs. Eliminate drive time by clustering.',
        description: 'Whenever a truck is booked on a street, drop a personalized Golden Ticket or text the 5 adjacent neighbors offering to waive the $95 truck rollout fee.',
        blueprint: [
          '1. When Truck 1 is dispatched to #3400 Bushaway Rd, grab the 5 adjacent neighbor addresses.',
          '2. Send SMS / door drop: "We are already on your street with our pure DI water rig this Thursday."',
          '3. Waive the $95 truck trip fee and offer a flat $199 exterior window cleaning special.',
          '4. Stack 3-4 homes on the exact same block in a single 4-hour window.'
        ].join("\n"),
        script_template: "Hi {{first_name}}! Our Gerry's Window Services pure DI water truck is on your block near {{address}} this Thursday. While our water purification tank is already running, we are waiving our $95 trip fee for the next 5 neighbors ($199 flat exterior clean). Would morning or afternoon work best?",
        metric_impact: 'Turns a single $450 job into a $1,250 cluster with 0 extra driving time',
        difficulty: 'Easy',
        status: 'Ready'
      },
      {
        id: 3,
        category: 'Realtor Referral Engine',
        badge_color: '#f59e0b',
        title: 'The Realtor 48-Hour Escrow Emergency Rush Guarantee',
        hook: 'Zillow data proves clean windows and curb appeal boost photo click-through rates by up to 34%.',
        description: 'Partner with top 50 local real estate listing agents in Edina, Wayzata, and Minnetonka with a guaranteed 24-48h rush turnaround before MLS listing photos.',
        blueprint: [
          '1. Email top luxury listing agents with the Escrow Emergency Guarantee.',
          '2. Guarantee arrival within 48 hours of photo shoot.',
          '3. Allow payment at closing escrow or give 15% VIP discount directly to the seller.',
          '4. Leave branded Gerry\'s Window Services referral cards on the kitchen counter for the buyer!'
        ].join("\n"),
        script_template: "Hi {{first_name}}, dirty exterior glass and stained walkways hurt photo click-through rates on Zillow by up to 34%. Gerry's Window Services provides an exclusive 48-Hour Pre-Photo Curb Appeal Guarantee for your upcoming listings. We can bill escrow at closing or offer your seller a 15% VIP discount for {{address}}. May I send you a 1-page agent overview?",
        metric_impact: '1 Partner Agent = 8 to 15 recurring listings per year ($6,000+ LTV)',
        difficulty: 'Medium',
        status: 'Ready'
      },
      {
        id: 4,
        category: 'Commercial Retainer',
        badge_color: '#10b981',
        title: 'Clean-While-You-Sleep (5:00 AM Storefront Retainer)',
        hook: 'Retailers hate window cleaners interrupting their morning customers and shoppers.',
        description: 'Provide an automated 5:00 AM after-hours storefront cleaning route for high-end boutique retail, cafes, and auto showrooms before doors open.',
        blueprint: [
          '1. Target boutique retail strips along Wayzata Blvd, Galleria Edina, and West End.',
          '2. Clean exterior glass silently at 5:00 AM using carbon-fiber water-fed poles.',
          '3. Snap a timestamped photo of sparkling glass and email confirmation.',
          '4. Bill a seamless recurring $120 - $220/month autopay subscription.'
        ].join("\n"),
        script_template: "Dear {{first_name}}, dirty fingerprints and street splash on storefront glass hurt customer first impressions before they walk in. Gerry's Window Services provides early-morning 5:00 AM route cleaning before your doors open—zero customer or staff disruption. Can we stop by {{address}} for a quick 60-second walkthrough estimate?",
        metric_impact: '25 recurring storefronts = $3,500/month recurring predictable revenue',
        difficulty: 'Medium',
        status: 'Ready'
      },
      {
        id: 5,
        category: 'Canvass Psychology',
        badge_color: '#ec4899',
        title: 'The 0 PPM Pure Water TDS Demo (The Glass Vial Test)',
        hook: 'Homeowners do not understand why cheap handymen leave streaks until you show them the science.',
        description: 'Equip D2D reps with two glass vials and a digital TDS meter demonstrating 320 PPM tap water minerals vs 0 PPM laboratory-grade pure deionized water.',
        blueprint: [
          '1. Canvasser knocks and holds up two small sealed glass test tubes.',
          '2. Tube A contains municipal tap water (320 PPM mineral salts).',
          '3. Tube B contains Gerry\'s 0 PPM pure DI water.',
          '4. Demonstrate how pure water evaporates 100% streak-free with zero water spots.'
        ].join("\n"),
        script_template: "Most window cleaners spray city tap water that contains over 300 parts per million of limestone and calcium—that is what causes those white spots when it dries! Our Gerry's Window Services rig uses multi-stage deionization to strip water to 0 PPM. It dries 100% spotless without squeegees or harsh detergents.",
        metric_impact: '+55% doorstep close rate • Eliminates competitor price shopping',
        difficulty: 'Easy',
        status: 'Ready'
      },
      {
        id: 6,
        category: 'Customer Retention',
        badge_color: '#06b6d4',
        title: 'The Post-Rain Spot-Free Warranty (Storm Chaser Check)',
        hook: 'Homeowners believe rain ruins clean windows. Proactively proving them wrong creates lifelong loyalty.',
        description: 'Automated SMS sent 24 hours after major Twin Cities rain storms reminding clients that pure DI water does not spot in rain, backed by a free touchup warranty.',
        blueprint: [
          '1. System detects or triggers outreach 24 hours after a Minnesota rain storm.',
          '2. Text recent clients: "Rain doesn\'t spot pure water cleaned glass—detergent residue does."',
          '3. If they spot even a single drop, offer a 100% free spot touchup.',
          '4. Generates flood of 5-star Google reviews and zero churn.'
        ].join("\n"),
        script_template: "Hi {{first_name}}, yesterday's Minnesota storm rolled through! With our 0 PPM pure DI water cleaning, rain dries completely streak-free because there is zero detergent residue on the glass. If you notice any spots at {{address}}, reply RAIN and we will touch it up 100% free under our Spot-Free Warranty!",
        metric_impact: 'Boosts 5-Star Google Reviews by +300% • 0% seasonal churn',
        difficulty: 'Easy',
        status: 'Ready'
      },
      {
        id: 7,
        category: 'Eco Add-On Service',
        badge_color: '#eab308',
        title: 'Solar Array kW Output Recovery Add-On',
        hook: 'Dust, pollen, and bird droppings cut solar generation by up to 22%. Tap water voids solar warranties.',
        description: 'Offer a $149 pure DI water solar panel wash bundled with window cleaning. Pure DI water is the only manufacturer-approved solar wash method.',
        blueprint: [
          '1. Identify homes with rooftop solar arrays via satellite or D2D scouting.',
          '2. Educate homeowner: Tap water creates mineral scaling that ruins anti-reflective glass.',
          '3. Wash panels with 0 PPM deionized water using non-abrasive soft nylon brushes.',
          '4. Restores 15-22% energy production in 20 minutes of technician labor.'
        ].join("\n"),
        script_template: "Hi {{first_name}}, did you know dirty pollen and road dust cut your solar panel energy output by up to 20%? Tap water voids solar panel warranties due to mineral etching. We use manufacturer-approved 0 PPM pure deionized water to restore peak kW output. Add it to your window clean at {{address}} for only $149!",
        metric_impact: '+$149 pure gross margin in 20 minutes of technician time',
        difficulty: 'Easy',
        status: 'Ready'
      },
      {
        id: 8,
        category: 'Commercial B2B Growth',
        badge_color: '#6366f1',
        title: 'The HOA Board Spring Slip-Hazard Walkthrough Audit',
        hook: 'Property managers are terrified of slip-and-fall lawsuits on green algae walkways and pool decks.',
        description: 'Provide an executive 2-page Exterior Safety Photo Audit for their upcoming board meeting packet with pre-budgeted line-item pricing.',
        blueprint: [
          '1. Target Association Management Companies (Associa, FirstService, Cedar Management).',
          '2. Walk property and photograph slippery algae near clubhouse pool, ramps, and stained gutters.',
          '3. Package photos into a clean board-ready safety memo.',
          '4. Board approves the work without putting it out for competitive bids.'
        ].join("\n"),
        script_template: "Dear {{first_name}}, slippery green algae on community pool decks and sidewalks create substantial liability for HOA boards. Gerry's Window Services provides a complimentary 10-minute Exterior Safety Photo Audit for your upcoming board packet for {{address}}. May we stop by this week to document your common areas?",
        metric_impact: 'Secures $2,500 – $6,500 commercial HOA contracts with zero competitive bidding',
        difficulty: 'Medium',
        status: 'Ready'
      }
    ].freeze

    def self.seed_ideas(db)
      count = db.get_first_row("SELECT COUNT(*) as count FROM growth_ideas")['count'] || 0
      return if count > 0

      sql = <<-SQL
        INSERT INTO growth_ideas (id, category, title, hook, description, blueprint, script_template, metric_impact, difficulty, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      SQL

      PLAYBOOKS.each do |p|
        db.execute(sql, p[:id], p[:category], p[:title], p[:hook], p[:description], p[:blueprint], p[:script_template], p[:metric_impact], p[:difficulty], p[:status])
      end
    end

    def self.seed_franchise_campaigns(db)
      c5_check = db.get_first_row("SELECT COUNT(*) as count FROM campaigns WHERE name LIKE '%Review%Referral%'")['count'] || 0
      if c5_check == 0
        camp_sql = "INSERT INTO campaigns (name, description, channel, target_audience, status) VALUES (?, ?, ?, ?, ?)"
        step_sql = "INSERT INTO campaign_steps (campaign_id, step_order, channel, delay_hours, subject, body_template) VALUES (?, ?, ?, ?, ?, ?)"

        # Franchise Campaign 5: Post-Job 5-Star Review & Referral Multiplier
        db.execute(camp_sql, 'Franchise 5-Star Review & Referral Multiplier', 'Automated post-service cadence triggered when technician marks job Completed. Replicates Shack Shine & Window Genie 5-star review loops.', 'Omnichannel', 'Completed Service Clients', 'Active')
        c5_id = db.last_insert_row_id

        db.execute(step_sql, c5_id, 1, 'SMS', 2, nil, "Hi {{first_name}}, this is Mason from Gerry's Window Services! Our crew just finished detailing the glass at {{address}}. Does everything look sparkling clean and streak-free? If so, could you tap here to leave a quick 5-star Google review: {{company_website}}? It helps our local crew immensely!{{opt_out_footer}}")
        db.execute(step_sql, c5_id, 2, 'Email', 24, "Your digital service receipt & $50 neighbor reward | Gerry's Window Services", "Hi {{first_name}},\n\nThank you for choosing Gerry's Window Services for your property at {{address}}!\n\nAttached is your digital work order summary. Also, if your neighbors ask how your windows look so clear, hand them your neighbor code: 'GERRY50' for $50 off their first clean. As a thank-you, we'll send you a $50 gift card for every neighbor who books!\n\nBest,\nMason Gerry\n(612) 666-7720\nhttps://gerryswindows.com")

        # Franchise Campaign 6: 6-Month Window Care Reactivation Engine
        db.execute(camp_sql, '6-Month Window Care Routine Reactivation', 'Automated recurring maintenance drip inspired by Window Genie Window Care Program. Re-engages past clients at the 180-day mark with VIP rates.', 'Omnichannel', 'Dormant Past Clients (6 Months)', 'Active')
        c6_id = db.last_insert_row_id

        db.execute(step_sql, c6_id, 1, 'SMS', 0, nil, "Hi {{first_name}}, it has been 6 months since our pure DI water wash at {{address}}! Twin Cities pollen and dust are building up. We are reserving 15% VIP discount slots for past clients next week. Reply WINDOW to lock in your date!{{opt_out_footer}}")
        db.execute(step_sql, c6_id, 2, 'Email', 48, 'Priority 6-Month Window Care Reservation for {{address}}', "Hi {{first_name}},\n\nRoutine seasonal window detailing prevents mineral etching and keeps glass spotless year-round without harsh scraping.\n\nAs an existing client, your maintenance rate for {{address}} is locked in at ${{quote_amount}} (includes 0 PPM pure DI water wash + screen detailing).\n\nReply directly to this email or call (612) 666-7720 to reserve your preferred arrival window before our seasonal calendar fills!\n\nWarm regards,\nMason Gerry\nGerry's Window Services")
      end
    end
  end
end
