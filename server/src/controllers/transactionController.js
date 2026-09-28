const mongoose = require('mongoose');
const { getIsMongoConnected } = require('../config/db');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const dataStore = require('../config/dataStore');

// Helper to check budget threshold and dispatch notifications
const checkBudgetThresholds = async (userId, category, newAmount) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let budgetLimit = 0;
    let totalSpent = 0;

    if (getIsMongoConnected()) {
      const budgetDoc = await Budget.findOne({
        userId,
        category: { $regex: new RegExp(`^${category}$`, 'i') }
      });
      if (!budgetDoc) return;
      budgetLimit = budgetDoc.limit;

      const agg = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'expense',
            category: { $regex: new RegExp(`^${category}$`, 'i') },
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      totalSpent = agg.length > 0 ? agg[0].total : 0;
    } else {
      const budgets = dataStore.getBudgets(userId);
      const budgetDoc = budgets.find(b => b.category.toLowerCase() === category.toLowerCase());
      if (!budgetDoc) return;
      budgetLimit = budgetDoc.limit;

      const txs = dataStore.findTransactions(userId, {
        type: 'expense',
        category,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      });
      totalSpent = txs.reduce((sum, t) => sum + t.amount, 0);
    }

    const percentage = (totalSpent / budgetLimit) * 100;

    if (totalSpent > budgetLimit) {
      const notifData = {
        userId,
        title: `Budget Exceeded: ${category}`,
        message: `You have spent $${totalSpent.toFixed(2)} on ${category}, exceeding your monthly limit of $${budgetLimit.toFixed(2)} by $${(totalSpent - budgetLimit).toFixed(2)}.`,
        type: 'alert'
      };
      if (getIsMongoConnected()) await Notification.create(notifData);
      else dataStore.createNotification(notifData);
    } else if (percentage >= 80) {
      const notifData = {
        userId,
        title: `Budget Warning: ${category}`,
        message: `You have reached ${percentage.toFixed(0)}% ($${totalSpent.toFixed(2)} / $${budgetLimit.toFixed(2)}) of your monthly ${category} budget.`,
        type: 'warning'
      };
      if (getIsMongoConnected()) await Notification.create(notifData);
      else dataStore.createNotification(notifData);
    }
  } catch (err) {
    console.error('Error checking budget thresholds:', err.message);
  }
};

// @desc    Get all transactions with filtering and pagination
// @route   GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const {
      type,
      category,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sort = '-date'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    if (getIsMongoConnected()) {
      const query = { userId: new mongoose.Types.ObjectId(userId) };

      if (type && type !== 'all') {
        query.type = type;
      }
      if (category && category !== 'all') {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const total = await Transaction.countDocuments(query);
      const transactions = await Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      return res.json({
        success: true,
        count: transactions.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        data: transactions
      });
    } else {
      const all = dataStore.findTransactions(userId, {
        type,
        category,
        search,
        startDate,
        endDate
      });

      const total = all.length;
      const paginated = all.slice(skip, skip + limitNum);

      return res.json({
        success: true,
        count: paginated.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        data: paginated
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    if (getIsMongoConnected()) {
      const tx = await Transaction.findOne({ _id: id, userId });
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }
      return res.json({ success: true, data: tx });
    } else {
      const all = dataStore.findTransactions(userId);
      const tx = all.find(t => t._id === id);
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }
      return res.json({ success: true, data: tx });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { title, amount, type, category, paymentMethod, date, notes } = req.body;

    if (!title || !amount || !type || !category) {
      return res.status(400).json({ success: false, error: 'Please provide title, amount, type, and category' });
    }

    let tx;
    if (getIsMongoConnected()) {
      tx = await Transaction.create({
        userId,
        title,
        amount: Number(amount),
        type,
        category,
        paymentMethod: paymentMethod || 'Card',
        date: date ? new Date(date) : new Date(),
        notes
      });
    } else {
      tx = dataStore.createTransaction({
        userId,
        title,
        amount: Number(amount),
        type,
        category,
        paymentMethod: paymentMethod || 'Card',
        date: date || new Date().toISOString(),
        notes
      });
    }

    // Trigger in-app notification on expense creation
    const notifData = {
      userId,
      title: type === 'expense' ? 'Expense Recorded' : 'Income Added',
      message: `${type === 'expense' ? '-' : '+'}$${Number(amount).toFixed(2)} on "${title}" (${category})`,
      type: type === 'expense' ? 'info' : 'success'
    };

    if (getIsMongoConnected()) await Notification.create(notifData);
    else dataStore.createNotification(notifData);

    // If it's an expense, evaluate monthly budget threshold
    if (type === 'expense') {
      checkBudgetThresholds(userId, category, Number(amount));
    }

    return res.status(201).json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
};

// @desc    Update existing transaction
// @route   PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    if (getIsMongoConnected()) {
      let tx = await Transaction.findOne({ _id: id, userId });
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }

      tx = await Transaction.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });

      return res.json({ success: true, data: tx });
    } else {
      const updated = dataStore.updateTransaction(id, userId, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }
      return res.json({ success: true, data: updated });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    if (getIsMongoConnected()) {
      const tx = await Transaction.findOne({ _id: id, userId });
      if (!tx) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }
      await tx.deleteOne();
      return res.json({ success: true, data: {} });
    } else {
      const deleted = dataStore.deleteTransaction(id, userId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }
      return res.json({ success: true, data: {} });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get summary statistics and analytics
// @route   GET /api/transactions/stats/summary
const getTransactionStats = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    let allTxs = [];
    if (getIsMongoConnected()) {
      allTxs = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) }).sort('date');
    } else {
      allTxs = dataStore.findTransactions(userId);
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};
    const monthlyMap = {};

    allTxs.forEach(t => {
      const amt = Number(t.amount);
      const d = new Date(t.date);
      const monthKey = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        totalIncome += amt;
        monthlyMap[monthKey].income += amt;
      } else if (t.type === 'expense') {
        totalExpense += amt;
        monthlyMap[monthKey].expense += amt;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    const categoryBreakdown = Object.keys(categoryTotals).map(cat => ({
      category: cat,
      amount: categoryTotals[cat],
      percentage: totalExpense > 0 ? ((categoryTotals[cat] / totalExpense) * 100).toFixed(1) : 0
    }));

    const monthlyTrends = Object.values(monthlyMap);

    return res.json({
      success: true,
      data: {
        totalBalance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate: Number(savingsRate),
        transactionCount: allTxs.length,
        categoryBreakdown,
        monthlyTrends
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export transactions as CSV
// @route   GET /api/transactions/export/csv
const exportCSV = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    let txs = [];

    if (getIsMongoConnected()) {
      txs = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) }).sort('-date');
    } else {
      txs = dataStore.findTransactions(userId);
    }

    const headers = ['ID', 'Date', 'Title', 'Type', 'Category', 'Payment Method', 'Amount', 'Notes'];
    const rows = txs.map(t => [
      t._id,
      new Date(t.date).toISOString().split('T')[0],
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.type,
      t.category,
      t.paymentMethod || 'Card',
      t.amount,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  exportCSV
};
