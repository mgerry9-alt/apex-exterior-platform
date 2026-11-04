'use client';

import { FormEvent, useMemo, useState } from 'react';
import { QuoteForm } from './quote-form';

type LeadSource = 'inbound_form' | 'referral' | 'door_visit' | 'returning_customer' | 'manual';
type ResponseCategory = 'service_question' | 'price_question' | 'interested' | 'not_interested' | 'stop_request';

const responseLabels: Record<ResponseCategory, string> = {
  service_question: 'Service question',
  price_question: 'Price question',
  interested: 'Interested',
  not_interested: 'Not interested',
  stop_request: 'Do not contact'
};

function LocalLeadForm() {
  const [source, setSource] = useState<LeadSource>('manual');
  const [windows, setWindows] = useState('');
  const [screens, setScreens] = useState('0');
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCount(value => value + 1);
    setMessage('Measurement sample added in this page only. No customer or contact details were collected.');
    setWindows('');
    setScreens('0');
  }

  return <>
    <form className="local-form" onSubmit={submit}>
      <label>Lead source<select value={source} onChange={event => setSource(event.target.value as LeadSource)}><option value="manual">Manual entry</option><option value="referral">Referral</option><option value="door_visit">Door visit</option><option value="returning_customer">Returning customer</option><option value="inbound_form">Inbound request</option></select></label>
      <div className="form-pair"><label>Window panes<input type="number" min="1" max="10000" required value={windows} onChange={event => setWindows(event.target.value)} /></label><label>Screens<input type="number" min="0" max="10000" required value={screens} onChange={event => setScreens(event.target.value)} /></label></div>
      <button className="button primary">Add local lead sample</button>
    </form>
    <p className="fine-print">Local page state only · {count} sample{count === 1 ? '' : 's'} · no name, address, email, phone, or customer contact record.</p>
    {message && <p className="module-status" role="status">{message}</p>}
  </>;
}

function LocalRoutePlanner() {
  const [routeName, setRouteName] = useState('');
  const [plannedStops, setPlannedStops] = useState('');
  const [route, setRoute] = useState<{ name: string; stops: number } | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRoute({ name: routeName.trim(), stops: Number(plannedStops) });
  }

  return <>
    <form className="local-form" onSubmit={submit}>
      <label>Route label<input required maxLength={48} value={routeName} onChange={event => setRouteName(event.target.value)} placeholder="North-side route (test)" /></label>
      <label>Planned stops<input type="number" min="1" max="100" required value={plannedStops} onChange={event => setPlannedStops(event.target.value)} /></label>
      <button className="button secondary">Preview manual outline</button>
    </form>
    {route && <p className="module-status" role="status">“{route.name}” has {route.stops} planned stops in this page preview. No locations or directions were saved.</p>}
    <p className="fine-print">No addresses, GPS, map provider, assigned jobs, or optimized directions are connected.</p>
  </>;
}

function LocalInvoiceForm() {
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [preview, setPreview] = useState<{ reference: string; description: string; amount: number; dueDate: string } | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreview({ reference: reference.trim(), description: description.trim(), amount: Number(amount), dueDate });
  }

  return <>
    <form className="local-form" onSubmit={submit}>
      <label>Non-identifying test reference<input required maxLength={40} value={reference} onChange={event => setReference(event.target.value)} placeholder="TEST-CUSTOMER-01" /></label>
      <label>Line description<input required maxLength={100} value={description} onChange={event => setDescription(event.target.value)} placeholder="Example service line" /></label>
      <div className="form-pair"><label>Example amount (USD)<input type="number" min="0.01" max="1000000" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} /></label><label>Example due date<input type="date" required value={dueDate} onChange={event => setDueDate(event.target.value)} /></label></div>
      <button className="button secondary">Preview invoice layout</button>
    </form>
    {preview && <div className="invoice-preview" role="status"><strong>Invoice layout preview</strong><span>{preview.reference}</span><span>{preview.description}</span><b>${preview.amount.toFixed(2)} · example only</b><time dateTime={preview.dueDate}>Due date example: {preview.dueDate}</time></div>}
    <p className="fine-print">Test values stay in page memory and clear on reload. This does not create, send, tax, or collect payment for an invoice.</p>
  </>;
}

function LocalResponseReview() {
  const [category, setCategory] = useState<ResponseCategory>('service_question');
  const [entries, setEntries] = useState<ResponseCategory[]>([]);
  const counts = useMemo(() => entries.reduce<Record<ResponseCategory, number>>((total, item) => {
    total[item] += 1;
    return total;
  }, { service_question: 0, price_question: 0, interested: 0, not_interested: 0, stop_request: 0 }), [entries]);
  const total = entries.length;

  return <>
    <form className="local-form response-form" onSubmit={event => { event.preventDefault(); setEntries(value => [...value, category]); }}>
      <label>Classify one test outcome<select value={category} onChange={event => setCategory(event.target.value as ResponseCategory)}>{Object.entries(responseLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <button className="button secondary">Add category sample</button>
    </form>
    <div className="response-summary" aria-live="polite"><div className="response-total"><span>Page-only samples</span><strong>{total}</strong></div><div className="response-counts">{Object.entries(responseLabels).map(([key, label]) => <div key={key}><span>{label}</span><b>{counts[key as ResponseCategory]}</b></div>)}</div></div>
    <div className="response-guidance"><h3>Response guidance</h3><ul><li>Use approved service details and rates; avoid guessing when a fact is missing.</li><li>Review responses with a person before sending. Automated replies are not enabled.</li><li>Honor “do not contact” requests before any future outreach; no suppression list is connected here.</li></ul></div>
    <p className="fine-print">These are operator-entered categories in this browser page, not customer messages, response analytics, or a trained model.</p>
  </>;
}

export function SalesOperations({ previewMode }: { previewMode: boolean }) {
  return <div className="module-stack">
    <section id="estimate-matrix" className="panel module-panel" aria-labelledby="matrix-heading">
      <div className="section-heading"><div><p className="eyebrow">Sales & growth</p><h2 id="matrix-heading">Estimate matrix</h2></div><span className="count-label">{previewMode ? 'Preview only' : 'Rates required'}</span></div>
      <p className="quote-summary">The attached image supplies a visual example, but the rates, visit discounts, services, route credit, and guarantee have not been approved as customer terms.</p>
      <div className="setup-block"><strong>No customer price is available</strong><p>Enter a measurement draft in the Field Hub. A customer quote needs an owner-approved pricebook, service scope, and tax rules. Subscription checkout also needs a selected billing provider and approved cancellation terms.</p><a className="button secondary" href="/get-estimate">Open customer estimate preview</a></div>
    </section>

    <section id="crm-leads" className="panel module-panel" aria-labelledby="leads-heading">
      <div className="section-heading"><div><p className="eyebrow">Sales & growth</p><h2 id="leads-heading">CRM leads</h2></div><span className="count-label">{previewMode ? 'Local sample' : 'Owner workflow'}</span></div>
      <p className="quote-summary">This first lead form records source and measured counts only. It does not collect customer contact or property details.</p>
      {previewMode ? <LocalLeadForm /> : <QuoteForm showLeadSource />}
      {!previewMode && <p className="fine-print">The current API creates a lead and a review-required draft quote together. If no approved pricebook exists, both are rejected without saving.</p>}
    </section>

    <section id="route-telemetry" className="panel module-panel" aria-labelledby="routes-heading">
      <div className="section-heading"><div><p className="eyebrow">Field operations</p><h2 id="routes-heading">Route & telemetry</h2></div><span className="count-label">{previewMode ? 'Local outline' : 'Not connected'}</span></div>
      <div className="module-grid">
        <div><h3>Manual route outline</h3><p className="muted small-copy">A temporary planning sketch; it does not contain addresses or dispatch work.</p>{previewMode ? <LocalRoutePlanner /> : <div className="setup-block compact"><strong>Route planning is not configured</strong><p>Jobs, visits, assignments, and a directions provider are not connected.</p></div>}</div>
        <div className="setup-block telemetry-block"><span className="status-dot" aria-hidden="true" /><strong>Device telemetry unavailable</strong><p>No verified device source is connected. No live location, sensor reading, or zero-value metric is being reported.</p></div>
      </div>
    </section>

    <section id="invoices" className="panel module-panel" aria-labelledby="invoices-heading">
      <div className="section-heading"><div><p className="eyebrow">Sales & growth</p><h2 id="invoices-heading">Invoice preview</h2></div><span className="count-label">{previewMode ? 'Test values only' : 'Not configured'}</span></div>
      <p className="quote-summary">A real invoice must come from an accepted quote with approved tax treatment. No payment provider is selected.</p>
      {previewMode ? <LocalInvoiceForm /> : <div className="setup-block"><strong>No invoice will be issued</strong><p>Accepted quote records, tax settings, invoice storage, and provider-confirmed payment status are not available.</p></div>}
    </section>

    <section id="response-lab" className="panel module-panel" aria-labelledby="response-heading">
      <div className="section-heading"><div><p className="eyebrow">Customer response intelligence</p><h2 id="response-heading">Response insights</h2></div><span className="count-label">{previewMode ? 'Page-only samples' : 'No response data'}</span></div>
      <p className="quote-summary">Track broad outcomes without pasting customer messages or personal details.</p>
      {previewMode ? <LocalResponseReview /> : <div className="setup-block"><strong>No consented response dataset is connected</strong><p>Message capture, consent, suppression, retention, and response review rules must be configured before real customer analytics or reply suggestions can run.</p></div>}
    </section>
  </div>;
}
