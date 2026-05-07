import { catchAsync } from '../../../utils/catchAsync.js';
import TasksService from '../service/tasks.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

export const assignTask = catchAsync(async (req, res) => {
  const { title, description, course, batch, dueDate } = req.body;
  const task = await TasksService.assignTask({
    title,
    description,
    course,
    batch,
    dueDate,
    assignedBy: req.user.id
  });
  return successResponse(res, { message: "Task assigned successfully", task }, 201);
});

export const getStudentTasks = catchAsync(async (req, res) => {
  const { course, batch } = req.query;
  const tasks = await TasksService.getStudentTasks({ course, batch });
  return successResponse(res, tasks);
});
