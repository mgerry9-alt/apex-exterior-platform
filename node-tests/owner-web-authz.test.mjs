import test from 'node:test';
import assert from 'node:assert/strict';
import { founderAccessDecision } from '../apps/owner-web/lib/founder-access.ts';
import { hasOwnerAuthConfig, isLocalPreviewEnabled } from '../apps/owner-web/lib/owner-config.ts';

const founderId = 'a1700000-0000-4000-8000-000000000001';

test('owner web policy denies absent identity and missing founder configuration', () => {
  assert.equal(founderAccessDecision(null, founderId), 'unauthenticated');
  assert.equal(founderAccessDecision({ sub: founderId, aal: 'aal2' }, undefined), 'founder_required');
});

test('owner web policy denies staff even with forged owner role claims', () => {
  assert.equal(founderAccessDecision({ sub: 'staff-1', aal: 'aal2', role: 'founding_owner' }, founderId), 'founder_required');
});

test('owner web policy requires AAL2 for the exact configured founder subject', () => {
  assert.equal(founderAccessDecision({ sub: founderId, aal: 'aal1' }, founderId), 'mfa_required');
  assert.equal(founderAccessDecision({ sub: founderId.toUpperCase(), aal: 'aal2' }, founderId), 'allowed');
  assert.equal(founderAccessDecision({ sub: founderId, aal: 'aal2' }, founderId), 'allowed');
});

test('owner web configuration fails closed when any required setting is absent or malformed', () => {
  const configured = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.example.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
    APEX_FOUNDER_SUBJECT_ID: founderId
  };
  assert.equal(hasOwnerAuthConfig(configured), true);
  assert.equal(hasOwnerAuthConfig({ ...configured, APEX_FOUNDER_SUBJECT_ID: '' }), false);
  assert.equal(hasOwnerAuthConfig({ ...configured, APEX_FOUNDER_SUBJECT_ID: 'not-a-uuid' }), false);
  assert.equal(hasOwnerAuthConfig({ ...configured, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' }), false);
});

test('no-auth preview is limited to local development with missing Supabase configuration', () => {
  assert.equal(isLocalPreviewEnabled({ NODE_ENV: 'development' }), true);
  assert.equal(isLocalPreviewEnabled({ NODE_ENV: 'production' }), false);
  assert.equal(isLocalPreviewEnabled({ NODE_ENV: 'development', NEXT_PUBLIC_SUPABASE_URL: 'https://project.example.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'key', APEX_FOUNDER_SUBJECT_ID: founderId }), false);
});
