import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import BudgetOverview from './components/BudgetOverview';
import TransactionModal from './components/TransactionModal';
import Login from './pages/Login';
import Register from './pages/Register';
import api from './api/axiosClient';

function MainApp() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'transactions' | 'budgets'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch budgets when needed
  const fetchBudgets = async () => {
    try {
      const res = await api.get('/budgets');
      if (res.data.success) setBudgets(res.data.data);
    } catch {
      // quiet
    }
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (formData) => {
    if (editingTransaction) {
      await api.put(`/transactions/${editingTransaction._id}`, formData);
    } else {
      await api.post('/transactions', formData);
    }
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif]">
      <Navbar
        onOpenAddModal={handleOpenAddModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            key={refreshKey}
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'transactions' && (
          <Transactions
            key={refreshKey}
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'budgets' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Category Spending Budgets</h2>
              <p className="text-xs text-slate-400">
                Set monthly allocation targets and receive alerts when threshold reaches 80% or 100%.
              </p>
            </div>
            <BudgetOverview
              budgets={budgets}
              currency={user?.currency || 'USD'}
              onBudgetUpdated={fetchBudgets}
            />
          </div>
        )}
      </main>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <span>ExpenseTracker &copy; {new Date().getFullYear()} &bull; Built with MERN Stack, C++ Anomaly Engine & Java Auditor</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
