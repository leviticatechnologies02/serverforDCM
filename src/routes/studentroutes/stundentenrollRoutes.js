// routes/enrollmentRoutes.js
import express from 'express';
import {     getStudentEnrolledCourses, getStudentEnrollmentByCourseId, getUserEnrollments,} from '../../controllers/studentcontrollers/coursesEnrollControllers.js';

const studentEnrollRouter = express.Router();


studentEnrollRouter.get("/details/:courseId",getStudentEnrollmentByCourseId)
studentEnrollRouter.get("/",getStudentEnrolledCourses)
studentEnrollRouter.get('/:userId', getUserEnrollments)


export default studentEnrollRouter;