import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { founderAccessDecision } from '../../../../lib/founder-access';
import { hasOwnerAuthConfig } from '../../../../lib/owner-config';

export const dynamic = 'force-dynamic';
const leadSources = new Set(['inbound_form', 'referral', 'door_visit', 'returning_customer', 'manual']);

export async function POST(request: NextRequest) {
  if (!hasOwnerAuthConfig()) return NextResponse.json({ error: 'owner_auth_not_configured' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  const supabase = await createClient();
  const { data: identity } = await supabase.auth.getClaims();
  const claims = identity?.claims;
  const access = founderAccessDecision(claims, process.env.APEX_FOUNDER_SUBJECT_ID);
  if (access === 'unauthenticated') return NextResponse.json({ error: 'authentication_required' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  if (access === 'founder_required') return NextResponse.json({ error: 'founder_access_required' }, { status: 403, headers: { 'cache-control': 'no-store' } });
  if (access === 'mfa_required') return NextResponse.json({ error: 'founder_mfa_required' }, { status: 403, headers: { 'cache-control': 'no-store' } });

  let input: { idempotencyKey?: unknown; source?: unknown; windowCount?: unknown; screenCount?: unknown };
  try { input = await request.json() as typeof input; }
  catch { return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: { 'cache-control': 'no-store' } }); }
  const source = input.source ?? 'manual';
  if (typeof input.idempotencyKey !== 'string' || !/^owner-ui:[0-9a-f-]{36}$/i.test(input.idempotencyKey) || typeof source !== 'string' || !leadSources.has(source) || !Number.isInteger(input.windowCount) || (input.windowCount as number) < 1 || (input.windowCount as number) > 10000 || !Number.isInteger(input.screenCount) || (input.screenCount as number) < 0 || (input.screenCount as number) > 10000) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return NextResponse.json({ error: 'authentication_required' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  try {
    const response = await fetch(new URL('/api/leads/quote', process.env.FIELD_OS_API_URL ?? 'http://127.0.0.1:3100'), {
      method: 'POST', cache: 'no-store',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: input.idempotencyKey, source, windowCount: input.windowCount, screenCount: input.screenCount, smsConsent: false, emailConsent: false })
    });
    const body: unknown = await response.json();
    return NextResponse.json(body, { status: response.status, headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'quote_service_unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
