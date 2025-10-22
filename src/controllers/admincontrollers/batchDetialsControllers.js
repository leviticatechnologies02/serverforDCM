import asyncHandler from 'express-async-handler';
import Batch from "../../models/batch.js";
import Enrollment from "../../models/Enrollment.js";

export const getIdAndBatchNames = async (req, res) => {
  try {
    const batches = await Batch.find({}, '_id batchName').lean();
    console.log(batches)

    res.status(200).json(batches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch batch names' });
  }
};

export const getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find enrollments where at least one enrolledCourse has this batch
    const enrollments = await Enrollment.find({
      "enrolledCourses.batch": id
    })
      .populate("user", "name email role") // only bring safe fields
      .populate("enrolledCourses.course", "name"); // only bring course title

    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json({ msg: "Batch not found or no students" });
    }

    // Flatten and sanitize
    console.log(enrollments,"iam enrollments")
    const students = enrollments.flatMap(enrollment =>
      enrollment.enrolledCourses
        .filter(c => c.batch?.toString() === id) // only courses in this batch
        .map(c => ({
          id:enrollment.user._id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          role: enrollment.user.role,
          course: c.course?.name 
        }))
    );

    res.status(200).json({ students });
  } catch (err) {
    console.error("Error in getBatchDetails:", err);
    res.status(500).json({ error: "Failed to fetch batch details" });
  }
};

export const addBatch = asyncHandler(async (req, res) => {
  const { batchName, courseId, startDate, endDate, isActive } = req.body;

  // Basic field validation
  if (!batchName || !courseId || !startDate || !endDate) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Date validation
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: 'End date must be after start date.' });
  }

  // Duplicate check
  const existing = await Batch.findOne({ batchName, courseId });
  if (existing) {
    return res.status(409).json({ message: 'Batch with this name and course already exists.' });
  }

  // Create and save the new batch
  const batch = new Batch({ batchName, courseId, startDate, endDate, isActive });
  await batch.save();

  res.status(201).json({ message: 'Batch created successfully.', batch });
});

export const updateBatchStudents = async ({ batchId, userIds, session }) => {
  if (!batchId || !Array.isArray(userIds) || userIds.length === 0) return null;

  return await Batch.updateOne(
    { _id: batchId },
    { $addToSet: { students: { $each: userIds } } },
    { session }
  );
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
  if (batch.isActive === false) {
    return res.status(400).json({ message: 'Batch is already completed.' });
  }

  // Update batch to mark as completed (isActive: false)
  const updatedBatch = await Batch.findByIdAndUpdate(
    id,
    { 
      isActive: false,
      completedAt: new Date() // Optional: add completion timestamp
    },
    { new: true } // Return updated document
  );

  res.status(200).json({ 
    message: 'Batch marked as completed successfully.',
    batch: updatedBatch
  });
});