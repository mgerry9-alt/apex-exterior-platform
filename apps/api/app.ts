import Fastify, { type FastifyError, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { prepareLeadQuoteRequest, type LeadQuoteInput } from '../../packages/domain/lead-to-quote.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const leadQuoteSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['idempotencyKey', 'source', 'windowCount'],
  properties: {
    idempotencyKey: { type: 'string', minLength: 8, maxLength: 120 },
    source: { type: 'string', enum: ['inbound_form', 'referral', 'door_visit', 'returning_customer', 'manual'] },
    windowCount: { type: 'integer', minimum: 1, maximum: 10000 },
    screenCount: { type: 'integer', minimum: 0, maximum: 10000, default: 0 },
    smsConsent: { type: 'boolean', default: false },
    emailConsent: { type: 'boolean', default: false }
  }
} as const;

export interface ApiConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
  founderSubjectId: string;
  allowedOrigins?: string[];
}

interface UserScopedClient {
  auth: {
    getUser(jwt: string): Promise<{
      data: { user: { id: string } | null };
      error: { status?: number } | null;
    }>;
  };
  rpc(name: string, args?: Record<string, unknown>): Promise<{
    data: unknown;
    error: { code?: string; status?: number } | null;
  }>;
  from(table: string): {
    select(columns: string): {
      order(column: string, options: { ascending: boolean }): {
        limit(count: number): Promise<{ data: unknown[] | null; error: unknown | null }>;
      };
    };
  };
}

interface ClientOptions {
  auth: { autoRefreshToken: false; persistSession: false; detectSessionInUrl: false };
  global: { headers: { Authorization: string } };
}

type ClientFactory = (url: string, key: string, options: ClientOptions) => UserScopedClient;
type AuthResult = { client: UserScopedClient } | { status: number; error: string };

function makeUserClient(config: ApiConfig, token: string, factory: ClientFactory): UserScopedClient {
  return factory(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

async function authenticateFounder(
  request: FastifyRequest,
  config: ApiConfig,
  factory: ClientFactory
): Promise<AuthResult> {
  const authorization = request.headers.authorization;
  const match = typeof authorization === 'string' ? /^Bearer ([^\s]+)$/i.exec(authorization) : null;
  const token = match?.[1];
  if (!token || token.length > 8192) return { status: 401, error: 'authentication_required' };

  const client = makeUserClient(config, token, factory);
  const { data, error } = await client.auth.getUser(token);
  if (error) {
    const status = error.status === 401 ? 401 : 503;
    return { status, error: status === 401 ? 'invalid_session' : 'identity_provider_unavailable' };
  }
  if (!data.user?.id || !UUID_PATTERN.test(data.user.id)) return { status: 401, error: 'invalid_session' };
  if (data.user.id.toLowerCase() !== config.founderSubjectId.toLowerCase()) {
    return { status: 403, error: 'founder_access_required' };
  }

  // PostgREST receives the same JWT and the RLS helper checks founder subject
  // plus AAL2 after the platform validates the token signature.
  const { data: allowed, error: policyError } = await client.rpc('current_founder_access');
  if (policyError) return { status: 503, error: 'authorization_policy_unavailable' };
  if (allowed !== true) return { status: 403, error: 'founder_mfa_required' };
  return { client };
}

function sendAuthFailure(reply: FastifyReply, result: Exclude<AuthResult, { client: UserScopedClient }>) {
  return reply.code(result.status).send({ error: result.error });
}

export async function createApiServer(
  { config, createSupabaseClient }: {
    config: ApiConfig;
    createSupabaseClient?: ClientFactory;
  }
): Promise<FastifyInstance> {
  if (!config?.supabaseUrl || !config.supabasePublishableKey || !UUID_PATTERN.test(config.founderSubjectId ?? '')) {
    throw new TypeError('Supabase URL, publishable key, and a founder subject UUID are required');
  }
  const factory: ClientFactory = createSupabaseClient ?? ((url, key, options) =>
    createClient(url, key, options) as unknown as UserScopedClient);
  const allowedOrigins = new Set(config.allowedOrigins ?? []);
  const server = Fastify({
    logger: false,
    bodyLimit: 16 * 1024,
    exposeHeadRoutes: false,
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false, useDefaults: false } }
  });

  server.addHook('onRequest', async (request, reply) => {
    reply.header('cache-control', 'no-store');
    reply.header('x-content-type-options', 'nosniff');
    reply.header('vary', 'Origin');
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      return reply.code(403).send({ error: 'origin_not_allowed' });
    }
    if (origin) {
      reply.header('access-control-allow-origin', origin);
      reply.header('access-control-allow-headers', 'authorization, content-type');
      reply.header('access-control-allow-methods', 'GET, POST, OPTIONS');
    }
    if (request.method === 'OPTIONS') return reply.code(204).send();
  });

  server.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error.statusCode === 413) return reply.code(413).send({ error: 'request_too_large' });
    if (error.validation) return reply.code(400).send({ error: 'invalid_request' });
    return reply.code(500).send({ error: 'request_failed' });
  });

  server.get('/health', async () => ({ status: 'ok', mode: 'supabase-auth-and-rls-required' }));

  server.get('/api/field-hub', async (request, reply) => {
    const auth = await authenticateFounder(request, config, factory);
    if ('status' in auth) return sendAuthFailure(reply, auth);
    const { data: records, error } = await auth.client
      .from('owner_hub_records')
      .select('id, record_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return reply.code(503).send({ error: 'field_hub_unavailable' });
    return reply.code(200).send({ records });
  });

  server.post<{ Body: LeadQuoteInput }>('/api/leads/quote', {
    schema: { body: leadQuoteSchema }
  }, async (request, reply) => {
    if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
      return reply.code(415).send({ error: 'application_json_required' });
    }
    const auth = await authenticateFounder(request, config, factory);
    if ('status' in auth) return sendAuthFailure(reply, auth);

    const rpcArguments = prepareLeadQuoteRequest(request.body);
    const { data: result, error } = await auth.client.rpc('capture_lead_and_quote', { ...rpcArguments });
    if (error?.code === '42501') return reply.code(403).send({ error: 'founder_access_required' });
    if (error?.code === '22023') return reply.code(409).send({ error: 'idempotency_key_conflict' });
    if (error?.code === 'P0002') return reply.code(409).send({ error: 'approved_pricebook_required' });
    if (error) return reply.code(503).send({ error: 'lead_quote_unavailable' });

    const replayed = typeof result === 'object' && result !== null && 'replayed' in result && result.replayed === true;
    return reply.code(replayed ? 200 : 201).send(result);
  });

  return server;
}
