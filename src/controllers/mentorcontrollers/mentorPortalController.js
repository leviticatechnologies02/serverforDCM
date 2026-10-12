import mongoose from "mongoose";
import Mentor from "../../models/mentor.js";
import User from "../../models/user.js";
import Batch from "../../models/batch.js";
import Enrollment from "../../models/Enrollment.js";
import Assignment from "../../models/Assignment.js";
import AssignmentSubmission from "../../models/AssignmentSubmission.js";
import LiveClass from "../../models/LiveClass.js";
import InternshipPayment from "../../models/InternshipPayment.js";
import InternshipsDomain from "../../models/internshipsDomain.js";
import { uploadToCloudinary } from "../../utils/cloudinaryUtils.js";

// Helper: resolve mentor document for the logged-in user
const getLoggedInMentor = async (user) => {
  return await Mentor.findOne({
    $or: [
      { userId: user.id },
      { email: user.email?.toLowerCase().trim() },
    ],
  })
    .populate("courses", "name category thumbnail duration level")
    .populate("internshipDomains", "name focus level durations");
};

// 📌 1. Get Mentor Dashboard Overview
export const getMentorOverview = async (req, res) => {
  try {
    const mentor = await getLoggedInMentor(req.user);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found. Please contact Super Admin.",
      });
    }

    const assignedCourseIds = (mentor.courses || []).map((c) => c._id);
    const assignedDomainIds = (mentor.internshipDomains || []).map((d) => d._id);

    // 1. Fetch Batches (Courses + Internships)
    const batches = await Batch.find({
      $or: [
        { courseId: { $in: assignedCourseIds } },
        { internshipDomainId: { $in: assignedDomainIds } },
      ],
    })
      .populate("courseId", "name thumbnail")
      .populate("internshipDomainId", "name focus")
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch Enrollments & Internship Payments & count unique students
    const [enrollments, internshipPayments] = await Promise.all([
      Enrollment.find({
        "enrolledCourses.course": { $in: assignedCourseIds },
      })
        .populate("user", "name email mobile profileImage")
        .lean(),
      InternshipPayment.find({
        domainId: { $in: assignedDomainIds },
        paymentStatus: "completed",
      })
        .populate("userId", "name email mobile profileImage")
        .lean(),
    ]);

    const studentMap = new Map();
    enrollments.forEach((e) => {
      if (e.user) {
        studentMap.set(e.user._id.toString(), e.user);
      }
    });
    internshipPayments.forEach((ip) => {
      if (ip.userId) {
        studentMap.set(ip.userId._id.toString(), ip.userId);
      }
    });
    const totalStudents = studentMap.size;

    // 3. Fetch Assignments for these courses and internships
    const assignments = await Assignment.find({
      $or: [
        { course: { $in: assignedCourseIds } },
        { internshipDomain: { $in: assignedDomainIds } },
      ],
    })
      .populate("course", "name")
      .populate("internshipDomain", "name focus")
      .populate("batch", "batchName")
      .sort({ createdAt: -1 })
      .lean();

    const assignmentIds = assignments.map((a) => a._id);

    // 4. Submissions statistics
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds },
    }).lean();

    const totalSubmissions = submissions.length;
    const pendingReview = submissions.filter(
      (s) => s.status !== "graded"
    ).length;
    const gradedSubmissions = submissions.filter(
      (s) => s.status === "graded"
    ).length;

    // 5. Live Classes
    const liveClasses = await LiveClass.find({
      $or: [
        { course: { $in: assignedCourseIds } },
        { internshipDomain: { $in: assignedDomainIds } },
      ],
    })
      .populate("course", "name")
      .populate("internshipDomain", "name")
      .populate("batch", "batchName")
      .sort({ startTime: 1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        mentor,
        stats: {
          totalCourses: assignedCourseIds.length,
          totalInternships: assignedDomainIds.length,
          totalPrograms: assignedCourseIds.length + assignedDomainIds.length,
          totalBatches: batches.length,
          totalStudents,
          totalAssignments: assignments.length,
          totalSubmissions,
          pendingReview,
          gradedSubmissions,
        },
        courses: mentor.courses,
        internshipDomains: mentor.internshipDomains,
        batches,
        assignments: assignments.slice(0, 5), // recent 5
        liveClasses,
      },
    });
  } catch (error) {
    console.error("MENTOR OVERVIEW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor dashboard overview",
      error: error.message,
    });
  }
};

// 📌 2. Get Mentor Assigned Courses
export const getMentorCourses = async (req, res) => {
  try {
    const mentor = await getLoggedInMentor(req.user);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      courses: mentor.courses || [],
      internshipDomains: mentor.internshipDomains || [],
    });
  } catch (error) {
    console.error("GET MENTOR COURSES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned courses",
      error: error.message,
    });
  }
};

// 📌 3. Get Mentor Batches & Student Rosters
export const getMentorBatches = async (req, res) => {
  try {
    const mentor = await getLoggedInMentor(req.user);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

    const assignedCourseIds = (mentor.courses || []).map((c) => c._id);

    const batches = await Batch.find({
      courseId: { $in: assignedCourseIds },
    })
      .populate("courseId", "name category thumbnail")
      .sort({ createdAt: -1 })
      .lean();

    // Attach student count for each batch
    const batchIds = batches.map((b) => b._id);
    const enrollments = await Enrollment.find({
      "enrolledCourses.batch": { $in: batchIds },
    }).lean();

    const batchStudentCounts = {};
    enrollments.forEach((e) => {
      e.enrolledCourses.forEach((ec) => {
        if (ec.batch) {
          const bId = ec.batch.toString();
          batchStudentCounts[bId] = (batchStudentCounts[bId] || 0) + 1;
        }
      });
    });

    const enrichedBatches = batches.map((b) => ({
      ...b,
      studentCount: batchStudentCounts[b._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      batches: enrichedBatches,
    });
  } catch (error) {
    console.error("GET MENTOR BATCHES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
      error: error.message,
    });
  }
};

// 📌 4. Get Enrolled Students in Mentor's Courses
export const getMentorStudents = async (req, res) => {
  try {
    const mentor = await getLoggedInMentor(req.user);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

    const assignedCourseIds = (mentor.courses || []).map((c) => c._id);

    const enrollments = await Enrollment.find({
      "enrolledCourses.course": { $in: assignedCourseIds },
    })
      .populate("user", "name email mobile profileImage createdAt")
      .populate("enrolledCourses.course", "name")
      .populate("enrolledCourses.batch", "batchName")
      .lean();

    const students = [];
    const seen = new Set();

    enrollments.forEach((e) => {
      if (e.user && !seen.has(e.user._id.toString())) {
        seen.add(e.user._id.toString());
        const myCourses = e.enrolledCourses.filter((ec) =>
          assignedCourseIds.some((cid) => cid.equals(ec.course?._id))
        );
        students.push({
          ...e.user,
          enrolledDetails: myCourses,
        });
      }
    });

    return res.status(200).json({
      success: true,
      total: students.length,
      students,
    });
  } catch (error) {
    console.error("GET MENTOR STUDENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message,
    });
  }
};

// 📌 5. Get Assignments for Mentor's Courses
export const getMentorAssignments = async (req, res) => {
  try {
    const mentor = await getLoggedInMentor(req.user);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

    const assignedCourseIds = (mentor.courses || []).map((c) => c._id);
    const assignedDomainIds = (mentor.internshipDomains || []).map((d) => d._id);

    const assignments = await Assignment.find({
      $or: [
        { course: { $in: assignedCourseIds } },
        { internshipDomain: { $in: assignedDomainIds } },
      ],
    })
      .populate("course", "name category thumbnail")
      .populate("internshipDomain", "name focus level")
      .populate("batch", "batchName status")
      .sort({ createdAt: -1 })
      .lean();

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

    const enriched = assignments.map((a) => {
      const c = countMap[a._id.toString()] || {
        totalSubmissions: 0,
        gradedSubmissions: 0,
      };
      return {
        ...a,
        totalSubmissions: c.totalSubmissions,
        gradedSubmissions: c.gradedSubmissions,
        pendingReview: c.totalSubmissions - c.gradedSubmissions,
      };
    });

    return res.status(200).json({
      success: true,
      assignments: enriched,
    });
  } catch (error) {
    console.error("GET MENTOR ASSIGNMENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
      error: error.message,
    });
  }
};

// 📌 6. Get Submissions for a specific Assignment
export const getMentorAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
    })
      .populate("student", "name email mobile profileImage")
      .populate("gradedBy", "name email")
      .sort({ submittedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("GET MENTOR SUBMISSIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assignment submissions",
      error: error.message,
    });
  }
};

// 📌 7. Grade a Student's Submission
export const gradeMentorSubmission = async (req, res) => {
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
      message: "Submission evaluated and graded successfully",
      submission,
    });
  } catch (error) {
    console.error("GRADE MENTOR SUBMISSION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to grade submission",
      error: error.message,
    });
  }
};

// 📌 8. Get Live Classes for Mentor's Courses
export const getMentorLiveClasses = async (req, res) => {
  try {
    const mentor = await getLoggedInMentor(req.user);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

    const assignedCourseIds = (mentor.courses || []).map((c) => c._id);

    const liveClasses = await LiveClass.find({
      course: { $in: assignedCourseIds },
    })
      .populate("course", "name thumbnail")
      .populate("batch", "batchName")
      .sort({ startTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      liveClasses,
    });
  } catch (error) {
    console.error("GET MENTOR LIVE CLASSES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch live classes",
      error: error.message,
    });
  }
};

// 📌 9. Update Mentor Profile / Password
export const updateMentorProfile = async (req, res) => {
  try {
    const mentor = await getLoggedInMentor(req.user);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

    const { name, mobile, expertise, password } = req.body;

    if (name) mentor.name = name;
    if (mobile) mentor.mobile = mobile;
    if (expertise !== undefined) mentor.expertise = expertise;

    await mentor.save();

    // Update User model
    const user = await User.findById(req.user.id).select("+password");
    if (user) {
      if (name) user.name = name;
      if (mobile) user.mobile = mobile;
      if (password) user.password = password; // Hashed by User pre-save
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      mentor,
    });
  } catch (error) {
    console.error("UPDATE MENTOR PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// 📌 10. Create Assignment by Mentor
export const createMentorAssignment = async (req, res) => {
  try {
    const mentor = await getLoggedInMentor(req.user);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found",
      });
    }

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

    // Process file attachments if uploaded
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
          console.error("Mentor assignment attachment upload failed:", uploadErr);
        }
      }
    }

    // Parse reference links
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

    // Parse questions
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
      message: "Assignment and questions created successfully by Mentor",
      assignment,
    });
  } catch (error) {
    console.error("CREATE MENTOR ASSIGNMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create assignment",
      error: error.message,
    });
  }
};

// 📌 11. Update Assignment by Mentor
export const updateMentorAssignment = async (req, res) => {
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
      message: "Assignment updated successfully by Mentor",
      assignment,
    });
  } catch (error) {
    console.error("UPDATE MENTOR ASSIGNMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update assignment",
      error: error.message,
    });
  }
};

// 📌 12. Delete Assignment by Mentor
export const deleteMentorAssignment = async (req, res) => {
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

    await AssignmentSubmission.deleteMany({ assignment: id });

    return res.status(200).json({
      success: true,
      message: "Assignment and related submissions deleted successfully",
    });
  } catch (error) {
    console.error("DELETE MENTOR ASSIGNMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete assignment",
      error: error.message,
    });
  }
};
