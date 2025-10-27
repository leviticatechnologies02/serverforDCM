import express from 'express';
import { createOrder, verifyPayment, handleWebhook, getPayment } from '../../controllers/InternshipControllers/InternshipPaymentControllers.js'
const InternshipPaymentRouter = express.Router();


// Payment routes
InternshipPaymentRouter.post('/create-order', createOrder);
InternshipPaymentRouter.post('/verify-payment', verifyPayment);
InternshipPaymentRouter.post('/webhook', handleWebhook);
InternshipPaymentRouter.get('/:orderId', getPayment);

export default InternshipPaymentRouter;