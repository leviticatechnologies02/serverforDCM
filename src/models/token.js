
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

// Hash token before saving (so DB leak can't expose it)
TokenSchema.pre('save', function (next) {
  if (this.isModified('token')) {
    this.token = crypto.createHash('sha256').update(this.token).digest('hex');
  }
  next();
});

export default mongoose.models.Token || mongoose.model('Token', TokenSchema);