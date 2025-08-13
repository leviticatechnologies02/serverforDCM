import Enrollment from '../models/Enrollment.js'
import jwt from 'jsonwebtoken'
import { hashPassword, comparePassword } from '../utils/hashPassword.js' 
import mongoose from 'mongoose';
import Admin from '../models/admin.js';
import User from '../models/user.js';
import { isEmailTaken } from '../utils/findExistingUser.js';
import { createAccountByRole } from '../utils/createAccountByRole.js';



export const signup = async (req, res) => {
  const { name, email, password, role} = req.body;

  try {
    // 🚫 Check for duplicates
    const emailTaken = await isEmailTaken(email, role);
    if (emailTaken) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 🔐 Hash password and generate user ID
    const hashedPassword = await hashPassword(password);
    const userId = new mongoose.Types.ObjectId();

    // 🛠 Create account in appropriate collection
    const account = await createAccountByRole({ userId, name, email, hashedPassword, role });

    // 🎫 Generate JWT
    const token = jwt.sign(
      { userId: userId.toString(), email,name, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ Respond
    return res.status(201).json({
      message: `${role} created successfully`,
      user: account,
      token,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Signup failed' });
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
      account = await Admin.findOne({  email })
      console.log(account)
      roleSource = 'admin';
      if (!account) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
    }

    const isValid = await comparePassword(password, account.password);
    console
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
