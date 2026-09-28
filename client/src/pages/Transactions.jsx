import React, { useState, useEffect } from 'react';
import TransactionTable from '../components/TransactionTable';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import { PlusCircle } from 'lucide-react';

export default function Transactions({ onOpenAddModal, onEditTransaction }) {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    search: '',
    page: 1,
    limit: 12
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions', {
        params: {
          type: filters.type,
          category: filters.category,
          search: filters.search,
          page: filters.page,
          limit: filters.limit
        }
      });
      if (res.data.success) {
        setTransactions(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
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
      link.setAttribute('download', 'all_transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transactions Audit Log</h2>
          <p className="text-xs text-slate-400">Search, filter, categorize, and export all recorded cash flows</p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Transaction</span>
        </button>
      </div>

      <TransactionTable
        transactions={transactions}
        total={total}
        page={filters.page}
        pages={pages}
        onPageChange={(p) => setFilters({ ...filters, page: p })}
        filters={filters}
        onFilterChange={setFilters}
        onEdit={onEditTransaction}
        onDelete={handleDelete}
        onExportCSV={handleExportCSV}
        currency={currency}
      />
    </div>
  );
}
