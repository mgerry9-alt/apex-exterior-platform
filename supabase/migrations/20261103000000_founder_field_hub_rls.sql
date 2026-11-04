-- The founder subject is provisioned once by an offline/operator ceremony.
-- Client roles cannot insert, update, or delete this row.
create schema if not exists app_private;
revoke all on schema app_private from public;

create table if not exists app_private.founder_principal (
  singleton boolean primary key default true check (singleton),
  subject_id uuid not null unique,
  status text not null check (status in ('active', 'disabled')),
  provisioned_at timestamptz not null default now(),
  provisioned_by text not null
);

alter table app_private.founder_principal enable row level security;
alter table app_private.founder_principal force row level security;
revoke all on table app_private.founder_principal from public;
revoke all on table app_private.founder_principal from anon, authenticated;

-- The Supabase Auth JWT is verified upstream. This function deliberately
-- ignores app/user metadata roles and requires one exact subject plus AAL2.
create or replace function app_private.is_bootstrapped_founder()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select auth.uid() is not null
       and auth.jwt() ->> 'aal' = 'aal2'
       and auth.jwt() ->> 'is_anonymous' = 'false'
       and exists (
         select 1
         from app_private.founder_principal as founder
         where founder.singleton = true
           and founder.subject_id = (select auth.uid())
           and founder.status = 'active'
       )),
    false
  );
$$;

revoke all on function app_private.is_bootstrapped_founder() from public;

create table if not exists public.owner_hub_records (
  id uuid primary key,
  record_type text not null check (length(record_type) between 1 and 80),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

alter table public.owner_hub_records enable row level security;
alter table public.owner_hub_records force row level security;
revoke all on table public.owner_hub_records from public, anon, authenticated, service_role;

-- Grants and policies are both explicit. Authenticated staff may reach the
-- table only when the locked founder subject and MFA assurance both match.
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_bootstrapped_founder() to authenticated;
grant select, insert, update, delete on table public.owner_hub_records to authenticated;

create policy owner_hub_select_founder
  on public.owner_hub_records for select to authenticated
  using ((select app_private.is_bootstrapped_founder()));

create policy owner_hub_insert_founder
  on public.owner_hub_records for insert to authenticated
  with check (
    (select app_private.is_bootstrapped_founder())
    and created_by = (select auth.uid())
  );

create policy owner_hub_update_founder
  on public.owner_hub_records for update to authenticated
  using ((select app_private.is_bootstrapped_founder()))
  with check (
    (select app_private.is_bootstrapped_founder())
    and created_by = (select auth.uid())
  );

create policy owner_hub_delete_founder
  on public.owner_hub_records for delete to authenticated
  using ((select app_private.is_bootstrapped_founder()));
