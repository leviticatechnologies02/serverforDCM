// src/routes/authRoutes.js
import express from 'express';
import { signup, login, verifyAuthToken, refreshToken } from '../controllers/authController.js';
import verifyToken from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js'; //  Cloudinary upload middleware
import { sendVerificationEmail, verifyEmail } from '../controllers/admincontrollers/emailVerificationControllers.js';
import { forgotPassword, resetPassword } from '../controllers/studentcontrollers/forgotPasswordControllers.js';

const authRouter = express.Router();

// 📝 Signup with profile image upload
authRouter.post('/signup', upload.single('profileImage'), signup);

// 🔑 Login
authRouter.post('/login', login);
authRouter.post('/send-verification-email',sendVerificationEmail);
authRouter.get('/verify-email',verifyEmail);

// 🔍 Verify token
authRouter.get('/verify', verifyToken, verifyAuthToken);
authRouter.post("/refresh",refreshToken)
// password changes
authRouter.post('/forgot-password',forgotPassword)
authRouter.post('/reset-password', resetPassword)

export default authRouter;
