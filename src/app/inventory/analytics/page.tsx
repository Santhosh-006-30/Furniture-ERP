'use client';

import { useState, useEffect } from 'react';
import { Package, TrendingDown, Zap, AlertTriangle, BarChart2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

const ABC_COLOR: Record<string, string> = { A: '#34d399', B: '#fbbf24', C: '#f87171' };

export default function InventoryAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'products' | 'reorder'>('overview');
  const [search, setSearch] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    fetch('/api/inventory/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  const d = data;
  const filtered = (d.products ?? []).filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-400" /> Inventory Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">ABC analysis, aging, dead stock, and reorder forecasting</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Stock Value', value: `₹${(d.summary.totalStockValue / 1000).toFixed(1)}K`, icon: <BarChart2 className="w-4 h-4 text-sky-400" /> },
          { label: 'Dead Stock Value', value: `₹${(d.summary.deadStockValue / 1000).toFixed(1)}K`, icon: <TrendingDown className="w-4 h-4 text-red-400" /> },
          { label: 'Dead Stock Items', value: d.summary.deadStockCount, icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
          { label: 'Low Stock', value: d.summary.lowStockCount, icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
          { label: 'Fast Moving', value: d.summary.fastMovingCount, icon: <Zap className="w-4 h-4 text-emerald-400" /> },
          { label: 'Class A Items', value: d.summary.abcA, icon: <Package className="w-4 h-4 text-emerald-400" /> },
          { label: 'Class C Items', value: d.summary.abcC, icon: <Package className="w-4 h-4 text-slate-400" /> },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">{k.icon}{k.label}</div>
            <div className="text-lg font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-fit">
        {(['overview', 'products', 'reorder'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'reorder' ? 'Reorder Forecast' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Consumption */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Monthly Consumption (6 months)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.monthlyConsumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="qty" fill="#38bdf8" name="Units" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ABC Distribution */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">ABC Classification</h3>
            <div className="grid grid-cols-3 gap-3 h-[220px] content-center">
              {['A', 'B', 'C'].map((cls) => {
                const count = d.summary[`abc${cls}`] ?? 0;
                const total = d.products?.length ?? 1;
                const pct = total > 0 ? (count / total * 100).toFixed(1) : '0.0';
                return (
                  <div key={cls} className="flex flex-col items-center justify-center rounded-xl border p-4 gap-2"
                    style={{ borderColor: ABC_COLOR[cls] + '40', background: ABC_COLOR[cls] + '10' }}>
                    <div className="text-4xl font-black" style={{ color: ABC_COLOR[cls] }}>{cls}</div>
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-slate-400 text-xs">{pct}% of items</div>
                    <div className="text-xs text-center" style={{ color: ABC_COLOR[cls] }}>
                      {cls === 'A' ? 'Top 70% revenue' : cls === 'B' ? 'Next 20% revenue' : 'Bottom 10%'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Purchased */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 lg:col-span-2">
            <h3 className="text-white font-semibold mb-4">Top Purchased Items (Last 90 Days)</h3>
            {d.topPurchased?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.topPurchased} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  <Bar dataKey="qty" fill="#a78bfa" name="Units" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-sm py-8 text-center">No purchase data yet</p>}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-sky-500" />
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['SKU', 'Name', 'Stock', 'Reorder', 'Value', 'Sales Qty', 'Days Since Move', 'ABC', 'Tags'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-slate-400 uppercase text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                      <td className="px-3 py-2 font-mono text-sky-400">{p.sku}</td>
                      <td className="px-3 py-2 text-slate-300 max-w-[150px] truncate">{p.name}</td>
                      <td className={`px-3 py-2 font-mono ${p.isLowStock ? 'text-amber-400' : 'text-slate-300'}`}>{p.stockQty}</td>
                      <td className="px-3 py-2 text-slate-500">{p.reorderLevel}</td>
                      <td className="px-3 py-2 text-slate-300">₹{p.stockValue.toLocaleString()}</td>
                      <td className="px-3 py-2 text-slate-400">{p.totalSalesQty}</td>
                      <td className={`px-3 py-2 ${p.daysSinceMovement > 180 ? 'text-red-400' : 'text-slate-400'}`}>
                        {p.daysSinceMovement === 9999 ? '—' : `${p.daysSinceMovement}d`}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-bold" style={{ color: ABC_COLOR[p.abcClass] }}>{p.abcClass}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {p.isDeadStock && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px]">Dead</span>}
                          {p.isFastMoving && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">Fast</span>}
                          {p.isLowStock && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">Low</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'reorder' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-semibold">Reorder Forecast — {d.reorderForecast?.length ?? 0} items need restocking</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['SKU', 'Product', 'Current Stock', 'Reorder Level', 'Deficit', 'ABC Class', 'Estimated Cost'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-slate-400 uppercase text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(d.reorderForecast ?? []).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                    <td className="px-4 py-3 font-mono text-sky-400 text-xs">{item.sku}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{item.name}</td>
                    <td className="px-4 py-3 text-amber-400 font-mono text-xs">{item.stockQty}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.reorderLevel}</td>
                    <td className="px-4 py-3 text-red-400 font-mono text-xs">{item.deficit}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-sm" style={{ color: ABC_COLOR[item.abcClass] }}>{item.abcClass}</span>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 text-xs">₹{item.estimatedCost.toLocaleString()}</td>
                  </tr>
                ))}
                {(d.reorderForecast ?? []).length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-emerald-400">✓ All items above reorder levels</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
