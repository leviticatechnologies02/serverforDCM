import { getInternshipPaymentSuccessEmailHTML, getProgramDisplayName } from '../../utils/Email/generateHTML.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import InternshipPayment from '../../models/InternshipPayment.js';
import { sendEmail } from '../../utils/Email/sendEmail.js';

const Program = [
    { id: '5days', name: '5 Days Program', days: 5, amount: 1000 },
    { id: '15days', name: '15 Days Program', days: 15, amount: 2000 }
];

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
            status: { $nin: ['created','failed'] } // Only check non-failed payments
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

        const selectedCourse = Program.find(c => c.id === program);
        console.log('Selected course:', selectedCourse);

        if (!selectedCourse) {
            return res.status(400).json({
                success: false,
                message: 'Invalid program selected'
            });
        }

        const options = {
            amount: selectedCourse.amount * 100, // amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${rollNumber}`,
            notes: {
                name,
                email,
                phone,
                department,
                semester,
                rollNumber,
                program,
                collegeName,
                collegeCode,
                domain
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
            amount: selectedCourse.amount, // Use the amount from program, not from request
            program,
            collegeName,
            collegeCode,
            domain,
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



// In your verifyPayment function, after successful payment:
export const verifyPayment = async (req, res) => {
    console.log("Received verification request:", req.body);
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, formData } = req.body;

        // Find payment record
        const paymentRecord = await InternshipPayment.findOne({ razorpayOrderId: razorpay_order_id });
        if (!paymentRecord) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update payment status
            paymentRecord.razorpayPaymentId = razorpay_payment_id;
            paymentRecord.razorpaySignature = razorpay_signature;
            paymentRecord.status = 'paid';
            await paymentRecord.save();

            console.log('Payment verified successfully:', razorpay_payment_id);

            // Send confirmation email
            try {
                const programDetails = {
                    domain: paymentRecord.domain,
                    program: paymentRecord.program,
                    duration: paymentRecord.program === '5days' ? '5 Days' : '15 Days',
                    amount: paymentRecord.amount
                };

                const paymentDetails = {
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    date: new Date().toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                };

                const emailHTML = getInternshipPaymentSuccessEmailHTML(
                    paymentRecord.name,
                    paymentRecord.email,
                    programDetails,
                    paymentDetails
                );
                

                await sendEmail({
                    to: paymentRecord.email,
                    subject: `🎉 Payment Successful - ${getProgramDisplayName(paymentRecord.program)} Internship`,
                    html: emailHTML
                });

                console.log('Confirmation email sent to:', paymentRecord.email);
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Don't fail the payment if email fails
            }

            res.json({
                success: true,
                message: 'Payment verified successfully!',
                paymentId: razorpay_payment_id,
                student: {
                    name: paymentRecord.name,
                    email: paymentRecord.email,
                    rollNumber: paymentRecord.rollNumber,
                    program: paymentRecord.program,
                    amount: paymentRecord.amount
                },
                receipt: paymentRecord.receipt
            });
        } else {
            paymentRecord.status = 'failed';
            await paymentRecord.save();

            console.log('Payment verification failed - invalid signature');

            res.status(400).json({
                success: false,
                message: 'Payment verification failed - Invalid signature'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

// Webhook handler
export const handleWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        // Verify webhook signature
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest === signature) {
            const event = req.body.event;
            const payload = req.body.payload;

            if (event === 'payment.captured') {
                const paymentData = payload.payment.entity;
                
                // Update payment status in database
                await InternshipPayment.findOneAndUpdate(
                    { razorpayOrderId: paymentData.order_id },
                    {
                        razorpayPaymentId: paymentData.id,
                        status: 'paid'
                    }
                );

                console.log(`Payment captured for order: ${paymentData.order_id}`);
            }

            res.json({ status: 'ok' });
        } else {
            console.error('Webhook signature verification failed');
            res.status(400).json({ status: 'error', message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
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


export const getAllInternshipPayments = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const status = req.query.status;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
        { domain: { $regex: search, $options: "i" } }
      ],
    };

    if (status) {
      query.status = status;
    }

    const [payments, total] = await Promise.all([
      InternshipPayment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      InternshipPayment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch internship payments",
    });
  }
};
