import React, { useState, useEffect } from 'react';
import { Cpu, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../api/axiosClient';
import { formatCurrency } from '../utils/formatters';

export default function AnomalyBanner({ currency }) {
  const [anomalyData, setAnomalyData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const [anomRes, auditRes] = await Promise.all([
        api.get('/analytics/anomaly-detection'),
        api.get('/analytics/audit-report')
      ]);
      if (anomRes.data.success) setAnomalyData(anomRes.data.data);
      if (auditRes.data.success) setAuditData(auditRes.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading || (!anomalyData && !auditData)) return null;

  const hasAnomalies = anomalyData?.anomalies?.length > 0;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-100">
                Statistical Financial Engine
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                C++ & Java Core
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-performance anomaly detection & portfolio audit calculations
            </p>
          </div>
        </div>

        {auditData && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Financial Health</span>
              <span className={`font-bold ${
                auditData.financial_health_rating === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {auditData.financial_health_rating} ({auditData.savings_rate_percent}% Savings)
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        {hasAnomalies ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Statistical Anomaly Detected (Unusual High Expense Spike)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {anomalyData.anomalies.slice(0, 3).map((a) => (
                <div key={a.id} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate">{a.title}</span>
                    <span className="font-bold text-rose-400">{formatCurrency(a.amount, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{a.category} avg: {formatCurrency(a.category_avg, currency)}</span>
                    <span className="text-amber-400 font-mono text-[10px]">Z: {a.z_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All recorded expenses are within normal statistical variance for their categories.</span>
          </div>
        )}
      </div>
    </div>
  );
}
