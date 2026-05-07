import express from 'express';
import { verifyToken, verifyAdmin } from '../../../middlewares/auth.middleware.js';
import { createNotice, getAllNotices } from '../controller/notifications.controller.js';

const notificationsRouter = express.Router();

// 1. Student / Public lookup of published notices
notificationsRouter.get('/', getAllNotices);

// 2. Administrative publication
notificationsRouter.post('/create', verifyToken, verifyAdmin, createNotice);

export default notificationsRouter;
