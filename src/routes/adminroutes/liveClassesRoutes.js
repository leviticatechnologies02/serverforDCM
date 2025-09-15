import express from 'express';
import { createLiveClass, getAllLiveClasses, startLiveClass, updateLiveClass } from '../../controllers/admincontrollers/liveClassesController.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import {verifyAdmin} from '../../middlewares/verifyadminMiddleware.js';

const liveClassRouter = express.Router();

liveClassRouter.post('/create-meeting', verifyToken, verifyAdmin, createLiveClass);
liveClassRouter.put('/update/:id', verifyToken, verifyAdmin, updateLiveClass);
liveClassRouter.get('/start/:id', verifyToken, verifyAdmin, startLiveClass);
liveClassRouter.get('/get-classes', verifyToken, verifyAdmin, getAllLiveClasses);


export default liveClassRouter;