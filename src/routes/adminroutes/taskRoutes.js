import express from "express";
import { assignTask, getStudentTasks } from "../../controllers/admincontrollers/taskController.js";
import verifyToken from "../../middlewares/authMiddleware.js";
import { verifyAdmin } from "../../middlewares/verifyadminMiddleware.js";

const taskRouter = express.Router();

// Admin creates a task
taskRouter.post("/assign-task", verifyToken, verifyAdmin, assignTask);

// Students fetch their tasks (filter by course & batch)
taskRouter.get("/student-tasks", verifyToken, getStudentTasks);

export default taskRouter;
