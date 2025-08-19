import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import fs from 'fs';
import path from 'path';

export class UserController {
  constructor(private databaseService: DatabaseService) {}

  getUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      const user = await this.databaseService.getUserByUsername(username);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const { passwordHash, ...userData } = user;
      let profilePhotoUrl = null;
      const photoPath = path.join(__dirname, '../../uploads', `${user.id}.jpg`);
      if (fs.existsSync(photoPath)) {
        profilePhotoUrl = `/uploads/${user.id}.jpg`;
      }
      res.json({ ...userData, profilePhotoUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  };

  updateUserData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      if (!req.user || req.user.username !== username) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }
      const { email, password } = req.body;
      let profilePhotoUrl = null;
      if (req.body.profilePhoto) {
        const photoBuffer = Buffer.from(req.body.profilePhoto, 'base64');
        const photoPath = path.join(__dirname, '../../uploads', `${req.user.id}.jpg`);
        fs.writeFileSync(photoPath, photoBuffer);
        profilePhotoUrl = `/uploads/${req.user.id}.jpg`;
      }
      const updatedUser = await this.databaseService.updateUserProfile(req.user.id, { email, password });
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const { passwordHash, ...userData } = updatedUser;
      res.json({ ...userData, profilePhotoUrl });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user data' });
    }
  };
} 