import express from "express";
import assignmentUpload from "../../middlewares/assignmentUploadMiddleware.js";
import {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
} from "../../controllers/admincontrollers/assignmentAdminController.js";

const assignmentAdminRouter = express.Router();

// 📌 Assignment Management
assignmentAdminRouter.post(
  "/",
  assignmentUpload.array("attachments", 5),
  createAssignment
);

assignmentAdminRouter.get("/", getAllAssignments);
assignmentAdminRouter.get("/:id", getAssignmentById);

assignmentAdminRouter.put(
  "/:id",
  assignmentUpload.array("attachments", 5),
  updateAssignment
);

assignmentAdminRouter.delete("/:id", deleteAssignment);

// 📌 Submission Review & Grading
assignmentAdminRouter.get("/:assignmentId/submissions", getAssignmentSubmissions);
assignmentAdminRouter.put("/submissions/:submissionId/grade", gradeSubmission);

export default assignmentAdminRouter;
