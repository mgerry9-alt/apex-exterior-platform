import { createApiServer } from './app.js';

const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
  founderSubjectId: process.env.APEX_FOUNDER_SUBJECT_ID ?? '',
  bindAddress: process.env.FIELD_OS_BIND_ADDRESS ?? '127.0.0.1',
  port: Number(process.env.FIELD_OS_PORT ?? 3100),
  allowedOrigins: (process.env.FIELD_OS_ALLOWED_ORIGINS ?? '')
    .split(',').map(value => value.trim()).filter(Boolean)
};

if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65535) {
  throw new TypeError('FIELD_OS_PORT must be between 0 and 65535');
}
for (const origin of config.allowedOrigins) {
  const parsed = new URL(origin);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
    throw new TypeError(`Invalid FIELD_OS_ALLOWED_ORIGINS entry: ${origin}`);
  }
}

const server = await createApiServer({ config });
const address = await server.listen({ port: config.port, host: config.bindAddress });
console.log(JSON.stringify({
  event: 'field_os_api_listening',
  address: config.bindAddress,
  url: address,
  auth: 'supabase_user_jwt',
  database: 'supabase_postgrest_rls'
}));
