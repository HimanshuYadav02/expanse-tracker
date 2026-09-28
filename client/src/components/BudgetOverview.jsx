import React, { useState } from 'react';
import { Target, Plus, AlertTriangle, AlertCircle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, CATEGORIES } from '../utils/formatters';
import api from '../api/axiosClient';

export default function BudgetOverview({ budgets, currency, onBudgetUpdated }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [limit, setLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!limit || Number(limit) <= 0) return;
    setSubmitting(true);
    try {
      await api.post('/budgets', { category, limit: Number(limit) });
      setLimit('');
      setShowAddForm(false);
      onBudgetUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete budget limit for ${cat}?`)) return;
    try {
      await api.delete(`/budgets/${cat}`);
      onBudgetUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Monthly Category Budgets</h3>
            <p className="text-xs text-slate-400">Track spending limits with automatic notification alerts</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {showAddForm ? 'Cancel' : 'Set Budget'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.filter(c => c.value !== 'Salary' && c.value !== 'Freelance').map(c => (
                  <option key={c.value} value={c.value}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Monthly Limit ($)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 500"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Limit'}
            </button>
          </div>
        </form>
      )}

      {budgets.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No category budgets configured yet. Click "Set Budget" above to set limits and get overspending alerts.
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const isExceeded = b.status === 'exceeded';
            const isWarning = b.status === 'warning';

            return (
              <div key={b._id || b.category} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{b.category}</span>
                    {isExceeded && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" /> Exceeded
                      </span>
                    )}
                    {isWarning && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Near Limit
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">
                      {formatCurrency(b.spent, currency)} / <span className="text-slate-400">{formatCurrency(b.limit, currency)}</span>
                    </span>
                    <button
                      onClick={() => handleDelete(b.category)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors"
                      title="Remove limit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{b.percentage}% used</span>
                  <span>{b.remaining > 0 ? `${formatCurrency(b.remaining, currency)} remaining` : 'Limit crossed'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
