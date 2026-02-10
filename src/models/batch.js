import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  batchName: { type: String, required: true, unique: true, trim: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  startDate: Date,
  endDate: Date,
  status: {
  type: String,
  enum: ["active", "completed", "cancelled", "inactive"],
  default: "active",
},
completedAt:{type:Date, default:null}


}, { timestamps: true });

batchSchema.index({ status: 1, courseId: 1 });


export default mongoose.model('Batch', batchSchema);