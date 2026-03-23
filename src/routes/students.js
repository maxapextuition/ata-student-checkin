import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStudentsForTutor } from '../services/students.js';

const router = Router();

// GET /api/me — returns the logged-in tutor's email
router.get('/me', requireAuth, (req, res) => {
  res.json({ email: req.session.email, tutorId: req.session.employeeId });
});

// GET /api/students — returns students for the logged-in tutor
router.get('/', requireAuth, async (req, res) => {
  try {
    const students = await getStudentsForTutor(req.session.employeeId);
    res.json(students);
  } catch (err) {
    console.error('Students fetch error:', err.message);
    res.status(500).json({ error: 'Failed to load students' });
  }
});

export default router;
