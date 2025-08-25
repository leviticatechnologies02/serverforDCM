// src/controllers/authController.js
import Enrollment from '../models/Enrollment.js';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import mongoose from 'mongoose';
import Admin from '../models/admin.js';
import User from '../models/user.js';
import { isEmailTaken } from '../utils/findExistingUser.js';
import { createAccountByRole } from '../utils/createAccountByRole.js';
import { uploadToCloudinary } from '../utils/cloudinaryUtils.js';

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;

  try {
    // 🚫 Check for duplicates
    const emailTaken = await isEmailTaken(email, role);
    if (emailTaken) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 🔐 Hash password and generate user ID
    const hashedPassword = await hashPassword(password);
    const userId = new mongoose.Types.ObjectId();

    // 📷 Optional profile image upload
    let profileImageData = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, `${role}_profiles`);
        profileImageData = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } catch (uploadError) {
        console.error('❌ Image upload failed:', uploadError.message);
        // Continue without image, don't block signup
        profileImageData = null;
      }
    }

    // 🛠 Create account in appropriate collection
    const account = await createAccountByRole({
      userId,
      name,
      email,
      hashedPassword,
      role,
      profileImage: profileImageData,
    });

    // 🎫 Generate JWT
    const token = jwt.sign(
      { userId: userId.toString(), email, name, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      message: `${role} created successfully`,
      user: account,
      token,
    });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    return res.status(500).json({ error: 'Signup failed' });
  }
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let account = await User.findOne({ email }).select('+password');
    let roleSource = 'user';

    if (!account) {
      account = await Admin.findOne({ email }).select('+password');
      roleSource = 'admin';
      if (!account) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    const isValid = await comparePassword(password, account.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: account._id.toString(),
        email: account.email,
        role: account.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: account.id || account._id.toString(),
        name: account.name,
        email: account.email,
        role: account.role,
        profileImage: account.profileImage?.url || null, // ✅ optional
      },
      source: roleSource,
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
};

// ---------------- VERIFY TOKEN ----------------
export const verifyAuthToken = async (req, res) => {
  const { user } = req.userAccount || {};

  res.status(200).json({
    verified: req.authStatus === 'verified',
    token: req.headers.authorization?.split(' ')[1],
    user: {
      id: user?._id?.toString() || user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      profileImage: user?.profileImage?.url || null, // ✅ safe optional chaining
    },
  });
};
