// routes/adminroutes/transactionRoutes.js
import express from 'express';
import { getAllTransactions, getTransactionStats } from '../../controllers/admincontrollers/transactionController.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';
const router = express.Router();

router.get('/transactions', verifyToken, verifyAdmin, getAllTransactions);
router.get('/transactions/stats', verifyToken, verifyAdmin, getTransactionStats);

export default router;