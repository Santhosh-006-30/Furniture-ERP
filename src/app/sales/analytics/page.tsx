'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingCart, DollarSign, BarChart2, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'];

export default function SalesAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales/analytics?months=${months}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [months, token]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  const d = data;
  const statusEntries = Object.entries(d.statusDistribution ?? {}) as [string, number][];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-sky-400" /> Sales Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">Revenue trends, customer insights, and sales forecasting</p>
        </div>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white outline-none">
          {[3, 6, 12, 24].map((m) => <option key={m} value={m}>Last {m} months</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${(d.kpis.totalRevenue / 1000).toFixed(1)}K`, icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
          { label: 'Total Orders', value: d.kpis.totalOrders, icon: <ShoppingCart className="w-4 h-4 text-sky-400" /> },
          { label: 'Unique Customers', value: d.kpis.uniqueCustomers, icon: <Users className="w-4 h-4 text-violet-400" /> },
          { label: 'Avg Order Value', value: `₹${d.kpis.avgOrderValue.toLocaleString()}`, icon: <BarChart2 className="w-4 h-4 text-amber-400" /> },
          { label: 'Forecast (Next Mo.)', value: `₹${(d.kpis.forecastNextMonth / 1000).toFixed(1)}K`, icon: <TrendingUp className="w-4 h-4 text-pink-400" /> },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs">{k.icon}{k.label}</div>
            <div className="text-xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Monthly Revenue & Orders</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={d.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(v: any, n?: any) => [n === 'revenue' ? `₹${Number(v).toLocaleString()}` : v, n ?? '']} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#38bdf8" name="Revenue (₹)" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="orders" fill="#a78bfa" name="Orders" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" /> Top Customers
          </h3>
          <div className="space-y-2">
            {d.topCustomers.slice(0, 8).map((c: any, i: number) => {
              const maxRevenue = d.topCustomers[0]?.revenue ?? 1;
              const pct = ((c.revenue / maxRevenue) * 100).toFixed(0);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate">{c.name}</span>
                    <span className="text-slate-400 shrink-0 ml-2">₹{Number(c.revenue).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Order Status Distribution</h3>
          {statusEntries.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusEntries.map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {statusEntries.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-10">No orders in this period</p>}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Top Products by Revenue</h3>
        {d.topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.topProducts.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={140} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#34d399" radius={[0, 3, 3, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-500 text-sm text-center py-8">No product sales data</p>}
      </div>
    </div>
  );
}
