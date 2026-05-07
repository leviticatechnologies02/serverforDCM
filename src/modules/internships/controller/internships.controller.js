import { catchAsync } from '../../../utils/catchAsync.js';
import InternshipsService from '../service/internships.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

// 1. Domain Administration
export const createInternshipsDomain = catchAsync(async (req, res) => {
  const result = await InternshipsService.createInternshipsDomain(req.body);
  return successResponse(res, { message: "Internships domain created successfully", data: result, status: 201 });
});

export const getAllInternshipsDomains = catchAsync(async (req, res) => {
  const { all, isActive } = req.query;
  const result = await InternshipsService.getAllInternshipsDomains({ all, isActive });
  return successResponse(res, { count: result.length, data: result });
});

export const getInternshipsDomainById = catchAsync(async (req, res) => {
  const result = await InternshipsService.getInternshipsDomainById(req.params.id);
  return successResponse(res, { data: result });
});

export const updateInternshipsDomain = catchAsync(async (req, res) => {
  const result = await InternshipsService.updateInternshipsDomain(req.params.id, req.body);
  return successResponse(res, { message: "InternshipsDomain updated successfully", data: result });
});

export const deleteInternshipsDomain = catchAsync(async (req, res) => {
  const result = await InternshipsService.deleteInternshipsDomain(req.params.id);
  return successResponse(res, result);
});

// 2. Internship Purchases & checkout
export const createOrder = catchAsync(async (req, res) => {
  const { name, email, phone, department, semester, program, rollNumber, amount, collegeName, collegeCode, domain } = req.body;
  const result = await InternshipsService.createOrder({
    name, email, phone, department, semester, program, rollNumber, amount, collegeName, collegeCode, domain
  });

  return successResponse(res, {
    message: 'Order created successfully',
    order: {
      id: result.order.id,
      amount: result.order.amount,
      currency: result.order.currency,
      receipt: result.order.receipt
    },
    key: process.env.RAZORPAY_KEY_ID,
    student: { name, email, rollNumber }
  });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const result = await InternshipsService.verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

  if (result.alreadyVerified) {
    return successResponse(res, {
      message: "Payment already verified",
      paymentId: result.paymentId,
      student: result.student,
      receipt: result.receipt
    });
  }

  if (result.alreadyProcessed) {
    return successResponse(res, { message: "Payment already processed" });
  }

  return successResponse(res, {
    message: "Payment verified successfully!",
    paymentId: result.paymentId,
    student: result.student,
    receipt: result.receipt
  });
});

export const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const body = req.body;

  const result = await InternshipsService.handleWebhook({ signature, body });
  res.json(result);
});

export const getPayment = catchAsync(async (req, res) => {
  const result = await InternshipsService.getPayment(req.params.orderId);
  return successResponse(res, { data: result });
});
