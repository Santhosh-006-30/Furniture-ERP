'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, AlertTriangle, Zap, TrendingUp, RefreshCw, Search, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MonitorData {
  summary: { totalRequests24h: number; errorRequests24h: number; errorRate: number; avgResponseMs: number };
  charts: {
    slowest: { endpoint: string; method: string; avgMs: number; count: number }[];
    mostUsed: { endpoint: string; method: string; count: number }[];
    failed: { endpoint: string; method: string; count: number; lastStatus: number }[];
    responseTimeBuckets: { bucket: string; count: number }[];
    hourlyTrend: { hour: string; total: number; errors: number; avgMs: number }[];
  };
  logs: any[];
  total: number;
}

const STATUS_COLOR: Record<number, string> = {};
function getStatusColor(code: number) {
  if (code < 300) return '#34d399';
  if (code < 400) return '#fbbf24';
  if (code < 500) return '#f87171';
  return '#ef4444';
}

export default function ApiMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'logs'>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchData = useCallback(async (pg = 1) => {
    const params = new URLSearchParams({ page: String(pg), pageSize: '100', ...(search && { endpoint: search }), ...(statusFilter && { status: statusFilter }) });
    const res = await fetch(`/api/api-monitor?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [token, search, statusFilter]);

  useEffect(() => { fetchData(1); setPage(1); }, [search, statusFilter]);
  useEffect(() => { const t = setInterval(() => fetchData(page), 30000); return () => clearInterval(t); }, [fetchData, page]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  const d = data!;
  const totalPages = Math.ceil(d.total / 100);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400" /> API Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time API performance and error tracking</p>
        </div>
        <button onClick={() => fetchData(page)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Requests (24h)', value: d.summary.totalRequests24h.toLocaleString(), icon: <Activity className="w-4 h-4 text-sky-400" /> },
          { label: 'Errors (24h)', value: d.summary.errorRequests24h.toLocaleString(), icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
          { label: 'Error Rate', value: `${d.summary.errorRate}%`, icon: <TrendingUp className="w-4 h-4 text-amber-400" /> },
          { label: 'Avg Response', value: `${d.summary.avgResponseMs}ms`, icon: <Zap className="w-4 h-4 text-emerald-400" /> },
        ].map((k, i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs">{k.icon}{k.label}</div>
            <div className="text-xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-fit">
        {(['overview', 'logs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly trend */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Requests / Hour</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.charts.hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="total" fill="#38bdf8" name="Total" radius={[3, 3, 0, 0]} />
                <Bar dataKey="errors" fill="#f87171" name="Errors" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Response time distribution */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Response Time Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.charts.responseTimeBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="bucket" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {d.charts.responseTimeBuckets.map((e, i) => (
                    <Cell key={i} fill={i < 2 ? '#34d399' : i < 4 ? '#fbbf24' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Slowest endpoints */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Slowest Endpoints</h3>
            <div className="space-y-2">
              {d.charts.slowest.length === 0
                ? <p className="text-slate-500 text-sm">No data yet</p>
                : d.charts.slowest.map((e, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${e.method === 'GET' ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300'}`}>{e.method}</span>
                      <span className="text-slate-300 text-xs truncate">{e.endpoint}</span>
                    </div>
                    <span className={`text-xs font-mono shrink-0 ml-2 ${e.avgMs > 1000 ? 'text-red-400' : 'text-slate-400'}`}>{e.avgMs.toFixed(0)}ms</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Most used */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-sky-400" /> Most Used Endpoints</h3>
            <div className="space-y-2">
              {d.charts.mostUsed.length === 0
                ? <p className="text-slate-500 text-sm">No data yet</p>
                : d.charts.mostUsed.map((e, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${e.method === 'GET' ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300'}`}>{e.method}</span>
                      <span className="text-slate-300 text-xs truncate">{e.endpoint}</span>
                    </div>
                    <span className="text-slate-400 text-xs shrink-0 ml-2">{Number(e.count).toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by endpoint…"
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-sky-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white outline-none">
              <option value="">All Status</option>
              <option value="error">Errors only</option>
              <option value="slow">Slow (&gt;1s)</option>
            </select>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['Time', 'Method', 'Endpoint', 'Status', 'Duration', 'IP', 'User'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-slate-400 uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="px-3 py-2"><span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded">{log.method}</span></td>
                      <td className="px-3 py-2 text-slate-300 max-w-[200px] truncate">{log.endpoint}</td>
                      <td className="px-3 py-2"><span style={{ color: getStatusColor(log.statusCode) }} className="font-mono font-bold">{log.statusCode}</span></td>
                      <td className={`px-3 py-2 font-mono ${log.responseTime > 1000 ? 'text-red-400' : 'text-slate-400'}`}>{log.responseTime.toFixed(0)}ms</td>
                      <td className="px-3 py-2 text-slate-500">{log.ip ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-400">{log.userName ?? '—'}</td>
                    </tr>
                  ))}
                  {d.logs.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-500">No logs yet. API monitoring is active.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-500 text-xs">{d.total} total logs</span>
              <div className="flex items-center gap-2">
                <button onClick={() => { setPage(page - 1); fetchData(page - 1); }} disabled={page === 1}
                  className="p-1 rounded bg-slate-700 disabled:opacity-40"><ChevronLeft className="w-3 h-3 text-slate-300" /></button>
                <span className="text-slate-400 text-xs">{page}/{totalPages || 1}</span>
                <button onClick={() => { setPage(page + 1); fetchData(page + 1); }} disabled={page >= totalPages}
                  className="p-1 rounded bg-slate-700 disabled:opacity-40"><ChevronRight className="w-3 h-3 text-slate-300" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
