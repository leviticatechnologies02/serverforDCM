import mongoose from "mongoose";


// Update your User model (models/user.js)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['student', 'admin', 'instructor'], default: 'student' },
  profileImage: {
    url: String,
    publicId: String
  }
});
export default mongoose.model('user',userSchema)