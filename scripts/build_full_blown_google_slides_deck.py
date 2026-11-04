#!/usr/bin/env python3
"""
Full-Blown Presentation Generator for Google Slides Import:
- Continuous Optimization: Evolving from traditional squeegee to water-fed filtration poles
- B2C Customer Experience Focus
- Data Engine / Platform Usage Focus
- Denver Spring Launch Call-to-Action
- Cool Slide Transitions: Directional Push (Slide) Transition
- Minimalist, High-Impact Editorial Layout (Less Text, Generous Whitespace)
- Restrained Palette (Deep Slate & Arctic Cyan - Less Color)
- Complete Spoken Presenter Notes on Every Slide
"""

from legacy_materials_guard import require_legacy_materials_acknowledgement
require_legacy_materials_acknowledgement()

import os
import subprocess
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml import parse_xml

# Restrained Minimalist Color Palette (Luxury Space Obsidian & Arctic Ice)
BG_COLOR = RGBColor(11, 15, 23)        # #0B0F17 Deep Slate / Obsidian
CARD_BG = RGBColor(17, 24, 39)         # #111827 Slate 900
INNER_CARD_BG = RGBColor(14, 20, 32)   # #0E1420 Card Surface
TEXT_WHITE = RGBColor(255, 255, 255)   # #FFFFFF Crisp White
TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8 Slate 400
TEXT_LIGHT = RGBColor(226, 232, 240)   # #E2E8F0 Slate 200

# Single Primary Accent (Arctic Ice Cyan) & Subtle Secondary (Silver)
ACCENT_CYAN = RGBColor(56, 189, 248)   # #38BDF8 Electric Cyan
BORDER_SUBTLE = RGBColor(30, 41, 59)   # #1E293B Subtle Border
BORDER_CYAN = RGBColor(56, 189, 248)   # #38BDF8 Accent Border

def add_cool_transition(slide):
    """Embeds OpenXML smooth directional push transition for sleek modern presentation feel."""
    trans_xml = parse_xml(
        '<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" spd="fast">'
        '  <p:push dir="l"/>'
        '</p:transition>'
    )
    slide._element.append(trans_xml)

def set_slide_background(slide):
    """Sets deep obsidian dark slide background."""
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_COLOR
    bg.line.fill.background()
    return bg

def add_header(slide, slide_num, category, speaker, target_time, rubric_tag, title, subtitle):
    """Minimalist, editorial top header with generous whitespace."""
    header_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.4), Inches(11.533), Inches(0.4))
    tf = header_box.text_frame
    tf.word_wrap = True
    tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]
    
    r_cat = p.add_run()
    r_cat.text = f"SLIDE {slide_num} • {category.upper()}"
    r_cat.font.size = Pt(10)
    r_cat.font.bold = True
    r_cat.font.color.rgb = ACCENT_CYAN

    r_spk = p.add_run()
    r_spk.text = f"   |   🎙️ {speaker}   |   ⏱️ {target_time}"
    r_spk.font.size = Pt(10)
    r_spk.font.color.rgb = TEXT_MUTED

    r_rub = p.add_run()
    r_rub.text = f"   •   🎯 {rubric_tag}"
    r_rub.font.size = Pt(9)
    r_rub.font.color.rgb = TEXT_MUTED

    title_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.8), Inches(11.533), Inches(0.9))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    tf_title.margin_top = tf_title.margin_bottom = tf_title.margin_left = tf_title.margin_right = 0
    
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE

    p_sub = tf_title.add_paragraph()
    p_sub.text = subtitle
    p_sub.font.size = Pt(13)
    p_sub.font.color.rgb = TEXT_MUTED

def add_footer(slide, slide_num, total_slides=11):
    """Subtle bottom brand signature."""
    footer_box = slide.shapes.add_textbox(Inches(0.9), Inches(6.9), Inches(11.533), Inches(0.35))
    tf = footer_box.text_frame
    tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]
    
    r1 = p.add_run()
    r1.text = "Gerry's Window Services (Powered by APEX)  |  Phase 2 Presentation (7:00 ± 10s Window)"
    r1.font.size = Pt(9)
    r1.font.color.rgb = TEXT_MUTED

    r2 = p.add_run()
    r2.text = f"                                                                               Slide {slide_num} of {total_slides}"
    r2.font.size = Pt(9)
    r2.font.bold = True
    r2.font.color.rgb = ACCENT_CYAN

def set_speaker_notes(slide, s):
    """Embeds word-for-word spoken rehearsal script into presenter notes."""
    notes = slide.notes_slide.notes_text_frame
    notes.text = (
        f"SLIDE {s['num']}: {s['title']}\n"
        f"SPEAKER: {s['speaker']}\n"
        f"TARGET TIME WINDOW: {s['target_time']}\n"
        f"RUBRIC GOAL: {s['rubric_tag']}\n\n"
        f"SPOKEN REHEARSAL SCRIPT (DO NOT READ NOTE CARDS):\n"
        f"\"{s['script']}\"\n\n"
        f"VERBAL TRANSITION CUE:\n"
        f"👉 {s['transition']}"
    )

def add_card(slide, left, top, width, height, border_color=BORDER_SUBTLE, bg_color=CARD_BG):
    """Adds a rounded rectangle card container."""
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1.0)
    return card

SLIDES_DATA = [
    {
        "num": 1,
        "category": "Idea & Story Overview",
        "speaker": "Mason Gerry (Founder & CEO)",
        "target_time": "0:00 – 0:30 (30s)",
        "rubric_tag": "Idea/Story Overview (15 Pts) — Specific story/moment within 30s",
        "title": "GERRY'S WINDOW SERVICES",
        "subtitle": "The 60-Second, Spot-Free Home Cleaning Experience",
        "script": "Last May, I was twenty-four feet in the air on an aluminum ladder in Wayzata, scraping a second-story picture window with municipal water from a customer's garden hose. My phone was vibrating non-stop in my pocket. [PAUSE] By the time I climbed down two hours later, I had three missed calls from local homeowners wanting window cleaning quotes. When I called them back, two of them had already hired the competitor who answered their text in under two minutes, and the job I just finished dried with cloudy spots. That day, I realized home services are fundamentally broken for consumers. Homeowners are stuck waiting days for a quote, dealing with flaky contractors, and getting streaky windows. We built Gerry’s Window Services, powered by our APEX platform, to change that. We combine grounded AI with truck filtration systems to deliver an instant quote, self-booking in seconds, and laboratory-verified spot-free windows.",
        "transition": "Let’s look at why consumers are so frustrated with traditional services."
    },
    {
        "num": 2,
        "category": "The Consumer Problem",
        "speaker": "Mason Gerry (Founder & CEO)",
        "target_time": "0:30 – 1:10 (40s)",
        "rubric_tag": "Problem & Research (20 Pts) — N=45 surveys & N=18 interviews",
        "title": "HOME SERVICES ARE BROKEN FOR CONSUMERS",
        "subtitle": "Slow Callbacks, Zero Transparency, and Friction at Every Step",
        "script": "Let’s look at why consumers are frustrated. Across our primary research—including forty-five quantitative homeowner surveys and eighteen in-depth interviews across Lake Minnetonka and the Twin Cities—the single largest pain point is speed. [PAUSE] Seventy-eight percent of homeowners hire the very first service company that delivers a confirmed price. Yet the industry average callback time is 4.2 hours. Why? Because solo contractors are physically on ladders, pressure washing driveways, or driving. If a homeowner doesn't get a response in thirty minutes, their frustration spikes, and probability of booking drops by nearly four times. Over sixty-four percent of surveyed homeowners told us: they don't want to play phone tag—they want an instant, transparent price on their phone.",
        "transition": "And the second major consumer frustration is the outdated cleaning process itself."
    },
    {
        "num": 3,
        "category": "Continuous Optimization",
        "speaker": "Mason Gerry (Founder & CEO)",
        "target_time": "1:10 – 1:45 (35s)",
        "rubric_tag": "Problem & Opportunity (20 Pts) — Process Optimization",
        "title": "ALWAYS OPTIMIZING: SQUEEGEE TO FILTER",
        "subtitle": "How Gerry’s Window Services Re-Engineered the Cleaning Process for Speed, Safety & Quality",
        "script": "At Gerry’s Window Services, we are obsessed with continuous optimization. For decades, the window cleaning industry has been stuck doing things the exact same way: lugging heavy aluminum ladders against people’s siding, dipping squeegees into soapy buckets, and wiping glass by hand. It’s slow, it’s dangerous, and it leaves soapy film that attracts dust right after it dries. [PAUSE] We completely optimized our field process by switching from traditional squeegees to high-tech water-fed filtration poles. Instead of climbing ladders, our technicians use lightweight carbon fiber poles connected directly to our truck's filtration system. The pure filtered water breaks down dirt, washes the frames and sills, and rinses everything completely clean—drying naturally spot-free without a single drop of soap or chemical. It’s safer, it cuts time-on-site in half, and it gives the homeowner a dramatically better result. To show how our software and technology power this, here is our Technical Lead.",
        "transition": "(Verbal Handoff to Speaker 2: Technical Lead)"
    },
    {
        "num": 4,
        "category": "The Consumer Experience",
        "speaker": "Technical Lead",
        "target_time": "1:45 – 2:20 (35s)",
        "rubric_tag": "Solution (20 Pts) — Frictionless 60-second booking experience",
        "title": "INSTANT PRICING. INSTANT BOOKING.",
        "subtitle": "Transparent 3-Tier Proposals Sent to Your Phone in Under 60 Seconds",
        "script": "Thank you, Mason. We designed the customer experience from the ground up to eliminate every point of friction. When a homeowner reaches out—through our website, a text message, or scanning a QR code—our platform instantly calculates an exact quote in under sixty seconds. The homeowner receives a clean mobile proposal with three clear options: Bronze for exterior glass, Silver for inside and out, and Gold for the full estate including screens and tracks. There's no waiting for someone to drive to your house to measure. The homeowner selects their tier, taps an arrival time slot on their phone, and their appointment is locked in with zero double-booking. It’s as fast and simple as ordering an Uber.",
        "transition": "Now let's examine how our technology powers our service trucks."
    },
    {
        "num": 5,
        "category": "4IR Technology",
        "speaker": "Technical Lead",
        "target_time": "2:20 – 3:00 (40s)",
        "rubric_tag": "4th IR Tech (5 Pts) — Grounded AI + Industrial IoT Telematics",
        "title": "HOW OUR TECHNOLOGY POWERS THE TRUCK",
        "subtitle": "Grounded AI Intake + On-Board Water Filtration Telematics",
        "script": "Our platform leverages two core Fourth Industrial Revolution technologies: Grounded AI and Industrial IoT. On the software side, our AI assistant parses property details, handles customer questions with instant battlecards, and enforces strict TCPA quiet hours. On the hardware side, we install industrial IoT telemetry units directly onto our service trucks. Dual inline conductivity sensors measure tap water entering our filtration tanks and compare it against the purified deionized water leaving our tanks, streaming an objective reading directly to the cloud. When the job is done, the homeowner receives an encrypted Digital Clarity Certificate on their phone proving their glass was cleaned with zero-mineral water, backed by an automated 48-Hour Rain Shield Guarantee. Now, here is our Head of Growth to discuss our customers and route flywheel.",
        "transition": "(Verbal Handoff to Speaker 3: Growth Lead)"
    },
    {
        "num": 6,
        "category": "Target Customer & Market",
        "speaker": "Growth Lead",
        "target_time": "3:00 – 3:45 (45s)",
        "rubric_tag": "Target Market (20 Pts) — Suburban Sarah & David ICP + Sizing",
        "title": "OUR CONSUMER: \"SUBURBAN SARAH & DAVID\"",
        "subtitle": "Luxury Single-Family Homes Across Lake Minnetonka & The Twin Cities",
        "script": "Thank you. Let’s talk about who our customers are. Our ideal customer is 'Suburban Sarah and David'—busy homeowners living in luxury single-family homes valued between $650,000 and $2.5 Million across suburban hubs like Lake Minnetonka, Wayzata, Edina, and Eden Prairie. These homes have 35 to 60 large windows. They have strict HOA standards and heavy suburban dust. Most importantly, these homeowners value their time: they don't want to spend their weekend calling three contractors and waiting for callbacks. They want an effortless, high-trust solution. In the Twin Cities metro alone, this luxury segment represents a $42 Million beachhead market, sitting inside an $18.4 Billion national exterior surface care industry.",
        "transition": "Now let's examine our neighborhood route clustering strategy."
    },
    {
        "num": 7,
        "category": "Neighborhood Route Clustering",
        "speaker": "Growth Lead",
        "target_time": "3:45 – 4:30 (45s)",
        "rubric_tag": "GTM Strategy (5 Pts) — 500-meter cul-de-sac clustering",
        "title": "THE 500-METER CUL-DE-SAC FLYWHEEL",
        "subtitle": "Passing Transit Efficiency Directly Back to Neighborhood Homeowners",
        "script": "Our customer acquisition engine is built on solving the biggest cost in field services: windshield drive time. When a homeowner on a cul-de-sac books a job, our platform automatically identifies nearby homes within 500 meters and sends a geo-targeted route offer: 'Our pure-water truck is already on your block this Thursday—tap here to claim an automatic $40 neighbor discount.' Neighbors see our branded Ford Transit rig and carbon fiber poles right outside their window. These clustered leads convert at 3.2 times the industry average. And because our crew just rolls the hose across the driveway, our transit time drops from 45 minutes to zero. We pass those savings directly back to the homeowner as a discount while increasing our daily revenue per truck.",
        "transition": "Let's see how our consumer experience compares to traditional cleaners."
    },
    {
        "num": 8,
        "category": "Competitive Comparison",
        "speaker": "Growth Lead",
        "target_time": "4:30 – 5:10 (40s)",
        "rubric_tag": "Competition (5 Pts) — Direct consumer experience contrast",
        "title": "WHY HOMEOWNERS CHOOSE US",
        "subtitle": "Contrasting Modern Convenience Against Traditional Cleaners",
        "script": "When homeowners look for window cleaning, their current options are frustrating: unverified solo handymen with clipboards or large franchises using outdated scheduling systems. Traditional cleaners take hours or days to quote, show up with garden hoses and ladders, leave soapy film on glass, and offer zero guarantees. We offer a completely modern consumer experience: sub-60-second instant quotes, transparent 3-tier pricing, ground-level pure-water filtration cleaning, zero software surcharges, and an automated 48-Hour Rain Shield. We don’t just clean windows; we give homeowners peace of mind.",
        "transition": "Now let's examine our recurring model and the data asset."
    },
    {
        "num": 9,
        "category": "Recurring Care & Data Engine",
        "speaker": "Growth Lead",
        "target_time": "5:10 – 5:50 (40s)",
        "rubric_tag": "Revenue Model & Data Asset (5 Pts) — Subscriptions & Platform Data",
        "title": "RECURRING CARE & THE DATA FLYWHEEL",
        "subtitle": "$42–$65/mo Memberships Fueling Proprietary Field Intelligence",
        "script": "Our financial model converts one-off seasonal cleans into predictable recurring cash flow. A single service truck generates $14,800 per month at a 68% field gross margin. By anchoring homeowners at a $300 initial clean and converting forty-two percent into $42 to $65 per month memberships, we eliminate the seasonal winter cliff. But just as importantly: we are focused on getting customers and technicians onto the platform to capture proprietary operating data. Every wash captures route density, pricing elasticity by neighborhood, and real-time filtration performance. This data continuously trains our algorithms—making our pricing sharper, our routes denser, and our operations more efficient with every customer we serve. Now, back to our founder, Mason Gerry.",
        "transition": "(Verbal Handoff to Speaker 1: Mason Gerry)"
    },
    {
        "num": 10,
        "category": "Empirical Field Validation",
        "speaker": "Mason Gerry (Founder & CEO)",
        "target_time": "5:50 – 6:30 (40s)",
        "rubric_tag": "Traction & Verification (20 Pts) — Twin Cities live operations",
        "title": "OPERATING DAILY IN THE TWIN CITIES",
        "subtitle": "Real Homes. Real Paying Customers. Proven Operational Metrics.",
        "script": "What sets us apart is that this is not an academic exercise or a mock prototype. We are operating live right now in the Twin Cities with real paying homeowners. Our instant 3-tier proposals have achieved a sixty-one percent quote-to-close rate—nearly triple the industry average. Forty-two percent of our customers are already enrolled in recurring monthly maintenance. Our platform backend is battle-tested: fifty-three automated regression tests pass with zero failures, proving our double-booking prevention, AI policy guardrails, and IoT sensor envelopes are fully production-grade. Consumers love the speed, and technicians love the efficiency.",
        "transition": "Now, let's look at our next step and expansion."
    },
    {
        "num": 11,
        "category": "Expansion & Call to Action",
        "speaker": "Mason Gerry (Founder & CEO)",
        "target_time": "6:30 – 7:00 (30s)",
        "rubric_tag": "Closing & Call to Action (5 Pts) — Strict 7:00 Execution",
        "title": "EXPANDING TO DENVER SPRING 2027",
        "subtitle": "Fast Response. Quick Quotes. Guaranteed Perfect Job Done.",
        "script": "Our proving ground in Minnesota has validated the model. By combining instant AI speed-to-lead with connected pure-water truck rigs, we've created a residential window washing experience that consumers love and recommend. Next spring, we are taking this proven playbook to our first expansion market: Denver, Colorado. [PAUSE] So if you want a fast response, a quick quote, and a guaranteed perfect job done, consider us for next spring when we open up our Denver location! Thank you, and we look forward to your questions.",
        "transition": "Open for Q&A with the Investors."
    }
]

def build_presentation(output_pptx_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    for s in SLIDES_DATA:
        slide = prs.slides.add_slide(blank_layout)
        set_slide_background(slide)
        add_cool_transition(slide)
        add_header(slide, s['num'], s['category'], s['speaker'], s['target_time'], s['rubric_tag'], s['title'], s['subtitle'])
        add_footer(slide, s['num'])
        set_speaker_notes(slide, s)

        num = s['num']

        # SLIDE 1: Hero Hook (Clean, Minimalist, B2C)
        if num == 1:
            card_w = 3.64
            for idx, (val, label, sub) in enumerate([
                ("< 60s", "Speed-to-Lead", "Instant automated quote"),
                ("Water-Fed", "Pure-Water System", "Zero squeegee film or soap"),
                ("100%", "Spot-Free Guarantee", "48-Hour Rain Shield")
            ]):
                add_card(slide, 0.9 + (idx * 3.95), 1.95, card_w, 2.3, BORDER_SUBTLE, CARD_BG)
                box = slide.shapes.add_textbox(Inches(1.05 + (idx * 3.95)), Inches(2.2), Inches(card_w - 0.3), Inches(1.8))
                tf = box.text_frame
                tf.word_wrap = True
                p1 = tf.paragraphs[0]
                p1.alignment = PP_ALIGN.CENTER
                p1.text = val
                p1.font.size = Pt(36)
                p1.font.bold = True
                p1.font.color.rgb = ACCENT_CYAN
                p2 = tf.add_paragraph()
                p2.alignment = PP_ALIGN.CENTER
                p2.text = label
                p2.font.size = Pt(14)
                p2.font.bold = True
                p2.font.color.rgb = TEXT_WHITE
                p3 = tf.add_paragraph()
                p3.alignment = PP_ALIGN.CENTER
                p3.text = sub
                p3.font.size = Pt(11)
                p3.font.color.rgb = TEXT_MUTED

            add_card(slide, 0.9, 4.45, 11.533, 2.2, BORDER_CYAN, INNER_CARD_BG)
            h_box = slide.shapes.add_textbox(Inches(1.2), Inches(4.7), Inches(10.933), Inches(1.7))
            htf = h_box.text_frame
            htf.word_wrap = True
            hp1 = htf.paragraphs[0]
            hp1.text = "TURNING RESIDENTIAL WINDOW CLEANING INTO A SEAMLESS CONSUMER SERVICE"
            hp1.font.size = Pt(14)
            hp1.font.bold = True
            hp1.font.color.rgb = ACCENT_CYAN
            hp2 = htf.add_paragraph()
            hp2.text = (
                "\n• Live Proving Ground: Gerry's Window Services operating across Lake Minnetonka and the Twin Cities.\n"
                "• The Consumer Difference: Homeowners skip phone tag and get an instant quote on their phone in 60 seconds.\n"
                "• Continuous Process Optimization: Evolving from traditional squeegees to water-fed filtration poles for safer, faster, spotless glass."
            )
            hp2.font.size = Pt(12)
            hp2.font.color.rgb = TEXT_LIGHT

        # SLIDE 2: Consumer Problem (4.2h lag & 78% lost)
        elif num == 2:
            card_w = 5.6
            add_card(slide, 0.9, 1.95, card_w, 2.3, BORDER_SUBTLE, CARD_BG)
            box1 = slide.shapes.add_textbox(Inches(1.1), Inches(2.2), Inches(card_w - 0.4), Inches(1.8))
            tf1 = box1.text_frame
            tf1.word_wrap = True
            p1 = tf1.paragraphs[0]
            p1.alignment = PP_ALIGN.CENTER
            p1.text = "4.2 HOURS"
            p1.font.size = Pt(44)
            p1.font.bold = True
            p1.font.color.rgb = ACCENT_CYAN
            p2 = tf1.add_paragraph()
            p2.alignment = PP_ALIGN.CENTER
            p2.text = "Average Contractor Callback Lag"
            p2.font.size = Pt(13)
            p2.font.bold = True
            p2.font.color.rgb = TEXT_WHITE
            p3 = tf1.add_paragraph()
            p3.alignment = PP_ALIGN.CENTER
            p3.text = "Consumers are stuck waiting while contractors work on ladders"
            p3.font.size = Pt(11)
            p3.font.color.rgb = TEXT_MUTED

            add_card(slide, 6.833, 1.95, card_w, 2.3, BORDER_SUBTLE, CARD_BG)
            box2 = slide.shapes.add_textbox(Inches(7.033), Inches(2.2), Inches(card_w - 0.4), Inches(1.8))
            tf2 = box2.text_frame
            tf2.word_wrap = True
            p4 = tf2.paragraphs[0]
            p4.alignment = PP_ALIGN.CENTER
            p4.text = "78%"
            p4.font.size = Pt(44)
            p4.font.bold = True
            p4.font.color.rgb = ACCENT_CYAN
            p5 = tf2.add_paragraph()
            p5.alignment = PP_ALIGN.CENTER
            p5.text = "Hire Whoever Answers First"
            p5.font.size = Pt(13)
            p5.font.bold = True
            p5.font.color.rgb = TEXT_WHITE
            p6 = tf2.add_paragraph()
            p6.alignment = PP_ALIGN.CENTER
            p6.text = "Speed is the #1 deciding factor for residential homeowners"
            p6.font.size = Pt(11)
            p6.font.color.rgb = TEXT_MUTED

            add_card(slide, 0.9, 4.45, 11.533, 2.2, BORDER_SUBTLE, INNER_CARD_BG)
            qbox = slide.shapes.add_textbox(Inches(1.2), Inches(4.7), Inches(10.933), Inches(1.7))
            qtf = qbox.text_frame
            qtf.word_wrap = True
            qp1 = qtf.paragraphs[0]
            qp1.text = "PRIMARY RESEARCH AUDIT (N = 45 HOMEOWNER SURVEYS | N = 18 IN-DEPTH INTERVIEWS)"
            qp1.font.size = Pt(11)
            qp1.font.bold = True
            qp1.font.color.rgb = ACCENT_CYAN
            qp2 = qtf.add_paragraph()
            qp2.text = (
                "\n\"I always hire whoever gives me a confirmed price first. I don't have time to wait 24 hours for three contractors to call me back.\"\n"
                "— Lake Minnetonka Homeowner Interview\n\n"
                "• Homeowners wait an average of 14 hours for an estimate callback from traditional window washers.\n"
                "• Win rates drop 3.9x if a contractor takes longer than 30 minutes to provide an estimate."
            )
            qp2.font.size = Pt(11)
            qp2.font.color.rgb = TEXT_LIGHT

        # SLIDE 3: Continuous Optimization (Squeegee to Filter)
        elif num == 3:
            card_w = 5.6
            # Left Card: Traditional Squeegee
            add_card(slide, 0.9, 1.95, card_w, 3.4, BORDER_SUBTLE, CARD_BG)
            lbox = slide.shapes.add_textbox(Inches(1.15), Inches(2.2), Inches(card_w - 0.5), Inches(2.9))
            ltf = lbox.text_frame
            ltf.word_wrap = True
            lp1 = ltf.paragraphs[0]
            lp1.text = "THE OLD WAY: SQUEEGEE & BUCKET"
            lp1.font.size = Pt(16)
            lp1.font.bold = True
            lp1.font.color.rgb = TEXT_MUTED
            lp2 = ltf.add_paragraph()
            lp2.text = "Traditional Manual Labor"
            lp2.font.size = Pt(13)
            lp2.font.bold = True
            lp2.font.color.rgb = TEXT_WHITE
            lp3 = ltf.add_paragraph()
            lp3.text = (
                "\n• Dangerous 24ft ladder climbing against homeowner siding.\n"
                "• Soapy bucket water leaves sticky film that attracts dust.\n"
                "• Slow manual hand-wiping: 2 to 3 hours per estate.\n"
                "• Squeegee drips leave dirty runoff on frames and window tracks."
            )
            lp3.font.size = Pt(11)
            lp3.font.color.rgb = TEXT_LIGHT

            # Right Card: Gerry's Filter Optimization
            add_card(slide, 6.833, 1.95, card_w, 3.4, BORDER_CYAN, INNER_CARD_BG)
            rbox = slide.shapes.add_textbox(Inches(7.08), Inches(2.2), Inches(card_w - 0.5), Inches(2.9))
            rtf = rbox.text_frame
            rtf.word_wrap = True
            rp1 = rtf.paragraphs[0]
            rp1.text = "THE OPTIMIZATION: PURE-WATER FILTRATION"
            rp1.font.size = Pt(16)
            rp1.font.bold = True
            rp1.font.color.rgb = ACCENT_CYAN
            rp2 = rtf.add_paragraph()
            rp2.text = "Water-Fed Carbon Fiber Poles"
            rp2.font.size = Pt(13)
            rp2.font.bold = True
            rp2.font.color.rgb = TEXT_WHITE
            rp3 = rtf.add_paragraph()
            rp3.text = (
                "\n• 100% ground-level reach up to 3 stories — zero ladder damage.\n"
                "• Multi-stage filtration strips ions so water acts as a natural cleaner.\n"
                "• Thoroughly rinses glass, frames, and sills clean.\n"
                "• Dries naturally spot-free with zero soaps, chemicals, or streaks."
            )
            rp3.font.size = Pt(11)
            rp3.font.color.rgb = TEXT_LIGHT

            # Bottom Summary Bar
            add_card(slide, 0.9, 5.5, 11.533, 1.15, BORDER_CYAN, CARD_BG)
            bbox = slide.shapes.add_textbox(Inches(1.2), Inches(5.65), Inches(10.933), Inches(0.85))
            btf = bbox.text_frame
            bp = btf.paragraphs[0]
            bp.text = "THE CONTINUOUS ADVANTAGE: 2.5x faster turnaround per home, zero property damage risk, and spotless glass that stays cleaner longer."
            bp.font.size = Pt(12)
            bp.font.bold = True
            bp.font.color.rgb = TEXT_WHITE

        # SLIDE 4: 3-Tier Consumer Packages (<60s Quote)
        elif num == 4:
            card_w = 3.64
            tiers = [
                ("BRONZE", "$300", "Exterior Detailing", "• All exterior glass cleaned spot-free\n• Window frame and sill rinse\n• 48-Hour Rain Shield Guarantee"),
                ("SILVER", "$450", "Inside & Outside", "• Exterior pure-water clean\n• Interior glass detail\n• Track wipe-down and vacuum\n• 48-Hour Rain Shield Guarantee"),
                ("GOLD", "$650", "Complete Estate Care", "• Full interior & exterior detail\n• Deep screen wash & restoration\n• Track, sill, and frame restoration\n• Priority seasonal scheduling")
            ]
            for idx, (tname, price, sub, desc) in enumerate(tiers):
                is_hero = idx == 1
                bcolor = BORDER_CYAN if is_hero else BORDER_SUBTLE
                add_card(slide, 0.9 + (idx * 3.95), 1.95, card_w, 3.4, bcolor, CARD_BG)
                box = slide.shapes.add_textbox(Inches(1.1 + (idx * 3.95)), Inches(2.15), Inches(card_w - 0.4), Inches(3.0))
                tf = box.text_frame
                tf.word_wrap = True
                p1 = tf.paragraphs[0]
                p1.text = tname
                p1.font.size = Pt(12)
                p1.font.bold = True
                p1.font.color.rgb = ACCENT_CYAN if is_hero else TEXT_MUTED
                p2 = tf.add_paragraph()
                p2.text = price
                p2.font.size = Pt(32)
                p2.font.bold = True
                p2.font.color.rgb = TEXT_WHITE
                p3 = tf.add_paragraph()
                p3.text = sub
                p3.font.size = Pt(12)
                p3.font.bold = True
                p3.font.color.rgb = ACCENT_CYAN if is_hero else TEXT_LIGHT
                p4 = tf.add_paragraph()
                p4.text = f"\n{desc}"
                p4.font.size = Pt(10.5)
                p4.font.color.rgb = TEXT_MUTED

            add_card(slide, 0.9, 5.5, 11.533, 1.15, BORDER_CYAN, INNER_CARD_BG)
            fbox = slide.shapes.add_textbox(Inches(1.2), Inches(5.65), Inches(10.933), Inches(0.85))
            ftf = fbox.text_frame
            fp = ftf.paragraphs[0]
            fp.text = "THE ZERO-FRICTION FLOW: Enter Address ➔ Instant 3-Tier Quote in < 60s ➔ 1-Tap Arrival Slot Selection"
            fp.font.size = Pt(12)
            fp.font.bold = True
            fp.font.color.rgb = ACCENT_CYAN

        # SLIDE 5: 4IR Tech (AI + Filter Telematics)
        elif num == 5:
            card_w = 5.6
            add_card(slide, 0.9, 1.95, card_w, 3.4, BORDER_CYAN, CARD_BG)
            lbox = slide.shapes.add_textbox(Inches(1.15), Inches(2.2), Inches(card_w - 0.5), Inches(2.9))
            ltf = lbox.text_frame
            ltf.word_wrap = True
            lp1 = ltf.paragraphs[0]
            lp1.text = "PILLAR 1: GROUNDED AI AUTO-PILOT"
            lp1.font.size = Pt(13)
            lp1.font.bold = True
            lp1.font.color.rgb = ACCENT_CYAN
            lp2 = ltf.add_paragraph()
            lp2.text = (
                "\n• < 60-Second Lead Response: Instantly engages customer inquiries.\n"
                "• Dynamic Pricing Engine: Computes exact window count and square footage.\n"
                "• TCPA Quiet Hours Shield: Compliant 8:00 AM – 8:00 PM local messaging.\n"
                "• Smart Objection Copilot: Answers questions with verified service details."
            )
            lp2.font.size = Pt(11)
            lp2.font.color.rgb = TEXT_LIGHT

            add_card(slide, 6.833, 1.95, card_w, 3.4, BORDER_CYAN, CARD_BG)
            rbox = slide.shapes.add_textbox(Inches(7.08), Inches(2.2), Inches(card_w - 0.5), Inches(2.9))
            rtf = rbox.text_frame
            rtf.word_wrap = True
            rp1 = rtf.paragraphs[0]
            rp1.text = "PILLAR 2: ON-BOARD FILTRATION TELEMATICS"
            rp1.font.size = Pt(13)
            rp1.font.bold = True
            rp1.font.color.rgb = ACCENT_CYAN
            rp2 = rtf.add_paragraph()
            rp2.text = (
                "\n• Dual Inline Purity Sensors: Monitors filtration efficiency in real time.\n"
                "• Pure Filtered Water Stream: Ensures zero dissolved solids on glass.\n"
                "• Digital Clarity Certificate: Encrypted purity proof sent via SMS.\n"
                "• 48-Hour Rain Shield: Automated re-clean guarantee if rain spots within 48h."
            )
            rp2.font.size = Pt(11)
            rp2.font.color.rgb = TEXT_LIGHT

            add_card(slide, 0.9, 5.5, 11.533, 1.15, BORDER_SUBTLE, INNER_CARD_BG)
            bbox = slide.shapes.add_textbox(Inches(1.2), Inches(5.65), Inches(10.933), Inches(0.85))
            btf = bbox.text_frame
            bp = btf.paragraphs[0]
            bp.text = "OPERATIONAL GUARANTEE: Technology confirms our pure-water filtration is performing at 100% before water touches customer glass."
            bp.font.size = Pt(12)
            bp.font.bold = True
            bp.font.color.rgb = TEXT_WHITE

        # SLIDE 6: Target Customer
        elif num == 6:
            card_w = 5.6
            add_card(slide, 0.9, 1.95, card_w, 4.7, BORDER_CYAN, CARD_BG)
            lbox = slide.shapes.add_textbox(Inches(1.2), Inches(2.2), Inches(card_w - 0.6), Inches(4.2))
            ltf = lbox.text_frame
            ltf.word_wrap = True
            lp1 = ltf.paragraphs[0]
            lp1.text = "IDEAL HOMEOWNER PROFILE"
            lp1.font.size = Pt(13)
            lp1.font.bold = True
            lp1.font.color.rgb = ACCENT_CYAN
            lp2 = ltf.add_paragraph()
            lp2.text = "\"Suburban Sarah & David\""
            lp2.font.size = Pt(20)
            lp2.font.bold = True
            lp2.font.color.rgb = TEXT_WHITE
            lp3 = ltf.add_paragraph()
            lp3.text = (
                "\n• Geography: Lake Minnetonka, Wayzata, Edina, Eden Prairie.\n\n"
                "• Home Value: $650,000 to $2.5 Million with 35 to 60 windows.\n\n"
                "• Lifestyle: Dual-income professionals, high pride of ownership, strict HOA compliance, zero free time.\n\n"
                "• Buying Habits: Value speed, reliability, and modern communication. Enthusiastic adopters of $42–$65/mo recurring subscriptions."
            )
            lp3.font.size = Pt(11.5)
            lp3.font.color.rgb = TEXT_LIGHT

            add_card(slide, 6.833, 1.95, card_w, 4.7, BORDER_SUBTLE, INNER_CARD_BG)
            rbox = slide.shapes.add_textbox(Inches(7.133), Inches(2.2), Inches(card_w - 0.6), Inches(4.2))
            rtf = rbox.text_frame
            rtf.word_wrap = True
            rp1 = rtf.paragraphs[0]
            rp1.text = "MARKET OPPORTUNITY"
            rp1.font.size = Pt(13)
            rp1.font.bold = True
            rp1.font.color.rgb = ACCENT_CYAN
            rp2 = rtf.add_paragraph()
            rp2.text = (
                "\n$42 MILLION BEACHHEAD (SOM)\n"
                "140,000 target single-family homes across the Twin Cities luxury suburban corridor.\n\n"
                "$18.4 BILLION TRADE MARKET (SAM)\n"
                "US Residential and Commercial exterior window cleaning and soft-washing.\n\n"
                "$657 BILLION HOME SERVICES (TAM)\n"
                "Total property maintenance and home improvement economy."
            )
            rp2.font.size = Pt(11.5)
            rp2.font.color.rgb = TEXT_LIGHT

        # SLIDE 7: Cul-de-Sac Clustering
        elif num == 7:
            card_w = 3.64
            steps = [
                ("1. ANCHOR BOOKING", "Home A Books Clean", "Customer on Bushaway Rd books a $450 clean on the portal."),
                ("2. AUTO-ALERT", "30 Neighbors Alerted", "APEX texts nearby homes: 'Truck is on your street Thursday for $40 off.'"),
                ("3. CLUSTERED ROUTE", "3.2x Conversion Rate", "Neighbors see rig outside; crew simply rolls hose across driveway with $0 transit.")
            ]
            for idx, (st, title, desc) in enumerate(steps):
                add_card(slide, 0.9 + (idx * 3.95), 1.95, card_w, 3.4, BORDER_SUBTLE, CARD_BG)
                box = slide.shapes.add_textbox(Inches(1.1 + (idx * 3.95)), Inches(2.2), Inches(card_w - 0.4), Inches(2.9))
                tf = box.text_frame
                tf.word_wrap = True
                p1 = tf.paragraphs[0]
                p1.text = st
                p1.font.size = Pt(11)
                p1.font.bold = True
                p1.font.color.rgb = ACCENT_CYAN
                p2 = tf.add_paragraph()
                p2.text = title
                p2.font.size = Pt(16)
                p2.font.bold = True
                p2.font.color.rgb = TEXT_WHITE
                p3 = tf.add_paragraph()
                p3.text = f"\n{desc}"
                p3.font.size = Pt(11)
                p3.font.color.rgb = TEXT_LIGHT

            add_card(slide, 0.9, 5.5, 11.533, 1.15, BORDER_CYAN, INNER_CARD_BG)
            bbox = slide.shapes.add_textbox(Inches(1.2), Inches(5.65), Inches(10.933), Inches(0.85))
            btf = bbox.text_frame
            bp = btf.paragraphs[0]
            bp.text = "THE WIN-WIN: Homeowners get an instant $40 neighborhood route discount; our trucks eliminate 60% of drive time."
            bp.font.size = Pt(12)
            bp.font.bold = True
            bp.font.color.rgb = ACCENT_CYAN

        # SLIDE 8: Competitive Comparison Table
        elif num == 8:
            table_shape = slide.shapes.add_table(5, 3, Inches(0.9), Inches(1.95), Inches(11.533), Inches(3.4))
            table = table_shape.table
            table.columns[0].width = Inches(3.533)
            table.columns[1].width = Inches(4.0)
            table.columns[2].width = Inches(4.0)

            headers = ["CUSTOMER EXPERIENCE", "TRADITIONAL CLEANERS", "GERRY'S WINDOW SERVICES"]
            for col_idx, h in enumerate(headers):
                cell = table.cell(0, col_idx)
                cell.fill.solid()
                cell.fill.fore_color.rgb = INNER_CARD_BG if col_idx < 2 else CARD_BG
                p = cell.text_frame.paragraphs[0]
                p.text = h
                p.font.size = Pt(11)
                p.font.bold = True
                p.font.color.rgb = ACCENT_CYAN if col_idx == 2 else TEXT_MUTED

            rows_data = [
                ("Speed to Quote", "4+ Hours / 2-Day Wait", "< 60 Seconds Instant Mobile Quote"),
                ("Cleaning Process", "Ladders, squeegees, soapy runoff", "Water-Fed Filtration Poles (Ground-Level)"),
                ("Booking & Pricing", "Paper door hanger or static PDF", "Transparent 3-Tier Interactive Proposal"),
                ("Customer Guarantee", "None / \"All Sales Final\"", "48-Hour Automated Rain Shield Guarantee")
            ]
            for row_idx, r in enumerate(rows_data, start=1):
                for col_idx, text in enumerate(r):
                    cell = table.cell(row_idx, col_idx)
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = CARD_BG
                    p = cell.text_frame.paragraphs[0]
                    p.text = text
                    p.font.size = Pt(11)
                    if col_idx == 0:
                        p.font.bold = True
                        p.font.color.rgb = TEXT_WHITE
                    elif col_idx == 2:
                        p.font.bold = True
                        p.font.color.rgb = ACCENT_CYAN
                    else:
                        p.font.color.rgb = TEXT_MUTED

            add_card(slide, 0.9, 5.5, 11.533, 1.15, BORDER_SUBTLE, INNER_CARD_BG)
            bbox = slide.shapes.add_textbox(Inches(1.2), Inches(5.65), Inches(10.933), Inches(0.85))
            btf = bbox.text_frame
            bp = btf.paragraphs[0]
            bp.text = "THE VERDICT: Traditional window cleaning is slow and risky. Gerry's delivers speed, safety, and guaranteed clarity."
            bp.font.size = Pt(12)
            bp.font.bold = True
            bp.font.color.rgb = TEXT_WHITE

        # SLIDE 9: Recurring Memberships & The Data Asset
        elif num == 9:
            card_w = 5.6
            add_card(slide, 0.9, 1.95, card_w, 4.7, BORDER_CYAN, CARD_BG)
            lbox = slide.shapes.add_textbox(Inches(1.2), Inches(2.2), Inches(card_w - 0.6), Inches(4.2))
            ltf = lbox.text_frame
            ltf.word_wrap = True
            lp1 = ltf.paragraphs[0]
            lp1.text = "RECURRING HOMEOWNER CARE"
            lp1.font.size = Pt(13)
            lp1.font.bold = True
            lp1.font.color.rgb = ACCENT_CYAN
            lp2 = ltf.add_paragraph()
            lp2.text = "$42–$65/mo Autopay"
            lp2.font.size = Pt(22)
            lp2.font.bold = True
            lp2.font.color.rgb = TEXT_WHITE
            lp3 = ltf.add_paragraph()
            lp3.text = (
                "\n• 42% Conversion: Homeowners convert from 1-off clean to recurring care.\n\n"
                "• 68% Field Gross Margin: High-efficiency water-fed pole cleaning.\n\n"
                "• $14,800/mo Revenue per active service truck.\n\n"
                "• Eliminates the Winter Cliff: Smooth recurring cash flow year-round."
            )
            lp3.font.size = Pt(11.5)
            lp3.font.color.rgb = TEXT_LIGHT

            add_card(slide, 6.833, 1.95, card_w, 4.7, BORDER_SUBTLE, INNER_CARD_BG)
            rbox = slide.shapes.add_textbox(Inches(7.133), Inches(2.2), Inches(card_w - 0.6), Inches(4.2))
            rtf = rbox.text_frame
            rtf.word_wrap = True
            rp1 = rtf.paragraphs[0]
            rp1.text = "THE PROPRIETARY DATA ASSET"
            rp1.font.size = Pt(13)
            rp1.font.bold = True
            rp1.font.color.rgb = ACCENT_CYAN
            rp2 = rtf.add_paragraph()
            rp2.text = "Platform Usage Intelligence"
            rp2.font.size = Pt(22)
            rp2.font.bold = True
            rp2.font.color.rgb = TEXT_WHITE
            rp3 = rtf.add_paragraph()
            rp3.text = (
                "\n• Route Density Modeling: Real-time mapping of neighborhood cluster conversion.\n\n"
                "• Pricing Elasticity: Dynamic quote optimization across suburban zip codes.\n\n"
                "• Equipment Telematics: Live monitoring of filtration life and flow rates.\n\n"
                "• Every wash trains our operating algorithms, widening our competitive moat."
            )
            rp3.font.size = Pt(11.5)
            rp3.font.color.rgb = TEXT_LIGHT

        # SLIDE 10: Empirical Field Traction
        elif num == 10:
            card_w = 3.64
            stats = [
                ("61%", "Quote-to-Close Rate", "Nearly triple the industry ~22% average"),
                ("42%", "Recurring Memberships", "Enrolled in $42–$65/mo recurring autopay"),
                ("100%", "Spot-Free Quality", "Zero callbacks or streak disputes recorded")
            ]
            for idx, (val, title, sub) in enumerate(stats):
                add_card(slide, 0.9 + (idx * 3.95), 1.95, card_w, 2.3, BORDER_SUBTLE, CARD_BG)
                box = slide.shapes.add_textbox(Inches(1.05 + (idx * 3.95)), Inches(2.2), Inches(card_w - 0.3), Inches(1.8))
                tf = box.text_frame
                tf.word_wrap = True
                p1 = tf.paragraphs[0]
                p1.alignment = PP_ALIGN.CENTER
                p1.text = val
                p1.font.size = Pt(40)
                p1.font.bold = True
                p1.font.color.rgb = ACCENT_CYAN
                p2 = tf.add_paragraph()
                p2.alignment = PP_ALIGN.CENTER
                p2.text = title
                p2.font.size = Pt(14)
                p2.font.bold = True
                p2.font.color.rgb = TEXT_WHITE
                p3 = tf.add_paragraph()
                p3.alignment = PP_ALIGN.CENTER
                p3.text = sub
                p3.font.size = Pt(11)
                p3.font.color.rgb = TEXT_MUTED

            add_card(slide, 0.9, 4.45, 11.533, 2.2, BORDER_CYAN, INNER_CARD_BG)
            vbox = slide.shapes.add_textbox(Inches(1.2), Inches(4.7), Inches(10.933), Inches(1.7))
            vtf = vbox.text_frame
            vtf.word_wrap = True
            vp1 = vtf.paragraphs[0]
            vp1.text = "TECHNICAL & OPERATIONAL VALIDATION (53 / 53 TESTS PASSING)"
            vp1.font.size = Pt(12)
            vp1.font.bold = True
            vp1.font.color.rgb = ACCENT_CYAN
            vp2 = vtf.add_paragraph()
            vp2.text = (
                "\n• Production-hardened software verified by 53 automated regression tests in test_platform.rb.\n"
                "• Strict double-booking prevention ensures customer arrival windows are guaranteed.\n"
                "• Deployed live on Port 3000 — real customers, real trucks, real clean glass."
            )
            vp2.font.size = Pt(11.5)
            vp2.font.color.rgb = TEXT_LIGHT

        # SLIDE 11: Denver Launch & Call to Action
        elif num == 11:
            add_card(slide, 0.9, 1.95, 11.533, 4.7, BORDER_CYAN, INNER_CARD_BG)
            cbox = slide.shapes.add_textbox(Inches(1.3), Inches(2.2), Inches(10.733), Inches(4.2))
            ctf = cbox.text_frame
            ctf.word_wrap = True
            
            cp1 = ctf.paragraphs[0]
            cp1.text = "NEXT EXPANSION MARKET: SPRING 2027"
            cp1.font.size = Pt(13)
            cp1.font.bold = True
            cp1.font.color.rgb = ACCENT_CYAN

            cp2 = ctf.add_paragraph()
            cp2.text = "DENVER, COLORADO"
            cp2.font.size = Pt(36)
            cp2.font.bold = True
            cp2.font.color.rgb = TEXT_WHITE

            cp3 = ctf.add_paragraph()
            cp3.text = (
                "\n\"If you want a fast response, a quick quote, and a guaranteed perfect job done, "
                "consider us for next spring when we open up our Denver location!\""
            )
            cp3.font.size = Pt(18)
            cp3.font.bold = True
            cp3.font.color.rgb = ACCENT_CYAN

            cp4 = ctf.add_paragraph()
            cp4.text = (
                "\n• Live Proving Ground: Lake Minnetonka & Twin Cities Metro, MN\n"
                "• Contact: Mason Gerry • Founder & CEO\n"
                "• Live Platform: http://localhost:3000\n\n"
                "Thank you — open for Investor Q&A."
            )
            cp4.font.size = Pt(12)
            cp4.font.color.rgb = TEXT_MUTED

    prs.save(output_pptx_path)
    print(f"✅ Generated Full-Blown Presentation PPTX: {output_pptx_path}")

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, "public")

    pptx_path = os.path.join(base_dir, "APEX_Field_OS_Full_Presentation.pptx")
    public_pptx = os.path.join(public_dir, "APEX_Field_OS_Full_Presentation.pptx")
    root_old_pptx = os.path.join(base_dir, "APEX_Field_OS_Investor_Pitch_Deck.pptx")
    public_old_pptx = os.path.join(public_dir, "APEX_Field_OS_Investor_Pitch_Deck.pptx")

    build_presentation(pptx_path)
    subprocess.run(["cp", pptx_path, public_pptx])
    subprocess.run(["cp", pptx_path, root_old_pptx])
    subprocess.run(["cp", pptx_path, public_old_pptx])
    print("🎉 High-impact B2C presentation generated and synced to all endpoints!")

if __name__ == "__main__":
    main()
