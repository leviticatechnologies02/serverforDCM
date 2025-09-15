// models/Course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        thumbnail: { type: String },
        description: { type: String, trim: true },
        instructor: { type: String, trim: true },
        category: { type: String, require: true },
        duration: { type: String },
        price: { type: Number, required: true, min: 0, default: 0 },
        meta:{type:Object}
    },
    { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
