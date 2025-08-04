// import mongoose from 'mongoose';

// const ClassScheduleSchema = new mongoose.Schema({
//   date: { type: Date, required: true },
//   startTime: { type: String, required: true },
//   zoomLink: { type: String, required: true },
//   recordingLink: { type: String, required: true }
// });

// const EnrolledCourseSchema = new mongoose.Schema({
//   courseId: { type: String, required: true },
//   title: { type: String, required: true },
//   instructor: { type: String, required: true },
//   enrolledDate: { type: Date, required: true },
//   classSchedule: { type: [ClassScheduleSchema], default: [] },
//   description: { type: String },
//   status: { type: String, enum: ['active', 'inactive'], default: 'active' },
//   assignBatch:{type:Boolean, default: false}, // 👈 NEW — batch assigned to that course
// });

//  const EnrollmentSchema = new mongoose.Schema({
//   user: {
//     id: { type: String, required: true },
//     name: { type: String, required:  true },
//     email: { type: String, required: true },
//     role: { type: String, enum: ['user', 'admin'], required: true },
//     password: { type: String, required: true }
//   },
//   enrolledCourses: { type: [EnrolledCourseSchema], default: [] }
// });

// export default  mongoose.model('Enrollment', EnrollmentSchema);
import mongoose from 'mongoose';
const { Schema } = mongoose;

const enrolledCourseSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
  assigned: { type: Boolean, default: false },
}, { _id: false });

const enrollmentSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledCourses: [enrolledCourseSchema],
  enrolledAt: { type: Date, default: Date.now }
});

export default mongoose.model('Enrollment', enrollmentSchema); 