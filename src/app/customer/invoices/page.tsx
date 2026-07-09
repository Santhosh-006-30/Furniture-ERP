'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search, ArrowRight, FileText, Download, Eye } from 'lucide-react';
import api from '../../../lib/api-client';

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: string;
  customerName: string;
  grandTotal: number;
  paymentStatus: string;
  paymentStatusBadge: string;
  status: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchInvoices();
  }, [page, sort]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(page), sort, ...(search ? { search } : {}) });
      const data = await api.get(`/customer/invoices?${params.toString()}`);
      setInvoices(data.invoices || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      setError(err.message || 'Unable to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const badgeClasses = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-300';
      case 'PARTIALLY PAID':
        return 'bg-amber-500/10 text-amber-300';
      case 'OVERDUE':
        return 'bg-rose-500/10 text-rose-300';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const pageable = useMemo(() => pagination, [pagination]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Invoices</h1>
        <p className="text-slate-400 text-xs">Professional invoices for completed orders and invoice-ready deliveries.</p>
      </div>

      {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}

      <form onSubmit={handleSearch} className="glass-panel rounded-2xl border border-slate-800/80 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <Search className="h-4 w-4 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2 text-sm text-slate-200" placeholder="Search invoice or order" />
        </label>
        <label className="text-xs text-slate-300">
          <span className="mr-2">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2 text-sm text-slate-200">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_amount">Highest amount</option>
            <option value="lowest_amount">Lowest amount</option>
          </select>
        </label>
        <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white">Apply</button>
      </form>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(4)].map((_, idx) => <div key={idx} className="glass-panel h-24 animate-pulse rounded-2xl border border-slate-800/80" />)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-10 text-center text-sm text-slate-400">No invoices are available yet.</div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="glass-panel rounded-2xl border border-slate-800/80 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-sky-400">{invoice.invoiceNumber}</span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200">{invoice.orderNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span>{new Date(invoice.invoiceDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    <span className="mx-2">•</span>
                    <span>{invoice.customerName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-100">₹{invoice.grandTotal.toLocaleString()}</div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${badgeClasses(invoice.paymentStatus)}`}>{invoice.paymentStatus}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-900/70 pt-4">
                <Link href={`/customer/invoices/${invoice.id}`} className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">View</Link>
                <button className="rounded-xl border border-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Download</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pageable && pageable.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Previous</button>
          <span className="text-xs text-slate-400">Page {pageable.page} of {pageable.totalPages}</span>
          <button disabled={page >= pageable.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
