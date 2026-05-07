import express from 'express';
import { verifyToken, verifyAdmin } from '../../../middlewares/auth.middleware.js';
import { assignTask, getStudentTasks } from '../controller/tasks.controller.js';

const tasksRouter = express.Router();

// 1. Admin Task Assignment
tasksRouter.post('/assign-task', verifyToken, verifyAdmin, assignTask);

// 2. Student Task Retrieval
tasksRouter.get('/student-tasks', verifyToken, getStudentTasks);

export default tasksRouter;
