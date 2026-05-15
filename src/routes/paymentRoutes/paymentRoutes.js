import express from "express";
import { createOrder, verifyPayment, webhook } from "../../controllers/paymentControllers/razorpayPaymentController.js";
import { getMyPayments } from "../../controllers/studentcontrollers/paymentHistory.js";
import {  verifyGooglePurchaseController } from "../../controllers/paymentControllers/googlePlayPaymentController.js";

const paymentRouter=express.Router();
paymentRouter.get('/config', (req,res)=>{
      console.log("whyee")
      res.json({ keyId: process.env.RAZORPAY_KEY_ID });
})
paymentRouter.post('/order', createOrder)
paymentRouter.post('/verify', verifyPayment)
paymentRouter.get('/my',getMyPayments)
paymentRouter.post('/google-play-verify',verifyGooglePurchaseController)
// paymentRouter.post('/webhook', webhook)
export default paymentRouter