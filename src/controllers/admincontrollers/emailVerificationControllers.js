import Token from '../../models/token.js';
import User from '../../models/user.js';
import { getVerificationEmailHTML, getVerificationEmailHTMLOTP } from '../../utils/Email/generateHTML.js';
import { generateRawToken, hashToken, isTokenMatch } from '../../utils/generateToken.js';
import { createOTP, verifyOTP } from '../../utils/otp.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';
import mongoose from "mongoose";


export const sendVerificationEmail = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required" });
  }

  try {
    // 1. Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, emailVerified: false });
    }

    // 2. Generate token
    const rawToken = generateRawToken();
    const hashedToken = hashToken(rawToken);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // 3. Store token (UPSERT - better than deleteMany)
    await Token.findOneAndUpdate(
      { userId: user._id, type: "emailVerification" },
      {
        token: hashedToken, // ✅ store hashed token
        expiresAt,
      },
      { upsert: true, new: true }
    );

    // 4. Build verification URL
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?ivfm=${rawToken}&id=${user._id}`;
    console.log("🔗 Verify URL:", verifyUrl);

    // 5. Send email
    await sendEmail({
      to: email,
      subject: "Verify Your Email",
      html: getVerificationEmailHTML(name, verifyUrl, email),
    });

    return res.status(200).json({
      message: "Verification email sent. Please check your inbox.",
    });

  } catch (err) {
    console.error("❌ Email verification error:", err);
    return res.status(500).json({
      error: "Failed to send verification email",
    });
  }
};


export const verifyEmail = async (req, res) => {
  const { ivfm, id } = req.query;

  if (!ivfm || !id) {
    return res.status(400).json({ message: "Token and user ID are required" });
  }

  try {
    console.log("📥 Incoming:", { ivfm, id });

    // 0. Check if user is already verified (handles email pre-fetch bots)
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(400).json({ message: "User not found." });
    }
    if (existingUser.emailVerified) {
      console.log("✅ User already verified (early exit).");
      return res.status(200).json({
        message: "Email verified successfully",
        user: {
          name: existingUser.name,
          email: existingUser.email,
        },
      });
    }

    // 1. Find token (convert id → ObjectId ✅)
    const tokenDoc = await Token.findOne({
      userId: new mongoose.Types.ObjectId(id),
      type: "emailVerification",
      expiresAt: { $gt: new Date() },
    });

    console.log("🔍 TokenDoc:", tokenDoc);

    if (!tokenDoc) {
      console.log("❌ Token not found or expired");
      return res.status(400).json({ message: "The verification link is invalid or has already been used." });
    }

    // 2. Validate token
    const isValid = isTokenMatch(ivfm, tokenDoc.token);

    if (!isValid) {
      console.log("❌ Token mismatch");
      return res.status(400).json({ message: "The verification link is invalid." });
    }

    // 3. Mark user verified
    const user = await User.findByIdAndUpdate(
      id,
      { emailVerified: true },
      { new: true, select: "name email" }
    );

    console.log("✅ Verified User:", user);

    // 4. Delete token after use
    await Token.deleteMany({
      userId: user._id,
      type: "emailVerification",
    });

    // 5. Success response (or redirect to frontend success page)
    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("❌ Verify email error:", err);
    return res.status(500).json({ message: "Internal server error during verification." });
  }
};



export const sendVerificationEmailOTP = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, emailVerified: false });
    }

    const otp = await createOTP({
      userId: user._id,
      type: 'emailVerification',
      ttlMin: 10,
    });
    console.log(otp, "from create otp")

    await sendEmail({
      to: email,
      subject: 'Verify Your Email - OTP',
      html: getVerificationEmailHTMLOTP(name, otp, email),
    });

    res.status(200).json({
      message: 'Verification OTP sent',
      userId: user._id,
    });
  } catch (err) {
    console.error('❌ Email OTP error:', err);
    res.status(500).json({ error: 'Failed to send verification OTP' });
  }
};


export const verifyEmailOTP = async (req, res) => {
  const { userId, otp } = req.body;
  console.log(userId, otp)

  try {
    const isValid = await verifyOTP({
      userId,
      otp,
      type: 'emailVerification',
    });
    console.log(isValid, 'iam valid checkinv')

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { emailVerified: true },
      { new: true, select: 'name email' }
    );

    res.status(200).json({
      message: 'Email verified successfully',
      user,
    });
  } catch (err) {
    console.error('❌ Verify email OTP error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};



// Resend OTP endpoint
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Call the same sendVerificationEmail logic
    await sendVerificationEmail(req, res);
  } catch (err) {
    console.error('❌ Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};
