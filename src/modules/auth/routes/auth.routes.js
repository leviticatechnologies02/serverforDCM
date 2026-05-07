import express from 'express';
import rateLimit from 'express-rate-limit';
import { upload } from '../../../middlewares/upload.middleware.js';
import { verifyToken } from '../../../middlewares/auth.middleware.js';
import { validateSchema } from '../../../middlewares/validation.middleware.js';
import { signupSchema, loginSchema } from '../validation/auth.validation.js';
import {
  signup,
  login,
  verifyAuthToken,
  refreshToken,
  sendVerificationEmail,
  verifyEmail,
  sendVerificationEmailOTP,
  verifyEmailOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  forgotPasswordOTP,
  resetPasswordWithOTP
} from '../controller/auth.controller.js';

const authRouter = express.Router();

// Rate limiters for auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts, try again later' });
const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many signups, try later' });

// Signup with profile image upload (memory stream uploaded to Cloudinary via service)
authRouter.post('/signup', signupLimiter, upload.single('profileImage'), validateSchema(signupSchema), signup);

// Login
authRouter.post('/login', authLimiter, validateSchema(loginSchema), login);

// Verification Email
authRouter.post('/send-verification-email', sendVerificationEmail);
authRouter.post('/send-verification-email-otp', sendVerificationEmailOTP);

authRouter.get('/verify-email', verifyEmail);
authRouter.post('/verify-email-otp', verifyEmailOTP);
authRouter.post('/resend-email-otp', resendOTP);

// Token Verification & Refresh
authRouter.get('/verify', verifyToken, verifyAuthToken);
authRouter.post('/refresh', refreshToken);

// Password Management
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/forgot-password-otp', authLimiter, forgotPasswordOTP);
authRouter.post('/reset-password', authLimiter, resetPassword);
authRouter.post('/reset-password-otp', authLimiter, resetPasswordWithOTP);
authRouter.post('/change-password', verifyToken, changePassword);

export default authRouter;
