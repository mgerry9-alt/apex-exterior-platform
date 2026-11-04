# ApexExterior Intelligence Platform

Automated Email & Text Outreach Engine with Deep Response Research & Marketing Intelligence for Exterior Services Companies (Pressure Washing, Soft Washing, Roof Cleaning, Gutter Maintenance, Concrete Restoration).

---

## 🌟 Key Features

1. **Multi-Channel Automated Drip Campaigns (SMS + Email)**:
   - Pre-loaded with 4 battle-tested sequences:
     - **Speed-to-Lead Instant Quote Follow-Up** (4-step SMS & Email cadence).
     - **Spring Curb Appeal Revival** (Reactivating cold past clients).
     - **Fall Gutter Armor & Roof Moss Shield** (Freeze prevention urgency).
     - **Commercial & HOA Exterior Maintenance** (Property managers & HOA boards).
   - Dynamic variable replacement (`{{first_name}}`, `{{address}}`, `{{quote_amount}}`, `{{property_sqft}}`, `{{service_interest}}`).
   - TCPA Quiet Hours enforcement (8:00 AM – 8:00 PM local recipient cutoff).
   - Automated STOP/UNSUBSCRIBE protocol with compliance audit logging.

2. **Extensive Homeowner Response Research & NLP Intelligence**:
   - Automatic classification into 8 intents:
     - `BOOKING_READY`
     - `PRICE_OBJECTION`
     - `SAFETY_CONCERN` (Plant, chemical, siding pressure damage)
     - `TIMING_DELAY` (Spring deferrals, weather conflicts)
     - `SPOUSAL_CHECK` (Spousal / HOA consultation)
     - `SCOPE_INQUIRY` (Add-ons, inclusions)
     - `COMPETITOR_COMPARISON` (Cheap flyers, price matching)
     - `OPT_OUT` (STOP, Unsubscribe)
   - Sentiment analysis score (-1.0 to +1.0).
   - Extraction of core root-cause objections.
   - Dynamic marketing recommendation engine generating concrete copy, packaging, and cadence optimizations.
   - Interactive Response Testing Sandbox: test any customer response and get real-time intent extraction and counter-scripts.

3. **Two-Way Communications Inbox & Rebuttal Vault**:
   - Unified thread view for every lead.
   - Real-time intent and sentiment tags on incoming bubbles.
   - "One-Click Rebuttal Insertion" applying contractor-tested counter-scripts into the reply box.
   - "Simulate Inbound Reply" tool to test real customer interactions on the fly.

4. **Zero-Dependency Architecture**:
   - Runs out-of-the-box on macOS native Ruby with built-in SQLite3 and WEBrick.
   - Seamless simulated messaging mode + optional live Twilio / SendGrid connectors.

---

## 🚀 Quick Start

### 1. Launch the Server
```bash
./scripts/start.sh
```
The server will start at: **http://localhost:3000**

### 2. Access the Web Dashboard
Open your browser to:
[http://localhost:3000](http://localhost:3000)

### 3. Key Navigation Tabs
- **Overview & Metrics**: Live KPIs, pipeline revenue, response rates, and SMS vs. Email breakdown.
- **Response Research & AI Insights**: Intent distribution charts, top objections matrix, strategic marketing recommendations, interactive testing sandbox, and contractor battlecards.
- **Campaigns & Drip Sequences**: Multi-step sequence editor, active enrollments, and manual "Run Drip Dispatcher" trigger.
- **Two-Way Inbox**: Live lead threads, AI rebuttal assistant, and simulated incoming reply tool.
- **Leads & Properties**: Lead directory, property square footage, quote amounts, and campaign enrollment.
- **Research Playbook**: Embedded industry benchmarks, psychology guide, and TCPA standards.
- **Settings & Keys**: Business phone/email, quiet hours schedule, and Twilio/SendGrid API keys.

---

## 📚 In-Depth Research Document

For the comprehensive 15-page equivalent market research report, see:
[`RESEARCH_REPORT.md`](file:///Users/masongerry/Documents/antigravity/wonderful-archimedes/RESEARCH_REPORT.md)

## Field OS foundation (Node.js 24)

The Ruby/WEBrick app remains the legacy local prototype. The newer founder-only Field Hub foundation is in `apps/owner-web` (Next.js) and `apps/api` (Fastify). It provides an MFA-gated owner shell, an authenticated record list, and a draft quote workflow with explicit measurement, approved-rate, and human-review steps. In development without Supabase configuration, the owner page offers a browser-session-only preview with no customer data, pricing, API write, or messaging.

Install the pinned Node dependencies with `npm ci`. Start the owner preview with `npm run dev:owner`; run the Field OS API separately with `npm run dev` after configuring the required Supabase variables from `.env.example`. See [`docs/product/field-hub-workflow.md`](docs/product/field-hub-workflow.md) and [`docs/qa/release-gates.md`](docs/qa/release-gates.md) for current scope and limits. The foundation is local and not live-verified against a Supabase project.
