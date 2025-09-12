

import Token from '../../models/token.js';
import User from '../../models/user.js';

import { getVerificationEmailHTML } from '../../utils/Email/generateHTML.js';
import { generateRawToken,isTokenMatch} from '../../utils/generateToken.js';
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

    // 5. Send email
    await sendEmail({
      from: `"Design Career Metric" <verification@designcareermetrics.com>`,
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

// Verify email using token
export const verifyEmail = async (req, res) => {
  const { ivfm, id } = req.query;
  console.log(req.query)
  if (!ivfm || !id) {
    return res.status(400).json({ error: 'Token and user ID are required' });
  }

  try {
    const tokenDoc = await Token.findOne({
      userId: id,
      type: 'emailVerification',
      expiresAt: { $gt: new Date() },
    });

    console.log(tokenDoc,"iam tokndoc")
    if (!tokenDoc) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const isValid = await isTokenMatch(ivfm, tokenDoc.token);
    console.log(isValid,"Imavalid")
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { emailVerified: true },
      { new: true, select: 'name email' } // return updated user with name & email
    );
console.log(user,"iam user")
    await Token.deleteMany({ userId: id, type: 'emailVerification' });

    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('❌ Verify email error:', err);
    res.status(500).json({ error: 'Email verification failed' });
  }
};