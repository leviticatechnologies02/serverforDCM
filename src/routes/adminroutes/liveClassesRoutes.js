import express from 'express';
import { createLiveClass, getAllLiveClasses, startLiveClass, updateMeetingController } from '../../controllers/admincontrollers/liveClassesController.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import {verifyAdmin} from '../../middlewares/verifyadminMiddleware.js';

const liveClassRouter = express.Router();

liveClassRouter.post('/create-meeting', verifyToken, verifyAdmin, createLiveClass);
liveClassRouter.put('/update/:id', verifyToken, verifyAdmin, updateMeetingController);
liveClassRouter.get('/start/:id', verifyToken, verifyAdmin, startLiveClass);
liveClassRouter.get('/get-classes', verifyToken, verifyAdmin, getAllLiveClasses);


export default liveClassRouter;