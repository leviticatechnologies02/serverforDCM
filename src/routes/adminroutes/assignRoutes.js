// routes/enrollmentRoutes.js
import express from 'express';
import {  getUnassignedEnrollments  } from '../../controllers/admincontrollers/assignControllers.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';

const assignRouter = express.Router();


assignRouter.get('/unassigned', verifyToken,verifyAdmin,getUnassignedEnrollments);

export default assignRouter;