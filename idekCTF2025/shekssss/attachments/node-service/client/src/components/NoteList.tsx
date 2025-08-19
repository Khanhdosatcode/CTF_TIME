import React from 'react';
import { Note } from '../types/Note';
import NoteCard from './NoteCard';
import './NoteList.css';

interface NoteListProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  deletingNoteId?: string;
  isLoading?: boolean;
}

const NoteList: React.FC<NoteListProps> = ({ 
  notes, 
  onEdit, 
  onDelete, 
  deletingNoteId,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="note-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="note-list-container">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No notes yet</h3>
          <p>Create your first note to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="note-list-container">
      <div className="note-grid">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={deletingNoteId === note.id}
          />
        ))}
      </div>
    </div>
  );
};

export default NoteList; 