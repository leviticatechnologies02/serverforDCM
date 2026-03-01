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




export const downloadInternshipPaymentsExcel = async (req, res) => {
  try {
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

    const payments = await InternshipPayment.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Create Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Internship Payments");

    // Define Columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Roll Number", key: "rollNumber", width: 15 },
      { header: "Domain", key: "domain", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment ID", key: "paymentId", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Date", key: "createdAt", width: 20 },
    ];

    // Style Header
    worksheet.getRow(1).font = { bold: true };

    // Add Rows
    payments.forEach((payment) => {
      worksheet.addRow({
        name: payment.name,
        email: payment.email,
        rollNumber: payment.rollNumber,
        domain: payment.domain,
        amount: payment.amount,
        paymentId: payment.paymentId,
        status: payment.status,
        createdAt: payment.createdAt
          ? new Date(payment.createdAt).toLocaleString()
          : "",
      });
    });

    // Set Response Headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=internship-payments.xlsx"
    );

    // Send File
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Download Excel error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download internship payments",
    });
  }
};