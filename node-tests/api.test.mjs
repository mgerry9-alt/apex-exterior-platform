import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createApiServer } from '../apps/api/app.ts';

const ownerId = '11111111-1111-4111-8111-111111111111';
const staffId = '22222222-2222-4222-8222-222222222222';
const organizationId = '33333333-3333-4333-8333-333333333333';
const authCases = {
  'signed-owner-aal2': { id: ownerId, aal: 'aal2' },
  'signed-owner-aal1': { id: ownerId, aal: 'aal1' },
  'signed-staff-aal2': { id: staffId, aal: 'aal2' },
  'signed-sales-aal2': { id: '44444444-4444-4444-8444-444444444444', aal: 'aal2', claimedRole: 'sales_rep' },
  'signed-technician-aal2': { id: '55555555-5555-4555-8555-555555555555', aal: 'aal2', claimedRole: 'technician' },
  'signed-homeowner-aal2': { id: '66666666-6666-4666-8666-666666666666', aal: 'aal2', claimedRole: 'homeowner' },
  'signed-agent-aal2': { id: '77777777-7777-4777-8777-777777777777', aal: 'aal2', claimedRole: 'ai_service' }
};
const migrations = await Promise.all([
  readFile(new URL('../supabase/migrations/20261103000000_founder_field_hub_rls.sql', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20261103000001_lead_quote_foundation.sql', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20261103000002_lead_quote_rpc.sql', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20261103000003_founder_principal_audit.sql', import.meta.url), 'utf8')
]);

async function createDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
    $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
    grant execute on function auth.jwt() to authenticated;
  `);
  for (const migration of migrations) await db.exec(migration);
  await db.query(
    `insert into app_private.founder_principal(singleton, subject_id, organization_id, status, provisioned_by)
     values (true, $1, $2, 'active', 'offline-test-ceremony')`,
    [ownerId, organizationId]
  );
  await db.query(
    `insert into public.owner_hub_records(id, organization_id, record_type, payload, created_by)
     values ($1, $2, 'test-fixture', '{"fixture":"simulated"}', $3)`,
    ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', organizationId, ownerId]
  );
  await db.query(
    `insert into public.pricebooks
       (id, organization_id, version, status, currency, exterior_pane_cents, screen_cents,
        effective_at, approved_by, approved_at, created_by)
     values ($1, $2, 'test-approved-v1', 'approved', 'USD', 1250, 300, now() - interval '1 day', $3, now(), $3)`,
    ['eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', organizationId, ownerId]
  );
  return db;
}

function makeSupabaseTestAdapter(db) {
  return (_url, _key, options) => {
    const token = options.global.headers.Authorization.slice('Bearer '.length);
    const principal = authCases[token];
    return {
      auth: {
        getUser: async supplied => supplied === token && principal
          ? { data: { user: { id: principal.id } }, error: null }
          : { data: { user: null }, error: new Error('invalid token') }
      },
      rpc: async (name, args) => {
        if (!principal) return { data: null, error: { code: '401', message: 'invalid token' } };
        await db.exec('reset role');
        await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [principal.id]);
        const claims = { sub: principal.id, role: 'authenticated', aal: principal.aal, is_anonymous: false };
        if (principal.claimedRole) claims.app_metadata = { role: principal.claimedRole };
        await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(claims)]);
        await db.exec('set role authenticated');
        try {
          if (name === 'current_founder_access') {
            const result = await db.query('select public.current_founder_access() as allowed');
            return { data: result.rows[0].allowed, error: null };
          }
          if (name === 'capture_lead_and_quote') {
            const result = await db.query(
              `select public.capture_lead_and_quote(
                $1::text, $2::text, $3::integer, $4::integer, $5::boolean, $6::boolean, $7::text, $8::text
              ) as result`,
              [args.p_idempotency_key, args.p_lead_source, args.p_window_count, args.p_screen_count,
                args.p_sms_consent, args.p_email_consent, args.p_request_hash, args.p_quote_request_hash]
            );
            return { data: result.rows[0].result, error: null };
          }
          return { data: null, error: { code: '404', message: 'unknown rpc' } };
        } catch (error) {
          return { data: null, error: { code: error.code, message: error.message } };
        }
      },
      from: table => {
        assert.equal(table, 'owner_hub_records');
        const query = {
          select() { return this; },
          order() { return this; },
          limit() { return this; },
          then(resolve, reject) {
            db.query('select id, record_type, created_at from public.owner_hub_records order by created_at desc limit 100')
              .then(result => resolve({ data: result.rows, error: null }), reject);
          }
        };
        return query;
      }
    };
  };
}

async function startTestApi(t) {
  const db = await createDatabase();
  const server = await createApiServer({
    config: {
      supabaseUrl: 'https://test-project.invalid',
      supabasePublishableKey: 'sb_publishable_test',
      founderSubjectId: ownerId,
      allowedOrigins: ['https://app.example.test']
    },
    createSupabaseClient: makeSupabaseTestAdapter(db)
  });
  t.after(async () => {
    await server.close();
    await db.close();
  });
  return server;
}

test('HTTP Field Hub route requires verified founder identity and database AAL2 policy', async t => {
  const server = await startTestApi(t);
  const noToken = await server.inject({ method: 'GET', url: '/api/field-hub' });
  assert.equal(noToken.statusCode, 401);

  const staff = await server.inject({ method: 'GET', url: '/api/field-hub', headers: { authorization: 'Bearer signed-staff-aal2' } });
  assert.equal(staff.statusCode, 403);
  assert.deepEqual(staff.json(), { error: 'founder_access_required' });

  const ownerWithoutMfa = await server.inject({ method: 'GET', url: '/api/field-hub', headers: { authorization: 'Bearer signed-owner-aal1' } });
  assert.equal(ownerWithoutMfa.statusCode, 403);
  assert.deepEqual(ownerWithoutMfa.json(), { error: 'founder_mfa_required' });

  const owner = await server.inject({ method: 'GET', url: '/api/field-hub', headers: { authorization: 'Bearer signed-owner-aal2' } });
  assert.equal(owner.statusCode, 200);
  assert.equal(owner.json().records.length, 1);
});

test('sales, technician, homeowner, and AI principals cannot enter Field Hub', async t => {
  const server = await startTestApi(t);
  for (const token of ['signed-sales-aal2', 'signed-technician-aal2', 'signed-homeowner-aal2', 'signed-agent-aal2']) {
    const response = await server.inject({ method: 'GET', url: '/api/field-hub', headers: { authorization: `Bearer ${token}` } });
    assert.equal(response.statusCode, 403, token);
    assert.deepEqual(response.json(), { error: 'founder_access_required' }, token);
  }
});

test('HTTP lead-to-quote route invokes the same RLS protected transaction and rejects conflicts', async t => {
  const server = await startTestApi(t);
  const input = {
    idempotencyKey: 'api-request-0001', source: 'referral', windowCount: 12, screenCount: 4,
    smsConsent: false, emailConsent: false
  };
  const response = await server.inject({
    method: 'POST',
    url: '/api/leads/quote',
    headers: { authorization: 'Bearer signed-owner-aal2', 'content-type': 'application/json' },
    payload: input
  });
  assert.equal(response.statusCode, 201);
  const first = response.json();
  assert.equal(first.quote.status, 'draft_requires_review');
  assert.equal(Number(first.quote.subtotal_cents), 16200);

  const replay = await server.inject({
    method: 'POST',
    url: '/api/leads/quote',
    headers: { authorization: 'Bearer signed-owner-aal2', 'content-type': 'application/json' },
    payload: input
  });
  assert.equal(replay.statusCode, 200);
  const replayed = replay.json();
  assert.equal(replayed.quote.id, first.quote.id);
  assert.equal(replayed.replayed, true);

  const conflict = await server.inject({
    method: 'POST',
    url: '/api/leads/quote',
    headers: { authorization: 'Bearer signed-owner-aal2', 'content-type': 'application/json' },
    payload: { ...input, windowCount: 13 }
  });
  assert.equal(conflict.statusCode, 409);
  assert.deepEqual(conflict.json(), { error: 'idempotency_key_conflict' });
});

test('HTTP API rejects unconfigured origins and unexpected price or identity inputs', async t => {
  const server = await startTestApi(t);
  const originDenied = await server.inject({ method: 'GET', url: '/api/field-hub',
    headers: { origin: 'https://attacker.example', authorization: 'Bearer signed-owner-aal2' }
  });
  assert.equal(originDenied.statusCode, 403);

  const extraField = await server.inject({
    method: 'POST',
    url: '/api/leads/quote',
    headers: { authorization: 'Bearer signed-owner-aal2', 'content-type': 'application/json' },
    payload: { idempotencyKey: 'api-request-0002', source: 'manual', windowCount: 2, priceCents: 0 }
  });
  assert.equal(extraField.statusCode, 400);
  assert.deepEqual(extraField.json(), { error: 'invalid_request' });
});
