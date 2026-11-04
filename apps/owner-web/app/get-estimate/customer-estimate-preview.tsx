'use client';

import { FormEvent, useState } from 'react';

type Frequency = 'one_time' | 'two_year' | 'three_year' | 'four_year' | 'six_year';

const frequencies: Array<{ value: Frequency; label: string }> = [
  { value: 'one_time', label: 'One-time visit' },
  { value: 'two_year', label: 'Twice a year' },
  { value: 'three_year', label: 'Three visits a year' },
  { value: 'four_year', label: 'Four visits a year' },
  { value: 'six_year', label: 'Six visits a year' }
];

export function CustomerEstimatePreview() {
  const [windows, setWindows] = useState('');
  const [screens, setScreens] = useState('0');
  const [includeScreens, setIncludeScreens] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('one_time');
  const [reviewed, setReviewed] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewed(true);
  }

  return <>
    <ol className="workflow-steps public-steps" aria-label="Estimate stages">
      <li><span className="step-marker">1</span><strong>Choose scope</strong><small>Measurements only</small></li>
      <li><span className="step-marker">2</span><strong>Calculate price</strong><small>Approved rates required</small></li>
      <li><span className="step-marker">3</span><strong>Subscribe</strong><small>Provider setup required</small></li>
    </ol>
    <form className="customer-estimate-form" onSubmit={submit}>
      <div className="form-pair"><label>Window panes<input type="number" min="1" max="10000" required value={windows} onChange={event => { setWindows(event.target.value); setReviewed(false); }} /></label><label>Screens<input type="number" min="0" max="10000" required value={screens} onChange={event => { setScreens(event.target.value); setReviewed(false); }} /></label></div>
      <label className="check-row"><input type="checkbox" checked={includeScreens} onChange={event => { setIncludeScreens(event.target.checked); setReviewed(false); }} />Include screen cleaning in the request preview</label>
      <label>Visit frequency <select value={frequency} onChange={event => { setFrequency(event.target.value as Frequency); setReviewed(false); }}>{frequencies.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <p className="fine-print">Visit frequencies are planning choices only. No discount, renewal date, cancellation term, or service promise is implied.</p>
      <button className="button primary">Review selection</button>
    </form>
    {reviewed && <div className="customer-selection" role="status">
      <strong>Selection preview</strong>
      <p>{windows} window panes · {includeScreens ? `${screens} screens included` : 'screen cleaning not selected'} · {frequencies.find(item => item.value === frequency)?.label}</p>
      <p>No amount can be calculated until an approved pricebook is active. No lead, quote, or subscription was created.</p>
      <button className="button secondary" type="button" disabled title="Billing provider and approved subscription terms are not configured">Subscription checkout unavailable</button>
    </div>}
  </>;
}
