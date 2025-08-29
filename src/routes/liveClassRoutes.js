// routes/liveClassRoutes.js
import express from "express";
import LiveClass from "../models/LiveClass.js";

const router = express.Router();

// ✅ Create a new meeting
router.post("/create", async (req, res) => {
  try {
    const { batchId, teacherName } = req.body;

    if (!batchId || !teacherName) {
      return res.status(400).json({ error: "Missing batchId or teacherName" });
    }

    // Generate unique Jitsi room name
    const roomName = `${batchId}_${Date.now()}`;
    const joinUrl = `https://meet.jit.si/${roomName}`;

    const newMeeting = new LiveClass({
      batchId,
      teacherName,
      roomName,
      joinUrl,
      isActive: true,
    });

    await newMeeting.save();

    res.status(201).json({
      message: "Meeting created successfully",
      roomName,
      joinUrl,
    });
  } catch (err) {
    console.error("Error creating live class:", err);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

// ✅ Get active meeting by batch
router.get("/active/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    const activeMeeting = await LiveClass.findOne({ batchId, isActive: true });
    if (!activeMeeting) {
      return res.status(404).json({ error: "No active meeting for this batch" });
    }

    res.json({
      roomName: activeMeeting.roomName,
      joinUrl: activeMeeting.joinUrl,
      teacherName: activeMeeting.teacherName,
    });
  } catch (err) {
    console.error("Error fetching active class:", err);
    res.status(500).json({ error: "Failed to fetch active class" });
  }
});

export default router;
