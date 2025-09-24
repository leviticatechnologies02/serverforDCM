import User from '../../models/user.js';
import Course from '../../models/courses.js';
import mongoose from 'mongoose';
import { enrollInCourses } from '../studentcontrollers/coursesEnrollControllers.js';

// @desc    Create a new user (Admin only)
// @route   POST /api/admin/users
// @access  Private/Admin

export const createUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Only admins can create users
    if (req.userAccount?.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }

    const { username, email, password, role, enrolledCourses } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required fields."
      });
    }

    // Validate email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format."
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "User with this email already exists."
      });
    }

    // Validate role
    const validRoles = ["student", "admin", "instructor"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: student, admin, instructor"
      });
    }

    // Validate courses if provided
    let validCourses = [];
    if (enrolledCourses && enrolledCourses.length > 0) {
      validCourses = await Course.find({
        _id: { $in: enrolledCourses }
      }).session(session);

      if (validCourses.length !== enrolledCourses.length) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "One or more courses are invalid or inactive."
        });
      }
    }

    // Create user
    const newUser = new User({
      name: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "student",
      emailVerified: true
    });

    const savedUser = await newUser.save({ session });

   // In createUser function, replace the enrollment section with:
if (validCourses.length > 0) {
  // Enroll in all courses atomically
  for (const course of validCourses) {
    await enrollInCourses({ 
      userId: savedUser._id, 
      courseId: course._id, 
      session 
    });
  }
}

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      userId: savedUser._id
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating user:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists."
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get all users with pagination (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .populate('enrolledCourses', 'username code')
      .populate('batch', 'name year')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users.'
    });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const user = await User.findById(req.params.id)
      .populate('enrolledCourses', 'name code description instructor duration')
      .populate('batch', 'name year')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user.'
    });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { name, email, role, batch, enrolledCourses } = req.body;

    const user = await User.findById(req.params.id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      }).session(session);

      if (existingUser) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'Email already taken by another user.'
        });
      }
      user.email = email.toLowerCase().trim();
    }

    // Update fields
    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (batch) user.batch = batch;

    // Update enrolled courses if provided
    if (enrolledCourses) {
      const validCourses = await Course.find({
        _id: { $in: enrolledCourses },
        isActive: true
      }).session(session);

      user.enrolledCourses = validCourses.map(course => course._id);
    }

    const updatedUser = await user.save({ session });

    // Populate updated user data
    const populatedUser = await User.findById(updatedUser._id)
      .populate('enrolledCourses', 'name code description instructor duration')
      .populate('batch', 'name year')
      .select('-password')
      .session(session);

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'User updated successfully.',
      user: populatedUser
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating user:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already taken.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating user.'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully.'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user.'
    });
  }
};