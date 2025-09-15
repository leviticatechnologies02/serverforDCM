// models/Notice.js
import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 5000
  },
  noticeType: {
    type: String,
    enum: [
      'New Course Available',
      'Event Announcement',
      'General Notification',
      'Important Update',
      'System Maintenance',
      'Holiday Notice',
      'Exam Schedule',
      'Fee Payment Reminder',
      'General',
      'Academic',
      'Event',
      'Exam',
      'Urgent',
      'Course',
      'Other'
    ],
    default: 'General Notification'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },

  // 🔑 Who should receive the notice
  targetAudience: {
    type: String,
    enum: ['All Students', 'Batch Specific', 'Admins'],
    required: true,
    default: 'All Students'
  },

  // If Batch Specific → this is required
  batchName: {
    type: String,
    required: function () {
      return this.targetAudience === 'Batch Specific';
    }
  },

  tags: [{
    type: String,
    trim: true
  }],

  attachment: {
    path: String,
    contentType: String,
    originalName: String,
    size: Number
  },

  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledDateTime: {
    type: Date,
    validate: {
      validator: function (value) {
        return !this.isScheduled || (value && value > new Date());
      },
      message: 'Scheduled date must be in the future'
    }
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !value || value > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },

  sendPushNotification: {
    type: Boolean,
    default: false
  },
  sendEmailNotification: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date
  }
}, { timestamps: true });

// Indexes
noticeSchema.index({ status: 1, scheduledDateTime: 1 });
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ targetAudience: 1 });
noticeSchema.index({ batchName: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
