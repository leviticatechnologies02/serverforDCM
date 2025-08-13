// controllers/enrollmentController.js
import Enrollment from '../../models/Enrollment.js';

export const enrollInCourses = async (req, res) => {
  const { userId } = req.params

  const enrolledCourses = req.body;
  console.log(enrolledCourses, "enrolled COurses from body")


  if (!userId || !Array.isArray(enrolledCourses)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    let enrollment = await Enrollment.findOne({ user: userId });

    // Always set assigned: false and batch: null during enrollment
    const newEnrollments = enrolledCourses.map(({ course }) => ({
      course: course,

    }));
    console.log(newEnrollments, "new enrollments")

    if (!enrollment) {
      enrollment = new Enrollment({
        user: userId,
        enrolledCourses: newEnrollments
      });
    } else {
      const existingCourseIds = enrollment.enrolledCourses.map(ec => ec.course.toString());

      newEnrollments.forEach(newCourse => {
        if (!existingCourseIds.includes(newCourse.course.toString())) {
          enrollment.enrolledCourses.push(newCourse);
        }
      });
    }

    await enrollment.save();
    res.status(200).json({ message: 'Enrollment successful', enrollment });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: 'Failed to enroll in courses' });
  }
};


export const getUnassignedEnrollments = async (req, res) => {
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
        $project:{
          user:1,
          enrolledCourses:1
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
      }
    ]);

    res.status(200).json({ enrollments });
  } catch (error) {
    console.error("Error fetching unassigned enrollments:", error);
    res.status(500).json({ message: "Failed to fetch enrollments" });
  }
};