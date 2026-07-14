'use client';

import { useState, useEffect } from 'react';
import { Truck, DollarSign, Star, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function PurchaseAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    setLoading(true);
    fetch(`/api/purchase/analytics?months=${months}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [months, token]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  const d = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-400" /> Purchase Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">Vendor performance, procurement costs, and delivery metrics</p>
        </div>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white outline-none">
          {[3, 6, 12, 24].map((m) => <option key={m} value={m}>Last {m} months</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: `₹${(d.kpis.totalCost / 1000).toFixed(1)}K`, icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
          { label: 'Total Orders', value: d.kpis.totalOrders, icon: <ShoppingCart className="w-4 h-4 text-sky-400" /> },
          { label: 'Avg Order Cost', value: `₹${d.kpis.avgOrderCost.toLocaleString()}`, icon: <Package className="w-4 h-4 text-amber-400" /> },
          { label: 'On-Time Rate', value: `${d.kpis.onTimeDeliveryRate}%`, icon: <TrendingUp className="w-4 h-4 text-violet-400" /> },
          { label: 'Active Vendors', value: d.kpis.activeVendors, icon: <Truck className="w-4 h-4 text-pink-400" /> },
          { label: 'Avg Vendor Rating', value: `${d.kpis.avgVendorRating} ★`, icon: <Star className="w-4 h-4 text-amber-400" /> },
          { label: 'Fully Received', value: d.kpis.fullyReceivedOrders, icon: <Package className="w-4 h-4 text-emerald-400" /> },
          { label: 'Pending Orders', value: d.kpis.totalOrders - d.kpis.fullyReceivedOrders, icon: <ShoppingCart className="w-4 h-4 text-slate-400" /> },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs">{k.icon}{k.label}</div>
            <div className="text-xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Purchase Trend */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Monthly Purchase Cost</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.monthlyPurchases}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Cost']} />
              <Bar dataKey="cost" fill="#38bdf8" name="Cost" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Vendors by Spend */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Vendors by Spend</h3>
          {d.topVendors?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.topVendors.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Spend']} />
                <Bar dataKey="cost" fill="#a78bfa" radius={[0, 3, 3, 0]} name="Spend" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center py-10">No purchase data yet</p>}
        </div>
      </div>

      {/* Vendor Performance Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Vendor Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Vendor', 'Email', 'Orders', 'Total Spend', 'Lead Time', 'Rating'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-slate-400 uppercase text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.vendorPerformance.map((v: any) => (
                <tr key={v.id} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                  <td className="px-4 py-3 text-slate-200 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{v.email}</td>
                  <td className="px-4 py-3 text-slate-300">{v.orders}</td>
                  <td className="px-4 py-3 text-emerald-400">₹{v.totalCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400">{v.leadTimeDays}d</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-amber-400 font-semibold">{v.rating.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {d.vendorPerformance.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">No vendor purchase data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
