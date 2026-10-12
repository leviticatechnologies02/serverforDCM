import mongoose from "mongoose";

const submissionAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String },
    publicId: { type: String },
  },
  { _id: true }
);

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    answerText: { type: String, default: "" },
    selectedOption: { type: String, default: null },
    attachmentUrl: { type: String, default: null },
    marksAwarded: { type: Number, default: null },
    feedback: { type: String, default: "" },
  },
  { _id: true }
);

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submissionText: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: [submissionAttachmentSchema],
    answers: [answerSchema],
    submissionLink: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "resubmitted",
        "late_submitted",
        "graded",
        "resubmit_requested",
      ],
      default: "submitted",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      default: null,
      min: [0, "Marks awarded cannot be negative"],
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique compound index so each student has one active submission record per assignment
assignmentSubmissionSchema.index(
  { assignment: 1, student: 1 },
  { unique: true }
);
assignmentSubmissionSchema.index({ assignment: 1, status: 1 });

export default mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema
);
