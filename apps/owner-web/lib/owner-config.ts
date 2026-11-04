const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function hasOwnerAuthConfig(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL
    && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    && env.APEX_FOUNDER_SUBJECT_ID
    && UUID_PATTERN.test(env.APEX_FOUNDER_SUBJECT_ID)
  );
}

/** No-config preview is limited to the loopback-bound local development server. */
export function isLocalPreviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'development' && !hasOwnerAuthConfig(env);
}
