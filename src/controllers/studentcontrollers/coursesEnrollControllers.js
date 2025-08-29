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
    const newEnrollments = enrolledCourses.map(({ course, availability }) => ({
      course: course,
      availability: availability
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


// Alternative version if you need to get enrollments by specific user ID
export const getStudentEnrollmentsById = async (req, res) => {
  const { userId } = req.params;
 
  try {
    const enrollment = await Enrollment.findOne({ user: userId })
      .populate('enrolledCourses.course', 'name description')
      .populate('enrolledCourses.batch', 'name _id');
 
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'No enrollments found for this user'
      });
    }
 
    res.status(200).json({
      success: true,
      enrolledCourses: enrollment.enrolledments
    });
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enrollments'
    });
  }
};