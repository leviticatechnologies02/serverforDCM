// routes/adminroutes/transactionRoutes.js
import express from 'express';
import { getAllInternshipPayments, getAllTransactions, getCombinedPaymentStats, getTransactionStats } from '../../controllers/admincontrollers/transactionController.js';

const router = express.Router();

router.get('/',  getAllTransactions);
router.get('/stats',  getTransactionStats);
router.get('/internship-payments',  getAllInternshipPayments);
router.get('/combined-stats',  getCombinedPaymentStats);

export default router;