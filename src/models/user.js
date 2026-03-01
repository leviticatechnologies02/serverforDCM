import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    mobile: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },

    password: {
      type: String,
      select: false, //  hide password by default
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["student", "admin", "instructor"],
      default: "student",
    },

    profileImage: {
      url: String,
      publicId: String,
    },
  },
  { timestamps: true }
);

/* INDEXES */

// Unique email index
userSchema.index({ email: 1 }, { unique: true });

// Unique mobile (only if exists)
userSchema.index(
  { mobile: 1 },
  {
    unique: true,
    partialFilterExpression: { mobile: { $type: "string" } },
  }
);

/* PASSWORD HASHING */

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/*  PASSWORD COMPARE */

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);