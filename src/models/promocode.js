import mongoose from "mongoose";

const promoSchema = new mongoose.Schema(
  {
    // 🔹 CORE
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    maxDiscount: {
      type: Number,
      default: null, // only useful for percentage
    },

    // 🔹 RULES
    minPurchase: {
      type: Number,
      default: 1000,
    },

    usageLimit: {
      type: Number,
      default: null, // unlimited if null
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 🔹 INFLUENCER
    influencerName: {
      type: String,
      required: true,
      trim: true,
    },

    influencerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    influencerPhone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Promo", promoSchema);