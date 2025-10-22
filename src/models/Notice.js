import mongoose from 'mongoose';
 
const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  noticeType: {
    type: String,
    enum: [
      'General Notification',
      'Important Update',
      'Event Announcement',
      'Exam Schedule',
      'Holiday Notice'
    ],
    default: 'General Notification'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  targetAudience: {
    type: String,
    enum: ['All Students', 'Batch Specific'],
    default: 'All Students'
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, {
  timestamps: true
});
 
const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;