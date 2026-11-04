import type { Metadata } from 'next';
import { CustomerEstimatePreview } from './customer-estimate-preview';

export const metadata: Metadata = {
  title: 'Estimate Preview | Apex Field OS',
  description: 'Preview the measurements needed for an exterior cleaning estimate.'
};

export default function GetEstimatePage() {
  return <main className="public-estimate-page">
    <a className="wordmark" href="/field-hub" aria-label="Apex Field OS home"><span>APEX<span className="brand-dot">.</span><span className="brand-subtitle">FIELD OS</span></span></a>
    <div className="public-estimate-card">
      <p className="eyebrow">Customer estimate preview</p>
      <h1>Tell us what you need.</h1>
      <p className="muted public-intro">Choose a service scope and share measured counts. The selections stay in this page while the approved pricebook and subscription checkout are being configured.</p>
      <div className="notice" role="status"><strong>No price or subscription is available yet.</strong> Screenshot rates and service terms are unapproved examples. This preview does not save or send your selections.</div>
      <CustomerEstimatePreview />
      <p className="fine-print">No name, address, phone, email, payment details, or customer message is requested or stored by this preview.</p>
    </div>
  </main>;
}
