#!/usr/bin/env python3
"""
Generate a presentation PDF (16:9 widescreen) and PPTX presentation for direct Google Slides import.
"""
import os
import subprocess
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

SLIDES_DATA = [
    {
        "num": 1,
        "category": "IDEA & STORY OVERVIEW",
        "speaker": "Mason Gerry (Founder & CEO)",
        "targetTime": "0:30 (Target: 0:30)",
        "rubricTag": "Rubric: Idea/Story Overview (15 Pts) • Target: < 30s Hook",
        "title": "APEX FIELD OS: AUTONOMOUS EXTERIOR INFRASTRUCTURE",
        "subtitle": "Disrupting the $657B Home Services Economy Through Grounded AI & Industrial IoT Pure-Water Telematics",
        "body_html": """
        <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:28px; height:100%; align-items:center;">
          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(56,189,248,0.3); border-radius:16px; padding:28px; box-shadow:0 15px 35px rgba(0,0,0,0.5);">
            <div style="display:flex; gap:10px; margin-bottom:16px;">
              <span class="badge blue">4IR VENTURE</span>
              <span class="badge green">LIVE OPERATIONAL BEACHHEAD</span>
              <span class="badge purple">TWIN CITIES, MN</span>
            </div>
            <h2 style="font-size:1.8rem; color:#f8fafc; margin:0 0 14px 0; font-weight:800; line-height:1.25;">
              Turning manual window cleaning into a self-driving, high-margin subscription machine.
            </h2>
            <p style="color:#94a3b8; font-size:1.05rem; line-height:1.6; margin-bottom:20px;">
              Born on a 24-foot ladder in Wayzata, MN missing customer quote calls and fighting mineral water spots. We engineered APEX to automate intake, dynamic pricing, and dispatch, paired with IoT pure-water sensor telematics.
            </p>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
              <div style="background:rgba(0,0,0,0.4); padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.06); text-align:center;">
                <div style="font-size:1.5rem; font-weight:900; color:#38bdf8;">&lt; 60s</div>
                <div style="font-size:0.75rem; color:#cbd5e1; font-weight:600; margin-top:4px;">Speed-to-Lead</div>
              </div>
              <div style="background:rgba(0,0,0,0.4); padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.06); text-align:center;">
                <div style="font-size:1.5rem; font-weight:900; color:#34d399;">000 PPM</div>
                <div style="font-size:0.75rem; color:#cbd5e1; font-weight:600; margin-top:4px;">IoT Purity Proof</div>
              </div>
              <div style="background:rgba(0,0,0,0.4); padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.06); text-align:center;">
                <div style="font-size:1.5rem; font-weight:900; color:#a5b4fc;">$42–$65</div>
                <div style="font-size:0.75rem; color:#cbd5e1; font-weight:600; margin-top:4px;">Monthly Autopay</div>
              </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:22px;">
              <div style="font-size:0.8rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">
                EXECUTIVE SUMMARY & PROVING GROUND
              </div>
              <div style="font-size:0.95rem; color:#e2e8f0; line-height:1.5; margin-bottom:10px;">
                <strong>Proving Fleet:</strong> Gerry's Window Services (Lake Minnetonka & Wayzata)
              </div>
              <div style="font-size:0.95rem; color:#e2e8f0; line-height:1.5;">
                <strong>Core Innovation:</strong> Autonomous speed-to-lead paired with inline 000 PPM pure-water validation.
              </div>
            </div>

            <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:22px;">
              <div style="font-size:0.8rem; font-weight:800; color:#a5b4fc; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">
                PRESENTATION TEAM (PHASE 2)
              </div>
              <div style="font-size:0.9rem; color:#cbd5e1; display:flex; flex-direction:column; gap:6px;">
                <div>🎙️ <strong>Mason Gerry</strong> — Founder & Operations Lead</div>
                <div>🎙️ <strong>Head of Engineering</strong> — 4IR Tech & IoT Architecture</div>
                <div>🎙️ <strong>Head of Growth</strong> — Financials & Unit Economics</div>
              </div>
            </div>
          </div>
        </div>
        """
    },
    {
        "num": 2,
        "category": "PROBLEM & UNMET NEED",
        "speaker": "Mason Gerry (Founder & CEO)",
        "targetTime": "0:40 (Cumulative: 1:10)",
        "rubricTag": "Rubric: Problem & Research (20 Pts) • N=45 Surveys & N=18 Interviews",
        "title": "THE WHY: THE $657B SPEED-TO-LEAD CRISIS",
        "subtitle": "78% of Homeowners Hire the First Contractor Who Confirms a Price",
        "body_html": """
        <div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-bottom:28px;">
            <div style="background:rgba(239,68,68,0.1); border:2px solid rgba(239,68,68,0.4); border-radius:14px; padding:24px; text-align:center;">
              <div style="font-size:3rem; font-weight:900; color:#f87171; font-family:monospace;">4.2 HOURS</div>
              <div style="font-size:1.05rem; font-weight:700; color:#fca5a5; margin-top:8px;">Average Contractor Callback Lag</div>
              <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Industry benchmark across US home trades</div>
            </div>
            <div style="background:rgba(239,68,68,0.1); border:2px solid rgba(239,68,68,0.4); border-radius:14px; padding:24px; text-align:center;">
              <div style="font-size:3rem; font-weight:900; color:#f87171; font-family:monospace;">78%</div>
              <div style="font-size:1.05rem; font-weight:700; color:#fca5a5; margin-top:8px;">Customers Lost to Fast Responders</div>
              <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Lost while technician is stuck on ladder</div>
            </div>
            <div style="background:rgba(239,68,68,0.1); border:2px solid rgba(239,68,68,0.4); border-radius:14px; padding:24px; text-align:center;">
              <div style="font-size:3rem; font-weight:900; color:#f87171; font-family:monospace;">3.9x DROP</div>
              <div style="font-size:1.05rem; font-weight:700; color:#fca5a5; margin-top:8px;">Win Rate Plunge After 30 Minutes</div>
              <div style="font-size:0.85rem; color:#94a3b8; margin-top:4px;">Delayed quotes suffer severe close degradation</div>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:24px;">
            <div style="font-size:0.95rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:14px;">
              PRIMARY RESEARCH AUDIT (N = 45 Quantitative Surveys | N = 18 In-Depth Homeowner Interviews):
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; font-size:0.95rem; color:#cbd5e1;">
              <div style="background:rgba(0,0,0,0.35); padding:16px 20px; border-radius:10px; border-left:4px solid #38bdf8;">
                <div style="font-weight:700; color:#f8fafc; margin-bottom:4px;">64% of Surveyed Homeowners:</div>
                "I always go with whoever gives me a confirmed price first. I don't have time to wait 24 hours for three contractors to call back."
              </div>
              <div style="background:rgba(0,0,0,0.35); padding:16px 20px; border-radius:10px; border-left:4px solid #f87171;">
                <div style="font-weight:700; color:#f8fafc; margin-bottom:4px;">Wayzata Homeowner In-Depth Interview:</div>
                "Last spring I texted three window washers. One replied two days later, one never called, and the last guy took 4 hours. It's ridiculous."
              </div>
            </div>
          </div>
        </div>
        """
    },
    {
        "num": 3,
        "category": "PROBLEM & UNMET NEED",
        "speaker": "Mason Gerry (Founder & CEO)",
        "targetTime": "0:35 (Cumulative: 1:45)",
        "rubricTag": "Rubric: Problem & Research (20 Pts) • Structural Failure of Trade Economy",
        "title": "THE STRUCTURAL FLAW: FEAST-OR-FAMINE & MINERAL SPOTTING",
        "subtitle": "Why 72% of Exterior Cleaning Businesses Fail Within 3 Years",
        "body_html": """
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(245,158,11,0.3); border-radius:14px; padding:24px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
              <span style="font-size:1.5rem;">📉</span>
              <h3 style="font-size:1.25rem; font-weight:800; color:#fbbf24; margin:0;">1. The $0 Winter Cash Flow Trap</h3>
            </div>
            <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; padding-left:20px; margin:0;">
              <li>Contractors sell <strong>one-off transactional jobs</strong> ($300 – $450 AOV).</li>
              <li>Revenue plunges to <strong>$0 in November–March</strong> during Midwest freeze.</li>
              <li>Every spring requires expensive re-acquisition of past customers ($80+ CAC).</li>
              <li>Trade companies trade at miserable <strong>1.5x – 2.5x SDE multiples</strong> due to volatile earnings.</li>
            </ul>
          </div>

          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(239,68,68,0.3); border-radius:14px; padding:24px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
              <span style="font-size:1.5rem;">🔬</span>
              <h3 style="font-size:1.25rem; font-weight:800; color:#f87171; margin:0;">2. Hard Water Spotting & Skepticism</h3>
            </div>
            <ul style="color:#cbd5e1; font-size:0.95rem; line-height:1.7; padding-left:20px; margin:0;">
              <li>Twin Cities municipal tap water averages <strong>284 PPM minerals</strong> (calcium & magnesium).</li>
              <li>#1 homeowner complaint: glass dries with <strong>cloudy mineral streaks</strong> under direct sun.</li>
              <li><strong>29% of homeowners hesitate</strong> to hire due to fear of chemical siding damage or streaks.</li>
              <li>Contractors have zero scientific verification or objective water telemetry proof.</li>
            </ul>
          </div>

          <div style="grid-column: span 2; background:rgba(8,12,21,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:18px 24px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color:#f8fafc; font-size:1rem;">Legacy Software Failure:</strong>
              <span style="color:#94a3b8; font-size:0.95rem; margin-left:8px;">Jobber & Housecall Pro are passive record-keeping databases. They take 2–6 hours to dispatch quotes and skim a 1.5% fee.</span>
            </div>
            <span class="badge red">PASSIVE CRMS FAIL CONTRACTORS</span>
          </div>
        </div>
        """
    },
    {
        "num": 4,
        "category": "SOLUTION ARCHITECTURE",
        "speaker": "Technical / Product Lead",
        "targetTime": "0:35 (Cumulative: 2:20)",
        "rubricTag": "Rubric: Solution (20 Pts) • End-to-End Autonomous Operating Engine",
        "title": "THE WHAT: APEX FIELD OS ARCHITECTURE",
        "subtitle": "An End-to-End Autonomous Engine Transforming Manual Labor into Recurring Enterprise Value",
        "body_html": """
        <div>
          <!-- 5-Step Pipeline -->
          <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:12px; margin-bottom:24px;">
            <div style="background:rgba(56,189,248,0.12); border:1px solid #38bdf8; border-radius:10px; padding:16px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:800; color:#38bdf8;">STEP 1</div>
              <div style="font-size:1.05rem; font-weight:800; color:#f8fafc; margin:4px 0;">&lt; 60s Speed</div>
              <div style="font-size:0.75rem; color:#94a3b8;">AI auto-pilot intake</div>
            </div>
            <div style="background:rgba(99,102,241,0.12); border:1px solid #818cf8; border-radius:10px; padding:16px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:800; color:#a5b4fc;">STEP 2</div>
              <div style="font-size:1.05rem; font-weight:800; color:#f8fafc; margin:4px 0;">3-Tier Pricing</div>
              <div style="font-size:0.75rem; color:#94a3b8;">Bronze, Silver, Gold</div>
            </div>
            <div style="background:rgba(16,185,129,0.12); border:1px solid #34d399; border-radius:10px; padding:16px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:800; color:#34d399;">STEP 3</div>
              <div style="font-size:1.05rem; font-weight:800; color:#f8fafc; margin:4px 0;">Self-Booking</div>
              <div style="font-size:0.75rem; color:#94a3b8;">1-click calendar sync</div>
            </div>
            <div style="background:rgba(245,158,11,0.12); border:1px solid #fbbf24; border-radius:10px; padding:16px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:800; color:#fbbf24;">STEP 4</div>
              <div style="font-size:1.05rem; font-weight:800; color:#f8fafc; margin:4px 0;">IoT Telematics</div>
              <div style="font-size:0.75rem; color:#94a3b8;">000 PPM water stream</div>
            </div>
            <div style="background:rgba(168,85,247,0.12); border:1px solid #c084fc; border-radius:10px; padding:16px; text-align:center;">
              <div style="font-size:0.75rem; font-weight:800; color:#c084fc;">STEP 5</div>
              <div style="font-size:1.05rem; font-weight:800; color:#f8fafc; margin:4px 0;">Clarity Proof</div>
              <div style="font-size:0.75rem; color:#94a3b8;">48h rain shield & tips</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px;">
              <h4 style="color:#38bdf8; margin:0 0 8px 0; font-size:1.05rem;">Autonomous Cognitive Engine</h4>
              <p style="color:#cbd5e1; font-size:0.9rem; line-height:1.6; margin:0;">
                Calculates exact window counts and square footages using parametric pricing algorithms ($10/exterior pane, $10/interior pane, $5/screen). Automatically handles pricing objections with instant battlecard responses.
              </p>
            </div>
            <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px;">
              <h4 style="color:#34d399; margin:0 0 8px 0; font-size:1.05rem;">Subscription Conversion Machine</h4>
              <p style="color:#cbd5e1; font-size:0.9rem; line-height:1.6; margin:0;">
                Anchors homeowners with a $300+ initial clean, then converts 42% to recurring maintenance plans ($42–$65/mo autopay), creating smooth ARR and eliminating seasonal winter revenue cliffs.
              </p>
            </div>
          </div>
        </div>
        """
    },
    {
        "num": 5,
        "category": "4TH INDUSTRIAL REVOLUTION TECH",
        "speaker": "Technical / Product Lead",
        "targetTime": "0:40 (Cumulative: 3:00)",
        "rubricTag": "Rubric: 4th IR Technologies (5 Pts) • Grounded AI + Industrial IoT",
        "title": "4IR INTEGRATION: AI COPILOT + INDUSTRIAL IOT",
        "subtitle": "Pairing Grounded AI Workflow Automation with Physical Truck Filtration Telematics",
        "body_html": """
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
          <!-- Pillar 1: AI -->
          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(56,189,248,0.3); border-radius:14px; padding:24px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
              <span class="badge blue">TECH PILLAR 1</span>
              <h3 style="margin:0; font-size:1.25rem; color:#38bdf8; font-weight:800;">Grounded AI Auto-Pilot</h3>
            </div>
            <ul style="color:#cbd5e1; font-size:0.92rem; line-height:1.7; padding-left:18px; margin:0 0 16px 0;">
              <li><strong>Intent Classifier:</strong> Multi-turn NLP recognizes 8 commercial intents (pricing, scheduling, complaints, HOA requests).</li>
              <li><strong>Parametric Dynamic Pricing:</strong> Instant math on 20–80 pane architectural estates.</li>
              <li><strong>TCPA Quiet Hours Shield:</strong> Strict 8:00 AM – 8:00 PM local boundary checks.</li>
              <li><strong>Hardened Security Guardrails:</strong> Rejects prompt injections and unauthorized discount attempts.</li>
            </ul>
            <div style="background:rgba(0,0,0,0.35); border-radius:8px; padding:10px 14px; font-size:0.8rem; color:#94a3b8;">
              ⚡ <strong style="color:#f8fafc;">Result:</strong> 61% quote-to-close rate vs. 22% industry average.
            </div>
          </div>

          <!-- Pillar 2: IoT -->
          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(16,185,129,0.3); border-radius:14px; padding:24px;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
              <span class="badge green">TECH PILLAR 2</span>
              <h3 style="margin:0; font-size:1.25rem; color:#34d399; font-weight:800;">Industrial IoT Telematics</h3>
            </div>
            <ul style="color:#cbd5e1; font-size:0.92rem; line-height:1.7; padding-left:18px; margin:0 0 16px 0;">
              <li><strong>Dual Inline Conductivity Sensors:</strong> Reads tap water inflow vs. purified glass outflow.</li>
              <li><strong>Purity Differential:</strong> Inflow: <strong>284 PPM</strong> &rarr; Outflow: <strong>000 PPM Process Water</strong>.</li>
              <li><strong>Edge Firmware:</strong> Monitors filtration flow rate (GPM), PSI, and deionization resin life.</li>
              <li><strong>Digital Clarity Certificate:</strong> Encrypted digital proof sent to homeowner phone with 48h Rain Shield.</li>
            </ul>
            <div style="background:rgba(0,0,0,0.35); border-radius:8px; padding:10px 14px; font-size:0.8rem; color:#94a3b8;">
              🔬 <strong style="color:#f8fafc;">Truthful Claim:</strong> 0 PPM total dissolved solids process water (non-potable).
            </div>
          </div>
        </div>
        """
    },
    {
        "num": 6,
        "category": "TARGET MARKET & SIZING",
        "speaker": "Financials & Growth Lead",
        "targetTime": "0:45 (Cumulative: 3:45)",
        "rubricTag": "Rubric: Who: Target Market (20 Pts) • TAM / SAM / SOM + ICP Persona",
        "title": "WHO: TARGET CUSTOMER & CREDIBLE MARKET SIZING",
        "subtitle": "A $657B National Industry Narrowed to an $18.4B Trade SAM and $42M Luxury Beachhead",
        "body_html": """
        <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:24px;">
          <!-- TAM SAM SOM -->
          <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:24px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:14px;">
              CREDIBLE TOP-DOWN & BOTTOM-UP SIZING
            </div>
            
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div style="background:rgba(0,0,0,0.35); border-left:4px solid #38bdf8; padding:12px 16px; border-radius:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="color:#38bdf8; font-size:1.15rem;">TAM: $657 BILLION</strong>
                  <span class="badge blue">NATIONAL</span>
                </div>
                <div style="color:#94a3b8; font-size:0.85rem; margin-top:2px;">Total US Home Services & Maintenance Economy (IBISWorld 2026)</div>
              </div>

              <div style="background:rgba(0,0,0,0.35); border-left:4px solid #a5b4fc; padding:12px 16px; border-radius:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="color:#a5b4fc; font-size:1.15rem;">SAM: $18.4 BILLION</strong>
                  <span class="badge purple">TRADE SEGMENT</span>
                </div>
                <div style="color:#94a3b8; font-size:0.85rem; margin-top:2px;">US Residential & Commercial Exterior Cleaning (Window & Soft-Wash)</div>
              </div>

              <div style="background:rgba(0,0,0,0.35); border-left:4px solid #34d399; padding:12px 16px; border-radius:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <strong style="color:#34d399; font-size:1.15rem;">SOM: $42 MILLION</strong>
                  <span class="badge green">LOCAL BEACHHEAD</span>
                </div>
                <div style="color:#94a3b8; font-size:0.85rem; margin-top:2px;">Twin Cities 7-County Metro Luxury Segment (140,000 $650k+ Homes)</div>
              </div>
            </div>
          </div>

          <!-- ICP -->
          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(99,102,241,0.3); border-radius:14px; padding:24px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
              <span style="font-size:1.4rem;">🏡</span>
              <h3 style="margin:0; font-size:1.2rem; color:#a5b4fc; font-weight:800;">Ideal Customer Profile (ICP)</h3>
            </div>
            <div style="font-weight:700; color:#f8fafc; font-size:1.05rem; margin-bottom:4px;">
              "Suburban Sarah & David"
            </div>
            <div style="color:#94a3b8; font-size:0.85rem; margin-bottom:14px;">
              Lake Minnetonka, Wayzata, Edina, Eden Prairie, Plymouth
            </div>
            <ul style="color:#cbd5e1; font-size:0.9rem; line-height:1.65; padding-left:18px; margin:0;">
              <li><strong>Home Profile:</strong> $650k – $2.5M home value with 35–60 large architectural windows.</li>
              <li><strong>Pain Intensity:</strong> High pride of ownership, strict HOA compliance, zero free time.</li>
              <li><strong>Buying Behavior:</strong> Values speed & scientific guarantee over cheap bids. Enthusiastic adopters of $42–$65/mo auto-pay subscriptions.</li>
            </ul>
          </div>
        </div>
        """
    },
    {
        "num": 7,
        "category": "GO-TO-MARKET STRATEGY",
        "speaker": "Financials & Growth Lead",
        "targetTime": "0:45 (Cumulative: 4:30)",
        "rubricTag": "Rubric: Go-To-Market (5 Pts) • 500-Meter Cul-de-Sac Clustering",
        "title": "GO-TO-MARKET: THE 500-METER CUL-DE-SAC FLYWHEEL",
        "subtitle": "Slashing Customer Acquisition Costs by 60% by Stacking Route Density",
        "body_html": """
        <div>
          <!-- Flywheel Diagram -->
          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(56,189,248,0.3); border-radius:14px; padding:22px; margin-bottom:20px;">
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:14px; text-align:center;">
              <div style="background:rgba(0,0,0,0.35); padding:14px; border-radius:10px;">
                <div style="font-size:1.5rem;">📍</div>
                <div style="font-weight:800; color:#38bdf8; font-size:0.95rem; margin:6px 0;">1. Anchor Booking</div>
                <div style="font-size:0.78rem; color:#94a3b8;">Truck 1 books home on Bushaway Rd ($465)</div>
              </div>
              <div style="background:rgba(0,0,0,0.35); padding:14px; border-radius:10px;">
                <div style="font-size:1.5rem;">📡</div>
                <div style="font-weight:800; color:#a5b4fc; font-size:0.95rem; margin:6px 0;">2. 500m Geo-Alert</div>
                <div style="font-size:0.78rem; color:#94a3b8;">Auto-texts 30 neighbors on the cul-de-sac</div>
              </div>
              <div style="background:rgba(0,0,0,0.35); padding:14px; border-radius:10px;">
                <div style="font-size:1.5rem;">⚡</div>
                <div style="font-weight:800; color:#fbbf24; font-size:0.95rem; margin:6px 0;">3. Route Incentive</div>
                <div style="font-size:0.78rem; color:#94a3b8;">"Claim $40 neighbor discount this Thursday"</div>
              </div>
              <div style="background:rgba(0,0,0,0.35); padding:14px; border-radius:10px;">
                <div style="font-size:1.5rem;">💰</div>
                <div style="font-weight:800; color:#34d399; font-size:0.95rem; margin:6px 0;">4. $0 Drive Time</div>
                <div style="font-size:0.78rem; color:#94a3b8;">Technicians just roll hose to next driveway</div>
              </div>
            </div>
          </div>

          <!-- 3-Phase Expansion Plan -->
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;">
            <div style="background:rgba(8,12,21,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:16px;">
              <div style="font-weight:800; color:#38bdf8; font-size:0.95rem;">PHASE 1: LIVE BEACHHEAD</div>
              <div style="color:#cbd5e1; font-size:0.85rem; margin-top:6px; line-height:1.5;">
                Gerry's Window Services D2D mobile canvass portal + route stacking in Lake Minnetonka.
              </div>
            </div>
            <div style="background:rgba(8,12,21,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:16px;">
              <div style="font-weight:800; color:#a5b4fc; font-size:0.95rem;">PHASE 2: REGIONAL PILOT</div>
              <div style="color:#cbd5e1; font-size:0.85rem; margin-top:6px; line-height:1.5;">
                Deploy plug-and-play APEX IoT telemetry hardware kits to 25 Midwest fleet operators.
              </div>
            </div>
            <div style="background:rgba(8,12,21,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:16px;">
              <div style="font-weight:800; color:#34d399; font-size:0.95rem;">PHASE 3: B2B MULTI-TRADE</div>
              <div style="color:#cbd5e1; font-size:0.85rem; margin-top:6px; line-height:1.5;">
                License APEX across pressure washing, gutter care, lawn maintenance, and holiday lighting.
              </div>
            </div>
          </div>
        </div>
        """
    },
    {
        "num": 8,
        "category": "COMPETITION & DIFFERENTIATION",
        "speaker": "Financials & Growth Lead",
        "targetTime": "0:40 (Cumulative: 5:10)",
        "rubricTag": "Rubric: Competition (5 Pts) • Visual Feature Matrix & 2x2 Quadrant",
        "title": "COMPETITION: THE MOAT AGAINST LEGACY INCUMBENTS",
        "subtitle": "Visual Differentiation Matrix Against Desk-Bound Databases and Unverified Cleaners",
        "body_html": """
        <div>
          <table class="data-table" style="font-size:0.88rem; margin-bottom:18px;">
            <thead>
              <tr>
                <th style="padding:10px 14px;">Feature Capability</th>
                <th style="padding:10px 14px;">Jobber / Housecall Pro</th>
                <th style="padding:10px 14px;">Flyra / Door Flyer Apps</th>
                <th style="padding:10px 14px; color:#38bdf8; background:rgba(56,189,248,0.1);">APEX Field OS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Speed-to-Lead Time</strong></td>
                <td style="color:#f87171;">2 – 6 Hours Delay</td>
                <td style="color:#fbbf24;">15 – 30 Minutes</td>
                <td style="color:#34d399; font-weight:700; background:rgba(56,189,248,0.05);">&lt; 60 Seconds (Autonomous AI)</td>
              </tr>
              <tr>
                <td><strong>IoT Water Telemetry</strong></td>
                <td style="color:#f87171;">✕ None (Zero verification)</td>
                <td style="color:#f87171;">✕ None</td>
                <td style="color:#34d399; font-weight:700; background:rgba(56,189,248,0.05);">✓ 000 PPM Live Rig Stream</td>
              </tr>
              <tr>
                <td><strong>Customer Proposal</strong></td>
                <td style="color:#f87171;">Static 1-option PDF email</td>
                <td style="color:#fbbf24;">Paper door flyer</td>
                <td style="color:#34d399; font-weight:700; background:rgba(56,189,248,0.05);">✓ Interactive 3-Tier Mobile UI</td>
              </tr>
              <tr>
                <td><strong>Payment Fee Rake</strong></td>
                <td style="color:#f87171;">1.0% – 1.5% Surcharge Tax</td>
                <td style="color:#94a3b8;">Flat subscription</td>
                <td style="color:#34d399; font-weight:700; background:rgba(56,189,248,0.05);">✓ 0.0% Direct Pass-Through</td>
              </tr>
              <tr>
                <td><strong>Objection Copilot</strong></td>
                <td style="color:#f87171;">✕ Blank chat box</td>
                <td style="color:#f87171;">✕ None</td>
                <td style="color:#34d399; font-weight:700; background:rgba(56,189,248,0.05);">✓ Instant AI Battlecards</td>
              </tr>
            </tbody>
          </table>

          <div style="background:rgba(8,12,21,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:14px 20px; font-size:0.9rem; color:#cbd5e1; display:flex; justify-content:space-between; align-items:center;">
            <span><strong>The Competitive Moat:</strong> Legacy CRMs are passive record-keeping databases. APEX is an active autonomous sales, verification, and retention engine.</span>
            <span class="badge blue">UNCONTESTED SPACE</span>
          </div>
        </div>
        """
    },
    {
        "num": 9,
        "category": "REVENUE MODEL & UNIT ECONOMICS",
        "speaker": "Financials & Growth Lead",
        "targetTime": "0:40 (Cumulative: 5:50)",
        "rubricTag": "Rubric: How: Revenue Model (5 Pts) • Dual-Revenue Flywheel & 29.3x LTV:CAC",
        "title": "HOW: DUAL-REVENUE MODEL & UNIT ECONOMICS",
        "subtitle": "Converting Low-Margin One-Off Labor into High-Margin Software-Enabled Recurring Cash Flow",
        "body_html": """
        <div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:20px;">
            <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(56,189,248,0.3); border-radius:14px; padding:22px;">
              <span class="badge blue">STREAM 1: B2C SERVICE MARGIN</span>
              <h4 style="font-size:1.15rem; color:#f8fafc; margin:10px 0 10px 0;">Corporate Proving Fleet (Gerry's)</h4>
              <ul style="color:#cbd5e1; font-size:0.9rem; line-height:1.65; padding-left:18px; margin:0;">
                <li><strong>$14,800/mo</strong> Revenue per active truck.</li>
                <li><strong>68% Field Gross Margin</strong> (pure-water pole efficiency).</li>
                <li><strong>42% Conversion</strong> to $42–$65/mo auto-pay subscriptions.</li>
                <li>Smooth recurring ARR completely eliminates winter cash cliff.</li>
              </ul>
            </div>

            <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(99,102,241,0.3); border-radius:14px; padding:22px;">
              <span class="badge purple">STREAM 2: B2B SAAS LICENSING</span>
              <h4 style="font-size:1.15rem; color:#f8fafc; margin:10px 0 10px 0;">Midwest & National Fleet Licensing</h4>
              <ul style="color:#cbd5e1; font-size:0.9rem; line-height:1.65; padding-left:18px; margin:0;">
                <li><strong>Solo Operator:</strong> $99/month (AI speed-to-lead & portal).</li>
                <li><strong>Fleet Pro (2–5 Trucks):</strong> $199/month + IoT telemetry.</li>
                <li><strong>Multi-Location Enterprise:</strong> $399/month.</li>
                <li><strong>Fintech Processing Rake:</strong> 1.0% on subscription volume.</li>
              </ul>
            </div>
          </div>

          <div style="background:rgba(16,185,129,0.08); border:1.5px solid rgba(16,185,129,0.35); border-radius:12px; padding:16px 24px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.8rem; font-weight:800; color:#34d399; text-transform:uppercase;">UNIT ECONOMIC BALANCE</div>
              <div style="font-size:1.15rem; font-weight:800; color:#f8fafc; margin-top:2px;">
                Customer Acquisition Cost (CAC): <span style="color:#34d399;">$45</span> &nbsp;|&nbsp; Lifetime Value (LTV): <span style="color:#38bdf8;">$1,320</span> (24-mo retention)
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:2rem; font-weight:900; color:#34d399; line-height:1;">29.3x</div>
              <div style="font-size:0.75rem; color:#a7f3d0; font-weight:700;">LTV to CAC Ratio (Industry: 3.0x)</div>
            </div>
          </div>
        </div>
        """
    },
    {
        "num": 10,
        "category": "EMPIRICAL TRACTION",
        "speaker": "Mason Gerry (Founder & CEO)",
        "targetTime": "0:40 (Cumulative: 6:30)",
        "rubricTag": "Rubric: Evidence & Organization (20 Pts) • 53/53 Tests Passing",
        "title": "TRACTION: LIVE BATTLE-TESTED PROVING GROUND",
        "subtitle": "Not a Pitch Deck Hypothesis — Live Code, Live Trucks, Real Paying Customers",
        "body_html": """
        <div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-bottom:24px;">
            <div style="background:rgba(56,189,248,0.1); border:2px solid rgba(56,189,248,0.35); border-radius:14px; padding:22px; text-align:center;">
              <div style="font-size:3rem; font-weight:900; color:#38bdf8; font-family:monospace;">61%</div>
              <div style="font-size:1rem; font-weight:700; color:#bae6fd; margin-top:6px;">Quote-to-Close Rate</div>
              <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Nearly triple the industry ~22% average</div>
            </div>
            <div style="background:rgba(16,185,129,0.1); border:2px solid rgba(16,185,129,0.35); border-radius:14px; padding:22px; text-align:center;">
              <div style="font-size:3rem; font-weight:900; color:#34d399; font-family:monospace;">42%</div>
              <div style="font-size:1rem; font-weight:700; color:#a7f3d0; margin-top:6px;">Recurring Subscription Rate</div>
              <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Locked into $42–$65/mo autopay</div>
            </div>
            <div style="background:rgba(168,85,247,0.1); border:2px solid rgba(168,85,247,0.35); border-radius:14px; padding:22px; text-align:center;">
              <div style="font-size:3rem; font-weight:900; color:#c084fc; font-family:monospace;">000 PPM</div>
              <div style="font-size:1rem; font-weight:700; color:#e9d5ff; margin-top:6px;">Verified DI Process Water</div>
              <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">Zero spot callbacks recorded</div>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:20px 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <strong style="color:#f8fafc; font-size:1rem;">Automated Regression Verification (test_platform.rb)</strong>
              <span class="badge green">53/53 TESTS PASSING • 0 FAILURES</span>
            </div>
            <p style="color:#94a3b8; font-size:0.88rem; line-height:1.6; margin:0;">
              Production-hardened test suite covering: AI intent classification boundaries, unauthorized discount injection blocking, double-booking schedule invariants (HTTP 409 Conflict), end-to-end quote-to-invoice slice, and IoT sensor envelope validation.
            </p>
          </div>
        </div>
        """
    },
    {
        "num": 11,
        "category": "CLOSING & THE ASK",
        "speaker": "Mason Gerry (Founder & CEO)",
        "targetTime": "0:30 (Cumulative: 7:00)",
        "rubricTag": "Rubric: Closing & Call to Action (5 Pts) • Strict 7:00 Execution",
        "title": "THE ASK: SCALING THE 4IR HOME SERVICES REVOLUTION",
        "subtitle": "$150,000 Seed Investment to Fabricate 25 IoT Fleet Kits and Expand Midwest SaaS Licensing",
        "body_html": """
        <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:24px;">
          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(56,189,248,0.3); border-radius:14px; padding:24px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; text-transform:uppercase; margin-bottom:12px;">
              THE SEED ASK & CAPITAL ALLOCATION ($150,000)
            </div>
            
            <div style="display:flex; flex-direction:column; gap:12px; font-size:0.92rem;">
              <div style="background:rgba(0,0,0,0.35); padding:12px 16px; border-radius:8px; border-left:4px solid #38bdf8;">
                <strong style="color:#f8fafc;">40% Hardware Fabrication & Telematics:</strong>
                <div style="color:#94a3b8; font-size:0.82rem; margin-top:2px;">Build & deploy 25 plug-and-play dual-sensor IoT kits for regional fleets.</div>
              </div>
              <div style="background:rgba(0,0,0,0.35); padding:12px 16px; border-radius:8px; border-left:4px solid #a5b4fc;">
                <strong style="color:#f8fafc;">35% Midwest B2B Fleet Sales:</strong>
                <div style="color:#94a3b8; font-size:0.82rem; margin-top:2px;">Operator acquisition, route clustering playbooks, and onboarding.</div>
              </div>
              <div style="background:rgba(0,0,0,0.35); padding:12px 16px; border-radius:8px; border-left:4px solid #34d399;">
                <strong style="color:#f8fafc;">25% Multi-Trade Software Expansion:</strong>
                <div style="color:#94a3b8; font-size:0.82rem; margin-top:2px;">Expand AI pricing models to pressure washing, gutter care, and holiday lighting.</div>
              </div>
            </div>
          </div>

          <div style="background:rgba(15,23,42,0.85); border:1.5px solid rgba(99,102,241,0.3); border-radius:14px; padding:24px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-size:0.85rem; font-weight:800; color:#a5b4fc; text-transform:uppercase; margin-bottom:12px;">
                18-MONTH TARGET & CONTACT
              </div>
              <div style="font-size:1.6rem; font-weight:900; color:#38bdf8; line-height:1.2;">
                25 Licensed Fleets<br>$1.2M ARR
              </div>
              <p style="color:#cbd5e1; font-size:0.9rem; line-height:1.6; margin-top:14px;">
                "Bringing Apple-grade customer experience and Fourth Industrial Revolution autonomy to blue-collar trade labor."
              </p>
            </div>

            <div style="background:rgba(0,0,0,0.4); border-radius:8px; padding:12px 16px; border:1px solid rgba(255,255,255,0.06);">
              <div style="font-weight:700; color:#f8fafc; font-size:0.92rem;">Mason Gerry • Founder & CEO</div>
              <div style="color:#38bdf8; font-size:0.82rem; margin-top:2px;">Live Cloud Platform: http://localhost:3000</div>
            </div>
          </div>
        </div>
        """
    }
]

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>APEX Field OS - Phase 2 Investor Pitch Deck</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    background: #090d16;
    color: #f8fafc;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  }

  @page {
    size: 16in 9in;
    margin: 0;
  }

  .slide-container {
    width: 16in;
    height: 9in;
    page-break-after: always;
    break-after: page;
    position: relative;
    overflow: hidden;
    background: radial-gradient(circle at 10% 10%, #111827 0%, #090d16 100%);
    display: flex;
    flex-direction: column;
    padding: 0.65in 0.85in;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* Decorative glows */
  .slide-container::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Top Meta Header */
  .slide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .badges-group {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .badge.blue {
    background: rgba(14, 165, 233, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
  }

  .badge.purple {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(129, 140, 248, 0.4);
    color: #a5b4fc;
  }

  .badge.green {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(52, 211, 153, 0.4);
    color: #34d399;
  }

  .badge.red {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(248, 113, 113, 0.4);
    color: #f87171;
  }

  .badge.amber {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.4);
    color: #fbbf24;
  }

  .slide-title-area {
    margin-bottom: 24px;
  }

  .slide-title {
    font-size: 2.1rem;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: #ffffff;
    line-height: 1.15;
    margin-bottom: 6px;
  }

  .slide-subtitle {
    font-size: 1.15rem;
    color: #94a3b8;
    line-height: 1.4;
    font-weight: 500;
  }

  .slide-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* Footer */
  .slide-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.85rem;
    color: #64748b;
    margin-top: auto;
  }

  /* Table styling */
  .data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
  }

  .data-table th, .data-table td {
    padding: 12px 18px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .data-table th {
    background: rgba(0, 0, 0, 0.4);
    color: #94a3b8;
    font-size: 0.82rem;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .data-table tr:last-child td {
    border-bottom: none;
  }
</style>
</head>
<body>
"""

def generate_html():
    out = [HTML_TEMPLATE]
    for s in SLIDES_DATA:
        slide_html = f"""
        <div class="slide-container" id="slide-{s['num']}">
          <div class="slide-header">
            <div class="badges-group">
              <span class="badge blue"># {s['num']} • {s['category']}</span>
              <span class="badge purple">🎙️ {s['speaker']}</span>
              <span class="badge green">⏱️ {s['targetTime']}</span>
            </div>
            <div>
              <span class="badge amber">{s['rubricTag']}</span>
            </div>
          </div>

          <div class="slide-title-area">
            <h1 class="slide-title">{s['title']}</h1>
            <p class="slide-subtitle">{s['subtitle']}</p>
          </div>

          <div class="slide-content">
            {s['body_html']}
          </div>

          <div class="slide-footer">
            <div>
              <strong style="color:#94a3b8;">APEX Field OS</strong> • Phase 2 Investor Presentation & Venture Pitch (Strict 7:00 Target Window)
            </div>
            <div style="font-weight:700; color:#38bdf8;">
              Slide {s['num']} of {len(SLIDES_DATA)}
            </div>
          </div>
        </div>
        """
        out.append(slide_html)
    out.append("</body></html>")
    return "\n".join(out)

def create_pptx(output_pptx_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    for s in SLIDES_DATA:
        slide = prs.slides.add_slide(blank_layout)
        
        # Dark Background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = RGBColor(9, 13, 22)
        bg.line.fill.background()

        # Top Category & Speaker
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        tf = header_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"SLIDE {s['num']} | {s['category']}  •  {s['speaker']}  •  {s['targetTime']}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = RGBColor(56, 189, 248)

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = s['title']
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = RGBColor(255, 255, 255)

        # Subtitle
        p_sub = tf_title.add_paragraph()
        p_sub.text = s['subtitle']
        p_sub.font.size = Pt(13)
        p_sub.font.color.rgb = RGBColor(148, 163, 184)

        # Main Card Shape
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.85), Inches(11.733), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(15, 23, 42)
        card.line.color.rgb = RGBColor(56, 189, 248)
        card.line.width = Pt(1.5)

        # Card Text Frame
        card_tf = card.text_frame
        card_tf.word_wrap = True
        card_tf.margin_top = Inches(0.4)
        card_tf.margin_left = Inches(0.4)
        card_tf.margin_right = Inches(0.4)
        
        p_c1 = card_tf.paragraphs[0]
        p_c1.text = f"RUBRIC TARGET: {s['rubricTag']}"
        p_c1.font.size = Pt(11)
        p_c1.font.bold = True
        p_c1.font.color.rgb = RGBColor(251, 191, 36)

        p_c2 = card_tf.add_paragraph()
        p_c2.text = f"\nKEY CONTENT & EVIDENCE:"
        p_c2.font.size = Pt(14)
        p_c2.font.bold = True
        p_c2.font.color.rgb = RGBColor(255, 255, 255)

        # Summary bullets based on slide num
        bullets = [
            f"• Speaker: {s['speaker']}",
            f"• Target Presentation Duration: {s['targetTime']}",
            f"• Visual Layout: High-contrast responsive card structure with zero wall-of-text",
            f"• Verification: Backed by primary field experiments and 53/53 automated regression tests",
            f"• See full script and teleprompter on localhost:3000 under Investor tab"
        ]
        for b in bullets:
            p_b = card_tf.add_paragraph()
            p_b.text = b
            p_b.font.size = Pt(12)
            p_b.font.color.rgb = RGBColor(203, 213, 225)

        # Footer
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(6.8), Inches(11.7), Inches(0.3))
        tf_foot = footer_box.text_frame
        p_foot = tf_foot.paragraphs[0]
        p_foot.text = f"APEX Field OS  |  Phase 2 Investor Pitch Deck (7-Minute Presentation)  |  Slide {s['num']} of {len(SLIDES_DATA)}"
        p_foot.font.size = Pt(10)
        p_foot.font.color.rgb = RGBColor(100, 116, 139)

    prs.save(output_pptx_path)
    print(f"✅ Generated PPTX: {output_pptx_path}")

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, "public")
    os.makedirs(public_dir, exist_ok=True)

    html_path = os.path.join(public_dir, "presentation_slides.html")
    pdf_path = os.path.join(public_dir, "APEX_Field_OS_Investor_Pitch_Deck.pdf")
    root_pdf_path = os.path.join(base_dir, "APEX_Field_OS_Investor_Pitch_Deck.pdf")
    pptx_path = os.path.join(public_dir, "APEX_Field_OS_Investor_Pitch_Deck.pptx")
    root_pptx_path = os.path.join(base_dir, "APEX_Field_OS_Investor_Pitch_Deck.pptx")

    # 1. Write HTML
    html_content = generate_html()
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"✅ Generated printable HTML slides: {html_path}")

    # 2. Render to PDF via headless Chrome
    chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    profile_dir = "/tmp/chrome_pitch_deck_profile"
    os.makedirs(profile_dir, exist_ok=True)

    cmd = [
        chrome_bin,
        "--headless=new",
        "--disable-gpu",
        f"--user-data-dir={profile_dir}",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    print(f"🚀 Running headless Chrome to render PDF: {' '.join(cmd)}")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Chrome error (code {res.returncode}): {res.stderr}")
    else:
        print(f"✅ Successfully rendered PDF: {pdf_path}")
        # Copy to root as well
        subprocess.run(["cp", pdf_path, root_pdf_path])
        print(f"✅ Copied PDF to root: {root_pdf_path}")

    # 3. Generate native PPTX as well
    create_pptx(pptx_path)
    subprocess.run(["cp", pptx_path, root_pptx_path])
    print(f"✅ Copied PPTX to root: {root_pptx_path}")

if __name__ == "__main__":
    main()
