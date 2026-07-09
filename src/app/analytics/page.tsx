'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  TrendingUp, Truck, AlertTriangle, Loader2, Hammer, ShoppingCart,
  IndianRupee, Users, Package, RotateCcw, BarChart2, Calendar,
  Activity, Star, RefreshCw, Sparkles, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const fmt = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(1)}Cr`
    : n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${n.toLocaleString('en-IN')}`;

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa'];

function KPICard({
  title, value, subtitle, icon: Icon, gradient, textColor, badge, trend
}: {
  title: string; value: string | number; subtitle?: string;
  icon: any; gradient: string; textColor: string; badge?: string; trend?: 'up' | 'down' | null;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br ${gradient} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-slate-800/60 ${textColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300">{badge}</span>
        )}
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </div>
        )}
      </div>
      <div>
        <div className={`text-2xl font-bold ${textColor} mb-0.5`}>{value}</div>
        <div className="text-xs font-medium text-white/80 mb-0.5">{title}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin mr-3" />
        <span className="font-mono text-sm">Crunching analytics data…</span>
      </div>
    );
  }

  const d = data || {};

  const kpiCards = [
    { title: 'Total Revenue', value: fmt(d.totalRevenue || 0), subtitle: 'All delivered orders', icon: IndianRupee, gradient: 'from-indigo-500/10 to-purple-500/5', textColor: 'text-indigo-400' },
    { title: 'Monthly Revenue', value: fmt(d.monthRevenue || 0), subtitle: 'Current month', icon: Calendar, gradient: 'from-sky-500/10 to-cyan-500/5', textColor: 'text-sky-400' },
    { title: "Today's Revenue", value: fmt(d.todayRevenue || 0), subtitle: "Today's delivered", icon: Sparkles, gradient: 'from-emerald-500/10 to-green-500/5', textColor: 'text-emerald-400' },
    { title: "Today's Orders", value: d.todayOrderCount || 0, subtitle: 'New orders today', icon: ShoppingCart, gradient: 'from-amber-500/10 to-orange-500/5', textColor: 'text-amber-400' },
    { title: 'Avg Order Value', value: fmt(d.avgOrderValue || 0), subtitle: 'Per delivered order', icon: TrendingUp, gradient: 'from-violet-500/10 to-fuchsia-500/5', textColor: 'text-violet-400' },
    { title: 'Inventory Value', value: fmt(d.inventoryValue || 0), subtitle: 'Cost-based valuation', icon: Package, gradient: 'from-rose-500/10 to-pink-500/5', textColor: 'text-rose-400' },
    { title: 'Low Stock Items', value: d.lowStock || 0, subtitle: 'Below reorder level', icon: AlertTriangle, gradient: 'from-red-500/10 to-orange-500/5', textColor: 'text-red-400', badge: d.lowStock > 0 ? '⚠ Action needed' : undefined },
    { title: 'Pending Procurement', value: d.pendingProcurement || 0, subtitle: 'Awaiting approval/order', icon: Truck, gradient: 'from-orange-500/10 to-amber-500/5', textColor: 'text-orange-400' },
    { title: 'Running Manufacturing', value: d.runningMfg || 0, subtitle: 'Active work orders', icon: Hammer, gradient: 'from-cyan-500/10 to-teal-500/5', textColor: 'text-cyan-400' },
    { title: 'Completed Mfg', value: d.completedMfg || 0, subtitle: 'Total finished orders', icon: Activity, gradient: 'from-green-500/10 to-emerald-500/5', textColor: 'text-green-400' },
    { title: 'Return Rate', value: `${d.returnRate || 0}%`, subtitle: 'Returns / Deliveries', icon: RotateCcw, gradient: 'from-yellow-500/10 to-amber-500/5', textColor: 'text-yellow-400' },
    { title: 'Refund Amount', value: fmt(d.refundAmount || 0), subtitle: 'Total refunds issued', icon: BarChart2, gradient: 'from-slate-500/10 to-slate-600/5', textColor: 'text-slate-400' },
  ];

  const topProducts = d.topProducts || [];
  const topCustomers = d.topCustomers || [];
  const monthlyRevenue = d.monthlyRevenue || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-400" /> Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Business intelligence & KPIs</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KPICard key={card.title} {...card} />
        ))}
      </div>

      {/* Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Monthly Revenue (Last 6 Months)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => fmt(v)} width={70} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#e2e8f0' }}
                formatter={(v: any) => [fmt(v), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Products & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" /> Top Products by Revenue
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No product data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => {
                const max = topProducts[0]?.revenue || 1;
                const pct = (p.revenue / max) * 100;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4 text-center font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm text-white truncate">{p.name}</span>
                        <span className="text-xs text-indigo-400 font-medium ml-2">{fmt(p.revenue)}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{p.quantity} units sold</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Top Customers by Revenue
          </h2>
          {topCustomers.length === 0 ? (
            <p className="text-slate-500 text-sm">No customer data yet.</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((c: any, i: number) => {
                const max = topCustomers[0]?.revenue || 1;
                const pct = (c.revenue / max) * 100;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-4 text-center font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="min-w-0">
                          <span className="text-sm text-white truncate block">{c.name}</span>
                          <span className="text-xs text-slate-600">{c.customerCode} · {c.orders} orders</span>
                        </div>
                        <span className="text-xs text-emerald-400 font-medium ml-2">{fmt(c.revenue)}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pie breakdown placeholder for top products */}
      {topProducts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-violet-400" /> Revenue Distribution (Top 5 Products)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={topProducts}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={3}
                label={({ name, percent }) => `${(name || '').length > 14 ? (name || '').slice(0, 14) + '…' : (name || '')} (${((percent || 0) * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {topProducts.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
