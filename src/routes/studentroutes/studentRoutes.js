import express from 'express';
import User from '../../models/user.js';

const router = express.Router();

router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    res.status(200).json({ students });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

export default router; // ✅ default export
