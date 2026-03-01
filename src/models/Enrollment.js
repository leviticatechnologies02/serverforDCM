import mongoose from "mongoose";
const { Schema } = mongoose;

const enrolledCourseSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    assigned: {
      type: Boolean,
      default: false,
    },

    progress: {
      type: Number,
      default: 0,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const enrollmentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // already indexed automatically
  },

  enrolledCourses: [enrolledCourseSchema],
});

/* ================= INDEXES ================= */

//  Index for fast course-based queries
enrollmentSchema.index({ "enrolledCourses.course": 1 });

//  Index for fast batch-based queries
enrollmentSchema.index({ "enrolledCourses.batch": 1 });

//  Compound index (optional but powerful)
enrollmentSchema.index({
  user: 1,
  "enrolledCourses.course": 1,
});

enrollmentSchema.index(
  { user: 1, course: 1 },
  { unique: true }
);
export default mongoose.model("Enrollment", enrollmentSchema);