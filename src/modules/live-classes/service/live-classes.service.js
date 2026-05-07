import mongoose from 'mongoose';
import LiveClass from '../../../models/LiveClass.js';
import Enrollment from '../../../models/Enrollment.js';
import ApiError from '../../../utils/ApiError.js';
import {
  createMeeting,
  getMeeting,
  getAllMeetings,
  updateMeeting,
  deleteMeeting,
  endMeeting,
  updateMeetingSettings,
  batchDeleteMeetings
} from '../../../services/zoomService.js';
import { io } from '../../../socket.js';
import { getLiveClassScheduledEmailHTML } from '../../../utils/email/generateHTML.js';
import { sendEmail } from '../../../utils/email/sendEmail.js';
import logger from '../../../utils/logger.js';

export class LiveClassesService {
  // 1. Admin Live Class Scheduling & Zoom sync
  static async createLiveClass({ title, startTime, duration, courseId, batchId, hostEmail, recurrence, endDate }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const startTimeUTC = new Date(startTime).toISOString();

      const meeting = await createMeeting({
        topic: title,
        start_time: startTimeUTC,
        duration,
        hostEmail,
        recurrence,
        endDate
      });

      const { data } = meeting;

      const liveClassDoc = await LiveClass.create(
        [
          {
            title,
            course: courseId,
            batch: batchId,
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

      const liveClass = liveClassDoc[0];

      const enrollments = await Enrollment.find({
        enrolledCourses: { $elemMatch: { batch: batchId } }
      })
        .populate("user", "name email")
        .session(session);

      await Promise.allSettled(
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

      await session.commitTransaction();

      io.to(`batch_${batchId}`).emit("newLiveClass", {
        message: "New live class scheduled",
        liveClass
      });

      return liveClass;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async listLiveClasses({ courseId, batchId }) {
    const filter = {};
    if (courseId) filter.courseId = courseId;
    if (batchId) filter.batchId = batchId;

    const classes = await LiveClass.find(filter).sort({ startTime: 1 });
    return classes;
  }

  static async getAllLiveClasses() {
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
      .select('title startTime duration course batch status hostEmail zoomJoinUrl');

    return liveClasses;
  }

  static async startLiveClass(id) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      throw new ApiError(404, 'Live class not found');
    }
    return liveClass.zoomStartUrl;
  }

  // 2. Direct Zoom Meeting controllers (admin helpers)
  static async getMeetingDetails(meetingId) {
    const result = await getMeeting(meetingId);
    if (!result.success) {
      throw new ApiError(404, result.error || 'Meeting not found');
    }
    return result.data;
  }

  static async getAllZoomMeetings({ hostEmail, pageSize = 30, nextPageToken }) {
    const result = await getAllMeetings(hostEmail, pageSize, nextPageToken);
    if (!result.success) {
      throw new ApiError(400, result.error || 'Failed to fetch meetings');
    }
    return {
      data: result.data,
      pagination: {
        pageSize,
        nextPageToken: result.data.next_page_token,
        totalRecords: result.data.total_records
      }
    };
  }

  static async updateMeeting({ id, updateData }) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      throw new ApiError(404, "Live class not found");
    }

    const zoomResult = await updateMeeting(liveClass.zoomMeetingId, updateData);
    if (!zoomResult.success) {
      throw new ApiError(400, zoomResult.error || "Zoom update failed");
    }

    liveClass.title = updateData.title || liveClass.title;
    liveClass.startTime = updateData.startTime || liveClass.startTime;
    liveClass.duration = updateData.duration || liveClass.duration;
    liveClass.course = updateData.courseId || liveClass.course;
    liveClass.batch = updateData.batchId || liveClass.batch;

    await liveClass.save();
    return { message: "Meeting updated successfully" };
  }

  static async updateMeetingSettings({ meetingId, settings }) {
    const result = await updateMeetingSettings(meetingId, settings);
    if (!result.success) {
      throw new ApiError(400, result.error || 'Failed to update meeting settings');
    }
    return result.data;
  }

  static async deleteMeeting(id) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      throw new ApiError(404, "Live class not found");
    }

    const result = await deleteMeeting(liveClass.zoomMeetingId);
    if (!result.success) {
      throw new ApiError(400, result.error || "Failed to delete Zoom meeting");
    }

    await liveClass.deleteOne();
    return { message: "Meeting deleted successfully" };
  }

  static async endMeeting(meetingId) {
    const result = await endMeeting(meetingId);
    if (!result.success) {
      throw new ApiError(400, result.error || 'Failed to end meeting');
    }
    return { message: 'Meeting ended successfully' };
  }

  static async batchDeleteMeetings(meetingIds) {
    const results = await batchDeleteMeetings(meetingIds);
    return results;
  }

  static async getMeetingJoinDetails(meetingId) {
    const result = await getMeeting(meetingId);
    if (!result.success) {
      throw new ApiError(404, result.error || 'Meeting not found');
    }

    const meeting = result.data;
    return {
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
  }

  // 3. Student join & class list endpoints
  static async joinLiveClass({ id, userId }) {
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      throw new ApiError(404, 'Live class not found');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const courseObjectId = new mongoose.Types.ObjectId(liveClass.course);
    const batchObjectId = liveClass.batch ? new mongoose.Types.ObjectId(liveClass.batch) : null;

    const isEnrolled = await Enrollment.exists({
      user: userObjectId,
      enrolledCourses: {
        $elemMatch: batchObjectId
          ? { $or: [{ course: courseObjectId }, { batch: batchObjectId }] }
          : { course: courseObjectId }
      }
    });

    if (!isEnrolled) {
      throw new ApiError(403, 'Not enrolled in this class');
    }

    if (!liveClass.zoomJoinUrl?.startsWith('https://')) {
      throw new ApiError(400, 'Invalid Zoom URL');
    }

    return liveClass.zoomJoinUrl;
  }

  static async getLiveClassesForStudent(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const enrollment = await Enrollment.findOne({ user: userObjectId });
    if (!enrollment || !enrollment.enrolledCourses?.length) {
      return [];
    }

    const courseIds = enrollment.enrolledCourses.map(c => c.course);
    const batchIds = enrollment.enrolledCourses.map(c => c.batch).filter(Boolean);

    const liveClasses = await LiveClass.find({
      course: { $in: courseIds },
      batch: { $in: batchIds },
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

    return liveClasses;
  }
}

export default LiveClassesService;
