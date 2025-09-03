import mongoose from 'mongoose';

const courseAuditSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', // or 'Admin'
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  changes: {
    type: Map,
    of: new mongoose.Schema({
      from: { type: mongoose.Schema.Types.Mixed },
      to: { type: mongoose.Schema.Types.Mixed }
    }, { _id: false })
  },
  context: {
    type: String,
    default: 'manual update'
  }
});

export default mongoose.model('CourseAudit', courseAuditSchema);