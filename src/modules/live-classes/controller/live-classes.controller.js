import { catchAsync } from '../../../utils/catchAsync.js';
import LiveClassesService from '../service/live-classes.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

// 1. Admin Scheduling
export const createLiveClass = catchAsync(async (req, res) => {
  const { title, startTime, duration, courseId, batchId, hostEmail, recurrence, endDate } = req.body;
  const result = await LiveClassesService.createLiveClass({
    title, startTime, duration, courseId, batchId, hostEmail, recurrence, endDate
  });
  return successResponse(res, { message: "Live class created successfully", liveClass: result }, 201);
});

export const listLiveClasses = catchAsync(async (req, res) => {
  const { courseId, batchId } = req.query;
  const result = await LiveClassesService.listLiveClasses({ courseId, batchId });
  return successResponse(res, result);
});

export const getAllLiveClasses = catchAsync(async (req, res) => {
  const result = await LiveClassesService.getAllLiveClasses();
  return successResponse(res, { liveClasses: result });
});

export const startLiveClass = catchAsync(async (req, res) => {
  const zoomStartUrl = await LiveClassesService.startLiveClass(req.params.id);
  return res.redirect(zoomStartUrl);
});

// 2. Admin Direct Zoom Helpers
export const getMeetingController = catchAsync(async (req, res) => {
  const result = await LiveClassesService.getMeetingDetails(req.params.meetingId);
  return successResponse(res, { data: result });
});

export const getAllMeetingsController = catchAsync(async (req, res) => {
  const { hostEmail, pageSize, nextPageToken } = req.query;
  const result = await LiveClassesService.getAllZoomMeetings({
    hostEmail,
    pageSize: pageSize ? parseInt(pageSize) : 30,
    nextPageToken
  });
  return successResponse(res, result);
});

export const updateMeetingController = catchAsync(async (req, res) => {
  const result = await LiveClassesService.updateMeeting({
    id: req.params.id,
    updateData: req.body
  });
  return successResponse(res, result);
});

export const updateMeetingSettingsController = catchAsync(async (req, res) => {
  const { settings } = req.body;
  const result = await LiveClassesService.updateMeetingSettings({
    meetingId: req.params.meetingId,
    settings
  });
  return successResponse(res, { message: 'Meeting settings updated successfully', data: result });
});

export const deleteMeetingController = catchAsync(async (req, res) => {
  const result = await LiveClassesService.deleteMeeting(req.params.id);
  return successResponse(res, result);
});

export const endMeetingController = catchAsync(async (req, res) => {
  const result = await LiveClassesService.endMeeting(req.params.meetingId);
  return successResponse(res, result);
});

export const batchDeleteMeetingsController = catchAsync(async (req, res) => {
  const { meetingIds } = req.body;
  const result = await LiveClassesService.batchDeleteMeetings(meetingIds);

  const successfulDeletes = result.filter(r => r.success);
  const failedDeletes = result.filter(r => !r.success);

  return successResponse(res, {
    message: `Batch delete completed. Successful: ${successfulDeletes.length}, Failed: ${failedDeletes.length}`,
    data: {
      successful: successfulDeletes,
      failed: failedDeletes
    }
  });
});

export const getMeetingJoinDetailsController = catchAsync(async (req, res) => {
  const result = await LiveClassesService.getMeetingJoinDetails(req.params.meetingId);
  return successResponse(res, { data: result });
});

// 3. Student Actions
export const joinLiveClass = catchAsync(async (req, res) => {
  const joinUrl = await LiveClassesService.joinLiveClass({
    id: req.params.id,
    userId: req.user.id
  });
  return successResponse(res, { join: joinUrl });
});

export const getLiveClasses = catchAsync(async (req, res) => {
  const result = await LiveClassesService.getLiveClassesForStudent(req.user.id);
  return successResponse(res, { liveClasses: result });
});
