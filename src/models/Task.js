import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    course: { type: String, required: true },
    batch: { type: String, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who assigned
    dueDate: { type: Date }, // optional
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
