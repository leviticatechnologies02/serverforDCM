import { getInternshipPaymentSuccessEmailHTML, getProgramDisplayName } from '../../utils/Email/generateHTML.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import InternshipPayment from '../../models/InternshipPayment.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';
import InternshipsDomain from '../../models/internshipsDomain.js';



// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
export const createOrder = async (req, res) => {

  try {
    const { name, email, phone, department, semester, program, rollNumber, amount, collegeName, collegeCode, domain } = req.body;
    console.log('Received request:', req.body);

    // Validate required fields
    if (!name || !email || !phone || !department || !semester || !rollNumber || !program || !amount || !collegeName || !collegeCode || !domain) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check for existing payment
    const existingPayment = await InternshipPayment.findOne({
      email,
      rollNumber,
      program: program,
      collegeName,
      collegeCode,
      status: { $nin: ['created', 'failed'] } // Only check non-failed payments
    });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: 'Payment already exists for this program'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Find domain
    const selectedDomain = await InternshipsDomain.findById(domain);

    if (!selectedDomain) {
      return res.status(400).json({
        success: false,
        message: 'Invalid domain selected'
      });
    }

    // Find duration
    const selectedDuration = selectedDomain.durations.find(
      (d) => String(d.days) === String(program)
    );

    if (!selectedDuration) {
      return res.status(400).json({
        success: false,
        message: 'Invalid program selected'
      });
    }

    const options = {
      amount: selectedDuration.fee * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${rollNumber}`,
      notes: {
        name,
        email,
        phone,
        department,
        semester,
        rollNumber,
        program: selectedDuration.days,
        collegeName,
        collegeCode,
        domain: selectedDomain.name,
        domainId: domain
      }
    };


    // Create order in Razorpay
    const order = await razorpay.orders.create(options);

    // Save payment record in database - USE DIFFERENT VARIABLE NAME
    const paymentRecord = new InternshipPayment({
      name,
      email,
      phone,
      department,
      semester,
      rollNumber,
      amount: selectedDuration.fee,
      program: selectedDuration.days,
      collegeName,
      collegeCode,
      domain: selectedDomain.name,
      domainId: selectedDomain._id,
      razorpayOrderId: order.id,
      receipt: options.receipt,
      status: 'created'
    });

    await paymentRecord.save();
    console.log('Payment record saved:', paymentRecord._id);

    res.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key: process.env.RAZORPAY_KEY_ID,
      student: {
        name,
        email,
        rollNumber,
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Verify Payment


export const verifyPayment = async (req, res) => {
  console.log("Received verification request:", req.body);

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const paymentRecord = await InternshipPayment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }
    if (paymentRecord.status === "paid") {
      return res.json({
        success: true,
        message: "Payment already verified",
        paymentId: paymentRecord.razorpayPaymentId,
        student: {
          name: paymentRecord.name,
          email: paymentRecord.email,
          rollNumber: paymentRecord.rollNumber,
          program: paymentRecord.program,
          amount: paymentRecord.amount,
        },
        receipt: paymentRecord.receipt,
      });
    }

    if (paymentRecord.status !== "pending") {
      return res.json({
        success: true,
        message: "Payment already processed",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      paymentRecord.status = "failed";
      await paymentRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Update payment
    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.status = "paid";

    await paymentRecord.save();

    console.log("Payment verified successfully:", razorpay_payment_id);

    // ================= Send Email =================

    try {
      const programDetails = {
        domain: paymentRecord.domain,
        program: paymentRecord.program === "5" ? "5 Days program" : "15 Days program",
        duration:
          paymentRecord.program === "5" ? "5 Days" : "15 Days",
        amount: paymentRecord.amount,
      };

      const paymentDetails = {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        date: new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      const emailHTML = getInternshipPaymentSuccessEmailHTML(
        paymentRecord.name,
        paymentRecord.email,
        programDetails,
        paymentDetails
      );

      await sendEmail({
        to: paymentRecord.email,
        subject: `🎉 Payment Successful - ${getProgramDisplayName(
          paymentRecord.program
        )} days Internship`,
        html: emailHTML,
      });

      console.log("Confirmation email sent to:", paymentRecord.email);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.json({
      success: true,
      message: "Payment verified successfully!",
      paymentId: razorpay_payment_id,
      student: {
        name: paymentRecord.name,
        email: paymentRecord.email,
        rollNumber: paymentRecord.rollNumber,
        program: paymentRecord.program,
        amount: paymentRecord.amount,
      },
      receipt: paymentRecord.receipt,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);

    res.status(500).json({
      success: false,
      message: "Error verifying payment",
    });
  }
};


export const handleWebhook = async (req, res) => {
  console.log("Webhook received");

  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_INTERNSHIP_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const payload = JSON.parse(req.body);

    const event = payload.event;
    const entity = payload?.payload?.payment?.entity;

    if (!entity) {
      console.log("No payment entity. Event:", event);
      return res.json({ received: true });
    }

    const orderId = entity?.order_id;
    const paymentId = entity?.id;

    if (!orderId || !paymentId) {
      console.log("Invalid payment payload");
      return res.json({ received: true });
    }

    const method = entity.method || "unknown";
    const vpa = entity.vpa || null;
    const wallet = entity.wallet || null;
    const card = entity.card || null;
    const bank = entity.bank || null;

    let appUsed = null;

    // UPI app mapping
    const upiMap = {
      okaxis: "googlepay",
      ybl: "phonepe",
      paytm: "paytm",
      oksbi: "googlepay",
      okhdfcbank: "googlepay",
      axl: "amazonpay"
    };

    // Detect payment source
    if (method === "upi" && vpa) {
      const suffix = vpa.split("@")[1];
      appUsed = upiMap[suffix] || suffix || "upi";
    }
    else if (method === "wallet" && wallet) {
      appUsed = wallet.toLowerCase();
    }
    else if (method === "card" && card?.network) {
      appUsed = card.network.toLowerCase();
    }
    else if (method === "netbanking" && bank) {
      appUsed = bank.toLowerCase();
    }

    // Only process important events
    const allowedEvents = ["payment.captured", "order.paid", "payment.failed"];

    if (!allowedEvents.includes(event)) {
      console.log("Ignored event:", event);
      return res.json({ received: true });
    }

    if (event === "payment.captured" || event === "order.paid") {

      const updatedPayment = await InternshipPayment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: { $ne: "paid" } }, // idempotency protection
        {
          razorpayPaymentId: paymentId,
          status: "paid",
          paymentMode: method,
          appUsed,
          meta: payload
        },
        { new: true }
      );

      if (updatedPayment) {
        console.log(
          `✅ Payment updated: ${paymentId} | Method: ${method} | App: ${appUsed}`
        );
      } else {
        console.log(`⚠️ Payment already processed or order not found: ${orderId}`);
      }
    }

    if (event === "payment.failed") {

      await InternshipPayment.findOneAndUpdate(
        { razorpayOrderId: orderId },
        {
          status: "failed",
          paymentMode: method,
          appUsed,
          meta: payload
        }
      );

      console.log(`❌ Payment failed for order: ${orderId}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Webhook error");
  }
};

// Get payment by ID
export const getPayment = async (req, res) => {
  try {
    const paymentRecord = await InternshipPayment.findOne({ razorpayOrderId: req.params.orderId });
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: paymentRecord
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
}

