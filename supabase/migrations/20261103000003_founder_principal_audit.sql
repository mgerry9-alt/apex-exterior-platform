create table app_private.founder_principal_audit (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('bootstrap', 'update')),
  old_subject_id uuid,
  new_subject_id uuid not null,
  old_organization_id uuid,
  new_organization_id uuid not null,
  old_status text,
  new_status text not null,
  actor text not null,
  reason text not null,
  application_name text,
  occurred_at timestamptz not null default now()
);

alter table app_private.founder_principal_audit enable row level security;
alter table app_private.founder_principal_audit force row level security;
revoke all on table app_private.founder_principal_audit from public, anon, authenticated, service_role;

create or replace function app_private.audit_founder_principal_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  change_reason text := nullif(current_setting('app.founder_change_reason', true), '');
begin
  if tg_op = 'DELETE' then
    raise exception 'Founder principal cannot be deleted; disable or recover it through the offline procedure';
  end if;

  if tg_op = 'UPDATE' and change_reason is null then
    raise exception 'Set app.founder_change_reason for an audited offline identity change';
  end if;

  insert into app_private.founder_principal_audit (
    event_type, old_subject_id, new_subject_id,
    old_organization_id, new_organization_id, old_status, new_status,
    actor, reason, application_name
  ) values (
    case when tg_op = 'INSERT' then 'bootstrap' else 'update' end,
    case when tg_op = 'INSERT' then null else old.subject_id end,
    new.subject_id,
    case when tg_op = 'INSERT' then null else old.organization_id end,
    new.organization_id,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status,
    session_user::text,
    coalesce(change_reason, 'one-time founder bootstrap'),
    nullif(current_setting('application_name', true), '')
  );
  return new;
end;
$$;

revoke all on function app_private.audit_founder_principal_change() from public, anon, authenticated;

create trigger founder_principal_audit_changes
  before insert or update or delete on app_private.founder_principal
  for each row execute function app_private.audit_founder_principal_change();
