import React from 'react';

// PUBLIC_INTERFACE
export default function EmptyState({ onNewNote }) {
  /** Empty state encouraging first note creation. */
  return (
    <div className="empty-state container" role="status" aria-live="polite">
      <div className="empty-card">
        <h2>Welcome to Simple Notes</h2>
        <p>Create your first note to get started.</p>
        <button className="btn btn-primary" onClick={onNewNote}>
          + Create Note
        </button>
      </div>
    </div>
  );
}
