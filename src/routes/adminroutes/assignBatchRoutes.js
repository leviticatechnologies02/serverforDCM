import express from 'express';

import { assignUserToBatch, getUnassignedUsers } from '../../controllers/admincontrollers/assignBatchControllers.js';

const assignBatchRouter = express.Router();

assignBatchRouter.get('/unassigned', getUnassignedUsers);
assignBatchRouter.post('/assignto', assignUserToBatch);

export default assignBatchRouter;
