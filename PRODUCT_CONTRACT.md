# Apex Exterior Demo — product notes

**Status:** Local prototype only; no production acceptance claimed.

## Intended prototype workflows
- Review locally submitted lead records.
- Calculate illustrative estimates for internal evaluation.
- Manage local schedule records.
- Simulate messaging and telemetry for development.

These are prototype goals. They do not establish operational readiness, legal compliance, customer outcomes, hardware accuracy, payment processing, or provider integration. The current public interface is an evidence-hold page; it does not expose these workflows.

## Source-copy boundaries
- API routes require an admin bearer token; public lead and inbound SMS endpoints return unavailable unless `APEX_ENABLE_PUBLIC_INTAKE=true` is explicitly set after the privacy/consent gate is reviewed.
- Estimate calculation and certificate lookup are no longer public routes.
- The default bind address is loopback. Remote binding requires a strong configured token.
- Live messaging is disabled unless explicitly enabled in the process environment.
- SMS dispatch checks consent, opt-out, and the quiet-hour window.
- Public intake records consent fields and does not automatically enroll or message a lead.
- Active technician/date/time duplicates are constrained in the database.
- Online payments are not configured. Manual payment recording is an authenticated administrative action.
- Certificate provenance is always simulated.

Before any customer-facing release, provide dated and auditable evidence for identity, prices and terms, insurance and licensing, customer outcomes, market size, hardware provenance, consent procedures, payments, and guarantees. The public interface and materials must remain on hold until reviewed.
