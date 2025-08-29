// models/LiveClass.js

import mongoose from "mongoose";


const LiveClassSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  teacherName: { type: String, required: true },
  roomName: { type: String, required: true },
  joinUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model("LiveClass", LiveClassSchema);
