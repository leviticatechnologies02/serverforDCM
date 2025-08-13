// routes/enrollmentRoutes.js
import express from 'express';
import { enrollInCourses, getUnassignedEnrollments  } from '../../controllers/admincontrollers/coursesEnrollControllers.js';

const enrollRouter = express.Router();

enrollRouter.post('/newenroll/:userId', enrollInCourses);
enrollRouter.get('/unassigned', getUnassignedEnrollments);

export default enrollRouter;