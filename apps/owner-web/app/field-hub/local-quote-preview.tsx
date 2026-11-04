'use client';

import { FormEvent, useEffect, useState } from 'react';

type PreviewRequest = {
  id: string;
  createdAt: string;
  windowCount: number;
  screenCount: number;
  status: 'awaiting_approved_pricebook';
};

const STORAGE_KEY = 'apex-field-os-local-quote-preview-v1';

function isPreviewRequest(value: unknown): value is PreviewRequest {
  if (!value || typeof value !== 'object') return false;
  const request = value as Partial<PreviewRequest>;
  return typeof request.id === 'string'
    && typeof request.createdAt === 'string'
    && Number.isFinite(Date.parse(request.createdAt))
    && Number.isInteger(request.windowCount) && (request.windowCount as number) >= 1 && (request.windowCount as number) <= 10000
    && Number.isInteger(request.screenCount) && (request.screenCount as number) >= 0 && (request.screenCount as number) <= 10000
    && request.status === 'awaiting_approved_pricebook';
}

export function LocalQuotePreview() {
  const [windows, setWindows] = useState('');
  const [screens, setScreens] = useState('');
  const [requests, setRequests] = useState<PreviewRequest[]>([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
      if (Array.isArray(saved)) setRequests(saved.filter(isPreviewRequest).slice(0, 20));
    } catch {
      setNotice('Browser session storage is unavailable. New preview requests will stay visible only until you leave this page.');
    }
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request: PreviewRequest = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      windowCount: Number(windows),
      screenCount: Number(screens),
      status: 'awaiting_approved_pricebook'
    };
    const next = [request, ...requests].slice(0, 20);
    setRequests(next);
    setWindows('');
    setScreens('');
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setNotice('Preview request saved in this browser session. Add an approved pricebook before creating a priced draft quote.');
    } catch {
      setNotice('Preview request added for this page only. Browser session storage is unavailable.');
    }
  }

  return <div className="quote-card local-preview-card">
    <div className="quote-intro"><span className="quote-icon" aria-hidden="true">↗</span><div><strong>Local measurement preview</strong><p>Enter counts to try the workflow. No quote or lead is created.</p></div></div>
    <form onSubmit={submit} className="quote-form">
      <label>Windows<input type="number" min="1" max="10000" required value={windows} onChange={event => setWindows(event.target.value)} /></label>
      <label>Screens<input type="number" min="0" max="10000" required value={screens} onChange={event => setScreens(event.target.value)} /></label>
      <button className="button primary">Save session counts</button>
    </form>
    <p className="fine-print">Counts stay in this browser session. No price is shown because this environment has no approved pricebook.</p>
    {notice && <p className="preview-note" role="status">{notice}</p>}
    {requests.length > 0 && <div className="preview-requests" aria-label="Local preview requests">
      <h3>Session requests <span>{requests.length}</span></h3>
      <ul>{requests.map(request => <li key={request.id}><span>{request.windowCount} windows · {request.screenCount} screens</span><time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleString()}</time><b>Preview only · no quote created</b></li>)}</ul>
      <button type="button" className="text-button clear-preview" onClick={() => { setRequests([]); sessionStorage.removeItem(STORAGE_KEY); setNotice('Local preview requests cleared.'); }}>Clear session requests</button>
    </div>}
  </div>;
}
