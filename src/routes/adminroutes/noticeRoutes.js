import express from 'express';
import Notice from '../../models/Notice.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import verifyToken from '../../middlewares/authMiddleware.js';
import User from '../../models/user.js'; // Import your User model

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

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG) and documents (PDF, DOC, DOCX) are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File too large. Maximum size is 10MB.' 
      });
    }
  } else if (err) {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  next();
};

// Validation middleware for notices
const validateNotice = (req, res, next) => {
  const {
    title,
    description,
    targetAudience,
    batchName,
    userRole
  } = req.body;

  // Validate required fields
  if (!title || !description) {
    return res.status(400).json({ 
      success: false, 
      message: 'Title and description are required fields' 
    });
  }

  // Validate conditional fields based on target audience
  if (targetAudience === 'Batch Specific' && !batchName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Batch name is required for batch-specific notices' 
    });
  }

  if (targetAudience === 'Role Specific' && !userRole) {
    return res.status(400).json({ 
      success: false, 
      message: 'User role is required for role-specific notices' 
    });
  }

  // Validate scheduled notices
  if (req.body.isScheduled === 'true' || req.body.isScheduled === true) {
    if (!req.body.scheduledDateTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Scheduled date/time is required for scheduled notices' 
      });
    }

    const scheduledDate = new Date(req.body.scheduledDateTime);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Scheduled date must be in the future' 
      });
    }
  }

  // Validate expiry date
  if (req.body.expiryDate) {
    const expiry = new Date(req.body.expiryDate);
    if (expiry <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Expiry date must be in the future' 
      });
    }
  }

  next();
};


// @route   POST /api/notices
// @desc    Create a new notice
// @access  Admin
noticeRouter.post('/', verifyToken, verifyAdmin, upload.single('attachment'), handleMulterError, validateNotice, async (req, res) => {
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
      batchName,
      course,
      department
    } = req.body;

    // Create notice object
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

    // Add conditional fields based on target audience
    if (targetAudience === 'Batch Specific' && batchName) {
      noticeFields.batchName = batchName;
    }

    if (targetAudience === 'Course Specific' && course) {
      noticeFields.course = course;
    }

    if (targetAudience === 'Department' && department) {
      noticeFields.department = department;
    }

    // Handle tags
    if (tags) {
      noticeFields.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    }

    // Handle expiry date
    if (expiryDate) {
      noticeFields.expiryDate = new Date(expiryDate);
    }

    // Handle attachment
    if (req.file) {
      noticeFields.attachment = {
        path: req.file.path,
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size
      };
    }

    // Handle scheduling logic
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
      // Immediate publication
      noticeFields.isScheduled = false;
      noticeFields.status = 'published';
      noticeFields.publishedAt = new Date();
    }

    // Create and save notice
    const notice = new Notice(noticeFields);
    await notice.save();
    await notice.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: notice.status === 'scheduled' ? 'Notice scheduled successfully' : 'Notice published successfully',
      notice
    });

  } catch (error) {
    console.error('Error creating notice:', error);
    
    // Clean up uploaded file if notice creation failed
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error cleaning up file:', err);
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/notices
// @desc    Get all notices with filtering
// @access  Public (with optional authentication)
noticeRouter.get('/', async (req, res) => {
  try {
    const { 
      noticeType, 
      priority, 
      targetAudience,
      status,
      batchName,
      userRole,
      tags,
      search,
      sortBy = '-createdAt',
      limit = 20,
      page = 1,
      fromDate,
      toDate,
      activeOnly = 'true'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Basic filters
    if (noticeType) filter.noticeType = noticeType;
    if (priority) filter.priority = priority;
    if (targetAudience) filter.targetAudience = targetAudience;
    if (status) filter.status = status;
    if (batchName) filter.batchName = batchName;
    if (userRole) filter.userRole = userRole;
    
    // Tags filter
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagsArray.map(tag => tag.trim()) };
    }
    
    // Date range filter
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // For non-admin users, only show active notices
    if (!req.user?.isAdmin && activeOnly !== 'false') {
      filter.$and = [
        {
          $or: [
            { status: 'published' },
            { 
              status: 'scheduled',
              scheduledDateTime: { $lte: new Date() }
            }
          ]
        },
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: { $gte: new Date() } },
            { expiryDate: null }
          ]
        }
      ];
    }

    // Build sort object
    const sort = {};
    const sortField = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
    const sortOrder = sortBy.startsWith('-') ? -1 : 1;
    sort[sortField] = sortOrder;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = Math.min(parseInt(limit), 100);

    const notices = await Notice.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitValue)
      .populate('createdBy', 'name email');

    const total = await Notice.countDocuments(filter);

    res.json({
      success: true,
      count: notices.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limitValue),
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

// @route   GET /api/notices/user/me
// @desc    Get notices relevant to the current user
// @access  Private
noticeRouter.get('/user/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, page = 1 } = req.query;
    
    // Get current user details to determine which notices they should see
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter based on user role and other attributes
    const filter = {
      status: 'published',
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } },
        { expiryDate: null }
      ],
      $or: [
        // Notices for all users
        { targetAudience: 'All Students' },
        
        // Notices for specific user role
        { 
          targetAudience: 'Role Specific',
          userRole: user.role
        },
        
        // Add other audience logic as needed
        // For example, if you have batch-specific notices:
        // { 
        //   targetAudience: 'Batch Specific',
        //   batchName: user.batchName // Assuming you add this field to user model
        // }
      ]
    };

    const notices = await Notice.find(filter)
      .sort({ createdAt: -1 })
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
    console.error('Error fetching user notices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Keep the other routes (GET by ID, PUT, PATCH, DELETE, attachment, stats) 
// from the previous implementation, but remove department/course references

// @route   GET /api/notices/:id
// @desc    Get single notice by ID
// @access  Public
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

    // For non-admin users, check if notice is accessible
    if (!req.user?.isAdmin) {
      const isPublished = notice.status === 'published';
      const isScheduledAndVisible = notice.status === 'scheduled' && 
        (!notice.scheduledDateTime || notice.scheduledDateTime <= new Date());
      const isNotExpired = !notice.expiryDate || notice.expiryDate >= new Date();
      
      if (!isPublished && !isScheduledAndVisible || !isNotExpired) {
        return res.status(404).json({ 
          success: false, 
          message: 'Notice not found' 
        });
      }
    }

    res.json({
      success: true,
      notice
    });

  } catch (error) {
    console.error('Error fetching notice:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid notice ID' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update your Notice model to match your structure
// You'll need to update the Notice model to remove department/course fields
// and add batchName and userRole fields

export default noticeRouter;