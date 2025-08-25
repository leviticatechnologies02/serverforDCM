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

//this is for assign student to batch
export const assignStudentsToBatch = async (req, res) => {
  console.log(req.body)
  const { enrollmentIds, courseId, batchId } = req.body;
  if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
    return res.status(400).json({ error: 'enrollmentIds must be a non-empty array' });
  }
  try{
    const results = await Enrollment.updateMany(
  { _id: { $in: enrollmentIds } }, // filter: match multiple enrollments
  {
    $set: {
      'enrolledCourses.$[course].batch': batchId,
      'enrolledCourses.$[course].assigned': true
    }
  },
  {
    arrayFilters: [
      { 'course.course': courseId } // match the course inside enrolledCourses
    ]
  }
);
    
    

    // const modifiedCount = results.reduce((sum, r) => sum + r.modifiedCount, 0);
    console.log("batch",results)

    res.status(200).json({
      message: 'Batch assignment successful',
      totalUpdated: modifiedCount,
      totalRequests: assignments.length
    });
  } catch (error) {
    console.error('Batch assignment error:', error);
    res.status(500).json({ error: 'Failed to assign batches' });
  }
 };

export const getAssignedEnrollments = async (req, res) => {
  console.log("enrollment getAssigned");
  try {
    const enrollments = await Enrollment.aggregate([
      // Filter only assigned courses
      {
        $project: {
          user: 1,
          enrolledCourses: {
            $filter: {
              input: "$enrolledCourses",
              as: "course",
              cond: { $eq: ["$$course.assigned", true] }
            }
          }
        }
      },
      // Only keep enrollments with at least one assigned course
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

      // Optional: Populate batch if needed
      {
        $lookup: {
          from: "batches",
          localField: "enrolledCourses.batch",
          foreignField: "_id",
          as: "enrolledCourses.batch"
        }
      },
      { $unwind: { path: "$enrolledCourses.batch", preserveNullAndEmptyArrays: true } },

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
    console.error("Error fetching assigned enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
};
