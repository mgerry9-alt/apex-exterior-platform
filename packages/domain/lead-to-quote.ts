import { createHash } from 'node:crypto';

export type LeadSource = 'inbound_form' | 'referral' | 'door_visit' | 'returning_customer' | 'manual';

export interface LeadQuoteInput {
  idempotencyKey: string;
  source: LeadSource;
  windowCount: number;
  screenCount?: number;
  smsConsent?: boolean;
  emailConsent?: boolean;
}

export interface LeadQuoteRpcArguments {
  p_idempotency_key: string;
  p_lead_source: LeadSource;
  p_window_count: number;
  p_screen_count: number;
  p_sms_consent: boolean;
  p_email_consent: boolean;
  p_request_hash: string;
  p_quote_request_hash: string;
}

const allowedSources = new Set<LeadSource>(['inbound_form', 'referral', 'door_visit', 'returning_customer', 'manual']);

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** Normalize an API request and create stable idempotency digests for the DB transaction. */
export function prepareLeadQuoteRequest(input: LeadQuoteInput): LeadQuoteRpcArguments {
  const normalized = {
    idempotencyKey: input?.idempotencyKey,
    source: input?.source,
    windowCount: input?.windowCount,
    screenCount: input?.screenCount === undefined ? 0 : input.screenCount,
    smsConsent: input?.smsConsent === true,
    emailConsent: input?.emailConsent === true
  };
  if (typeof normalized.idempotencyKey !== 'string' || normalized.idempotencyKey.length < 8 || normalized.idempotencyKey.length > 120) {
    throw new TypeError('A stable idempotency key between 8 and 120 characters is required');
  }
  if (!allowedSources.has(normalized.source as LeadSource)) throw new TypeError('Unsupported lead source');
  if (!Number.isSafeInteger(normalized.windowCount) || normalized.windowCount < 1 || normalized.windowCount > 10000) {
    throw new RangeError('windowCount must be an integer from 1 to 10000');
  }
  if (!Number.isSafeInteger(normalized.screenCount) || normalized.screenCount < 0 || normalized.screenCount > 10000) {
    throw new RangeError('screenCount must be an integer from 0 to 10000');
  }
  if (input.smsConsent !== undefined && typeof input.smsConsent !== 'boolean') throw new TypeError('smsConsent must be a boolean');
  if (input.emailConsent !== undefined && typeof input.emailConsent !== 'boolean') throw new TypeError('emailConsent must be a boolean');

  const requestHash = hash(normalized);
  const quoteKey = `quote:${normalized.idempotencyKey}`;
  return {
    p_idempotency_key: normalized.idempotencyKey,
    p_lead_source: normalized.source as LeadSource,
    p_window_count: normalized.windowCount,
    p_screen_count: normalized.screenCount,
    p_sms_consent: normalized.smsConsent,
    p_email_consent: normalized.emailConsent,
    p_request_hash: requestHash,
    p_quote_request_hash: hash({ leadHash: requestHash, quoteKey })
  };
}
