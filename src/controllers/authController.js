import jwt from 'jsonwebtoken';
import User from '../models/user.js'
import { uploadToCloudinary } from '../utils/cloudinaryUtils.js';




export const signup = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Email not verified or user not found' });
    }

    if (user.password) {
      return res.status(409).json({ error: 'User already signed up' });
    }

    // Finalize account setup
    user.name = name;
    user.password = password; // Schema handles hashing
    user.role = 'student';
    user.mobile = mobile

    // Optional profile image upload
    if (req.file?.path) {
      try {
        const result = await uploadToCloudinary(req.file.path, `${user.role}_profiles`);
        user.profileImage = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } catch (err) {
        console.warn('⚠️ Cloudinary upload failed:', err.message);
      }
    }

    await user.save();

    res.status(201).json({
      message: `${user.role} account created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage?.url || null,
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
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await user.comparePassword(password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });




    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.profileImage?.url || null,
    };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: true, 
      sameSite: isProduction ? "None" : "Lax", // ✅ None for prod, Lax for local
    };

    res.cookie("auth_token", accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie("refresh_token", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

  if (!token) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);

    const account = await User.findById(decoded.id);

    if (!account) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const payload = {
      id: account._id.toString(),
      email: account.email,
      role: account.role,
      name: account.name,
    };

    const newAccessToken = jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: '3h',
    });

    const isMobile = req.headers['user-agent']?.includes('Mobile');

    if (isMobile) {
      return res.status(200).json({ accessToken: newAccessToken });
    } else {
      res.cookie('auth_token', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 15 * 60 * 1000,
      });

      return res.status(200).json({
        message: 'Access token refreshed',
      });
    }
  } catch (err) {
    console.error('❌ Refresh error:', err.message);
    return res.status(401).json({
      error: 'Invalid or expired refresh token',
    });
  }
};