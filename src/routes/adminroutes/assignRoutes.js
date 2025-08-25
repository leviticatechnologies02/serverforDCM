// routes/enrollmentRoutes.js
import express from 'express';
import {  assignStudentsToBatch, getAssignedEnrollments,  getUnassignedEnrollments  } from '../../controllers/admincontrollers/assignControllers.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';

const assignRouter = express.Router();


assignRouter.get('/unassigned', verifyToken,verifyAdmin,getUnassignedEnrollments);
assignRouter.post('/assign', verifyToken,verifyAdmin,assignStudentsToBatch)
assignRouter.get('/assigned', verifyToken,verifyAdmin,getAssignedEnrollments)

export default assignRouter;