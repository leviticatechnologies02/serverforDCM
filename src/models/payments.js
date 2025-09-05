// models/Payment.js
import mongoose from 'mongoose';


const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, unique: true, sparse: true },
  amountInRupees:{type:Number,required:true},
  signature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed', 'signature_invalid'], require:true },
  receipt: { type: String },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  meta: { type: Object }
  
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
