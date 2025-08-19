import express from 'express';
import cors from 'cors';
import path from 'path';
import noteRoutes from './routes/noteRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import { DatabaseService } from './services/DatabaseService';

const app = express();
const PORT = process.env.PORT || 3000;

const databaseService = new DatabaseService();
databaseService.ensureAdminUser().then(() => {
  console.log('Admin user ensured.');
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/userData', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Note Taking App API is running' });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`Notes endpoints: http://localhost:${PORT}/api/notes`);
  console.log(`User endpoints: http://localhost:${PORT}/api/userData`);
  console.log(`Admin endpoints: http://localhost:${PORT}/api/admin`);
});
