-- This function is called through Supabase PostgREST with the user's bearer
-- JWT. SECURITY INVOKER keeps grants and row policies in force.
create or replace function public.current_founder_access()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select app_private.is_bootstrapped_founder();
$$;

revoke all on function public.current_founder_access() from public, anon;
grant execute on function public.current_founder_access() to authenticated;

create or replace function public.capture_lead_and_quote(
  p_idempotency_key text,
  p_lead_source text,
  p_window_count integer,
  p_screen_count integer,
  p_sms_consent boolean,
  p_email_consent boolean,
  p_request_hash text,
  p_quote_request_hash text
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_organization_id uuid := (select app_private.founder_organization_id());
  v_lead public.leads%rowtype;
  v_pricebook public.pricebooks%rowtype;
  v_quote public.quotes%rowtype;
  v_quote_key text := 'quote:' || p_idempotency_key;
  v_consent_at timestamptz := case when p_sms_consent or p_email_consent then now() else null end;
  v_lead_created boolean;
  v_quote_created boolean;
  v_window_total bigint;
  v_screen_total bigint;
  v_subtotal bigint;
  v_lines jsonb;
begin
  if v_actor is null or v_organization_id is null then
    raise exception using errcode = '42501', message = 'Founder access with MFA is required';
  end if;

  insert into public.leads (
    id, organization_id, idempotency_key, request_hash, lead_source,
    window_count, screen_count, sms_consent, email_consent,
    consent_recorded_at, created_by
  ) values (
    gen_random_uuid(), v_organization_id, p_idempotency_key, p_request_hash,
    p_lead_source, p_window_count, p_screen_count, p_sms_consent,
    p_email_consent, v_consent_at, v_actor
  )
  on conflict (organization_id, idempotency_key) do nothing
  returning * into v_lead;
  v_lead_created := v_lead.id is not null;

  if v_lead.id is null then
    select * into v_lead
    from public.leads
    where organization_id = v_organization_id
      and idempotency_key = p_idempotency_key;
    if v_lead.id is null or v_lead.request_hash is distinct from p_request_hash then
      raise exception using errcode = '22023', message = 'Idempotency key was already used for different lead input';
    end if;
  end if;

  select * into v_pricebook
  from public.pricebooks
  where organization_id = v_organization_id
    and status = 'approved'
    and effective_at <= now()
    and (expires_at is null or expires_at > now())
  order by effective_at desc
  limit 1
  for share;

  if v_pricebook.id is null then
    raise exception using errcode = 'P0002', message = 'No currently effective approved pricebook is configured';
  end if;

  v_window_total := p_window_count::bigint * v_pricebook.exterior_pane_cents::bigint;
  v_screen_total := p_screen_count::bigint * v_pricebook.screen_cents::bigint;
  v_subtotal := v_window_total + v_screen_total;
  v_lines := jsonb_build_array(
    jsonb_build_object('code', 'exterior_pane', 'quantity', p_window_count,
      'unit_cents', v_pricebook.exterior_pane_cents, 'total_cents', v_window_total),
    jsonb_build_object('code', 'screen', 'quantity', p_screen_count,
      'unit_cents', v_pricebook.screen_cents, 'total_cents', v_screen_total)
  );

  insert into public.quotes (
    id, organization_id, lead_id, pricebook_id, idempotency_key,
    request_hash, pricebook_version, currency, input_snapshot,
    line_items, subtotal_cents, created_by
  ) values (
    gen_random_uuid(), v_organization_id, v_lead.id, v_pricebook.id, v_quote_key,
    p_quote_request_hash, v_pricebook.version, v_pricebook.currency,
    jsonb_build_object('lead_source', p_lead_source,
      'window_count', p_window_count, 'screen_count', p_screen_count),
    v_lines, v_subtotal, v_actor
  )
  on conflict (organization_id, idempotency_key) do nothing
  returning * into v_quote;
  v_quote_created := v_quote.id is not null;

  if v_quote.id is null then
    select * into v_quote
    from public.quotes
    where organization_id = v_organization_id
      and idempotency_key = v_quote_key;
    if v_quote.id is null or v_quote.request_hash is distinct from p_quote_request_hash then
      raise exception using errcode = '22023', message = 'Quote idempotency key conflicts with another request';
    end if;
  end if;

  return jsonb_build_object(
    'lead', to_jsonb(v_lead),
    'quote', to_jsonb(v_quote),
    'replayed', not v_lead_created or not v_quote_created
  );
end;
$$;

revoke all on function public.capture_lead_and_quote(text, text, integer, integer, boolean, boolean, text, text)
  from public, anon;
grant execute on function public.capture_lead_and_quote(text, text, integer, integer, boolean, boolean, text, text)
  to authenticated;
