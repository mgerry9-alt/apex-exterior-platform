import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { prepareLeadQuoteRequest } from '../packages/domain/lead-to-quote.ts';

const ownerId = '11111111-1111-4111-8111-111111111111';
const staffId = '22222222-2222-4222-8222-222222222222';
const recordId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const organizationId = '33333333-3333-4333-8333-333333333333';
const migrations = await Promise.all([
  readFile(new URL('../supabase/migrations/20261103000000_founder_field_hub_rls.sql', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20261103000001_lead_quote_foundation.sql', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20261103000002_lead_quote_rpc.sql', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/migrations/20261103000003_founder_principal_audit.sql', import.meta.url), 'utf8')
]);

function asRpcParams(input) {
  return Object.values(prepareLeadQuoteRequest(input));
}

async function captureViaDatabaseRpc(db, input) {
  return db.query(
    `select public.capture_lead_and_quote(
      $1::text, $2::text, $3::integer, $4::integer, $5::boolean, $6::boolean, $7::text, $8::text
    ) as result`,
    asRpcParams(input)
  );
}

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
     values ($1, $2, 'test-fixture', '{"visibility":"founder-only"}', $3)`,
    [recordId, organizationId, ownerId]
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

async function assume(db, role, subjectId, claims = {}) {
  await db.exec('reset role;');
  if (subjectId) {
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [subjectId]);
  } else {
    await db.exec(`select set_config('request.jwt.claim.sub', '', false);`);
  }
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ is_anonymous: subjectId === null, ...claims })]);
  await db.exec(`set role ${role};`);
}

test('PostgreSQL RLS denies anonymous access and direct privileges', async () => {
  const db = await createDatabase();
  try {
    await assume(db, 'anon', null);
    await assert.rejects(
      db.query('select * from public.owner_hub_records'),
      /permission denied|insufficient privilege/i
    );
  } finally {
    await db.close();
  }
});

test('staff cannot read or write owner records even with a forged owner role claim', async () => {
  const db = await createDatabase();
  try {
    await assume(db, 'authenticated', staffId, {
      sub: staffId,
      role: 'authenticated',
      aal: 'aal2',
      app_metadata: { role: 'founding_owner' }
    });
    assert.deepEqual((await db.query('select * from public.owner_hub_records')).rows, []);
    assert.deepEqual(
      (await db.query('select * from public.owner_hub_records where id = $1', [recordId])).rows,
      []
    );
    await assert.rejects(
      db.query(
        `insert into public.owner_hub_records(id, organization_id, record_type, created_by)
         values ($1, $2, 'tamper', $3)`,
        ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', organizationId, staffId]
      ),
      /row-level security|policy/i
    );
    assert.equal((await db.query(`update public.owner_hub_records set payload = '{"tampered":true}' where id = $1 returning id`, [recordId])).rows.length, 0);
    assert.equal((await db.query(`delete from public.owner_hub_records where id = $1 returning id`, [recordId])).rows.length, 0);
    await assume(db, 'authenticated', ownerId, { sub: ownerId, role: 'authenticated', aal: 'aal2' });
    assert.equal((await db.query('select * from public.owner_hub_records')).rows.length, 1);
    assert.equal((await db.query(`select payload->>'tampered' as tampered from public.owner_hub_records where id = $1`, [recordId])).rows[0].tampered, null);
    await assume(db, 'authenticated', staffId, { sub: staffId, role: 'authenticated', aal: 'aal2' });
    await assert.rejects(
      db.query('select * from app_private.founder_principal'),
      /permission denied|insufficient privilege/i
    );
    await assert.rejects(
      db.query(`insert into app_private.founder_principal(singleton, subject_id, status, provisioned_by)
                values (false, $1, 'active', 'client')`, [staffId]),
      /permission denied|insufficient privilege/i
    );
    await assert.rejects(
      db.query('select * from app_private.founder_principal_audit'),
      /permission denied|insufficient privilege/i
    );
    await assume(db, 'service_role', staffId);
    await assert.rejects(
      db.query('select * from public.owner_hub_records'),
      /permission denied|insufficient privilege/i
    );
    await assert.rejects(
      db.query('select * from public.leads'),
      /permission denied|insufficient privilege/i
    );
    for (const table of ['pricebooks', 'quotes']) {
      await assert.rejects(
        db.query(`select * from public.${table}`),
        /permission denied|insufficient privilege/i
      );
    }
    await assert.rejects(
      db.query(`select public.capture_lead_and_quote('blocked-key', 'manual', 1, 0, false, false, repeat('a', 64), repeat('b', 64))`),
      /permission denied|insufficient privilege/i
    );
  } finally {
    await db.close();
  }
});

test('matching founder subject without AAL2 is denied by the database', async () => {
  const db = await createDatabase();
  try {
    await assume(db, 'authenticated', ownerId, { sub: ownerId, role: 'authenticated', aal: 'aal1' });
    assert.deepEqual((await db.query('select * from public.owner_hub_records')).rows, []);
    await assert.rejects(
      db.query(
        `insert into public.owner_hub_records(id, organization_id, record_type, created_by)
         values ($1, $2, 'no-mfa', $3)`,
        ['cccccccc-cccc-4ccc-8ccc-cccccccccccc', organizationId, ownerId]
      ),
      /row-level security|policy/i
    );
  } finally {
    await db.close();
  }
});

test('founder subject with an anonymous Auth identity is denied by the database', async () => {
  const db = await createDatabase();
  try {
    await assume(db, 'authenticated', ownerId, { sub: ownerId, role: 'authenticated', aal: 'aal2', is_anonymous: true });
    assert.deepEqual((await db.query('select * from public.owner_hub_records')).rows, []);
    await assert.rejects(
      captureViaDatabaseRpc(db, { idempotencyKey: 'request-anonymous-01', source: 'manual', windowCount: 2 }),
      { code: '42501' }
    );
  } finally {
    await db.close();
  }
});

test('exact founder subject with AAL2 can read, insert, update, and delete owner records', async () => {
  const db = await createDatabase();
  try {
    await assume(db, 'authenticated', ownerId, { sub: ownerId, role: 'authenticated', aal: 'aal2' });
    assert.equal((await db.query('select * from public.owner_hub_records')).rows.length, 1);
    await db.query(
      `insert into public.owner_hub_records(id, organization_id, record_type, created_by)
       values ($1, $2, 'owner-created', $3)`,
      ['dddddddd-dddd-4ddd-8ddd-dddddddddddd', organizationId, ownerId]
    );
    await db.query(
      `update public.owner_hub_records set payload = '{"updated":true}' where id = $1`,
      [recordId]
    );
    assert.equal(
      (await db.query(`select payload->>'updated' as updated from public.owner_hub_records where id = $1`, [recordId])).rows[0].updated,
      'true'
    );
    await db.query(`delete from public.owner_hub_records where id = $1`, [recordId]);
    assert.equal((await db.query('select * from public.owner_hub_records')).rows.length, 1);
  } finally {
    await db.close();
  }
});

test('founder lead-to-quote database RPC persists once and replays idempotently', async () => {
  const db = await createDatabase();
  try {
    await assume(db, 'authenticated', ownerId, { sub: ownerId, role: 'authenticated', aal: 'aal2' });
    const input = {
      idempotencyKey: 'request-00000001',
      source: 'referral',
      windowCount: 12,
      screenCount: 4,
      smsConsent: false,
      emailConsent: false
    };
    const first = (await captureViaDatabaseRpc(db, input)).rows[0].result;
    const replay = (await captureViaDatabaseRpc(db, input)).rows[0].result;
    assert.equal(first.lead.id, replay.lead.id);
    assert.equal(first.quote.id, replay.quote.id);
    assert.equal(Number(first.quote.subtotal_cents), 16200);
    assert.equal(first.quote.status, 'draft_requires_review');
    assert.equal(first.quote.tax_status, 'not_configured');
    assert.equal(first.replayed, false);
    await assert.rejects(
      db.query(`update public.quotes set subtotal_cents = 0 where id = $1`, [first.quote.id]),
      /permission denied|insufficient privilege/i
    );
    assert.equal(Number((await db.query(`select subtotal_cents from public.quotes where id = $1`, [first.quote.id])).rows[0].subtotal_cents), 16200);
    const counts = await db.query(`select (select count(*) from public.leads) as leads, (select count(*) from public.quotes) as quotes`);
    assert.equal(Number(counts.rows[0].leads), 1);
    assert.equal(Number(counts.rows[0].quotes), 1);
    await assert.rejects(
      captureViaDatabaseRpc(db, { ...input, windowCount: 13 }),
      { code: '22023' }
    );
    await assume(db, 'authenticated', staffId, { sub: staffId, role: 'authenticated', aal: 'aal2' });
    assert.deepEqual((await db.query('select * from public.leads')).rows, []);
    assert.deepEqual((await db.query('select * from public.quotes')).rows, []);
    await db.query('delete from public.leads');
    assert.equal((await db.query('select count(*) as count from public.leads')).rows[0].count, 0);
  } finally {
    await db.close();
  }
});

test('direct database RPC denies staff and founder sessions without AAL2', async () => {
  const db = await createDatabase();
  try {
    const input = { idempotencyKey: 'request-00000003', source: 'manual', windowCount: 4 };
    await assume(db, 'authenticated', staffId, {
      sub: staffId, role: 'authenticated', aal: 'aal2', app_metadata: { role: 'founding_owner' }
    });
    await assert.rejects(captureViaDatabaseRpc(db, input), { code: '42501' });

    await assume(db, 'authenticated', ownerId, { sub: ownerId, role: 'authenticated', aal: 'aal1' });
    await assert.rejects(captureViaDatabaseRpc(db, input), { code: '42501' });
    assert.equal(Number((await db.query('select count(*) as count from public.leads')).rows[0].count), 0);
  } finally {
    await db.close();
  }
});

test('offline founder identity changes require a reason and append an audit record', async () => {
  const db = await createDatabase();
  try {
    const before = await db.query('select count(*) as count from app_private.founder_principal_audit');
    assert.equal(Number(before.rows[0].count), 1);
    await assert.rejects(
      db.query(`update app_private.founder_principal set subject_id = $1 where singleton = true`, [staffId]),
      /app\.founder_change_reason/i
    );
    await db.query(`select set_config('app.founder_change_reason', 'approved recovery ticket SEC-123', false)`);
    await db.query(`update app_private.founder_principal set subject_id = $1 where singleton = true`, [staffId]);
    const event = await db.query(
      `select event_type, old_subject_id, new_subject_id, reason
       from app_private.founder_principal_audit order by id desc limit 1`
    );
    assert.equal(event.rows[0].event_type, 'update');
    assert.equal(event.rows[0].old_subject_id, ownerId);
    assert.equal(event.rows[0].new_subject_id, staffId);
    assert.equal(event.rows[0].reason, 'approved recovery ticket SEC-123');
  } finally {
    await db.close();
  }
});

test('missing approved pricebook rolls back lead creation', async () => {
  const db = await createDatabase();
  try {
    await db.exec(`delete from public.pricebooks;`);
    await assume(db, 'authenticated', ownerId, { sub: ownerId, role: 'authenticated', aal: 'aal2' });
    await assert.rejects(
      captureViaDatabaseRpc(db, {
        idempotencyKey: 'request-00000002', source: 'manual', windowCount: 4
      }),
      { code: 'P0002' }
    );
    const counts = await db.query(`select count(*) as count from public.leads`);
    assert.equal(Number(counts.rows[0].count), 0);
  } finally {
    await db.close();
  }
});

test('approved pricebook rates are immutable and cannot be deleted', async () => {
  const db = await createDatabase();
  try {
    await assume(db, 'authenticated', ownerId, { sub: ownerId, role: 'authenticated', aal: 'aal2' });
    await assert.rejects(
      db.query(`update public.pricebooks set exterior_pane_cents = 1 where version = 'test-approved-v1'`),
      /immutable/i
    );
    assert.equal(
      (await db.query(`delete from public.pricebooks where version = 'test-approved-v1' returning id`)).rows.length,
      0
    );
    assert.equal(
      Number((await db.query(`select exterior_pane_cents from public.pricebooks where version = 'test-approved-v1'`)).rows[0].exterior_pane_cents),
      1250
    );
  } finally {
    await db.close();
  }
});
