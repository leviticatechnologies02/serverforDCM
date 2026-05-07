import mongoose from 'mongoose';
import User from '../../../models/user.js';
import Token from '../../../models/token.js';
import ApiError from '../../../utils/ApiError.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';
import { signAccessToken } from '../../../utils/jwt.js';
import tokenService from '../../../services/token.service.js';
import logger from '../../../utils/logger.js';
import { generateRawToken, hashToken, isTokenMatch } from '../../../utils/token.js';
import { createOTP, verifyOTP } from '../../../utils/otp.js';
import { sendEmail } from '../../../utils/email/sendEmail.js';
import { getVerificationEmailHTML, getVerificationEmailHTMLOTP, getPasswordResetEmailHTML } from '../../../utils/email/generateHTML.js';

const RESET_TTL_MIN = Number(process.env.RESET_TTL_MIN || 15);

export class AuthService {
  static async completeSignup({ email, name, password, mobile, file }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(404, 'User not found');

    if (!user.emailVerified) throw new ApiError(403, 'Email not verified');

    if (user.password) throw new ApiError(409, 'User already signed up');

    user.name = name;
    user.password = password; // Schema pre-save hook will hash
    user.role = 'student';
    user.mobile = mobile;

    if (file?.buffer) {
      try {
        const result = await uploadToCloudinary(file.buffer, `${user.role}_profiles`);
        user.profileImage = { url: result.secure_url, publicId: result.public_id };
      } catch (err) {
        logger.warn('Cloudinary upload failed: ' + err.message);
      }
    } else if (file?.path) {
      // In case we receive physical path (from testing/legacy)
      try {
        const fs = await import('fs');
        const buffer = fs.readFileSync(file.path);
        const result = await uploadToCloudinary(buffer, `${user.role}_profiles`);
        user.profileImage = { url: result.secure_url, publicId: result.public_id };
      } catch (err) {
        logger.warn('Cloudinary path upload failed: ' + err.message);
      }
    }

    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage?.url || null
    };
  }

  static async login({ email, password, req }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const isValid = await user.comparePassword(password);
    if (!isValid) throw new ApiError(401, 'Invalid credentials');

    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.profileImage?.url || null
    };

    const accessToken = signAccessToken(payload);

    // Create persistent refresh session
    const { token: refreshToken } = await tokenService.createRefreshSession({ userId: user._id, req });

    // update last login
    user.lastLogin = new Date();
    user.lastLoginIp = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    await user.save().catch((e) => logger.warn('Failed to update lastLogin: ' + e.message));

    return { payload, accessToken, refreshToken };
  }

  static async refreshAccessToken(refreshToken) {
    try {
      const { decoded } = await tokenService.verifyRefreshSession(refreshToken);
      const account = await User.findById(decoded.id);
      if (!account) throw new ApiError(401, 'Invalid refresh token');

      const payload = {
        id: account._id.toString(),
        email: account.email,
        role: account.role,
        name: account.name
      };

      const newAccessToken = signAccessToken(payload);
      return { newAccessToken };
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }

  static async sendVerificationEmail({ email, name }) {
    if (!email || !name) {
      throw new ApiError(400, "Email and name are required");
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, emailVerified: false });
    }

    const rawToken = generateRawToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await Token.findOneAndUpdate(
      { userId: user._id, type: "emailVerification" },
      { token: hashedToken, expiresAt },
      { upsert: true, new: true }
    );

    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?ivfm=${rawToken}&id=${user._id}`;
    logger.info("🔗 Verify URL generated: " + verifyUrl);

    await sendEmail({
      to: email,
      subject: "Verify Your Email",
      html: getVerificationEmailHTML(name, verifyUrl, email),
    });

    return { message: "Verification email sent. Please check your inbox." };
  }

  static async verifyEmail({ ivfm, id }) {
    if (!ivfm || !id) {
      throw new ApiError(400, "Token and user ID are required");
    }

    const tokenDoc = await Token.findOne({
      userId: new mongoose.Types.ObjectId(id),
      type: "emailVerification",
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new ApiError(400, "Token not found or expired");
    }

    const isValid = isTokenMatch(ivfm, tokenDoc.token);
    if (!isValid) {
      throw new ApiError(400, "Token mismatch");
    }

    const user = await User.findByIdAndUpdate(
      id,
      { emailVerified: true },
      { new: true, select: "name email" }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    await Token.deleteMany({
      userId: user._id,
      type: "emailVerification",
    });

    return {
      message: "Email verified successfully",
      user: {
        name: user.name,
        email: user.email,
      },
    };
  }

  static async sendVerificationEmailOTP({ email, name }) {
    if (!email || !name) {
      throw new ApiError(400, "Email and name are required");
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, emailVerified: false });
    }

    const otp = await createOTP({
      userId: user._id,
      type: 'emailVerification',
      ttlMin: 10,
    });

    await sendEmail({
      to: email,
      subject: 'Verify Your Email - OTP',
      html: getVerificationEmailHTMLOTP(name, otp, email),
    });

    return {
      message: 'Verification OTP sent',
      userId: user._id,
    };
  }

  static async verifyEmailOTP({ userId, otp }) {
    if (!userId || !otp) {
      throw new ApiError(400, "User ID and OTP are required");
    }

    const isValid = await verifyOTP({
      userId,
      otp,
      type: 'emailVerification',
    });

    if (!isValid) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { emailVerified: true },
      { new: true, select: 'name email' }
    );

    return {
      message: 'Email verified successfully',
      user,
    };
  }

  static async forgotPassword({ email }) {
    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Prevent email enumeration
      return { message: "If that email exists, a reset link has been sent" };
    }

    const rawToken = generateRawToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);

    await Token.deleteMany({
      userId: user._id,
      type: "passwordReset",
    });

    await Token.create({
      userId: user._id,
      token: hashedToken,
      type: "passwordReset",
      expiresAt,
    });

    const uiBase = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${uiBase}/reset-password?rspd=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: getPasswordResetEmailHTML({
        name: user.name,
        email,
        resetUrl,
        appName: "Levitica Technologies",
        year: new Date().getFullYear(),
        expiresIn: `${RESET_TTL_MIN} minutes`,
      }),
    });

    return { message: "If that email exists, a reset link has been sent" };
  }

  static async resetPassword({ email, rspd, newPassword }) {
    if (!email || !rspd || !newPassword) {
      throw new ApiError(400, "Email, token, and newPassword are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    const tokenDoc = await Token.findOne({
      userId: user._id,
      type: "passwordReset",
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    const isValid = isTokenMatch(rspd, tokenDoc.token);
    if (!isValid) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = newPassword;
    await user.save();

    await Token.deleteMany({
      userId: user._id,
      type: "passwordReset",
    });

    return { message: "Password has been reset successfully" };
  }

  static async changePassword({ currentPassword, newPassword, userId }) {
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current password and new password are required');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  static async forgotPasswordOTP({ email }) {
    if (!email) {
      throw new ApiError(400, 'Email is required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'If that email exists, an OTP has been sent' };
    }

    const otp = await createOTP({
      userId: user._id,
      type: 'passwordReset',
      ttlMin: 15,
    });

    await sendEmail({
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <p>Hello ${user.name},</p>
        <p>Your password reset OTP is:</p>
        <h2>${otp}</h2>
        <p>This OTP expires in 15 minutes.</p>
      `,
    });

    return {
      message: 'If that email exists, an OTP has been sent',
      userId: user._id,
    };
  }

  static async resetPasswordWithOTP({ userId, otp, newPassword }) {
    if (!userId || !otp || !newPassword) {
      throw new ApiError(400, 'userId, otp, and newPassword are required');
    }

    const isValid = await verifyOTP({
      userId,
      otp,
      type: 'passwordReset',
    });

    if (!isValid) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password reset successfully' };
  }
}

export default AuthService;
