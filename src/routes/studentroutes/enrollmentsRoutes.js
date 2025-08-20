// routes/enrollmentRoutes.js
import express from 'express';
import {enrollInCourses} from '../../controllers/studentcontrollers/coursesEnrollControllers.js';

const enrollRouter = express.Router();

enrollRouter.post('/newenroll/:userId', enrollInCourses);


export default enrollRouter;