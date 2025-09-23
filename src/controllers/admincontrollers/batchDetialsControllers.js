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

import asyncHandler from 'express-async-handler';


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


