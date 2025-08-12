import mongoose from "mongoose";
const BatchSchema = new mongoose.Schema({
  batchID: { type: String, required: true },
  batchName: { type: String, required: true },
});

const AdminSchema = new mongoose.Schema({
  user: {
    id: String,
    name: String,
    email: { type: String, unique: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
    password: String,
  },
  
});
export default  mongoose.model('Admin', AdminSchema);