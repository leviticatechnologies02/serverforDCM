import Enrollment from '../models/Enrollment.js'
import jwt from 'jsonwebtoken'
import { hashPassword, comparePassword } from '../utils/hashPassword.js' 
import mongoose from 'mongoose';

export const signup = async (req, res) => {
    console.log('Received signup request:', req.body);
    console.log('Request headers:', req.headers);
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await Enrollment.findOne({ 'user.email': email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hashedPassword = await hashPassword(password);
    const newEnrollment = new Enrollment({
      user: {
        id: new mongoose.Types.ObjectId().toString(),
        name,
        email,
        role: role || 'user',
        password: hashedPassword
      },
      enrolledCourses: []
    });
    await newEnrollment.save();
    const token = jwt.sign(
      { userId: newEnrollment.user.id, email: newEnrollment.user.email, role: newEnrollment.user.role },
      process.env.JWT_SECRET
    );
    return res.status(201).json({
      message: 'User created successfully',
      user: { id: newEnrollment.user.id, name: newEnrollment.user.name, email: newEnrollment.user.email, role: newEnrollment.user.role },
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Signup failed' });
  }
};

export const login = async (req, res) => {
    console.log('Received login request:', req.body);
    console.log('Request headers:', req.headers);
  const { email, password } = req.body;
  try {
    const enrollment = await Enrollment.findOne({ 'user.email': email });
    if (!enrollment) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const isValid = await comparePassword(password, enrollment.user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { userId: enrollment.user.id, email: enrollment.user.email, role: enrollment.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: enrollment.user.id,
        name: enrollment.user.name,
        email: enrollment.user.email,
        role: enrollment.user.role,
      },
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
};