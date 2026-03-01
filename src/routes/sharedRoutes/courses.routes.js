import { Router } from "express";
import {
  getCourses,
  getCourseById,
  getFreeCourses,
} from "../../controllers/admincontrollers/coursesControllers.js";

const router = Router();

// Admin + Student (read-only)
router.get("/free",getFreeCourses)
router.get("/", getCourses);
router.get("/:id", getCourseById);


export default router;
