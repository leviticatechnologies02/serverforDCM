// controllers/adminControllers/transactionController.js
import Payment from '../../models/payments.js';


export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find()
      .populate('courseId', 'title price') // Populate course details
      .populate('userId', 'name email') // Populate user details
      .sort({ createdAt: -1 }); // Latest first

    res.json({
      success: true,
      transactions
   
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
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total / 100 : 0;

    res.json({
      success: true,
      stats: {
        totalTransactions,
        successfulTransactions,
        failedTransactions: totalTransactions - successfulTransactions,
        totalRevenue: revenue
      }
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transaction stats' });
  }
};