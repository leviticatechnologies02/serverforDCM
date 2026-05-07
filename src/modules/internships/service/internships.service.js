import crypto from 'crypto';
import Razorpay from 'razorpay';
import InternshipPayment from '../../../models/InternshipPayment.js';
import InternshipsDomain from '../../../models/internshipsDomain.js';
import ApiError from '../../../utils/ApiError.js';
import { getInternshipPaymentSuccessEmailHTML } from '../../../utils/email/generateHTML.js';
import { sendEmail } from '../../../utils/email/sendEmail.js';
import logger from '../../../utils/logger.js';

let razorpayInstance = null;

export class InternshipsService {
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

  // 1. Domain Administration Business Logic
  static async createInternshipsDomain(data) {
    const domain = await InternshipsDomain.create(data);
    return domain;
  }

  static async getAllInternshipsDomains({ all, isActive }) {
    let filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    } else if (all === "true") {
      filter = {};
    } else {
      filter.isActive = true;
    }

    const domains = await InternshipsDomain.find(filter).sort({ createdAt: -1 });
    return domains;
  }

  static async getInternshipsDomainById(id) {
    const domain = await InternshipsDomain.findById(id);
    if (!domain) {
      throw new ApiError(404, "Internships domain not found");
    }
    return domain;
  }

  static async updateInternshipsDomain(id, data) {
    const domain = await InternshipsDomain.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );

    if (!domain) {
      throw new ApiError(404, "Internships domain not found");
    }
    return domain;
  }

  static async deleteInternshipsDomain(id) {
    const domain = await InternshipsDomain.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!domain) {
      throw new ApiError(404, "Internships domain not found");
    }
    return { message: "Internships domain deleted successfully (soft delete)" };
  }

  // 2. Internship Checkout & Purchases
  static async createOrder({ name, email, phone, department, semester, program, rollNumber, amount, collegeName, collegeCode, domain }) {
    if (!name || !email || !phone || !department || !semester || !rollNumber || !program || !amount || !collegeName || !collegeCode || !domain) {
      throw new ApiError(400, 'All fields are required');
    }

    const existingPayment = await InternshipPayment.findOne({
      email,
      rollNumber,
      program,
      collegeName,
      collegeCode,
      status: { $nin: ['created', 'failed'] }
    });

    if (existingPayment) {
      throw new ApiError(409, 'Payment already exists for this program');
    }

    if (amount <= 0) {
      throw new ApiError(400, 'Valid amount is required');
    }

    const selectedDomain = await InternshipsDomain.findById(domain);
    if (!selectedDomain) {
      throw new ApiError(400, 'Invalid domain selected');
    }

    const selectedDuration = selectedDomain.durations.find(
      (d) => String(d.days) === String(program)
    );

    if (!selectedDuration) {
      throw new ApiError(400, 'Invalid program selected');
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

    const razorpay = this.getRazorpay();
    const order = await razorpay.orders.create(options);

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
    return { order, paymentRecord };
  }

  static async verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const paymentRecord = await InternshipPayment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!paymentRecord) {
      throw new ApiError(404, "Payment record not found");
    }

    if (paymentRecord.status === "paid") {
      return {
        alreadyVerified: true,
        paymentId: paymentRecord.razorpayPaymentId,
        student: {
          name: paymentRecord.name,
          email: paymentRecord.email,
          rollNumber: paymentRecord.rollNumber,
          program: paymentRecord.program,
          domain: paymentRecord.domain,
          amount: paymentRecord.amount,
        },
        receipt: paymentRecord.receipt
      };
    }

    if (paymentRecord.status !== "created" && paymentRecord.status !== "pending") {
      return { alreadyProcessed: true };
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
      throw new ApiError(400, "Invalid signature");
    }

    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.status = "paid";

    await paymentRecord.save();

    return {
      alreadyVerified: false,
      paymentId: razorpay_payment_id,
      student: {
        name: paymentRecord.name,
        email: paymentRecord.email,
        rollNumber: paymentRecord.rollNumber,
        program: paymentRecord.program,
        domain: paymentRecord.domain,
        amount: paymentRecord.amount,
      },
      receipt: paymentRecord.receipt
    };
  }

  static async handleWebhook({ signature, body }) {
    const secret = process.env.RAZORPAY_INTERNSHIP_WEBHOOK_SECRET;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      throw new ApiError(400, "Invalid webhook signature");
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const entity = payload?.payload?.payment?.entity;

    if (!entity) {
      return { received: true };
    }

    const orderId = entity?.order_id;
    const paymentId = entity?.id;

    if (!orderId || !paymentId) {
      return { received: true };
    }

    const method = entity.method || "unknown";
    const vpa = entity.vpa || null;
    const wallet = entity.wallet || null;
    const card = entity.card || null;
    const bank = entity.bank || null;

    let appUsed = null;

    const upiMap = {
      okaxis: "googlepay",
      ybl: "phonepe",
      paytm: "paytm",
      oksbi: "googlepay",
      okhdfcbank: "googlepay",
      axl: "amazonpay"
    };

    if (method === "upi" && vpa) {
      const suffix = vpa.split("@")[1];
      appUsed = upiMap[suffix] || suffix || "upi";
    } else if (method === "wallet" && wallet) {
      appUsed = wallet.toLowerCase();
    } else if (method === "card" && card?.network) {
      appUsed = card.network.toLowerCase();
    } else if (method === "netbanking" && bank) {
      appUsed = bank.toLowerCase();
    }

    const allowedEvents = ["payment.captured", "order.paid", "payment.failed"];
    if (!allowedEvents.includes(event)) {
      return { received: true };
    }

    if (event === "payment.captured" || event === "order.paid") {
      const updatedPayment = await InternshipPayment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: { $ne: "paid" } },
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
        // Asynchronously send internship welcome email
        (async () => {
          try {
            const programDetails = {
              domain: updatedPayment.domain,
              program: updatedPayment.program === "5"
                ? "5 Days program"
                : "15 Days program",
              duration: updatedPayment.program === "5" ? "5 Days" : "15 Days",
              amount: updatedPayment.amount
            };

            const paymentDetails = {
              paymentId,
              orderId,
              date: new Date().toLocaleDateString("en-IN")
            };

            const emailHTML = getInternshipPaymentSuccessEmailHTML(
              updatedPayment.name,
              updatedPayment.email,
              programDetails,
              paymentDetails
            );

            await sendEmail({
              to: updatedPayment.email,
              subject: "Payment Successful 🎉",
              html: emailHTML
            });
          } catch (err) {
            logger.error("Internship welcome email failed: ", err);
          }
        })();

        return { received: true };
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
    }

    return { received: true };
  }

  static async getPayment(orderId) {
    const paymentRecord = await InternshipPayment.findOne({ razorpayOrderId: orderId });
    if (!paymentRecord) {
      throw new ApiError(404, 'Payment not found');
    }
    return paymentRecord;
  }
}

export default InternshipsService;
