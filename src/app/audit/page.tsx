'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import { History, Clock, Loader2, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/audit');
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit registry database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.userName.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span>Synchronizing audit history trail modules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Audit Logs
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Trace security configurations, user adjustments, and transactional operations logs history.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by action, operator name, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                <th className="p-4 font-bold">Timestamp</th>
                <th className="p-4 font-bold">Operator Name</th>
                <th className="p-4 font-bold">Action Details</th>
                <th className="p-4 font-bold">Target Entity</th>
                <th className="p-4 font-bold">State Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-slate-500 font-mono" colSpan={5}>
                    No logs registered matching the query filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 text-slate-550 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-200">
                      {log.userName}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700/30 text-sky-400 text-xxs font-bold uppercase tracking-wider font-mono">
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-350 font-semibold font-mono">
                      {log.entity}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 max-w-xl text-[10px] font-mono leading-normal">
                        {log.oldValues && (
                          <span className="text-rose-400">
                            <span className="text-slate-550 font-bold mr-1 block sm:inline">Before:</span>
                            {log.oldValues}
                          </span>
                        )}
                        {log.newValues && (
                          <span className="text-emerald-400">
                            <span className="text-slate-550 font-bold mr-1 block sm:inline">After:</span>
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
  );
}
