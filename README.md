# Apex Field OS — prototype repository

This repository contains a founder-only Field Hub foundation and a legacy Ruby demo. It is not a production service. The current implemented workflow is deliberately small: an owner can preview window/screen measurements, then use the configured owner path to prepare an internal draft quote after an approved pricebook is available. Quotes require human review. Customer contact, outreach, live pricing setup, jobs, scheduling, payments, and field telemetry are not available as verified production workflows.

## Start the Field Hub

Requires Node.js 24.x and npm. Install the pinned dependencies once:

```sh
npm ci
```

Run the owner web app at `http://127.0.0.1:3000`:

```sh
npm run dev:owner
```

With no Supabase configuration in development, `/field-hub` opens a local preview without login. It stores only window/screen counts in this browser session; it does not make a price, save a lead, call the API, or contact anyone. This is a preview mode only. With Supabase configured, the founder identity and MFA checks apply. Follow [the owner setup and release boundaries](docs/product/field-hub-workflow.md) before configuring a service.

The API uses port 3100 and requires `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `APEX_FOUNDER_SUBJECT_ID` before it starts. Do not place service-role keys in this project or in `NEXT_PUBLIC_*` variables. See [.env.example](.env.example) for blank local settings.

## Legacy Ruby demo

The original WEBrick/SQLite interface is retained only for local evidence review. It serves an evidence-hold page and does not expose its former dashboard. It binds to loopback and defaults to port 3001, separate from the Field Hub:

```sh
./scripts/start.sh
```

Or run `ruby server.rb` directly. Ruby, WEBrick, and the sqlite3 gem are required. Live messaging and public webhook/SMS intake are disabled by default. The legacy database is local operational state and must not be committed or shared.

## Checks

Requires Node.js 24.x:

```sh
npm run typecheck
npm run typecheck:owner
npm run build:owner
npm test
```

The 26 Node tests exercise isolated authorization decisions, simulated Auth claims, SQL policies in PGlite, HTTP routes, and deterministic quote arithmetic. They do not verify a deployed Supabase project, signed live JWTs, provider delivery, hardware, or production readiness. The Ruby suite is `ruby test/test_platform.rb`; Ruby checks were not run in the current Windows environment.

## Current scope

- [Field Hub workflow and data boundaries](docs/product/field-hub-workflow.md)
- [Requirements](docs/product/requirements.md)
- [Release gates and verification status](docs/qa/release-gates.md)
- [Security model](docs/security/threat-model.md)

Older pitch, pricing, warranty, research, and workflow materials in this repository are historical drafts. They are not evidence that a claim, price, integration, or service outcome is current or verified. Review them against the dated release gates before use. A previously published SQLite database and legacy credential may remain in Git history; this branch does not rewrite public history.

Legacy investor generators under `scripts/` are blocked by default because they can recreate withdrawn dashboard pages and unsupported claims. Previously tracked deck exports, generated pitch scripts, subscription PDF, handoff prompt, test register, runtime log, and SQLite files are excluded from this branch's current tree; local copies are preserved. Removing them from the tip does not purge prior public commits.
