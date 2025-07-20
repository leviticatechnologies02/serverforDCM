import mongoose from 'mongoose';

const ClassScheduleSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  zoomLink: { type: String, required: true },
  recordingLink: { type: String, required: true }
});

const EnrolledCourseSchema = new mongoose.Schema({
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  enrolledDate: { type: Date, required: true },
  classSchedule: { type: [ClassScheduleSchema], default: [] },
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

const EnrollmentSchema = new mongoose.Schema({
  user: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], required: true },
    password: { type: String, required: true }
  },
  enrolledCourses: { type: [EnrolledCourseSchema], default: [] }
});

export default  mongoose.model('Enrollment', EnrollmentSchema);