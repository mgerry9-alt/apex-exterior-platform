import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { founderAccessDecision } from '../../lib/founder-access';
import { hasOwnerAuthConfig, isLocalPreviewEnabled } from '../../lib/owner-config';
import { MfaStep } from './step';

export const dynamic = 'force-dynamic';

export default async function MfaPage() {
  if (isLocalPreviewEnabled()) redirect('/field-hub');
  if (!hasOwnerAuthConfig()) redirect('/setup-required');
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const access = founderAccessDecision(data?.claims, process.env.APEX_FOUNDER_SUBJECT_ID);
  if (access === 'unauthenticated') redirect('/sign-in');
  if (access === 'founder_required') redirect('/access-denied');
  if (access === 'allowed') redirect('/field-hub');
  return <main className="auth-page"><MfaStep /></main>;
}
