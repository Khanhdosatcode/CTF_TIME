import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { DatabaseService } from '../services/DatabaseService';

const router = Router();
const databaseService = new DatabaseService();
const authService = new AuthService(databaseService);
const authController = new AuthController(authService);

router.post('/register', authController.register);

router.post('/login', authController.login);

export default router; 