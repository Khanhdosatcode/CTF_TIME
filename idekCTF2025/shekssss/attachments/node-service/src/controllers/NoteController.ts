import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { CreateNoteRequest, UpdateNoteRequest } from '../models/Note';
import { AuthenticatedRequest } from '../middleware/auth';

export class NoteController {
  constructor(private databaseService: DatabaseService) {}

  getAllNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const notes = await this.databaseService.getNotesByUserId(req.user.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notes' });
    }
  };

  getNoteById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { id } = req.params;
      const note = await this.databaseService.getNoteById(id, req.user.id);
      
      if (!note) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }
      
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch note' });
    }
  };

  createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const noteData: CreateNoteRequest = req.body;
      
      if (!noteData.title || !noteData.content) {
        res.status(400).json({ error: 'Title and content are required' });
        return;
      }
      
      const newNote = await this.databaseService.createNote(req.user.id, noteData);
      res.status(201).json(newNote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create note' });
    }
  };

  updateNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { id } = req.params;
      const noteData: UpdateNoteRequest = req.body;
      
      const updatedNote = await this.databaseService.updateNote(id, req.user.id, noteData);
      
      if (!updatedNote) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }
      
      res.json(updatedNote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update note' });
    }
  };

  deleteNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { id } = req.params;
      const success = await this.databaseService.deleteNote(id, req.user.id);
      
      if (!success) {
        res.status(404).json({ error: 'Note not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete note' });
    }
  };
} 