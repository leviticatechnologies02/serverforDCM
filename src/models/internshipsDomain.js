import mongoose from "mongoose";

const DurationSchema = new mongoose.Schema(
    {
        days: { type: Number, required: true, min: 1 },
        fee: { type: Number, required: true, min: 0 },
        label: {
            type: String,
            default: function () {
                return `${this.days} Days`;
            },
        },
    },
    { _id: false }
);

const SessionSchema = new mongoose.Schema(
    {
        id: { type: String },
        title: { type: String, required: true },
    },
    { _id: true }
);

const CurriculumWeekSchema = new mongoose.Schema(
    {
        id: { type: String },
        week: { type: Number },
        title: { type: String, required: true },
        sessions: { type: [SessionSchema], default: [] },
    },
    { _id: true }
);

const LiveClassSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        date: { type: Date },
        zoomLink: { type: String },
        passcode: { type: String },
        recordingLink: { type: String },
    },
    { _id: true }
);

const ModuleSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        videoUrl: { type: String },
        materials: [{ type: String }],
    },
    { _id: true }
);

const InternshipsDomainSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        focus: { type: String, required: true },
        level: {
            type: String,
            enum: ["Basic", "Intermediate", "Advanced", "Basic / Intermediate"],
            required: true,
        },
        durations: {
            type: [DurationSchema],
            required: true,
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: "At least one duration is required",
            },
        },

        // Curriculum Content (Weeks & Sessions)
        curriculum: { type: [CurriculumWeekSchema], default: [] },

        // Legacy Content Support
        modules: { type: [ModuleSchema], default: [] },
        liveClasses: { type: [LiveClassSchema], default: [] },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("InternshipsDomain", InternshipsDomainSchema);
