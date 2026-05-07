import { verifyAccessToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/user.js';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
    if (!token) throw new ApiError(401, 'Authentication required');
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'User not found');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Backward compatible alias
export const verifyToken = requireAuth;

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(user.role)) return next(new ApiError(403, 'Insufficient privileges'));
    next();
  };
};

export const requireRole = requireRoles;

// Backward compatible specific roles
export const verifyAdmin = requireRoles('admin', 'superadmin');
export const verifySuperAdmin = requireRoles('superadmin');
export const verifyStudent = requireRoles('student');
export const requireAdmin = requireRoles('admin', 'superadmin');
export const requireMentor = requireRoles('mentor');
export const requireStudent = requireRoles('student');

export default {
  requireAuth,
  verifyToken,
  requireRoles,
  requireRole,
  verifyAdmin,
  verifySuperAdmin,
  verifyStudent,
  requireAdmin,
  requireMentor,
  requireStudent
};
