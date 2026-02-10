import mongoose from 'mongoose';

const courseDetailsSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    objectives: [
      {
        type: String,
        trim: true
      }
    ],
    requirements: [
      {
        type: String,
        trim: true
      }
    ],
    curriculum: [
      {
        week: Number,
        title: String,
        sessions: [
          {
            title: String
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('CourseDetails', courseDetailsSchema);
