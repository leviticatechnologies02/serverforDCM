import { asyncHandler } from '../../middlewares/asyncHandler.js';
import Enrollment from '../../models/Enrollment.js';
import LiveClass from '../../models/LiveClass.js';

export const joinLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const liveClass = await LiveClass.findById(id);
  if (!liveClass) return res.status(404).json({ error: 'Live class not found' });

  const isEnrolled = await Enrollment.exists({
    user: req.userAccount.user.id,
    course: liveClass.course,
  
  });

  if (!isEnrolled) return res.status(403).json({ error: 'Not enrolled' });

  // Safe redirect to Zoom's join URL
  return res.redirect(liveClass.zoomJoinUrl);
});

export const getLiveClasses = async (req, res) => {

  try {
    const {user}= req.userAccount;


    // Get active enrollment
    const enrollment = await Enrollment.findOne({
      'user': user.id,
     
    });

    if (!enrollment || !enrollment.enrolledCourses?.length) {
      return res.json({ liveClasses: [] });
    }

    const courseIds = enrollment.enrolledCourses.map(c => c.course);
    const batchIds = enrollment.enrolledCourses.map(c => c.batch).filter(Boolean);
    

    // Fetch and populate only needed fields
    const liveClasses = await LiveClass.find({
      course: { $in: courseIds },
      batch: { $in: batchIds },
      startTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'ongoing'] }
    })
      .sort({ startTime: 1 })
      .populate({
        path: 'course',
        select: 'name'
      })
      .populate({
        path: 'batch',
        select: 'batchName'
      })
      .select('courseId batchId startTime title duration');
      console.log(liveClasses,"iam live classes")

    res.json({ liveClasses });
  } catch (error) {
    console.error('Get live classes error:', error);
    res.status(500).json({ error: 'Failed to get live classes' });
  }
};