import sqlite3 from 'sqlite3';
import { User, CreateUserRequest } from '../models/User';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '../models/Note';

export class DatabaseService {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database('./database.sqlite');
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table ensured.');
      }
    });

    this.db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating notes table:', err);
      } else {
        console.log('Notes table ensured.');
      }
    });
  }

  async createUser(userData: CreateUserRequest, passwordHash: string): Promise<User> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (id, username, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userData.username, userData.email, passwordHash, now, now],
        (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              username: userData.username,
              email: userData.email,
              passwordHash,
              createdAt: new Date(now),
              updatedAt: new Date(now)
            });
          }
        }
      );
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err: Error | null, row: any) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              id: row.id,
              username: row.username,
              email: row.email,
              passwordHash: row.passwordHash,
              createdAt: new Date(row.createdAt),
              updatedAt: new Date(row.updatedAt)
            });
          }
        }
      );
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err: Error | null, row: any) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              id: row.id,
              username: row.username,
              email: row.email,
              passwordHash: row.passwordHash,
              createdAt: new Date(row.createdAt),
              updatedAt: new Date(row.updatedAt)
            });
          }
        }
      );
    });
  }

  async updateUserProfile(userId: string, data: { email?: string; password?: string }): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.password !== undefined) {
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);
      updates.push('passwordHash = ?');
      values.push(passwordHash);
    }
    if (updates.length === 0) return this.getUserById(userId);
    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(userId);
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values,
        (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            this.getUserById(userId)
              .then(user => resolve(user))
              .catch(fetchErr => reject(fetchErr));
          }
        }
      );
    });
  }

  async getAllUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users', [], (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            id: row.id,
            username: row.username,
            email: row.email,
            passwordHash: row.passwordHash,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
          })));
        }
      });
    });
  }

  async createNote(userId: string, noteData: CreateNoteRequest): Promise<Note> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO notes (id, userId, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, noteData.title, noteData.content, now, now],
        (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              userId,
              title: noteData.title,
              content: noteData.content,
              createdAt: new Date(now),
              updatedAt: new Date(now)
            });
          }
        }
      );
    });
  }

  async getNotesByUserId(userId: string): Promise<Note[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM notes WHERE userId = ? ORDER BY updatedAt DESC',
        [userId],
        (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => ({
              id: row.id,
              userId: row.userId,
              title: row.title,
              content: row.content,
              createdAt: new Date(row.createdAt),
              updatedAt: new Date(row.updatedAt)
            })));
          }
        }
      );
    });
  }

  async getNoteById(id: string, userId: string): Promise<Note | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM notes WHERE id = ? AND userId = ?',
        [id, userId],
        (err: Error | null, row: any) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            resolve({
              id: row.id,
              userId: row.userId,
              title: row.title,
              content: row.content,
              createdAt: new Date(row.createdAt),
              updatedAt: new Date(row.updatedAt)
            });
          }
        }
      );
    });
  }

  async updateNote(id: string, userId: string, noteData: UpdateNoteRequest): Promise<Note | null> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (noteData.title !== undefined) {
      updates.push('title = ?');
      values.push(noteData.title);
    }
    if (noteData.content !== undefined) {
      updates.push('content = ?');
      values.push(noteData.content);
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id, userId);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
        values,
        (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            this.getNoteById(id, userId)
              .then(note => resolve(note))
              .catch(fetchErr => reject(fetchErr));
          }
        }
      );
    });
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM notes WHERE id = ? AND userId = ?',
        [id, userId],
        function (err: Error | null) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async ensureAdminUser(): Promise<void> {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    const adminUsername = 'admin';
    const adminEmail = 'admin@localhost';
    const user = await this.getUserByUsername(adminUsername);
    if (!user) {
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
      await new Promise((resolve, reject) => {
        this.db.run(
          'INSERT INTO users (id, username, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
          [
            Date.now().toString(36) + Math.random().toString(36).substr(2),
            adminUsername,
            adminEmail,
            passwordHash,
            new Date().toISOString(),
            new Date().toISOString()
          ],
          (err: Error | null) => {
            if (err) reject(err);
            else resolve(null);
          }
        );
      });
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  close(): void {
    this.db.close();
  }
} 