// controllers/enrollmentController.js
import Enrollment from '../../models/Enrollment.js';

// export const enrollInCourses = async ({paymentId,userId,courseId}) => {
//   // const { userId } = req.params

//   // const enrolledCourses = req.body;
//   // console.log(enrolledCourses, "enrolled COurses from body")


//   // if (!userId || !Array.isArray(enrolledCourses)) {
//   //   return res.status(400).json({ error: 'Invalid payload' });
//   // }

//   // try {
//   //   let enrollment = await Enrollment.findOne({ user: userId });

//   //   // Always set assigned: false and batch: null during enrollment
//   //   const newEnrollments = enrolledCourses.map(({ course, availability }) => ({
//   //     course: course,
//   //     availability: availability
//   //   }));
//   //   console.log(newEnrollments, "new enrollments")

//    if(userId&&paymentId&&courseId){
//   const enrollment = new Enrollment({
//         user: userId,
//         enrolledCourses: newEnrollments
//       });
//     } else {
//       const existingCourseIds = enrollment.enrolledCourses.map(ec => ec.course.toString());

//       newEnrollments.forEach(newCourse => {
//         if (!existingCourseIds.includes(newCourse.course.toString())) {
//           enrollment.enrolledCourses.push(newCourse);
//         }
//       });
//     }

//     await enrollment.save();
//     res.status(200).json({ message: 'Enrollment successful', enrollment });
//   } catch (err) {
//     console.error('Enrollment error:', err);
//     res.status(500).json({ error: 'Failed to enroll in courses' });
//   }
// };


export const enrollInCourses = async ({ paymentId, userId, courseId }) => {
  try {
    if (!userId || !courseId || !paymentId) {
      throw new Error('Missing required enrollment data');  
    }

    const newEnrollmentEntry = {
      course: courseId,
      paymentId,
      assigned: false,
      batch: null,
      enrolledAt: new Date()
    };

    let enrollment = await Enrollment.findOne({ user: userId });

    if (!enrollment) {
      // First-time enrollment for this user
      enrollment = new Enrollment({
        user: userId,
        enrolledCourses: [newEnrollmentEntry]
      });
    } else {
      // Check if course already enrolled
      const alreadyEnrolled = enrollment.enrolledCourses.some(
        ec => ec.course.toString() === courseId.toString()
      );

      if (!alreadyEnrolled) {
        enrollment.enrolledCourses.push(newEnrollmentEntry);
      }
    }

    await enrollment.save();

    return {
      success: true,
      message: 'Enrollment successful',
      enrollment
    };
  } catch (err) {
    console.error('Enrollment error:', err);
    throw new Error('Failed to enroll in course');
  }
};


// Alternative version if you need to get enrollments by specific user ID
export const getStudentEnrollmentsById = async (req, res) => {
  const { id } = req.params;
 console.log(id)
  try {
    const enrollment = await Enrollment.findOne({ user:id })
      .populate('enrolledCourses.course', 'name description')
      .populate('enrolledCourses.batch', 'batchName  startDate endDate')
      .populate('enrolledCourses.paymentId','orderId paymentId amount createdAt')
      //want extra details 
      // check which  schema and add in line after exmaple:batchname and same for courses

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'No enrollments found for this user'
      });
    }
 
    res.status(200).json({
      success: true,
     data: enrollment
    });
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enrollments'
    });
  }
};