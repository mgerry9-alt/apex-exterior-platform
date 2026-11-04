/**
 * Gate for a principal that has already been cryptographically verified by an
 * identity provider. Never build this object from request body/profile data.
 * This module is a domain guard, not a replacement for API and database RLS.
 */
export function fieldHubAccessDecision(principal, founderSubjectId) {
  if (!principal || principal.verified !== true) {
    return { allowed: false, reason: 'unverified_principal' };
  }
  if (!founderSubjectId || principal.subjectId !== founderSubjectId) {
    return { allowed: false, reason: 'not_bootstrapped_founder' };
  }
  if (principal.status !== 'active') {
    return { allowed: false, reason: 'principal_inactive' };
  }
  if (principal.mfaLevel !== 'aal2') {
    return { allowed: false, reason: 'mfa_required' };
  }
  return { allowed: true, reason: 'founder_subject_match' };
}

export function requireFieldHubAccess(principal, founderSubjectId) {
  const decision = fieldHubAccessDecision(principal, founderSubjectId);
  if (!decision.allowed) {
    const error = new Error('Field Hub access denied');
    error.code = 'FIELD_HUB_FORBIDDEN';
    error.reason = decision.reason;
    throw error;
  }
  return decision;
}
