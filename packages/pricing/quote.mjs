const wholeNumber = (value) => Number.isSafeInteger(value) && value >= 0;

/**
 * Creates an internal draft quote from an already approved pricebook snapshot.
 * No prices, tax, travel or safety assumptions are supplied by this module.
 */
export function createWindowQuote({ leadId, windowCount, screenCount = 0, pricebook }) {
  if (!leadId || typeof leadId !== 'string') throw new TypeError('leadId is required');
  if (!wholeNumber(windowCount) || windowCount < 1) throw new RangeError('windowCount must be a positive integer');
  if (!wholeNumber(screenCount)) throw new RangeError('screenCount must be a non-negative integer');
  if (!pricebook || pricebook.status !== 'approved' || !pricebook.version || !pricebook.currency) {
    const error = new Error('An approved, versioned pricebook is required');
    error.code = 'PRICEBOOK_NOT_CONFIGURED';
    throw error;
  }

  const rates = pricebook.rates;
  if (!rates || !wholeNumber(rates.exteriorPaneCents) || !wholeNumber(rates.screenCents)) {
    throw new TypeError('Pricebook rates must be integer minor units');
  }

  const lines = [
    { code: 'exterior_pane', quantity: windowCount, unitCents: rates.exteriorPaneCents },
    ...(screenCount > 0
      ? [{ code: 'screen_cleaning', quantity: screenCount, unitCents: rates.screenCents }]
      : [])
  ].map((line) => ({ ...line, amountCents: line.quantity * line.unitCents }));

  if (lines.some((line) => !Number.isSafeInteger(line.amountCents))) {
    throw new RangeError('Quote total exceeds supported integer precision');
  }

  return {
    leadId,
    status: 'draft_requires_review',
    pricebookVersion: pricebook.version,
    currency: pricebook.currency,
    lines,
    subtotalCents: lines.reduce((sum, line) => sum + line.amountCents, 0),
    taxStatus: 'not_configured',
    customerBindingAllowed: false
  };
}
