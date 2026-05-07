import express from 'express';
import { verifyToken, verifyAdmin, verifySuperAdmin } from '../../../middlewares/auth.middleware.js';
import {
  createLiveClass,
  listLiveClasses,
  getAllLiveClasses,
  startLiveClass,
  getMeetingController,
  getAllMeetingsController,
  updateMeetingController,
  updateMeetingSettingsController,
  deleteMeetingController,
  endMeetingController,
  batchDeleteMeetingsController,
  getMeetingJoinDetailsController,
  joinLiveClass,
  getLiveClasses
} from '../controller/live-classes.controller.js';

const liveClassesRouter = express.Router();

// 1. Student routes (mounted under /student)
liveClassesRouter.get('/classes/upcoming', verifyToken, getLiveClasses);
liveClassesRouter.get('/classes/join/:id', verifyToken, joinLiveClass);

// 2. Admin routes (mounted under /admin)
liveClassesRouter.post('/zoom', verifyToken, verifyAdmin, createLiveClass);
liveClassesRouter.get('/zoom/list', verifyToken, verifyAdmin, listLiveClasses);
liveClassesRouter.get('/zoom', verifyToken, verifyAdmin, getAllLiveClasses);
liveClassesRouter.get('/zoom/start/:id', verifyToken, verifyAdmin, startLiveClass);
liveClassesRouter.put('/zoom/:id', verifyToken, verifyAdmin, updateMeetingController);
liveClassesRouter.delete('/zoom/:id', verifyToken, verifyAdmin, deleteMeetingController);

// 3. Special Meeting routes (admin helpers)
liveClassesRouter.get('/zoom/meetings', verifyToken, verifyAdmin, getAllMeetingsController);
liveClassesRouter.get('/zoom/meetings/:meetingId', verifyToken, verifyAdmin, getMeetingController);
liveClassesRouter.patch('/zoom/meetings/:meetingId/settings', verifyToken, verifyAdmin, updateMeetingSettingsController);
liveClassesRouter.post('/zoom/meetings/:meetingId/end', verifyToken, verifyAdmin, endMeetingController);
liveClassesRouter.post('/zoom/meetings/batch-delete', verifyToken, verifyAdmin, batchDeleteMeetingsController);
liveClassesRouter.get('/zoom/meetings/:meetingId/join-details', verifyToken, verifyAdmin, getMeetingJoinDetailsController);

export default liveClassesRouter;
