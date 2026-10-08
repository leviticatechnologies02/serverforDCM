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
      index: true,
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
    
    domainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InternshipsDomain',
      sparse: true,
    },

    assigned: {
      type: Boolean,
      default: false,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      sparse: true,
    },

    rollNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
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

    // ================= Razorpay Fields =================

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
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
      index: true,
    },

    receipt: {
      type: String,
      required: true,
    },

    // ================= Payment Info (Webhook) =================

    paymentMode: {
      type: String,
      enum: ["upi", "card", "wallet", "netbanking", "unknown"],
      default: "unknown",
    },

    appUsed: {
      type: String,
      default: null,
    },

    meta: {
      type: Object, // full webhook payload
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Optional helpful indexes
InternshipPaymentSchema.index({ email: 1, status: 1 });


export default mongoose.model("InternshipPayment", InternshipPaymentSchema);