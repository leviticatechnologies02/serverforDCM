import { Router } from "express";
import verifyToken from "../../middlewares/authMiddleware.js";
import { verifyMentor } from "../../middlewares/verifyMiddleware.js";
import assignmentUpload from "../../middlewares/assignmentUploadMiddleware.js";
import {
  getMentorOverview,
  getMentorCourses,
  getMentorBatches,
  getMentorStudents,
  getMentorAssignments,
  getMentorAssignmentSubmissions,
  gradeMentorSubmission,
  createMentorAssignment,
  updateMentorAssignment,
  deleteMentorAssignment,
  getMentorLiveClasses,
  updateMentorProfile,
} from "../../controllers/mentorcontrollers/mentorPortalController.js";

const router = Router();

// Protect all mentor portal routes
router.use(verifyToken, verifyMentor);

// Dashboard overview & stats
router.get("/overview", getMentorOverview);

// Assigned courses
router.get("/courses", getMentorCourses);

// Batches & student rosters
router.get("/batches", getMentorBatches);
router.get("/students", getMentorStudents);

// Assignments & grading
router.get("/assignments", getMentorAssignments);
router.post(
  "/assignments",
  assignmentUpload.array("attachments", 5),
  createMentorAssignment
);
router.put(
  "/assignments/:id",
  assignmentUpload.array("attachments", 5),
  updateMentorAssignment
);
router.delete("/assignments/:id", deleteMentorAssignment);
router.get("/assignments/:assignmentId/submissions", getMentorAssignmentSubmissions);
router.put("/assignments/submissions/:submissionId/grade", gradeMentorSubmission);

// Live Classes
router.get("/live-classes", getMentorLiveClasses);

// Profile
router.put("/profile", updateMentorProfile);

export default router;
