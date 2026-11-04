'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/browser';

export function MfaStep() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    async function prepare() {
      const supabase = createClient();
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === 'aal2') { router.replace('/field-hub'); return; }
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) { if (active) { setError('Could not load your MFA factors. Try again.'); setBusy(false); } return; }
      const verified = factors?.totp.find(item => item.status === 'verified');
      if (verified) { if (active) { setFactorId(verified.id); setBusy(false); } return; }
      const pending = factors?.totp.filter(item => item.status !== 'verified') ?? [];
      for (const item of pending) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: item.id });
        if (removeError) { if (active) { setError('Could not reset an unfinished authenticator enrollment. Contact the account operator.'); setBusy(false); } return; }
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Apex Field OS' });
      if (enrollError || !enrolled?.id) { if (active) { setError('Could not start authenticator enrollment. Contact the account operator.'); setBusy(false); } return; }
      if (active) {
        setFactorId(enrolled.id);
        setQr(enrolled.totp.qr_code);
        setSecret(enrolled.totp.secret);
        setBusy(false);
      }
    }
    void prepare().catch(() => {
      if (active) { setError('Authenticator setup is unavailable. Check the connection and try again.'); setBusy(false); }
    });
    return () => { active = false; };
  }, [router]);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId) return;
    setBusy(true); setError('');
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factorId });
    if (challengeError || !challenge?.id) { setError('Could not request a verification challenge.'); setBusy(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: factorId, challengeId: challenge.id, code: code.replace(/\s/g, '') });
    if (verifyError) { setError('That code could not be verified. Check the current code in your authenticator.'); setBusy(false); return; }
    router.replace('/field-hub'); router.refresh();
  }

  return <section className="auth-card">
    <div className="brand-mark">A</div>
    <p className="eyebrow">STEP 2 <span>AUTHENTICATOR VERIFICATION</span></p>
    <h1>{qr ? 'Secure your account.' : 'Verify it’s you.'}</h1>
    {busy && <p className="muted">Preparing secure verification…</p>}
    {!busy && qr && <div className="enroll-box"><p>Scan this QR code in your authenticator app, then enter the six-digit code.</p><img src={qr} alt="Authenticator enrollment QR code" /><details><summary>Can’t scan the code?</summary><code>{secret}</code></details></div>}
    {!busy && !qr && <p className="muted">Enter the current code from your enrolled authenticator app.</p>}
    {!busy && <form onSubmit={verify} className="stack"><label>6-digit code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" minLength={6} maxLength={8} required value={code} onChange={e => setCode(e.target.value)} /></label>{error && <p role="alert" className="error">{error}</p>}<button className="button primary" disabled={busy}>Verify and open Field Hub <span aria-hidden="true">↗</span></button></form>}
    <p className="footnote">Authenticator factors are enforced again by the API and database policies.</p>
  </section>;
}
