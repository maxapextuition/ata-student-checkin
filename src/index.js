import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.js';
import studentsRouter from './routes/students.js';
import checkinRouter from './routes/checkin.js';
import { requireAuth } from './middleware/auth.js';
import { logout } from './services/auth.js';

// Load shared ATA secrets first, then project-level overrides (project wins on conflicts)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const sharedRoot  = path.join(projectRoot, '..');  // Code Projects [ATA]/
dotenv.config({ path: path.join(sharedRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Force HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(projectRoot, 'public')));

// Routes
app.use('/api/auth', authRouter);
app.use('/verify', authRouter);        // /verify?token=... (magic link click)
app.use('/api/students', studentsRouter);
app.use('/api', studentsRouter);       // exposes /api/me
app.use('/api/checkin', checkinRouter);

// Dashboard page — protected
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(projectRoot, 'public', 'dashboard.html'));
});

// Logout (form POST from dashboard)
app.post('/logout', (req, res) => {
  const token = req.cookies?.session_token;
  if (token) logout(token);
  res.clearCookie('session_token');
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`ATA Tutor Portal running at http://localhost:${PORT}`);
});
