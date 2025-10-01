import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../../models/payments.js';
import Course from '../../models/courses.js';
import Enrollment from '../../models/Enrollment.js';
import { enrollInCourses } from '../studentcontrollers/coursesEnrollControllers.js';
import Notice from '../../models/Notice.js';
import User from '../../models/user.js'; // ✅ only student model is needed

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createOrder = async (req, res) => {
  try {
    const { courseIds, userId } = req.body;

    const courses = await Course.find({ _id: { $in: courseIds } }).lean();
    if (!courses.length) return res.status(404).json({ error: 'Courses not found' });

    const alreadyEnrolled = await Enrollment.findOne({ user: userId }).lean();
    const enrolledIds = new Set(
      alreadyEnrolled?.enrolledCourses?.map(ec => String(ec.course)) || []
    );

    const filteredCourses = courses.filter(course => !enrolledIds.has(String(course._id)));
    if (!filteredCourses.length) {
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
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId } = req.body;

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpaySignature;

    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpayOrderId },
      {
        $set: {
          paymentId: razorpayPaymentId,
          signature: razorpaySignature,
          status: isAuthentic ? 'paid' : 'signature_invalid'
        }
      },
      { upsert: false, new: true }
    );

    if (!payment) return res.status(404).json({ error: 'Payment record not found' });
    if (!isAuthentic) return res.status(400).json({ error: 'Invalid signature' });

    // Enroll student in courses
    const alreadyEnrolled = await Enrollment.findOne({ user: userId }).lean();
    const enrolledIds = new Set(
      alreadyEnrolled?.enrolledCourses?.map(ec => String(ec.course)) || []
    );

    const toEnroll = payment.courseIds.filter(id => !enrolledIds.has(String(id)));

    for (const courseId of toEnroll) {
      await enrollInCourses({ paymentId: payment._id, userId, courseId });
    }

    console.log("verfied hitted")

    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body; // must be raw buffer if using express.raw()

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      return res.status(400).send('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    const entity = event.payload.payment?.entity;

    if (event.event === 'order.paid' || event.event === 'payment.captured') {
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

      const payment = await Payment.findOneAndUpdate(
        { orderId },
        {
          $set: {
            paymentId,
            status: 'paid',
            paymentMode: method,
            appUsed,
            meta: event
          }
        },
        { upsert: false, new: true }
      );

      // ✅ Create admin notice from webhook
      if (payment) {
        const student = await User.findById(payment.userId).select('name email');
        await Notice.create({
          title: 'New Payment Received (Webhook)',
          description: `${student?.name || 'A student'} (${student?.email}) has successfully paid ₹${payment.amountInRupees}`,
          noticeType: 'Payment Notification',
          priority: 'High',
          targetAudience: 'Role Specific',
          userRole: 'admin',
          createdBy: payment.userId,
          status: 'published',
          publishedAt: new Date()
        });
      }
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment?.entity?.order_id;
      await Payment.findOneAndUpdate(
        { orderId },
        {
          $set: {
            status: 'failed',
            paymentMode: event.payload.payment?.entity?.method || 'unknown',
            appUsed: null,
            meta: event
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
