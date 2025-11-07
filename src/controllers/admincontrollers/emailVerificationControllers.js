

import Token from '../../models/token.js';
import User from '../../models/user.js';
import crypto from 'crypto';

import { getVerificationEmailHTML, getVerificationEmailHTMLOTP } from '../../utils/Email/generateHTML.js';
import { generateRawToken, isTokenMatch } from '../../utils/generateToken.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';

// Send verification email (creates user if needed)
export const sendVerificationEmail = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    // 1. Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, emailVerified: false });
    }

    // 2. Generate token
    const rawToken = generateRawToken();

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // 3. Store token in Token collection
    await Token.deleteMany({ userId: user._id, type: 'emailVerification' }); // cleanup old
    await Token.create({
      userId: user._id,
      token: rawToken,
      type: 'emailVerification',
      expiresAt,
    });

    // 4. Build verification URL
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?ivfm=${rawToken}&id=${user._id}`;
    console.log(verifyUrl, "verify")

    // 5. Send email
    await sendEmail({
      to: email,
      subject: 'Verify Your Email',
      html: getVerificationEmailHTML(name, verifyUrl, email),
    });

    res.status(200).json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    console.error('❌ Email verification error:', err);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
};


export const verifyEmail = async (req, res) => {
  const { ivfm, id } = req.query;
  if (!ivfm || !id) {
    return res.status(400).send("❌ Token and user ID are required");
  }

  try {
    // 1. Find token
    const tokenDoc = await Token.findOne({
      userId: id,
      type: "emailVerification",
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.redirect("/link-invalid"); // show friendly error page
    }

    // 2. Validate token
    const isValid = await isTokenMatch(ivfm, tokenDoc.token);
    if (!isValid) {
      return res.redirect("/link-invalid");
    }

    // 3. Mark user as verified
   
    const user = await User.findByIdAndUpdate(
      id,
      { emailVerified: true },
      { new: true, select: 'name email' } // return updated user with name & email
    );
    console.log(user, "iam user")

    // 4. Delete used tokens
    await Token.deleteMany({ userId: id, type: "emailVerification" });



    // Default: redirect to web success page
    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("❌ Verify email error:", err);
    return res.redirect("/error"); // fallback error page
  }
};



// Generate random OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};




export const sendVerificationEmailOTP = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    // 1. Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, emailVerified: false });
    }

    // 2. Generate OTP (6 digits)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 3. Store OTP in Token collection
    await Token.deleteMany({ userId: user._id, type: 'emailVerification' }); // cleanup old tokens
    await Token.create({
      userId: user._id,
      token: otp,
      type: 'emailVerification',
      expiresAt,
    });

    console.log(`OTP for ${email}: ${otp}`); // For development/testing

    // 4. Send email with OTP
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - OTP',
      html: getVerificationEmailHTMLOTP(name, otp, email),
    });

    res.status(200).json({
      message: 'Verification OTP sent. Please check your inbox.',
      userId: user._id // Send userId for verification endpoint
    });
  } catch (err) {
    console.error('❌ OTP email error:', err);
    res.status(500).json({ error: 'Failed to send verification OTP' });
  }
};

// Verify OTP endpoint


export const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    // Hash the incoming OTP to compare with stored hash
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const token = await Token.findOne({
      userId,
      token: hashedOTP, // Compare with hashed value
      type: 'emailVerification',
      expiresAt: { $gt: new Date() }
    });

    if (!token) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
const user = await User.findByIdAndUpdate(
      userId,
      { emailVerified: true },
      { new: true, select: 'name email' } // return updated user with name & email
    );
    console.log(user, "iam user")
    await Token.deleteMany({ userId: userId, type: "emailVerification" });
       res.status(200).json({
      message: 'Email verified successfully',
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('❌ OTP verification error:', err);
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
