// routes/enrollmentRoutes.js
import express from 'express';
import {     getStudentEnrolledCourses, getStudentEnrollmentsById} from '../../controllers/studentcontrollers/coursesEnrollControllers.js';

const studentEnrollRouter = express.Router();


studentEnrollRouter.get("/get/:id",getStudentEnrollmentsById)
studentEnrollRouter.get("/getcourses/:id",getStudentEnrolledCourses)


export default studentEnrollRouter;