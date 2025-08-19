import React, { useState, useEffect } from 'react';
import { Note, CreateNoteRequest } from './types/Note';
import { User } from './types/User';
import { apiService } from './services/api';
import { authApiService } from './services/authApi';
import NoteList from './components/NoteList';
import NoteForm from './components/NoteForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UserProfile from './components/UserProfile';
import AdminPanel from './components/AdminPanel';
import './App.css';

function getUserProfileRoute(): string | null {
  const match = window.location.pathname.match(/^\/user\/([^/]+)$/);
  if (!match) return null;
  try {
    return atob(match[1]);
  } catch {
    return match[1];
  }
}

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const routeUsername = getUserProfileRoute();

  useEffect(() => {
    if (user && !showProfile && !showAdmin) {
      loadNotes();
    }
  }, [user, showProfile, showAdmin]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedNotes = await apiService.getAllNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      setError('Failed to load notes. Please try again.');
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (noteData: CreateNoteRequest) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const newNote = await apiService.createNote(noteData);
      if (!newNote || !newNote.id) {
        console.error('Invalid note response:', newNote);
        setError('Failed to create note. Invalid response from server.');
        return;
      }
      setNotes(prev => [newNote, ...prev]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to create note. Please try again.');
      console.error('Error creating note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async (noteData: CreateNoteRequest) => {
    if (!editingNote) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const updatedNote = await apiService.updateNote(editingNote.id, noteData);
      setNotes(prev => prev.map(note => note.id === editingNote.id ? updatedNote : note));
      setEditingNote(undefined);
      setShowForm(false);
    } catch (err) {
      setError('Failed to update note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      setDeletingNoteId(id);
      setError(null);
      await apiService.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      setError('Failed to delete note. Please try again.');
    } finally {
      setDeletingNoteId(undefined);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingNote(undefined);
  };

  const handleSubmit = (noteData: CreateNoteRequest) => {
    if (editingNote) {
      handleUpdateNote(noteData);
    } else {
      handleCreateNote(noteData);
    }
  };

  const handleLogin = async (loginData: { username: string; password: string }) => {
    try {
      setAuthLoading(true);
      setError(null);
      const res = await authApiService.login(loginData);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      setAuthMode('login');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (registerData: { username: string; email: string; password: string }) => {
    try {
      setAuthLoading(true);
      setError(null);
      const res = await authApiService.register(registerData);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      setAuthMode('login');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setNotes([]);
    setError(null);
  };

  // UI
  if (!user) {
    return (
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1>📝 Note Taking App</h1>
          </div>
        </header>
        <main className="app-main">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
          {authMode === 'login' ? (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToRegister={() => { setAuthMode('register'); setError(null); }}
              isLoading={authLoading}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              onSwitchToLogin={() => { setAuthMode('login'); setError(null); }}
              isLoading={authLoading}
            />
          )}
        </main>
      </div>
    );
  }

  if (showProfile && user) {
    return (
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1>📝 Note Taking App</h1>
            <div>
              <span className="user-info">Hello, {user.username}!</span>
              <button className="add-note-button" onClick={() => setShowProfile(false)}>
                Back to Notes
              </button>
              <button className="add-note-button" style={{ marginLeft: 12, background: '#ef4444' }} onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="app-main">
          <UserProfile username={user.username} isCurrentUser={true} />
        </main>
      </div>
    );
  }

  if (showAdmin && user && user.username === 'admin') {
    return (
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1>📝 Note Taking App</h1>
            <div>
              <span className="user-info">Hello, {user.username}!</span>
              <button className="add-note-button" onClick={() => setShowAdmin(false)}>
                Back to Notes
              </button>
              <button className="add-note-button" style={{ marginLeft: 12, background: '#ef4444' }} onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="app-main">
          <AdminPanel />
        </main>
      </div>
    );
  }

  if (routeUsername) {
    return (
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1>📝 Note Taking App</h1>
            <div>
              <button className="add-note-button" onClick={() => window.history.back()}>
                Back
              </button>
            </div>
          </div>
        </header>
        <main className="app-main">
          <UserProfile username={routeUsername} isCurrentUser={user?.username === routeUsername} />
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>📝 Note Taking App</h1>
          <div>
            <span className="user-info">Hello, {user.username}!</span>
            <button className="add-note-button" onClick={() => setShowForm(true)}>
              + New Note
            </button>
            <button className="add-note-button" style={{ marginLeft: 12 }} onClick={() => setShowProfile(true)}>
              Profile
            </button>
            {user.username === 'admin' && (
              <button className="add-note-button" style={{ marginLeft: 12, background: '#f59e42' }} onClick={() => setShowAdmin(true)}>
                Admin Panel
              </button>
            )}
            <button className="add-note-button" style={{ marginLeft: 12, background: '#ef4444' }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        <NoteList
          notes={notes}
          onEdit={handleEditNote}
          onDelete={handleDeleteNote}
          deletingNoteId={deletingNoteId}
          isLoading={isLoading}
        />
      </main>
      {showForm && (
        <NoteForm
          note={editingNote}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}

export default App;
