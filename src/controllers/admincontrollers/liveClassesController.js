import LiveClass from '../../models/LiveClass.js';

import { createMeeting ,
    getMeeting,
  getAllMeetings,
  updateMeeting,
  deleteMeeting,
  endMeeting,
  updateMeetingTopic,
  updateMeetingTime,
  updateMeetingSettings,
  batchDeleteMeetings
} from '../../service/zoomService.js';
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
const {data}=meeting
  // Persist
  const liveClass = await LiveClass.create({
    title,
    course:courseId,
    batch:batchId,
    startTime,
    duration,
    zoomMeetingId: String(data.id),
    zoomJoinUrl:data.join_url,
    zoomStartUrl: data.start_url,
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
    const { meetingId } = req.params;
    const updateData = req.body;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required'
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update data is required'
      });
    }

    const result = await updateMeeting(meetingId, updateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update meeting',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Update meeting controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update meeting topic
// @route   PATCH /api/meetings/:meetingId/topic
// @access  Private
export const updateMeetingTopicController = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { topic } = req.body;

    if (!meetingId || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID and topic are required'
      });
    }

    const result = await updateMeetingTopic(meetingId, topic);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update meeting topic',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting topic updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Update meeting topic controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// @desc    Update meeting time
// @route   PATCH /api/meetings/:meetingId/time
// @access  Private
export const updateMeetingTimeController = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { start_time, duration } = req.body;

    if (!meetingId || !start_time) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID and start_time are required'
      });
    }

    const result = await updateMeetingTime(meetingId, start_time, duration);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update meeting time',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting time updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Update meeting time controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
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
    const { meetingId } = req.params;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID is required'
      });
    }

    const result = await deleteMeeting(meetingId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete meeting',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Delete meeting controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
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

