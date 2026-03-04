// controllers/adminControllers/transactionController.js
import Payment from '../../models/payments.js';
import ExcelJS from "exceljs";
import InternshipPayment from '../../models/InternshipPayment.js';

export const getAllTransactions = async (req, res) => {
  try {
    // 1️⃣ Get page & limit from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Prevent negative values
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 ? limit : 10;

    const skip = (validPage - 1) * validLimit;

    // 2️⃣ Get total count (for frontend pagination)
    const totalTransactions = await Payment.countDocuments();

    // 3️⃣ Fetch paginated data
    const transactions = await Payment.find()
      .populate("courseIds", "name price")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .lean();

    console.log("Fetched Transactions:", transactions);

    // 4️⃣ Format data
    const formattedTransactions = transactions.map(transaction => {
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

    console.log("Formatted Transactions:", formattedTransactions);

    // 5️⃣ Send paginated response
    res.json({
      success: true,
      currentPage: validPage,
      totalPages: Math.ceil(totalTransactions / validLimit),
      totalTransactions,
      transactions: formattedTransactions
    });

  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions"
    });
  }
};





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
        { domain: { $regex: search, $options: "i" } },
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

    // Format response for frontend table
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

        // useful meta info
        bank: paymentEntity.bank || null,
        vpa: paymentEntity.vpa || null,
        wallet: paymentEntity.wallet || null,

        createdAt: p.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedPayments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Get internship payments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch internship payments",
    });
  }
};


export const getTransactionStats = async (req, res) => {
  try {
    const totalTransactions = await Payment.countDocuments();
    const successfulTransactions = await Payment.countDocuments({ status: 'paid' });
    const failedTransactions = totalTransactions - successfulTransactions;

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amountInRupees' } } } // Use amountInRupees
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.json({
      success: true,
      stats: {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        totalRevenue: revenue
      }
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transaction stats' });
  }
}
export const getCombinedPaymentStats = async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: {
        totalRevenue: courseTotal + internshipTotal,
        courseRevenue: courseTotal,
        internshipRevenue: internshipTotal,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch combined stats",
    });
  }
};


export const downloadPaymentsExcel = async (req, res) => {
  try {
    const [coursePayments, internshipPayments] = await Promise.all([
      Payment.find()
        .populate("courseIds", "name")
        .populate("userId", "name email")
        .lean(),

      InternshipPayment.find().lean(),
    ]);

    const workbook = new ExcelJS.Workbook();

    // =========================
    // Sheet 1: Course Payments
    // =========================
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

    // =========================
    // Sheet 2: Internship Payments
    // =========================
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

    // =========================
    // Send File
    // =========================
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

  } catch (error) {
    console.error("Excel export error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to download payments",
    });
  }
};