'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  TrendingUp,
  Truck,
  AlertTriangle,
  History,
  Loader2,
  Clock,
  Hammer,
  ShoppingCart,
  Receipt
} from 'lucide-react';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard');
      setMetrics(data);
    } catch (err) {
      console.error('Error retrieving cockpit dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span>Calibrating dashboard command modules...</span>
        </div>
      </div>
    );
  }

  const kpis = metrics?.kpis || {
    totalSales: 0,
    pending: 0,
    manufacturingOrders: 0,
    delayed: 0,
    totalPurchases: 0,
    partialReceipts: 0
  };
  const auditLogs = metrics?.auditLogs || [];

  const cards = [
    {
      title: 'Total Sales Orders',
      value: kpis.totalSales,
      icon: TrendingUp,
      color: 'from-sky-500/10 to-indigo-500/5',
      textColor: 'text-sky-400',
      borderColor: 'border-sky-500/20',
      description: 'Aggregate sales order count placed'
    },
    {
      title: 'Pending Deliveries',
      value: kpis.pending,
      icon: Truck,
      color: 'from-amber-500/10 to-orange-500/5',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      description: 'Active allocations & reservations'
    },
    {
      title: 'Manufacturing Orders',
      value: kpis.manufacturingOrders,
      icon: Hammer,
      color: 'from-violet-500/10 to-purple-500/5',
      textColor: 'text-violet-400',
      borderColor: 'border-violet-500/20',
      description: 'Scheduled finished good build orders'
    },
    {
      title: 'Delayed Orders',
      value: kpis.delayed,
      icon: AlertTriangle,
      color: 'from-rose-500/10 to-red-500/5',
      textColor: 'text-rose-455',
      borderColor: 'border-rose-500/20',
      description: 'Workstations showing critical backlog'
    },
    {
      title: 'Total Purchase Orders',
      value: kpis.totalPurchases,
      icon: ShoppingCart,
      color: 'from-blue-500/10 to-cyan-500/5',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      description: 'Procurement orders issued to vendors'
    },
    {
      title: 'Partial Receipts',
      value: kpis.partialReceipts,
      icon: Receipt,
      color: 'from-emerald-500/10 to-teal-500/5',
      textColor: 'text-emerald-450',
      borderColor: 'border-emerald-500/20',
      description: 'Replenishments partially accepted'
    }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome & Info */}
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Control Center Dashboard
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Real-time summary of Shiv Furniture Works operational KPIs and transaction activities.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className={`glass-panel p-6 rounded-2xl border ${c.borderColor} bg-gradient-to-br ${c.color} relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xxs font-bold text-slate-450 uppercase tracking-widest font-mono block">
                    {c.title}
                  </span>
                  <span className="text-4xl font-extrabold text-white block">
                    {c.value}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl bg-slate-900/50 ${c.textColor} border border-slate-800/40`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-normal">
                {c.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom section: Audit logs */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <History className="w-4.5 h-4.5 text-sky-400" />
          <span>Real-time System Audit Trail</span>
        </h3>

        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">Operator</th>
                  <th className="p-4 font-bold">Action Details</th>
                  <th className="p-4 font-bold">Target Entity</th>
                  <th className="p-4 font-bold">State Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-slate-500 font-mono" colSpan={5}>
                      No audit activities registered yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 text-slate-500 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-200">
                        {log.userName}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/30 text-sky-400 text-xxs font-bold uppercase tracking-wider font-mono">
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-semibold font-mono">
                        {log.entity}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 max-w-md text-[10px] font-mono leading-normal">
                          {log.oldValues && (
                            <span className="text-rose-400">
                              <span className="text-slate-500 font-bold mr-1">Before:</span>
                              {log.oldValues}
                            </span>
                          )}
                          {log.newValues && (
                            <span className="text-emerald-400">
                              <span className="text-slate-500 font-bold mr-1">After:</span>
                              {log.newValues}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
