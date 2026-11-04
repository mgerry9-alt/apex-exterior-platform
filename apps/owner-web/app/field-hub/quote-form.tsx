'use client';

import { FormEvent, useState } from 'react';

type QuoteResult = { quote?: { status?: string; subtotal_cents?: number; total_cents?: number }; replayed?: boolean; error?: string };

const quoteErrors: Record<string, string> = {
  owner_auth_not_configured: 'Owner sign-in is not configured for this environment.',
  authentication_required: 'Your session has expired. Sign in again before saving a draft.',
  founder_access_required: 'This page is limited to the configured owner account.',
  founder_mfa_required: 'Complete multi-factor verification before saving a draft.',
  approved_pricebook_required: 'No approved pricebook is available, so no draft was saved. Configure approved rates before retrying.',
  invalid_request: 'Check the measurement counts and try again.',
  idempotency_key_conflict: 'This request changed after submission. Review the counts and submit again.',
  quote_service_unavailable: 'The quote service is unavailable. Your counts are still here; try again shortly.',
  lead_quote_unavailable: 'The quote service could not save this draft. Your counts are still here; try again shortly.'
};

export function QuoteForm() {
  const [windows, setWindows] = useState('10');
  const [screens, setScreens] = useState('0');
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingKey, setPendingKey] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setResult(null);
    const idempotencyKey = pendingKey || `owner-ui:${crypto.randomUUID()}`;
    setPendingKey(idempotencyKey);
    try {
      const response = await fetch('/api/owner/quote', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idempotencyKey, windowCount: Number(windows), screenCount: Number(screens) })
      });
      const data = await response.json() as QuoteResult;
      if (response.ok) { setResult(data); setPendingKey(''); }
      else setResult({ error: quoteErrors[data.error ?? ''] ?? 'The draft could not be saved. Your counts are still here; try again or reload the page.' });
    } catch { setResult({ error: quoteErrors.quote_service_unavailable }); }
    finally { setBusy(false); }
  }

  return <section className="quote-card"><div className="quote-intro"><span className="quote-icon" aria-hidden="true">$</span><div><strong>Internal estimate preview</strong><p>Uses the active approved pricebook. This is a draft only.</p></div></div><form onSubmit={submit} className="quote-form" aria-label="Prepare a draft quote"><label>Windows<input type="number" min="1" max="10000" required value={windows} onChange={e => { setWindows(e.target.value); setPendingKey(''); }} /></label><label>Screens<input type="number" min="0" max="10000" required value={screens} onChange={e => { setScreens(e.target.value); setPendingKey(''); }} /></label><button className="button primary" disabled={busy}>{busy ? 'Saving draft…' : 'Create draft quote'} <span aria-hidden="true">→</span></button></form>{result && <div className={result.error ? 'quote-result error-box' : 'quote-result'} role="status">{result.error ? result.error : <>Draft created · {result.quote?.status ?? 'review required'} · {typeof result.quote?.subtotal_cents === 'number' ? `$${(result.quote.subtotal_cents / 100).toFixed(2)}` : 'Amount pending'}{result.replayed ? ' · previous request returned' : ''}</>}</div>}<p className="fine-print">This tool records a manual, non-binding estimate request. It does not contact a customer or schedule work.</p></section>;
}
