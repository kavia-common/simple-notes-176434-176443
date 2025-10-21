import React from 'react';

// PUBLIC_INTERFACE
export default function Header({ onNewNote }) {
  /** Header bar with title and "New Note" primary action. */
  return (
    <header className="header">
      <div className="container header-inner" role="banner">
        <h1 className="app-title" aria-label="Simple Notes">
          Simple Notes
        </h1>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNewNote}
            aria-label="Create a new note"
          >
            + New Note
          </button>
        </div>
      </div>
    </header>
  );
}
