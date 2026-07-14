'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Server, Database, Users, Activity, AlertTriangle, CheckCircle,
  Cpu, HardDrive, Clock, TrendingUp, Zap, Globe
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { PageHeader } from '../../../components/ui/PageHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';

interface SystemData {
  server: { uptimeFormatted: string; environment: string; nodeVersion: string; platform: string; hostname: string };
  memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number; systemTotalMB: number; systemFreeMB: number; systemUsedPct: number };
  database: { status: string; latencyMs: number; sizeBytes: number; sizeMB: number };
  users: { total: number; active: number; todayLogins: number; failedLogins: number };
  api: { totalRequests: number; errorCount: number; errorRate: number; lastHourRequests: number };
  charts: { hourlyRequests: any[]; dailyLogins: any[] };
}

export default function SystemAdminPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/system', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return (
    <div className="space-y-6">
      <LoadingSkeleton variant="text" className="h-10 w-1/3" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <LoadingSkeleton key={i} variant="card" className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton variant="card" className="h-64" />
        <LoadingSkeleton variant="card" className="h-64" />
      </div>
    </div>
  );

  const d = data!;
  const dbOk = d.database.status === 'ok';

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="System Administration"
        description="Real-time server health, memory footprints, and database operational metrics."
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-slate-500 text-xs">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Refresh Now
            </button>
          </div>
        }
      />

      {/* Health Banner */}
      <GlassCard
        className={`flex items-center gap-3 p-4 rounded-xl border hover:translate-y-0 ${
          dbOk ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
        }`}
        hoverable={false}
      >
        {dbOk ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        )}
        <div className="flex-1">
          <p className={`font-semibold text-xs ${dbOk ? 'text-emerald-300' : 'text-red-300'}`}>
            {dbOk ? 'All systems operational' : 'Database connectivity issue detected'}
          </p>
          <p className="text-slate-500 text-[10px] mt-0.5">
            {d.server.environment.toUpperCase()} · {d.server.hostname} · Node {d.server.nodeVersion} · {d.server.platform}
          </p>
        </div>
        <StatusBadge status={dbOk ? 'ONLINE' : 'DEGRADED'} type={dbOk ? 'success' : 'danger'} />
      </GlassCard>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Clock className="w-4 h-4 text-sky-400" />, label: 'Uptime', value: d.server.uptimeFormatted, sub: d.server.environment, type: 'info' as const },
          { icon: <Database className="w-4 h-4 text-violet-400" />, label: 'DB Size', value: `${d.database.sizeMB} MB`, sub: `${d.database.latencyMs}ms latency`, type: 'neutral' as const },
          { icon: <Users className="w-4 h-4 text-amber-400" />, label: 'Active Users', value: d.users.active.toString(), sub: `${d.users.todayLogins} logins today`, type: 'warning' as const },
          { icon: <Activity className="w-4 h-4 text-emerald-400" />, label: 'API Requests', value: d.api.totalRequests.toLocaleString(), sub: `${d.api.lastHourRequests} last hour`, type: 'success' as const },
          { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, label: 'API Errors', value: d.api.errorCount.toLocaleString(), sub: `${d.api.errorRate}% error rate`, type: 'danger' as const },
          { icon: <Cpu className="w-4 h-4 text-pink-400" />, label: 'Heap Used', value: `${d.memory.heapUsedMB} MB`, sub: `of ${d.memory.heapTotalMB} MB`, type: 'neutral' as const },
          { icon: <HardDrive className="w-4 h-4 text-cyan-400" />, label: 'System RAM', value: `${d.memory.systemUsedPct}%`, sub: `${d.memory.systemFreeMB.toFixed(0)} MB free`, type: 'info' as const },
          { icon: <Zap className="w-4 h-4 text-orange-400" />, label: 'Failed Logins', value: d.users.failedLogins.toString(), sub: 'today', type: 'warning' as const },
        ].map((kpi, i) => (
          <GlassCard key={i} className="flex flex-col justify-between hover:translate-y-[-1px] duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div>
              <div className="text-xl font-black text-white tracking-tight">{kpi.value}</div>
              <div className="text-slate-500 text-[9px] mt-1">{kpi.sub}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Requests */}
        <GlassCard className="space-y-4 hover:translate-y-0" hoverable={false}>
          <h3 className="text-white text-xs font-bold tracking-wider font-mono uppercase flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" /> Requests / Hour (Last 24h)
          </h3>
          {d.charts.hourlyRequests.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.charts.hourlyRequests}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(v) => v ? new Date(v).toLocaleTimeString([], { hour: '2-digit' }) : v} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#38bdf8" name="Requests" radius={[3, 3, 0, 0]} />
                <Bar dataKey="errors" fill="#f87171" name="Errors" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm font-mono">
              No API traffic recorded yet
            </div>
          )}
        </GlassCard>

        {/* Daily Logins */}
        <GlassCard className="space-y-4 hover:translate-y-0" hoverable={false}>
          <h3 className="text-white text-xs font-bold tracking-wider font-mono uppercase flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" /> Logins / Day (Last 7 Days)
          </h3>
          {d.charts.dailyLogins.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={d.charts.dailyLogins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa' }} name="Logins" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm font-mono">
              No login data recorded yet
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
