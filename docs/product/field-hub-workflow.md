# Field Hub workflow contract

**Status:** local foundation slice; authenticated service is not live-verified.

## Intended task

The first Field Hub workflow helps the founder prepare an internal draft quote from window and screen counts. The main path is:

1. Enter measurement counts.
2. Apply the current approved pricebook.
3. Review the resulting non-binding draft before any customer communication.

The interface must keep the user oriented to these steps and show which prerequisite is missing. It must never fill the gaps with invented rates, customer information, consent, or schedule availability.

## Environment behavior

| Mode | What works | What is stored | What it does not do |
|---|---|---|---|
| Local preview: development with no Supabase configuration | Try the measurement form and inspect the quote sequence | Window/screen counts in this browser tab's session storage | No owner session, customer/lead record, price, API call, booking, or message |
| Configured owner environment | Founder-only, MFA-gated request to prepare a quote using the approved pricebook | Atomic lead/quote result from the authenticated API and database RPC | No pricebook authoring, customer-facing acceptance, message, schedule, or payment |

The local preview's success message means only that a temporary browser-session sample was saved. It must not say a lead or quote was created. An unavailable owner-record API must be presented separately from a successful empty result. Missing approved rates fail closed and preserve the entered counts for a retry.

## Data and access boundaries

- Do not collect contact, property, address, or free-text notes until consent wording, purpose, access, retention, deduplication, and deletion behavior are approved.
- Keep arbitrary `owner_hub_records.payload` values out of the browser response and general list view. The list shows an allowlisted record type and creation time only.
- Keep founder identity and AAL2 enforcement in the server/API/database. A development preview must never weaken configured or production access checks.
- Keep quote amounts tied to an approved, effective, immutable pricebook snapshot. A draft remains non-binding and requires a human review.

## Next product sequence

1. Add owner-managed pricebook entry and approval, with effective dates, currency, tax rules, audit history, and rollback checks.
2. Add lead details only after the privacy/consent/retention contract is agreed and enforced on the server.
3. Add job and visit records as distinct entities with explicit, audited state transitions before scheduling or dispatch UI.
4. Add customer delivery only after approved terms, recipient verification, consent, retry/idempotency, and delivery readback are in place.

## UI direction for this slice

Keep the restrained exterior-service palette and existing wordmark. Make the measurements action the clear starting point, show the three real quote stages together, and give empty, unavailable, and pricebook-required states different guidance. Use readable supporting text, visible keyboard focus, comfortable touch targets, responsive stacking, and no decorative imagery or unsupported dashboard metrics.

## Source of truth

The maintained repository and its release-gate register own technical and product status. Second Brain web-product craft notes provide reusable methods, not project evidence. No Apex-specific current project summary was admitted by the governed vault search for this pass; do not treat a local preview sample as a project record.
