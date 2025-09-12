import User from '../../models/user.js';
import Token from '../../models/Token.js';
import { sendPasswordResetEmail } from '../../utils/authEmail.js';
import { generateRawToken, hashToken ,isTokenMatch} from '../../utils/generateToken.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';
import { getPasswordResetEmailHTML } from '../../utils/Email/generateHTML.js';

const RESET_TTL_MIN = Number(process.env.RESET_TTL_MIN || 15);

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = await User.findOne({ email });
  // Always respond 200 to prevent email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent' });

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
  if (!email || !token || !newPassword) {
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

 const validToken = tokenDocs.find(doc => isTokenMatch(token, doc.token));

  if (!validToken) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  user.password = newPassword; // pre-save hook will hash
  await user.save();

  await Token.deleteMany({ userId: user._id, type: 'passwordReset' });

  return res.json({ message: 'Password has been reset successfully' });
}