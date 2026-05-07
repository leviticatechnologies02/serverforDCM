import express from 'express';
import { verifyToken, verifyAdmin } from '../../../middlewares/auth.middleware.js';
import {
  getAdminStats,
  submitContactForm,
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getIdAndBatchNames,
  getAllBatches,
  getBatchesByCourseId,
  getBatchDetails,
  addBatch,
  updateBatch,
  deleteBatch,
  completeBatch,
  getUnassignedEnrollments,
  assignStudentsToBatch,
  getAssignedEnrollments,
  downloadBatchStudents
} from '../controller/admin.controller.js';

const adminRouter = express.Router();

// Public routes (or contact form)
adminRouter.post('/contact', submitContactForm);

// Protected Admin routes (require token & admin verification)
adminRouter.use(verifyToken, verifyAdmin);

// 1. Dashboard Stats
adminRouter.get('/stats/get-stats', getAdminStats);

// 2. Administrative Users CRUD
adminRouter.post('/admins', createAdmin);
adminRouter.get('/admins', getAllAdmins);
adminRouter.get('/admins/:id', getAdminById);
adminRouter.put('/admins/:id', updateAdmin);
adminRouter.delete('/admins/:id', deleteAdmin);

// 3. Batch Management
adminRouter.get('/batchs/names', getIdAndBatchNames);
adminRouter.get('/batchs', getAllBatches);
adminRouter.post('/batchs', addBatch);
adminRouter.get('/batchs/by-course/:courseId', getBatchesByCourseId);
adminRouter.get('/batchs/:id', getBatchDetails);
adminRouter.put('/batchs/:id', updateBatch);
adminRouter.delete('/batchs/:id', deleteBatch);
adminRouter.patch('/batchs/:id/complete', completeBatch);

// 4. Batch Student Assignment
adminRouter.get('/enroll/unassigned', getUnassignedEnrollments);
adminRouter.post('/enroll/assign', assignStudentsToBatch);
adminRouter.get('/enroll/assigned', getAssignedEnrollments);

// 5. Downloads
adminRouter.get('/download/batch-students/:batchId', downloadBatchStudents);
adminRouter.get('/download/batch/:batchId', downloadBatchStudents);

export default adminRouter;
