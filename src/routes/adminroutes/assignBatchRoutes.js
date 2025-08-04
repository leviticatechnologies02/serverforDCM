import express from 'express';

import { assignBatchGrouped, assignedStudents, getUnassignedUsers } from '../../controllers/admincontrollers/assignBatchControllers.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';

const assignBatchRouter = express.Router();

assignBatchRouter.get('/unassigned',verifyToken,verifyAdmin, getUnassignedUsers);
assignBatchRouter.post('/assign-to', verifyToken,verifyAdmin,assignBatchGrouped);
assignBatchRouter.get('/assigned', verifyToken,verifyAdmin,assignedStudents)

export default assignBatchRouter;
