import { catchAsync } from '../../../utils/catchAsync.js';
import AdminService from '../service/admin.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

// 1. Dashboard Statistics
export const getAdminStats = catchAsync(async (req, res) => {
  const result = await AdminService.getAdminStats();
  return successResponse(res, { message: "Admin statistics fetched successfully", data: result });
});

// 2. Contact Form Submission
export const submitContactForm = catchAsync(async (req, res) => {
  const { name, email, message, mobile } = req.body;
  const result = await AdminService.submitContactForm({ name, email, message, mobile });
  return successResponse(res, result);
});

// 3. Admin User Management
export const createAdmin = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await AdminService.createAdmin({ name, email, password });
  return successResponse(res, { message: "Admin created successfully", data: result, status: 201 });
});

export const getAllAdmins = catchAsync(async (req, res) => {
  const result = await AdminService.getAllAdmins();
  return successResponse(res, { count: result.length, data: result });
});

export const getAdminById = catchAsync(async (req, res) => {
  const result = await AdminService.getAdminById(req.params.id);
  return successResponse(res, { data: result });
});

export const updateAdmin = catchAsync(async (req, res) => {
  const { name, email, mobile } = req.body;
  const result = await AdminService.updateAdmin({ id: req.params.id, name, email, mobile });
  return successResponse(res, { message: "Admin updated successfully", data: result });
});

export const deleteAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.deleteAdmin({ id: req.params.id, requestUser: req.user });
  return successResponse(res, result);
});

// 4. Batch Management
export const getIdAndBatchNames = catchAsync(async (req, res) => {
  const result = await AdminService.getIdAndBatchNames();
  return successResponse(res, { data: result });
});

export const getAllBatches = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const status = req.query.status;

  const result = await AdminService.getAllBatches({ status, page, limit });
  return successResponse(res, { data: result.batches, pagination: result.pagination });
});

export const getBatchesByCourseId = catchAsync(async (req, res) => {
  const result = await AdminService.getBatchesByCourseId(req.params.courseId);
  return successResponse(res, { data: result });
});

export const getBatchDetails = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const result = await AdminService.getBatchDetails({ id: req.params.id, page, limit });
  return successResponse(res, { students: result.students, pagination: result.pagination });
});

export const addBatch = catchAsync(async (req, res) => {
  const { batchName, courseId, startDate, endDate } = req.body;
  const result = await AdminService.addBatch({ batchName, courseId, startDate, endDate });
  return successResponse(res, { message: 'Batch created successfully.', batch: result, status: 201 });
});

export const updateBatch = catchAsync(async (req, res) => {
  const { batchName, courseId, startDate, endDate, status, completedAt } = req.body;
  const result = await AdminService.updateBatch({
    id: req.params.id,
    batchName,
    courseId,
    startDate,
    endDate,
    status,
    completedAt
  });
  return successResponse(res, { message: "Batch updated successfully", data: result });
});

export const deleteBatch = catchAsync(async (req, res) => {
  const result = await AdminService.deleteBatch(req.params.id);
  return successResponse(res, { message: 'Batch deleted successfully.', deletedBatch: result });
});

export const completeBatch = catchAsync(async (req, res) => {
  const result = await AdminService.completeBatch(req.params.id);
  return successResponse(res, { message: 'Batch marked as completed successfully.', batch: result });
});

// 5. Batch Student Assignment
export const getUnassignedEnrollments = catchAsync(async (req, res) => {
  const enrollments = await AdminService.getUnassignedEnrollments();
  return successResponse(res, { enrollments });
});

export const assignStudentsToBatch = catchAsync(async (req, res) => {
  const { enrollmentIds, courseId, batchId, courseTitle, batchName } = req.body;
  const result = await AdminService.assignStudentsToBatch({ enrollmentIds, courseId, batchId, courseTitle, batchName });
  return successResponse(res, {
    message: 'Batch assignment successful',
    totalUpdated: result.totalUpdated,
    totalRequests: result.totalRequests
  });
});

export const getAssignedEnrollments = catchAsync(async (req, res) => {
  const enrollments = await AdminService.getAssignedEnrollments();
  return successResponse(res, { enrollments });
});

// 6. Export Assigned Students download
export const downloadBatchStudents = catchAsync(async (req, res) => {
  const { workbook, batchName } = await AdminService.exportBatchStudents(req.params.batchId);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Batch_${batchName}_Students.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});
