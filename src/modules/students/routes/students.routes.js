import express from 'express';
import { verifyToken, verifyAdmin } from '../../../middlewares/auth.middleware.js';
import {
  getStudentEnrollmentByCourseId,
  getStudentEnrolledCourses,
  getUserEnrollments,
  getStudentsReport,
  downloadStudentsReport
} from '../controller/students.controller.js';
import { downloadPaymentsExcel } from '../../payments/controller/payments.controller.js';

const studentsRouter = express.Router();
const studentReportsAdminRouter = express.Router();

// 1. Enrollment routes (mounted on /student)
studentsRouter.use(verifyToken);
studentsRouter.get('/enrollments/details/:courseId', getStudentEnrollmentByCourseId);
studentsRouter.get('/enrollments', getStudentEnrolledCourses);
studentsRouter.get('/enrollments/:userId', getUserEnrollments);

// 2. Admin Student Reports routes (mounted on /admin/student-reports)
studentReportsAdminRouter.use(verifyToken, verifyAdmin);
studentReportsAdminRouter.get('/', getStudentsReport);
studentReportsAdminRouter.get('/excel', downloadStudentsReport);
studentReportsAdminRouter.get('/payments/excel', downloadPaymentsExcel);

export {
  studentsRouter,
  studentReportsAdminRouter
};

export default studentsRouter;
