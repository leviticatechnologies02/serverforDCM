import mongoose from "mongoose";

const liveClassSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  roomName: {
    type: String,
    required: true,
    unique: true
  },
  joinUrl: {
    type: String,
    required: true
  },
  moderatorUrl: {
    type: String,
    required: true
  },
  moderatorPassword: {
    type: String,
    required: true
  },
  participantPassword: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("LiveClass", liveClassSchema);