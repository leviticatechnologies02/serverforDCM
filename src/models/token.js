
import mongoose from 'mongoose';
import crypto from 'crypto';

const TokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    token: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['emailVerification', 'passwordReset'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL auto-delete
    },
    // Allow any extra metadata without redefining schema
  },
  { strict: false, timestamps: true }
);



export default mongoose.models.Token || mongoose.model('Token', TokenSchema);