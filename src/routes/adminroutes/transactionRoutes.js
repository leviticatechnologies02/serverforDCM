// routes/adminroutes/transactionRoutes.js
import express from 'express';
import { getAllTransactions, getTransactionStats } from '../../controllers/admincontrollers/transactionController.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyMiddleware.js';
const router = express.Router();

router.get('/', verifyToken, verifyAdmin, getAllTransactions);
router.get('/stats', verifyToken, verifyAdmin, getTransactionStats);

export default router;