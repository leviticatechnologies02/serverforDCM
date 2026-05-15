import mongoose from 'mongoose';

const googlePurchase = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    platform: {
      type: String,
      enum: ['android', 'ios'],
      default: 'android'
    },

    packageName: {
      type: String,
      required: true
    },

    productId: {
      type: String,
      required: true
    },

    purchaseToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    orderId: {
      type: String,
      default: null
    },

    purchaseState: {
      type: Number,
      enum: [0, 1, 2], // purchased, canceled, pending
      required: true
    },

    acknowledgementState: {
      type: Number,
      enum: [0, 1]
    },

    consumptionState: {
      type: Number,
      enum: [0, 1]
    },

    purchaseTimeMillis: {
      type: String
    },

    verified: {
      type: Boolean,
      default: false
    },

    rawResponse: {
      type: Object
    }
  },
  {
    timestamps: true
  }
);

const Purchase = mongoose.model('Purchase', googlePurchase);

export default Purchase;