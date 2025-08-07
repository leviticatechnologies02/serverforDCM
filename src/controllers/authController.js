import Enrollment from '../models/Enrollment.js'
import jwt from 'jsonwebtoken'
import { hashPassword, comparePassword } from '../utils/hashPassword.js' 
import mongoose from 'mongoose';
import Admin from '../models/admin.js';
import User from '../models/user.js';


export const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // 🔍 Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = new mongoose.Types.ObjectId();

    // 🛠 Create new user in User model only
    const newUser = await new User({
      _id: userId,
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
    }).save();

    // 🎫 Generate token
    const token = jwt.sign(
      { userId: userId.toString(), email, role: role || 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email ,"this is login")

  try {
    // ✨ First try User collection (for students/instructors)
    let account = await User.findOne({ email }).select('+password');
    let roleSource = 'user';

    // 🔎 If not found, fallback to Admin collection
    if (!account) {
      account = await Admin.findOne({ 'user.email': email });
      roleSource = 'admin';
      if (!account) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      account = account.user; // Unwrap user object from admin doc
    }

    const isValid = await comparePassword(password, account.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: account.id || account._id.toString(),
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
      },
      source: roleSource,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
};
export const verifyAuthToken = async (req, res) => {
  const { user} = req.userAccount || {};

  res.status(200).json({
    verified: req.authStatus === 'verified',
    token: req.headers.authorization?.split(' ')[1],
    user:{
       id: user.id || user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
    }
  
  });
};
