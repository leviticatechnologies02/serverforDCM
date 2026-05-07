import { catchAsync } from '../../../utils/catchAsync.js';
import AuthService from '../service/auth.service.js';
import tokenService from '../../../services/token.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { verifyAccessToken } from '../../../utils/jwt.js';

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
  const cookieOptions = { httpOnly: true, secure: isProduction, sameSite:'lax' };

  res.cookie('auth_token', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return successResponse(res, { message: 'Login successful', data: { user: payload, token: accessToken, refreshToken } });
});

export const verifyAuthToken = catchAsync(async (req, res) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
  if (!token) throw new ApiError(401, 'Missing token');

  const decoded = verifyAccessToken(token);
  const { exp, iat, ...sanitized } = decoded;
  return successResponse(res, { message: 'Token valid', data: { user: sanitized } });
});

export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refresh_token || req.body.refresh_token;
  if (!token) throw new ApiError(401, 'Missing refresh token');

  const { decoded } = await tokenService.verifyRefreshSession(token);
  const userId = decoded.id;

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

export const sendVerificationEmail = catchAsync(async (req, res) => {
  const { email, name } = req.body;
  const result = await AuthService.sendVerificationEmail({ email, name });
  return successResponse(res, result);
});

export const verifyEmail = catchAsync(async (req, res) => {
  const { ivfm, id } = req.query;
  const result = await AuthService.verifyEmail({ ivfm, id });
  return successResponse(res, result);
});

export const sendVerificationEmailOTP = catchAsync(async (req, res) => {
  const { email, name } = req.body;
  const result = await AuthService.sendVerificationEmailOTP({ email, name });
  return successResponse(res, result);
});

export const verifyEmailOTP = catchAsync(async (req, res) => {
  const { userId, otp } = req.body;
  const result = await AuthService.verifyEmailOTP({ userId, otp });
  return successResponse(res, result);
});

export const resendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.sendVerificationEmail({ email, name: email });
  return successResponse(res, result);
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword({ email });
  return successResponse(res, result);
});

export const resetPassword = catchAsync(async (req, res) => {
  const { email, rspd, newPassword } = req.body;
  const result = await AuthService.resetPassword({ email, rspd, newPassword });
  return successResponse(res, result);
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const result = await AuthService.changePassword({ currentPassword, newPassword, userId });
  return successResponse(res, result);
});

export const forgotPasswordOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.forgotPasswordOTP({ email });
  return successResponse(res, result);
});

export const resetPasswordWithOTP = catchAsync(async (req, res) => {
  const { userId, otp, newPassword } = req.body;
  const result = await AuthService.resetPasswordWithOTP({ userId, otp, newPassword });
  return successResponse(res, result);
});
