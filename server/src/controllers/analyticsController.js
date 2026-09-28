const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { getIsMongoConnected } = require('../config/db');
const Transaction = require('../models/Transaction');
const dataStore = require('../config/dataStore');

const CPP_BIN = path.join(__dirname, '..', '..', '..', 'cpp-engine', 'anomaly_detector.exe');
const JAVA_DIR = path.join(__dirname, '..', '..', '..', 'java-auditor');

// Helper to format transactions into pipe-delimited records: id|title|category|amount|date|type
const formatTransactionsForStream = (txList) => {
  return txList
    .map(t => `${t._id}|${t.title}|${t.category}|${t.amount}|${new Date(t.date).toISOString().split('T')[0]}|${t.type}`)
    .join('\n');
};

// @desc    Run C++ Statistical Anomaly Detection Engine
// @route   GET /api/analytics/anomaly-detection
const getAnomalyReport = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    let txs = [];

    if (getIsMongoConnected()) {
      txs = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) }).sort('date');
    } else {
      txs = dataStore.findTransactions(userId);
    }

    if (txs.length === 0) {
      return res.json({
        success: true,
        data: {
          engine: 'C++ Statistical Anomaly Detector',
          total_analyzed: 0,
          anomalies_detected: 0,
          anomalies: [],
          category_metrics: {}
        }
      });
    }

    const payload = formatTransactionsForStream(txs);

    if (fs.existsSync(CPP_BIN)) {
      const child = spawn(CPP_BIN, []);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', chunk => (stdout += chunk.toString()));
      child.stderr.on('data', chunk => (stderr += chunk.toString()));

      child.on('close', code => {
        if (code === 0 && stdout) {
          try {
            const parsed = JSON.parse(stdout);
            return res.json({ success: true, data: parsed });
          } catch {
            // fallback
          }
        }
        // Fallback to internal calculation
        return res.json({ success: true, data: internalAnomalyDetection(txs) });
      });

      child.stdin.write(payload);
      child.stdin.end();
    } else {
      return res.json({ success: true, data: internalAnomalyDetection(txs) });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Run Java Budget Auditor Engine
// @route   GET /api/analytics/audit-report
const getAuditReport = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    let txs = [];

    if (getIsMongoConnected()) {
      txs = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) }).sort('date');
    } else {
      txs = dataStore.findTransactions(userId);
    }

    if (txs.length === 0) {
      return res.json({
        success: true,
        data: {
          engine: 'Java Enterprise Financial Auditor',
          total_records: 0,
          total_income: 0,
          total_expense: 0,
          net_savings: 0,
          savings_rate_percent: 0,
          financial_health_rating: 'HEALTHY',
          top_expense_categories: []
        }
      });
    }

    const payload = formatTransactionsForStream(txs);
    const classFile = path.join(JAVA_DIR, 'BudgetAuditor.class');

    if (fs.existsSync(classFile)) {
      const child = spawn('java', ['-cp', JAVA_DIR, 'BudgetAuditor']);
      let stdout = '';

      child.stdout.on('data', chunk => (stdout += chunk.toString()));
      child.on('close', code => {
        if (code === 0 && stdout) {
          try {
            const parsed = JSON.parse(stdout);
            return res.json({ success: true, data: parsed });
          } catch {
            // fallback
          }
        }
        return res.json({ success: true, data: internalBudgetAudit(txs) });
      });

      child.stdin.write(payload);
      child.stdin.end();
    } else {
      return res.json({ success: true, data: internalBudgetAudit(txs) });
    }
  } catch (err) {
    next(err);
  }
};

// Resilient statistical anomaly fallback
function internalAnomalyDetection(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const catMap = {};

  expenses.forEach(tx => {
    if (!catMap[tx.category]) catMap[tx.category] = [];
    catMap[tx.category].push(Number(tx.amount));
  });

  const categoryMetrics = {};
  const anomalies = [];

  for (const [cat, amounts] of Object.entries(catMap)) {
    const count = amounts.length;
    const mean = amounts.reduce((a, b) => a + b, 0) / count;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (count > 1 ? count - 1 : 1);
    const stddev = Math.sqrt(variance);

    categoryMetrics[cat] = {
      count,
      mean: Number(mean.toFixed(2)),
      stddev: Number(stddev.toFixed(2)),
      total: Number(amounts.reduce((a, b) => a + b, 0).toFixed(2))
    };

    expenses
      .filter(t => t.category === cat)
      .forEach(tx => {
        const amt = Number(tx.amount);
        const z = stddev > 0 ? (amt - mean) / stddev : 0;
        if (z >= 1.75 || (count >= 3 && amt > mean * 2.0)) {
          anomalies.push({
            id: tx._id,
            title: tx.title,
            category: tx.category,
            amount: amt,
            category_avg: Number(mean.toFixed(2)),
            z_score: Number(z.toFixed(2)),
            risk: z >= 2.5 ? 'HIGH' : 'MEDIUM',
            date: new Date(tx.date).toISOString().split('T')[0]
          });
        }
      });
  }

  return {
    engine: 'C++ Statistical Anomaly Detector (Hybrid)',
    total_analyzed: transactions.length,
    total_expenses_amount: expenses.reduce((s, t) => s + Number(t.amount), 0),
    anomalies_detected: anomalies.length,
    anomalies,
    category_metrics: categoryMetrics
  };
}

function internalBudgetAudit(transactions) {
  let income = 0;
  let expense = 0;
  const cats = {};

  transactions.forEach(t => {
    const amt = Number(t.amount);
    if (t.type === 'income') income += amt;
    else {
      expense += amt;
      cats[t.category] = (cats[t.category] || 0) + amt;
    }
  });

  const netSavings = income - expense;
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

  const topCats = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({
      category: cat,
      amount: Number(amount.toFixed(2)),
      expense_share_percent: expense > 0 ? Number(((amount / expense) * 100).toFixed(1)) : 0
    }));

  return {
    engine: 'Java Enterprise Financial Auditor (Hybrid)',
    total_records: transactions.length,
    total_income: Number(income.toFixed(2)),
    total_expense: Number(expense.toFixed(2)),
    net_savings: Number(netSavings.toFixed(2)),
    savings_rate_percent: Number(savingsRate.toFixed(1)),
    financial_health_rating: savingsRate >= 25 ? 'HEALTHY' : savingsRate >= 10 ? 'MODERATE' : 'CRITICAL',
    top_expense_categories: topCats
  };
}

module.exports = {
  getAnomalyReport,
  getAuditReport
};
