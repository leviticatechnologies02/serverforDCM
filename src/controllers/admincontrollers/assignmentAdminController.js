import mongoose from "mongoose";
import Assignment from "../../models/Assignment.js";
import AssignmentSubmission from "../../models/AssignmentSubmission.js";
import { uploadToCloudinary } from "../../utils/cloudinaryUtils.js";

// 📌 1. Create a new Assignment
export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      targetType = "course",
      course,
      batch,
      batchName,
      internshipDomain,
      totalMarks = 100,
      passingMarks = 40,
      dueDate,
      allowLateSubmission = true,
      status = "published",
      referenceLinks,
      questions,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Process file attachments if uploaded via multipart/form-data
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadToCloudinary(
            file.buffer,
            "assignments/resources"
          );
          attachments.push({
            name: file.originalname,
            fileUrl: uploadResult.secure_url,
            fileType: file.mimetype,
            publicId: uploadResult.public_id,
          });
        } catch (uploadErr) {
          console.error("Attachment upload failed:", uploadErr);
        }
      }
    }

    // Parse reference links if passed as string JSON
    let parsedReferenceLinks = [];
    if (referenceLinks) {
      try {
        parsedReferenceLinks =
          typeof referenceLinks === "string"
            ? JSON.parse(referenceLinks)
            : referenceLinks;
      } catch (e) {
        console.warn("Could not parse referenceLinks JSON:", e);
      }
    }

    // Parse questions if passed as JSON string or array
    let parsedQuestions = [];
    if (questions) {
      try {
        parsedQuestions =
          typeof questions === "string" ? JSON.parse(questions) : questions;
      } catch (e) {
        console.warn("Could not parse questions JSON:", e);
      }
    }

    const assignment = new Assignment({
      title,
      description,
      targetType,
      course: course && mongoose.Types.ObjectId.isValid(course) ? course : null,
      batch: batch && mongoose.Types.ObjectId.isValid(batch) ? batch : null,
      batchName: batchName || null,
      internshipDomain:
        internshipDomain && mongoose.Types.ObjectId.isValid(internshipDomain)
          ? internshipDomain
          : null,
      totalMarks: Number(totalMarks) || 100,
      passingMarks: Number(passingMarks) || 40,
      dueDate: dueDate ? new Date(dueDate) : null,
      allowLateSubmission:
        allowLateSubmission === "false" || allowLateSubmission === false
          ? false
          : true,
      status,
      attachments,
      referenceLinks: parsedReferenceLinks,
      questions: parsedQuestions,
      createdBy: req.user.id,
    });

    await assignment.save();

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating assignment",
      error: error.message,
    });
  }
};

// 📌 2. Get All Assignments (with submission counts and filters)
export const getAllAssignments = async (req, res) => {
  try {
    const {
      course,
      batch,
      internshipDomain,
      status,
      targetType,
      page = 1,
      limit = 50,
      search,
    } = req.query;

    const query = {};
    if (course && mongoose.Types.ObjectId.isValid(course)) query.course = course;
    if (batch && mongoose.Types.ObjectId.isValid(batch)) query.batch = batch;
    if (internshipDomain && mongoose.Types.ObjectId.isValid(internshipDomain))
      query.internshipDomain = internshipDomain;
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [assignments, total] = await Promise.all([
      Assignment.find(query)
        .populate("course", "name category thumbnail")
        .populate("batch", "batchName startDate endDate status")
        .populate("internshipDomain", "name focus level")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Assignment.countDocuments(query),
    ]);

    // Attach submission counts to each assignment
    const assignmentIds = assignments.map((a) => a._id);
    const submissionCounts = await AssignmentSubmission.aggregate([
      { $match: { assignment: { $in: assignmentIds } } },
      {
        $group: {
          _id: "$assignment",
          totalSubmissions: { $sum: 1 },
          gradedSubmissions: {
            $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap = {};
    submissionCounts.forEach((c) => {
      countMap[c._id.toString()] = c;
    });

    const enrichedAssignments = assignments.map((assignment) => {
      const counts = countMap[assignment._id.toString()] || {
        totalSubmissions: 0,
        gradedSubmissions: 0,
      };
      return {
        ...assignment,
        totalSubmissions: counts.totalSubmissions,
        gradedSubmissions: counts.gradedSubmissions,
        pendingReview: counts.totalSubmissions - counts.gradedSubmissions,
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      assignments: enrichedAssignments,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching assignments",
      error: error.message,
    });
  }
};

// 📌 3. Get Assignment By ID
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await Assignment.findById(id)
      .populate("course", "name category thumbnail duration")
      .populate("batch", "batchName startDate endDate status")
      .populate("internshipDomain", "name focus level")
      .populate("createdBy", "name email role")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const [totalSubmissions, gradedSubmissions] = await Promise.all([
      AssignmentSubmission.countDocuments({ assignment: id }),
      AssignmentSubmission.countDocuments({
        assignment: id,
        status: "graded",
      }),
    ]);

    return res.status(200).json({
      success: true,
      assignment: {
        ...assignment,
        totalSubmissions,
        gradedSubmissions,
        pendingReview: totalSubmissions - gradedSubmissions,
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

// 📌 4. Update Assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

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

    const {
      title,
      description,
      targetType,
      course,
      batch,
      batchName,
      internshipDomain,
      totalMarks,
      passingMarks,
      dueDate,
      allowLateSubmission,
      status,
      referenceLinks,
    } = req.body;

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (targetType !== undefined) assignment.targetType = targetType;
    if (course !== undefined)
      assignment.course = course && mongoose.Types.ObjectId.isValid(course) ? course : null;
    if (batch !== undefined)
      assignment.batch = batch && mongoose.Types.ObjectId.isValid(batch) ? batch : null;
    if (batchName !== undefined) assignment.batchName = batchName;
    if (internshipDomain !== undefined)
      assignment.internshipDomain =
        internshipDomain && mongoose.Types.ObjectId.isValid(internshipDomain)
          ? internshipDomain
          : null;
    if (totalMarks !== undefined) assignment.totalMarks = Number(totalMarks);
    if (passingMarks !== undefined) assignment.passingMarks = Number(passingMarks);
    if (dueDate !== undefined)
      assignment.dueDate = dueDate ? new Date(dueDate) : null;
    if (allowLateSubmission !== undefined)
      assignment.allowLateSubmission =
        allowLateSubmission === "false" || allowLateSubmission === false
          ? false
          : true;
    if (status !== undefined) assignment.status = status;

    if (referenceLinks !== undefined) {
      try {
        assignment.referenceLinks =
          typeof referenceLinks === "string"
            ? JSON.parse(referenceLinks)
            : referenceLinks;
      } catch (e) {
        console.warn("Could not parse referenceLinks JSON:", e);
      }
    }

    if (req.body.questions !== undefined) {
      try {
        assignment.questions =
          typeof req.body.questions === "string"
            ? JSON.parse(req.body.questions)
            : req.body.questions;
      } catch (e) {
        console.warn("Could not parse questions JSON in update:", e);
      }
    }

    // New attachments upload
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await uploadToCloudinary(
            file.buffer,
            "assignments/resources"
          );
          assignment.attachments.push({
            name: file.originalname,
            fileUrl: uploadResult.secure_url,
            fileType: file.mimetype,
            publicId: uploadResult.public_id,
          });
        } catch (uploadErr) {
          console.error("New attachment upload failed:", uploadErr);
        }
      }
    }

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating assignment",
      error: error.message,
    });
  }
};

// 📌 5. Delete Assignment & Cascade Submissions
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // Remove associated submissions
    await AssignmentSubmission.deleteMany({ assignment: id });

    return res.status(200).json({
      success: true,
      message: "Assignment and related submissions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting assignment",
      error: error.message,
    });
  }
};

// 📌 6. Get All Submissions for an Assignment
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, search } = req.query;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const query = { assignment: assignmentId };
    if (status) query.status = status;

    const submissions = await AssignmentSubmission.find(query)
      .populate("student", "name email mobile profileImage")
      .populate("gradedBy", "name email")
      .sort({ submittedAt: -1 })
      .lean();

    // In-memory filter for student search if needed
    let result = submissions;
    if (search) {
      const lower = search.toLowerCase();
      result = submissions.filter(
        (sub) =>
          sub.student?.name?.toLowerCase().includes(lower) ||
          sub.student?.email?.toLowerCase().includes(lower)
      );
    }

    return res.status(200).json({
      success: true,
      total: result.length,
      submissions: result,
    });
  } catch (error) {
    console.error("Error fetching assignment submissions:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: error.message,
    });
  }
};

// 📌 7. Grade a Student's Submission
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marksAwarded, feedback, status = "graded" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    const submission = await AssignmentSubmission.findById(submissionId).populate(
      "assignment",
      "title totalMarks"
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (marksAwarded !== undefined && marksAwarded !== null) {
      const numericMarks = Number(marksAwarded);
      if (numericMarks < 0) {
        return res.status(400).json({
          success: false,
          message: "Marks awarded cannot be negative",
        });
      }
      if (
        submission.assignment?.totalMarks &&
        numericMarks > submission.assignment.totalMarks
      ) {
        return res.status(400).json({
          success: false,
          message: `Marks awarded (${numericMarks}) cannot exceed total marks (${submission.assignment.totalMarks})`,
        });
      }
      submission.marksAwarded = numericMarks;
    }

    if (feedback !== undefined) {
      submission.feedback = feedback;
    }

    submission.status = status;
    submission.gradedBy = req.user.id;
    submission.gradedAt = new Date();

    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Submission graded successfully",
      submission,
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    return res.status(500).json({
      success: false,
      message: "Error grading submission",
      error: error.message,
    });
  }
};
