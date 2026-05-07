import express from 'express';
import { verifyToken, verifyAdmin, verifySuperAdmin } from '../../../middlewares/auth.middleware.js';
import {
  createOrder,
  verifyPayment,
  verifyGooglePlayPurchase,
  getMyPayments,
  getAllTransactions,
  getTransactionStats,
  getAllInternshipPayments,
  getCombinedPaymentStats,
  downloadPaymentsExcel
} from '../controller/payments.controller.js';

const paymentsRouter = express.Router();

// 1. Config dispatcher
paymentsRouter.get('/config', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// 2. Student checkout & transaction records (legacy matching paths)
paymentsRouter.post('/order', verifyToken, createOrder);
paymentsRouter.post('/verify', verifyToken, verifyPayment);
paymentsRouter.post('/google-play/verify', verifyToken, verifyGooglePlayPurchase);
paymentsRouter.get('/my', verifyToken, getMyPayments);

// 3. Administrative transaction logs (require verifyToken & verifySuperAdmin)
paymentsRouter.get('/transactions', verifyToken, verifySuperAdmin, getAllTransactions);
paymentsRouter.get('/transactions/stats', verifyToken, verifySuperAdmin, getTransactionStats);
paymentsRouter.get('/transactions/internship-payments', verifyToken, verifySuperAdmin, getAllInternshipPayments);
paymentsRouter.get('/transactions/combined-stats', verifyToken, verifySuperAdmin, getCombinedPaymentStats);
paymentsRouter.get('/transactions/download', verifyToken, verifySuperAdmin, downloadPaymentsExcel);

export default paymentsRouter;
