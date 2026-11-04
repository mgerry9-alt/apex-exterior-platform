import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldHubAccessDecision, requireFieldHubAccess } from '../packages/authz/field-hub.mjs';

const founderId = 'oidc|founder-stable-subject';
const verifiedFounder = {
  verified: true,
  subjectId: founderId,
  status: 'active',
  mfaLevel: 'aal2',
  roles: ['founding_owner']
};

test('only the verified, active, MFA founder subject passes the Field Hub gate', () => {
  assert.deepEqual(fieldHubAccessDecision(verifiedFounder, founderId), {
    allowed: true,
    reason: 'founder_subject_match'
  });
});

test('role labels cannot elevate a different subject into the Field Hub', () => {
  const staff = { ...verifiedFounder, subjectId: 'staff-1', roles: ['founding_owner'] };
  assert.equal(fieldHubAccessDecision(staff, founderId).allowed, false);
});

test('unverified claims, inactive principals, and missing MFA are denied', () => {
  assert.equal(fieldHubAccessDecision({ ...verifiedFounder, verified: false }, founderId).allowed, false);
  assert.equal(fieldHubAccessDecision({ ...verifiedFounder, status: 'disabled' }, founderId).allowed, false);
  assert.equal(fieldHubAccessDecision({ ...verifiedFounder, mfaLevel: 'aal1' }, founderId).allowed, false);
  assert.equal(fieldHubAccessDecision(null, founderId).allowed, false);
});

test('guard throws on denial and returns no owner capability to callers', () => {
  assert.throws(() => requireFieldHubAccess({ ...verifiedFounder, subjectId: 'agent-1' }, founderId), {
    code: 'FIELD_HUB_FORBIDDEN'
  });
  assert.deepEqual(requireFieldHubAccess(verifiedFounder, founderId), {
    allowed: true,
    reason: 'founder_subject_match'
  });
});
