import { Router } from "express";
import {
  addCourse,
  deleteCourse,
  updateCourse,
  addCourseDetails,
  updateCurriculum,
  updateCourseDetails,

} from "../../controllers/admincontrollers/coursesControllers.js";

const router = Router();

/**
 * Admin-only course mutations
 * verifyToken + verifyAdmin are applied at /admin level
 */

// Create course
router.post("/", addCourse);

// Update course
router.put("/:id", updateCourse);

// Delete course
router.delete("/:id", deleteCourse);

// Add course details
router.post("/:courseId/details", addCourseDetails);

// Update curriculum
router.patch("/:courseId/details/curriculum", updateCurriculum);

// Update course details
router.put("/:courseId/details", updateCourseDetails);

export default router;
