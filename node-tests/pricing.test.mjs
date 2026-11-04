import test from 'node:test';
import assert from 'node:assert/strict';
import { createWindowQuote } from '../packages/pricing/quote.mjs';

const approvedPricebook = {
  status: 'approved',
  version: 'owner-approved-v1',
  currency: 'USD',
  rates: { exteriorPaneCents: 0, screenCents: 0 }
};

test('quote arithmetic uses integer minor units and preserves pricebook version', () => {
  const quote = createWindowQuote({
    leadId: 'lead-demo-1',
    windowCount: 12,
    screenCount: 4,
    pricebook: { ...approvedPricebook, rates: { exteriorPaneCents: 1250, screenCents: 300 } }
  });
  assert.equal(quote.subtotalCents, 16200);
  assert.equal(quote.pricebookVersion, 'owner-approved-v1');
  assert.equal(quote.status, 'draft_requires_review');
  assert.equal(quote.customerBindingAllowed, false);
});

test('quote generation fails closed without an approved versioned pricebook', () => {
  assert.throws(() => createWindowQuote({ leadId: 'lead-1', windowCount: 3 }), {
    code: 'PRICEBOOK_NOT_CONFIGURED'
  });
  assert.throws(() => createWindowQuote({
    leadId: 'lead-1', windowCount: 3,
    pricebook: { ...approvedPricebook, status: 'draft' }
  }), { code: 'PRICEBOOK_NOT_CONFIGURED' });
});

test('invalid quantities and non-integer money are rejected', () => {
  assert.throws(() => createWindowQuote({ leadId: 'lead-1', windowCount: 0, pricebook: approvedPricebook }));
  assert.throws(() => createWindowQuote({
    leadId: 'lead-1', windowCount: 2,
    pricebook: { ...approvedPricebook, rates: { exteriorPaneCents: 12.5, screenCents: 0 } }
  }));
});
