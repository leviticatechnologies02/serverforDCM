// models/Notice.js
import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters']
  },
  noticeType: {
    type: String,
    required: [true, 'Notice type is required'],
    enum: [
      'New Course Available',
      'Event Announcement',
      'General Notification',
      'Important Update',
      'System Maintenance',
      'Holiday Notice',
      'Exam Schedule',
      'Fee Payment Reminder'
    ]
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  targetAudience: {
    type: String,
    required: [true, 'Target audience is required'],
    enum: [
      'All Students',
      'New Students',
      'Active Students',
      'Premium Students',
      'Course Specific',
      'Batch Specific'
    ],
    default: 'All Students'
  },
  image: {
    path: String,
    contentType: String,
    originalName: String
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDateTime: {
    type: Date
  },
  sendPushNotification: {
    type: Boolean,
    default: true
  },
  sendEmailNotification: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'scheduled', 'published', 'archived'],
    default: 'pending'
  },
  publishedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
noticeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better performance
noticeSchema.index({ title: 'text', description: 'text' });
noticeSchema.index({ noticeType: 1 });
noticeSchema.index({ priority: 1 });
noticeSchema.index({ targetAudience: 1 });
noticeSchema.index({ status: 1 });
noticeSchema.index({ scheduledDateTime: 1 });
noticeSchema.index({ publishedAt: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;