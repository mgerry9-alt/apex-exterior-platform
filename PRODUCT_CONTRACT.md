# PRODUCT CONTRACT: APEX FIELD OS
**Version:** 1.0.0-PROD-VERIFIED  
**Date:** 28 October 2026  
**Product Name:** APEX Field OS (Beachhead Trade: Gerry's Window Services)  
**Target Customers:** Residential and Commercial Exterior Property Maintenance Operators (Starting with Window Detailing, expanding to SoftWash, Gutter Defense, and Seasonal Trades).

---

## 1. SCOPE & USERS

### Core Actors
1. **Business Owner / Dispatcher (Admin):** Manages crew routing, fleet equipment readiness, quotes, invoices, and autonomous campaign oversight.
2. **Field Technician (Driver/Crew):** Executes route stops, views job notes, conducts on-site pure-water washes, records telemetry, and triggers completion handoffs.
3. **Property Owner (B2C Customer):** Receives instant estimates, books appointment slots, reviews process water purity certificates, approves invoices, and opts into recurring care.
4. **Autonomous AI Engine (Copilot/Auto-Pilot):** Bounded natural language intent classification, price formula estimation, and policy-restricted customer assistance.
5. **IoT Gateway / Telemetry Ingestion (Edge):** Streams filtration parameters (TDS, flow rate, pressure, resin life) with explicit data-source provenance labels (Live vs. Simulated).

---

## 2. THE TWO FOURTH INDUSTRIAL REVOLUTION TECHNOLOGIES

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              APEX DUAL-TECH CORE                                  │
├─────────────────────────────────────────┬─────────────────────────────────────────┤
│ 1. ARTIFICIAL INTELLIGENCE              │ 2. INDUSTRIAL INTERNET OF THINGS (IIoT) │
│ • Natural Language Intent Parsing       │ • Reverse Osmosis & DI Bed Telemetry    │
│ • Deterministic Price Matrix Engine     │ • Dual TDS Inflow/Outflow Monitoring    │
│ • Bounded Policy Approval Workflows     │ • Dynamic Flow (GPM) & Pressure (PSI)   │
│ • Human Escalation & Supervisor Handoff │ • Digital Clarity Process Certificates  │
└─────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 3. TRUTH & CLAIM INVENTORY (NON-NEGOTIABLES)

1. **No "Guaranteed Purity" or Potable Water Claims:**
   - *Prohibited:* "100% Guaranteed Pure Water", "Zero Contaminant Drinking Water".
   - *Approved Specification:* **"0 PPM Total Dissolved Solids (TDS) Process Water"** — scientifically defined as water demineralized for streak-free glass drying; non-potable; does not establish biological sterility.
2. **Explicit Provenance on All Data:**
   - Every telemetry reading, lead source, and financial figure must be labeled with its origin: `[LIVE_HARDWARE]`, `[SIMULATED_TEST]`, `[HISTORICAL_SAMPLE]`, or `[MANUAL_ENTRY]`.
3. **Bounded Autopilot Authority:**
   - Autonomous AI may quote verified standard formulas ($\le 30 \text{ panes} = \$10/\text{pane}$; $> 30 = \$300 + \$9/\text{pane}$; Screens = \$5; Interior = \$10) and answer verified FAQ prompts.
   - Autonomous AI **cannot** issue refunds, offer unauthorized discounts exceeding \$50, actuate physical valves, or alter customer contracts without explicit human supervisor sign-off.
4. **48-Hour Rain Shield Terms:**
   - Defined truthfully as a commercial customer satisfaction warranty: if precipitation causes mineral deposit reactivation on exterior glass within 48 hours of service, crew returns for a complimentary exterior perimeter touchup.

---

## 4. DOMAIN INVARIANTS & CONSTRAINTS

1. **Monetary Arithmetic:** Explicit minor-unit / two-decimal floating currency representation with verifiable subtotals, taxes, tips, and totals.
2. **Resource-Safe Scheduling:** Two jobs cannot occupy the same technician/truck slot at overlapping times. Double-booking race conditions are rejected at the database level.
3. **Strict State Transitions:**
   `Lead` &rarr; `Quoted` &rarr; `Scheduled` &rarr; `En Route` &rarr; `In Progress` &rarr; `Completed` &rarr; `Invoiced` &rarr; `Paid`.
   Client-supplied requests cannot bypass completion or validation gates.
4. **Telemetry Envelope Standard:**
   Every telemetry reading must include: `schema_version`, `tenant_id`, `truck_id`, `technician_id`, `event_time`, `inflow_ppm`, `outflow_ppm`, `flow_rate_gpm`, `system_pressure_psi`, `resin_life_percent`, `source_mode` (`live` | `simulated`), and `sensor_status`.

---

## 5. ACCEPTANCE GATES

* **Gate 1:** Zero critical broken workflows from Lead &rarr; Quote &rarr; Schedule &rarr; Service &rarr; Telemetry &rarr; Invoice &rarr; Payment.
* **Gate 2:** Full test suite verifying concurrency, security, AI bounds, and telemetry edge cases with reproducible execution.
* **Gate 3:** Truthful labeling and elimination of deceptive marketing badges.
* **Gate 4:** Bounded failure handling and human supervisor handoff mechanisms.
