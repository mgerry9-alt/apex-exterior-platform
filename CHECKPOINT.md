# Apex Field OS checkpoint

**Status:** Local prototype; no production readiness claim.
**Current source:** `codex/field-hub-workflow-ux` and its reviewed follow-up changes.
**Primary user path:** Founder-only Field Hub preview at `127.0.0.1:3000`; legacy Ruby evidence-review page at `127.0.0.1:3001`.
**Live services:** No configured Supabase project, approved pricebook UI, messaging provider, field hardware, payment provider, customer portal, or verified operational workflow.

## Implemented in this repository

- Local Field Hub preview with counts-only session storage and explicit measurement → approved rates → human review steps.
- Node API and database migrations for a founder/MFA-gated foundation; live authentication and deployed database policies remain unverified.
- Ruby/WEBrick hardening from the earlier fixed prototype: loopback default, admin-token gate for private API routes, origin allowlist, request limits, safe error responses, path containment, and messaging disabled by default.
- Legacy Ruby root and direct customer-facing demo pages replaced by evidence-hold notices.

## Verification limits

Node checks cover simulated claims and local UI behavior; they do not prove production identity, legal compliance, customer outcomes, provider integrations, hardware accuracy, or payment settlement. The Ruby interpreter was unavailable for this pass, so Ruby syntax and regression tests were not run. The public repository previously tracked a SQLite database and a credential-containing source file; the credential should be rotated, and removing a file from a new commit does not erase it from Git history.

See `docs/qa/release-gates.md` for dated checks and remaining blockers. This checkpoint replaces earlier completion claims; it does not certify the old investor, research, pricing, or warranty materials.
