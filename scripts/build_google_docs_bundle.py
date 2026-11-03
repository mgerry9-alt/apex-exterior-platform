#!/usr/bin/env python3
"""
Generate Google Docs and Google Slides compatible files:
1. APEX_Field_OS_Investor_Pitch_Deck.docx (Native Word Document for Google Docs - zero blocking)
2. APEX_Field_OS_Investor_Pitch_Deck.pdf (100% self-contained standard fonts - restrained palette, minimal text)
3. APEX_Field_OS_Google_Docs_Script.txt (Plain text script for 1-click paste into Google Docs)
"""

import os
import subprocess
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

SLIDES = [
    {
        "num": 1,
        "title": "GERRY'S WINDOW SERVICES",
        "category": "IDEA & STORY OVERVIEW",
        "speaker": "Mason Gerry (Founder & CEO)",
        "time": "0:00 – 0:30 (30 Seconds)",
        "cumulative": "0:30",
        "rubric": "Idea/Story Overview (15 pts) — Specific story/moment within first 30 seconds.",
        "key_points": [
            "Opening Hook: 24 feet up on an aluminum ladder in Wayzata, MN scraping windows with garden hose tap water.",
            "Phone vibrating with 3 missed customer calls; by the time Mason climbed down, 2 homeowners hired competitors who answered in under 2 minutes.",
            "Job finished dried with cloudy mineral spots from 284 PPM municipal tap water.",
            "The realization: Home services are broken for consumers—slow callbacks, zero transparency, and streaky windows.",
            "The consumer solution: Instant quotes in <60s, self-booking, and 000 PPM pure-water spot-free results."
        ],
        "script": "Last May, I was twenty-four feet in the air on an aluminum ladder in Wayzata, scraping a second-story picture window with municipal water from a customer's garden hose. My phone was vibrating non-stop in my pocket. [PAUSE] By the time I climbed down two hours later, I had three missed calls from local homeowners wanting window cleaning quotes. When I called them back, two of them had already hired the competitor who answered their text in under two minutes, and the job I just finished dried with cloudy mineral spots. That day, I realized home services are fundamentally broken for consumers. Homeowners are stuck waiting days for a quote, dealing with flaky contractors, and getting streaky windows. We built Gerry’s Window Services, powered by our APEX platform, to change that. We combine grounded AI with truck IoT water sensors to deliver an instant quote, self-booking in seconds, and laboratory-verified spot-free windows.",
        "transition": "Let’s look at why consumers are so frustrated with traditional services."
    },
    {
        "num": 2,
        "title": "HOME SERVICES ARE BROKEN FOR CONSUMERS",
        "category": "THE CONSUMER PROBLEM",
        "speaker": "Mason Gerry (Founder & CEO)",
        "time": "0:30 – 1:10 (40 Seconds)",
        "cumulative": "1:10",
        "rubric": "Why: Problem & Primary Research (20 pts) — Quantified with N=45 surveys & N=18 interviews.",
        "key_points": [
            "4.2 Hours: Average wait time for a contractor callback across US home service trades.",
            "78% of Homeowners hire the very first service company that delivers a confirmed price.",
            "3.9x Drop in booking probability if response takes longer than 30 minutes.",
            "Primary Research Audit: N=45 quantitative homeowner surveys & N=18 in-depth interviews across Lake Minnetonka and Twin Cities.",
            "Homeowner Quote: \"I always hire whoever gives me a confirmed price first. I don't have time to wait 24 hours for three contractors to call me back.\""
        ],
        "script": "Let’s look at why consumers are frustrated. Across our primary research—including forty-five quantitative homeowner surveys and eighteen in-depth interviews across Lake Minnetonka and the Twin Cities—the single largest pain point is speed. [PAUSE] Seventy-eight percent of homeowners hire the very first service company that delivers a confirmed price. Yet the industry average callback time is 4.2 hours. Why? Because solo contractors are physically on ladders, pressure washing driveways, or driving. If a homeowner doesn't get a response in thirty minutes, their frustration spikes, and probability of booking drops by nearly four times. Over sixty-four percent of surveyed homeowners told us: they don't want to play phone tag—they want an instant, transparent price on their phone.",
        "transition": "And the second major consumer frustration is the outdated cleaning process itself."
    },
    {
        "num": 3,
        "title": "ALWAYS OPTIMIZING: SQUEEGEE TO FILTER",
        "category": "CONTINUOUS OPTIMIZATION",
        "speaker": "Mason Gerry (Founder & CEO)",
        "time": "1:10 – 1:45 (35 Seconds)",
        "cumulative": "1:45",
        "rubric": "Why: Problem & Opportunity (20 pts) — Process Optimization.",
        "key_points": [
            "Traditional Squeegee (The Old Way): Dangerous 24ft ladder climbing, soapy bucket water, streak risks, and dirty track runoff.",
            "Water-Fed Filtration Poles (Gerry's Optimization): 100% ground-level reach up to 3 stories with zero ladder damage to property.",
            "Pure-Water Process: Multi-stage deionized filtration strips mineral ions so water cleans naturally without soaps or chemicals.",
            "2.5x Faster Turnaround: Cuts time-on-site in half while delivering spotless glass that stays cleaner significantly longer."
        ],
        "script": "At Gerry’s Window Services, we are obsessed with continuous optimization. For decades, the window cleaning industry has been stuck doing things the exact same way: lugging heavy aluminum ladders against people’s siding, dipping squeegees into soapy buckets, and wiping glass by hand. It’s slow, it’s dangerous, and it leaves soapy film that attracts dust right after it dries. [PAUSE] We completely optimized our field process by switching from traditional squeegees to high-tech water-fed filtration poles. Instead of climbing ladders, our technicians use lightweight carbon fiber poles connected directly to our truck's filtration system. The pure filtered water breaks down dirt, washes the frames and sills, and rinses everything completely clean—drying naturally spot-free without a single drop of soap or chemical. It’s safer, it cuts time-on-site in half, and it gives the homeowner a dramatically better result. To show how our software and technology power this, here is our Technical Lead.",
        "transition": "(Verbal Handoff to Speaker 2: Technical Lead)"
    },
    {
        "num": 4,
        "title": "INSTANT PRICING. INSTANT BOOKING.",
        "category": "THE CONSUMER EXPERIENCE",
        "speaker": "Technical Lead",
        "time": "1:45 – 2:20 (35 Seconds)",
        "cumulative": "2:20",
        "rubric": "What: Solution (20 pts) — Frictionless 60-second booking experience.",
        "key_points": [
            "Sub-60-second instant automated dynamic quote sent via SMS or web form.",
            "Bronze Package ($300): All exterior glass, frames, and sills cleaned spot-free.",
            "Silver Package ($450): Complete interior & exterior detailing + track vacuum.",
            "Gold Package ($650): Full estate care including deep screen restoration.",
            "1-Tap Mobile Arrival Slot Selection with zero double-booking (HTTP 409 conflict checks)."
        ],
        "script": "Thank you, Mason. We designed the customer experience from the ground up to eliminate every point of friction. When a homeowner reaches out—through our website, a text message, or scanning a QR code—our platform instantly calculates an exact quote in under sixty seconds. The homeowner receives a clean mobile proposal with three clear options: Bronze for exterior glass, Silver for inside and out, and Gold for the full estate including screens and tracks. There's no waiting for someone to drive to your house to measure. The homeowner selects their tier, taps an arrival time slot on their phone, and their appointment is locked in with zero double-booking. It’s as fast and simple as ordering an Uber.",
        "transition": "Now let's examine how our technology guarantees spot-free glass."
    },
    {
        "num": 5,
        "category": "4TH INDUSTRIAL REVOLUTION TECH",
        "title": "HOW OUR TECHNOLOGY POWERS THE TRUCK",
        "speaker": "Technical Lead",
        "time": "2:20 – 3:00 (40 Seconds)",
        "cumulative": "3:00",
        "rubric": "4th Industrial Revolution Tech (5 pts) — Grounded AI + Industrial IoT Telematics.",
        "key_points": [
            "Pillar 1: Grounded AI Auto-Pilot — Intelligent intake, dynamic pricing calculations, TCPA quiet hours, objection handling battlecards.",
            "Pillar 2: Connected Truck Filtration Rig — Dual inline conductivity sensors verifying pure filtered water on-board.",
            "The Customer Deliverable: Automated Digital Clarity Certificate + 48-Hour Rain Shield guarantee."
        ],
        "script": "Our platform leverages two core Fourth Industrial Revolution technologies: Grounded AI and Industrial IoT. On the software side, our AI assistant parses property details, handles customer questions with instant battlecards, and enforces strict TCPA quiet hours. On the hardware side, we install industrial IoT telemetry units directly onto our service trucks. Dual inline conductivity sensors measure tap water entering our filtration tanks and compare it against the purified deionized water leaving our tanks, streaming an objective reading directly to the cloud. When the job is done, the homeowner receives an encrypted Digital Clarity Certificate on their phone proving their glass was cleaned with zero-mineral water, backed by an automated 48-Hour Rain Shield Guarantee. Now, here is our Head of Growth to discuss our customers and route flywheel.",
        "transition": "(Verbal Handoff to Speaker 3: Growth Lead)"
    },
    {
        "num": 6,
        "category": "TARGET CUSTOMER & MARKET",
        "title": "OUR CONSUMER: \"SUBURBAN SARAH & DAVID\"",
        "speaker": "Growth Lead",
        "time": "3:00 – 3:45 (45 Seconds)",
        "cumulative": "3:45",
        "rubric": "Target Market (20 Pts) — Suburban Sarah & David ICP + Sizing.",
        "key_points": [
            "Ideal Customer Profile: \"Suburban Sarah & David\", Lake Minnetonka, Wayzata, Edina, Eden Prairie.",
            "Home Profile: $650,000 to $2.5 Million home value with 35 to 60 large architectural windows.",
            "Consumer Mindset: High pride of ownership, strict HOA compliance, severe well-water calcium spotting, zero free time.",
            "Buying Behavior: Values speed and verified quality over cheap bids. Enthusiastic adopters of $42–$65/mo recurring subscriptions.",
            "Market Opportunity: $42 Million Twin Cities luxury beachhead sitting inside an $18.4 Billion US exterior care industry."
        ],
        "script": "Thank you. Let’s talk about who our customers are. Our ideal customer is 'Suburban Sarah and David'—busy homeowners living in luxury single-family homes valued between $650,000 and $2.5 Million across suburban hubs like Lake Minnetonka, Wayzata, Edina, and Eden Prairie. These homes have 35 to 60 large windows. They have strict HOA standards and heavy well-water mineral spotting. Most importantly, these homeowners value their time: they don't want to spend their weekend calling three contractors and waiting for callbacks. They want an effortless, high-trust solution. In the Twin Cities metro alone, this luxury segment represents a $42 Million beachhead market, sitting inside an $18.4 Billion national exterior surface care industry.",
        "transition": "Now let's examine our neighborhood route clustering strategy."
    },
    {
        "num": 7,
        "category": "NEIGHBORHOOD ROUTE CLUSTERING",
        "title": "THE 500-METER CUL-DE-SAC FLYWHEEL",
        "speaker": "Growth Lead",
        "time": "3:45 – 4:30 (45 Seconds)",
        "cumulative": "4:30",
        "rubric": "Go to Market Strategy (5 pts) — 500-meter cul-de-sac clustering.",
        "key_points": [
            "Anchor Booking: Home A on Bushaway Rd books a window clean on the mobile portal.",
            "Auto-Alert: Platform automatically alerts 30 neighbors within 500m: \"Truck is on your street Thursday for $40 off.\"",
            "Clustered Route: Clustered stops close at 3.2x higher rate; technicians roll hose across driveway with $0 drive time.",
            "Passing Efficiency Back: Homeowners receive a $40 neighborhood discount while truck revenue per day surges."
        ],
        "script": "Our customer acquisition engine is built on solving the biggest cost in field services: windshield drive time. When a homeowner on a cul-de-sac books a job, our platform automatically identifies nearby homes within 500 meters and sends a geo-targeted route offer: 'Our pure-water truck is already on your block this Thursday—tap here to claim an automatic $40 neighbor discount.' Neighbors see our branded Ford Transit rig and carbon fiber poles right outside their window. These clustered leads convert at 3.2 times the industry average. And because our crew just rolls the hose across the driveway, our transit time drops from 45 minutes to zero. We pass those savings directly back to the homeowner as a discount while increasing our daily revenue per truck.",
        "transition": "Let's see how our consumer experience compares to traditional cleaners."
    },
    {
        "num": 8,
        "category": "COMPETITIVE COMPARISON",
        "title": "WHY HOMEOWNERS CHOOSE US",
        "speaker": "Growth Lead",
        "time": "4:30 – 5:10 (40 Seconds)",
        "cumulative": "5:10",
        "rubric": "Competition (5 pts) — Direct consumer experience contrast.",
        "key_points": [
            "Speed to Quote: < 60 Seconds Instant Mobile Quote vs. 4+ Hours / 2-Day Wait (Traditional).",
            "Water Purity: 000 PPM Lab-Pure Deionized Water vs. Tap Water Squeegee (Risk of baked mineral streaks).",
            "Booking & Pricing: Transparent 3-Tier Interactive Proposal vs. Paper door hanger or static PDF.",
            "Customer Guarantee: 48-Hour Automated Rain Shield Guarantee vs. None / \"All Sales Final\"."
        ],
        "script": "When homeowners look for window cleaning, their current options are frustrating: unverified solo handymen with clipboards or large franchises using outdated scheduling systems. Traditional cleaners take hours or days to quote, show up with garden hoses and tap water, leave mineral streaks on hot days, and offer zero guarantees. We offer a completely modern consumer experience: sub-60-second instant quotes, transparent 3-tier pricing, laboratory-verified 000 PPM pure-water cleaning, zero software surcharges, and an automated 48-Hour Rain Shield. We don’t just clean windows; we give homeowners peace of mind.",
        "transition": "Now let's examine our recurring model and the data asset."
    },
    {
        "num": 9,
        "category": "RECURRING CARE & DATA ENGINE",
        "title": "RECURRING CARE & THE DATA FLYWHEEL",
        "speaker": "Growth Lead",
        "time": "5:10 – 5:50 (40 Seconds)",
        "cumulative": "5:50",
        "rubric": "Revenue Model & Data Asset (5 Pts) — Subscriptions & Platform Data.",
        "key_points": [
            "42% Subscription Conversion: Homeowners convert from $300 single clean to $42–$65/mo autopay maintenance.",
            "68% Field Gross Margin: High-efficiency pure water pole cleaning generating $14,800/mo per truck.",
            "The Platform Data Engine: Every consumer interaction captures route density clustering, pricing elasticity by zip code, and regional municipal water hardness telemetry.",
            "Operating Intelligence: Data makes our pricing smarter, routing tighter, and customer retention higher with every wash."
        ],
        "script": "Our financial model converts one-off seasonal cleans into predictable recurring cash flow. A single service truck generates $14,800 per month at a 68% field gross margin. By anchoring homeowners at a $300 initial clean and converting forty-two percent into $42 to $65 per month memberships, we eliminate the seasonal winter cliff. But just as importantly: every homeowner interaction fuels our proprietary data engine. By getting consumers and field reps on our platform, we capture high-value data on neighborhood route density, price elasticity by zip code, and municipal water hardness telemetry. This data makes our pricing smarter, our routing tighter, and our customer retention higher with every wash. Now, back to our founder, Mason Gerry.",
        "transition": "(Verbal Handoff to Speaker 1: Mason Gerry)"
    },
    {
        "num": 10,
        "category": "EMPIRICAL FIELD VALIDATION",
        "title": "OPERATING DAILY IN THE TWIN CITIES",
        "speaker": "Mason Gerry (Founder & CEO)",
        "time": "5:50 – 6:30 (40 Seconds)",
        "cumulative": "6:30",
        "rubric": "Traction & Verification (20 Pts) — Twin Cities live operations.",
        "key_points": [
            "61% Quote-to-Close Rate in live field deployment (nearly triple ~22% industry benchmark).",
            "42% Recurring Subscription Adoption Rate converting cleans to predictable monthly autopay.",
            "000 PPM Pure Water delivered with zero spot callbacks or streak disputes.",
            "53 of 53 Automated Regression Tests passing (double-booking prevention, AI guardrails, IoT envelopes)."
        ],
        "script": "What sets us apart is that this is not an academic exercise or a mock prototype. We are operating live right now in the Twin Cities with real paying homeowners. Our instant 3-tier proposals have achieved a sixty-one percent quote-to-close rate—nearly triple the industry average. Forty-two percent of our customers are already enrolled in recurring monthly maintenance. Our platform backend is battle-tested: fifty-three automated regression tests pass with zero failures, proving our double-booking prevention, AI policy guardrails, and IoT sensor envelopes are fully production-grade. Consumers love the speed, and technicians love the efficiency.",
        "transition": "Now, let's look at our next step and expansion."
    },
    {
        "num": 11,
        "category": "EXPANSION & CALL TO ACTION",
        "title": "EXPANDING TO DENVER SPRING 2027",
        "speaker": "Mason Gerry (Founder & CEO)",
        "time": "6:30 – 7:00 (30 Seconds)",
        "cumulative": "7:00",
        "rubric": "Closing & Call to Action (5 pts) — Strict 7:00 Execution.",
        "key_points": [
            "Proving Ground Validated: Lake Minnetonka & Twin Cities Metro, MN.",
            "Next Expansion Market: Denver, Colorado Metro (Spring 2027 Expansion).",
            "The Consumer Promise: Sub-60-second response, transparent instant pricing, 100% streak-free pure-water guarantee.",
            "Final Call to Action: \"If you want a fast response, a quick quote, and a guaranteed perfect job done, consider us for next spring when we open up our Denver location!\""
        ],
        "script": "Our proving ground in Minnesota has validated the model. By combining instant AI speed-to-lead with connected pure-water truck rigs, we've created a residential window washing experience that consumers love and recommend. Next spring, we are taking this proven playbook to our first expansion market: Denver, Colorado. [PAUSE] So if you want a fast response, a quick quote, and a guaranteed perfect job done, consider us for next spring when we open up our Denver location! Thank you, and we look forward to your questions.",
        "transition": "Open for Q&A with the Investors."
    }
]

def build_docx(output_path):
    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Document Header Title
    title_p = doc.add_paragraph()
    r_title = title_p.add_run("GERRY'S WINDOW SERVICES (POWERED BY APEX)")
    r_title.bold = True
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(14, 116, 144)

    sub_p = doc.add_paragraph()
    r_sub = sub_p.add_run("Phase 2 Presentation & Script (7-Minute Presentation: 6:50 – 7:10 Target Window)\nB2C Focus • Data Engine • Denver Spring Launch")
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph("─" * 70)

    for s in SLIDES:
        doc.add_page_break()

        cat_p = doc.add_paragraph()
        r_num = cat_p.add_run(f"SLIDE #{s['num']}  •  {s['category']}")
        r_num.bold = True
        r_num.font.size = Pt(10)
        r_num.font.color.rgb = RGBColor(14, 116, 144)

        h1 = doc.add_heading(level=1)
        r_h1 = h1.add_run(s['title'])
        r_h1.bold = True
        r_h1.font.size = Pt(16)
        r_h1.font.color.rgb = RGBColor(15, 23, 42)

        meta_p = doc.add_paragraph()
        r_meta = meta_p.add_run(f"🎙️ Speaker: {s['speaker']}   |   ⏱️ Time: {s['time']}   |   Cumulative: {s['cumulative']}")
        r_meta.font.size = Pt(9.5)
        r_meta.bold = True
        r_meta.font.color.rgb = RGBColor(71, 85, 105)

        rub_p = doc.add_paragraph()
        r_rub = rub_p.add_run(f"🎯 Rubric Target: {s['rubric']}")
        r_rub.font.size = Pt(9.5)
        r_rub.font.italic = True
        r_rub.font.color.rgb = RGBColor(180, 83, 9)

        doc.add_heading("On-Slide Content & Verified Data Points", level=2)
        for pt in s['key_points']:
            p_pt = doc.add_paragraph(style='List Bullet')
            r_pt = p_pt.add_run(pt)
            r_pt.font.size = Pt(10)
            r_pt.font.color.rgb = RGBColor(30, 41, 59)

        doc.add_heading("Word-For-Word Speaker Script (No Reading Note Cards)", level=2)
        script_p = doc.add_paragraph()
        r_script = script_p.add_run(f"“{s['script']}”")
        r_script.font.size = Pt(10.5)
        r_script.font.color.rgb = RGBColor(15, 23, 42)

        trans_p = doc.add_paragraph()
        r_trans = trans_p.add_run(f"👉 Verbal Transition Cue: {s['transition']}")
        r_trans.bold = True
        r_trans.font.size = Pt(9.5)
        r_trans.font.color.rgb = RGBColor(5, 150, 105)

    doc.save(output_path)
    print(f"✅ Generated Google Docs compatible DOCX: {output_path}")

def build_txt(output_path):
    lines = [
        "================================================================================",
        "GERRY'S WINDOW SERVICES — MASTER INVESTOR PITCH DECK & SPEAKER SCRIPT",
        "Phase 2 Presentation | Strict 7-Minute Window (6:50 – 7:10) | 125-Point Rubric",
        "B2C Customer Focus • Data Engine • Denver Spring Launch",
        "================================================================================\n"
    ]
    for s in SLIDES:
        lines.append(f"--------------------------------------------------------------------------------")
        lines.append(f"SLIDE #{s['num']}: {s['title'].upper()}")
        lines.append(f"CATEGORY:    {s['category']}")
        lines.append(f"SPEAKER:     {s['speaker']}")
        lines.append(f"TIMING:      {s['time']}  (Cumulative: {s['cumulative']})")
        lines.append(f"RUBRIC:      {s['rubric']}")
        lines.append(f"--------------------------------------------------------------------------------")
        lines.append("ON-SLIDE CONTENT & KEY EVIDENCE:")
        for pt in s['key_points']:
            lines.append(f"  • {pt}")
        lines.append("\nSPOKEN DELIVERY SCRIPT (WORD-FOR-WORD):")
        lines.append(f"  \"{s['script']}\"")
        lines.append(f"\nTRANSITION TO NEXT SPEAKER / TOPIC:")
        lines.append(f"  👉 {s['transition']}\n\n")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"✅ Generated Google Docs compatible TXT: {output_path}")

def build_safe_pdf(html_input, output_pdf):
    chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    profile_dir = "/tmp/chrome_clean_pdf_profile"
    os.makedirs(profile_dir, exist_ok=True)

    cmd = [
        chrome_bin,
        "--headless=new",
        "--disable-gpu",
        f"--user-data-dir={profile_dir}",
        "--no-pdf-header-footer",
        f"--print-to-pdf={output_pdf}",
        html_input
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode == 0:
        print(f"✅ Generated 100% safe self-contained PDF: {output_pdf}")
    else:
        print(f"Error compiling clean PDF: {res.stderr}")

def generate_minimalist_html(output_html_path):
    slides_html = []
    for s in SLIDES:
        bullets = "".join([f"<li style='margin-bottom:8px;'>{pt}</li>" for pt in s['key_points']])
        slide = f"""
        <div class="slide">
          <div class="header">
            <span class="cat">SLIDE {s['num']} • {s['category']}</span>
            <span class="meta">🎙️ {s['speaker']} &nbsp;|&nbsp; ⏱️ {s['time']}</span>
          </div>
          <h1 class="title">{s['title']}</h1>
          <div class="card">
            <div class="card-label">KEY POINTS & DATA</div>
            <ul style="color:#e2e8f0; font-size:1.15rem; line-height:1.6; padding-left:24px;">
              {bullets}
            </ul>
          </div>
          <div class="footer">
            <span>Gerry's Window Services  |  Phase 2 Presentation</span>
            <span style="color:#38bdf8; font-weight:700;">Slide {s['num']} of {len(SLIDES)}</span>
          </div>
        </div>
        """
        slides_html.append(slide)

    full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }}
  @page {{ size: 16in 9in; margin: 0; }}
  body {{ background: #0b0f17; color: #ffffff; font-family: Arial, Helvetica, sans-serif; }}
  .slide {{ width: 16in; height: 9in; page-break-after: always; break-after: page; padding: 0.8in 1.0in; display: flex; flex-direction: column; background: #0b0f17; }}
  .header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #1e293b; }}
  .cat {{ color: #38bdf8; font-weight: 700; font-size: 0.95rem; letter-spacing: 0.05em; }}
  .meta {{ color: #94a3b8; font-size: 0.9rem; }}
  .title {{ font-size: 2.2rem; font-weight: 900; color: #ffffff; margin-bottom: 24px; line-height: 1.2; }}
  .card {{ background: #111827; border: 1px solid #1e293b; border-radius: 14px; padding: 32px; flex: 1; }}
  .card-label {{ font-size: 0.85rem; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }}
  .footer {{ display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 0.85rem; color: #64748b; margin-top: 24px; }}
</style>
</head>
<body>
{"".join(slides_html)}
</body>
</html>
"""
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"✅ Generated minimalist HTML: {output_html_path}")

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, "public")

    docx_path = os.path.join(base_dir, "APEX_Field_OS_Investor_Pitch_Deck.docx")
    public_docx = os.path.join(public_dir, "APEX_Field_OS_Investor_Pitch_Deck.docx")

    txt_path = os.path.join(base_dir, "APEX_Field_OS_Google_Docs_Script.txt")
    public_txt = os.path.join(public_dir, "APEX_Field_OS_Google_Docs_Script.txt")

    html_path = os.path.join(public_dir, "presentation_slides_safe.html")
    pdf_path = os.path.join(public_dir, "APEX_Field_OS_Investor_Pitch_Deck.pdf")
    root_pdf = os.path.join(base_dir, "APEX_Field_OS_Investor_Pitch_Deck.pdf")

    # 1. Build DOCX
    build_docx(docx_path)
    subprocess.run(["cp", docx_path, public_docx])

    # 2. Build TXT
    build_txt(txt_path)
    subprocess.run(["cp", txt_path, public_txt])

    # 3. Build Safe Minimalist HTML
    generate_minimalist_html(html_path)

    # 4. Render Safe PDF
    build_safe_pdf(html_path, pdf_path)
    subprocess.run(["cp", pdf_path, root_pdf])

    print("🎉 All updated Google Docs & PDF bundle files generated successfully!")

if __name__ == "__main__":
    main()
