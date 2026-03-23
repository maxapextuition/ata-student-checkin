import { Router } from 'express';
import { requestMagicLink, verifyMagicLink, logout } from '../services/auth.js';

const router = Router();

// POST /api/auth/magic-link  — request a login email
router.post('/magic-link', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    await requestMagicLink(email.trim().toLowerCase());
    res.json({ message: 'Check your email for a login link.' });
  } catch (err) {
    console.error('Magic link error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /verify?token=...  — clicked from email, sets cookie, redirects to dashboard
router.get('/verify', async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.redirect('/?error=invalid_link');
  }

  try {
    const { sessionToken } = await verifyMagicLink(token);

    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Verify error:', err.message);
    const msg = encodeURIComponent(err.message);
    res.redirect(`/?error=${msg}`);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = req.cookies?.session_token;
  if (token) logout(token);
  res.clearCookie('session_token');
  res.redirect('/');
});

export default router;
