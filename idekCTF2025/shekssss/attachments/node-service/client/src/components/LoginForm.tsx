import React, { useState } from 'react';
import { LoginRequest } from '../types/User';
import './LoginForm.css';

interface LoginFormProps {
  onLogin: (loginData: LoginRequest) => void;
  onSwitchToRegister: () => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister, isLoading = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin({ username: username.trim(), password });
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your account</p>
        
        <form onSubmit={handleSubmit} className="auth-form-content">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading || !username.trim() || !password.trim()}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-switch">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="switch-button"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 