import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Wallet, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function StatCard({ title, amount, type, subtext, currency }) {
  const getIcon = () => {
    switch (type) {
      case 'income':
        return <ArrowDownRight className="w-5 h-5 text-emerald-600" />;
      case 'expense':
        return <ArrowUpRight className="w-5 h-5 text-rose-600" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5 text-indigo-600" />;
      default:
        return <Wallet className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBg = () => {
    switch (type) {
      case 'income':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'expense':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'savings':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl border ${getBg()}`}>
          {getIcon()}
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          {type === 'savings' ? `${amount}%` : formatCurrency(amount, currency)}
        </h3>
        {subtext && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
