'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  TrendingUp,
  Truck,
  AlertTriangle,
  History,
  Clock,
  Hammer,
  ShoppingCart,
  Receipt
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard');
      setMetrics(data);
    } catch (err) {
      console.error('Error retrieving cockpit dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="text" className="h-10 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
        <LoadingSkeleton variant="table" className="h-64" />
      </div>
    );
  }

  const kpis = metrics?.kpis || {
    totalSales: 0,
    pending: 0,
    manufacturingOrders: 0,
    delayed: 0,
    totalPurchases: 0,
    partialReceipts: 0
  };
  const auditLogs = metrics?.auditLogs || [];

  const cards = [
    {
      title: 'Total Sales',
      value: kpis.totalSales,
      icon: TrendingUp,
      badgeType: 'info' as const,
      description: 'Aggregate sales order count placed'
    },
    {
      title: 'Pending Deliveries',
      value: kpis.pending,
      icon: Truck,
      badgeType: 'warning' as const,
      description: 'Active allocations & reservations'
    },
    {
      title: 'Mfg Orders',
      value: kpis.manufacturingOrders,
      icon: Hammer,
      badgeType: 'neutral' as const,
      description: 'Scheduled good build orders'
    },
    {
      title: 'Delayed Orders',
      value: kpis.delayed,
      icon: AlertTriangle,
      badgeType: 'danger' as const,
      description: 'Workstations showing backlog'
    },
    {
      title: 'Total Purchases',
      value: kpis.totalPurchases,
      icon: ShoppingCart,
      badgeType: 'info' as const,
      description: 'Procurements issued to vendors'
    },
    {
      title: 'Partial Receipts',
      value: kpis.partialReceipts,
      icon: Receipt,
      badgeType: 'success' as const,
      description: 'Replenishments accepted'
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Control Center Dashboard"
        description="Real-time summary of Shiv Furniture Works operational KPIs and transaction activities."
      />

      {/* Bento Grid layout for KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <GlassCard
              key={idx}
              className="flex flex-col justify-between h-full bg-slate-900/30 hover:translate-y-[-2px] duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {c.title}
                  </span>
                  <span className="text-3xl font-black text-white block tracking-tight">
                    {c.value}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-sky-400">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 leading-normal truncate max-w-[70%]">
                  {c.description}
                </p>
                <StatusBadge status="ACTIVE" type={c.badgeType} className="scale-75" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Bottom section: Audit logs inside a GlassCard Bento container */}
      <GlassCard className="space-y-4 hover:translate-y-0" hoverable={false}>
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <span>Real-time System Audit Trail</span>
        </h3>

        <DataTable
          loading={loading}
          data={auditLogs}
          emptyMessage="No audit activities registered yet."
          columns={[
            {
              header: 'Timestamp',
              accessor: (log: any) => (
                <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(log.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )
            },
            {
              header: 'Operator',
              accessor: (log: any) => <span className="text-slate-300 font-bold">{log.userName}</span>
            },
            {
              header: 'Action Details',
              accessor: (log: any) => (
                <StatusBadge status={log.action.replace('_', ' ')} type="info" />
              )
            },
            {
              header: 'Target Entity',
              accessor: (log: any) => <span className="font-mono text-sky-400 text-xs">{log.entity}</span>
            },
            {
              header: 'State Changes',
              accessor: (log: any) => (
                <div className="flex flex-col gap-1 max-w-md text-[10px] font-mono leading-normal">
                  {log.oldValues && (
                    <span className="text-rose-455">
                      <span className="text-slate-500 font-bold mr-1">Before:</span>
                      {log.oldValues}
                    </span>
                  )}
                  {log.newValues && (
                    <span className="text-emerald-400">
                      <span className="text-slate-500 font-bold mr-1">After:</span>
                      {log.newValues}
                    </span>
                  )}
                </div>
              )
            }
          ]}
        />
      </GlassCard>
    </div>
  );
}
