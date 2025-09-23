import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  batchName: { type: String, required: true, unique: true, trim: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Batch', batchSchema);