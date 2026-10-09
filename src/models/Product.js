import mongoose from 'mongoose';

const formFieldSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  label: { type: String, required: true },
  placeholder: { type: String },
  required: { type: Boolean, default: false },
  half: { type: Boolean, default: false },
  options: [{ type: String }]
}, { _id: false });

const enquirySchema = new mongoose.Schema({
  heading: { type: String, required: true },
  tagline: { type: String, required: true },
  about: { type: String, required: true },
  highlights: [{ type: String }],
  formTitle: { type: String, required: true },
  formSubtitle: { type: String, required: true },
  formSchema: [formFieldSchema]
}, { _id: false });

const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  productId: { type: Number, required: true, unique: true }, // renamed from 'id'
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  fullDescription: { type: String, required: true },
  image: { type: String, required: true },
  logo: { type: String },
  deployment: { type: String },
  link: { type: String },
  features: [{ type: String }],
  benefits: [{ type: String }],
  enquiry: enquirySchema
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
