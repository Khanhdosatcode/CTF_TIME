import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { CreateUserRequest, LoginRequest } from '../models/User';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: CreateUserRequest = req.body;
      
      if (!userData.username || !userData.email || !userData.password) {
        res.status(400).json({ error: 'Username, email, and password are required' });
        return;
      }

      if (userData.password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
      }

      const result = await this.authService.register(userData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Registration failed' });
      }
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;
      
      if (!loginData.username || !loginData.password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      const result = await this.authService.login(loginData);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Login failed' });
      }
    }
  };
} 