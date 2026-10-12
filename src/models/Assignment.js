import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String },
    publicId: { type: String },
  },
  { _id: true }
);

const referenceLinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["descriptive", "mcq", "file_upload", "link", "code"],
      default: "descriptive",
    },
    marks: { type: Number, default: 10, min: 0 },
    options: [{ type: String }],
    correctAnswer: { type: String, default: null },
    instructions: { type: String, default: "" },
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Assignment description/instructions are required"],
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["course", "internship", "all"],
      default: "course",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    batchName: {
      type: String,
      trim: true,
      default: null,
    },
    internshipDomain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipsDomain",
      default: null,
    },
    attachments: [attachmentSchema],
    referenceLinks: [referenceLinkSchema],
    questions: [questionSchema],
    totalMarks: {
      type: Number,
      default: 100,
      min: [0, "Total marks cannot be negative"],
    },
    passingMarks: {
      type: Number,
      default: 40,
      min: [0, "Passing marks cannot be negative"],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    allowLateSubmission: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "published",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast lookup
assignmentSchema.index({ status: 1, course: 1, batch: 1 });
assignmentSchema.index({ status: 1, internshipDomain: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ createdAt: -1 });

export default mongoose.model("Assignment", assignmentSchema);
