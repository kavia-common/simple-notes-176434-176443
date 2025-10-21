import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client singleton for the app.
 * Reads configuration from environment variables.
 * Requires:
 *  - REACT_APP_SUPABASE_URL
 *  - REACT_APP_SUPABASE_KEY
 *
 * Also supports fallback env names without REACT_APP_ prefix:
 *  - SUPABASE_URL
 *  - SUPABASE_KEY
 *
 * Optional:
 *  - REACT_APP_SUPABASE_ENABLE_REALTIME=true|false (default false)
 */

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a Supabase client instance configured with environment variables. */
  // Prefer React-exposed variables; fallback to non-prefixed if present to be forgiving.
  const url =
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  const key =
    process.env.REACT_APP_SUPABASE_KEY ||
    process.env.SUPABASE_KEY ||
    '';

  if (!url || !key) {
    // Helpful console warning - app will still render gracefully using EmptyState.
    // Do not throw - allow UI to guide user to set env vars.
    // eslint-disable-next-line no-console
    console.warn(
      '[Supabase] Missing configuration.\n' +
        'Ensure you have set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your .env file.\n' +
        'If you used SUPABASE_URL/SUPABASE_KEY, they are supported as a fallback, but CRA only exposes REACT_APP_* at build time.'
    );
    return null;
  }

  try {
    const supabase = createClient(url, key);
    return supabase;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Supabase] Failed to initialize client:', e);
    return null;
  }
}

// PUBLIC_INTERFACE
export function isRealtimeEnabled() {
  /** Returns true if realtime should be used, controlled via env flag REACT_APP_SUPABASE_ENABLE_REALTIME. */
  const flag = (process.env.REACT_APP_SUPABASE_ENABLE_REALTIME || '').toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'yes';
}
