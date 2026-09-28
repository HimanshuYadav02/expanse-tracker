import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency, CATEGORIES } from '../utils/formatters';

export default function AnalyticsCharts({ stats, currency }) {
  const trends = stats?.monthlyTrends || [];
  const categories = stats?.categoryBreakdown || [];

  const getCatColor = (catName, idx) => {
    const found = CATEGORIES.find(c => c.value.toLowerCase() === (catName || '').toLowerCase());
    return found ? found.color : ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][idx % 5];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Trends Area Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Cash Flow Trends</h3>
              <p className="text-xs text-slate-400">Monthly comparison between Income and Expenses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expenses
              </span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {trends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Add transactions across different months to visualize trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => formatCurrency(val, currency)}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Donut Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">Expense by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of total expenditures</p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {categories.length === 0 ? (
            <div className="text-slate-400 text-xs text-center">
              No expense records recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCatColor(entry.category, index)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, props) => [`${formatCurrency(val, currency)} (${props.payload.percentage}%)`, name]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  formatter={(value) => <span className="text-[11px] text-slate-600">{value}</span>}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
