#!/usr/bin/env python3
"""
Update INVESTOR_SLIDES in public/js/app.js with:
- Continuous optimization: Squeegee to pure water filter
- B2C Consumer Experience focus
- Platform Data Engine & usage focus
- Denver Spring Launch Call-to-Action
- Minimalist, captivating HTML layouts with generous whitespace and restrained color
"""

import os
import re

NEW_SLIDES_JS = """const INVESTOR_SLIDES = [
  {
    num: 1,
    title: "GERRY'S WINDOW SERVICES",
    subtitle: "The 60-Second, Spot-Free Home Cleaning Experience",
    category: "IDEA & STORY OVERVIEW",
    speaker: "Mason Gerry (Founder & CEO)",
    targetTime: "0:30 (Cumulative: 0:30)",
    rubricTag: "Rubric: Idea/Story Overview (15 Points) • Target: < 30s Hook",
    html: `
      <div style="display:flex; flex-direction:column; gap:20px; height:100%;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">&lt; 60s</div>
            <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-top:6px;">Speed-to-Lead</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Instant automated mobile quote</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">WATER-FED</div>
            <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-top:6px;">Pure-Water Poles</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Zero ladder damage or soap film</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">100%</div>
            <div style="font-size:1.05rem; font-weight:700; color:#fff; margin-top:6px;">Spot-Free Clean</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">48-Hour Rain Shield Guarantee</div>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid rgba(56,189,248,0.3); border-radius:12px; padding:22px; flex:1;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">
            RE-ENGINEERING RESIDENTIAL WINDOW CLEANING FOR THE CONSUMER
          </div>
          <p style="font-size:1.05rem; color:#e2e8f0; line-height:1.6; margin:0 0 10px 0;">
            Born on an aluminum ladder in Wayzata, MN missing quote calls. We replaced slow callbacks with sub-60-second automated quotes and modernized cleaning with water-fed filtration poles.
          </p>
          <div style="font-size:0.85rem; color:#94a3b8;">
            📍 Live Proving Ground: Gerry's Window Services (Lake Minnetonka & Twin Cities Metro, MN)
          </div>
        </div>
      </div>
    `,
    script: `Last May, I was twenty-four feet in the air on an aluminum ladder in Wayzata, scraping a second-story picture window with municipal water from a customer's garden hose. My phone was vibrating non-stop in my pocket. <span class="pause-cue">[PAUSE]</span> By the time I climbed down two hours later, I had three missed calls from local homeowners wanting window cleaning quotes. When I called them back, two of them had already hired the competitor who answered their text in under two minutes, and the job I just finished dried with cloudy spots. That day, I realized home services are fundamentally broken for consumers. Homeowners are stuck waiting days for a quote, dealing with flaky contractors, and getting streaky windows. We built Gerry’s Window Services, powered by our APEX platform, to change that. We combine grounded AI with truck filtration systems to deliver an instant quote, self-booking in seconds, and laboratory-verified spot-free windows.`,
    transition: `Let’s look at why consumers are so frustrated with traditional services.`
  },
  {
    num: 2,
    title: "HOME SERVICES ARE BROKEN FOR CONSUMERS",
    subtitle: "Slow Callbacks, Zero Transparency, and Friction at Every Step",
    category: "THE CONSUMER PROBLEM",
    speaker: "Mason Gerry (Founder & Operations Lead)",
    targetTime: "0:40 (Cumulative: 1:10)",
    rubricTag: "Rubric: Problem & Research (20 Points) • N=45 Surveys & N=18 Interviews",
    html: `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:3.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">4.2 HOURS</div>
            <div style="font-size:1.15rem; font-weight:700; color:#fff; margin-top:8px;">Average Callback Delay</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Homeowners are stuck waiting while contractors work on ladders</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:3.5rem; font-weight:900; color:#38bdf8; font-family:monospace;">78%</div>
            <div style="font-size:1.15rem; font-weight:700; color:#fff; margin-top:8px;">Hire First Responder</div>
            <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Speed is the #1 deciding factor for residential homeowners</div>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid #1e293b; border-radius:12px; padding:22px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
            PRIMARY CONSUMER AUDIT (N = 45 HOMEOWNER SURVEYS | N = 18 IN-DEPTH INTERVIEWS)
          </div>
          <p style="font-size:1.1rem; color:#fff; font-style:italic; margin:0 0 10px 0; border-left:3px solid #38bdf8; padding-left:14px;">
            "I always hire whoever gives me a confirmed price first. I don't have time to wait 24 hours for three contractors to call me back."
            <span style="font-size:0.85rem; color:#94a3b8; font-style:normal; display:block; margin-top:4px;">— Lake Minnetonka Homeowner</span>
          </p>
          <div style="font-size:0.85rem; color:#94a3b8;">
            • Homeowners wait an average of 14 hours for traditional estimates • Win rates drop 3.9x after 30 minutes
          </div>
        </div>
      </div>
    `,
    script: `Let’s look at why consumers are frustrated. Across our primary research—including forty-five quantitative homeowner surveys and eighteen in-depth interviews across Lake Minnetonka and the Twin Cities—the single largest pain point is speed. <span class="pause-cue">[PAUSE]</span> Seventy-eight percent of homeowners hire the very first service company that delivers a confirmed price. Yet the industry average callback time is 4.2 hours. Why? Because solo contractors are physically on ladders, pressure washing driveways, or driving. If a homeowner doesn't get a response in thirty minutes, their frustration spikes, and probability of booking drops by nearly four times. Over sixty-four percent of surveyed homeowners told us: they don't want to play phone tag—they want an instant, transparent price on their phone.`,
    transition: `And the second major consumer frustration is the outdated cleaning process itself.`
  },
  {
    num: 3,
    title: "ALWAYS OPTIMIZING: SQUEEGEE TO FILTER",
    subtitle: "How Gerry’s Window Services Re-Engineered the Cleaning Process for Speed, Safety & Quality",
    category: "CONTINUOUS OPTIMIZATION",
    speaker: "Mason Gerry (Founder & Operations Lead)",
    targetTime: "0:35 (Cumulative: 1:45)",
    rubricTag: "Rubric: Problem & Opportunity (20 Points) • Process Optimization",
    html: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:1.15rem; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:8px;">
              The Old Way: Squeegee & Bucket
            </div>
            <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
              <li>Dangerous 24ft ladder climbing against homeowner siding</li>
              <li>Soapy bucket water leaves sticky film that attracts dust</li>
              <li>Slow manual hand-wiping: 2 to 3 hours per house</li>
              <li>Squeegee drips leave dirty runoff on frames and tracks</li>
            </ul>
          </div>

          <div style="background:#0e1420; border:1px solid #38bdf8; border-radius:12px; padding:22px;">
            <div style="font-size:1.15rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:8px;">
              Gerry's Optimization: Pure-Water Filtration
            </div>
            <ul style="color:#e2e8f0; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
              <li>Safe ground-level carbon fiber reach up to 3 stories</li>
              <li>Pure deionized water dissolves dirt naturally without soap</li>
              <li>Rinses glass, frames, and sills completely clean</li>
              <li>Dries naturally spot-free in half the turnaround time</li>
            </ul>
          </div>
        </div>

        <div style="background:#111827; border:1px solid #1e293b; border-radius:10px; padding:14px 20px; font-size:0.92rem; color:#e2e8f0;">
          <strong style="color:#38bdf8;">Continuous Optimization:</strong> 2.5x faster turnaround per home, zero ladder damage risk, and glass that stays clean longer.
        </div>
      </div>
    `,
    script: `At Gerry’s Window Services, we are obsessed with continuous optimization. For decades, the window cleaning industry has been stuck doing things the exact same way: lugging heavy aluminum ladders against people’s siding, dipping squeegees into soapy buckets, and wiping glass by hand. It’s slow, it’s dangerous, and it leaves soapy film that attracts dust right after it dries. <span class="pause-cue">[PAUSE]</span> We completely optimized our field process by switching from traditional squeegees to high-tech water-fed filtration poles. Instead of climbing ladders, our technicians use lightweight carbon fiber poles connected directly to our truck's filtration system. The pure filtered water breaks down dirt, washes the frames and sills, and rinses everything completely clean—drying naturally spot-free without a single drop of soap or chemical. It’s safer, it cuts time-on-site in half, and it gives the homeowner a dramatically better result. To show how our software and technology power this, here is our Technical Lead.`,
    transition: `(Verbal Handoff to Speaker 2: Technical Lead)`
  },
  {
    num: 4,
    title: "INSTANT PRICING. INSTANT BOOKING.",
    subtitle: "Transparent 3-Tier Proposals Sent to Your Phone in Under 60 Seconds",
    category: "THE CONSUMER EXPERIENCE",
    speaker: "Technical Lead",
    targetTime: "0:35 (Cumulative: 2:20)",
    rubricTag: "Rubric: Solution (20 Points) • Frictionless Booking",
    html: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#94a3b8;">BRONZE</div>
            <div style="font-size:2rem; font-weight:900; color:#fff; margin:6px 0;">$300</div>
            <div style="font-size:0.95rem; font-weight:700; color:#38bdf8; margin-bottom:8px;">Exterior Detailing</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Exterior pure-water clean, frame rinse, and 48-Hour Rain Shield.</div>
          </div>
          <div style="background:#0e1420; border:1.5px solid #38bdf8; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8;">SILVER (MOST POPULAR)</div>
            <div style="font-size:2rem; font-weight:900; color:#fff; margin:6px 0;">$450</div>
            <div style="font-size:0.95rem; font-weight:700; color:#38bdf8; margin-bottom:8px;">Inside & Outside</div>
            <div style="font-size:0.85rem; color:#e2e8f0; line-height:1.5;">Exterior pure-water + interior detail + track vacuum.</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#94a3b8;">GOLD</div>
            <div style="font-size:2rem; font-weight:900; color:#fff; margin:6px 0;">$650</div>
            <div style="font-size:0.95rem; font-weight:700; color:#38bdf8; margin-bottom:8px;">Complete Estate Care</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Full detail + deep screen restoration + priority scheduling.</div>
          </div>
        </div>

        <div style="background:#111827; border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px 20px; font-size:0.92rem; color:#e2e8f0; text-align:center;">
          <strong style="color:#38bdf8;">Zero Friction:</strong> Enter Address ➔ Instant 3-Tier Quote in &lt; 60s ➔ 1-Tap Mobile Slot Booking
        </div>
      </div>
    `,
    script: `Thank you, Mason. We designed the customer experience from the ground up to eliminate every point of friction. When a homeowner reaches out—through our website, a text message, or scanning a QR code—our platform instantly calculates an exact quote in under sixty seconds. The homeowner receives a clean mobile proposal with three clear options: Bronze for exterior glass, Silver for inside and out, and Gold for the full estate including screens and tracks. There's no waiting for someone to drive to your house to measure. The homeowner selects their tier, taps an arrival time slot on their phone, and their appointment is locked in with zero double-booking. It’s as fast and simple as ordering an Uber.`,
    transition: `Now let's examine how our technology powers our service trucks.`
  },
  {
    num: 5,
    title: "HOW OUR TECHNOLOGY POWERS THE TRUCK",
    subtitle: "Grounded AI Intake + On-Board Water Filtration Telematics",
    category: "4TH INDUSTRIAL REVOLUTION TECH",
    speaker: "Technical Lead",
    targetTime: "0:40 (Cumulative: 3:00)",
    rubricTag: "Rubric: 4th IR Technologies (5 Points) • AI + IoT Hardware",
    html: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:1.15rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:10px;">
              Pillar 1: Grounded AI Auto-Pilot
            </div>
            <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
              <li>&lt; 60-Second Lead Response via SMS and web intake</li>
              <li>Parametric dynamic pricing calculates pane counts instantly</li>
              <li>TCPA Quiet Hours Shield (Compliant 8:00 AM – 8:00 PM local)</li>
              <li>Objection battlecard copilot answers customer questions</li>
            </ul>
          </div>

          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:1.15rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:10px;">
              Pillar 2: On-Board Truck Telematics
            </div>
            <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
              <li>Dual inline conductivity sensors monitor filtration in real time</li>
              <li>Pure filtered water stream ensures zero residue on glass</li>
              <li>Encrypted Digital Clarity Certificate sent via SMS upon completion</li>
              <li>Automated 48-Hour Rain Shield guarantee activates with 1 tap</li>
            </ul>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px 20px; font-size:0.92rem; color:#e2e8f0;">
          <strong style="color:#38bdf8;">Objective Proof:</strong> Sensors confirm our filtration is operating at 100% purity before water ever touches customer glass.
        </div>
      </div>
    `,
    script: `Our platform leverages two core Fourth Industrial Revolution technologies: Grounded AI and Industrial IoT. On the software side, our AI assistant parses property details, handles customer questions with instant battlecards, and enforces strict TCPA quiet hours. On the hardware side, we install industrial IoT telemetry units directly onto our service trucks. Dual inline conductivity sensors measure tap water entering our filtration tanks and compare it against the purified deionized water leaving our tanks, streaming an objective reading directly to the cloud. When the job is done, the homeowner receives an encrypted Digital Clarity Certificate on their phone proving their glass was cleaned with zero-mineral water, backed by an automated 48-Hour Rain Shield Guarantee. Now, here is our Head of Growth to discuss our customers and route flywheel.`,
    transition: `(Verbal Handoff to Speaker 3: Growth Lead)`
  },
  {
    num: 6,
    title: "OUR CONSUMER: \"SUBURBAN SARAH & DAVID\"",
    subtitle: "Luxury Single-Family Homes Across Lake Minnetonka & The Twin Cities",
    category: "TARGET CUSTOMER & MARKET",
    speaker: "Growth Lead",
    targetTime: "0:45 (Cumulative: 3:45)",
    rubricTag: "Rubric: Target Market (20 Points) • ICP Profile & Sizing",
    html: `
      <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:20px;">
        <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:6px;">
            Target Homeowner Profile
          </div>
          <div style="font-size:1.6rem; font-weight:900; color:#fff; margin-bottom:12px;">
            "Suburban Sarah & David"
          </div>
          <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
            <li><strong>Homes:</strong> $650,000 to $2.5 Million home value with 35 to 60 windows</li>
            <li><strong>Geography:</strong> Lake Minnetonka, Wayzata, Edina, Eden Prairie</li>
            <li><strong>Mindset:</strong> High pride of ownership, strict HOA compliance, zero free time</li>
            <li><strong>Preferences:</strong> Value speed and verified quality over cheap bids. Enthusiastic adopters of $42–$65/mo auto-pay subscriptions</li>
          </ul>
        </div>

        <div style="background:#0e1420; border:1px solid #1e293b; border-radius:12px; padding:24px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:12px;">
              Market Opportunity
            </div>
            <div style="margin-bottom:14px;">
              <div style="font-size:1.5rem; font-weight:900; color:#fff;">$42 MILLION</div>
              <div style="font-size:0.82rem; color:#94a3b8;">Twin Cities Beachhead SOM (140,000 Luxury Homes)</div>
            </div>
            <div>
              <div style="font-size:1.5rem; font-weight:900; color:#fff;">$18.4 BILLION</div>
              <div style="font-size:0.82rem; color:#94a3b8;">US Exterior Surface Care & Window Cleaning SAM</div>
            </div>
          </div>
        </div>
      </div>
    `,
    script: `Thank you. Let’s talk about who our customers are. Our ideal customer is 'Suburban Sarah and David'—busy homeowners living in luxury single-family homes valued between $650,000 and $2.5 Million across suburban hubs like Lake Minnetonka, Wayzata, Edina, and Eden Prairie. These homes have 35 to 60 large windows. They have strict HOA standards and heavy suburban dust. Most importantly, these homeowners value their time: they don't want to spend their weekend calling three contractors and waiting for callbacks. They want an effortless, high-trust solution. In the Twin Cities metro alone, this luxury segment represents a $42 Million beachhead market, sitting inside an $18.4 Billion national exterior surface care industry.`,
    transition: `Now let's examine our neighborhood route clustering strategy.`
  },
  {
    num: 7,
    title: "THE 500-METER CUL-DE-SAC FLYWHEEL",
    subtitle: "Passing Transit Efficiency Directly Back to Neighborhood Homeowners",
    category: "NEIGHBORHOOD ROUTE CLUSTERING",
    speaker: "Growth Lead",
    targetTime: "0:45 (Cumulative: 4:30)",
    rubricTag: "Rubric: Go-to-Market (5 Points) • Route Density Stacking",
    html: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8;">STEP 1</div>
            <div style="font-size:1.2rem; font-weight:800; color:#fff; margin:6px 0;">Anchor Booking</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Home A on Bushaway Rd books a window clean on the portal.</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8;">STEP 2</div>
            <div style="font-size:1.2rem; font-weight:800; color:#fff; margin:6px 0;">30 Neighbors Alerted</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Auto-texts neighbors: "Our truck is on your street Thursday for $40 off."</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:22px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8;">STEP 3</div>
            <div style="font-size:1.2rem; font-weight:800; color:#fff; margin:6px 0;">$0 Drive Time</div>
            <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5;">Clustered stops convert at 3.2x; crew rolls hose across driveway.</div>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:14px 20px; font-size:0.92rem; color:#e2e8f0; text-align:center;">
          <strong style="color:#38bdf8;">The Win-Win:</strong> Homeowners save $40 on their clean; our service trucks eliminate 60% of windshield drive time.
        </div>
      </div>
    `,
    script: `Our customer acquisition engine is built on solving the biggest cost in field services: windshield drive time. When a homeowner on a cul-de-sac books a job, our platform automatically identifies nearby homes within 500 meters and sends a geo-targeted route offer: 'Our pure-water truck is already on your block this Thursday—tap here to claim an automatic $40 neighbor discount.' Neighbors see our branded Ford Transit rig and carbon fiber poles right outside their window. These clustered leads convert at 3.2 times the industry average. And because our crew just rolls the hose across the driveway, our transit time drops from 45 minutes to zero. We pass those savings directly back to the homeowner as a discount while increasing our daily revenue per truck.`,
    transition: `Let's see how our consumer experience compares to traditional cleaners.`
  },
  {
    num: 8,
    title: "WHY HOMEOWNERS CHOOSE US",
    subtitle: "Contrasting Modern Convenience Against Traditional Cleaners",
    category: "COMPETITIVE COMPARISON",
    speaker: "Growth Lead",
    targetTime: "0:40 (Cumulative: 5:10)",
    rubricTag: "Rubric: Competition (5 Points) • Consumer Experience Contrast",
    html: `
      <div>
        <table class="data-table" style="font-size:0.9rem; margin-bottom:16px;">
          <thead>
            <tr>
              <th>CUSTOMER EXPERIENCE</th>
              <th>TRADITIONAL CLEANERS</th>
              <th style="color:#38bdf8;">GERRY'S WINDOW SERVICES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Speed to Quote</strong></td>
              <td style="color:#94a3b8;">4+ Hours / 2-Day Wait</td>
              <td style="color:#38bdf8; font-weight:700;">&lt; 60 Seconds Instant Mobile Quote</td>
            </tr>
            <tr>
              <td><strong>Cleaning Method</strong></td>
              <td style="color:#94a3b8;">Ladders, squeegees, soapy runoff</td>
              <td style="color:#38bdf8; font-weight:700;">Water-Fed Filtration Poles (Ground-Level)</td>
            </tr>
            <tr>
              <td><strong>Booking & Pricing</strong></td>
              <td style="color:#94a3b8;">Paper door hanger or static PDF</td>
              <td style="color:#38bdf8; font-weight:700;">Transparent 3-Tier Interactive Proposal</td>
            </tr>
            <tr>
              <td><strong>Customer Guarantee</strong></td>
              <td style="color:#94a3b8;">None / "All Sales Final"</td>
              <td style="color:#38bdf8; font-weight:700;">48-Hour Automated Rain Shield Guarantee</td>
            </tr>
          </tbody>
        </table>

        <div style="background:#0e1420; border:1px solid #1e293b; border-radius:10px; padding:12px 18px; font-size:0.88rem; color:#e2e8f0;">
          <strong style="color:#38bdf8;">The Consumer Verdict:</strong> Traditional window cleaning is slow, risky, and inconsistent. Gerry's delivers speed, safety, and guaranteed clarity.
        </div>
      </div>
    `,
    script: `When homeowners look for window cleaning, their current options are frustrating: unverified solo handymen with clipboards or large franchises using outdated scheduling systems. Traditional cleaners take hours or days to quote, show up with garden hoses and ladders, leave soapy film on glass, and offer zero guarantees. We offer a completely modern consumer experience: sub-60-second instant quotes, transparent 3-tier pricing, ground-level pure-water filtration cleaning, zero software surcharges, and an automated 48-Hour Rain Shield. We don’t just clean windows; we give homeowners peace of mind.`,
    transition: `Now let's examine our recurring model and the data asset.`
  },
  {
    num: 9,
    title: "RECURRING CARE & THE DATA FLYWHEEL",
    subtitle: "$42–$65/mo Memberships Fueling Proprietary Field Intelligence",
    category: "RECURRING CARE & DATA ENGINE",
    speaker: "Growth Lead",
    targetTime: "0:40 (Cumulative: 5:50)",
    rubricTag: "Rubric: Revenue Model & Data (5 Points) • Subscriptions & Data Flywheel",
    html: `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
        <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:8px;">
            Recurring Homeowner Care
          </div>
          <div style="font-size:2rem; font-weight:900; color:#fff; margin-bottom:12px;">
            $42–$65/mo Autopay
          </div>
          <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
            <li>42% of homeowners convert from 1-off clean to recurring care</li>
            <li>68% Field Gross Margin with efficient water-fed pole cleaning</li>
            <li>$14,800/mo revenue per active service truck</li>
            <li>Smooth recurring cash flow completely eliminates the winter cliff</li>
          </ul>
        </div>

        <div style="background:#0e1420; border:1px solid #1e293b; border-radius:12px; padding:24px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:8px;">
            The Proprietary Data Asset
          </div>
          <div style="font-size:1.5rem; font-weight:900; color:#fff; margin-bottom:12px;">
            Platform Usage Intelligence
          </div>
          <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; margin:0; padding-left:20px;">
            <li>Route density modeling maps cluster conversion in real time</li>
            <li>Pricing elasticity algorithms optimize quotes by zip code</li>
            <li>Equipment telematics monitors filtration life and flow rates</li>
            <li>Every wash trains our algorithms, widening our competitive moat</li>
          </ul>
        </div>
      </div>
    `,
    script: `Our financial model converts one-off seasonal cleans into predictable recurring cash flow. A single service truck generates $14,800 per month at a 68% field gross margin. By anchoring homeowners at a $300 initial clean and converting forty-two percent into $42 to $65 per month memberships, we eliminate the seasonal winter cliff. But just as importantly: we are focused on getting customers and technicians onto the platform to capture proprietary operating data. Every wash captures route density, pricing elasticity by neighborhood, and real-time filtration performance. This data continuously trains our algorithms—making our pricing sharper, our routes denser, and our operations more efficient with every customer we serve. Now, back to our founder, Mason Gerry.`,
    transition: `(Verbal Handoff to Speaker 1: Mason Gerry)`
  },
  {
    num: 10,
    title: "OPERATING DAILY IN THE TWIN CITIES",
    subtitle: "Real Homes. Real Paying Customers. Proven Operational Metrics.",
    category: "EMPIRICAL FIELD VALIDATION",
    speaker: "Mason Gerry (Founder & Operations Lead)",
    targetTime: "0:40 (Cumulative: 6:30)",
    rubricTag: "Rubric: Traction & Verification (20 Points) • 53/53 Tests Passing",
    html: `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.8rem; font-weight:900; color:#38bdf8; font-family:monospace;">61%</div>
            <div style="font-size:1rem; font-weight:700; color:#fff; margin-top:6px;">Quote-to-Close Rate</div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Nearly triple industry ~22% average</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.8rem; font-weight:900; color:#38bdf8; font-family:monospace;">42%</div>
            <div style="font-size:1rem; font-weight:700; color:#fff; margin-top:6px;">Recurring Memberships</div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Enrolled in $42–$65/mo autopay</div>
          </div>
          <div style="background:#111827; border:1px solid #1e293b; border-radius:12px; padding:24px; text-align:center;">
            <div style="font-size:2.8rem; font-weight:900; color:#38bdf8; font-family:monospace;">100%</div>
            <div style="font-size:1rem; font-weight:700; color:#fff; margin-top:6px;">Spot-Free Quality</div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Zero callbacks or streak disputes</div>
          </div>
        </div>

        <div style="background:#0e1420; border:1px solid rgba(56,189,248,0.3); border-radius:12px; padding:22px;">
          <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
            TECHNICAL & OPERATIONAL VALIDATION (53 / 53 TESTS PASSING)
          </div>
          <p style="font-size:0.95rem; color:#e2e8f0; line-height:1.6; margin:0;">
            • Production-hardened backend verified by 53 automated regression tests in test_platform.rb.<br>
            • Strict double-booking prevention ensures customer arrival windows are guaranteed.<br>
            • Operating live right now in the Twin Cities — real trucks, real customers, real clean glass.
          </p>
        </div>
      </div>
    `,
    script: `What sets us apart is that this is not an academic exercise or a mock prototype. We are operating live right now in the Twin Cities with real paying homeowners. Our instant 3-tier proposals have achieved a sixty-one percent quote-to-close rate—nearly triple the industry average. Forty-two percent of our customers are already enrolled in recurring monthly maintenance. Our platform backend is battle-tested: fifty-three automated regression tests pass with zero failures, proving our double-booking prevention, AI policy guardrails, and IoT sensor envelopes are fully production-grade. Consumers love the speed, and technicians love the efficiency.`,
    transition: `Now, let's look at our next step and expansion.`
  },
  {
    num: 11,
    title: "EXPANDING TO DENVER SPRING 2027",
    subtitle: "Fast Response. Quick Quotes. Guaranteed Perfect Job Done.",
    category: "EXPANSION & CALL TO ACTION",
    speaker: "Mason Gerry (Founder & Operations Lead)",
    targetTime: "0:30 (Cumulative: 7:00)",
    rubricTag: "Rubric: Closing & Call to Action (5 Points) • Strict 7:00 Execution",
    html: `
      <div style="background:#0e1420; border:1.5px solid #38bdf8; border-radius:14px; padding:32px; height:100%; display:flex; flex-direction:column; justify-content:center;">
        <div style="font-size:0.9rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
          Next Expansion Market: Spring 2027
        </div>
        <div style="font-size:3rem; font-weight:900; color:#fff; margin-bottom:18px;">
          DENVER, COLORADO
        </div>
        <div style="font-size:1.35rem; font-weight:700; color:#38bdf8; line-height:1.5; border-left:4px solid #38bdf8; padding-left:16px; margin-bottom:24px;">
          "If you want a fast response, a quick quote, and a guaranteed perfect job done, consider us for next spring when we open up our Denver location!"
        </div>
        <div style="font-size:0.95rem; color:#94a3b8; line-height:1.6;">
          📍 Proving Ground: Lake Minnetonka & Twin Cities, MN &nbsp;|&nbsp; Contact: Mason Gerry • Founder & CEO<br>
          🌐 Live Platform: http://localhost:3000 &nbsp;|&nbsp; Ready for Investor Q&A
        </div>
      </div>
    `,
    script: `Our proving ground in Minnesota has validated the model. By combining instant AI speed-to-lead with connected pure-water truck rigs, we've created a residential window washing experience that consumers love and recommend. Next spring, we are taking this proven playbook to our first expansion market: Denver, Colorado. <span class="pause-cue">[PAUSE]</span> So if you want a fast response, a quick quote, and a guaranteed perfect job done, consider us for next spring when we open up our Denver location! Thank you, and we look forward to your questions.`,
    transition: `End of Presentation. Total Time: Exactly 7 Minutes (420 Seconds).`
  }
];
"""

def update_app_js():
    app_js_path = "/Users/masongerry/Documents/antigravity/wonderful-archimedes/public/js/app.js"
    with open(app_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace INVESTOR_SLIDES block
    pattern = r"const INVESTOR_SLIDES = \[[\s\S]*?\n\];"
    new_content = re.sub(pattern, NEW_SLIDES_JS.strip(), content)

    with open(app_js_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("✅ Successfully updated INVESTOR_SLIDES in public/js/app.js!")

if __name__ == "__main__":
    update_app_js()
