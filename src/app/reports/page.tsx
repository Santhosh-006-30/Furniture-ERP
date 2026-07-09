'use client';

import React, { useState } from 'react';
import {
  FileText, Download, Loader2, AlertCircle, Search, ChevronLeft, ChevronRight,
  BarChart2, ShoppingCart, Package, Hammer, Users, RotateCcw, IndianRupee, RefreshCw
} from 'lucide-react';

const REPORT_TYPES = [
  { key: 'sales', label: 'Sales Report', icon: ShoppingCart, color: 'text-sky-400', bg: 'from-sky-500/10 to-cyan-500/5' },
  { key: 'purchase', label: 'Purchase Report', icon: Package, color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/5' },
  { key: 'manufacturing', label: 'Manufacturing Report', icon: Hammer, color: 'text-violet-400', bg: 'from-violet-500/10 to-purple-500/5' },
  { key: 'inventory', label: 'Inventory Report', icon: BarChart2, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-green-500/5' },
  { key: 'customers', label: 'Customers Report', icon: Users, color: 'text-rose-400', bg: 'from-rose-500/10 to-pink-500/5' },
  { key: 'returns', label: 'Returns Report', icon: RotateCcw, color: 'text-orange-400', bg: 'from-orange-500/10 to-amber-500/5' },
  { key: 'revenue', label: 'Revenue Report', icon: IndianRupee, color: 'text-indigo-400', bg: 'from-indigo-500/10 to-purple-500/5' },
];

const PAGE_SIZE = 20;

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<{ columns: string[]; data: any[]; count: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const buildParams = (format?: string) => {
    const params = new URLSearchParams({ type: selectedType });
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (format) params.set('format', format);
    return params.toString();
  };

  const run = async () => {
    setError('');
    setLoading(true);
    setPage(1);
    try {
      const token = document.cookie.split('; ').find((r) => r.startsWith('auth_token='))?.split('=')[1];
      const res = await fetch(`/api/reports?${buildParams()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate report');
      }
      const data = await res.json();
      setReport(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const token = document.cookie.split('; ').find((r) => r.startsWith('auth_token='))?.split('=')[1];
      const res = await fetch(`/api/reports?${buildParams('csv')}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    // Generate Excel-compatible CSV (UTF-8 BOM for Excel)
    if (!report) return;
    setExporting(true);
    try {
      const BOM = '\uFEFF';
      const rows = [
        report.columns.join(','),
        ...report.data.map((row) =>
          report.columns.map((col) => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')
        ),
      ];
      const content = BOM + rows.join('\n');
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-report-${new Date().toISOString().split('T')[0]}.xlsx.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = () => {
    if (!report) return;
    const html = `
      <html><head><title>${selectedType} Report</title>
      <style>
        body { font-family: sans-serif; font-size: 11px; color: #111; padding: 20px; }
        h1 { font-size: 16px; margin-bottom: 8px; }
        p { margin: 0 0 12px; color: #555; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e293b; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        tr:nth-child(even) td { background: #f8fafc; }
      </style></head>
      <body>
        <h1>${REPORT_TYPES.find((t) => t.key === selectedType)?.label || selectedType}</h1>
        <p>Generated: ${new Date().toLocaleString('en-IN')} · ${report.count} records</p>
        <table>
          <thead><tr>${report.columns.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${report.data.map((row) =>
            `<tr>${report.columns.map((c) => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`
          ).join('')}</tbody>
        </table>
      </body></html>
    `;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  const filteredData = (report?.data || []).filter((row) => {
    if (!search) return true;
    return Object.values(row).some((v) => String(v).toLowerCase().includes(search.toLowerCase()));
  });

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selected = REPORT_TYPES.find((t) => t.key === selectedType);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20">
          <FileText className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-xs text-slate-400">Export business data in CSV / Excel / PDF formats</p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {REPORT_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => { setSelectedType(t.key); setReport(null); setError(''); }}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
              selectedType === t.key
                ? `bg-gradient-to-br ${t.bg} border-slate-600`
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <t.icon className={`w-5 h-5 ${selectedType === t.key ? t.color : 'text-slate-500'}`} />
            <span className={`text-xs font-medium leading-tight ${selectedType === t.key ? 'text-white' : 'text-slate-400'}`}>
              {t.label.replace(' Report', '')}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Generate Report
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Report Table */}
      {report && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{report.count} records</span>
              <span className="text-slate-700">·</span>
              <span className="text-sm text-white font-medium">{selected?.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search…"
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 w-40"
                />
              </div>
              <button
                onClick={exportCsv}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={exportExcel}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={exportPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider">
                    {report.columns.map((col) => (
                      <th key={col} className="px-3 py-3 text-left font-medium whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pageData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      {report.columns.map((col) => (
                        <td key={col} className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{row[col] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                  {pageData.length === 0 && (
                    <tr>
                      <td colSpan={report.columns.length} className="px-4 py-8 text-center text-slate-500">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 text-xs">
                Page {page} of {totalPages} · {filteredData.length} results
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!report && !loading && (
        <div className="text-center py-20 text-slate-600">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select a report type and click &quot;Generate Report&quot; to start.</p>
        </div>
      )}
    </div>
  );
}
