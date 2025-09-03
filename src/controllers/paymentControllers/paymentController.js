import crypto from 'crypto';
import Razorpay from 'razorpay';
import moment from 'moment-timezone';

import Payment from '../../models/payments.js';
import Course from '../../models/courses.js';
import { enrollInCourses } from '../studentcontrollers/coursesEnrollControllers.js';

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
export const createOrder = async (req, res) => {
  console.log("iam in order");
  try {
    const { courseId, userId } = req.body;
    console.log(courseId, userId, "sammmmm");

    // 1) Resolve authoritative amount from DB (never trust client)
    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const amountInPaise = Math.round(Number(course.price) * 100); // INR->paise
    if (Number.isNaN(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({ error: 'Invalid course price' });
    }

    // 2) Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { courseId: String(course._id), userId: String(userId) }
    });

    // Convert Razorpay created_at (epoch seconds, UTC) to IST
    const createdAtUTC = new Date(order.created_at * 1000);
    const createdAtIST = moment.unix(order.created_at).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // 3) Store initial payment record (status=pending)
    await Payment.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: 'created',
      receipt: order.receipt,
      courseId: course._id,
      userId,
      createdAtUTC,
      createdAtIST
    });

    res.json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Verify (handler callback from frontend)
export const verifyPayment = async (req, res) => {
  console.log("iam in verifty");
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId, courseId } = req.body;
    console.log("body for verify", req.body);

    // 1) Compute expected signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpaySignature;

    // 2) Update record idempotently
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpayOrderId },
      {
        $set: {
          paymentId: razorpayPaymentId,
          signature: razorpaySignature,
          status: isAuthentic ? 'paid' : 'signature_invalid',
          updatedAtIST: moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
        }
      },
      { new: true }
    );

    console.log(payment, "iam ior");

    if (payment && payment.status === 'paid') {
      enrollInCourses({
        paymentId: payment._id,
        userId,
        courseId
      });
    }

    if (!payment) return res.status(404).json({ error: 'Payment record not found' });
    if (!isAuthentic) return res.status(400).json({ error: 'Invalid signature' });

    res.json({ success: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Webhook (server-to-server, most reliable). Use raw body ONLY for this route.
export const webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body) // raw buffer
      .digest('hex');

    if (expected !== signature) {
      return res.status(400).send('Invalid webhook signature');
    }

    const event = JSON.parse(req.body.toString());

    // Handle events: payment.captured, order.paid, payment.failed, etc.
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const orderId = event.payload.payment?.entity?.order_id || event.payload.order?.entity?.id;
      const paymentId = event.payload.payment?.entity?.id;
      const createdAtUTC = event.payload.payment?.entity?.created_at
        ? new Date(event.payload.payment.entity.created_at * 1000)
        : new Date();
      const createdAtIST = event.payload.payment?.entity?.created_at
        ? moment.unix(event.payload.payment.entity.created_at).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
        : moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

      await Payment.findOneAndUpdate(
        { orderId },
        {
          $set: {
            paymentId,
            status: 'paid',
            meta: event,
            createdAtUTC,
            createdAtIST
          }
        },
        { upsert: false }
      );

      // TODO: Grant access/enroll user, send receipt email, etc.
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment?.entity?.order_id;
      await Payment.findOneAndUpdate(
        { orderId },
        {
          $set: {
            status: 'failed',
            meta: event,
            updatedAtIST: moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")
          }
        }
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Webhook processing error');
  }
};
