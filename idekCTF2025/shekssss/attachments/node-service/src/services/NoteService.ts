import { Note, CreateNoteRequest, UpdateNoteRequest } from '../models/Note';

export interface INoteService {
  getAllNotes(): Note[];
  getNoteById(id: string): Note | null;
  createNote(noteData: CreateNoteRequest): Note;
  updateNote(id: string, noteData: UpdateNoteRequest): Note | null;
  deleteNote(id: string): boolean;
}

export class NoteService implements INoteService {
  private notes: Note[] = [];

  getAllNotes(): Note[] {
    return [...this.notes];
  }

  getNoteById(id: string): Note | null {
    return this.notes.find(note => note.id === id) || null;
  }

  createNote(noteData: CreateNoteRequest): Note {
    const newNote: Note = {
      id: this.generateId(),
      title: noteData.title,
      content: noteData.content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.notes.push(newNote);
    return newNote;
  }

  updateNote(id: string, noteData: UpdateNoteRequest): Note | null {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) {
      return null;
    }

    const updatedNote = {
      ...this.notes[noteIndex],
      ...noteData,
      updatedAt: new Date()
    };

    this.notes[noteIndex] = updatedNote;
    return updatedNote;
  }

  deleteNote(id: string): boolean {
    const noteIndex = this.notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) {
      return false;
    }

    this.notes.splice(noteIndex, 1);
    return true;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 