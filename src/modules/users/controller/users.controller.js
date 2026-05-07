import { catchAsync } from '../../../utils/catchAsync.js';
import UsersService from '../service/users.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

// 1. User Profile Controllers
export const getProfile = catchAsync(async (req, res) => {
  const result = await UsersService.getProfile({ userId: req.user.id });
  return successResponse(res, { message: "Profile fetched successfully", data: { user: result } });
});

export const updateProfileInfo = catchAsync(async (req, res) => {
  const { name } = req.body;
  const result = await UsersService.updateProfileInfo({ userId: req.user.id, name });
  return successResponse(res, { message: "Profile info updated successfully", data: { user: result } });
});

export const updateProfileImage = catchAsync(async (req, res) => {
  const fileBuffer = req.file?.buffer;
  const result = await UsersService.updateProfileImage({ userId: req.user.id, fileBuffer });
  return successResponse(res, { message: "Profile image updated successfully", data: result });
});

export const deleteProfileImage = catchAsync(async (req, res) => {
  const result = await UsersService.deleteProfileImage({ userId: req.user.id });
  return successResponse(res, { message: "Profile image deleted successfully", data: result });
});

// 2. Admin CRUD Controllers
export const createUser = catchAsync(async (req, res) => {
  const { username, email, password, role, enrolledCourses } = req.body;
  const result = await UsersService.createUser({ username, email, password, role, enrolledCourses });
  return successResponse(res, { message: "User created successfully.", data: result, status: 201 });
});

export const getUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await UsersService.getUsers({ page, limit });
  return successResponse(res, { message: "Users fetched successfully.", data: result });
});

export const getUserById = catchAsync(async (req, res) => {
  const result = await UsersService.getUserById({ userId: req.params.id });
  return successResponse(res, { message: "User fetched successfully.", data: result });
});

export const updateUser = catchAsync(async (req, res) => {
  const { name, email, role, batch, enrolledCourses } = req.body;
  const result = await UsersService.updateUser({
    userId: req.params.id,
    name,
    email,
    role,
    batch,
    enrolledCourses
  });
  return successResponse(res, { message: "User updated successfully.", data: result });
});

export const deleteUser = catchAsync(async (req, res) => {
  const result = await UsersService.deleteUser({
    userId: req.params.id,
    requestUserId: req.user._id
  });
  return successResponse(res, { message: result.message });
});
