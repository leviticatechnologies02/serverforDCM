import { Router } from "express";
import {
  getCourses,
  getCourseById,
} from "../../controllers/admincontrollers/coursesControllers.js";

const router = Router();

// Admin + Student (read-only)
router.get("/", getCourses);
router.get("/:id", getCourseById);

export default router;
