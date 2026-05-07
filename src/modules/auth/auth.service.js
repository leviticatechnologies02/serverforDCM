import User from '../../models/user.js';
import ApiError from '../../utils/ApiError.js';
import { uploadToCloudinary } from '../../utils/cloudinaryUtils.js';
import { signAccessToken } from '../../utils/jwt.js';
import tokenService from '../../services/token.service.js';
import logger from '../../utils/logger.js';

export class AuthService {
  static async completeSignup({ email, name, password, mobile, file }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(404, 'User not found');

    if (!user.emailVerified) throw new ApiError(403, 'Email not verified');

    if (user.password) throw new ApiError(409, 'User already signed up');

    user.name = name;
    user.password = password; // Schema will hash
    user.role = 'student';
    user.mobile = mobile;

    if (file?.path) {
      try {
        const result = await uploadToCloudinary(file.path, `${user.role}_profiles`);
        user.profileImage = { url: result.secure_url, publicId: result.public_id };
      } catch (err) {
        console.warn('Cloudinary upload failed', err.message);
      }
    }

    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage?.url || null
    };
  }

  static async login({ email, password, req }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const isValid = await user.comparePassword(password);
    if (!isValid) throw new ApiError(401, 'Invalid credentials');

    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.profileImage?.url || null
    };

    const accessToken = signAccessToken(payload);

    // Create persistent refresh session
    const { token: refreshToken } = await tokenService.createRefreshSession({ userId: user._id, req });

    // update last login
    user.lastLogin = new Date();
    user.lastLoginIp = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    await user.save().catch((e) => logger.warn('Failed to update lastLogin', e.message));

    return { payload, accessToken, refreshToken };
  }

  static async refreshAccessToken(refreshToken) {
    try {
      const { decoded } = await tokenService.verifyRefreshSession(refreshToken);
      const account = await User.findById(decoded.id);
      if (!account) throw new ApiError(401, 'Invalid refresh token');

      const payload = {
        id: account._id.toString(),
        email: account.email,
        role: account.role,
        name: account.name
      };

      const newAccessToken = signAccessToken(payload);
      return { newAccessToken };
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }
}

export default AuthService;
