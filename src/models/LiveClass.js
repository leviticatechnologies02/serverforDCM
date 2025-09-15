import mongoose from 'mongoose';
const { Schema } = mongoose;

const LiveClassSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch', required:true},
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