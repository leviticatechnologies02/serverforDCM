import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../../models/payments.js';
import Course from '../../models/courses.js';
import Enrollment from '../../models/Enrollment.js';
import { enrollInCourses } from '../studentcontrollers/coursesEnrollControllers.js';
import mongoose from 'mongoose';
import User from '../../models/user.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createOrder = async (req, res) => {
  try {
    const { courseIds, userId } = req.body;
    console.log(courseIds, userId, "create order hit")
    const courses = await Course.find({ _id: { $in: courseIds } }).lean();
    if (!courses.length) return res.status(404).json({ error: 'Courses not found' });

    const alreadyEnrolled = await Enrollment.findOne({ user: userId }).lean();
    const enrolledIds = new Set(
      alreadyEnrolled?.enrolledCourses?.map(ec => String(ec.course)) || []
    );

    let filteredCourses = courses.filter(
      course => !enrolledIds.has(String(course._id))
    );

    // ✅ Check if any paid course exists
    const hasPaidCourse = filteredCourses.some(
      c => Number(c.price) > 0
    );

    if (hasPaidCourse) {
      // Find free course (price = 0)
      const freeCourse = await Course.findOne({ price: 0 }).lean();

      if (
        freeCourse &&
        !enrolledIds.has(String(freeCourse._id)) && // not already enrolled
        !filteredCourses.some(
          c => String(c._id) === String(freeCourse._id)
        ) // not already added in this order
      ) {
        filteredCourses.push(freeCourse);
      }
    } if (!filteredCourses.length) {
      return res.status(400).json({ error: 'Already enrolled in all selected courses' });
    }

    const totalAmount = filteredCourses.reduce((sum, course) => sum + Number(course.price), 0);
    const amountInPaise = Math.round(totalAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `cart_${Date.now()}`,
      notes: {
        userId: String(userId),
        courseNames: filteredCourses.map(c => c.name).join(', ')
      }
    });

    await Payment.create({
      orderId: order.id,
      amount: order.amount,
      amountInRupees: order.amount / 100,
      currency: order.currency,
      status: 'created',
      receipt: order.receipt,
      courseIds: filteredCourses.map(c => c._id),
      userId
    });

    res.json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};



export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
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
      session.endSession();
      return res.status(200).json({ success: true });
    }

    if (!isAuthentic) {
      await session.commitTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid signature' });
    }

    for (const courseId of payment.courseIds) {
      await enrollInCourses({
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
    session.endSession();


    console.log('✅ verifyPayment route hit');
    res.status(200).json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ verifyPayment error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
}; 


export const webhook = async (req, res) => {

  console.log("webhook hitted");

  try {

    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body;

    if (!signature || !rawBody) {
      return res.status(400).send('Missing signature or body');
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody.toString())
      .digest('hex');

    console.log("🔐 Received Signature:", signature);
    console.log("🔐 Expected Signature:", expected);

    if (expected !== signature) {
      console.warn('❌ Invalid webhook signature');
      return res.status(400).send('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    const entity = event.payload.payment?.entity;

    if (!entity) {
      return res.json({ received: true });
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
    }
    else if (method === 'wallet' && wallet) {
      appUsed = wallet.toLowerCase();
    }
    else if (method === 'card' && card?.network) {
      appUsed = card.network.toLowerCase();
    }

    /* ---------------- PAYMENT SUCCESS ---------------- */

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

        /* enroll courses */

        for (const courseId of payment.courseIds) {
          await enrollInCourses({
            paymentId: payment._id,
            userId: payment.userId,
            courseId
          });
        }

        console.log(`✅ Webhook processed for payment ${paymentId}`);

        /* send response immediately */
        res.json({ received: true });

        /* ---------- SEND EMAIL IN BACKGROUND ---------- */

        (async () => {
          try {

            const user = await User.findById(payment.userId).select("name email");

            const courses = await Course.find({
              _id: { $in: payment.courseIds }
            }).select("name");

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

            console.log("📧 Confirmation email sent");

          } catch (emailError) {

            console.error("Email failed but payment already saved", emailError);

          }
        })();

        return;
      }

    }

    /* ---------------- PAYMENT FAILED ---------------- */

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

      console.warn(`⚠️ Payment failed for order ${orderId}`);
    }

    res.json({ received: true });

  } catch (err) {

    console.error('❌ Webhook error:', err);
    res.status(500).send('Webhook processing error');

  }

};

export const simulateWebPayment = async (req, res) => {
  try {
    const { courseIds, userId } = req.body;
    if (!courseIds || !courseIds.length || !userId) {
      return res.status(400).json({ error: 'Missing courseIds or userId' });
    }

    const courses = await Course.find({ _id: { $in: courseIds } }).lean();
    if (!courses.length) return res.status(404).json({ error: 'Courses not found' });

    const totalAmount = courses.reduce((sum, course) => sum + Number(course.price), 0);

    const payment = await Payment.create({
      orderId: `MOCK_${Date.now()}`,
      paymentId: `PAY_${Date.now()}`,
      amount: totalAmount * 100,
      amountInRupees: totalAmount,
      currency: 'INR',
      status: 'paid',
      paymentProvider: 'google_play',
      paymentMode: 'google_play',
      courseIds,
      userId,
      isEnrolled: true
    });

    for (const courseId of courseIds) {
      await enrollInCourses({
        paymentId: payment._id,
        userId,
        courseId
      });
    }

    console.log(`✅ Mock/Test payment processed for user ${userId}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ simulateWebPayment error:', err);
    res.status(500).json({ error: err.message || 'Test payment failed' });
  }
};