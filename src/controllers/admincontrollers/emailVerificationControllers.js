import crypto from 'crypto';
import User from '../../models/user.js';
import sendEmail from '../../utils/sendEmail.js';


export const SendVerificationMail= async (req, res) => {
  const { email,name } = req.body;
console.log(req.body)
  try {
    // 1. Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name,email, isVerified: false });
    }

    // 2. Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.verificationTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // 3. Send email
    await sendEmail(email, 'Verify your email', token,name);

    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending email', error: err.message });
  }
}
export const VerifyEmail=async (req, res) => {
    console.log("iam email-verify")
    console.log(req.query)
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ message: 'Missing token or email' });
    }

    // Find user with matching token and not expired
    const user = await User.findOne({
      email,
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() } // expiry in the future
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully!',name:user.name,email:user.email});
  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ message: 'Server error during verification' });
  }
}

