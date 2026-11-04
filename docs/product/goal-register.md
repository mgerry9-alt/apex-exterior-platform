# Goal register

| Goal | Baseline | Target | Measured actual | Status |
|---|---|---|---|---|
| Unauthorized Field Hub denial | No owner identity layer in legacy app | 100% of non-founder requests denied at API and database | HTTP/PGlite fixtures deny staff and AAL1; no live signed-token or deployed measurement | PARTIAL |
| Quote calculation | Legacy calculator disabled; no approved pricebook | Auditable exact-cents result from approved snapshot | Database RPC uses approved version and stores exact integer-cent snapshot; owner manual draft form exists, but no live pricebook or approval workflow | PARTIAL |
| Lead-to-quote workflow | No new product workflow | Lead → approved quote draft with source/consent snapshot | Owner web form calls the founder-only HTTP route and RLS-protected atomic RPC; idempotent replay and rollback checked in PGlite; no customer-facing quote flow or live deployment | PARTIAL |
| Operational value | No pilot baseline supplied | Record baseline/target/actual separately | No field data supplied | NOT MEASURED |
| Availability/performance | No deployed service | Measure after deployment | No deployment or lab measurement | NOT MEASURED |
