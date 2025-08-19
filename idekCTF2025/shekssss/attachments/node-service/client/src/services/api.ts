import { Note, CreateNoteRequest, UpdateNoteRequest } from '../types/Note';

declare global {
  interface Window {
    _env_?: {
      REACT_APP_API_URL?: string;
    };
  }
}

const API_BASE_URL =
  (window._env_ && window._env_.REACT_APP_API_URL) ||
  process.env.REACT_APP_API_URL ||
  '/api';


function parseNote(note: any): Note {
  return {
    ...note,
    createdAt: new Date(note.createdAt),
    updatedAt: new Date(note.updatedAt),
  };
}

export class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Authentication required. Please login again.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAllNotes(): Promise<Note[]> {
    const notes = await this.request<Note[]>('/notes');
    return notes.map(parseNote);
  }

  async getNoteById(id: string): Promise<Note> {
    const note = await this.request<Note>(`/notes/${id}`);
    return parseNote(note);
  }

  async createNote(noteData: CreateNoteRequest): Promise<Note> {
    const note = await this.request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
    return parseNote(note);
  }

  async updateNote(id: string, noteData: UpdateNoteRequest): Promise<Note> {
    const note = await this.request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData),
    });
    return parseNote(note);
  }

  async deleteNote(id: string): Promise<void> {
    return this.request<void>(`/notes/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService(); 