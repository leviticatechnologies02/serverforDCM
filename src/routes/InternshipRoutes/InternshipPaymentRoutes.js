import express from 'express';
import { createOrder, verifyPayment, handleWebhook, getPayment, } from '../../controllers/InternshipControllers/InternshipPaymentControllers.js'
import { getAllInternshipsDomains } from '../../controllers/admincontrollers/internshipsDomainControllers.js';

const router = express.Router();


// Payment routes
router.post('/payments/create-order', createOrder);
router.post('/payments/verify-payment', verifyPayment);
// router.post('/payments/webhook', handleWebhook);
router.get('/payments/:orderId', getPayment);
router.get('/',getAllInternshipsDomains);

export default router;