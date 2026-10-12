import mongoose from "mongoose";
import Assignment from "../../models/Assignment.js";
import AssignmentSubmission from "../../models/AssignmentSubmission.js";
import Enrollment from "../../models/Enrollment.js";
import InternshipPayment from "../../models/InternshipPayment.js";
import User from "../../models/user.js";
import { uploadToCloudinary } from "../../utils/cloudinaryUtils.js";

// 📌 1. Get All Assignments for Logged-in Student
export const getMyAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email?.toLowerCase();
    const { status, filter, internshipDomain, targetType } = req.query; // status filter: 'pending', 'submitted', 'graded', etc.

    // 1️⃣ Fetch student enrolled courses & batches
    const enrollment = await Enrollment.findOne({ user: userId }).lean();
    const enrolledCourses = enrollment?.enrolledCourses || [];

    const enrolledCourseIds = enrolledCourses
      .map((ec) => ec.course?.toString())
      .filter(Boolean);

    const enrolledBatchIds = enrolledCourses
      .map((ec) => ec.batch?.toString())
      .filter(Boolean);

    // 2️⃣ Fetch student internship domain & batch if any
    let internshipDomainIds = [];
    let internshipBatchIds = [];
    if (userEmail) {
      const internshipPayments = await InternshipPayment.find({
        email: userEmail,
        status: { $in: ["captured", "paid"] },
      }).lean();

      internshipDomainIds = internshipPayments
        .map((ip) => ip.domainId?.toString())
        .filter(Boolean);

      internshipBatchIds = internshipPayments
        .map((ip) => ip.batch?.toString())
        .filter(Boolean);
    }

    // 3️⃣ Construct assignment match query
    let assignmentQuery = {
      status: "published",
    };

    if (internshipDomain && mongoose.Types.ObjectId.isValid(internshipDomain)) {
      assignmentQuery.internshipDomain = internshipDomain;
    } else {
      const matchConditions = [
        { targetType: "all" }, // Open to all
      ];

      if (enrolledCourseIds.length > 0) {
        matchConditions.push({ course: { $in: enrolledCourseIds } });
      }
      if (enrolledBatchIds.length > 0) {
        matchConditions.push({ batch: { $in: enrolledBatchIds } });
      }
      if (internshipDomainIds.length > 0) {
        matchConditions.push({ internshipDomain: { $in: internshipDomainIds } });
      }
      if (internshipBatchIds.length > 0) {
        matchConditions.push({ batch: { $in: internshipBatchIds } });
      }

      assignmentQuery.$or = matchConditions;
    }

    if (targetType) {
      assignmentQuery.targetType = targetType;
    }

    const assignments = await Assignment.find(assignmentQuery)
      .populate("course", "name category thumbnail")
      .populate("batch", "batchName startDate endDate")
      .populate("internshipDomain", "name focus level")
      .sort({ createdAt: -1 })
      .lean();

    const assignmentIds = assignments.map((a) => a._id);

    // 4️⃣ Fetch student's existing submissions for these assignments
    const mySubmissions = await AssignmentSubmission.find({
      student: userId,
      assignment: { $in: assignmentIds },
    }).lean();

    const submissionMap = {};
    mySubmissions.forEach((sub) => {
      submissionMap[sub.assignment.toString()] = sub;
    });

    const now = new Date();

    // 5️⃣ Enrich each assignment with student's submission status
    const enrichedAssignments = assignments.map((assignment) => {
      const submission = submissionMap[assignment._id.toString()] || null;
      const isDueDatePassed =
        assignment.dueDate && now > new Date(assignment.dueDate);

      let studentStatus = "pending";
      if (submission) {
        studentStatus = submission.status; // 'submitted', 'resubmitted', 'late_submitted', 'graded', 'resubmit_requested'
      } else if (isDueDatePassed) {
        studentStatus = "overdue";
      }

      return {
        ...assignment,
        submissionStatus: studentStatus,
        isOverdue: !submission && isDueDatePassed,
        mySubmission: submission
          ? {
              _id: submission._id,
              status: submission.status,
              submittedAt: submission.submittedAt,
              isLate: submission.isLate,
              marksAwarded: submission.marksAwarded,
              feedback: submission.feedback,
              submissionText: submission.submissionText,
              submissionLink: submission.submissionLink,
              attachments: submission.attachments,
              gradedAt: submission.gradedAt,
            }
          : null,
      };
    });

    // Optional client filter: 'pending', 'submitted', 'graded', etc.
    let filteredList = enrichedAssignments;
    if (filter === "pending") {
      filteredList = enrichedAssignments.filter(
        (a) => a.submissionStatus === "pending" || a.submissionStatus === "overdue"
      );
    } else if (filter === "submitted") {
      filteredList = enrichedAssignments.filter(
        (a) =>
          a.submissionStatus === "submitted" ||
          a.submissionStatus === "resubmitted" ||
          a.submissionStatus === "late_submitted"
      );
    } else if (filter === "graded") {
      filteredList = enrichedAssignments.filter(
        (a) => a.submissionStatus === "graded"
      );
    }

    return res.status(200).json({
      success: true,
      total: filteredList.length,
      assignments: filteredList,
    });
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching student assignments",
      error: error.message,
    });
  }
};

// 📌 2. Get Single Assignment Details (with student submission)
export const getAssignmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await Assignment.findById(id)
      .populate("course", "name category thumbnail duration")
      .populate("batch", "batchName startDate endDate")
      .populate("internshipDomain", "name focus level")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const submission = await AssignmentSubmission.findOne({
      assignment: id,
      student: userId,
    })
      .populate("gradedBy", "name")
      .lean();

    const isDueDatePassed =
      assignment.dueDate && new Date() > new Date(assignment.dueDate);

    return res.status(200).json({
      success: true,
      assignment: {
        ...assignment,
        submissionStatus: submission ? submission.status : isDueDatePassed ? "overdue" : "pending",
        isOverdue: !submission && isDueDatePassed,
        mySubmission: submission || null,
      },
    });
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching assignment details",
      error: error.message,
    });
  }
};

// 📌 3. Submit or Resubmit Assignment
export const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { submissionText, submissionLink, answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This assignment is closed and no longer accepting submissions",
      });
    }

    const now = new Date();
    const isLate = assignment.dueDate ? now > new Date(assignment.dueDate) : false;

    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: "Submission deadline has passed. Late submissions are not allowed.",
      });
    }

    // Process uploaded file attachments
    const uploadedAttachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadToCloudinary(
            file.buffer,
            "assignments/submissions"
          );
          uploadedAttachments.push({
            name: file.originalname,
            fileUrl: uploadResult.secure_url,
            fileType: file.mimetype,
            publicId: uploadResult.public_id,
          });
        } catch (uploadErr) {
          console.error("Submission file upload failed:", uploadErr);
        }
      }
    }

    // Parse answers if provided as string or array
    let parsedAnswers = [];
    if (answers) {
      try {
        parsedAnswers =
          typeof answers === "string" ? JSON.parse(answers) : answers;
      } catch (e) {
        console.warn("Could not parse answers JSON:", e);
      }
    }

    // Check if the student provided at least something (file, link, text, or answers)
    if (
      uploadedAttachments.length === 0 &&
      (!submissionLink || !submissionLink.trim()) &&
      (!submissionText || !submissionText.trim()) &&
      parsedAnswers.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least a file attachment, submission link, text response, or question answers",
      });
    }

    // Check if student has already submitted
    let submission = await AssignmentSubmission.findOne({
      assignment: id,
      student: userId,
    });

    if (submission) {
      // If already graded, check if resubmission was requested
      if (
        submission.status === "graded" &&
        submission.status !== "resubmit_requested"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This assignment has already been graded and cannot be resubmitted without admin request",
        });
      }

      // Update existing submission
      if (submissionText !== undefined) {
        submission.submissionText = submissionText;
      }
      if (submissionLink !== undefined) {
        submission.submissionLink = submissionLink;
      }
      if (uploadedAttachments.length > 0) {
        submission.attachments.push(...uploadedAttachments);
      }
      if (parsedAnswers.length > 0) {
        submission.answers = parsedAnswers;
      }

      submission.isLate = isLate;
      submission.status = isLate
        ? "late_submitted"
        : submission.status === "resubmit_requested"
        ? "resubmitted"
        : "resubmitted";
      submission.submittedAt = now;

      await submission.save();

      return res.status(200).json({
        success: true,
        message: "Assignment resubmitted successfully",
        submission,
      });
    }

    // New submission
    submission = new AssignmentSubmission({
      assignment: id,
      student: userId,
      submissionText: submissionText || "",
      submissionLink: submissionLink || "",
      attachments: uploadedAttachments,
      answers: parsedAnswers,
      isLate,
      status: isLate ? "late_submitted" : "submitted",
      submittedAt: now,
    });

    await submission.save();

    return res.status(201).json({
      success: true,
      message: isLate
        ? "Assignment submitted late successfully"
        : "Assignment submitted successfully",
      submission,
    });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Error submitting assignment",
      error: error.message,
    });
  }
};

// 📌 4. Get Student's Own Submission for an Assignment
export const getMySubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const submission = await AssignmentSubmission.findOne({
      assignment: id,
      student: userId,
    })
      .populate("assignment", "title totalMarks passingMarks dueDate")
      .populate("gradedBy", "name")
      .lean();

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "No submission found for this assignment",
      });
    }

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching submission",
      error: error.message,
    });
  }
};
