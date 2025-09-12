import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

},{timestamps:true});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [cartItemSchema]
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);