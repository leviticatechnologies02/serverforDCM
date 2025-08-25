import mongoose from "mongoose";
// const BatchSchema = new mongoose.Schema({
//   batchID: { type: String, required: true },
//   batchName: { type: String, required: true },
// });

// Update your Admin model (models/admin.js)
const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: String,
  role: { type: String, enum: ['student', 'admin', 'instructor'], default: 'admin' },
  profileImage: {
    url: String,
    publicId: String
  }
});
export default  mongoose.model('Admin', AdminSchema);