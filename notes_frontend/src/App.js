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
        if (mounted) setErrorMsg('Failed to load notes. Check your Supabase configuration.');
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
    try {
      if (editingNote?.id) {
        // Optimistic update
        const id = editingNote.id;
        const previous = notes;
        const optimistic = previous.map((n) =>
          n.id === id ? { ...n, title, content, updated_at: new Date().toISOString() } : n
        );
        setNotes(optimistic);
        closeModal();
        try {
          const updated = await updateNote(id, { title, content });
          // Reconcile
          setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
        } catch (e) {
          // Rollback
          setNotes(previous);
          throw e;
        }
      } else {
        // Create
        closeModal();
        const created = await createNote({ title, content });
        setNotes((prev) => [created, ...prev]);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setErrorMsg('Failed to save note.');
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
