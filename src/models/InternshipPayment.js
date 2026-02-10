import mongoose from "mongoose";

const InternshipPaymentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true, // ✅ keep index here
    },
    program: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      index: true, // ✅ frequent lookup
    },
    collegeName: {
      type: String,
      required: true,
      trim: true,
    },
    collegeCode: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔐 Razorpay fields
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true, // ✅ creates index automatically
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "attempted", "paid", "failed"],
      default: "created",
      index: true, // ✅ status queries
    },
    receipt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "InternshipPayment",
  InternshipPaymentSchema
);
