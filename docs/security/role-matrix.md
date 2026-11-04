# Role matrix — planned

| Principal | Field Hub | Sales data | Assigned jobs | Own customer portal | Agent tools |
|---|---:|---:|---:|---:|---:|
| Exact bootstrapped founder subject + verified MFA | Allow | Allow | Allow | Allow | Owner actions require explicit UI/API confirmation |
| Sales rep | Deny | Assigned territory only | Deny | Deny | Deny |
| Technician | Deny | Deny | Assigned work only | Deny | Deny |
| Homeowner | Deny | Deny | Own appointments only | Own records only | Deny |
| Integration/AI service principal | Deny | Named capability only | Named capability only | Deny | No owner credentials |

**Implemented in this slice:** Node routes verify the user through Supabase Auth, compare the verified subject with a configured founder subject, forward the user's JWT to PostgREST, then use RLS to bind access to the provisioned non-anonymous founder subject, active status, `aal2`, and founder organization. Runtime roles, including `service_role`, have no direct table grants on these owner tables; the lead/quote RPC is `SECURITY INVOKER` and executable by `authenticated` only. HTTP/PGlite tests cover route denial and SQL RLS, but their Auth adapter and claims are simulated. Quote snapshots are append-only and approved pricebook rates cannot be edited after approval. Founder principal bootstrap/recovery changes are audit logged; two-person approval remains a manual control.

**Implemented but not live-verified:** private owner web shell with cookie-backed sign-in, TOTP enrollment/challenge, server claim checks, Field Hub, and quote proxy. **Not verified or built:** real Supabase project/JWT requests, owner bootstrap ceremony, deployed PostgreSQL/Supabase migration, browser session/MFA behavior against a live project, authorization audit, staff/customer scoping. The injected test Auth adapter is not evidence of real identity verification.
