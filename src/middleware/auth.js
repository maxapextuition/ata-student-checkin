import { validateSession } from '../services/auth.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.session_token;
  const session = validateSession(token);

  if (!session) {
    // API request — return JSON error
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Page request — redirect to login
    return res.redirect('/');
  }

  req.session = session;
  next();
}
