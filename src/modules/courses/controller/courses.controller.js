import { catchAsync } from '../../../utils/catchAsync.js';
import CoursesService from '../service/courses.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

export const getCourses = catchAsync(async (req, res) => {
  const result = await CoursesService.getCourses();
  return successResponse(res, { data: result });
});

export const getFreeCourses = catchAsync(async (req, res) => {
  const result = await CoursesService.getFreeCourses();
  return successResponse(res, { count: result.length, data: result });
});

export const addCourse = catchAsync(async (req, res) => {
  const { name, duration, price, category, thumbnail, shortdescription } = req.body;
  const result = await CoursesService.addCourse({ name, duration, price, category, thumbnail, shortdescription });
  return successResponse(res, { message: 'Course added', data: result, status: 201 });
});

export const updateCourse = catchAsync(async (req, res) => {
  const result = await CoursesService.updateCourse({
    id: req.params.id,
    incoming: req.body,
    user: req.user
  });
  return successResponse(res, result);
});

export const deleteCourse = catchAsync(async (req, res) => {
  const result = await CoursesService.deleteCourse(req.params.id);
  return successResponse(res, result);
});

export const getCourseById = catchAsync(async (req, res) => {
  const result = await CoursesService.getCourseById(req.params.id);
  return successResponse(res, { data: result });
});

export const addCourseDetails = catchAsync(async (req, res) => {
  const { description, objectives, requirements, curriculum } = req.body;
  const result = await CoursesService.addCourseDetails({
    courseId: req.params.courseId,
    description,
    objectives,
    requirements,
    curriculum
  });
  return successResponse(res, { message: 'Course details added successfully', data: result, status: 201 });
});

export const updateCourseDetails = catchAsync(async (req, res) => {
  const result = await CoursesService.updateCourseDetails({
    courseId: req.params.courseId,
    updateData: req.body
  });
  return successResponse(res, { message: "Course details updated", data: result });
});

export const updateCurriculum = catchAsync(async (req, res) => {
  const result = await CoursesService.updateCurriculum({
    courseId: req.params.courseId,
    curriculum: req.body.curriculum
  });
  return successResponse(res, { message: "Curriculum updated", data: result });
});

export const getCourseCategories = catchAsync(async (req, res) => {
  const result = await CoursesService.getCourseCategories();
  return successResponse(res, { data: result });
});
