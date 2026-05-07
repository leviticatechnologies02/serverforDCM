import { catchAsync } from '../../../utils/catchAsync.js';
import PromocodesService from '../service/promocodes.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

// 1. Admin Promo Methods
export const getPromos = catchAsync(async (req, res) => {
  const result = await PromocodesService.getPromos();
  return successResponse(res, result);
});

export const createPromo = catchAsync(async (req, res) => {
  const result = await PromocodesService.createPromo(req.body);
  return successResponse(res, result, 201);
});

export const updatePromo = catchAsync(async (req, res) => {
  const result = await PromocodesService.updatePromo(req.params.id, req.body);
  return successResponse(res, result);
});

export const deletePromo = catchAsync(async (req, res) => {
  const result = await PromocodesService.deletePromo(req.params.id);
  return successResponse(res, result);
});

export const togglePromo = catchAsync(async (req, res) => {
  const result = await PromocodesService.togglePromo(req.params.id);
  return successResponse(res, result);
});

// 2. Student Promo Methods
export const applyPromo = catchAsync(async (req, res) => {
  const { code, amount } = req.body;
  const result = await PromocodesService.applyPromo({ code, amount });
  return successResponse(res, result);
});
