'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { BellRing, CheckCheck, Search, Trash2, Loader2, Archive, ArchiveRestore, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../../lib/api-client';

interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  isRead: boolean;
  isArchived: boolean;
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

  // Filters state
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async (nextPage = page) => {
    try {
      setError('');
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: '10',
        filter,
        category: categoryFilter,
        priority: priorityFilter,
      });
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
  }, [filter, categoryFilter, priorityFilter, search, page]);

  // Initial fetch and polling setup
  useEffect(() => {
    setLoading(true);
    fetchNotifications(1);
    setPage(1);
  }, [filter, categoryFilter, priorityFilter]);

  // Real-time polling for new notifications (every 8 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchNotifications(page);
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchNotifications, page]);

  const handleApplySearch = (e: React.FormEvent) => {
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

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      setBusyId(id);
      await api.post(`/customer/notifications`, {
        action: 'archive',
        id,
        isArchived,
      });
      await fetchNotifications(page);
    } catch (err: any) {
      setError(err.message || 'Unable to update notification archive status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await api.patch('/customer/notifications/read-all', {});
      await fetchNotifications(page);
    } catch (err: any) {
      setError(err.message || 'Unable to mark all notifications as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setBusyId(id);
      await api.delete(`/customer/notifications/${id}`);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      await fetchNotifications(page);
    } catch (err: any) {
      setError(err.message || 'Unable to delete notification.');
    } finally {
      setBusyId(null);
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await api.post('/customer/notifications', {
        action: 'bulk_delete',
        ids: selectedIds,
      });
      setSelectedIds([]);
      await fetchNotifications(page);
    } catch (err: any) {
      setError(err.message || 'Unable to perform bulk delete.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkMarkRead = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await api.post('/customer/notifications', {
        action: 'bulk_read',
        ids: selectedIds,
      });
      setSelectedIds([]);
      await fetchNotifications(page);
    } catch (err: any) {
      setError(err.message || 'Unable to mark notifications read.');
    } finally {
      setActionLoading(false);
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

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'LOW':
        return 'bg-slate-700/40 text-slate-400 border-slate-700/30';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  const pageable = useMemo(() => pagination, [pagination]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Notification Center
          </h1>
          <button
            onClick={() => fetchNotifications(page)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/50 transition"
          >
            <RefreshCw className="h-3 w-3 animate-pulse" />
            Refresh
          </button>
        </div>
        <p className="text-slate-400 text-xs">
          Stay up to date with real-time updates regarding order status, delivery tracking, and payments.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Control Panel */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <BellRing className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-semibold">{unreadCount} unread notifications</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || actionLoading}
              className="rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-40"
            >
              Mark all read
            </button>
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handleBulkMarkRead}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark Read ({selectedIds.length})
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected ({selectedIds.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter / Search Form */}
        <form onSubmit={handleApplySearch} className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-xs text-slate-300 md:col-span-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none"
              placeholder="Search notifications..."
            />
          </label>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-xs text-slate-200"
          >
            <option value="all">Status: Active</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-xs text-slate-200"
          >
            <option value="">All Categories</option>
            <option value="ORDER">Order Updates</option>
            <option value="DELIVERY">Delivery Alerts</option>
            <option value="PAYMENT">Payments</option>
            <option value="GENERAL">General</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-xs text-slate-200"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </form>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="glass-panel h-20 animate-pulse rounded-2xl border border-slate-800/80" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-10 text-center text-sm text-slate-400">
          No notifications matches your criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select all header */}
          <div className="flex items-center gap-3 px-4 py-1.5 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={selectedIds.length === notifications.length && notifications.length > 0}
              onChange={toggleSelectAll}
              className="rounded bg-[#090f1d] border-slate-700 h-3.5 w-3.5"
            />
            <span>Select All page items</span>
          </div>

          {/* List */}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass-panel rounded-2xl border p-4 transition-all ${
                notification.isRead ? 'border-slate-800/80 bg-slate-900/10' : 'border-sky-500/20 bg-sky-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notification.id)}
                  onChange={() => toggleSelect(notification.id)}
                  className="rounded bg-[#090f1d] border-slate-700 h-4 w-4 mt-1"
                />

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`h-2 w-2 rounded-full ${notification.isRead ? 'bg-slate-600' : 'bg-sky-400'}`} />
                    <h2 className="text-sm font-semibold text-slate-100">{notification.title}</h2>
                    
                    {/* Category & Priority Badge */}
                    <span className="px-1.5 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-[10px] text-slate-400">
                      {notification.category}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full border text-[10px] uppercase font-bold ${getPriorityStyle(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{notification.message}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleRead(notification.id)}
                      disabled={busyId === notification.id}
                      title="Mark read"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(notification.id, !notification.isArchived)}
                    disabled={busyId === notification.id}
                    title={notification.isArchived ? 'Unarchive' : 'Archive'}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 text-slate-300 hover:text-white"
                  >
                    {notification.isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    disabled={busyId === notification.id}
                    title="Delete"
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageable && pageable.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              fetchNotifications(next);
            }}
            className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 disabled:opacity-50 hover:bg-slate-800 transition"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {pageable.page} of {pageable.totalPages}
          </span>
          <button
            disabled={page >= pageable.totalPages}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              fetchNotifications(next);
            }}
            className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 disabled:opacity-50 hover:bg-slate-800 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
