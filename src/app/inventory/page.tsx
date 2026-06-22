'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import { useStore } from '../../lib/store';
import {
  Truck,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  ListFilter,
  Layers,
  Database
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'status' | 'ledger'>('status');
  const [stocks, setStocks] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [search, setSearch] = useState('');

  const handleTriggerProcurement = async () => {
    try {
      setTriggering(true);
      const res = await api.post('/inventory/trigger-procurement', {});
      alert(`Procurement triggers completed! ${res.count} new replenishment requests initialized.`);
      fetchData();
    } catch (err: any) {
      alert(`Procurement run failed: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };
  
  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');

  const isInventoryStaff = user?.role === 'ADMIN' || user?.role === 'OWNER' || user?.role === 'INVENTORY';

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'status') {
        const stocksData = await api.get('/inventory/stocks');
        setStocks(stocksData);
      } else {
        const ledgerData = await api.get('/inventory/ledger');
        setLedger(ledgerData);
      }
      
      // Also get product list for dropdown if staff
      if (isInventoryStaff) {
        const productsData = await api.get('/products');
        setStocks(prev => {
          // If we already loaded stocks, keep them
          if (prev.length > 0) return prev;
          return productsData.map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            stockQty: p.stockQty,
            reservedQty: p.reservedQty
          }));
        });
      }
    } catch (err) {
      console.error('Error fetching inventory details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedProductId || !quantityChange) return;

      await api.post('/inventory/adjust', {
        productId: selectedProductId,
        quantityChange: Number(quantityChange),
        reason,
      });

      setShowAdjustModal(false);
      setSelectedProductId('');
      setQuantityChange('');
      setReason('');
      fetchData();
    } catch (err: any) {
      alert(`Adjustment execution failed: ${err.message}`);
    }
  };

  const filteredStocks = stocks.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.sku?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLedger = ledger.filter((l) =>
    l.product?.name.toLowerCase().includes(search.toLowerCase()) ||
    l.product?.sku.toLowerCase().includes(search.toLowerCase()) ||
    l.sourceDocument.toLowerCase().includes(search.toLowerCase()) ||
    l.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Monitor real-time warehouse stocks, reservations, and system-wide logistics transactions.
          </p>
        </div>
        <div className="flex gap-3">
          {isInventoryStaff && (
            <>
              <button
                onClick={handleTriggerProcurement}
                disabled={triggering}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-500/15"
              >
                {triggering ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Run Procurement Triggers</span>
              </button>
              <button
                onClick={() => setShowAdjustModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-sky-500/15"
              >
                <Plus className="w-4 h-4" />
                <span>Adjust Inventory Level</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-850/80 max-w-sm">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'status'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Stock Status</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Stock Ledger</span>
        </button>
      </div>

      {/* Operations Bar */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'status' ? "Search stock items by Name, SKU, Category..." : "Search transaction ledger logs..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 w-full items-center justify-center text-slate-400 font-mono text-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <span>Synchronizing logistics registry...</span>
          </div>
        </div>
      ) : activeTab === 'status' ? (
        /* Stock Status Tab Table */
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                  <th className="p-4 font-bold">Product</th>
                  <th className="p-4 font-bold">SKU</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold text-center">On Hand</th>
                  <th className="p-4 font-bold text-center">Reserved</th>
                  <th className="p-4 font-bold text-center">Free</th>
                  <th className="p-4 font-bold text-center">Incoming</th>
                  <th className="p-4 font-bold text-center">Outgoing</th>
                  <th className="p-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredStocks.map((s) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px]">
                      NORMAL
                    </span>
                  );
                  if (s.status === 'OUT_OF_STOCK') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-450 border border-rose-500/20 font-bold text-[9px]">
                        OUT OF STOCK
                      </span>
                    );
                  } else if (s.status === 'LOW_STOCK') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[9px]">
                        LOW STOCK
                      </span>
                    );
                  }

                  return (
                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-semibold text-slate-200">{s.name}</td>
                      <td className="p-4 font-mono font-bold text-sky-400">{s.sku}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-bold">
                          {s.category}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold font-mono text-slate-200">{s.stockQty}</td>
                      <td className="p-4 text-center font-semibold font-mono text-slate-500">{s.reservedQty}</td>
                      <td className={`p-4 text-center font-bold font-mono ${s.freeQty <= s.reorderLevel ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {s.freeQty}
                      </td>
                      <td className="p-4 text-center font-semibold font-mono text-sky-400">{s.incomingQty}</td>
                      <td className="p-4 text-center font-semibold font-mono text-indigo-400">{s.outgoingQty}</td>
                      <td className="p-4 text-center">{statusBadge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Ledger Tab Table */
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">SKU</th>
                  <th className="p-4 font-bold">Product</th>
                  <th className="p-4 font-bold">Shift Reason</th>
                  <th className="p-4 font-bold text-center">Qty Before</th>
                  <th className="p-4 font-bold text-center">Change Delta</th>
                  <th className="p-4 font-bold text-center">Qty After</th>
                  <th className="p-4 font-bold">Reference / Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLedger.map((l) => {
                  const isPositive = l.quantityChange > 0;
                  return (
                    <tr key={l.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-mono text-slate-500">
                        {new Date(l.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="p-4 font-mono font-bold text-sky-400">{l.product?.sku}</td>
                      <td className="p-4 font-semibold text-slate-200">{l.product?.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xxs font-bold uppercase tracking-wider font-mono">
                          {l.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-400 font-mono">{l.quantityBefore}</td>
                      <td className={`p-4 text-center font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-450'}`}>
                        {isPositive ? `+${l.quantityChange}` : l.quantityChange}
                      </td>
                      <td className="p-4 text-center text-slate-200 font-bold font-mono">{l.quantityAfter}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 text-xxs">{l.sourceDocument}</span>
                          <span className="text-xxs text-slate-500 font-mono mt-0.5">By: {l.performedBy}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl relative shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Truck className="w-5 h-5 text-sky-400" />
              <span>Manual Inventory Adjustment</span>
            </h3>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Select Product SKU</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-xs bg-slate-900 text-slate-200"
                >
                  <option value="">Select Item</option>
                  {stocks.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} (On Hand: {p.stockQty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Quantity Change (Delta)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. -5 for scrap, 10 for found items"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Adjustment Reason / Notes</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quality audit waste, found in warehouse"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Execute Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
