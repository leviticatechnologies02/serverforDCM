import mongoose from 'mongoose';
import User from '../../../models/user.js';
import Course from '../../../models/courses.js';
import ApiError from '../../../utils/ApiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../utils/cloudinary.js';
import { StudentsService } from '../../students/index.js';
import logger from '../../../utils/logger.js';

export class UsersService {
  // 1. User Profile Management
  static async getProfile({ userId }) {
    const user = await User.findById(userId).select("name email role profileImage");
    if (!user) throw new ApiError(404, "User not found");

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage?.url || null,
    };
  }

  static async updateProfileInfo({ userId, name }) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (name) user.name = name;
    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.profileImage?.url || null,
    };
  }

  static async updateProfileImage({ userId, fileBuffer }) {
    if (!fileBuffer) throw new ApiError(400, "No image uploaded");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const result = await uploadToCloudinary(fileBuffer, `${user.role}_profiles`);

    if (user.profileImage?.publicId) {
      await deleteFromCloudinary(user.profileImage.publicId).catch((e) =>
        logger.warn("Failed to delete old image from Cloudinary: " + e.message)
      );
    }

    user.profileImage = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await user.save();
    return { profileImage: user.profileImage.url };
  }

  static async deleteProfileImage({ userId }) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (!user.profileImage?.publicId) {
      throw new ApiError(400, "No profile image to delete");
    }

    await deleteFromCloudinary(user.profileImage.publicId).catch((e) =>
      logger.warn("Failed to delete image from Cloudinary: " + e.message)
    );

    user.profileImage = undefined;
    await user.save();

    return { profileImage: null };
  }

  // 2. Admin User CRUD Management
  static async createUser({ username, email, password, role, enrolledCourses }) {
    if (!username || !email || !password) {
      throw new ApiError(400, "Name, email, and password are required fields.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingUser = await User.findOne({ email: email.toLowerCase() }).session(session);
      if (existingUser) {
        throw new ApiError(409, "User with this email already exists.");
      }

      const validRoles = ["student", "admin", "instructor"];
      if (role && !validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role. Must be one of: student, admin, instructor");
      }

      let validCourses = [];
      if (enrolledCourses && enrolledCourses.length > 0) {
        validCourses = await Course.find({ _id: { $in: enrolledCourses } }).session(session);
        if (validCourses.length !== enrolledCourses.length) {
          throw new ApiError(400, "One or more courses are invalid or inactive.");
        }
      }

      const newUser = new User({
        name: username.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: role || "student",
        emailVerified: true
      });

      const savedUser = await newUser.save({ session });

      if (validCourses.length > 0) {
        for (const course of validCourses) {
          await StudentsService.enrollInCourses({ 
            userId: savedUser._id, 
            courseId: course._id, 
            session 
          });
        }
      }

      await session.commitTransaction();
      return { userId: savedUser._id };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getUsers({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const users = await User.find()
      .populate('enrolledCourses', 'username code')
      .populate('batch', 'name year')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    return {
      users,
      pagination: {
        current: page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers
      }
    };
  }

  static async getUserById({ userId }) {
    const user = await User.findById(userId)
      .populate('enrolledCourses', 'name code description instructor duration')
      .populate('batch', 'name year')
      .select('-password');

    if (!user) throw new ApiError(404, "User not found.");

    return { user };
  }

  static async updateUser({ userId, name, email, role, batch, enrolledCourses }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new ApiError(404, "User not found.");

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: userId }
        }).session(session);

        if (existingUser) {
          throw new ApiError(409, "Email already taken by another user.");
        }
        user.email = email.toLowerCase().trim();
      }

      if (name) user.name = name.trim();
      if (role) user.role = role;
      if (batch) user.batch = batch;

      if (enrolledCourses) {
        const validCourses = await Course.find({
          _id: { $in: enrolledCourses },
          isActive: true
        }).session(session);

        user.enrolledCourses = validCourses.map(course => course._id);
      }

      const updatedUser = await user.save({ session });

      const populatedUser = await User.findById(updatedUser._id)
        .populate('enrolledCourses', 'name code description instructor duration')
        .populate('batch', 'name year')
        .select('-password')
        .session(session);

      await session.commitTransaction();
      return { user: populatedUser };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async deleteUser({ userId, requestUserId }) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    if (user._id.toString() === requestUserId.toString()) {
      throw new ApiError(400, "You cannot delete your own account.");
    }

    await User.findByIdAndDelete(userId);
    return { message: "User deleted successfully." };
  }
}

export default UsersService;
