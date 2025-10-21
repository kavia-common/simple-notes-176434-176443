import React, { useEffect, useState } from 'react';
import './App.css';
import './index.css';

import Header from './components/Header';
import NotesList from './components/NotesList';
import NoteEditorModal from './components/NoteEditorModal';
import EmptyState from './components/EmptyState';

import {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  subscribeToNotes,
} from './services/notesService';

// PUBLIC_INTERFACE
function App() {
  /** Main app shell managing notes state, CRUD handlers, and optional realtime. */
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Initial fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listNotes();
        if (mounted) setNotes(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        // Extra diagnostics for common misconfigurations
        // eslint-disable-next-line no-console
        console.warn('[App] Notes load failed. Verify env vars and RLS policies:', {
          REACT_APP_SUPABASE_URL: !!process.env.REACT_APP_SUPABASE_URL,
          REACT_APP_SUPABASE_KEY: !!process.env.REACT_APP_SUPABASE_KEY,
          hint:
            'In Supabase, ensure a notes table exists and RLS allows anon/authenticated select as appropriate.',
        });
        const rlsHint =
          e?.code === '42501' || e?.message?.toLowerCase?.().includes('rls')
            ? ' (RLS may be blocking SELECT.)'
            : '';
        if (mounted) setErrorMsg(`Failed to load notes. Check your Supabase configuration.${rlsHint}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Optional realtime subscription
    const unsubscribe = subscribeToNotes((payload) => {
      // Simplistic reconciliation:
      const { eventType, new: newRow, old: oldRow } = payload;
      setNotes((prev) => {
        if (eventType === 'INSERT') {
          // Avoid duplicates if already present
          const exists = prev.find((n) => n.id === newRow.id);
          return exists ? prev.map((n) => (n.id === newRow.id ? newRow : n)) : [newRow, ...prev];
        }
        if (eventType === 'UPDATE') {
          return prev.map((n) => (n.id === newRow.id ? newRow : n));
        }
        if (eventType === 'DELETE') {
          const id = oldRow?.id;
          return prev.filter((n) => n.id !== id);
        }
        return prev;
      });
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const openCreate = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSave = async ({ title, content }) => {
    // Guard: required title
    if (!title?.trim()) {
      setErrorMsg('Title is required.');
      return;
    }
    try {
      if (editingNote?.id) {
        // Update: do NOT optimistically update to avoid UI diverging on RLS errors.
        const id = editingNote.id;
        const updated = await updateNote(id, { title, content });
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
        closeModal();
      } else {
        // Create: only add to list after successful creation
        const created = await createNote({ title, content });
        setNotes((prev) => [created, ...prev]);
        closeModal();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[App] Save note failed:', {
        message: e?.message || String(e),
        status: e?.status,
        code: e?.code,
      });
      const rlsHint =
        e?.code === '42501' || e?.message?.toLowerCase?.().includes('rls')
          ? ' Check your Supabase Row Level Security policies for the notes table.'
          : '';
      setErrorMsg(`Failed to save note.${rlsHint}`);
    }
  };

  const handleDelete = async (note) => {
    if (!note?.id) return;
    const confirmDelete = window.confirm(`Delete note "${note.title || '(Untitled)'}"?`);
    if (!confirmDelete) return;
    const previous = notes;
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    try {
      await deleteNote(note.id);
    } catch (e) {
      // rollback on error
      // eslint-disable-next-line no-console
      console.error(e);
      setNotes(previous);
      setErrorMsg('Failed to delete note.');
    }
  };

  return (
    <div className="ocean-app">
      <Header onNewNote={openCreate} />

      <main className="main container">
        {errorMsg && <div className="alert alert-error" role="alert">{errorMsg}</div>}
        {loading ? (
          <div className="loading">Loading notes…</div>
        ) : notes.length === 0 ? (
          <EmptyState onNewNote={openCreate} />
        ) : (
          <NotesList notes={notes} onEdit={openEdit} onDelete={handleDelete} />
        )}
      </main>

      <NoteEditorModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialNote={editingNote}
      />

      <footer className="footer container" role="contentinfo">
        <span className="footer-text">Ocean Professional • Simple Notes</span>
      </footer>
    </div>
  );
}

export default App;
