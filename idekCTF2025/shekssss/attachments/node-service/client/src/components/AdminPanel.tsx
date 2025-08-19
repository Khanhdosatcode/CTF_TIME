import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

interface UserListItem {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const AdminPanel: React.FC = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersError(null);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        const data = await response.json();
        if (!response.ok) {
          setUsersError(data.error || 'Failed to fetch users');
        } else {
          setUsers(data);
        }
      } catch (err: any) {
        setUsersError(err.message || 'Failed to fetch users');
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/fetch-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to fetch URL');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel-container">
      <h2>Admin Panel</h2>
      <form onSubmit={handleSubmit} className="admin-panel-form">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter URL to fetch..."
          className="admin-url-input"
          required
        />
        <button type="submit" className="admin-fetch-button" disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch'}
        </button>
      </form>
      {error && <div className="admin-error">{error}</div>}
      {result && (
        <div className="admin-result">
          <h3>Response</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <hr style={{ margin: '32px 0', width: '100%' }} />
      <h2>All Users</h2>
      {usersError && <div className="admin-error">{usersError}</div>}
      <div className="admin-users-list">
        {users.map(user => (
          <div key={user.id} className="admin-user-item">
            <strong>{user.username}</strong> ({user.email})<br />
            <a href={`/user/${btoa(user.username)}`} target="_blank" rel="noopener noreferrer">View Profile</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel; 