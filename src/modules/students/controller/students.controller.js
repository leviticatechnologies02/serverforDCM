import { catchAsync } from '../../../utils/catchAsync.js';
import StudentsService from '../service/students.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

// 1. Enrollment Handlers
export const getStudentEnrollmentByCourseId = catchAsync(async (req, res) => {
  const result = await StudentsService.getStudentEnrollmentByCourseId({
    userId: req.user.id,
    courseId: req.params.courseId
  });
  return successResponse(res, { data: result });
});

export const getStudentEnrolledCourses = catchAsync(async (req, res) => {
  const { type } = req.query;
  const result = await StudentsService.getStudentEnrolledCourses({
    userId: req.user.id,
    type
  });
  if (type === "ids") {
    return successResponse(res, { data: result.courseIds });
  }
  return successResponse(res, { data: result.summary, totalCourses: result.totalCourses });
});

export const getUserEnrollments = catchAsync(async (req, res) => {
  const result = await StudentsService.getUserEnrollments({
    userId: req.params.userId,
    requestedUserRole: req.user.role,
    requestUserId: req.user.id
  });
  return successResponse(res, { data: result });
});

// 2. Cart Handlers
export const getCartItems = catchAsync(async (req, res) => {
  const result = await StudentsService.getCartItems({ userId: req.params.userId });
  return successResponse(res, { data: result });
});

export const addItemToCart = catchAsync(async (req, res) => {
  const { userId, courseId } = req.body;
  const result = await StudentsService.addItemToCart({ userId, courseId });
  return successResponse(res, { data: result });
});

export const removeItemFromCart = catchAsync(async (req, res) => {
  const { userId, courseId } = req.body;
  const result = await StudentsService.removeItemFromCart({ userId, courseId });
  return successResponse(res, { data: result });
});

export const deleteCart = catchAsync(async (req, res) => {
  const result = await StudentsService.deleteCart({ userId: req.params.userId });
  return successResponse(res, { message: 'Cart deleted successfully', cartId: result.cartId });
});

// 3. Student Reporting Handlers (Admin Only)
export const getStudentsReport = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { search } = req.query;

  const result = await StudentsService.getStudentsReport({ page, limit, search });
  return successResponse(res, result);
});

export const downloadStudentsReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const workbook = await StudentsService.downloadStudentsReport({ startDate, endDate });

  const timestamp = new Date().toISOString().split('T')[0];
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=students_report_${timestamp}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});
