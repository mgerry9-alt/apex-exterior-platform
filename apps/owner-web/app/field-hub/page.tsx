import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { founderAccessDecision } from '../../lib/founder-access';
import { hasOwnerAuthConfig, isLocalPreviewEnabled } from '../../lib/owner-config';
import { QuoteForm } from './quote-form';
import { LocalQuotePreview } from './local-quote-preview';

type HubRecord = { id: string; record_type: string; created_at: string };

export const dynamic = 'force-dynamic';

export default async function FieldHubPage() {
  let records: HubRecord[] = [];
  let unavailable = false;
  const previewMode = isLocalPreviewEnabled();

  if (previewMode) {
    unavailable = true;
  } else {
    if (!hasOwnerAuthConfig()) redirect('/setup-required');
    const supabase = await createClient();
    const { data: identity } = await supabase.auth.getClaims();
    const claims = identity?.claims;
    const access = founderAccessDecision(claims, process.env.APEX_FOUNDER_SUBJECT_ID);
    if (access === 'unauthenticated') redirect('/sign-in');
    if (access === 'founder_required') redirect('/access-denied');
    if (access === 'mfa_required') redirect('/mfa');

    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) redirect('/sign-in');
    const apiUrl = process.env.FIELD_OS_API_URL ?? 'http://127.0.0.1:3100';
    try {
      const response = await fetch(new URL('/api/field-hub', apiUrl), {
        headers: { authorization: `Bearer ${session.session.access_token}` },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Field Hub API unavailable');
      const data = await response.json() as { records?: HubRecord[] };
      records = data.records ?? [];
    } catch {
      unavailable = true;
    }
  }

  return <main className="dashboard">
    <header className="topbar"><a className="wordmark" href="/field-hub"><span className="brand-mark small">A</span> APEX <span>FIELD OS</span></a><div className="topbar-right"><span className="secure-pill"><i /> {previewMode ? 'LOCAL READ-ONLY PREVIEW' : 'OWNER SESSION · MFA'}</span>{!previewMode && <form action="/sign-out" method="post"><button className="text-button">Sign out</button></form>}</div></header>
    <div className="content-wrap">
      <div className="welcome-row"><div><p className="eyebrow">Owner workspace</p><h1>Field Hub</h1><p className="muted">Prepare an internal estimate from measured counts.</p></div><div className="date-chip">Owner console <b aria-hidden="true">●</b></div></div>
      <section className="status-strip"><div className="status-icon">↗</div><div><strong>{previewMode ? 'Local preview · no owner login' : unavailable ? 'Owner access verified · API offline' : 'Owner access and API verified'}</strong><p>{previewMode ? 'No owner records are loaded. The quote intake below stores counts in this browser session only.' : unavailable ? 'Your owner session passed; operational records and quote requests need the Field OS API.' : 'Owner identity and multi-factor checks are active. Operational data appears here as it is added through approved workflows.'}</p></div><span className="live-label"><i /> {previewMode ? 'LOCAL ONLY' : 'PRIVATE'}</span></section>
      {unavailable && !previewMode && <div className="notice" role="status"><b>Field data service unavailable.</b> Start the Field OS API and confirm its Supabase configuration to load records.</div>}
      <section className="records-section" aria-labelledby="records-heading">
        <div className="section-heading"><div><p className="eyebrow">Operations</p><h2 id="records-heading">Owner records</h2></div><span className="count-label">{previewMode ? 'Local only' : unavailable ? 'Unavailable' : `${records.length} record${records.length === 1 ? '' : 's'}`}</span></div>
        {unavailable && !previewMode ? <div className="empty-state unavailable-state"><span className="empty-icon" aria-hidden="true">!</span><strong>Records could not be loaded</strong><p>The owner connection is active, but the records service did not return a response.</p><a className="button secondary" href="/field-hub">Try again</a></div> : records.length ? <div className="record-list">{records.map(record => <article className="record" key={record.id}><div><span className="record-type">{record.record_type.replaceAll('_', ' ')}</span><p>Saved by an approved owner workflow.</p></div><time dateTime={record.created_at}>{new Date(record.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</time></article>)}</div> : <div className="empty-state"><span className="empty-icon" aria-hidden="true">⌂</span><strong>{previewMode ? 'No live owner records' : 'No owner records yet'}</strong><p>{previewMode ? 'This preview has no connection to customer or business data.' : 'Records will appear here after an approved workflow saves them.'}</p><a className="button secondary" href="#quote-intake">{previewMode ? 'Try quote intake' : 'Prepare a draft quote'}</a></div>}
      </section>
      <section id="quote-intake" className="intake-section" aria-labelledby="quote-heading">
        <div className="section-heading lower"><div><p className="eyebrow">Sales intake{previewMode && <span>Local preview</span>}</p><h2 id="quote-heading">{previewMode ? 'Try quote intake' : 'Prepare a draft quote'}</h2></div><span className="count-label">{previewMode ? 'No price or contact' : 'Review required'}</span></div>
        <ol className="workflow-steps" aria-label="Quote preparation steps">
          <li><span className="step-marker">1</span><div><strong>Enter measurements</strong><small>{previewMode ? 'Try the local form' : 'Window and screen counts'}</small></div><span className="step-state ready">Ready</span></li>
          <li><span className="step-marker">2</span><div><strong>Use approved rates</strong><small>{previewMode ? 'Connect a pricebook to calculate' : 'Required to price this draft'}</small></div><span className="step-state">Required</span></li>
          <li><span className="step-marker">3</span><div><strong>Review the draft</strong><small>Check all line items before sharing</small></div><span className="step-state">Manual review</span></li>
        </ol>
        {previewMode ? <LocalQuotePreview /> : <QuoteForm />}
      </section>
      <footer className="page-footer">Apex Field OS <span>•</span> {previewMode ? 'Local session preview · no pricebook or customer data' : 'Owner workspace · draft estimates require human review'}</footer>
    </div>
  </main>;
}
