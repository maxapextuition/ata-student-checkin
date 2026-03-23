import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { saveCheckIn } from '../services/sheets.js';
import { getEmployeeByEmail } from '../services/teachworks.js';

const router = Router();

// POST /api/checkin
router.post('/', requireAuth, async (req, res) => {
  const { studentId, studentName, option, answers } = req.body;

  if (!studentId || !studentName || !option || !answers) {
    return res.status(400).json({ error: 'studentId, studentName, option, and answers are required' });
  }

  const optNum = parseInt(option, 10);
  if (optNum < 1 || optNum > 7 || isNaN(optNum)) {
    return res.status(400).json({ error: 'option must be 1–7' });
  }

  try {
    // Get tutor's full name from Teachworks (or fall back to email)
    let tutorName = req.session.email;
    try {
      const emp = await getEmployeeByEmail(req.session.email);
      if (emp) tutorName = `${emp.first_name} ${emp.last_name}`;
    } catch {}

    await saveCheckIn({
      option: optNum,
      tutorName,
      tutorId: req.session.employeeId || '',
      studentName,
      studentId,
      answers,
    });

    res.json({ message: 'Check-in saved.' });
  } catch (err) {
    console.error('Check-in error:', err.message);
    res.status(500).json({ error: 'Failed to save check-in' });
  }
});

export default router;
