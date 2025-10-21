import React, { useEffect, useRef, useState } from 'react';

// PUBLIC_INTERFACE
export default function NoteEditorModal({ isOpen, onClose, onSave, initialNote }) {
  /**
   * Controlled modal for creating/editing a note.
   * - Title is required
   * - Esc closes
   * - Focus is moved to title on open
   */
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [error, setError] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialNote?.title || '');
      setContent(initialNote?.content || '');
      setError('');
      // Focus on title after open
      setTimeout(() => titleRef.current?.focus(), 0);
    }
  }, [isOpen, initialNote]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    onSave({ title: title.trim(), content });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Note editor">
      <div className="modal">
        <div className="modal-header">
          <h3>{initialNote?.id ? 'Edit Note' : 'New Note'}</h3>
        </div>
        <div className="modal-body">
          <label htmlFor="note-title" className="label">
            Title
          </label>
          <input
            id="note-title"
            className="input"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title"
            aria-invalid={!!error}
          />
          <label htmlFor="note-content" className="label mt-12">
            Content
          </label>
          <textarea
            id="note-content"
            className="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note..."
            rows={8}
          />
          {error && <div className="form-error" role="alert">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
