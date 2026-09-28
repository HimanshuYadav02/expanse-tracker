import React, { useState } from 'react';
import { Wallet, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitchToRegister }) {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
    } catch (err) {
      setError('Could not initialize demo login. Please register an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to manage and analyze your personal financial portfolio
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative px-3 bg-white text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Quick Review
          </span>
        </div>

        {/* 1-Click Demo Login */}
        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Explore with 1-Click Demo Account</span>
        </button>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
