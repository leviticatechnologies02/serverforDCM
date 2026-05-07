import { catchAsync } from '../../../utils/catchAsync.js';
import NotificationsService from '../service/notifications.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

export const createNotice = catchAsync(async (req, res) => {
  const { title, description, noticeType, priority, targetAudience } = req.body;
  const notice = await NotificationsService.createNotice({
    title,
    description,
    noticeType,
    priority,
    targetAudience,
    createdBy: req.user?.id
  });
  return successResponse(res, { message: 'Notice published successfully', notice }, 201);
});

export const getAllNotices = catchAsync(async (req, res) => {
  const notices = await NotificationsService.getAllNotices();
  return successResponse(res, { notices });
});
