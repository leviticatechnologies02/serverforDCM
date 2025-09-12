import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, unique: true, sparse: true },
  signature: { type: String }, // used for frontend verification
  receipt: { type: String },

  amountInRupees: { type: Number, required: true }, // for display
  amount: { type: Number, required: true },         // raw amount from Razorpay
  currency: { type: String, default: 'INR' },

  status: { type: String, enum: ['created', 'paid', 'failed', 'signature_invalid'], required: true  },

  paymentMode: { type: String,    enum: ['upi', 'card', 'wallet', 'netbanking', 'unknown'], default: 'unknown'},

  appUsed: { type: String }, // inferred from vpa, wallet, or card network

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true},

  courseIds: [{type: mongoose.Schema.Types.ObjectId,ref: 'Course'}  ],

  meta: { type: Object }, // full webhook payload for audit/debug
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);