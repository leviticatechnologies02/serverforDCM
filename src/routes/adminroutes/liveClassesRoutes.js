import express from 'express';
import { createLiveClass, updateLiveClass } from '../../controllers/admincontrollers/liveClassesController.js';
import verifyToken from '../../middlewares/authMiddleware.js';
import {verifyAdmin} from '../../middlewares/verifyadminMiddleware.js';

const liveClassRouter = express.Router();

liveClassRouter.post('/create-meeting', verifyToken, verifyAdmin, createLiveClass);
liveClassRouter.put('/update/:id', verifyToken, verifyAdmin, updateLiveClass);

export default liveClassRouter;