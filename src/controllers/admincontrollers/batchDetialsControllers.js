import asyncHandler from 'express-async-handler';
import Batch from "../../models/batch.js";
import Enrollment from "../../models/Enrollment.js";
import mongoose from "mongoose";


export const getIdAndBatchNames = async (req, res) => {
  try {
    const batches = await Batch.find(
      { status: "active" },
      "_id batchName"
    ).sort({ createdAt: -1 });




    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch batch names",
    });
  }
};

export const getAllBatches = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const { status } = req.query;

    // 🔹 Dynamic filter
    const filter = {};

    // Apply status filter ONLY if provided
    if (status) {
      filter.status = status;
      // expected: active | completed | cancelled | inactive
    }

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate("courseId", "name")
        .populate("internshipDomainId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Batch.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: batches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET ALL BATCHES ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch batches",
    });
  }
};



export const getBatchesByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const batches = await Batch.find(
      {
        courseId,
        status: "active", //  only active batches
      },
      "_id batchName"
    )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("GET BATCHES BY COURSE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
    });
  }
};

export const getBatchesByInternshipId = async (req, res) => {
  try {
    const { internshipDomainId } = req.params;

    if (!internshipDomainId) {
      return res.status(400).json({
        success: false,
        message: "internshipDomainId is required",
      });
    }

    const batches = await Batch.find(
      {
        internshipDomainId,
        status: "active", //  only active batches
      },
      "_id batchName"
    )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("GET BATCHES BY INTERNSHIP ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
    });
  }
};

export const getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find({
      "enrolledCourses.batch": id,
    })
      .populate("user", "name email role")
      .populate("enrolledCourses.course", "name")
      .lean();

    const InternshipPayment = mongoose.model('InternshipPayment');
    const User = mongoose.model('User');
    
    const internshipPayments = await InternshipPayment.find({
      batch: id,
    })
      .populate("domainId", "name")
      .lean();

    const emails = internshipPayments.map(ip => ip.email);
    const usersForInternships = await User.find({ email: { $in: emails } }).lean();
    const emailToUser = {};
    usersForInternships.forEach(u => emailToUser[u.email] = u);

    // 🔹 Flatten
    const allStudents = [];
    
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach((enrollment) => {
        enrollment.enrolledCourses
          .filter((c) => c.batch?.toString() === id)
          .forEach((c) => {
            if (enrollment.user) {
              allStudents.push({
                id: enrollment.user._id,
                name: enrollment.user.name,
                email: enrollment.user.email,
                role: enrollment.user.role,
                course: c.course?.name,
              });
            }
          });
      });
    }

    if (internshipPayments && internshipPayments.length > 0) {
      internshipPayments.forEach((ip) => {
        const u = emailToUser[ip.email] || {};
        allStudents.push({
          id: u._id || ip._id,
          name: ip.name || u.name || 'Unknown',
          email: ip.email,
          role: u.role || 'Student',
          course: (ip.domainId?.name || 'Unknown') + ' (Internship)',
        });
      });
    }

    const total = allStudents.length;
    const students = allStudents.slice(skip, skip + limit);

    res.status(200).json({
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in getBatchDetails:", err);
    res.status(500).json({ error: "Failed to fetch batch details" });
  }
};


export const addBatch = asyncHandler(async (req, res) => {
  const { batchName, courseId, internshipDomainId, startDate, endDate } = req.body;

  // Basic field validation
  if (!batchName || (!courseId && !internshipDomainId) || !startDate || !endDate) {
    return res.status(400).json({ message: 'batchName, startDate, endDate, and EITHER courseId OR internshipDomainId are required.' });
  }

  // Date validation
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: 'End date must be after start date.' });
  }

  // Duplicate check
  const duplicateQuery = { batchName };
  if (courseId) duplicateQuery.courseId = courseId;
  if (internshipDomainId) duplicateQuery.internshipDomainId = internshipDomainId;

  const existing = await Batch.findOne(duplicateQuery);
  if (existing) {
    return res.status(409).json({ message: 'Batch with this name already exists for this course/internship.' });
  }

  // Create and save the new batch
  const batch = new Batch({ batchName, courseId, internshipDomainId, startDate, endDate });
  await batch.save();

  res.status(201).json({ message: 'Batch created successfully.', batch });
});




export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid batch ID" });
    }

    const {
      batchName,
      courseId,
      internshipDomainId,
      startDate,
      endDate,
      status,
      completedAt,
    } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    /* ================= UNIQUE NAME CHECK ================= */
    if (batchName && batchName !== batch.batchName) {
      const exists = await Batch.findOne({ batchName });
      if (exists) {
        return res.status(409).json({ message: "Batch name already exists" });
      }
      batch.batchName = batchName;
    }

    /* ================= BASIC FIELD UPDATES ================= */
    if (courseId !== undefined) batch.courseId = courseId;
    if (internshipDomainId !== undefined) batch.internshipDomainId = internshipDomainId;
    if (startDate) batch.startDate = startDate;
    if (endDate) batch.endDate = endDate;

    /* ================= STATUS LOGIC ================= */
    if (status && status !== batch.status) {
      batch.status = status;

      // If marked completed
      if (status === "completed") {
        batch.completedAt = completedAt
          ? new Date(completedAt)
          : new Date();
      }

      // If moved away from completed
      if (status !== "completed") {
        batch.completedAt = null;
      }
    }

    /* ================= SAFETY: IF ALREADY COMPLETED ================= */
    if (
      batch.status === "completed" &&
      completedAt &&
      !batch.completedAt
    ) {
      batch.completedAt = new Date(completedAt);
    }

    await batch.save();

    return res.status(200).json({
      message: "Batch updated successfully",
      data: batch,
    });

  } catch (error) {
    console.error("Update Batch Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



export const deleteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if batch exists
  const batch = await Batch.findById(id);
  if (!batch) {
    return res.status(404).json({ message: 'Batch not found.' });
  }

  // Optional: Check if there are any enrollments associated with this batch
  const enrollmentsWithBatch = await Enrollment.findOne({
    "enrolledCourses.batch": id
  });

  if (enrollmentsWithBatch) {
    return res.status(400).json({
      message: 'Cannot delete batch. There are students enrolled in this batch. Please remove all enrollments first.'
    });
  }

  // Delete the batch
  await Batch.findByIdAndDelete(id);

  res.status(200).json({
    message: 'Batch deleted successfully.',
    deletedBatch: {
      id: batch._id,
      batchName: batch.batchName
    }
  });
});

export const completeBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if batch exists
  const batch = await Batch.findById(id);
  if (!batch) {
    return res.status(404).json({ message: 'Batch not found.' });
  }

  // Check if batch is already completed
  if (batch.status === "completed") {
    return res.status(400).json({ message: 'Batch is already completed.' });
  }

  // Update batch to mark as completed (isActive: false)
  const updatedBatch = await Batch.findByIdAndUpdate(
    id,
    {
      status: 'completed',
      completedAt: new Date() // Optional: add completion timestamp
    },
    { new: true } // Return updated document
  );

  res.status(200).json({
    message: 'Batch marked as completed successfully.',
    batch: updatedBatch
  });
});