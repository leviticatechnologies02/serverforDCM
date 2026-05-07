import { catchAsync } from '../../../utils/catchAsync.js';
import PaymentsService from '../service/payments.service.js';
import { successResponse } from '../../../utils/ApiResponse.js';

// 1. Order Creation
export const createOrder = catchAsync(async (req, res) => {
  const { courseIds, userId } = req.body;
  const result = await PaymentsService.createOrder({ courseIds, userId });
  return successResponse(res, { order: result.order });
});

// 2. Razorpay Verification
export const verifyPayment = catchAsync(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId } = req.body;
  const result = await PaymentsService.verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, userId });
  return successResponse(res, result);
});

// 3. Webhook Entrypoint
export const webhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;

  const result = await PaymentsService.handleWebhook({ signature, rawBody });
  res.json(result);
});

// 4. Google Play Store Verification
export const verifyGooglePlayPurchase = catchAsync(async (req, res) => {
  const { userId, packageName, courseId, purchaseToken } = req.body;
  const result = await PaymentsService.verifyGooglePlayPurchase({ userId, packageName, courseId, purchaseToken });
  return successResponse(res, { purchase: result.purchase });
});

// 5. Personal Payments History
export const getMyPayments = catchAsync(async (req, res) => {
  const result = await PaymentsService.getMyPayments(req.user.id);
  return successResponse(res, { count: result.length, payments: result });
});

// 6. Admin Accounting Ledgers
export const getAllTransactions = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);

  const result = await PaymentsService.getAllTransactions({ page, limit });
  return successResponse(res, {
    transactions: result.formatted,
    totalTransactions: result.total,
    totalPages: result.totalPages,
    currentPage: page
  });
});

export const getTransactionStats = catchAsync(async (req, res) => {
  const result = await PaymentsService.getTransactionStats();
  return successResponse(res, { stats: result });
});

export const getAllInternshipPayments = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const search = req.query.search || "";
  const status = req.query.status;

  const result = await PaymentsService.getAllInternshipPayments({ page, limit, search, status });
  return successResponse(res, {
    data: result.formattedPayments,
    pagination: {
      total: result.total,
      page,
      limit,
      totalPages: result.totalPages
    }
  });
});

export const getCombinedPaymentStats = catchAsync(async (req, res) => {
  const result = await PaymentsService.getCombinedPaymentStats();
  return successResponse(res, { data: result });
});

export const downloadPaymentsExcel = catchAsync(async (req, res) => {
  const workbook = await PaymentsService.downloadPaymentsExcel();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=all_payments.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();
});
