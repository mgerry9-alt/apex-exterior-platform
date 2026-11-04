'use client';

import { FormEvent, useState } from 'react';

type QuoteResult = { quote?: { status?: string; subtotal_cents?: number; total_cents?: number }; replayed?: boolean; error?: string };
type LeadSource = 'inbound_form' | 'referral' | 'door_visit' | 'returning_customer' | 'manual';

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

export function QuoteForm({ showLeadSource = false }: { showLeadSource?: boolean }) {
  const [windows, setWindows] = useState('');
  const [screens, setScreens] = useState('');
  const [source, setSource] = useState<LeadSource>('manual');
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
        body: JSON.stringify({ idempotencyKey, source, windowCount: Number(windows), screenCount: Number(screens) })
      });
      const data = await response.json() as QuoteResult;
      if (response.ok) { setResult(data); setPendingKey(''); }
      else setResult({ error: quoteErrors[data.error ?? ''] ?? 'The draft could not be saved. Your counts are still here; try again or reload the page.' });
    } catch { setResult({ error: quoteErrors.quote_service_unavailable }); }
    finally { setBusy(false); }
  }

  return <section className="quote-card">
    <div className="quote-intro"><span className="quote-icon" aria-hidden="true">$</span><div><strong>{showLeadSource ? 'Record lead measurements' : 'Draft estimate request'}</strong><p>Uses approved rates when a pricebook is configured.</p></div></div>
    <form onSubmit={submit} className="quote-form" aria-label="Prepare a draft quote">
      {showLeadSource && <label className="source-field">Lead source<select value={source} onChange={event => setSource(event.target.value as LeadSource)}><option value="manual">Manual entry</option><option value="referral">Referral</option><option value="door_visit">Door visit</option><option value="returning_customer">Returning customer</option><option value="inbound_form">Inbound request</option></select></label>}
      <label>Windows<input type="number" min="1" max="10000" required value={windows} onChange={e => { setWindows(e.target.value); setPendingKey(''); }} /></label>
      <label>Screens<input type="number" min="0" max="10000" required value={screens} onChange={e => { setScreens(e.target.value); setPendingKey(''); }} /></label>
      <button className="button primary" disabled={busy}>{busy ? 'Saving draft…' : showLeadSource ? 'Save lead and draft' : 'Create draft quote'} <span aria-hidden="true">→</span></button>
    </form>
    {result && <div className={result.error ? 'quote-result error-box' : 'quote-result'} role={result.error ? 'alert' : 'status'}>{result.error ? result.error : <>Draft created · {result.quote?.status ?? 'review required'} · {typeof result.quote?.subtotal_cents === 'number' ? `$${(result.quote.subtotal_cents / 100).toFixed(2)}` : 'Amount pending'}{result.replayed ? ' · previous request returned' : ''}</>}</div>}
    <p className="fine-print">A draft request needs an approved pricebook and owner review. It does not contact a customer or schedule work.</p>
  </section>;
}
