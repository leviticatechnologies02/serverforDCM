import Batch from "../../models/batch.js";

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
  console.log("you are in get batch details", req.params.batchName)
  try {
    const {id }= req.params;
    console.log("fetching batches")
    const batch = await Batch.findOne({id}).populate('students').lean()
    console.log("after queryy")
    console.log(batch,"iambatch")

    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const students = batch.students.map(({ _id,  name, email, role }) => ({
      _id,  name, email, role
    }));

    res.status(200).json({ students });
  } catch (err) {
    console.log("there is err in getBatchDetails",err)
    res.status(500).json({ error: 'Failed to fetch batch details' });
  }
};
// controllers/batchController.js

// Mongoose model
import asyncHandler from 'express-async-handler'; // Optional for error handling

// POST /admin/batchs/addBatch
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
// controllers/updateBatchStudents.js


export const updateBatchStudents = async ({ batchId, userIds, session }) => {
  if (!batchId || !Array.isArray(userIds) || userIds.length === 0) return null;

  return await Batch.updateOne(
    { _id: batchId },
    { $addToSet: { students: { $each: userIds } } },
    { session }
  );
};


