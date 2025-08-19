import { User } from '../types/User';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface UserProfileResponse extends Omit<User, 'passwordHash'> {
  profilePhotoUrl?: string | null;
}

export class UserApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async getUserData(username: string): Promise<UserProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/userData/${username}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    return response.json();
  }

  async updateUserData(username: string, data: { email?: string; password?: string; profilePhoto?: string }): Promise<UserProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/userData/${username}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update user data');
    }
    return response.json();
  }
}

export const userApiService = new UserApiService(); 