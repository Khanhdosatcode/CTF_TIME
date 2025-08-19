import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, CreateUserRequest, LoginRequest, AuthResponse, JWTPayload } from '../models/User';
import { DatabaseService } from './DatabaseService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export class AuthService {
  constructor(private databaseService: DatabaseService) {}

  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    const existingUser = await this.databaseService.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const user = await this.databaseService.createUser(userData, passwordHash);

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const user = await this.databaseService.getUserByUsername(loginData.username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isValidPassword = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    };
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  private generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }
} 