import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  isVerified: { type: Boolean, required: true, default: false },
  verificationToken: String,
  verificationTokenExpiry: { type: Date }, // ✅ Correct type for expiry
  role: { type: String, enum: ['student', 'admin', 'instructor'], default: 'student' },
  profileImage: {
    url: String,
    publicId: String
  }
}, { timestamps: true }); // ✅ Adds createdAt & updatedAt automatically

export default mongoose.model('User', userSchema);