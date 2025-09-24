// controllers/adminControllers/transactionController.js
import Payment from '../../models/payments.js';
import Course from '../../models/courses.js';
import User from '../../models/user.js';

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find()
      .populate('courseIds', 'title price')  // Changed from 'name' to 'title'
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    // Transform data to match Flutter expectations
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      amount: transaction.amountInRupees, // Use amountInRupees instead of amount
      status: transaction.status,
      courseId: {
        _id: transaction.courseIds?.[0]?._id || '', // Handle array of courses
        title: transaction.courseIds?.[0]?.title || 'Unknown Course',
        price: transaction.courseIds?.[0]?.price || 0
      },
      userId: {
        _id: transaction.userId?._id || '',
        name: transaction.userId?.name || 'Unknown User',
        email: transaction.userId?.email || ''
      },
      createdAt: transaction.createdAt,
      updatedAtIST: transaction.updatedAt || transaction.createdAt // Fallback to createdAt
    }));

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