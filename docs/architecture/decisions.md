# Architecture decisions

## ADR-001 — Isolate the foundation from the Ruby demo

**Decision:** Keep existing public Ruby pages on evidence hold and the legacy bearer-token API separate from owner identity. Build the new owner route in a Node API using Supabase Auth and user-scoped PostgREST.

**Reason:** The supplied project has no maintained manifest, no Ruby runtime in the validation environment, and its shared admin token cannot represent a stable founder subject with MFA. Node 24 is installed and in Maintenance LTS. This is an incremental foundation, not a production stack decision.

**Status:** Supabase Auth/PostgREST is selected for this first slice. Production deployment and adversarial live identity tests remain required.

## ADR-002 — Keep the first persisted slice narrow and non-binding

**Decision:** Add organization-scoped lead, pricebook, and quote tables behind founder-subject/AAL2 RLS. Persist lead capture and an integer-cent draft quote in one idempotent transaction. Approved pricebook rates cannot be edited; quote snapshots are append-only. The quote is explicitly marked as requiring review and tax is not configured.

**Reason:** This proves a small data path while avoiding unsupported service, tax, or customer-facing price claims. PGlite allows local SQL policy and transaction checks without pretending a Supabase project exists.

**Limit:** The API invokes Supabase Auth `getUser` and forwards the user JWT to PostgREST; a separate Next.js owner web app provides cookie-backed sign-in and TOTP MFA. Only an injected API test adapter, PGlite, owner-app type check, and production build were exercised. Real identity bootstrap, live MFA, deployment, customer UI, and consent workflow remain separate gates.

## ADR-003 — Use user-scoped PostgREST for owner routes

**Decision:** The Node HTTP API verifies the supplied user access token with Supabase Auth, checks the verified user ID against the configured founder subject, then performs RLS-protected calls with that same bearer token and publishable key. Lead-to-quote uses a `SECURITY INVOKER` SQL RPC so the transaction is atomic and table policies remain active.

**Reason:** This avoids a service-role credential or privileged pooled database connection in the request path. RLS still protects direct PostgREST access independently of the Node route.

**Limit:** No project URL, key, founder subject, bootstrap row, or live JWT was available for a deployed integration check.
