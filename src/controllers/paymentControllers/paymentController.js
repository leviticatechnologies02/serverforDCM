
import crypto from 'crypto';
import Razorpay from 'razorpay';

import Payment from '../../models/payments.js ';

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// Create order
 export const createOrder= async (req, res) => {
  console.log("iam in order")
  try {
    const { courseId, userId } = req.body;

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

    // 3) Store initial payment record (status=pending)
    await Payment.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: 'created',
      receipt: order.receipt,
      courseId: course._id,
      userId
    });

    res.json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

// Verify (handler callback from frontend)
 export const verifyPayment = async (req, res) => {
  console.log("iam in verifty")
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 1) Compute expected signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    // 2) Update record idempotently
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        $set: {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: isAuthentic ? 'paid' : 'signature_invalid'
        }
      },
      { new: true }
    );

    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    if (!isAuthentic) return res.status(400).json({ error: 'Invalid signature' });

    // 3) TODO: Grant access/enroll the user transactionally here

    res.json({ success: true });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
}

// Webhook (server-to-server, most reliable). Use raw body ONLY for this route.
 export const webhook=async (req, res) => {
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

        await Payment.findOneAndUpdate(
          { orderId },
          {
            $set: {
              paymentId,
              status: 'paid',
              meta: event
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
          { $set: { status: 'failed', meta: event } }
        );
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).send('Webhook processing error');
    }
  }

