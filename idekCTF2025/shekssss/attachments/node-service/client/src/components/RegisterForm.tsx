import React, { useState } from 'react';
import { RegisterRequest } from '../types/User';
import './LoginForm.css';

interface RegisterFormProps {
  onRegister: (registerData: RegisterRequest) => void;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin, isLoading = false }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && email.trim() && password.trim()) {
      onRegister({ username: username.trim(), email: email.trim(), password });
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to start taking notes</p>
        <form onSubmit={handleSubmit} className="auth-form-content">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
              placeholder="Create a password"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading || !username.trim() || !email.trim() || !password.trim()}
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-switch">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="switch-button"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 