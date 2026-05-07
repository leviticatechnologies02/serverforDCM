import Task from '../../../models/Task.js';
import ApiError from '../../../utils/ApiError.js';

export class TasksService {
  static async assignTask({ title, description, course, batch, dueDate, assignedBy }) {
    if (!title || !course || !batch) {
      throw new ApiError(400, "Title, Course, and Batch are required");
    }

    const task = new Task({
      title,
      description,
      course,
      batch,
      dueDate,
      assignedBy
    });

    await task.save();
    return task;
  }

  static async getStudentTasks({ course, batch }) {
    const filter = {};
    if (course) filter.course = course;
    if (batch) filter.batch = batch;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    return tasks;
  }
}

export default TasksService;
