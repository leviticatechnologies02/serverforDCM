// routes/enrollmentRoutes.js
import express from 'express';
import {enrollInCourses, getStudentEnrollmentsById} from '../../controllers/studentcontrollers/coursesEnrollControllers.js';

const studentEnrollRouter = express.Router();

studentEnrollRouter.post('/newenroll/:userId', enrollInCourses);
studentEnrollRouter.get("/get/:id",getStudentEnrollmentsById)


export default studentEnrollRouter;