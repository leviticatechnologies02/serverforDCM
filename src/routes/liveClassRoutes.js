// routes/liveClassRoutes.js
import express from "express";
import LiveClass from "../models/LiveClass.js";

const router = express.Router();

// Validation middleware
const validateCreateRequest = (req, res, next) => {
  const { batchId, teacherName } = req.body;
  
  if (!batchId || !teacherName) {
    return res.status(400).json({ 
      error: "Missing required fields: batchId and teacherName are required" 
    });
  }
  
  next();
};

// ✅ Create a new meeting
router.post("/create", validateCreateRequest, async (req, res) => {
  try {
    const { batchId, teacherName } = req.body;

    // Check if there's already an active meeting for this batch
    const existingMeeting = await LiveClass.findOne({ batchId, isActive: true });
    if (existingMeeting) {
      return res.status(409).json({ 
        error: "An active meeting already exists for this batch",
        existingMeeting 
      });
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
      createdAt: new Date()
    });

    await newMeeting.save();

    res.status(201).json({
      message: "Meeting created successfully",
      meeting: {
        id: newMeeting._id,
        batchId: newMeeting.batchId,
        teacherName: newMeeting.teacherName,
        roomName: newMeeting.roomName,
        joinUrl: newMeeting.joinUrl,
        isActive: newMeeting.isActive
      }
    });
  } catch (err) {
    console.error("Error creating live class:", err);
    res.status(500).json({ 
      error: "Failed to create meeting",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ Get active meeting by batch
router.get("/active/:batchId", async (req, res) => {
  try {
    const { batchId } = req.params;

    const activeMeeting = await LiveClass.findOne({ batchId, isActive: true });
    if (!activeMeeting) {
      return res.status(404).json({ 
        error: "No active meeting for this batch",
        suggestion: "Create a new meeting first"
      });
    }

    res.json({
      id: activeMeeting._id,
      roomName: activeMeeting.roomName,
      joinUrl: activeMeeting.joinUrl,
      teacherName: activeMeeting.teacherName,
      createdAt: activeMeeting.createdAt
    });
  } catch (err) {
    console.error("Error fetching active class:", err);
    res.status(500).json({ 
      error: "Failed to fetch active class",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ End a meeting
router.patch("/end/:meetingId", async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    const meeting = await LiveClass.findByIdAndUpdate(
      meetingId,
      { isActive: false, endedAt: new Date() },
      { new: true }
    );
    
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    
    res.json({
      message: "Meeting ended successfully",
      meeting: {
        id: meeting._id,
        roomName: meeting.roomName,
        duration: meeting.endedAt - meeting.createdAt
      }
    });
  } catch (err) {
    console.error("Error ending meeting:", err);
    res.status(500).json({ 
      error: "Failed to end meeting",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;