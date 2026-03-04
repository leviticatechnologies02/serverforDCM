import express from 'express';
import {
  getStudentsReport,
  downloadStudentsReport,
} from '../../controllers/admincontrollers/studentReportsControllers.js';
import { downloadPaymentsExcel } from '../../controllers/admincontrollers/transactionController.js';

const router = express.Router();

// View students (admin)
router.get('/', getStudentsReport);

// Download students report (Excel)
router.get('/excel', downloadStudentsReport);
router.get('payments/excel',downloadPaymentsExcel)

export default router;
