'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Eye, X, FileText, User, Clock } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userName: string;
  action: string;
  entity: string;
  oldValues: string | null;
  newValues: string | null;
  timestamp: string;
  user?: { email: string; role: string } | null;
}

interface FiltersData {
  entities: string[];
  userNames: string[];
  actions: string[];
}

function JsonViewer({ label, raw }: { label: string; raw: string | null }) {
  if (!raw) return <span className="text-slate-600 italic text-xs">—</span>;
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return <span className="text-slate-400 text-xs font-mono break-all">{raw}</span>; }
  return (
    <div>
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <pre className="text-xs text-slate-300 bg-slate-900/60 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditExplorerPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [filters, setFilters] = useState<FiltersData>({ entities: [], userNames: [], actions: [] });

  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [userName, setUserName] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchLogs = useCallback(async (pg = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pg), pageSize: String(pageSize),
      ...(search && { search }),
      ...(entity && { entity }),
      ...(userName && { userName }),
      ...(action && { action }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });
    const res = await fetch(`/api/admin/audit?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      if (data.filters) setFilters(data.filters);
    }
    setLoading(false);
  }, [search, entity, userName, action, dateFrom, dateTo, pageSize, token]);

  useEffect(() => { fetchLogs(1); setPage(1); }, [search, entity, userName, action, dateFrom, dateTo]);

  function exportCsv() {
    const header = ['ID', 'Timestamp', 'User', 'Action', 'Entity', 'Old Values', 'New Values'].join(',');
    const rows = logs.map((l) => [
      l.id, l.timestamp, l.userName, l.action, l.entity,
      `"${(l.oldValues ?? '').replace(/"/g, '""')}"`,
      `"${(l.newValues ?? '').replace(/"/g, '""')}"`,
    ].join(','));
    const csv = [header, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-400" /> Audit Explorer
          </h1>
          <p className="text-slate-400 text-sm mt-1">{total.toLocaleString()} records found</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entity, action, user…"
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:border-sky-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select value={entity} onChange={(e) => setEntity(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 outline-none">
            <option value="">All Entities</option>
            {filters.entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={userName} onChange={(e) => setUserName(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 outline-none">
            <option value="">All Users</option>
            {filters.userNames.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 outline-none">
            <option value="">All Actions</option>
            {filters.actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 outline-none" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-white focus:border-sky-500 outline-none" />
        </div>
        {(search || entity || userName || action || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(''); setEntity(''); setUserName(''); setAction(''); setDateFrom(''); setDateTo(''); }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
            <X className="w-3 h-3" /> Clear all filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Timestamp', 'User', 'Action', 'Entity', 'Changes', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">No audit logs found</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-300 text-xs">{log.userName}</span>
                    </div>
                    {log.user && <div className="text-slate-500 text-xs ml-4.5">{log.user.role}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-sky-500/15 text-sky-300 rounded text-xs font-mono">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{log.entity}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {log.oldValues && <span className="text-xs px-1.5 py-0.5 bg-amber-500/15 text-amber-300 rounded">before</span>}
                      {log.newValues && <span className="text-xs px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 rounded">after</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(log)}
                      className="text-slate-400 hover:text-sky-400 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-500 text-xs">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => { setPage(page - 1); fetchLogs(page - 1); }} disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-700 disabled:opacity-40 hover:bg-slate-600 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
            <span className="text-slate-400 text-sm">{page} / {totalPages || 1}</span>
            <button onClick={() => { setPage(page + 1); fetchLogs(page + 1); }} disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-700 disabled:opacity-40 hover:bg-slate-600 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{selected.action}</h3>
                <p className="text-slate-400 text-sm">{selected.entity}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">User:</span> <span className="text-slate-300 ml-1">{selected.userName}</span></div>
              <div><span className="text-slate-500">Timestamp:</span> <span className="text-slate-300 ml-1">{new Date(selected.timestamp).toLocaleString()}</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <JsonViewer label="Before (Old Values)" raw={selected.oldValues} />
              <JsonViewer label="After (New Values)" raw={selected.newValues} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
