// routes/enrollmentRoutes.js
import express from 'express';
import {     getStudentEnrolledCourses, getStudentEnrollmentByCourseId,} from '../../controllers/studentcontrollers/coursesEnrollControllers.js';

const studentEnrollRouter = express.Router();


studentEnrollRouter.get("/details/:courseId",getStudentEnrollmentByCourseId)
studentEnrollRouter.get("/",getStudentEnrolledCourses)


export default studentEnrollRouter;