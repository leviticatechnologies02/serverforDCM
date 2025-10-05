import User from '../../models/user.js';
import Token from '../../models/token.js';
import { generateRawToken ,isTokenMatch} from '../../utils/generateToken.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';
import { getPasswordResetEmailHTML } from '../../utils/Email/generateHTML.js';

const RESET_TTL_MIN = Number(process.env.RESET_TTL_MIN || 15);

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = await User.findOne({ email });
  // Always respond 200 to prevent email enumeration
  if (!user) return res.json({ message: 'Email is not found in our records' });

  const rawToken = generateRawToken();
 
  const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);

  // Remove any existing reset tokens for this user
  await Token.deleteMany({ userId: user._id, type: 'passwordReset' });

  await Token.create({
    userId: user._id,
    token: rawToken,
    type: 'passwordReset',
    expiresAt,
  });

  const uiBase = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetUrl = `${uiBase}/reset-password?rspd=${rawToken}&email=${encodeURIComponent(email)}`;

  try {
    await sendEmail({ to:email,
      subject:"Password Reset Request",
      html:getPasswordResetEmailHTML({name:user.name,
        email:email,
        resetUrl,
        appName:'Design Career Metrics aka DCM',
        year:new Date().getFullYear(),
        expiresIn:`${RESET_TTL_MIN} minutes`})
    });
  } catch (e) {
    await Token.deleteMany({ userId: user._id, type: 'passwordReset' });
    return res.status(500).json({ message: 'Failed to send reset email' });
  }

  return res.json({ message: 'If that email exists, a reset link has been sent' });
}


export async function resetPassword(req, res) {
  const { email, rspd, newPassword } = req.body;
  if (!email || !rspd || !newPassword) {
    return res.status(400).json({ message: 'Email, token, and newPassword are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  const tokenDocs = await Token.find({
    userId: user._id,
    type: 'passwordReset',
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDocs.length) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }
console.log(tokenDocs)
 const validToken = tokenDocs.find(doc => isTokenMatch(rspd, doc.token));

  if (!validToken) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  user.password = newPassword; // pre-save hook will hash
  await user.save();

  await Token.deleteMany({ userId: user._id, type: 'passwordReset' });

  return res.json({ message: 'Password has been reset successfully' });
}
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id; // Assuming user is attached to req from auth middleware

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  try {
    // Find the user
    const user = await User.findById(userId);
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