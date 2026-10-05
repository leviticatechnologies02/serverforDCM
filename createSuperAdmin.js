import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Assuming this script is run from the root directory
dotenv.config();

// Define user schema directly to avoid import issues with local paths in ES modules
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  password: { type: String },
  role: { type: String, default: 'student' },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

const createSuperAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'superadmin@levitica.com';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('User already exists:', existingAdmin.email);
    } else {
      const newAdmin = new User({
        name: 'Super Admin',
        email: email,
        password: 'Admin@123',
        role: 'superadmin',
      });
      await newAdmin.save();
      console.log('Super Admin created successfully:', newAdmin.email);
    }
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

createSuperAdmin();
