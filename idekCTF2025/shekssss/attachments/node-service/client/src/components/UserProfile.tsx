import React, { useEffect, useState, useRef } from 'react';
import { userApiService, UserProfileResponse } from '../services/userApi';
import { User } from '../types/User';
import './UserProfile.css';

interface UserProfileProps {
  username: string;
  isCurrentUser: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ username, isCurrentUser }) => {
  const [userData, setUserData] = useState<UserProfileResponse | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userApiService.getUserData(username)
      .then(data => {
        setUserData(data);
        setEmail(data.email);
        setPreviewPhoto(data.profilePhotoUrl || null);
      })
      .catch(() => setError('Failed to load user data.'));
  }, [username]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        setPreviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      let base64Photo: string | undefined;
      if (profilePhoto && profilePhoto.startsWith('data:')) {
        base64Photo = profilePhoto.split(',')[1];
      }
      const updated = await userApiService.updateUserData(username, {
        email,
        password: password || undefined,
        profilePhoto: base64Photo,
      });
      setUserData(updated);
      setEditMode(false);
      setPassword('');
      setSuccess('Profile updated successfully!');
      setPreviewPhoto(updated.profilePhotoUrl || null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  if (!userData) {
    return <div className="user-profile-container"><div>Loading...</div></div>;
  }

  return (
    <div className="user-profile-container">
      <h2>User Profile</h2>
      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">{success}</div>}
      <div className="profile-photo-section">
        {/* XSS-vulnerable: profilePhotoUrl is injected as raw HTML */}
        <div
          dangerouslySetInnerHTML={{
            __html: `<img src='${previewPhoto || '/default-profile.png'}' class="profile-photo" alt="Profile" />`
          }}
          onClick={() => {
            if (isCurrentUser && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          style={{ cursor: isCurrentUser ? 'pointer' : 'default' }}
        />
        {isCurrentUser && (
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handlePhotoChange}
          />
        )}
      </div>
      <div className="profile-info-section">
        <div><strong>Username:</strong> {userData.username}</div>
        {editMode ? (
          <form onSubmit={handleSave} className="profile-edit-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                minLength={6}
              />
            </div>
            <div className="profile-actions">
              <button type="button" onClick={() => setEditMode(false)} className="cancel-button">Cancel</button>
              <button type="submit" className="save-button">Save</button>
            </div>
          </form>
        ) : (
          <>
            <div><strong>Email:</strong> {userData.email}</div>
            {isCurrentUser && (
              <button className="edit-profile-button" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 