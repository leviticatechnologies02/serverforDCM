// controllers/enrollmentController.js
import Enrollment from '../../models/Enrollment.js';




export const getUnassignedEnrollments = async (req, res) => {
  console.log("enrollment getUnassigned")
  try {
    const enrollments = await Enrollment.aggregate([
      // Filter only unassigned courses
      {
        $project: {
          user: 1,
          enrolledCourses: {
            $filter: {
              input: "$enrolledCourses",
              as: "course",
              cond: { $eq: ["$$course.assigned", false] }
            }
          }
        }
      },
      // Only keep enrollments with at least one unassigned course
      {
        $match: {
          "enrolledCourses.0": { $exists: true }
        }
      },
      // Populate user
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      {
        $project: {
          user: 1,
          enrolledCourses: 1
        }
      },

      // Unwind enrolledCourses to populate each course
      { $unwind: "$enrolledCourses" },
      {
        $lookup: {
          from: "courses",
          localField: "enrolledCourses.course",
          foreignField: "_id",
          as: "enrolledCourses.course"
        }
      },
      { $unwind: "$enrolledCourses.course" },
      // Re-group enrolledCourses back into array
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          enrolledCourses: {
            $push: {
              course: "$enrolledCourses.course",
              availability: "$enrolledCourses.availability",
              enrolledAt: "$enrolledCourses.enrolledAt",
              assigned: "$enrolledCourses.assigned",
              batch: "$enrolledCourses.batch"
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          enrolledCourses: 1,
          user: {
            name: "$user.name",
            email: "$user.email",
            role: "$user.role"
            // password and other sensitive fields are excluded
          }
        }
      }

    ]);

    res.status(200).json({ enrollments });
  } catch (error) {
    console.error("Error fetching unassigned enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
};