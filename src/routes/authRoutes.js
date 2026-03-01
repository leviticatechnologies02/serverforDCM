// src/routes/authRoutes.js
import express from 'express';
import { signup, login, verifyAuthToken, refreshToken } from '../controllers/authController.js';
import verifyToken from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js'; //  Cloudinary upload middleware
import { resendOTP, sendVerificationEmail, sendVerificationEmailOTP, verifyEmail, verifyEmailOTP } from '../controllers/admincontrollers/emailVerificationControllers.js';
import { changePassword, forgotPassword, forgotPasswordOTP, resetPassword, resetPasswordWithOTP } from '../controllers/studentcontrollers/forgotPasswordControllers.js';

const authRouter = express.Router();

//  Signup with profile image upload
authRouter.post('/signup', upload.single('profileImage'), signup);

//  Login
authRouter.post('/login', login);
authRouter.post('/send-verification-email',sendVerificationEmail);
authRouter.post('/send-verification-email-otp',sendVerificationEmailOTP);

authRouter.get('/verify-email',verifyEmail);
authRouter.post('/verify-email-otp',verifyEmailOTP)
authRouter.post('/resend-email-otp',resendOTP)

//  Verify token
authRouter.get('/verify', verifyToken, verifyAuthToken);
authRouter.post("/refresh",refreshToken)

// password changes
authRouter.post('/forgot-password',forgotPassword)
authRouter.post('/forgot-password-otp',forgotPasswordOTP)
authRouter.post('/reset-password', resetPassword)
authRouter.post('/reset-password-otp', resetPasswordWithOTP)
authRouter.post('/change-password', verifyToken,changePassword)

export default authRouter;
