import Notice from '../../../models/Notice.js';
import ApiError from '../../../utils/ApiError.js';

export class NotificationsService {
  static async createNotice({ title, description, noticeType = 'General Notification', priority = 'Medium', targetAudience = 'All Students', createdBy }) {
    if (!title || !description) {
      throw new ApiError(400, 'Title and description are required');
    }

    const notice = new Notice({
      title,
      description,
      noticeType,
      priority,
      targetAudience,
      createdBy,
      status: 'published',
      publishedAt: new Date()
    });

    await notice.save();
    await notice.populate('createdBy', 'name email');
    return notice;
  }

  static async getAllNotices() {
    const notices = await Notice.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    return notices;
  }
}

export default NotificationsService;
