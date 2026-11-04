# Review status

**Product state:** Local prototype only; production readiness is not established. The older Ruby UI is now an evidence-hold page. The founder Field Hub is a bounded local preview and unauthenticated live services remain disabled.

## Current implementation

- The Node/Next owner slice supports a counts-only local preview and a founder/AAL2-gated quote foundation that requires an approved pricebook and human review.
- Ruby/WEBrick defaults to loopback, uses an admin bearer token for non-public API routes, limits cross-origin access to configured origins, caps request bodies, and returns generic errors. Live messaging, the background dispatcher, public lead intake, and inbound SMS remain off by default.
- The legacy dashboard, estimate, invoice, certificate, rep, subscription, and investor demo pages are evidence-hold notices. They do not establish service, price, provider, hardware, or payment readiness.
- The SQL migrations and PGlite tests cover simulated identities and policies. A live Supabase project, founder bootstrap, signed-token path, and deployed database have not been verified.

## Public-repository data note

The prior public branch tracked `data/outreach.db` and its SQLite sidecar files. This update removes those files from the current branch tree while preserving any local copies; it cannot remove their prior Git objects or make past public exposure private. Their contents were not inspected in this pass. A messaging-provider credential was also present in earlier public source history; rotate it with the provider. The current source copy does not retain that credential.

Legacy investor, pricing, warranty, research, and subscription materials are historical drafts, not evidence or approved customer-facing copy. Previously tracked deck exports, generated pitch scripts, subscription PDF, work register, runtime log, and model handoff are excluded from the current branch tree while local copies are preserved; prior public history is unchanged. Legacy generators are blocked by default. The research and pitch source documents that remain in the tree are clearly marked as historical drafts.

## Checks and limits

The combined Node foundation passed `npm ci`, both TypeScript checks, the owner production build, and 26 Node tests. UI sweeps of the Field Hub and nine legacy HTML routes at 375×812 and 1280×720 reported no automated findings. The legacy routes were served statically, not through WEBrick. Ruby syntax/tests could not be run because Ruby is unavailable in the current environment. No live authentication, deployment, provider messaging, hardware, payment, customer outcome, legal compliance, or warranty claim was verified.

See `docs/qa/release-gates.md` and `docs/product/field-hub-workflow.md` for the authoritative scope and next prerequisites.
