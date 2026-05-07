import jwt from 'jsonwebtoken';
import ApiError from './ApiError.js';

const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || '1h';
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '7d';

export const signAccessToken = (payload) => {
  if (!process.env.ACCESS_SECRET) throw new ApiError(500, 'ACCESS_SECRET not configured');
  return jwt.sign(payload, process.env.ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
};

export const signRefreshToken = (payload) => {
  if (!process.env.REFRESH_SECRET) throw new ApiError(500, 'REFRESH_SECRET not configured');
  return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid refresh token');
  }
};

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
