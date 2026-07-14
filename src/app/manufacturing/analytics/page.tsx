'use client';

import { useState, useEffect } from 'react';
import { Factory, Clock, Gauge, Wrench, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ManufacturingAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetch('/api/manufacturing/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  const d = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Factory className="w-6 h-6 text-sky-400" /> Manufacturing Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Production efficiency, work center utilization, and quality metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: d.kpis.totalOrders, icon: <Factory className="w-4 h-4 text-sky-400" /> },
          { label: 'Avg Efficiency', value: `${d.kpis.avgEfficiencyPct}%`, icon: <Gauge className="w-4 h-4 text-emerald-400" />, hi: d.kpis.avgEfficiencyPct >= 80 },
          { label: 'Avg Build Time', value: `${d.kpis.avgBuildTimeMin.toFixed(0)}min`, icon: <Clock className="w-4 h-4 text-amber-400" /> },
          { label: 'Avg Scrap Rate', value: `${d.kpis.avgScrapRatePct}%`, icon: <Wrench className="w-4 h-4 text-red-400" />, bad: d.kpis.avgScrapRatePct > 5 },
          { label: 'Completion Rate', value: `${d.kpis.overallCompletionRatePct}%`, icon: <TrendingUp className="w-4 h-4 text-violet-400" /> },
          { label: 'Delayed Orders', value: d.kpis.delayedOrders, icon: <AlertTriangle className="w-4 h-4 text-red-400" />, bad: d.kpis.delayedOrders > 0 },
          { label: 'In Progress', value: d.kpis.inProgressOrders, icon: <Factory className="w-4 h-4 text-amber-400" /> },
          { label: 'Completed', value: d.kpis.doneOrders, icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs">{k.icon}{k.label}</div>
            <div className={`text-xl font-bold ${(k as any).bad ? 'text-red-400' : (k as any).hi ? 'text-emerald-400' : 'text-white'}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly production */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Monthly Production (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.monthlyProduction}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="qty" fill="#38bdf8" name="Units Produced" radius={[3, 3, 0, 0]} />
              <Bar dataKey="orders" fill="#a78bfa" name="Orders" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Work Center Utilization */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Work Center Load</h3>
          {d.workCenters.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.workCenters} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="utilizationPct" fill="#34d399" name="Utilization %" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm py-10 text-center">No work centers configured</p>}
        </div>

        {/* Order Efficiency Table */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-semibold">Manufacturing Orders — Efficiency Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['MO#', 'Product', 'Status', 'Qty / Produced', 'Scrap%', 'Efficiency%', 'Build Time', 'Delayed?'].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-slate-400 uppercase text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.orders.slice(0, 20).map((o: any) => (
                  <tr key={o.id} className={`border-b border-slate-700/20 hover:bg-slate-700/20 ${o.isDelayed ? 'bg-red-500/5' : ''}`}>
                    <td className="px-3 py-2 font-mono text-sky-400">{o.moNumber}</td>
                    <td className="px-3 py-2 text-slate-300">{o.productName}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${o.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' : o.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{o.quantity} / {o.producedQty}</td>
                    <td className={`px-3 py-2 ${o.scrapRate > 5 ? 'text-red-400' : 'text-slate-400'}`}>{o.scrapRate}%</td>
                    <td className={`px-3 py-2 font-mono ${o.efficiency >= 90 ? 'text-emerald-400' : o.efficiency >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {o.efficiency > 0 ? `${o.efficiency}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{o.actualDurationMin > 0 ? `${o.actualDurationMin.toFixed(0)}min` : '—'}</td>
                    <td className="px-3 py-2">{o.isDelayed ? <span className="text-red-400">⚠ Delayed</span> : <span className="text-slate-600">—</span>}</td>
                  </tr>
                ))}
                {d.orders.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-500">No manufacturing orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
