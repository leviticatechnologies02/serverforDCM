// controllers/adminControllers/transactionController.js
import Payment from '../../models/payments.js';


export const getAllTransactions = async (req, res) => {
  console.log("here transaction")
  try {
   const transactions = await Payment.find()
  .select('paymentId amountInRupees status createdAt orderId') // Only these fields from Payment
  .populate('courseIds', 'name price')          // From Course model
  .populate('userId', 'name email')            // From User model
  .sort({ createdAt: -1 });                    // Latest first

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