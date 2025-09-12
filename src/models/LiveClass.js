import mongoose from 'mongoose';

const LiveClassSchema = new mongoose.Schema({
  title: { type: String, required: true },
  courseId: { type: String, required: true },
  batchId: { type: String, required: true },
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  zoomMeetingId: { type: String, required: true },
  zoomJoinUrl: { type: String, required: true },
  zoomStartUrl: { type: String, required: true },
  hostEmail: { type: String, required: true },
  recordingUrl: { type: String },
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed'], default: 'scheduled' }
}, { timestamps: true });

export default mongoose.model('LiveClass', LiveClassSchema);