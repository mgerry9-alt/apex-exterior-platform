# Operations runbooks

No production deployment or external integration is configured. The following founder bootstrap and recovery procedures are implementation guidance only; they have not been rehearsed against a real Supabase project.

## One-time founder bootstrap

1. Create the founder Auth identity through the chosen secure operator process and enroll/verify MFA. Record the immutable Auth UUID; do not derive identity from user-editable metadata.
2. Apply all migrations in `supabase/migrations/` to the intended private project and verify the target project identity out of band.
3. Connect through a protected libpq service/password file from a secret manager; do not put a database URI on the command line. In PowerShell, run `psql "service=apex-field-os-bootstrap" -v founder_subject_id="$env:APEX_FOUNDER_SUBJECT_ID" -v organization_id="$env:APEX_ORGANIZATION_ID" -f supabase/bootstrap-founder.psql`. The script takes an advisory transaction lock, refuses if any founder row exists, inserts the one founder binding, and writes a protected audit event.
4. Set `APEX_FOUNDER_SUBJECT_ID` to that same Auth UUID in the API environment. Start the API only after the DB binding and project URL/key have been checked.
5. Independently verify an AAL2 founder can read the Field Hub and a different signed-in identity and an AAL1 session are denied at both API and database layers.

Never rerun bootstrap to change a founder. The trigger rejects unaudited updates and all deletes. For a recovery, disable API access, preserve the incident evidence, obtain two-person approval and re-prove the replacement identity out of band, then use a privileged database session in a reviewed transaction. Set `app.founder_change_reason` to the incident/change ticket before changing the subject or status; the database records old/new subject, organization, status, operator session, application name, and reason. Dual approval is a human operational control, not cryptographically enforced by this prototype. Recheck the API environment and test the old identity is denied before reopening access.

## Other production runbooks

Before production use, write and rehearse procedures for provider outage and key rotation, customer data export/deletion, payment reconciliation/refund disputes, stale sensor/device alerts, backup/restore, incident response, and migration rollback. Live integrations remain disabled.
