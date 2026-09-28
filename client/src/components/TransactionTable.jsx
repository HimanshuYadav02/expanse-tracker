import React from 'react';
import { Search, Download, Trash2, Edit3, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, CATEGORIES } from '../utils/formatters';

export default function TransactionTable({
  transactions,
  total,
  page,
  pages,
  onPageChange,
  filters,
  onFilterChange,
  onEdit,
  onDelete,
  onExportCSV,
  currency
}) {
  const getCategoryColor = (catName) => {
    const found = CATEGORIES.find(c => c.value.toLowerCase() === (catName || '').toLowerCase());
    return found ? found.color : '#64748b';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title or notes..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value, page: 1 })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Category filter */}
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value, page: 1 })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.name}</option>
            ))}
          </select>

          {/* Export CSV button */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Transaction</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  No transactions match your current filters.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isExpense = tx.type === 'expense';
                return (
                  <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isExpense
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isExpense ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{tx.title}</p>
                          {tx.notes && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{tx.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: `${getCategoryColor(tx.category)}15`,
                          color: getCategoryColor(tx.category)
                        }}
                      >
                        {tx.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">
                      {tx.paymentMethod || 'Card'}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                      <span className={isExpense ? 'text-rose-600' : 'text-emerald-600'}>
                        {isExpense ? '-' : '+'}{formatCurrency(tx.amount, currency)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(tx)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(tx._id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 bg-slate-50/75 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {transactions.length} of {total} records
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-500 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-500 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
