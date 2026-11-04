# Release gates

| Gate | Evidence required | Actual |
|---|---|---|
| A: Bootstrap | One-time auditable founder ceremony; stable subject lock/recovery | BLOCKED |
| B: Owner isolation | API + actual PostgreSQL RLS deny staff, customer, agent and tampered IDs | PARTIAL; HTTP fixtures deny sales, technician, homeowner and AI subjects; PGlite exercises wrong subject/role, non-AAL2, anonymous identity and direct grants. Signed Supabase tokens and deployed Postgres remain unverified |
| C: CRM/territory | Scoped lead and dedupe integration tests | PARTIAL; authenticated founder HTTP route calls RLS-protected transaction RPC; no contact/property data, territory, or staff roles |
| D: Quote | Approved versioned pricebook, exact-cent contract tests, no-binding failure cases | PARTIAL; effective approved pricebook, integer-cent snapshot, rollback, replay, immutability tested in PGlite; owner-only manual draft UI exists, but no approval workflow or live pricebook |
| E–J | Scheduling, payment, AI, hardware, recovery, accessibility, deployment evidence | NOT BUILT |

Commands: `npm run typecheck`, `npm run build`, `npm test`, `npm run typecheck:owner`, `npm run build:owner` — API TypeScript and HTTP/Node/PGlite fixtures plus owner Next.js build on Node 24.16.0. HTTP tests use an injected test Auth adapter; PGlite uses simulated claims/roles. These prove route and SQL behavior under fixtures and owner-app compilation, not real Supabase Auth signature checks, deployed RLS, or live browser/API integration. `npm start` and the owner app require configured Supabase credentials and founder identity for operation. No production gate passes. Live browser authentication, Ruby, external providers, and hardware remain unavailable/unconfigured.

| Verification | Expected | Actual |
|---|---|---|
| `npm ci` | Reproducible dependency install | PASS; lockfile install completed, npm audit reported 0 vulnerabilities |
| `npm run typecheck` | Strict TypeScript check | PASS; exit 0 |
| `npm run build` | Compile runnable API package | PASS; exit 0; compiled health route smoke returned HTTP 200 |
| `npm run typecheck:owner` | Strict owner-app type check | PASS; exit 0 |
| `npm run build:owner` | Production owner-app build | PASS; exit 0 |
| Production no-config smoke | Sign-in/setup status, protected-route behavior, quote denial | PASS; sign-in/setup `200`, Field Hub/MFA redirect `307` to setup, quote endpoint `503` with `no-store` |
| Local no-config preview | Development UI accessible without owner credentials, with clear local-only data and no backend writes | PASS; `/field-hub` returned 200 with preview banner and no owner record payload/session; counts-only quote intake uses browser session storage, with no price or API write; listener bound to `127.0.0.1`. Preview now labels measurements, approved rates, and human review as separate stages |
| `npm test` | Focused auth/API/RLS/pricing/owner-policy/config suite | PASS; 26/26 on Node 24.16.0 |
| Live Supabase integration | Signed JWT, deployed migrations, Auth/PostgREST path | BLOCKED; no project URL, key, founder identity, or psql/Supabase CLI available |
