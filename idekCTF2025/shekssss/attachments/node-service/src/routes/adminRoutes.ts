import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { DatabaseService } from '../services/DatabaseService';
import { AuthService } from '../services/AuthService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const databaseService = new DatabaseService();
const authService = new AuthService(databaseService);
const adminController = new AdminController(databaseService);

router.post('/fetch-url', authMiddleware(authService, databaseService), adminController.fetchUrl);
router.get('/users', authMiddleware(authService, databaseService), adminController.listUsers);

export default router; 