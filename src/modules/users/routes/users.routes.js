import express from 'express';
import { upload } from '../../../middlewares/upload.middleware.js';
import { verifyToken, verifyAdmin } from '../../../middlewares/auth.middleware.js';
import {
  getProfile,
  updateProfileInfo,
  updateProfileImage,
  deleteProfileImage,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controller/users.controller.js';

const usersRouter = express.Router();
const usersAdminRouter = express.Router();

// 1. User Profile Management (mounted on /api)
usersRouter.use(verifyToken);
usersRouter.get('/profile', getProfile);
usersRouter.patch('/profile', updateProfileInfo);
usersRouter.put('/profile/image', upload.single('profileImage'), updateProfileImage);
usersRouter.delete('/profile/image', deleteProfileImage);

// 2. Admin User CRUD Management (mounted on /admin)
usersAdminRouter.use(verifyToken, verifyAdmin);

// Legacy admin createUser route (/admin/user/create-user)
usersAdminRouter.post('/user/create-user', createUser);

// Standard modular admin users routing (/admin/users)
usersAdminRouter.post('/users', createUser);
usersAdminRouter.get('/users', getUsers);
usersAdminRouter.get('/users/:id', getUserById);
usersAdminRouter.put('/users/:id', updateUser);
usersAdminRouter.delete('/users/:id', deleteUser);

export {
  usersRouter,
  usersAdminRouter
};

export default usersRouter;
