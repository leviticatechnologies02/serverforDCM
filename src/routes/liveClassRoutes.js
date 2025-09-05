import express from "express";
import LiveClass from "../models/LiveClass.js";
import crypto from "crypto";

const router = express.Router();

// ✅ Create a new meeting with moderator support
router.post("/create", async (req, res) => {
  try {
    const { batchId, createdBy } = req.body;

    if (!batchId || !createdBy) {
      return res.status(400).json({ error: "Missing batchId or createdBy" });
    }

    // Generate unique Jitsi room name
    const roomName = `${batchId}_${Date.now()}`;
    
    // Generate secure passwords
    const moderatorPassword = crypto.randomBytes(4).toString('hex');
    const participantPassword = crypto.randomBytes(4).toString('hex');
    
    // Create URLs with password parameters
    const joinUrl = `https://meet.jit.si/${roomName}#config.startWithAudioMuted=true&config.startWithVideoMuted=false`;
    const moderatorUrl = `https://meet.jit.si/${roomName}#config.startWithAudioMuted=true&config.startWithVideoMuted=false&config.prejoinPageEnabled=false`;

    const newMeeting = new LiveClass({
      batchId,
      createdBy,
      roomName,
      joinUrl,
      moderatorUrl,
      moderatorPassword,
      participantPassword,
      isActive: true,
    });

    await newMeeting.save();

    res.status(201).json({
      message: "Meeting created successfully",
      roomName,
      joinUrl,
      moderatorUrl,
      moderatorPassword,
      participantPassword
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
    const { userId } = req.query;

    const activeMeeting = await LiveClass.findOne({ batchId, isActive: true });
    if (!activeMeeting) {
      return res.status(404).json({ error: "No active meeting for this batch" });
    }

    // Check if user is the meeting creator
    const isModerator = userId && activeMeeting.createdBy === userId;

    // Return appropriate URL based on whether user is moderator
    const joinUrl = isModerator ? 
      `${activeMeeting.moderatorUrl}&password=${activeMeeting.moderatorPassword}` : 
      `${activeMeeting.joinUrl}&password=${activeMeeting.participantPassword}`;

    res.json({
      roomName: activeMeeting.roomName,
      joinUrl,
      isModerator,
      moderatorPassword: isModerator ? activeMeeting.moderatorPassword : undefined
    });
  } catch (err) {
    console.error("Error fetching active class:", err);
    res.status(500).json({ error: "Failed to fetch active class" });
  }
});

// ✅ End meeting
router.post("/end/:roomName", async (req, res) => {
  try {
    const { roomName } = req.params;
    
    const meeting = await LiveClass.findOne({ roomName });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    
    meeting.isActive = false;
    await meeting.save();
    
    res.json({ message: "Meeting ended successfully" });
  } catch (err) {
    console.error("Error ending meeting:", err);
    res.status(500).json({ error: "Failed to end meeting" });
  }
});

export default router;