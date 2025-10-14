// controllers/adminControllers/transactionController.js
import Payment from '../../models/payments.js';
import Course from '../../models/courses.js';
import User from '../../models/user.js';

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find()
      .populate('courseIds', 'name price') 
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance
console.log("Fetched Transactions:", transactions);
    // Transform data to match Flutter expectations
   const formattedTransactions = transactions.map(transaction => {
 const user = transaction.userId || {};


  return {
    _id: transaction._id,
    paymentId: transaction.paymentId, // 🔧 typo fixed: "paymenId" → "paymentId"
    orderId: transaction.orderId,
    appUsed: transaction.appUsed,
    paymentMode: transaction.paymentMode,
    amount: transaction.amountInRupees || 0, // fallback to 0 if undefined
    status: transaction.status,

    courses: Array.isArray(transaction.courseIds)
  ? transaction.courseIds.map(course => ({
      _id: course._id || '',
      name: course.name || 'Unknown Course',
      price: course.price || 0
    }))
  : []
,
    user: {
      _id: user._id || '',
      name: user.name || 'Unknown User',
      email: user.email || ''
    },

    createdAt: transaction.createdAt,
    updatedAtIST: transaction.updatedAt || transaction.createdAt
  };
});
console.log("Formatted Transactions:", formattedTransactions);
    res.json({
      success: true,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
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