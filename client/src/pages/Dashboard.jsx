import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import AnalyticsCharts from '../components/AnalyticsCharts';
import BudgetOverview from '../components/BudgetOverview';
import AnomalyBanner from '../components/AnomalyBanner';
import TransactionTable from '../components/TransactionTable';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';

export default function Dashboard({ onOpenAddModal, onEditTransaction }) {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';

  const [stats, setStats] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [recentTxs, setRecentTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table filters state
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    search: '',
    page: 1,
    limit: 5
  });
  const [totalTxs, setTotalTxs] = useState(0);
  const [pages, setPages] = useState(1);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, budgetRes, txRes] = await Promise.all([
        api.get('/transactions/stats/summary'),
        api.get('/budgets'),
        api.get('/transactions', {
          params: {
            type: filters.type,
            category: filters.category,
            search: filters.search,
            page: filters.page,
            limit: filters.limit
          }
        })
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (budgetRes.data.success) setBudgets(budgetRes.data.data);
      if (txRes.data.success) {
        setRecentTxs(txRes.data.data);
        setTotalTxs(txRes.data.total);
        setPages(txRes.data.pages);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/transactions/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-400">Loading your financial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          amount={stats?.totalBalance || 0}
          type="balance"
          currency={currency}
          subtext="Net cumulative position"
        />
        <StatCard
          title="Total Income"
          amount={stats?.totalIncome || 0}
          type="income"
          currency={currency}
          subtext="Total incoming cash flow"
        />
        <StatCard
          title="Total Expenses"
          amount={stats?.totalExpense || 0}
          type="expense"
          currency={currency}
          subtext="Total outgoing spend"
        />
        <StatCard
          title="Savings Rate"
          amount={stats?.savingsRate || 0}
          type="savings"
          currency={currency}
          subtext={stats?.savingsRate >= 20 ? 'Optimal savings health' : 'Below 20% target'}
        />
      </div>

      {/* C++ Anomaly Detection Engine & Java Auditor Banner */}
      <AnomalyBanner currency={currency} />

      {/* Analytics Charts */}
      <AnalyticsCharts stats={stats} currency={currency} />

      {/* Category Budgets & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BudgetOverview
            budgets={budgets}
            currency={currency}
            onBudgetUpdated={fetchDashboardData}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
            <button
              onClick={onOpenAddModal}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              + Add Transaction
            </button>
          </div>
          <TransactionTable
            transactions={recentTxs}
            total={totalTxs}
            page={filters.page}
            pages={pages}
            onPageChange={(newPage) => setFilters({ ...filters, page: newPage })}
            filters={filters}
            onFilterChange={setFilters}
            onEdit={onEditTransaction}
            onDelete={handleDelete}
            onExportCSV={handleExportCSV}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}
