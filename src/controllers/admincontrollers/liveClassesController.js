import LiveClass from '../../models/LiveClass.js';
import Enrollment from '../../models/Enrollment.js';
import { createMeeting } from '../../service/zoomService.js';
import { io } from '../../socket.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export const createLiveClass = asyncHandler(async (req, res) => {
  const { title, startTime, duration, courseId, batchId, instructorEmail } = req.body;

  // RBAC example: only admin/instructor can create
  if (!['admin', 'instructor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
console.log(req.body,"creating mett")
  // Create Zoom meeting
  const meeting = await createMeeting({
    topic: title,
    start_time: startTime, // ensure ISO 8601 string, e.g., "2025-09-11T10:30:00"
    duration,
    hostEmail: instructorEmail
  });

  // Persist
  const liveClass = await LiveClass.create({
    title,
    courseId,
    batchId,
    startTime,
    duration,
    zoomMeetingId: String(meeting.id),
    zoomJoinUrl: meeting.join_url,
    zoomStartUrl: meeting.start_url,
    hostEmail: instructorEmail
  });

  // Notify room
  io.to(`batch_${batchId}`).emit('newLiveClass', {
    message: 'New live class scheduled',
    liveClass
  });

  res.status(201).json({ message: 'Live class created successfully', liveClass });
});

export const listLiveClasses = asyncHandler(async (req, res) => {
  const { courseId, batchId } = req.query;
  const filter = {};
  if (courseId) filter.courseId = courseId;
  if (batchId) filter.batchId = batchId;

  const classes = await LiveClass.find(filter).sort({ startTime: 1 });
  res.json(classes);
});

// Enrolled-only join redirect
export const joinLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const liveClass = await LiveClass.findById(id);
  if (!liveClass) return res.status(404).json({ error: 'Live class not found' });

  const isEnrolled = await Enrollment.exists({
    userId: req.user._id,
    courseId: liveClass.courseId,
    status: 'active'
  });

  if (!isEnrolled) return res.status(403).json({ error: 'Not enrolled' });

  // Safe redirect to Zoom's join URL
  return res.redirect(liveClass.zoomJoinUrl);
});


export const updateLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startTime, duration } = req.body;

    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      return res.status(404).json({ error: 'Live class not found' });
    }

    // Update Zoom meeting
    await zoomConfig.meetings.update(liveClass.zoomMeetingId, {
      topic: title,
      start_time: startTime,
      duration
    });

    // Update database
    liveClass.title = title;
    liveClass.startTime = startTime;
    liveClass.duration = duration;
    await liveClass.save();

    res.json({
      message: 'Live class updated successfully',
      liveClass
    });
  } catch (error) {
    console.error('Update live class error:', error);
    res.status(500).json({ error: 'Failed to update live class' });
  }
};