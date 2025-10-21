import React from 'react';

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

// PUBLIC_INTERFACE
export default function NotesList({ notes, onEdit, onDelete }) {
  /** Renders list of notes as cards with edit/delete actions. */
  if (!notes || notes.length === 0) return null;

  return (
    <div className="notes-grid container" role="list" aria-label="Notes list">
      {notes.map((note) => (
        <article key={note.id} className="note-card" role="listitem">
          <div className="note-card-header">
            <h3 className="note-title">{note.title || '(Untitled)'}</h3>
          </div>
          <p className="note-content">
            {note.content ? String(note.content).slice(0, 160) : ''}
            {note.content && note.content.length > 160 ? '…' : ''}
          </p>
          <div className="note-meta">
            <span className="note-updated" aria-label="Last updated">
              Updated: {formatDate(note.updated_at || note.created_at)}
            </span>
            <div className="note-actions">
              <button
                className="btn btn-secondary"
                onClick={() => onEdit(note)}
                aria-label={`Edit note ${note.title}`}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onDelete(note)}
                aria-label={`Delete note ${note.title}`}
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
