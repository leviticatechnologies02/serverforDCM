// routes/enrollmentRoutes.js
import express from 'express';
import {enrollInCourses, getStudentEnrollmentsById} from '../../controllers/studentcontrollers/coursesEnrollControllers.js';

const enrollRouter = express.Router();

enrollRouter.post('/newenroll/:userId', enrollInCourses);
enrollRouter.get("enroll/get/:id",getStudentEnrollmentsById)


export default enrollRouter;