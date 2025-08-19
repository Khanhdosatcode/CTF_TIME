import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { DatabaseService } from '../services/DatabaseService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
  isAdmin?: boolean;
}

export const authMiddleware = (authService: AuthService, databaseService: DatabaseService) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = authService.verifyToken(token);

      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Verify user still exists in database
      const user = await databaseService.getUserById(payload.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = {
        id: user.id,
        username: user.username
      };
      req.isAdmin = user.username === 'admin';

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}; 