import mongoose from 'mongoose';

const googlePlayPurchaseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }],
    purchaseToken: { type: String, required: true},
    orderId: { type: String },
    purchaseTime: { type: Date },
    rawResponse: { type: Object },
    status: { type: String, enum: ['verified', 'failed', 'acknowledged'], default: 'failed' }
  },
  { timestamps: true }
);

// Index to prevent duplicate tokens
googlePlayPurchaseSchema.index({ purchaseToken: 1 }, { unique: true });

export default mongoose.model('GooglePlayPurchase', googlePlayPurchaseSchema);
