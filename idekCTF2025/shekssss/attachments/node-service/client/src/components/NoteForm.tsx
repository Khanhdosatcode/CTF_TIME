import React, { useState, useEffect } from 'react';
import { Note, CreateNoteRequest } from '../types/Note';
import './NoteForm.css';

interface NoteFormProps {
  note?: Note;
  onSubmit: (noteData: CreateNoteRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const NoteForm: React.FC<NoteFormProps> = ({ note, onSubmit, onCancel, isLoading = false }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit({ title: title.trim(), content: content.trim() });
    }
  };

  return (
    <div className="note-form-overlay">
      <div className="note-form-container">
        <div className="note-form-header">
          <h2>{note ? 'Edit Note' : 'Create New Note'}</h2>
          <button className="close-button" onClick={onCancel}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="note-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter note content..."
              rows={8}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || !title.trim() || !content.trim()}
            >
              {isLoading ? 'Saving...' : (note ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteForm; 