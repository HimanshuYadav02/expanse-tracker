const mongoose = require('mongoose');
const { getIsMongoConnected } = require('../config/db');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const dataStore = require('../config/dataStore');

// @desc    Get all budgets with month-to-date spending
// @route   GET /api/budgets
const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let budgets = [];
    if (getIsMongoConnected()) {
      budgets = await Budget.find({ userId: new mongoose.Types.ObjectId(userId) });
    } else {
      budgets = dataStore.getBudgets(userId);
    }

    // Default categories if user hasn't configured custom budgets yet
    const defaultCategories = ['Food', 'Housing', 'Entertainment', 'Utilities', 'Transportation', 'Healthcare'];
    const existingCats = budgets.map(b => b.category.toLowerCase());

    const enrichedBudgets = await Promise.all(
      budgets.map(async b => {
        let spent = 0;
        if (getIsMongoConnected()) {
          const agg = await Transaction.aggregate([
            {
              $match: {
                userId: new mongoose.Types.ObjectId(userId),
                type: 'expense',
                category: { $regex: new RegExp(`^${b.category}$`, 'i') },
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
          spent = agg.length > 0 ? agg[0].total : 0;
        } else {
          const txs = dataStore.findTransactions(userId, {
            type: 'expense',
            category: b.category,
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString()
          });
          spent = txs.reduce((sum, t) => sum + t.amount, 0);
        }

        const percentage = b.limit > 0 ? Math.min(100, (spent / b.limit) * 100) : 0;
        const status = spent > b.limit ? 'exceeded' : percentage >= 80 ? 'warning' : 'normal';

        return {
          _id: b._id,
          category: b.category,
          limit: b.limit,
          spent: Number(spent.toFixed(2)),
          remaining: Number(Math.max(0, b.limit - spent).toFixed(2)),
          percentage: Number(percentage.toFixed(1)),
          status
        };
      })
    );

    return res.json({
      success: true,
      data: enrichedBudgets
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Set or update a category budget
// @route   POST /api/budgets
const setBudget = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { category, limit } = req.body;

    if (!category || limit === undefined || limit === null) {
      return res.status(400).json({ success: false, error: 'Please provide category and limit' });
    }

    if (Number(limit) <= 0) {
      return res.status(400).json({ success: false, error: 'Budget limit must be greater than zero' });
    }

    let budget;
    if (getIsMongoConnected()) {
      budget = await Budget.findOneAndUpdate(
        { userId, category: { $regex: new RegExp(`^${category}$`, 'i') } },
        { limit: Number(limit), category },
        { new: true, upsert: true, runValidators: true }
      );
    } else {
      budget = dataStore.upsertBudget(userId, category, limit);
    }

    return res.status(200).json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete category budget
// @route   DELETE /api/budgets/:category
const deleteBudget = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const { category } = req.params;

    if (getIsMongoConnected()) {
      await Budget.findOneAndDelete({
        userId,
        category: { $regex: new RegExp(`^${category}$`, 'i') }
      });
    } else {
      dataStore.deleteBudget(userId, category);
    }

    return res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBudgets,
  setBudget,
  deleteBudget
};
