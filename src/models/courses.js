// models/Course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        instructor: { type: String, trim: true },
        duration: { type: String },
        price: { type:Number, required: true, min: 0, default: 0 } 
    },
    { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
    