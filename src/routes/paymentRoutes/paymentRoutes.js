import express from "express";
import { createOrder, verifyPayment, webhook } from "../../controllers/paymentControllers/paymentController.js";
const paymentRouter=express.Router();
paymentRouter.get('/config',(req,res)=>{
      console.log("whyee")
      res.json({ keyId: process.env.RAZORPAY_KEY_ID });
})
paymentRouter.post('/order',createOrder)
paymentRouter.post('/verify',verifyPayment)
// paymentRouter.post('/webhook', express.raw({ type: 'application/json' }),webhook)
export default paymentRouter