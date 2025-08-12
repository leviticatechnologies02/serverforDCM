// utils/findExistingUser.js
import User from '../models/user.js';
import Admin from '../models/admin.js';

/**
 * Check if a user or admin exists by email or ID.
 * @param {Object} params
 * @param {string} [params.email] - Email to search
 * @param {string|ObjectId} [params.id] - MongoDB ObjectId or string
 * @returns {Promise<{ exists: boolean, source: 'user' | 'admin' | null, data: Object | null }>}
 */
export const findExistingUser = async ({ email, id }) => {
  let user = null;
  let admin = null;

  if (email) {
    user = await User.findOne({ email });
    admin = await Admin.findOne({ email });
  }

  if (id && !user && !admin) {
    user = await User.findById(id);
    admin = await Admin.findById(id);
  }

  if (user) return { exists: true, source: 'user', data: user };
  if (admin) return { exists: true, source: 'admin', data: admin };

  return { exists: false, source: null, data: null };
};

//IS EMAI IS TAKEN
 export const isEmailTaken = async (email, role) => {
  const userExists = await User.findOne({ email });
  const adminExists = await Admin.findOne({ email });

  if (role === 'admin') return adminExists || userExists;
  return !!userExists;
};
