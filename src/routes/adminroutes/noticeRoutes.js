import express from 'express';
import Notice from '../../models/Notice.js';
import { verifyAdmin } from '../../middlewares/verifyMiddleware.js';
import verifyToken from '../../middlewares/authMiddleware.js';
 
const noticeRouter = express.Router();
 
// POST - Create Notice
noticeRouter.post(
  '/create',
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const {
        title,
        description,
        noticeType = 'General Notification',
        priority = 'Medium',
        targetAudience = 'All Students',
      } = req.body;
 
      // Basic validation
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }
 
      const notice = new Notice({
        title,
        description,
        noticeType,
        priority,
        targetAudience,
        createdBy: req.userAccount.user.id,
        status: 'published',
        publishedAt: new Date(),
      });
 
      await notice.save();
      await notice.populate('createdBy', 'name email');
 
      res.status(201).json({
        success: true,
        message: 'Notice published successfully',
        notice
      });
 
    } catch (error) {
      console.error('Error creating notice:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);
 
// GET - All Notices
noticeRouter.get('/', async (req, res) => {
  try {
    const notices = await Notice.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
 
    res.json({
      success: true,
      notices
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
 
export default noticeRouter;