import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client singleton for the app.
 * Reads configuration from environment variables.
 * Requires:
 *  - REACT_APP_SUPABASE_URL
 *  - REACT_APP_SUPABASE_KEY
 *
 * Optional:
 *  - REACT_APP_SUPABASE_ENABLE_REALTIME=true|false (default false)
 */

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a Supabase client instance configured with environment variables. */
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  if (!url || !key) {
    // Helpful console error - app will still render gracefully using EmptyState.
    // Do not throw - allow UI to guide user to set env vars.
    // eslint-disable-next-line no-console
    console.error(
      '[Supabase] Missing configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY in your .env file.'
    );
    return null;
  }

  // Create a single supabase client for the entire app.
  const supabase = createClient(url, key);
  return supabase;
}

// PUBLIC_INTERFACE
export function isRealtimeEnabled() {
  /** Returns true if realtime should be used, controlled via env flag REACT_APP_SUPABASE_ENABLE_REALTIME. */
  const flag = (process.env.REACT_APP_SUPABASE_ENABLE_REALTIME || '').toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'yes';
}
