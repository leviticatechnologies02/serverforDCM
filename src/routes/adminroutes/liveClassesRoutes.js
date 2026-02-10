import express from 'express';
import { createLiveClass, getAllLiveClasses, startLiveClass, updateMeetingController } from '../../controllers/admincontrollers/liveClassesController.js';


const liveClassRouter = express.Router();

liveClassRouter.post('/', createLiveClass);
liveClassRouter.put('/:id', updateMeetingController);
liveClassRouter.get('/start/:id', startLiveClass);
liveClassRouter.get('/', getAllLiveClasses);


export default liveClassRouter;