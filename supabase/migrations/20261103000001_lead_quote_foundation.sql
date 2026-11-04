alter table app_private.founder_principal
  add column if not exists organization_id uuid not null;

create or replace function app_private.founder_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
  from app_private.founder_principal
  where singleton = true
    and subject_id = (select auth.uid())
    and status = 'active'
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and (select auth.jwt() ->> 'is_anonymous') = 'false';
$$;

revoke all on function app_private.founder_organization_id() from public;
grant execute on function app_private.founder_organization_id() to authenticated;

alter table public.owner_hub_records
  add column if not exists organization_id uuid not null;

drop policy owner_hub_select_founder on public.owner_hub_records;
drop policy owner_hub_insert_founder on public.owner_hub_records;
drop policy owner_hub_update_founder on public.owner_hub_records;
drop policy owner_hub_delete_founder on public.owner_hub_records;

create policy owner_hub_select_founder
  on public.owner_hub_records for select to authenticated
  using ((select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id()));

create policy owner_hub_insert_founder
  on public.owner_hub_records for insert to authenticated
  with check ((select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id())
    and created_by = (select auth.uid()));

create policy owner_hub_update_founder
  on public.owner_hub_records for update to authenticated
  using ((select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id()))
  with check ((select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id())
    and created_by = (select auth.uid()));

create policy owner_hub_delete_founder
  on public.owner_hub_records for delete to authenticated
  using ((select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id()));

create table public.leads (
  id uuid primary key,
  organization_id uuid not null,
  idempotency_key text not null check (length(idempotency_key) between 8 and 120),
  request_hash text not null check (length(request_hash) = 64),
  lead_source text not null check (lead_source in ('inbound_form', 'referral', 'door_visit', 'returning_customer', 'manual')),
  window_count integer not null check (window_count between 1 and 10000),
  screen_count integer not null default 0 check (screen_count between 0 and 10000),
  sms_consent boolean not null default false,
  email_consent boolean not null default false,
  consent_recorded_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  unique (id, organization_id),
  check ((sms_consent or email_consent) = (consent_recorded_at is not null))
);

create table public.pricebooks (
  id uuid primary key,
  organization_id uuid not null,
  version text not null check (length(version) between 1 and 80),
  status text not null check (status in ('draft', 'approved', 'retired')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  exterior_pane_cents integer not null check (exterior_pane_cents >= 0),
  screen_cents integer not null check (screen_cents >= 0),
  effective_at timestamptz not null,
  expires_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id, version),
  unique (id, organization_id),
  check (status <> 'approved' or (approved_by is not null and approved_at is not null)),
  check (expires_at is null or expires_at > effective_at)
);

create unique index pricebooks_one_current_approved_per_org
  on public.pricebooks (organization_id)
  where status = 'approved';

create table public.quotes (
  id uuid primary key,
  organization_id uuid not null,
  lead_id uuid not null,
  pricebook_id uuid not null,
  idempotency_key text not null check (length(idempotency_key) between 8 and 120),
  request_hash text not null check (length(request_hash) = 64),
  pricebook_version text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  input_snapshot jsonb not null,
  line_items jsonb not null,
  subtotal_cents bigint not null check (subtotal_cents >= 0),
  tax_status text not null default 'not_configured' check (tax_status = 'not_configured'),
  status text not null default 'draft_requires_review' check (status = 'draft_requires_review'),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  foreign key (lead_id, organization_id) references public.leads(id, organization_id),
  foreign key (pricebook_id, organization_id) references public.pricebooks(id, organization_id)
);

create index leads_org_created_idx on public.leads (organization_id, created_at desc);
create index quotes_org_created_idx on public.quotes (organization_id, created_at desc);

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array['leads', 'pricebooks', 'quotes'] loop
    execute format('alter table public.%I enable row level security', relation_name);
    execute format('alter table public.%I force row level security', relation_name);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', relation_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', relation_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select app_private.is_bootstrapped_founder()) and organization_id = (select app_private.founder_organization_id()))',
      relation_name || '_founder_select', relation_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select app_private.is_bootstrapped_founder()) and organization_id = (select app_private.founder_organization_id()))',
      relation_name || '_founder_insert', relation_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select app_private.is_bootstrapped_founder()) and organization_id = (select app_private.founder_organization_id())) with check ((select app_private.is_bootstrapped_founder()) and organization_id = (select app_private.founder_organization_id()))',
      relation_name || '_founder_update', relation_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select app_private.is_bootstrapped_founder()) and organization_id = (select app_private.founder_organization_id()))',
      relation_name || '_founder_delete', relation_name
    );
  end loop;
end
$$;

-- Quote snapshots are append-only evidence; corrections create a new quote.
create or replace function app_private.reject_quote_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Quote snapshots are immutable; create a corrected quote';
end;
$$;

create trigger quotes_immutable
  before update or delete on public.quotes
  for each row execute function app_private.reject_quote_mutation();

revoke update, delete on table public.quotes from authenticated;
drop policy quotes_founder_update on public.quotes;
drop policy quotes_founder_delete on public.quotes;

-- An approved version is immutable. Retire it, then insert a new draft/version.
create or replace function app_private.prevent_approved_pricebook_edits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'approved' and (
    new.organization_id is distinct from old.organization_id or
    new.version is distinct from old.version or
    new.currency is distinct from old.currency or
    new.exterior_pane_cents is distinct from old.exterior_pane_cents or
    new.screen_cents is distinct from old.screen_cents or
    new.effective_at is distinct from old.effective_at or
    new.expires_at is distinct from old.expires_at or
    new.approved_by is distinct from old.approved_by or
    new.approved_at is distinct from old.approved_at or
    new.created_by is distinct from old.created_by
  ) then
    raise exception 'Approved pricebook versions are immutable; create a new version';
  end if;
  return new;
end;
$$;

create trigger pricebooks_approved_immutable
  before update on public.pricebooks
  for each row execute function app_private.prevent_approved_pricebook_edits();

drop policy pricebooks_founder_insert on public.pricebooks;
drop policy pricebooks_founder_update on public.pricebooks;
drop policy pricebooks_founder_delete on public.pricebooks;

create policy pricebooks_founder_insert
  on public.pricebooks for insert to authenticated
  with check (
    (select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id())
    and created_by = (select auth.uid())
    and (status <> 'approved' or approved_by = (select auth.uid()))
  );

create policy pricebooks_founder_update
  on public.pricebooks for update to authenticated
  using (
    (select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id())
  )
  with check (
    (select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id())
    and created_by = (select auth.uid())
    and (status <> 'approved' or approved_by = (select auth.uid()))
  );

create policy pricebooks_founder_delete
  on public.pricebooks for delete to authenticated
  using (
    (select app_private.is_bootstrapped_founder())
    and organization_id = (select app_private.founder_organization_id())
    and status <> 'approved'
  );

-- Runtime roles cannot mutate the founder subject or organization binding.
revoke all on table app_private.founder_principal from anon, authenticated, service_role;
