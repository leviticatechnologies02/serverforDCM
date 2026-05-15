import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  expertise: [{ type: String }],
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  isActive: { type: Boolean, default: true },
  profileImage: {
    url: String,
    publicId: String
  }
}, { timestamps: true });

export default mongoose.model("Mentor", mentorSchema);