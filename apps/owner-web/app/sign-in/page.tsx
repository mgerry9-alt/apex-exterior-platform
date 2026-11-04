import { SignInForm } from './sign-in-form';
import { hasOwnerAuthConfig, isLocalPreviewEnabled } from '../../lib/owner-config';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  if (isLocalPreviewEnabled()) redirect('/field-hub');
  return <main className="auth-page"><SignInForm configured={hasOwnerAuthConfig()} /></main>;
}
