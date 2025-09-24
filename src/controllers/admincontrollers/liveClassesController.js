import LiveClass from '../../models/LiveClass.js';

import { createMeeting } from '../../service/zoomService.js';
import { io } from '../../socket.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';

export const createLiveClass = asyncHandler(async (req, res) => {
  const { title, startTime, duration, courseId, batchId, instructorEmail,recurrence,endDate } = req.body;

  // RBAC example: only admin/instructor can create
  if (!['admin', 'instructor'].includes(req.userAccount.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
console.log(req.body,"creating mett")
  // Create Zoom meeting
  const meeting = await createMeeting({
    topic: title,
    start_time: startTime, // ensure ISO 8601 string, e.g., "2025-09-11T10:30:00"
    duration,
    hostEmail: instructorEmail,
    recurrence,
    endDate
  });
console.log(meeting,"iam meeting")
  // Persist
  const liveClass = await LiveClass.create({
    title,
    course:courseId,
    batch:batchId,
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



export const getAllLiveClasses = async (req, res) => {
  try {
    const liveClasses = await LiveClass.find()
      .sort({ startTime: 1 })
      .populate({
        path: 'course',
        select: 'name'
      })
      .populate({
        path: 'batch',
        select: 'batchName'
      })
      .select('title startTime duration course batch status  hostEmail ');

    res.json({ liveClasses });
  } catch (error) {
    console.error('Admin fetch live classes error:', error);
    res.status(500).json({ error: 'Failed to fetch live classes' });
  }
};



export const startLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the live class
  const liveClass = await LiveClass.findById(id);
  if (!liveClass) {
    return res.status(404).json({ error: 'Live class not found' });
  }

  // Optional: Check if the requester is the host or admin


  // Update status to 'ongoing'
  liveClass.status = 'ongoing';
  await liveClass.save();

  // Redirect to Zoom start URL
  console.log(liveClass.zoomStartUrl)
  return res.redirect(liveClass.zoomStartUrl);
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