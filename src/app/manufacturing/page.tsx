'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  Hammer,
  Plus,
  Trash2,
  Save,
  Info,
  Loader2,
  Clock,
  User,
  Settings,
  ListTodo,
  ListFilter
} from 'lucide-react';

export default function ManufacturingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Master-Detail states
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [productId, setProductId] = useState('');
  const [bomId, setBomId] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Component availability evaluation
  const [bomAvailability, setBomAvailability] = useState<any>(null);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);

  useEffect(() => {
    if (selectedOrder && selectedOrder.status === 'DRAFT') {
      const getAvailability = async () => {
        try {
          setFetchingAvailability(true);
          const data = await api.get(`/bom/availability?productId=${selectedOrder.productId}&quantity=${selectedOrder.quantity}`);
          setBomAvailability(data);
        } catch (e) {
          console.error(e);
          setBomAvailability(null);
        } finally {
          setFetchingAvailability(false);
        }
      };
      getAvailability();
    } else {
      setBomAvailability(null);
    }
  }, [selectedOrder]);

  const handleConfirmOrder = async (id: string) => {
    try {
      await api.put(`/manufacturing/${id}/confirm`);
      alert('Manufacturing Order confirmed successfully!');
      fetchData();
      const updated = await api.get('/manufacturing');
      setOrders(updated || []);
      const found = updated.find((o: any) => o.id === id);
      if (found) setSelectedOrder(found);
    } catch (err: any) {
      alert(`Confirmation failed: ${err.message}`);
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this build order? This will release all component reservations.')) return;
    try {
      await api.put(`/manufacturing/${id}/cancel`);
      alert('Manufacturing Order cancelled.');
      fetchData();
      const updated = await api.get('/manufacturing');
      setOrders(updated || []);
      const found = updated.find((o: any) => o.id === id);
      if (found) setSelectedOrder(found);
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const handleStartWorkOrder = async (moId: string, woId: string) => {
    try {
      await api.put(`/manufacturing/${moId}/work-orders/${woId}/start`);
      const updated = await api.get('/manufacturing');
      setOrders(updated || []);
      const found = updated.find((o: any) => o.id === moId);
      if (found) setSelectedOrder(found);
    } catch (err: any) {
      alert(`Failed to start operation: ${err.message}`);
    }
  };

  const handleCompleteWorkOrder = async (moId: string, wo: any) => {
    const sortedWos = [...selectedOrder.workOrders].sort((a, b) => a.woNumber.localeCompare(b.woNumber));
    const isLast = sortedWos[sortedWos.length - 1].id === wo.id;

    let body = {};
    if (isLast) {
      const prodVal = prompt(`This is the final operation step. Enter actual produced quantity:`, selectedOrder.quantity);
      if (prodVal === null) return;
      const scrapVal = prompt(`Enter scrap quantity (if any):`, '0');
      if (scrapVal === null) return;
      body = {
        producedQty: Number(prodVal),
        scrapQty: Number(scrapVal),
      };
    }

    try {
      await api.put(`/manufacturing/${moId}/work-orders/${wo.id}/complete`, body);
      alert('Operation step completed!');
      fetchData();
      const updated = await api.get('/manufacturing');
      setOrders(updated || []);
      const found = updated.find((o: any) => o.id === moId);
      if (found) setSelectedOrder(found);
    } catch (err: any) {
      alert(`Failed to complete operation: ${err.message}`);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersData = await api.get('/manufacturing');
      setOrders(ordersData || []);

      const productsData = await api.get('/products');
      setProducts(productsData || []);

      const bomsData = await api.get('/bom');
      setBoms(bomsData || []);
    } catch (err) {
      console.error('Error fetching manufacturing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectOrder = (o: any) => {
    setSelectedOrder(o);
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    setSelectedOrder(null);
    setIsCreating(true);
    setProductId('');
    setBomId('');
    setQuantity('1');
  };

  const handleProductChange = (val: string) => {
    setProductId(val);
    // Auto-select preferred BoM if exists for this product
    const foundBom = boms.find(b => b.productId === val);
    if (foundBom) {
      setBomId(foundBom.id);
    } else {
      setBomId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !bomId || !quantity) {
      alert('Fill all fields before submitting.');
      return;
    }

    try {
      await api.post('/manufacturing', {
        productId,
        bomId,
        quantity: Number(quantity)
      });
      alert('Manufacturing Order registered successfully!');
      setIsCreating(false);
      setSelectedOrder(null);
      fetchData();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span>Synchronizing manufacturing scheduler database...</span>
        </div>
      </div>
    );
  }

  // Filter finished goods for manufacturing targets
  const finishedGoods = products.filter(p => p.category === 'FINISHED_GOOD');
  const filteredBoms = boms.filter(b => b.productId === productId);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Manufacturing Orders
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Queue build operations, route routing steps, and allocate workbench resources.</p>
        </div>
        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-sky-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>New Build Order</span>
        </button>
      </div>

      {/* Split Master-Detail Layout */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Side: Orders list */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                    <th className="p-4 font-bold">MO Number</th>
                    <th className="p-4 font-bold">Yield Product</th>
                    <th className="p-4 font-bold">BoM Config</th>
                    <th className="p-4 font-bold text-center">Batch Qty</th>
                    <th className="p-4 font-bold">Lead Operator</th>
                    <th className="p-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {orders.map((o) => {
                    const isSelected = selectedOrder?.id === o.id;
                    return (
                      <tr
                        key={o.id}
                        onClick={() => handleSelectOrder(o)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-500/10 text-sky-300 font-semibold' : 'hover:bg-slate-900/30'
                        }`}
                      >
                        <td className="p-4 font-mono font-bold text-sky-455">{o.moNumber}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200">{o.product?.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{o.product?.sku}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-400">{o.bom?.name}</td>
                        <td className="p-4 text-center font-mono text-slate-400">{o.quantity}</td>
                        <td className="p-4 font-mono text-slate-500">{o.operator}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider border ${
                            o.status === 'DONE'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : o.status === 'IN_PROGRESS'
                              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                              : o.status === 'CONFIRMED'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-450'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Order details or creation form */}
        <div className="w-full xl:w-[450px] shrink-0">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 sticky top-6">
            {isCreating ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-1.5 text-sky-400">
                  <Hammer className="w-4 h-4" />
                  <span>Configure Build Order</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Yield Product Target</label>
                  <select
                    required
                    value={productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-200"
                  >
                    <option value="">Select Finished Good</option>
                    {finishedGoods.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">BoM Template</label>
                    <select
                      required
                      value={bomId}
                      onChange={(e) => setBomId(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-200 disabled:opacity-50"
                      disabled={!productId}
                    >
                      <option value="">Select BoM</option>
                      {filteredBoms.map(b => <option key={b.id} value={b.id}>{b.name} (v{b.version})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Batch Quantity</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Save Build
                  </button>
                </div>
              </form>
            ) : selectedOrder ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Hammer className="w-4 h-4" />
                    <span>Build: {selectedOrder.moNumber}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedOrder.id.slice(0, 8)}</span>
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-455 uppercase tracking-wider">Yield Product</span>
                    <span className="text-slate-200">{selectedOrder.product?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-455 uppercase tracking-wider">Required Batch Qty</span>
                    <span className="text-slate-200">{selectedOrder.quantity} Units</span>
                  </div>
                  {selectedOrder.status === 'DONE' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-455 uppercase tracking-wider">Produced Qty</span>
                        <span className="text-emerald-450 font-bold">{selectedOrder.producedQty} Units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-455 uppercase tracking-wider">Scrap Qty</span>
                        <span className="text-rose-400 font-bold">{selectedOrder.scrapQty} Units</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-455 uppercase tracking-wider">Seeded BoM Cost</span>
                    <span className="text-emerald-400">${(selectedOrder.quantity * selectedOrder.bom?.estimatedCost).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-455 uppercase tracking-wider">Routing Operator</span>
                    <span className="text-slate-350">{selectedOrder.operator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-455 uppercase tracking-wider">Overall Status</span>
                    <span className={`font-bold uppercase ${
                      selectedOrder.status === 'DONE' ? 'text-emerald-400' :
                      selectedOrder.status === 'IN_PROGRESS' ? 'text-sky-400' :
                      selectedOrder.status === 'CONFIRMED' ? 'text-amber-400' :
                      selectedOrder.status === 'CANCELLED' ? 'text-rose-500' : 'text-slate-400'
                    }`}>{selectedOrder.status}</span>
                  </div>
                </div>

                {/* DRAFT ORDER COMPONENT STOCK SHORTAGE CHECKS */}
                {selectedOrder.status === 'DRAFT' && (
                  <div className="space-y-2.5 pt-3 border-t border-slate-800">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                      <ListFilter className="w-4 h-4 text-sky-400" />
                      <span>Component Stock Verification</span>
                    </span>

                    {fetchingAvailability ? (
                      <div className="flex items-center justify-center py-4 text-slate-500 font-mono text-xxs gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                        <span>Evaluating stock reserves...</span>
                      </div>
                    ) : bomAvailability ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {bomAvailability.components?.map((c: any) => (
                          <div key={c.productId} className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl flex justify-between items-center text-xxs font-mono">
                            <div>
                              <span className="font-bold text-slate-200 block text-left">{c.name}</span>
                              <span className="text-[10px] text-slate-500 block text-left">SKU: {c.sku} | Free Stock: {c.freeQty}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-450 block font-bold">Needed: {c.requiredQty}</span>
                              {c.shortage > 0 ? (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400">
                                  Shortage: {c.shortage}
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400">
                                  Available
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xxs text-rose-450 font-mono">Failed to fetch components availability status.</p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleConfirmOrder(selectedOrder.id)}
                        disabled={fetchingAvailability || (bomAvailability && bomAvailability.components?.some((c: any) => c.shortage > 0))}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center border border-emerald-500/20"
                      >
                        Confirm Build
                      </button>
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="py-2 px-4 bg-slate-850 hover:bg-slate-800 text-rose-400 border border-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Routing Steps */}
                {selectedOrder.status !== 'DRAFT' && (
                  <div className="space-y-2.5 pt-3 border-t border-slate-800">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                      <ListTodo className="w-4 h-4 text-sky-400" />
                      <span>Routing Operations Steps</span>
                    </span>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedOrder.workOrders?.length === 0 ? (
                        <p className="text-xxs text-slate-500 text-center py-2 font-mono">No operations steps routed for this order.</p>
                      ) : (
                        (() => {
                          const sortedWos = [...selectedOrder.workOrders].sort((a, b) => a.woNumber.localeCompare(b.woNumber));
                          const anyInProgress = sortedWos.some((w: any) => w.status === 'IN_PROGRESS');

                          return sortedWos.map((wo: any, idx: number) => {
                            const canStart = wo.status === 'PENDING' && !anyInProgress && (idx === 0 || sortedWos[idx - 1].status === 'COMPLETED');
                            const canComplete = wo.status === 'IN_PROGRESS';

                            return (
                              <div key={wo.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex justify-between items-center text-xxs font-mono">
                                <div className="space-y-1 text-left">
                                  <span className="font-bold text-slate-200 block">{wo.operationName}</span>
                                  <span className="text-[10px] text-slate-500 block">{wo.workCenter?.name} ({wo.workCenter?.location})</span>
                                  {wo.startedAt && (
                                    <span className="text-[9px] text-slate-500 block">
                                      Started: {new Date(wo.startedAt).toLocaleTimeString()}
                                    </span>
                                  )}
                                  {wo.completedAt && (
                                    <span className="text-[9px] text-emerald-400/80 block">
                                      Completed: {new Date(wo.completedAt).toLocaleTimeString()}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right space-y-1.5 shrink-0 ml-3">
                                  <span className="text-[10px] text-slate-450 block font-bold">{wo.durationMinutes} Mins</span>
                                  
                                  {canStart && (
                                    <button
                                      onClick={() => handleStartWorkOrder(selectedOrder.id, wo.id)}
                                      className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                      Start
                                    </button>
                                  )}
                                  {canComplete && (
                                    <button
                                      onClick={() => handleCompleteWorkOrder(selectedOrder.id, wo)}
                                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  {!canStart && !canComplete && (
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      wo.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                                      wo.status === 'IN_PROGRESS' ? 'bg-sky-500/10 text-sky-400' :
                                      wo.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-500'
                                    }`}>
                                      {wo.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>
                  </div>
                )}

                {/* Cancel confirmed MO option */}
                {selectedOrder.status === 'CONFIRMED' && (
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/25 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel Manufacturing Order
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-3 font-mono">
                <Info className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-[10px]">Select a Manufacturing Order from list on the left to trace routing steps or completed work benches.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
