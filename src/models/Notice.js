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
    required: true,
    enum: [
      'New Course Available',
      'Event Announcement', 
      'General Notification',
      'Important Update',
      'System Maintenance',
      'Holiday Notice',
      'Exam Schedule',
      'Fee Payment Reminder',
      'General', // Keep for backward compatibility
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
    required: true,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  targetAudience: {
    type: String,
    required: true,
    enum: [
      'All Students',
      'New Students', 
      'Active Students',
      'Premium Students',
      'Course Specific',
      'Batch Specific',
      'All', // Keep for backward compatibility
      'Students', 
      'Faculty', 
      'Staff', 
      'Department', 
      'Course',
      'Batch'
    ],
    default: 'All Students'
  },
  batchName: {
    type: String,
    required: function() {
      return this.targetAudience === 'Batch Specific';
    }
  },
  course: {
    type: String,
    required: function() {
      return this.targetAudience === 'Course Specific';
    }
  },
  department: {
    type: String,
    required: function() {
      return this.targetAudience === 'Department';
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
    required: function() {
      return this.isScheduled;
    },
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Scheduled date must be in the future'
    }
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return value > new Date();
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
    enum: ['draft', 'pending', 'published', 'scheduled', 'archived'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
noticeSchema.index({ status: 1, scheduledDateTime: 1 });
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ tags: 1 });
noticeSchema.index({ targetAudience: 1 });

// Virtual for checking if notice is active
noticeSchema.virtual('isActive').get(function() {
  if (this.status !== 'published') return false;
  if (this.expiryDate && this.expiryDate < new Date()) return false;
  return true;
});

// Method to check if notice should be visible
noticeSchema.methods.isVisible = function() {
  if (this.status === 'published') {
    return !(this.expiryDate && this.expiryDate < new Date());
  }
  
  if (this.status === 'scheduled') {
    return this.scheduledDateTime && this.scheduledDateTime <= new Date() && 
           (!this.expiryDate || this.expiryDate >= new Date());
  }
  
  return false;
};

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;