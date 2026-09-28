import React from 'react';
import { Wallet, LogOut, User, BarChart3, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar({ onOpenAddModal, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Expense<span className="text-emerald-600">Tracker</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                Enterprise FinTech
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'budgets'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Category Budgets
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>

            {/* In-App Notifications */}
            <NotificationCenter />

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">{user?.currency || 'USD'}</p>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors ml-1"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
