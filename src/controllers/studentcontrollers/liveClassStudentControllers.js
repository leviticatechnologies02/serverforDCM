import LiveClass from '../../models/LiveClass.js';

export const joinLiveClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user.id;

    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) {
      return res.status(404).json({ error: 'Live class not found' });
    }

    // Check if student is enrolled in the course
    const isEnrolled = await Enrollment.findOne({
      'user.id': studentId,
      'enrolledCourses.courseId': liveClass.courseId
    });

    if (!isEnrolled) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    res.json({
      message: 'Join URL retrieved successfully',
      joinUrl: liveClass.zoomJoinUrl
    });
  } catch (error) {
    console.error('Join live class error:', error);
    res.status(500).json({ error: 'Failed to get join URL' });
  }
};

export const getLiveClasses = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get enrolled courses
    const enrollment = await Enrollment.findOne({ 'user.id': studentId });
    const courseIds = enrollment.enrolledCourses.map(course => course.courseId);

    // Get upcoming live classes for enrolled courses
    const liveClasses = await LiveClass.find({
      courseId: { $in: courseIds },
      startTime: { $gte: new Date() }
    }).sort({ startTime: 1 });

    res.json({ liveClasses });
  } catch (error) {
    console.error('Get live classes error:', error);
    res.status(500).json({ error: 'Failed to get live classes' });
  }
};