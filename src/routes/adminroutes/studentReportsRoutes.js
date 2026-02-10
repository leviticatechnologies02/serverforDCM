import express from 'express';
import {
  getStudentsReport,
  downloadStudentsReport,
} from '../../controllers/admincontrollers/studentReportsControllers.js';

const router = express.Router();

// View students (admin)
router.get('/', getStudentsReport);

// Download students report (Excel)
router.get('/excel', downloadStudentsReport);

export default router;
