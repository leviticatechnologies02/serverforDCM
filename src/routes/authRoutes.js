// src/routes/authRoutes.js
import express from 'express';
import { signup, login, verifyAuthToken } from '../controllers/authController.js';
import verifyToken from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js'; //  Cloudinary upload middleware
import { SendVerificationMail, VerifyEmail } from '../controllers/admincontrollers/emailVerificationControllers.js';

const authRouter = express.Router();

// 📝 Signup with profile image upload
authRouter.post('/signup', upload.single('profileImage'), signup);

// 🔑 Login
authRouter.post('/login', login);
authRouter.post('/send-verification-email',SendVerificationMail);
authRouter.get('/verify-email',VerifyEmail);

// 🔍 Verify token
authRouter.get('/verify', verifyToken, verifyAuthToken);

export default authRouter;
