import { catchAsync } from '../../../utils/catchAsync.js';
import MentorsService from '../service/mentors.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

export const createMentor = catchAsync(async (req, res) => {
  const { name, email, mobile, expertise } = req.body;
  const result = await MentorsService.createMentor({ name, email, mobile, expertise });
  return successResponse(res, { message: "Mentor created successfully", mentor: result, status: 201 });
});

export const getMentors = catchAsync(async (req, res) => {
  const result = await MentorsService.getMentors(req.query);
  return successResponse(res, result);
});

export const updateMentor = catchAsync(async (req, res) => {
  const result = await MentorsService.updateMentor(req.params.id, req.body);
  return successResponse(res, { message: "Mentor updated successfully", mentor: result });
});

export const deleteMentor = catchAsync(async (req, res) => {
  const result = await MentorsService.deleteMentor(req.params.id);
  return successResponse(res, result);
});
