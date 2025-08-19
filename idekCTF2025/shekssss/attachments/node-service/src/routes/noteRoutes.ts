import { Router } from 'express';
import { NoteController } from '../controllers/NoteController';
import { DatabaseService } from '../services/DatabaseService';
import { AuthService } from '../services/AuthService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const databaseService = new DatabaseService();
const authService = new AuthService(databaseService);
const noteController = new NoteController(databaseService);

const authenticate = authMiddleware(authService, databaseService);
router.use(authenticate);

router.get('/', noteController.getAllNotes);

router.get('/:id', noteController.getNoteById);

router.post('/', noteController.createNote);

router.put('/:id', noteController.updateNote);

router.delete('/:id', noteController.deleteNote);

export default router; 