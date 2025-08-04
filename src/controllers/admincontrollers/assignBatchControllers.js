import Enrollment from '../../models/Enrollment.js';
// GET /api/enrollment/unassigned
// controllers/enrollmentController.js
export const getUnassignedUsers = async (req, res) => {
  try {
    const unassigned = await Enrollment.find({
      $and: [
        { 'user.role': { $ne: 'admin' } },
        {
          enrolledCourses: {
            $elemMatch: { assignBatch: false }
          }
        }
      ]
    });

    console.log(unassigned, 'unassigned');

    const sanitizedUsers = unassigned.map(({ user, enrolledCourses }) => {
      const { password, ...safeUser } = user;

      const unassignedCourses = enrolledCourses
        .filter(course => course.assignBatch === false)
        .map(course => ({
          title: course.title
        }));

      return {
        name: safeUser.name,
        email: safeUser.email,
        courses: unassignedCourses
      };
    });

    res.json({ students: sanitizedUsers });
  } catch (error) {
    console.error('Error fetching unassigned users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// POST /api/enrollment/assign

export const assignBatchGrouped = async (req, res) => {
  const assignments = req.body

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({ error: 'assignments must be a non-empty array' });
  }

  // Extract batchName (same for all), and group studentIds and courseTitles
  const batchName = assignments[0]?.batchName;

  const studentIds = assignments.map(a => a.studentId);
  const courseTitles = [...new Set(assignments.map(a => a.courseTitle))];

  try {
    const result = await Enrollment.updateMany(
      {
        'user.email': { $in: studentIds },
        'enrolledCourses.title': { $in: courseTitles }
      },
      {
        $set: {
          'enrolledCourses.$[course].batchId': batchName
        }
      },
      {
        arrayFilters: [
          { 'course.title': { $in: courseTitles } }
        ]
      }
    );

    res.status(200).json({
      matched: result.matchedCount,
      modified: result.modifiedCount,
      assignedTo: studentIds.length,
      courseCount: courseTitles.length,
      batch: batchName
    });
  } catch (error) {
    console.error('Batch assignment error:', error);
    res.status(500).json({ error: 'Server error during batch assignment' });
  }
};
export const assignedStudents = async (req, res) => {
  try {
    const result = await Enrollment.find({
      enrolledCourses: {
        $elemMatch: { batchId: { $ne: null } }
      }
    }).select('user enrolledCourses').lean();

    const formatted = result.map(({ user, enrolledCourses }) => {
      const assignedCourses = enrolledCourses.filter(c => c.batchId);
      return {
        name: user.name,
        email: user.email,
        courses: assignedCourses.map(c => ({
          title: c.title,
          batchId: c.batchId
        }))
      };
    });
    console.log(formatted,"fromatted")
    res.status(200).json({students:formatted})

  }catch(error){
    console.error("assigned data is missing",error)
    res.status(500).json({error:"do again"})
  }
}