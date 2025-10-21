import { getSupabaseClient, isRealtimeEnabled } from '../supabaseClient';

/**
 * Notes service encapsulating CRUD operations against the 'notes' table.
 * Assumed schema:
 *  - id: uuid (pk)
 *  - title: text
 *  - content: text
 *  - created_at: timestamp (default now())
 *  - updated_at: timestamp (updated via trigger or on updates in queries)
 */

// Utility to wrap Supabase errors
function handleResponse({ data, error }) {
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes ordered by updated_at desc. */
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const res = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false, nullsFirst: false });
  return handleResponse(res) || [];
}

// PUBLIC_INTERFACE
export async function getNote(id) {
  /** Fetch single note by id. */
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const res = await supabase.from('notes').select('*').eq('id', id).single();
  return handleResponse(res);
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }) {
  /** Create a note. Title is required. */
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const now = new Date().toISOString();
  const res = await supabase
    .from('notes')
    .insert([{ title, content: content || '', created_at: now, updated_at: now }])
    .select()
    .single();
  return handleResponse(res);
}

// PUBLIC_INTERFACE
export async function updateNote(id, data) {
  /** Update note fields by id. */
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const payload = { ...data, updated_at: new Date().toISOString() };
  const res = await supabase.from('notes').update(payload).eq('id', id).select().single();
  return handleResponse(res);
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note by id. Returns true on success. */
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const res = await supabase.from('notes').delete().eq('id', id);
  handleResponse(res);
  return true;
}

// PUBLIC_INTERFACE
export function subscribeToNotes(onChange) {
  /**
   * Optionally subscribe to realtime changes for the 'notes' table.
   * Requires REACT_APP_SUPABASE_ENABLE_REALTIME=true and valid supabase config.
   * onChange receives payload with type (INSERT|UPDATE|DELETE) and new/current rows.
   */
  const supabase = getSupabaseClient();
  if (!supabase || !isRealtimeEnabled()) {
    return () => {};
  }

  // Create channel for postgres changes
  const channel = supabase
    .channel('notes-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notes' },
      (payload) => {
        try {
          if (typeof onChange === 'function') onChange(payload);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Realtime] onChange handler error', e);
        }
      }
    )
    .subscribe((status) => {
      // eslint-disable-next-line no-console
      console.log('[Realtime] subscription status:', status);
    });

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[Realtime] Unsubscribe error', e);
    }
  };
}
