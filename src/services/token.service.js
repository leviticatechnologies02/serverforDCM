import crypto from 'crypto';
import RefreshToken from '../models/refreshToken.js';
import { signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const createRefreshSession = async ({ userId, req, expiresInDays = 7 }) => {
  const payload = { id: userId };
  const token = signRefreshToken(payload);
  const tokenHash = hashToken(token);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const doc = await RefreshToken.create({
    user: userId,
    tokenHash,
    ip: req?.ip || req?.headers?.['x-forwarded-for'] || null,
    userAgent: req?.headers?.['user-agent'] || null,
    device: req?.body?.device || req?.headers?.['x-device'] || 'unknown',
    expiresAt
  });

  return { token, doc };
};

export const verifyRefreshSession = async (token) => {
  // verify signature
  const decoded = verifyRefreshToken(token);
  const tokenHash = hashToken(token);
  const doc = await RefreshToken.findOne({ tokenHash });
  if (!doc) throw new ApiError(401, 'Refresh token not found');
  if (doc.isRevoked) throw new ApiError(401, 'Refresh token revoked');
  if (doc.expiresAt && doc.expiresAt < new Date()) throw new ApiError(401, 'Refresh token expired');
  return { decoded, session: doc };
};

export const rotateRefreshToken = async ({ oldToken, userId, req }) => {
  const { session } = await verifyRefreshSession(oldToken);
  if (session.user.toString() !== userId.toString()) throw new ApiError(401, 'Invalid session for user');

  // revoke old
  session.isRevoked = true;
  session.revokedAt = new Date();
  await session.save();

  // create new session
  const { token, doc } = await createRefreshSession({ userId, req });
  return { token, doc };
};

export const revokeRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  const doc = await RefreshToken.findOne({ tokenHash });
  if (!doc) return null;
  doc.isRevoked = true;
  doc.revokedAt = new Date();
  await doc.save();
  return doc;
};

export const revokeAllUserSessions = async (userId) => {
  await RefreshToken.updateMany({ user: userId, isRevoked: false }, { isRevoked: true, revokedAt: new Date() });
};

export default {
  createRefreshSession,
  verifyRefreshSession,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions
};
