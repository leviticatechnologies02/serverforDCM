// src/routes/profileRoutes.js
import express from 'express';
import verifyToken from '../middlewares/authMiddleware.js';  // same as enrollment
import { getStudentProfile, getAdminProfile } from '../controllers/profileController.js';

const profileRouter = express.Router();

// 👩‍🎓 Student profile (protected by token)
profileRouter.get('/student/profile', verifyToken, getStudentProfile);

// 👨‍💼 Admin profile (protected by token, you can also add verifyAdmin if needed)
profileRouter.get('/admin/profile', verifyToken, getAdminProfile);

export default profileRouter;
