// routes/noticeRoutes.js
import express from 'express';
import Notice from '../../models/notice.js';
// import { verifyAdmin } from '../middleware/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import verifyToken from '../../middlewares/authMiddleware.js';

const noticeRouter = express.Router();

// Configure multer for file uploads
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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) are allowed!'));
    }
  }
});

// @route   POST /api/notices
// @desc    Create a new notice
// @access  Admin
noticeRouter.post('/new', verifyToken, verifyAdmin, upload.single('image'), async (req, res) => {
  console.log('Creating new notice with data:', req.body);

  try {
    const {
      title,
      description,
      noticeType,
      priority,
      targetAudience,
      scheduleNotice,
      scheduledDateTime,
      sendPushNotification,
      sendEmailNotification
    } = req.body;

    // Validate required fields
    if (!title || !description || !noticeType || !priority || !targetAudience) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Validate title length
    if (title.length < 5) {
      return res.status(400).json({ message: 'Title must be at least 5 characters' });
    }

    // Validate description length
    if (description.length < 10) {
      return res.status(400).json({ message: 'Description must be at least 10 characters' });
    }

    // Validate scheduled date if scheduling is enabled
    if (scheduleNotice === 'true' && !scheduledDateTime) {
      return res.status(400).json({ message: 'Please select a scheduled date and time' });
    }

    // Create notice object
    const noticeFields = {
      title,
      description,
      noticeType,
      priority,
      targetAudience,
      sendPushNotification: sendPushNotification === 'true',
      sendEmailNotification: sendEmailNotification === 'true',
      createdBy: req.user.userId,
      status: 'pending'
    };

    // Add image if uploaded
    if (req.file) {
      noticeFields.image = {
        path: req.file.path,
        contentType: req.file.mimetype,
        originalName: req.file.originalname
      };
    }

    // Handle scheduling
    if (scheduleNotice === 'true') {
      noticeFields.isScheduled = true;
      noticeFields.scheduledDateTime = new Date(scheduledDateTime);
      noticeFields.status = 'scheduled';
    } else {
      noticeFields.status = 'published';
      noticeFields.publishedAt = new Date();
    }

    // Create and save notice
    const notice = new Notice(noticeFields);
    await notice.save();

    // TODO: Implement notification sending logic here
    // For push notifications and email notifications

    res.status(201).json({
      success: true,
      message: scheduleNotice === 'true' 
        ? 'Notice scheduled successfully' 
        : 'Notice published successfully',
      notice
    });

  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/notices
// @desc    Get all notices (with filtering)
// @access  Public (or protected based on your needs)
noticeRouter.get('/', async (req, res) => {
  try {
    const { 
      noticeType, 
      priority, 
      targetAudience,
      status,
      sortBy,
      limit = 10,
      page = 1
    } = req.query;

    // Build filter object
    const filter = {};
    if (noticeType) filter.noticeType = noticeType;
    if (priority) filter.priority = priority;
    if (targetAudience) filter.targetAudience = targetAudience;
    if (status) filter.status = status;

    // Only show published or scheduled notices to non-admins
    if (!req.user?.isAdmin) {
      filter.$or = [
        { status: 'published' },
        { status: 'scheduled', scheduledDateTime: { $lte: new Date() } }
      ];
    }

    // Build sort object
    const sort = {};
    if (sortBy) {
      const parts = sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by newest first
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notices = await Notice.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Notice.countDocuments(filter);

    res.json({
      success: true,
      count: notices.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      notices
    });

  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/notices/:id
// @desc    Get single notice by ID
// @access  Public (or protected based on your needs)
noticeRouter.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!notice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notice not found' 
      });
    }

    res.json({
      success: true,
      notice
    });

  } catch (error) {
    console.error('Error fetching notice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   PUT /api/notices/:id
// @desc    Update a notice
// @access  Admin
noticeRouter.put('/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      noticeType,
      priority,
      targetAudience,
      scheduleNotice,
      scheduledDateTime,
      sendPushNotification,
      sendEmailNotification
    } = req.body;

    // Find existing notice
    let notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notice not found' 
      });
    }

    // Validate required fields
    if (!title || !description || !noticeType || !priority || !targetAudience) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Update notice fields
    notice.title = title;
    notice.description = description;
    notice.noticeType = noticeType;
    notice.priority = priority;
    notice.targetAudience = targetAudience;
    notice.sendPushNotification = sendPushNotification === 'true';
    notice.sendEmailNotification = sendEmailNotification === 'true';

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (notice.image?.path) {
        fs.unlink(notice.image.path, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }
      
      notice.image = {
        path: req.file.path,
        contentType: req.file.mimetype,
        originalName: req.file.originalname
      };
    }

    // Handle scheduling changes
    if (scheduleNotice === 'true') {
      notice.isScheduled = true;
      notice.scheduledDateTime = new Date(scheduledDateTime);
      notice.status = 'scheduled';
      notice.publishedAt = undefined;
    } else {
      notice.isScheduled = false;
      notice.scheduledDateTime = undefined;
      notice.status = 'published';
      notice.publishedAt = notice.publishedAt || new Date();
    }

    // Save updated notice
    notice = await notice.save();

    res.json({
      success: true,
      message: 'Notice updated successfully',
      notice
    });

  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/notices/:id
// @desc    Delete a notice
// @access  Admin
noticeRouter.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notice not found' 
      });
    }

    // Delete associated image if exists
    if (notice.image?.path) {
      fs.unlink(notice.image.path, (err) => {
        if (err) console.error('Error deleting image:', err);
      });
    }

    await notice.remove();

    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/notices/image/:id
// @desc    Get notice image
// @access  Public
noticeRouter.get('/image/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice || !notice.image?.path) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    // Check if file exists
    if (!fs.existsSync(notice.image.path)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image file not found' 
      });
    }

    res.sendFile(path.resolve(notice.image.path));

  } catch (error) {
    console.error('Error fetching notice image:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default noticeRouter;