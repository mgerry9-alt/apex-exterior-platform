# Field Hub expansion preview

**Status:** local workflow preview; customer billing and the new operations services are not live.

## Available in the UI

- The owner workspace links to Estimate Matrix, CRM Leads, Route & Telemetry, Invoice Preview, and Response Insights.
- `/get-estimate` lets a customer try pane/screen counts, a proposed screen-cleaning option, and visit-frequency choices. It does not calculate a price, collect contact details, create a lead, or start a subscription.
- In the no-auth development preview, the lead, route, invoice, and response controls operate only in page memory. They clear on reload and make no API or provider calls.
- In a configured owner session, lead measurement intake uses the existing founder/MFA-gated lead-to-quote route. It captures source and counts only; the route requires an approved pricebook and creates a review-required draft quote in the same transaction.
- Route sketches contain a label and planned stop count only. Response samples contain categories only; no customer message text is collected or sent to an AI system.
- Invoice Preview is a layout example only. It does not create or send an invoice, calculate tax, or collect payment.

## Activation requirements

- The screenshot's prices, per-pane rates, discounts, service tiers, property classes, route credit, included work, and Rain Shield guarantee are examples only. No approved pricebook or service contract was supplied.
- Subscription checkout remains disabled because no billing provider is selected. An approved pricebook, currency/tax setup, renewal schedule, cancellation terms, provider test flow, verified webhook lifecycle, and customer consent are required before a real subscription can be created.
- Real contact and property data remain out of scope until purpose, consent language, access, retention, deduplication, export/deletion, and suppression behavior are approved and enforced server-side.
- Route dispatch needs job and visit records, assignment and transition controls, and an approved map/directions source. Telemetry needs a verified device/source, timestamped readings, and location/data retention rules.
- Real response analytics need an admitted, consented response source, data minimization and retention rules, and a human-reviewed reply workflow. Current category counts are local operator samples, not customer analytics.
- Real invoices need accepted quote snapshots, approved tax treatment, invoice persistence, provider reconciliation, and correction/void lifecycle handling.

The repository release gates remain authoritative for production status. UI previews, local sample state, and successful builds do not pass the corresponding live integration, privacy, billing, or operations gates.
