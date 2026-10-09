import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String },
  message: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['New', 'In Progress', 'Resolved'], default: 'New' },
}, { timestamps: true });

export default mongoose.model('Enquiry', enquirySchema);
