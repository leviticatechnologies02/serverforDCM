import Payment from "../../models/payments.js";
import mongoose from "mongoose";

export const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const payments = await Payment.find({ userId })
      .select(
        "amountInRupees status isEnrolled paymentMode appUsed orderId paymentId courseIds createdAt"
      )
      .populate({
        path: "courseIds",
        select: "name thumbnail price category",
      })
      .sort({ createdAt: -1 })
      .lean(); // performance boost

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });

  } catch (error) {
    console.error("Get My Payments Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};