// routes/enrollmentRoutes.js
import express from 'express';
import {  assignStudentsToBatch, getAssignedEnrollments,  getUnassignedEnrollments  } from '../../controllers/admincontrollers/assignControllers.js';


const assignRouter = express.Router();


assignRouter.get('/unassigned', getUnassignedEnrollments);
assignRouter.post('/assign', assignStudentsToBatch)
assignRouter.get('/assigned', getAssignedEnrollments)

export default assignRouter;