import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';
import User from '../models/user.js'
import { uploadToCloudinary } from '../utils/cloudinaryUtils.js';
import mongoose from 'mongoose';


const findAccountByEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (user) return { account: user, role: 'user' };

  const admin = await Admin.findOne({ email: normalizedEmail });
  if (admin) return { account: admin, role: 'admin' };

  return { account: null, role: null };
};

 const findAccountById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { account: null, role: null };
  }

  const user = await User.findById(id);
  if (user) return { account: user, role: 'user' };

  const admin = await Admin.findById(id);
  if (admin) return { account: admin, role: 'admin' };

  return { account: null, role: null };
};

export const signup = async (req, res) => {
  const { name, email, password, role = 'student',mobile } = req.body;

  try {
    const { account, role: source } = await findAccountByEmail(email);

    if (!account || !account.emailVerified) {
      return res.status(403).json({ error: 'Email not verified or user not found' });
    }

    if (account.password) {
      return res.status(409).json({ error: 'User already signed up' });
    }

    // Finalize account setup
    account.name = name;
    account.password = password; // Schema handles hashing
    account.role = role;
    account.mobile=mobile

    // Optional profile image upload
    if (req.file?.path) {
      try {
        const result = await uploadToCloudinary(req.file.path, `${role}_profiles`);
        account.profileImage = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } catch (err) {
        console.warn('⚠️ Cloudinary upload failed:', err.message);
      }
    }

    await account.save();

    res.status(201).json({
      message: `${role} account created successfully`,
      user: {
        id: account._id,
        name: account.name,
        email: account.email,
        role: account.role,
        profileImage: account.profileImage?.url || null,
      },
    });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ error: 'Signup failed. Please try again later.' });
  }
};





export const login = async (req, res) => {
  const ACCESS_SECRET = process.env.ACCESS_SECRET;
  const REFRESH_SECRET = process.env.REFRESH_SECRET;
  const { email, password } = req.body;

  try {
    const { account, role } = await findAccountByEmail(email);
    if (!account) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await account.comparePassword(password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = {
      id: account._id.toString(),
      email: account.email,
      role: account.role,
      name: account.name,
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('auth_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });



    res.status(200).json({
      message: 'Login successful',
      user: payload,
      token: accessToken,
      refreshToken,
      
    });

  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
};

// ---------------- VERIFY TOKEN ----------------
export const verifyAuthToken = async (req, res) => {
  const ACCESS_SECRET = process.env.ACCESS_SECRET;

  const token = req.cookies.auth_token;
  
  if (!token) return res.status(401).json({ verified: false });

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
  const { exp, iat, ...sanitizedUser } = decoded;
    
    res.status(200).json({ verified: true, user: sanitizedUser });
  } catch (err) {
    res.status(401).json({ verified: false });
  }
};

export const refreshToken = async (req, res) => {
  const token = req.cookies.refresh_token || req.body.refresh_token;
   const REFRESH_SECRET = process.env.REFRESH_SECRET;
   const ACCESS_SECRET = process.env.ACCESS_SECRET;
   console.log(req.cookies.refresh_token)
   console.log(token,"imatoken in refresh")

  if (!token) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    console.log(decoded,"iam decoded")
    const {account} = await findAccountById(decoded.id);
console.log(account,"iam account")
    if (!account) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const payload = {
      id: account._id.toString(),
      email: account.email,
      role: account.role,
      name: account.name,
    };

    const newAccessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '3h' });

    const isMobile = req.headers['user-agent']?.includes('Mobile');

    if (isMobile) {
      // 📱 Mobile: send token in response
      return res.status(200).json({ accessToken: newAccessToken });
    } else {
      // 🖥️ Web: set token in cookie
      res.cookie('auth_token', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 15 * 60 * 1000,
      });

      return res.status(200).json({ message: 'Access token refreshed' });
    }
  } catch (err) {
    console.error('❌ Refresh error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};