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

/**
 * Utility to wrap Supabase errors with richer logs to aid debugging in UI.
 * Does not alter thrown error types to preserve upstream handling behavior.
 */
function handleResponse({ data, error }) {
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[Supabase] Request error:', {
      message: error.message,
      status: error.status,
      name: error.name,
      code: error.code,
      hint:
        error.code === '42501' || error.message?.toLowerCase?.().includes('rls')
          ? 'Row Level Security may be blocking this operation. Ensure RLS policies allow anon to insert/update/delete or use authenticated user with proper policies.'
          : undefined,
      details: error,
    });
    // attach a friendlier message for upstream UI while preserving original fields
    const enriched = Object.assign(new Error(error.message), {
      status: error.status,
      code: error.code,
    });
    throw enriched;
  }
  return data;
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes ordered by updated_at desc. */
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    const res = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false, nullsFirst: false });
    return handleResponse(res) || [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[NotesService] listNotes failed, returning empty list:', {
      message: err?.message || String(err),
      code: err?.code,
      status: err?.status,
      hint:
        'Verify REACT_APP_SUPABASE_URL/KEY and that notes table exists. If RLS is enabled, add a SELECT policy for the anon or your auth role.',
    });
    return [];
  }
}

// PUBLIC_INTERFACE
export async function getNote(id) {
  /** Fetch single note by id. */
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const res = await supabase.from('notes').select('*').eq('id', id).single();
    return handleResponse(res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[NotesService] getNote failed:', err?.message || err);
    return null;
  }
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }) {
  /** Create a note. Title is required. */
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const now = new Date().toISOString();
    const payload = { title, content: content ?? '', created_at: now, updated_at: now };
    const res = await supabase.from('notes').insert([payload]).select().single();
    return handleResponse(res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[NotesService] createNote failed:', {
      message: err?.message || String(err),
      code: err?.code,
      status: err?.status,
      context: 'insert into public.notes',
    });
    throw err; // let UI handle showing error/rollback
  }
}

// PUBLIC_INTERFACE
export async function updateNote(id, data) {
  /** Update note fields by id. */
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const payload = { ...data, updated_at: new Date().toISOString() };
    const res = await supabase.from('notes').update(payload).eq('id', id).select().single();
    return handleResponse(res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[NotesService] updateNote failed:', {
      message: err?.message || String(err),
      code: err?.code,
      status: err?.status,
      context: { id, op: 'update public.notes' },
    });
    throw err; // let UI handle showing error/rollback
  }
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note by id. Returns true on success. */
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const res = await supabase.from('notes').delete().eq('id', id);
    handleResponse(res);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[NotesService] deleteNote failed:', {
      message: err?.message || String(err),
      code: err?.code,
      status: err?.status,
      context: { id, op: 'delete from public.notes' },
    });
    return false;
  }
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
