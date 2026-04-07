import User from '../../models/user.js';
import Token from '../../models/token.js';
import { generateRawToken, isTokenMatch, hashToken } from '../../utils/generateToken.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';
import { getPasswordResetEmailHTML } from '../../utils/Email/generateHTML.js';
import { createOTP, verifyOTP } from '../../utils/otp.js';


const RESET_TTL_MIN = Number(process.env.RESET_TTL_MIN || 15);

export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    // Prevent email enumeration
    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent",
      });
    }

    // 1. Generate token
    const rawToken = generateRawToken();
    const hashedToken = hashToken(rawToken);

    const expiresAt = new Date(
      Date.now() + RESET_TTL_MIN * 60 * 1000
    );

    // 2. Store token (delete old first)
    await Token.deleteMany({
      userId: user._id,
      type: "passwordReset",
    });

    await Token.create({
      userId: user._id,
      token: hashedToken, // ✅ store hashed
      type: "passwordReset",
      expiresAt,
    });

    // 3. Create reset URL (send RAW token)
    const uiBase =
      process.env.CLIENT_URL || "http://localhost:3000";

    const resetUrl = `${uiBase}/reset-password?rspd=${rawToken}&email=${encodeURIComponent(
      email
    )}`;

    // 4. Send email
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

    return res.json({
      message: "If that email exists, a reset link has been sent",
    });

  } catch (err) {
    console.error("❌ Forgot password error:", err);
    return res.status(500).json({
      message: "Failed to process request",
    });
  }
}



export async function resetPassword(req, res) {
  const { email, rspd, newPassword } = req.body;

  if (!email || !rspd || !newPassword) {
    return res.status(400).json({
      message: "Email, token, and newPassword are required",
    });
  }

  try {
    console.log("📥 Reset request:", { email });

    // 1. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // 2. Find valid token
    const tokenDoc = await Token.findOne({
      userId: user._id,
      type: "passwordReset",
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // 3. Validate token (raw → hash compare)
    const isValid = isTokenMatch(rspd, tokenDoc.token);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // 4. Update password (pre-save hook will hash)
    user.password = newPassword;
    await user.save();

    // 5. Delete used tokens
    await Token.deleteMany({
      userId: user._id,
      type: "passwordReset",
    });

    return res.json({
      message: "Password has been reset successfully",
    });

  } catch (err) {
    console.error("❌ Reset password error:", err);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Assuming user is attached to req from auth middleware

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  try {
    // Find the user
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password matches
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update to new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}





export const forgotPasswordOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    // Prevent email enumeration
    if (!user) {
      return res.json({ message: 'If that email exists, an OTP has been sent' });
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

    res.json({
      message: 'If that email exists, an OTP has been sent',
      userId: user._id,
    });
  } catch (err) {
    console.error('❌ Forgot password OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};


export const resetPasswordWithOTP = async (req, res) => {
  const { userId, otp, newPassword } = req.body;

  if (!userId || !otp || !newPassword) {
    return res.status(400).json({
      error: 'userId, otp, and newPassword are required',
    });
  }

  try {
    const isValid = await verifyOTP({
      userId,
      otp,
      type: 'passwordReset',
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (err) {
    console.error('❌ Reset password OTP error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

