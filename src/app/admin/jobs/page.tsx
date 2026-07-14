'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Clock, CheckCircle, XCircle, Loader2, Calendar, RefreshCw, Timer } from 'lucide-react';

interface Job {
  name: string;
  label: string;
  description: string;
  intervalLabel: string;
  status: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  IDLE:    { bg: 'bg-slate-700/50', text: 'text-slate-400', icon: <Clock className="w-3 h-3" /> },
  RUNNING: { bg: 'bg-sky-500/20',   text: 'text-sky-300',   icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  SUCCESS: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', icon: <CheckCircle className="w-3 h-3" /> },
  FAILED:  { bg: 'bg-red-500/20',   text: 'text-red-300',   icon: <XCircle className="w-3 h-3" /> },
};

function fmt(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function relTime(dt: string | null): string {
  if (!dt) return '—';
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchJobs = useCallback(async () => {
    const res = await fetch('/api/admin/jobs', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchJobs(); const t = setInterval(fetchJobs, 10000); return () => clearInterval(t); }, [fetchJobs]);

  async function runNow(jobName: string) {
    setRunning(jobName);
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobName }),
      });
      const data = await res.json();
      setToast(data.message ?? 'Job triggered');
      setTimeout(() => setToast(null), 4000);
      setTimeout(fetchJobs, 2000);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Timer className="w-6 h-6 text-sky-400" /> Background Jobs
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage and monitor scheduled background jobs</p>
        </div>
        <button onClick={fetchJobs} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const style = STATUS_STYLES[job.status] ?? STATUS_STYLES.IDLE;
            const isRunning = running === job.name;

            return (
              <div key={job.name} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Job info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-white font-semibold">{job.label}</h3>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {style.icon} {job.status}
                    </span>
                    <span className="text-slate-500 text-xs bg-slate-700/50 px-2 py-0.5 rounded-full">
                      every {job.intervalLabel}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{job.description}</p>

                  {job.errorMessage && (
                    <p className="text-red-400 text-xs mt-2 font-mono bg-red-500/10 px-3 py-2 rounded-lg">
                      ✕ {job.errorMessage}
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-col gap-1 text-xs text-slate-500 sm:text-right shrink-0">
                  <span className="flex items-center gap-1 sm:justify-end">
                    <Clock className="w-3 h-3" /> Last: {relTime(job.lastRunAt)}
                  </span>
                  <span className="flex items-center gap-1 sm:justify-end">
                    <Calendar className="w-3 h-3" /> Next: {job.nextRunAt ? new Date(job.nextRunAt).toLocaleString() : '—'}
                  </span>
                  <span className="flex items-center gap-1 sm:justify-end">
                    <Timer className="w-3 h-3" /> Duration: {fmt(job.durationMs)}
                  </span>
                </div>

                {/* Run Now */}
                <button
                  onClick={() => runNow(job.name)}
                  disabled={!!running}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shrink-0"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isRunning ? 'Running…' : 'Run Now'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
