import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { DatabaseService } from '../services/DatabaseService';
import { AuthService } from '../services/AuthService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const databaseService = new DatabaseService();
const authService = new AuthService(databaseService);
const userController = new UserController(databaseService);

router.get('/:username', userController.getUserData);
router.put('/:username', authMiddleware(authService, databaseService), userController.updateUserData);

export default router; 