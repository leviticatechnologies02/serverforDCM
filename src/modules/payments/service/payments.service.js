import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import Payment from '../../../models/payments.js';
import Course from '../../../models/courses.js';
import Enrollment from '../../../models/Enrollment.js';
import User from '../../../models/user.js';
import GooglePlayPurchase from '../../../models/googlePlayPurchase.js';
import InternshipPayment from '../../../models/InternshipPayment.js';
import ApiError from '../../../utils/ApiError.js';
import { verifyProductPurchase, acknowledgeProductPurchase } from '../../../services/googlePlayService.js';
import { StudentsService } from '../../students/service/students.service.js';
import { getCoursePaymentSuccessEmailHTML } from '../../../utils/email/generateHTML.js';
import { sendEmail } from '../../../utils/email/sendEmail.js';
import logger from '../../../utils/logger.js';
import ExcelJS from 'exceljs';

// Lazy instantiation of Razorpay to prevent runtime errors during startup/testing without keys
let razorpayInstance = null;

export class PaymentsService {
  static getRazorpay() {
    if (!razorpayInstance) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) {
        throw new ApiError(500, 'Razorpay integration keys are not configured.');
      }
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    }
    return razorpayInstance;
  }

  // 1. Order Creation
  static async createOrder({ courseIds, userId }) {
    if (!courseIds || !userId) {
      throw new ApiError(400, 'courseIds and userId are required');
    }

    const courses = await Course.find({ _id: { $in: courseIds } }).lean();
    if (!courses.length) throw new ApiError(404, 'Courses not found');

    const alreadyEnrolled = await Enrollment.findOne({ user: userId }).lean();
    const enrolledIds = new Set(
      alreadyEnrolled?.enrolledCourses?.map(ec => String(ec.course)) || []
    );

    let filteredCourses = courses.filter(
      course => !enrolledIds.has(String(course._id))
    );

    const hasPaidCourse = filteredCourses.some(c => Number(c.price) > 0);

    if (hasPaidCourse) {
      const freeCourse = await Course.findOne({ price: 0 }).lean();

      if (
        freeCourse &&
        !enrolledIds.has(String(freeCourse._id)) &&
        !filteredCourses.some(c => String(c._id) === String(freeCourse._id))
      ) {
        filteredCourses.push(freeCourse);
      }
    }

    if (!filteredCourses.length) {
      throw new ApiError(400, 'Already enrolled in all selected courses');
    }

    const totalAmount = filteredCourses.reduce((sum, course) => sum + Number(course.price), 0);
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpay = this.getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `cart_${Date.now()}`,
      notes: {
        userId: String(userId),
        courseNames: filteredCourses.map(c => c.name).join(', ')
      }
    });

    const paymentRecord = await Payment.create({
      orderId: order.id,
      amount: order.amount,
      amountInRupees: order.amount / 100,
      currency: order.currency,
      status: 'created',
      receipt: order.receipt,
      courseIds: filteredCourses.map(c => c._id),
      userId
    });

    return { order, paymentRecord };
  }

  // 2. Razorpay Payment Verification
  static async verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, userId }) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const isAuthentic = expectedSignature === razorpaySignature;

      const payment = await Payment.findOneAndUpdate(
        { orderId: razorpayOrderId, isEnrolled: false },
        {
          $set: {
            paymentId: razorpayPaymentId,
            signature: razorpaySignature,
            status: isAuthentic ? 'paid' : 'signature_invalid',
            isEnrolled: true
          }
        },
        { new: true, session }
      );

      if (!payment) {
        await session.commitTransaction();
        return { success: true };
      }

      if (!isAuthentic) {
        await session.commitTransaction();
        throw new ApiError(400, 'Invalid signature');
      }

      for (const courseId of payment.courseIds) {
        await StudentsService.enrollInCourses({
          paymentId: payment._id,
          userId,
          courseId,
          session
        });
      }

      await Payment.updateOne(
        { _id: payment._id },
        { $set: { isEnrolled: true } },
        { session }
      );

      await session.commitTransaction();
      return { success: true };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // 3. Webhook Handling
  static async handleWebhook({ signature, rawBody }) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody.toString())
      .digest('hex');

    if (expected !== signature) {
      throw new ApiError(400, 'Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    const entity = event.payload.payment?.entity;

    if (!entity) {
      return { received: true };
    }

    const orderId = entity?.order_id || event.payload.order?.entity?.id;
    const paymentId = entity?.id;

    const method = entity?.method || 'unknown';
    const vpa = entity?.vpa || null;
    const wallet = entity?.wallet || null;
    const card = entity?.card || null;

    let appUsed = null;

    if (method === 'upi' && vpa) {
      const suffix = vpa.split('@')[1];
      appUsed = suffix?.toLowerCase();
    } else if (method === 'wallet' && wallet) {
      appUsed = wallet.toLowerCase();
    } else if (method === 'card' && card?.network) {
      appUsed = card.network.toLowerCase();
    }

    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const payment = await Payment.findOneAndUpdate(
        { orderId, isEnrolled: false },
        {
          $set: {
            paymentId,
            signature,
            status: 'paid',
            paymentMode: method,
            appUsed,
            meta: event,
            isEnrolled: true
          }
        },
        { new: true }
      );

      if (payment) {
        for (const courseId of payment.courseIds) {
          await StudentsService.enrollInCourses({
            paymentId: payment._id,
            userId: payment.userId,
            courseId
          });
        }

        // Email Notification asynchronously
        (async () => {
          try {
            const user = await User.findById(payment.userId).select("name email");
            const courses = await Course.find({ _id: { $in: payment.courseIds } }).select("name");
            const courseTitles = courses.map(c => c.name);

            const emailHTML = getCoursePaymentSuccessEmailHTML(
              user.name,
              user.email,
              {
                courses: courseTitles,
                amount: payment.amount
              },
              {
                paymentId,
                orderId,
                date: new Date().toLocaleDateString("en-IN")
              }
            );

            await sendEmail({
              to: user.email,
              subject: "Course Payment Successful 🎉",
              html: emailHTML
            });
          } catch (emailError) {
            logger.error("Webhook confirmation email failed: ", emailError);
          }
        })();

        return { received: true };
      }
    }

    if (event.event === 'payment.failed') {
      await Payment.findOneAndUpdate(
        { orderId },
        {
          $set: {
            status: 'failed',
            paymentMode: entity?.method || 'unknown',
            appUsed: null,
            meta: event
          }
        }
      );
    }

    return { received: true };
  }

  // 4. Google Play Store Purchases
  static async verifyGooglePlayPurchase({ userId, packageName, courseId, purchaseToken }) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const existing = await GooglePlayPurchase.findOne({ purchaseToken }).session(session);
      if (existing) {
        if (existing.status === 'verified' || existing.status === 'acknowledged') {
          await session.commitTransaction();
          return { success: true, message: 'Purchase already processed', purchase: existing };
        }
        throw new ApiError(400, 'Purchase token already exists');
      }

      const googleRes = await verifyProductPurchase({ packageName, productId: courseId, purchaseToken });

      if (googleRes.purchaseState !== 0) {
        await GooglePlayPurchase.create([
          {
            userId,
            productId: courseId,
            purchaseToken,
            orderId: googleRes.orderId || null,
            purchaseTime: googleRes.purchaseTimeMillis ? new Date(Number(googleRes.purchaseTimeMillis)) : null,
            rawResponse: googleRes,
            status: 'failed'
          }
        ], { session });

        await session.commitTransaction();
        throw new ApiError(400, 'Invalid purchase state');
      }

      const purchaseDoc = await GooglePlayPurchase.create([
        {
          userId,
          productId: courseId,
          purchaseToken,
          orderId: googleRes.orderId || null,
          purchaseTime: googleRes.purchaseTimeMillis ? new Date(Number(googleRes.purchaseTimeMillis)) : null,
          rawResponse: googleRes,
          status: 'verified'
        }
      ], { session });

      const created = purchaseDoc[0];

      try {
        await acknowledgeProductPurchase({ packageName, productId: courseId, purchaseToken });
        await GooglePlayPurchase.updateOne({ _id: created._id }, { $set: { status: 'acknowledged' } }).session(session);
      } catch (ackErr) {
        logger.error('Google Play purchase acknowledge failed: ', ackErr);
      }

      await StudentsService.enrollInCourses({ paymentId: null, userId, courseId, session });

      await session.commitTransaction();
      return { success: true, purchase: created };
    } catch (err) {
      await session.abortTransaction();
      if (err && err.code === 11000) {
        const existing = await GooglePlayPurchase.findOne({ purchaseToken });
        return { success: true, message: 'Purchase already recorded', purchase: existing };
      }
      throw err;
    } finally {
      session.endSession();
    }
  }

  // 5. Personal Payments History Lookup
  static async getMyPayments(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }

    const payments = await Payment.find({ userId })
      .select("amountInRupees status isEnrolled paymentMode appUsed orderId paymentId courseIds createdAt")
      .populate({
        path: "courseIds",
        select: "name thumbnail price category",
      })
      .sort({ createdAt: -1 })
      .lean();

    return payments;
  }

  // 6. Admin Payments Ledger
  static async getAllTransactions({ page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const totalTransactions = await Payment.countDocuments();
    const transactions = await Payment.find()
      .populate("courseIds", "name price")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = transactions.map(transaction => {
      const user = transaction.userId || {};
      return {
        _id: transaction._id,
        paymentId: transaction.paymentId,
        orderId: transaction.orderId,
        appUsed: transaction.appUsed,
        paymentMode: transaction.paymentMode,
        amount: transaction.amountInRupees || 0,
        status: transaction.status,
        courses: Array.isArray(transaction.courseIds)
          ? transaction.courseIds.map(course => ({
              _id: course._id || "",
              name: course.name || "Unknown Course",
              price: course.price || 0
            }))
          : [],
        user: {
          _id: user._id || "",
          name: user.name || "Unknown User",
          email: user.email || ""
        },
        createdAt: transaction.createdAt,
        updatedAtIST: transaction.updatedAt || transaction.createdAt
      };
    });

    return {
      formatted,
      total: totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit)
    };
  }

  static async getTransactionStats() {
    const totalTransactions = await Payment.countDocuments();
    const successfulTransactions = await Payment.countDocuments({ status: 'paid' });
    const failedTransactions = totalTransactions - successfulTransactions;

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amountInRupees' } } }
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      totalRevenue: revenue
    };
  }

  static async getAllInternshipPayments({ page = 1, limit = 10, search = "", status }) {
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
        { domain: { $regex: search, $options: "i" } },
      ],
    };

    if (status) query.status = status;

    const [payments, total] = await Promise.all([
      InternshipPayment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InternshipPayment.countDocuments(query),
    ]);

    const formattedPayments = payments.map((p) => {
      const paymentEntity = p.meta?.payload?.payment?.entity || {};

      return {
        _id: p._id,
        orderId: p.razorpayOrderId,
        paymentId: p.razorpayPaymentId,
        name: p.name,
        email: p.email,
        rollNumber: p.rollNumber,
        title: p.domain,
        type: "Internship",
        amount: p.amount,
        status: p.status,
        paymentMode: p.paymentMode || "unknown",
        appUsed: p.appUsed || "-",
        bank: paymentEntity.bank || null,
        vpa: paymentEntity.vpa || null,
        wallet: paymentEntity.wallet || null,
        createdAt: p.createdAt,
      };
    });

    return {
      formattedPayments,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getCombinedPaymentStats() {
    const [courseRevenue, internshipRevenue] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amountInRupees" } } },
      ]),
      InternshipPayment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const courseTotal = courseRevenue[0]?.total || 0;
    const internshipTotal = internshipRevenue[0]?.total || 0;

    return {
      totalRevenue: courseTotal + internshipTotal,
      courseRevenue: courseTotal,
      internshipRevenue: internshipTotal,
    };
  }

  static async downloadPaymentsExcel() {
    const [coursePayments, internshipPayments] = await Promise.all([
      Payment.find()
        .populate("courseIds", "name")
        .populate("userId", "name email")
        .lean(),
      InternshipPayment.find().lean(),
    ]);

    const workbook = new ExcelJS.Workbook();

    // Course Payments Sheet
    const courseSheet = workbook.addWorksheet("Course Payments");
    courseSheet.columns = [
      { header: "Order ID", key: "orderId", width: 22 },
      { header: "Payment ID", key: "paymentId", width: 22 },
      { header: "User", key: "name", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Course", key: "course", width: 25 },
      { header: "Mode", key: "paymentMode", width: 12 },
      { header: "App Used", key: "appUsed", width: 14 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Date", key: "date", width: 22 },
    ];

    coursePayments.forEach((p) => {
      const user = p.userId || {};
      const courses = Array.isArray(p.courseIds)
        ? p.courseIds.map((c) => c.name).join(", ")
        : "";

      courseSheet.addRow({
        orderId: p.orderId,
        paymentId: p.paymentId,
        name: user.name,
        email: user.email,
        course: courses,
        paymentMode: p.paymentMode,
        appUsed: p.appUsed,
        amount: p.amountInRupees,
        status: p.status,
        date: new Date(p.createdAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      });
    });

    // Internship Payments Sheet
    const internshipSheet = workbook.addWorksheet("Internship Payments");
    internshipSheet.columns = [
      { header: "Order ID", key: "orderId", width: 22 },
      { header: "Payment ID", key: "paymentId", width: 22 },
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 28 },
      { header: "Domain", key: "domain", width: 20 },
      { header: "Program", key: "program", width: 15 },
      { header: "Mode", key: "paymentMode", width: 12 },
      { header: "App Used", key: "appUsed", width: 14 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Date", key: "date", width: 22 },
    ];

    internshipPayments.forEach((p) => {
      internshipSheet.addRow({
        orderId: p.razorpayOrderId,
        paymentId: p.razorpayPaymentId,
        name: p.name,
        email: p.email,
        domain: p.domain,
        program: p.program,
        paymentMode: p.paymentMode,
        appUsed: p.appUsed,
        amount: p.amount,
        status: p.status,
        date: new Date(p.createdAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      });
    });

    return workbook;
  }
}

export default PaymentsService;
