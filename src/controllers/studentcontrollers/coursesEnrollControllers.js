// controllers/studentEnrollmentController.js
import Course from '../../models/courses.js';
import Batch from '../../models/batch.js';
import Payment from '../../models/payments.js';
import Enrollment from '../../models/Enrollment.js';
import User from '../../models/user.js';
import mongoose from 'mongoose';
import LiveClass from '../../models/LiveClass.js';





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

// Get  only one enrollment by specific course ID with detailed population
export const getStudentEnrollmentByCourseId = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  try {
    // 1️⃣ Find enrollment document
    const enrollment = await Enrollment.findOne({
      user: userId,
      "enrolledCourses.course": courseId,
    })
      .populate({
        path: "enrolledCourses.course",
        select: "-__v",
        populate: {
          path: "details",
          select: "-__v",
        },
      })
      .populate({
        path: "enrolledCourses.batch",
        select: "_id batchName startDate endDate status",
      })
      .populate({
        path: "enrolledCourses.paymentId",
        select:
          "status appUsed paymentMode paymentId amountInRupees createdAt",
      })
      .lean()

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Course enrollment not found",
      });
    }

    // 2️⃣ Extract only the requested enrolled course
    const enrolledCourse = enrollment.enrolledCourses.find(
      (ec) => ec.course && ec.course._id.toString() === courseId
    );

    if (!enrolledCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not enrolled",
      });
    }

    // 3️⃣ Get live classes only if batch exists
    let liveClasses = [];

    if (enrolledCourse.batch) {
      liveClasses = await LiveClass.find({
        course: courseId,
        batch: enrolledCourse.batch._id,
      }).select("title startTime zoomJoinUrl status")
        .sort({ startTime: 1 })
        .lean();
    }

    // 4️⃣ Return structured response
    return res.status(200).json({
      success: true,
      data: {
        courseId: enrolledCourse.course._id,
        course: enrolledCourse.course,
        batch: enrolledCourse.batch || null,
        payment: enrolledCourse.paymentId || null,
       
        completed: enrolledCourse.completed,
        enrolledAt: enrolledCourse.enrolledAt,
        liveClasses,
      },
    });
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getStudentEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    // type = "ids" | "summary"

    // 1️⃣ If only IDs requested
    if (type === "ids") {
      const enrollment = await Enrollment.findOne(
        { user: userId },
        { "enrolledCourses.course": 1, _id: 0 } // projection only
      );

      const courseIds =
        enrollment?.enrolledCourses.map(item => item.course) || [];

      return res.status(200).json({
        success: true,
        data: courseIds
      });
    }

    // 2️⃣ Default → summary (light populate only course basic info)
    const enrollment = await Enrollment.findOne({ user: userId })
      .select("enrolledCourses")
      .populate({
        path: "enrolledCourses.course",
        select: "name duration category thumbnail shortdescription"
      })
      .populate({
        path: "enrolledCourses.batch",
        select: "batchName"
      })
      .lean();

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const summary = enrollment.enrolledCourses.map(item => ({
      _id: item.course._id,
      courseName: item.course?.name,
      shortDescription: item.course?.shortdescription,
      thumbnail: item.course?.thumbnail,
      duration: item.course?.duration,
      category: item.course?.category,

      batchName: item.batch?.batchName || null,

      enrolledAt: item.enrolledAt,
      completed: item.completed,
    }));


    return res.status(200).json({
      success: true,
      data: summary,
      totalCourses: summary.length
    });

  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


export const getUserEnrollments = async (req, res) => {
  try {
    let userId;

    // Role check
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      userId = req.params.userId || req.user.id;
    } else {
      userId = req.user.id;
    }

    /* -------- Get user -------- */
    const user = await User.findById(userId).select(
      "name email role mobile profileImage emailVerified"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* -------- Get enrollments -------- */
    const enrollments = await Enrollment.findOne({ user: userId })
      .populate({
        path: "enrolledCourses.course",
        select: "name thumbnail price category shortdescription duration",
      })
      .populate({
        path: "enrolledCourses.batch",
        select: "batchName startDate endDate status",
      })
      .populate({
        path: "enrolledCourses.paymentId",
        select: "amountInRupees status paymentMethod createdAt",
      });

    /* -------- Return even if empty -------- */
    return res.status(200).json({
      success: true,
      data: {
        user,
        enrolledCourses: enrollments?.enrolledCourses || [],
      },
    });
  } catch (error) {
    console.error("Get enrollments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};