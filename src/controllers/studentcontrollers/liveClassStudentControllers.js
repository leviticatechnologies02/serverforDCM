import mongoose from 'mongoose';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import Enrollment from '../../models/Enrollment.js';
import LiveClass from '../../models/LiveClass.js';
import User from '../../models/user.js';
import InternshipPayment from '../../models/InternshipPayment.js';




export const joinLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Fetch live class
  const liveClass = await LiveClass.findById(id);
  if (!liveClass) {
    return res.status(404).json({ error: 'Live class not found' });
  }

  // Ensure user and course IDs are ObjectId
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const courseId = new mongoose.Types.ObjectId(liveClass.course);
  const batchId = liveClass.batch ? new mongoose.Types.ObjectId(liveClass.batch) : null;

  // Check enrollment via course or batch
  const isEnrolled = await Enrollment.exists({
    user: userId,
    enrolledCourses: {
      $elemMatch: batchId
        ? { $or: [{ course: courseId }, { batch: batchId }] }
        : { course: courseId }
    }
  });

  if (!isEnrolled) {
    return res.status(403).json({ error: 'Not enrolled in this class' });
  }

  // Validate Zoom URL
  if (!liveClass.zoomJoinUrl?.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid Zoom URL' });
  }

  // ✅ Return Zoom URL in response
  return res.json({ join: liveClass.zoomJoinUrl });
});

export const getLiveClasses = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    

    // Get active enrollment for courses
    const enrollment = await Enrollment.findOne({ 'user': userId });
    
    let courseIds = [];
    let batchIds = [];
    
    if (enrollment && enrollment.enrolledCourses?.length) {
      courseIds = enrollment.enrolledCourses.map(c => c.course);
      batchIds = enrollment.enrolledCourses.map(c => c.batch).filter(Boolean);
    }

    // Get user details for internship email check
    const user = await User.findById(userId);
    let internshipDomainIds = [];
    let internshipBatchIds = [];

    if (user && user.email) {
      // Find paid internships
      const internships = await InternshipPayment.find({
        email: user.email,
        status: 'paid'
      });
      internshipDomainIds = internships.map(i => i.domainId).filter(Boolean);
      internshipBatchIds = internships.map(i => i.batch).filter(Boolean);
    }

    if (!courseIds.length && !batchIds.length && !internshipDomainIds.length) {
      return res.json({ liveClasses: [] });
    }

    // Build the query to check EITHER course/batch matches OR internshipDomainId matches
    const orConditions = [];
    
    if (courseIds.length > 0) {
      orConditions.push({
        course: { $in: courseIds },
        $or: [
          { batch: { $in: batchIds } },
          { batch: null },
          { batch: { $exists: false } }
        ]
      });
    }
    
    if (internshipDomainIds.length > 0) {
      orConditions.push({
        internshipDomain: { $in: internshipDomainIds },
        $or: [
          { batch: { $in: internshipBatchIds } },
          { batch: null },
          { batch: { $exists: false } }
        ]
      });
    }

    // Fetch and populate only needed fields
    const liveClasses = await LiveClass.find({
      $or: orConditions,
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
      .populate({
        path: 'internshipDomain',
        select: 'name'
      })
      .select('course batch internshipDomain startTime title duration classType zoomJoinUrl passcode');
      
    console.log("Enrolled courseIds:", courseIds);
    console.log("Enrolled batchIds:", batchIds);
    console.log("Internship Domain IDs:", internshipDomainIds);
    console.log("Generated orConditions:", JSON.stringify(orConditions, null, 2));
    console.log("Fetched liveClasses:", liveClasses);

    res.json({ liveClasses });
  } catch (error) {
    console.error('Get live classes error:', error);
    res.status(500).json({ error: 'Failed to get live classes' });
  }
};