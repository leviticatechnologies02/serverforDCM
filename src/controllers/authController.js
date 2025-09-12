import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';
import User from '../models/user.js';
import { uploadToCloudinary } from '../utils/cloudinaryUtils.js';

export const signup = async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.emailVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    if (user.password) {
      return res.status(409).json({ error: 'User already signed up' });
    }

    // ✅ No manual hashing — let schema pre-save hook handle it
    user.password = password;
    user.role = role;

    // Optional profile image
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, `${role}_profiles`);
        user.profileImage = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } catch (err) {
        console.error('Image upload failed:', err.message);
      }
    }

    await user.save(); // password will be hashed here automatically

    const token = jwt.sign(
      { userId: user._id.toString(), email, name: user.name, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      message: `${role} created successfully`,
      user,
      token,
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ error: 'Signup failed' });
  }
};




const findAccountByEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (user) return { account: user, role: 'user' };

  const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');
  if (admin) return { account: admin, role: 'admin' };

  return { account: null, role: null };
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)

  try {
    const { account, role } = await findAccountByEmail(email);
    console.log(account,"iamacc")
    if (!account) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await account.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        userId: account._id.toString(),
        email: account.email,
        role: account.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: account._id.toString(),
        name: account.name,
        email: account.email,
        role: account.role,
        profileImage: account.profileImage?.url || null,
      },
      source: role,
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
};

// ---------------- VERIFY TOKEN ----------------
export const verifyAuthToken = async (req, res) => {
  const { user } = req.userAccount || {};

  res.status(200).json({
    verified: req.authStatus === 'verified',
    token: req.headers.authorization?.split(' ')[1],
    user: {
      id: user?._id?.toString() || user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      profileImage: user?.profileImage?.url || null, // ✅ safe optional chaining
    },
  });
};
