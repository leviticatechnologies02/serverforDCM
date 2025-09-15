// routes/noticeRoutes/noticeRoute.js
import express from 'express';
import Notice from '../../models/Notice.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import verifyToken from '../../middlewares/authMiddleware.js';
import User from '../../models/user.js'; 
import { io } from '../../socket.js'; // ✅ import socket instance

const noticeRouter = express.Router();

// -------------------- Multer Config --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/notices';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error('Only JPEG, JPG, PNG, PDF, DOC, DOCX allowed!'));
};

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max size 10MB.' });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// -------------------- Validation --------------------
const validateNotice = (req, res, next) => {
  const { title, description, targetAudience, batchName } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required' });
  }
  if (targetAudience === 'Batch Specific' && !batchName) {
    return res.status(400).json({ success: false, message: 'Batch name is required' });
  }
  if (req.body.isScheduled === 'true' || req.body.isScheduled === true) {
    if (!req.body.scheduledDateTime) {
      return res.status(400).json({ success: false, message: 'Scheduled date/time is required' });
    }
    const scheduledDate = new Date(req.body.scheduledDateTime);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Scheduled date must be in the future' });
    }
  }
  if (req.body.expiryDate) {
    const expiry = new Date(req.body.expiryDate);
    if (expiry <= new Date()) {
      return res.status(400).json({ success: false, message: 'Expiry date must be in the future' });
    }
  }
  next();
};

// -------------------- Routes --------------------

// POST → Create Notice
noticeRouter.post(
  '/',
  verifyToken,
  verifyAdmin,
  upload.single('attachment'),
  handleMulterError,
  validateNotice,
  async (req, res) => {
    try {
      const {
        title,
        description,
        noticeType = 'General Notification',
        priority = 'Medium',
        targetAudience = 'All Students',
        isScheduled = false,
        scheduledDateTime,
        sendPushNotification = false,
        sendEmailNotification = false,
        tags,
        expiryDate,
        batchName
      } = req.body;

      const noticeFields = {
        title,
        description,
        noticeType,
        priority,
        targetAudience,
        sendPushNotification: sendPushNotification === 'true' || sendPushNotification === true,
        sendEmailNotification: sendEmailNotification === 'true' || sendEmailNotification === true,
        createdBy: req.user.userId,
        status: 'draft'
      };

      if (targetAudience === 'Batch Specific' && batchName) {
        noticeFields.batchName = batchName;
      }

      if (tags) {
        noticeFields.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
      }
      if (expiryDate) {
        noticeFields.expiryDate = new Date(expiryDate);
      }
      if (req.file) {
        noticeFields.attachment = {
          path: req.file.path,
          contentType: req.file.mimetype,
          originalName: req.file.originalname,
          size: req.file.size
        };
      }

      const isScheduledBool = isScheduled === 'true' || isScheduled === true;
      if (isScheduledBool && scheduledDateTime) {
        const scheduledDate = new Date(scheduledDateTime);
        noticeFields.isScheduled = true;
        noticeFields.scheduledDateTime = scheduledDate;
        noticeFields.status = scheduledDate > new Date() ? 'scheduled' : 'published';
        if (scheduledDate <= new Date()) {
          noticeFields.publishedAt = new Date();
        }
      } else {
        noticeFields.isScheduled = false;
        noticeFields.status = 'published';
        noticeFields.publishedAt = new Date();
      }

      const notice = new Notice(noticeFields);
      await notice.save();
      await notice.populate('createdBy', 'name email');

      // -------------------- SOCKET EMIT --------------------
      if (notice.status === 'published') {
        if (notice.targetAudience === 'All Students') {
          io.emit('newNotice', notice); // 🔊 broadcast globally
        } else if (notice.targetAudience === 'Batch Specific' && notice.batchName) {
          io.to(`batch_${notice.batchName}`).emit('newNotice', notice); // 🔊 send to batch
        } else if (notice.targetAudience === 'Admins') {
          io.to(`role_admin`).emit('newNotice', notice); // 🔊 send only to admins
        }
      }

      res.status(201).json({
        success: true,
        message: notice.status === 'scheduled' ? 'Notice scheduled successfully' : 'Notice published successfully',
        notice
      });

    } catch (error) {
      console.error('Error creating notice:', error);
      if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

// GET → All Notices (with filters)
noticeRouter.get('/', async (req, res) => {
  try {
    const { noticeType, priority, targetAudience, status, batchName, tags, search, sortBy = '-createdAt', limit = 20, page = 1, fromDate, toDate, activeOnly = 'true' } = req.query;

    const filter = {};
    if (noticeType) filter.noticeType = noticeType;
    if (priority) filter.priority = priority;
    if (targetAudience) filter.targetAudience = targetAudience;
    if (status) filter.status = status;
    if (batchName) filter.batchName = batchName;

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagsArray.map(tag => tag.trim()) };
    }
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (!req.user?.isAdmin && activeOnly !== 'false') {
      filter.$and = [
        { $or: [{ status: 'published' }, { status: 'scheduled', scheduledDateTime: { $lte: new Date() } }] },
        { $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: new Date() } }, { expiryDate: null }] }
      ];
    }

    const sortField = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
    const sortOrder = sortBy.startsWith('-') ? -1 : 1;
    const sort = { [sortField]: sortOrder };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = Math.min(parseInt(limit), 100);

    const notices = await Notice.find(filter).sort(sort).skip(skip).limit(limitValue).populate('createdBy', 'name email');
    const total = await Notice.countDocuments(filter);

    res.json({ success: true, count: notices.length, total, page: parseInt(page), pages: Math.ceil(total / limitValue), notices });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET → Notices for current user
noticeRouter.get('/user/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      status: 'published',
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: new Date() } }, { expiryDate: null }],
      $or: [
        { targetAudience: 'All Students' },
        { targetAudience: 'Admins', ...(user.role === 'admin' ? {} : { _id: null }) },
        { targetAudience: 'Batch Specific', batchName: user.batch ? user.batch.toString() : null }
      ]
    };

    const notices = await Notice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('createdBy', 'name email');
    const total = await Notice.countDocuments(filter);

    res.json({ success: true, count: notices.length, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), notices });
  } catch (error) {
    console.error('Error fetching user notices:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET → Single Notice by ID
noticeRouter.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('createdBy', 'name email');
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    if (!req.user?.isAdmin) {
      const isPublished = notice.status === 'published';
      const isScheduledAndVisible = notice.status === 'scheduled' && (!notice.scheduledDateTime || notice.scheduledDateTime <= new Date());
      const isNotExpired = !notice.expiryDate || notice.expiryDate >= new Date();
      if ((!isPublished && !isScheduledAndVisible) || !isNotExpired) {
        return res.status(404).json({ success: false, message: 'Notice not found' });
      }
    }

    res.json({ success: true, notice });
  } catch (error) {
    console.error('Error fetching notice:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid notice ID' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default noticeRouter;
