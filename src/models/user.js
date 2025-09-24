import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
    mobile: {
    type: String,
  default:null,
    unique: true,
    trim: true,
    match: [/^\d{10}$/, 'Mobile number must be 10 digits']
  },


  password: String,
  emailVerified: { type: Boolean, required: true, default: false },

  role: { 
    type: String, 
    enum: ['student', 'admin', 'instructor'], 
    default: 'student' 
  },

  profileImage: {
    url: String,
    publicId: String
  }

}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
