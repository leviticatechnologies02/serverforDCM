import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../../models/payments.js';
import Course from '../../models/courses.js';
import Enrollment from '../../models/Enrollment.js';
import { enrollInCourses } from '../studentcontrollers/coursesEnrollControllers.js';
import mongoose from 'mongoose';
import User from '../../models/user.js';
import Promo from '../../models/promocode.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createOrder = async (req, res) => {
  try {
    const { courseIds, userId, promoCode, promoId } = req.body;
    console.log(courseIds, userId, promoCode, "create order hit");
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
    }

    if (!filteredCourses.length) {
      return res.status(400).json({ error: 'Already enrolled in all selected courses' });
    }

    const totalAmount = filteredCourses.reduce((sum, course) => sum + Number(course.price), 0);

    // 🔹 Validate and apply promo code if provided
    let appliedPromo = null;
    let discount = 0;

    if (promoCode || promoId) {
      if (promoId && mongoose.Types.ObjectId.isValid(promoId)) {
        appliedPromo = await Promo.findById(promoId);
      } else if (promoCode) {
        appliedPromo = await Promo.findOne({ code: String(promoCode).toUpperCase().trim() });
      }

      if (appliedPromo) {
        const now = new Date();
        if (!appliedPromo.isActive) {
          return res.status(400).json({ error: 'Promo code is inactive' });
        }
        if (appliedPromo.expiryDate && new Date(appliedPromo.expiryDate) < now) {
          return res.status(400).json({ error: 'Promo code has expired' });
        }
        if (appliedPromo.usageLimit && appliedPromo.usedCount >= appliedPromo.usageLimit) {
          return res.status(400).json({ error: 'Promo code usage limit reached' });
        }
        if (appliedPromo.minPurchase && totalAmount < appliedPromo.minPurchase) {
          return res.status(400).json({
            error: `Minimum purchase of ₹${appliedPromo.minPurchase} required for this promo`
          });
        }

        if (appliedPromo.discountType === 'percentage') {
          discount = (totalAmount * appliedPromo.discountValue) / 100;
          if (appliedPromo.maxDiscount) {
            discount = Math.min(discount, appliedPromo.maxDiscount);
          }
        } else {
          discount = appliedPromo.discountValue;
        }
        discount = Math.min(discount, totalAmount);
      }
    }

    const finalAmount = Math.max(0, totalAmount - discount);

    // 🔹 Handle 100% discount (Free Enrollment directly)
    if (finalAmount === 0 && totalAmount > 0) {
      const freePayment = await Payment.create({
        orderId: `FREE_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        paymentId: `PROMO_${appliedPromo?.code || 'FREE'}_${Date.now()}`,
        amount: 0,
        amountInRupees: 0,
        originalAmount: totalAmount,
        discount,
        promoId: appliedPromo?._id,
        currency: 'INR',
        status: 'paid',
        paymentMode: 'wallet',
        paymentProvider: 'razorpay',
        receipt: `free_${Date.now()}`,
        courseIds: filteredCourses.map(c => c._id),
        userId,
        isEnrolled: true
      });

      for (const courseId of filteredCourses.map(c => c._id)) {
        await enrollInCourses({
          paymentId: freePayment._id,
          userId,
          courseId
        });
      }

      if (appliedPromo) {
        await Promo.findByIdAndUpdate(appliedPromo._id, { $inc: { usedCount: 1 } });
      }

      return res.json({
        success: true,
        freeEnrollment: true,
        message: 'Successfully enrolled with 100% discount promo code!',
        order: { id: freePayment.orderId, amount: 0, currency: 'INR' },
        discount,
        finalAmount: 0,
        originalAmount: totalAmount
      });
    }

    const amountInPaise = Math.round(finalAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `cart_${Date.now()}`,
      notes: {
        userId: String(userId),
        courseNames: filteredCourses.map(c => c.name).join(', '),
        promoCode: appliedPromo?.code || 'NONE'
      }
    });

    await Payment.create({
      orderId: order.id,
      amount: order.amount,
      amountInRupees: order.amount / 100,
      originalAmount: totalAmount,
      discount,
      promoId: appliedPromo?._id,
      currency: order.currency,
      status: 'created',
      receipt: order.receipt,
      courseIds: filteredCourses.map(c => c._id),
      userId
    });

    res.json({
      order,
      discount,
      finalAmount,
      originalAmount: totalAmount,
      promoCode: appliedPromo?.code
    });
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
    if (payment.promoId) {
      await Promo.findByIdAndUpdate(
        payment.promoId,
        { $inc: { usedCount: 1 } },
        { session }
      );
    }
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

        if (payment.promoId) {
          await Promo.findByIdAndUpdate(payment.promoId, { $inc: { usedCount: 1 } });
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