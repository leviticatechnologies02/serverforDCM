// routes/enrollmentRoutes.js
import express from 'express';
import {  
  assignStudentsToBatch, 
  getAssignedEnrollments,  
  getUnassignedEnrollments,
  getUnassignedInternships,
  assignInternshipsToBatch,
  getAssignedInternships
} from '../../controllers/admincontrollers/assignControllers.js';


const assignRouter = express.Router();


assignRouter.get('/unassigned', getUnassignedEnrollments);
assignRouter.post('/assign', assignStudentsToBatch);
assignRouter.get('/assigned', getAssignedEnrollments);

assignRouter.get('/internships/unassigned', getUnassignedInternships);
assignRouter.post('/internships/assign', assignInternshipsToBatch);
assignRouter.get('/internships/assigned', getAssignedInternships);

export default assignRouter;