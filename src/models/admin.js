import mongoose from "mongoose";
import bcrypt from "bcrypt";

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String,unique: true,required: true,lowercase: true,
          trim: true,match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] },
  password: { type: String, minlength: 8 },
  role: {
    type: String,
    enum: ['student', 'admin', 'instructor'],
    default: 'admin'
  },
  profileImage: {
    url: String,
    publicId: String
  }
},{ timestamps: true });

// ✅ Hash password before saving
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password method
AdminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("Admin", AdminSchema);