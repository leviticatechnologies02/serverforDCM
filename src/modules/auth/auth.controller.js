import { catchAsync } from '../../utils/catchAsync.js';
import AuthService from './auth.service.js';
import tokenService from '../../services/token.service.js';
import { successResponse } from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { verifyAccessToken } from '../../utils/jwt.js';

export const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, mobile } = req.body;
  const file = req.file;
  const user = await AuthService.completeSignup({ email, name, password, mobile, file });
  return successResponse(res, { message: 'Account created', data: { user }, status: 201 });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const { payload, accessToken, refreshToken } = await AuthService.login({ email, password, req });

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = { httpOnly: true, secure: true, sameSite: isProduction ? 'None' : 'Lax' };

  res.cookie('auth_token', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
  // store refresh token as httpOnly cookie. Rotation will issue new one.
  res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return successResponse(res, { message: 'Login successful', data: { user: payload, token: accessToken, refreshToken } });
});

export const verifyAuthToken = catchAsync(async (req, res) => {
  const token = req.cookies?.auth_token;
  if (!token) throw new ApiError(401, 'Missing token');
  // Let existing middleware decode if needed; here we simply verify
  const decoded = verifyAccessToken(token);
  const { exp, iat, ...sanitized } = decoded;
  return successResponse(res, { message: 'Token valid', data: { user: sanitized } });
});

export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refresh_token || req.body.refresh_token;
  if (!token) throw new ApiError(401, 'Missing refresh token');

  // Rotate refresh token for session security
  const { decoded } = await tokenService.verifyRefreshSession(token);
  const userId = decoded.id;
  // revoke old and create new
  const { token: newRefreshToken } = await tokenService.rotateRefreshToken({ oldToken: token, userId, req });
  const { newAccessToken } = await AuthService.refreshAccessToken(newRefreshToken);

  const isMobile = req.headers['user-agent']?.includes('Mobile');
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'None' : 'Lax' };
  res.cookie('refresh_token', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  if (isMobile) return successResponse(res, { message: 'Access token refreshed', data: { accessToken: newAccessToken } });

  res.cookie('auth_token', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  return successResponse(res, { message: 'Access token refreshed' });
});
