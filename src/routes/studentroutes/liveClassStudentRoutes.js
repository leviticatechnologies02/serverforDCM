import express from 'express';
import { joinLiveClass, getLiveClasses } from '../../controllers/studentcontrollers/liveClassStudentControllers.js';
import verifyToken from '../../middlewares/authMiddleware.js';

const studentLiveClassRouter = express.Router();

studentLiveClassRouter.get('/join/:id', verifyToken, joinLiveClass);
studentLiveClassRouter.get('/upcoming', verifyToken, getLiveClasses);

export default studentLiveClassRouter;  