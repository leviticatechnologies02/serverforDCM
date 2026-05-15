// models/course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        thumbnail: { type: String },
        category: { type: String, required: true },
        duration: { type: String },
        shortdescription: { type: String },
        price: { type: Number, required: true, min: 0, default: 0 },
        details: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CourseDetails',
            default: null
        },
        meta: { type: Object },
        googleProductId: { type: String, unique: true, sparse: true }
    },
    { timestamps: true }
);

export default mongoose.model('Course', courseSchema);



