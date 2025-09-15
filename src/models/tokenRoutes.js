import express from "express";
import User from "../models/user.js";
import verifyToken from "../middlewares/authMiddleware.js";

const tokenRouter = express.Router();

// ✅ Save or update FCM token for logged-in user
tokenRouter.post("/save-token", verifyToken, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.fcmToken = token;
    await user.save();

    res.json({ success: true, message: "FCM token saved successfully" });
  } catch (error) {
    console.error("Error saving token:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Clear token on logout
tokenRouter.post("/clear-token", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.fcmToken = null;
    await user.save();

    res.json({ success: true, message: "FCM token cleared successfully" });
  } catch (error) {
    console.error("Error clearing token:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default tokenRouter;
