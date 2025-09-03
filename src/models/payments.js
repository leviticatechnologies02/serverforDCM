// models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, unique: true, sparse: true },
  signature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['created', 'paid', 'failed', 'signature_invalid'], 
    default: 'created' 
  },
  receipt: { type: String },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

  // Razorpay / custom fields
  meta: { type: Object },

  // New timestamp fields
  //createdAtUTC: { type: Date },            // raw UTC time from Razorpay
  createdAtIST: { type: String },          // formatted string "YYYY-MM-DD HH:mm:ss"
  updatedAtIST: { type: String }           // for updates like verify/webhook
}, { timestamps: true });  // keeps default createdAt + updatedAt (UTC)

export default mongoose.model('Payment', paymentSchema);
