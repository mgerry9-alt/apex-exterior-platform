'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/browser';

export function SignInForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    setError('');
    setBusy(true);
    try {
      const { error: authError } = await createClient().auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace('/field-hub');
      router.refresh();
    } catch {
      setError('Sign-in failed. Check your credentials or contact the account operator.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="auth-card">
    <div className="brand-mark">A</div>
    <p className="eyebrow">APEX FIELD OS <span>PRIVATE OWNER ACCESS</span></p>
    <h1>Welcome back.</h1>
    <p className="muted">Sign in with the provisioned founding-owner account. Access is restricted to the configured owner identity.</p>
    {!configured && <p role="status" className="notice">Owner sign-in is unavailable until this environment has its Supabase URL, publishable key, and founder subject configured.</p>}
    <form onSubmit={submit} className="stack">
      <label>Email address<input autoComplete="username" type="email" required disabled={!configured} value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input autoComplete="current-password" type="password" required disabled={!configured} value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="button primary" disabled={busy || !configured}>{!configured ? 'Sign-in not configured' : busy ? 'Signing in…' : 'Continue securely'} <span aria-hidden="true">↗</span></button>
    </form>
    <p className="footnote">Multi-factor verification is required before the Field Hub opens. There is no public account registration.</p>
  </section>;
}
