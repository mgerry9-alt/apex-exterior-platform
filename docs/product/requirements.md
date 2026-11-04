# Phase 0 requirements register

| ID | Priority | Requirement | Owner | Current state / acceptance evidence |
|---|---|---|---|---|
| SEC-001 | P0 | Only one bootstrapped, stable founder subject with verified MFA may enter Field Hub. | Product/security | Cookie-backed owner sign-in/TOTP flow, centralized server claim/AAL2 gate, API `getUser`, configured founder subject, and RLS AAL2 policy implemented; owner policy/HTTP/PGlite fixtures and owner build pass. No live project, bootstrap, or signed-token test. |
| SEC-002 | P0 | Staff, customer, and service principals cannot reach owner routes by URL or direct request. | API/security | Field Hub route, per-operation RLS, and owner-only RPC execute grants implemented; fixture tests deny staff and AAL1. Live Supabase direct-request tests remain missing. |
| LEAD-001 | P1 | Capture one deduplicated lead with attribution and consent evidence. | CRM | Founder-only HTTP/RPC stores source, counts, consent flags and idempotency hash atomically. No customer/contact/property details, territory, or public form. |
| PRICE-001 | P1 | Quote only from an owner-approved, versioned pricebook using integer minor units. | Product/finance | RPC selects the effective approved pricebook and stores line/item snapshots; PGlite exact-cent fixture passes. No UI approval workflow or live pricebook. |
| PRICE-002 | P1 | Missing rates, tax rules, measurements, or safety facts fail closed and cannot bind a customer. | Product/safety | Missing pricebook fails and rolls back; all outputs remain draft, tax not configured. Safety/measurement/confidence and customer acceptance are not built. |
| OPS-001 | P2 | Separate jobs from visits and enforce audited transitions. | Operations | Not built. |
| LIVE-001 | P0 | External providers and live data remain disabled until verified. | Integrations | Prior Ruby app defaults remain gated; no provider is configured or verified. |
