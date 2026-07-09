'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BellRing, CheckCheck, Search, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../../lib/api-client';

interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchNotifications = async (nextPage = page) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(nextPage), pageSize: '10', filter });
      if (search.trim()) params.set('search', search.trim());
      const data = await api.get(`/customer/notifications?${params.toString()}`);
      setNotifications(data.notifications || []);
      setPagination(data.pagination || null);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: any) {
      setError(err.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications(1);
  };

  const handleRead = async (id: string) => {
    try {
      setBusyId(id);
      await api.patch(`/customer/notifications/${id}/read`, {});
      await fetchNotifications(page);
    } catch (err: any) {
      setError(err.message || 'Unable to mark notification as read.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/customer/notifications/read-all', {});
      await fetchNotifications(page);
    } catch (err: any) {
      setError(err.message || 'Unable to mark all notifications as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setBusyId(id);
      await api.delete(`/customer/notifications/${id}`);
      await fetchNotifications(page);
    } catch (err: any) {
      setError(err.message || 'Unable to delete notification.');
    } finally {
      setBusyId(null);
    }
  };

  const formatRelativeTime = (value: string) => {
    const created = new Date(value);
    const diff = Date.now() - created.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const pageable = useMemo(() => pagination, [pagination]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Notifications</h1>
        <p className="text-slate-400 text-xs">Stay up to date with order, delivery, manufacturing, and invoice updates.</p>
      </div>

      {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}

      <div className="glass-panel rounded-2xl border border-slate-800/80 p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <BellRing className="h-4 w-4 text-sky-400" />
            <span className="text-sm font-semibold">{unreadCount} unread</span>
          </div>
          <button onClick={handleMarkAllRead} className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300">Mark all read</button>
        </div>

        <form onSubmit={handleApply} className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.4fr]">
          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-xs text-slate-300">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent outline-none" placeholder="Search notifications" />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-sm text-slate-200">
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white">Apply</button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, idx) => <div key={idx} className="glass-panel h-24 animate-pulse rounded-2xl border border-slate-800/80" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-10 text-center text-sm text-slate-400">No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className={`glass-panel rounded-2xl border p-4 ${notification.isRead ? 'border-slate-800/80' : 'border-sky-500/20 bg-sky-500/5'}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${notification.isRead ? 'bg-slate-600' : 'bg-sky-400'}`} />
                    <h2 className="text-sm font-semibold text-slate-100">{notification.title}</h2>
                  </div>
                  <p className="text-sm text-slate-400">{notification.message}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{formatRelativeTime(notification.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button onClick={() => handleRead(notification.id)} className="rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300">Mark read</button>
                  )}
                  <button onClick={() => handleDelete(notification.id)} className="rounded-xl border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-300">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pageable && pageable.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => { const next = Math.max(1, page - 1); setPage(next); fetchNotifications(next); }} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Previous</button>
          <span className="text-xs text-slate-400">Page {pageable.page} of {pageable.totalPages}</span>
          <button disabled={page >= pageable.totalPages} onClick={() => { const next = page + 1; setPage(next); fetchNotifications(next); }} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
