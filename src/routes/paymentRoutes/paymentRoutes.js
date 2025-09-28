import express from "express";
import { createOrder, verifyPayment, webhook } from "../../controllers/paymentControllers/paymentController.js";
import verifyToken from "../../middlewares/authMiddleware.js";
const paymentRouter=express.Router();
paymentRouter.get('/config', verifyToken ,(req,res)=>{
      console.log("whyee")
      res.json({ keyId: process.env.RAZORPAY_KEY_ID });
})
paymentRouter.post('/order', verifyToken,createOrder)
paymentRouter.post('/verify', verifyToken,verifyPayment)
// paymentRouter.post('/webhook', express.raw({ type: 'application/json' }),webhook)
export default paymentRouter