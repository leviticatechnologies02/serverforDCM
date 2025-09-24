
import mongoose from 'mongoose';
const { Schema } = mongoose;

const enrolledCourseSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
  paymentId:{type:Schema.Types.ObjectId,ref:'Payment',default:null},
  assigned: { type: Boolean, default: false },
  progress: { type: Number, default: 0 }, 
  completed: { type: Boolean, default: false },
  enrolledAt: { type: Date, default: Date.now }
}, { _id: false });

const enrollmentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true,unique:true },
  enrolledCourses: [enrolledCourseSchema],  
});

export default mongoose.model('Enrollment', enrollmentSchema); 