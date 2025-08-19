import React from 'react';
import { Note } from '../types/Note';
import './NoteCard.css';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete, isDeleting = false }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="note-card">
      <div className="note-card-header">
        <h3 className="note-title">{note.title}</h3>
        <div className="note-actions">
          <button
            className="action-button edit-button"
            onClick={() => onEdit(note)}
            title="Edit note"
          >
            ✏️
          </button>
          <button
            className="action-button delete-button"
            onClick={() => onDelete(note.id)}
            disabled={isDeleting}
            title="Delete note"
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>
      
      <div className="note-content">
        <p>{truncateContent(note.content)}</p>
      </div>
      
      <div className="note-footer">
        <span className="note-date">
          Created: {formatDate(note.createdAt)}
        </span>
        {note.updatedAt.getTime() !== note.createdAt.getTime() && (
          <span className="note-date">
            Updated: {formatDate(note.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
};

export default NoteCard; 