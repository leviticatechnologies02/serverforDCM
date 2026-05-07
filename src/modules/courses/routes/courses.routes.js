import express from 'express';
import { verifyToken, verifyAdmin } from '../../../middlewares/auth.middleware.js';
import {
  getCourses,
  getFreeCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getCourseById,
  addCourseDetails,
  updateCourseDetails,
  updateCurriculum,
  getCourseCategories
} from '../controller/courses.controller.js';

const coursesRouter = express.Router();
const coursesAdminRouter = express.Router();

// 1. Read-only Public/Student endpoints (mounted on /api/courses)
coursesRouter.get('/free', getFreeCourses);
coursesRouter.get('/categories', getCourseCategories);
coursesRouter.get('/', getCourses);
coursesRouter.get('/:id', getCourseById);

// 2. Protected Admin-write endpoints (mounted on /admin/courses)
coursesAdminRouter.use(verifyToken, verifyAdmin);
coursesAdminRouter.post('/', addCourse);
coursesAdminRouter.put('/:id', updateCourse);
coursesAdminRouter.delete('/:id', deleteCourse);
coursesAdminRouter.post('/:courseId/details', addCourseDetails);
coursesAdminRouter.put('/:courseId/details', updateCourseDetails);

// Support both modern /:courseId/curriculum and legacy /:courseId/details/curriculum paths
coursesAdminRouter.patch('/:courseId/details/curriculum', updateCurriculum);
coursesAdminRouter.put('/:courseId/details/curriculum', updateCurriculum);
coursesAdminRouter.put('/:courseId/curriculum', updateCurriculum);

export {
  coursesRouter,
  coursesAdminRouter
};

export default coursesRouter;
