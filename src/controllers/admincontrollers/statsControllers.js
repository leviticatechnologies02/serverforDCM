import User from "../../models/user.js";
import Batch from "../../models/batch.js";
import Course from "../../models/courses.js";
import Enrollment from "../../models/Enrollment.js";

// Controller to get admin dashboard stats
export const getAdminStats = async (req, res) => {
  console.log("hitted getadminstats")
  try {
    const [verifiedUsers, batches, enrollments, courses] = await Promise.all([
      User.countDocuments({ emailVerified: true }),
      Batch.countDocuments(),
      Enrollment.countDocuments(),
      Course.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        verifiedUsers,
        batches,
        enrollments,
        courses
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
      error: error.message
    });
  }
};