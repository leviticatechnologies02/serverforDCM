import express from "express";
import assignmentUpload from "../../middlewares/assignmentUploadMiddleware.js";
import {
  getMyAssignments,
  getAssignmentDetails,
  submitAssignment,
  getMySubmission,
} from "../../controllers/studentcontrollers/assignmentStudentController.js";

const assignmentStudentRouter = express.Router();

// 📌 Student Assignment Routes
assignmentStudentRouter.get("/", getMyAssignments);
assignmentStudentRouter.get("/:id", getAssignmentDetails);
assignmentStudentRouter.post(
  "/:id/submit",
  assignmentUpload.array("attachments", 5),
  submitAssignment
);
assignmentStudentRouter.get("/:id/my-submission", getMySubmission);

export default assignmentStudentRouter;
