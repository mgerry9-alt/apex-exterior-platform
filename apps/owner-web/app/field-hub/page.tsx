import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { founderAccessDecision } from '../../lib/founder-access';
import { hasOwnerAuthConfig, isLocalPreviewEnabled } from '../../lib/owner-config';
import { QuoteForm } from './quote-form';
import { LocalQuotePreview } from './local-quote-preview';
import { SalesOperations } from './sales-operations';

type HubRecord = { id: string; record_type: string; created_at: string };

export const dynamic = 'force-dynamic';

function FieldIcon({ kind }: { kind: 'records' | 'quote' | 'shield' | 'empty' }) {
  if (kind === 'records') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v13H4z"/><path d="M8 9h8M8 13h5"/></svg>;
  if (kind === 'quote') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M17 7.5c0-1.4-1.7-2.5-5-2.5s-5 1.1-5 2.5 1.7 2.5 5 2.5 5 1.1 5 2.5-1.7 2.5-5 2.5-5-1.1-5-2.5"/></svg>;
  if (kind === 'empty') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16v12H4zM8 10h8M8 14h5"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>;
}

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

  const statusTitle = previewMode
    ? 'Local session preview'
    : unavailable
      ? 'Owner session verified · records service unavailable'
      : 'Owner session and records service verified';
  const statusMessage = previewMode
    ? 'Try the measurement workflow with counts saved in this browser session. No owner records, approved pricebook, customer data, or API writes are connected.'
    : unavailable
      ? 'Your owner access passed. The Field OS API did not return records, so the records panel is unavailable.'
      : 'Records are shown from the configured Field OS API. Quote requests require approved rates and owner review.';

  return <div className="dashboard">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="app-shell">
      <aside className="sidebar" aria-label="Field Hub navigation">
        <div className="sidebar-brand">
          <a className="wordmark" href="/field-hub" aria-label="Apex Field OS home">
            <span>APEX<span className="brand-dot">.</span><span className="brand-subtitle">FIELD OS</span></span>
          </a>
        </div>
        <nav className="sidebar-nav" aria-label="Field Hub sections">
          <div className="nav-group">
            <p className="nav-label">Workspace</p>
            <a className="nav-link" href="#owner-records">
              <span className="nav-icon"><FieldIcon kind="records" /></span><span>Owner records</span>
            </a>
          </div>
          <div className="nav-group">
            <p className="nav-label">Sales & growth</p>
            <a className="nav-link" href="#estimate-matrix"><span className="nav-icon"><FieldIcon kind="quote" /></span><span>Estimate matrix</span></a>
            <a className="nav-link" href="#crm-leads"><span className="nav-icon"><FieldIcon kind="records" /></span><span>CRM leads</span></a>
            <a className="nav-link" href="#invoices"><span className="nav-icon"><FieldIcon kind="empty" /></span><span>Invoices</span></a>
          </div>
          <div className="nav-group">
            <p className="nav-label">Field operations</p>
            <a className="nav-link" href="#route-telemetry"><span className="nav-icon"><FieldIcon kind="shield" /></span><span>Route & telemetry</span></a>
          </div>
          <div className="nav-group">
            <p className="nav-label">Intelligence</p>
            <a className="nav-link" href="#response-lab"><span className="nav-icon"><FieldIcon kind="quote" /></span><span>Response insights</span></a>
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div className="environment-card">
            <div className="environment-heading"><span className="status-dot" aria-hidden="true" /><strong>{previewMode ? 'Local preview' : 'Private owner access'}</strong></div>
            <p>{previewMode ? 'Counts remain in this browser session. No account or business data is connected.' : 'Founder access and multi-factor verification are required.'}</p>
          </div>
          <p className="sidebar-caption">Estimate workspace</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title"><span>Owner workspace</span><span>Field Hub</span></div>
          <div className="topbar-right">
            <span className="environment-pill"><span className="status-dot" aria-hidden="true" />{previewMode ? 'Local preview' : 'Owner session'}</span>
            {!previewMode && <form action="/sign-out" method="post"><button className="text-button">Sign out</button></form>}
          </div>
        </header>

        <main id="main-content" className="content-wrap">
          <div className="welcome-row">
            <div className="welcome-copy">
              <p className="eyebrow">Apex exterior · operations</p>
              <h1>Field Hub</h1>
              <p className="muted">Prepare a measured estimate and review owner records.</p>
            </div>
            <span className="local-tag"><span className="status-dot" aria-hidden="true" />{previewMode ? 'Session-only data' : 'Private workspace'}</span>
          </div>

          <section className={`status-strip${unavailable && !previewMode ? ' offline' : ''}`} aria-label="Workspace status">
            <span className="status-icon"><FieldIcon kind="shield" /></span>
            <div className="status-copy"><strong>{statusTitle}</strong><p>{statusMessage}</p></div>
            <span className="status-badge">{previewMode ? 'PREVIEW' : unavailable ? 'API OFFLINE' : 'CONNECTED'}</span>
          </section>

          {unavailable && !previewMode && <div className="notice" role="status"><b>Records could not be loaded.</b> Start the Field OS API and confirm its Supabase configuration, then try again.</div>}
          <p className="public-preview-link"><a href="/get-estimate">Open the customer estimate preview</a><span>No price or subscription is created.</span></p>

          <div className="workspace-grid">
            <section id="quote-intake" className="panel quote-panel" aria-labelledby="quote-heading">
              <div className="section-heading">
                <div><p className="eyebrow">Quote workflow</p><h2 id="quote-heading">Prepare an estimate</h2></div>
                <span className="count-label">{previewMode ? 'Local only' : 'Review required'}</span>
              </div>
              <p className="quote-summary">Enter measured counts, apply approved rates, then review each line before sharing.</p>
              <ol className="workflow-steps" aria-label="Estimate preparation steps">
                <li><span className="step-marker">1</span><strong>Measurements</strong><small>Enter window and screen counts</small><span className="step-state ready">Ready</span></li>
                <li><span className="step-marker">2</span><strong>Approved rates</strong><small>Pricebook required to calculate</small><span className="step-state">Required</span></li>
                <li><span className="step-marker">3</span><strong>Owner review</strong><small>Check the draft before sharing</small><span className="step-state">Manual</span></li>
              </ol>
              {previewMode ? <LocalQuotePreview /> : <QuoteForm />}
            </section>

            <section id="owner-records" className="panel records-panel" aria-labelledby="records-heading">
              <div className="section-heading">
                <div><p className="eyebrow">Workspace data</p><h2 id="records-heading">Owner records</h2></div>
                <span className="count-label">{previewMode ? 'No live records' : unavailable ? 'Unavailable' : `${records.length} record${records.length === 1 ? '' : 's'}`}</span>
              </div>
              {unavailable && !previewMode
                ? <div className="empty-state unavailable-state"><span className="empty-icon"><FieldIcon kind="empty" /></span><strong>Records are unavailable</strong><p>The owner service did not return a response. Reload after the service is available.</p><a className="button secondary" href="/field-hub">Try again</a></div>
                : records.length > 0
                  ? <div className="record-list">{records.map(record => <article className="record" key={record.id}><div><span className="record-type">{record.record_type.replaceAll('_', ' ')}</span><p>Saved by an approved owner workflow.</p></div><time dateTime={record.created_at}>{new Date(record.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</time></article>)}</div>
                  : <div className="empty-state"><span className="empty-icon"><FieldIcon kind="empty" /></span><strong>{previewMode ? 'No owner records in preview' : 'No owner records yet'}</strong><p>{previewMode ? 'This browser preview is separate from business and customer data.' : 'Records will appear after an approved workflow saves them.'}</p><a className="button secondary" href="#quote-intake">{previewMode ? 'Try quote preparation' : 'Prepare an estimate'}</a></div>}
            </section>
          </div>

          <SalesOperations previewMode={previewMode} />

          <footer className="page-footer">Apex Field OS · {previewMode ? 'Local session preview · no priced quote or customer record is created' : 'Private owner workspace · draft estimates require human review'}</footer>
        </main>
      </div>
    </div>
  </div>;
}
