import Task from "../../models/Task.js";

// 📌 Assign a new task
export const assignTask = async (req, res) => {
  try {
    const { title, description, course, batch, dueDate } = req.body;

    if (!title || !course || !batch) {
      return res.status(400).json({ message: "Title, Course and Batch are required" });
    }

    const task = new Task({
      title,
      description,
      course,
      batch,
      dueDate,
      assignedBy: req.user.id, // from verifyToken
    });

    await task.save();
    res.status(201).json({ message: "Task assigned successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Error assigning task", error: error.message });
  }
};

// 📌 Get all tasks for a student batch
export const getStudentTasks = async (req, res) => {
  try {
    const { course, batch } = req.query;

    const filter = {};
    if (course) filter.course = course;
    if (batch) filter.batch = batch;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
};
