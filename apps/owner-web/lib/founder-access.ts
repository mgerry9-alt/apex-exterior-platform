export type OwnerClaims = {
  sub?: unknown;
  aal?: unknown;
};

export type FounderAccessDecision = 'unauthenticated' | 'founder_required' | 'mfa_required' | 'allowed';

/** Server-side owner web policy. API and database enforce the same boundary independently. */
export function founderAccessDecision(
  claims: OwnerClaims | null | undefined,
  configuredFounderSubjectId: string | undefined
): FounderAccessDecision {
  if (!claims) return 'unauthenticated';
  if (typeof claims.sub !== 'string' || !configuredFounderSubjectId) return 'founder_required';
  if (claims.sub.toLowerCase() !== configuredFounderSubjectId.toLowerCase()) return 'founder_required';
  if (claims.aal !== 'aal2') return 'mfa_required';
  return 'allowed';
}
