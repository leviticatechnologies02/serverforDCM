// controllers/studentEnrollmentController.js
import Course from '../../models/courses.js';
import Batch from '../../models/batch.js';
import Payment from '../../models/payments.js';
import Enrollment from '../../models/Enrollment.js';
import User from '../../models/user.js';
import mongoose from 'mongoose';




export const enrollInCourses = async ({ paymentId, userId, courseId, session }) => {
  try {
    // Use findOneAndUpdate with upsert to atomically handle enrollment
    const result = await Enrollment.findOneAndUpdate(
      { 
        user: userId,
        "enrolledCourses.course": { $ne: courseId } // Only if not already enrolled
      },
      {
        $addToSet: {
          enrolledCourses: {
            course: courseId,
            paymentId,
            assigned: false,
            batch: null,
            enrolledAt: new Date()
          }
        }
      },
      { 
        session,
        new: true,
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true 
      }
    );

    // If the course was already enrolled, handle accordingly
    if (!result) {
      // This means the user was found but already enrolled in the course
      const existingEnrollment = await Enrollment.findOne({ 
        user: userId,
        "enrolledCourses.course": courseId 
      }).session(session);
      
      if (existingEnrollment) {
        return existingEnrollment; // Already enrolled, return existing
      }
    }

    return result;
  } catch (error) {
    // Handle duplicate key error (shouldn't happen with proper session handling)
    if (error.code === 11000) {
      // If we get a duplicate key error, fetch the existing enrollment
      const existingEnrollment = await Enrollment.findOne({ user: userId }).session(session);
      return existingEnrollment;
    }
    throw error;
  }
};
// Get enrollments by specific user ID with detailed population
export const getStudentEnrollmentsById = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  
  try {
    const enrollment = await Enrollment.findOne({ user: id })
      .populate({
        path: 'enrolledCourses.course',
        select: 'name description price duration instructor category thumbnail', // Add more course fields as needed
        model: Course
      })
      .populate({
        path: 'enrolledCourses.batch',
        select: 'batchName startDate endDate timing days capacity currentStrength', // Add more batch fields as needed
        model: Batch
      })
      .populate({
        path: 'enrolledCourses.paymentId',
        select: 'orderId paymentId amountINRupees currency status createdAt', // Add more payment fields as needed
        model: Payment
      });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'No enrollments found for this user'
      });
    }

    res.status(200).json({
      success: true,
     enrollment
    });
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enrollments'
    });
  }
};
export const getStudentEnrolledCourses = async (req, res) => {
  try {
    const { id} = req.params;
    
    // Validate userId
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Check if user exists
    const userExists = await User.findById(id);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Find enrollment and populate course details
    const enrollment = await Enrollment.findOne({ user: id })
      .populate({
        path: 'enrolledCourses.course',
        select: 'name description price duration instructor category thumbnail',
        model: Course
      })
     console.log(enrollment)

    // If no enrollment found
    if (!enrollment) {
      return res.status(200).json({
        
        message: "No enrolled courses found for this user"
      });
    }

    // Format the response data
    const enrolledCourses = enrollment.enrolledCourses.map(item => ({
      course: item.course,
      enrolledAt: item.enrolledAt,
      progress: item.progress || 0,
      completed: item.completed || false,
      lastAccessed: item.lastAccessed
    }));

    return res.status(200).json({
      success: true,
      message: "Enrolled courses retrieved successfully",
      data: enrolledCourses,
      totalCourses: enrolledCourses.length
    });

  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};