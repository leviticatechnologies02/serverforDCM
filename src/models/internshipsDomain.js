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

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("InternshipsDomain", InternshipsDomainSchema);
