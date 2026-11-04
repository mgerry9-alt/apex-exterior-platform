# Initial threat model

| Threat | Required control | Current evidence | State |
|---|---|---|---|
| Staff claims owner role in request/profile | Verify user with Supabase Auth; compare configured founder subject; ignore profile roles | HTTP negative test plus PGlite RLS test with forged app role | Simulated Auth only; live signed JWT not tested |
| Stolen/weak owner session | MFA AAL2, secure HTTP-only session, rotation/revocation | SQL requires AAL2; HTTP test rejects AAL1 fixture | Real MFA enrollment, browser session controls and live JWT remain BLOCKED |
| Direct API or object-ID access | Supabase user JWT + database RLS + negative tests | API routes invoke PostgREST as the user; PGlite exercises RLS and RPC | Deployed Supabase/Postgres and real direct HTTP attack tests remain BLOCKED |
| Service key bypasses table RLS | Never send service key from owner API; remove table grants and RPC execute for `service_role` | API uses the publishable key and user JWT; PGlite `BYPASSRLS` service role has no table privileges | Real Supabase role grants and project key configuration remain unverified |
| AI/integration token reaches owner APIs | Named service scopes; separate DB role; deny owner capability | None | NOT BUILT |
| Unapproved pricing becomes binding | Versioned approved pricebook; integer cents; draft status | RPC selects effective approved version; immutable pricebook and non-binding status tests | Customer approval UI, tax and owner workflow remain BLOCKED |
| Old demo API is mistaken for product | Keep public interface on evidence hold; do not expose new owner routes | Static UI and routes reviewed previously | Runtime not checked |
