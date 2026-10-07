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
        materials: [{ type: String }], // URLs to PDFs, zips, etc.
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

        // Internship Content
        modules: { type: [ModuleSchema], default: [] },
        liveClasses: { type: [LiveClassSchema], default: [] },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("InternshipsDomain", InternshipsDomainSchema);
