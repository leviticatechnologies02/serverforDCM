import LiveClass from '../../models/LiveClass.js';

import {
  createMeeting,
  getMeeting,
  getAllMeetings,
  updateMeeting,
  deleteMeeting,
  endMeeting,

  updateMeetingSettings,
  batchDeleteMeetings
} from '../../service/zoomService.js';
import { io } from '../../socket.js';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import mongoose from "mongoose";
import Enrollment from '../../models/Enrollment.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';
import { getLiveClassScheduledEmailHTML } from '../../utils/Email/generateHTML.js';

export const createLiveClass = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { title, startTime, duration, courseId, batchId, internshipDomainId, classType, hostEmail, recurrence, endDate } = req.body;

    const startTimeUTC = new Date(startTime).toISOString();

    /* ===== CREATE ZOOM MEETING ===== */

    const meeting = await createMeeting({
      topic: title,
      start_time: startTimeUTC,
      duration,
      hostEmail,
      recurrence,
      endDate
    });

    if (!meeting.success) {
      throw new Error(`Zoom API Error: ${JSON.stringify(meeting.error)}`);
    }

    const { data } = meeting;

    /* ===== SAVE LIVE CLASS ===== */

    const liveClass = await LiveClass.create(
      [
        {
          title,
          classType: classType || 'course',
          course: classType === 'internship' ? undefined : courseId,
          batch: batchId,
          internshipDomain: classType === 'internship' ? internshipDomainId : undefined,
          startTime,
          duration,
          zoomMeetingId: String(data.id),
          zoomJoinUrl: data.join_url,
          zoomStartUrl: data.start_url,
          hostEmail
        }
      ],
      { session }
    );

    /* ===== FIND ENROLLED USERS ===== */

    let enrollments = [];
    if (classType !== 'internship') {
      enrollments = await Enrollment.find({
        enrolledCourses: { $elemMatch: { batch: batchId } }
      })
        .populate("user", "name email")
        .session(session);
    } else {
      // Find internship enrollments if needed, or skip for now.
      enrollments = await Enrollment.find({
        enrolledInternships: { $elemMatch: { domain: internshipDomainId } }
      })
        .populate("user", "name email")
        .session(session);
    }

    /* ===== SEND EMAILS (PARALLEL) ===== */

    await Promise.all(
      enrollments.map((u) =>
        sendEmail({
          to: u.user.email,
          subject: "New Live Class Scheduled",
          html: getLiveClassScheduledEmailHTML(
            u.user.name,
            title,
            startTime,
            duration,
            data.join_url,
            u.user.email
          )
        })
      )
    );
    /* ===== COMMIT TRANSACTION ===== */

    await session.commitTransaction();
    session.endSession();

    /* ===== SOCKET EVENT ===== */

    if (classType !== 'internship') {
      io.to(`batch_${batchId}`).emit("newLiveClass", {
        message: "New live class scheduled",
        liveClass: liveClass[0]
      });
    } else {
      io.to(`internship_${internshipDomainId}`).emit("newLiveClass", {
        message: "New live class scheduled",
        liveClass: liveClass[0]
      });
    }

    res.status(201).json({
      message: "Live class created successfully",
      liveClass: liveClass[0]
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    throw error;
  }
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
        path: 'internshipDomain',
        select: 'name'
      })
      .populate({
        path: 'batch',
        select: 'batchName'
      })
      .select('title startTime duration course batch status  hostEmail zoomJoinUrl');
    console.log(liveClasses, "iam live classes")
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


  return res.redirect(liveClass.zoomStartUrl);
});






// @desc    Get a single meeting by ID
// @route   GET /api/meetings/:meetingId
// @access  Private
export const getMeetingController = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required'
      });
    }

    const result = await getMeeting(meetingId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get meeting controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get all meetings for a host
// @route   GET /api/meetings
// @access  Private
export const getAllMeetingsController = async (req, res) => {
  try {
    const { hostEmail, pageSize = 30, nextPageToken } = req.query;

    if (!hostEmail) {
      return res.status(400).json({
        success: false,
        message: 'Host email is required'
      });
    }

    const result = await getAllMeetings(hostEmail, parseInt(pageSize), nextPageToken);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch meetings',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        pageSize: parseInt(pageSize),
        nextPageToken: result.data.next_page_token,
        totalRecords: result.data.total_records
      }
    });
  } catch (error) {
    console.error('Get all meetings controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update a meeting
// @route   PUT /api/meetings/:meetingId
// @access  Private
export const updateMeetingController = async (req, res) => {
  try {
    const { id } = req.params; // Mongo _id
    const updateData = req.body;

    // 1️⃣ Find LiveClass first
    const liveClass = await LiveClass.findById(id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    // 2️⃣ Get actual Zoom Meeting ID
    const zoomMeetingId = liveClass.zoomMeetingId;

    // 3️⃣ Update Zoom meeting
    const zoomResult = await updateMeeting(
      zoomMeetingId,
      updateData
    );

    if (!zoomResult.success) {
      return res.status(400).json({
        success: false,
        message: "Zoom update failed",
        error: zoomResult.error,
      });
    }

    // 4️⃣ Update MongoDB
    liveClass.title = updateData.title || liveClass.title;
    liveClass.startTime = updateData.startTime || liveClass.startTime;
    liveClass.duration = updateData.duration || liveClass.duration;
    liveClass.course = updateData.courseId || liveClass.course;
    liveClass.batch = updateData.batchId || liveClass.batch;
    liveClass.internshipDomain = updateData.internshipDomainId || liveClass.internshipDomain;

    await liveClass.save();

    return res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
    });

  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// @desc    Update meeting settings
// @route   PATCH /api/meetings/:meetingId/settings
// @access  Private
export const updateMeetingSettingsController = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { settings } = req.body;

    if (!meetingId || !settings) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID and settings are required'
      });
    }

    const result = await updateMeetingSettings(meetingId, settings);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update meeting settings',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting settings updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Update meeting settings controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Delete a meeting
// @route   DELETE /api/meetings/:meetingId
// @access  Private
export const deleteMeetingController = async (req, res) => {
  try {
    const { id } = req.params; // Mongo _id

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "LiveClass ID is required",
      });
    }

    // 1️⃣ Find LiveClass in DB
    const liveClass = await LiveClass.findById(id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found",
      });
    }

    // 2️⃣ Get Zoom Meeting ID
    const zoomMeetingId = liveClass.zoomMeetingId;

    // 3️⃣ Delete from Zoom
    const result = await deleteMeeting(zoomMeetingId);

    if (!result.success) {
      console.warn("Failed to delete Zoom meeting, but proceeding to delete from DB:", result.error);
    }

    // 4️⃣ Delete from MongoDB
    await liveClass.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });

  } catch (error) {
    console.error("Delete meeting controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// @desc    End an ongoing meeting
// @route   POST /api/meetings/:meetingId/end
// @access  Private
export const endMeetingController = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required'
      });
    }

    const result = await endMeeting(meetingId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to end meeting',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting ended successfully'
    });
  } catch (error) {
    console.error('End meeting controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Batch delete meetings
// @route   POST /api/meetings/batch-delete
// @access  Private
export const batchDeleteMeetingsController = async (req, res) => {
  try {
    const { meetingIds } = req.body;

    if (!meetingIds || !Array.isArray(meetingIds) || meetingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Meeting IDs array is required'
      });
    }

    const results = await batchDeleteMeetings(meetingIds);

    const successfulDeletes = results.filter(r => r.success);
    const failedDeletes = results.filter(r => !r.success);

    res.status(200).json({
      success: true,
      message: `Batch delete completed. Successful: ${successfulDeletes.length}, Failed: ${failedDeletes.length}`,
      data: {
        successful: successfulDeletes,
        failed: failedDeletes
      }
    });
  } catch (error) {
    console.error('Batch delete meetings controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Get meeting join URL and details
// @route   GET /api/meetings/:meetingId/join-details
// @access  Private
export const getMeetingJoinDetailsController = async (req, res) => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required'
      });
    }

    const result = await getMeeting(meetingId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
        error: result.error
      });
    }

    const meeting = result.data;
    const joinDetails = {
      id: meeting.id,
      topic: meeting.topic,
      join_url: meeting.join_url,
      start_url: meeting.start_url,
      start_time: meeting.start_time,
      duration: meeting.duration,
      timezone: meeting.timezone,
      password: meeting.password,
      settings: meeting.settings
    };

    res.status(200).json({
      success: true,
      data: joinDetails
    });
  } catch (error) {
    console.error('Get meeting join details controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

