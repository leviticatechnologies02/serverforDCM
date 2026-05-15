import mongoose from 'mongoose';
const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, unique: true, sparse: true },
  signature: { type: String },
  receipt: { type: String },

  amountInRupees: { type: Number, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'signature_invalid'],
    required: true
  },

  isEnrolled: {
    type: Boolean,
    default: false
  },

  paymentMode: {
    type: String,
    enum: ['upi', 'card', 'wallet', 'netbanking', 'google_play', 'unknown'],
    default: 'unknown'
  },

  paymentProvider: {
    type: String,
    enum: ['razorpay', 'google_play'],
    default: 'razorpay'
  },

  googlePurchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },

  appUsed: { type: String },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],

  meta: { type: Object },

}, { timestamps: true });

paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.model('Payment', paymentSchema);