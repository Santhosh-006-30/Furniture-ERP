'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  TrendingUp,
  Plus,
  Trash2,
  Save,
  Info,
  Loader2,
  Clock,
  User,
  Truck
} from 'lucide-react';

export default function PurchasePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Master-Detail selection state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, number>>({});

  // Form State
  const [vendorId, setVendorId] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersData = await api.get('/purchase');
      setOrders(ordersData || []);

      const vendorsData = await api.get('/vendors');
      setVendors(vendorsData || []);

      const productsData = await api.get('/products');
      setProducts(productsData || []);

      // If there is an active selected order, sync its details
      if (selectedOrder) {
        const fresh = ordersData.find((o: any) => o.id === selectedOrder.id);
        if (fresh) {
          setSelectedOrder(fresh);
          const initialReceipts: Record<string, number> = {};
          fresh.items?.forEach((item: any) => {
            initialReceipts[item.id] = Math.max(0, item.quantity - item.receivedQty);
          });
          setReceiptQuantities(initialReceipts);
        }
      }
    } catch (err) {
      console.error('Error fetching purchase cockpit database:', err);
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
    const initialReceipts: Record<string, number> = {};
    o.items?.forEach((item: any) => {
      initialReceipts[item.id] = Math.max(0, item.quantity - item.receivedQty);
    });
    setReceiptQuantities(initialReceipts);
  };

  const handleConfirmPO = async (id: string) => {
    try {
      await api.put(`/purchase/${id}/confirm`, {});
      alert('Purchase Order confirmed successfully!');
      await fetchData();
    } catch (err: any) {
      alert(`Confirmation failed: ${err.message}`);
    }
  };

  const handleCancelPO = async (id: string) => {
    try {
      await api.put(`/purchase/${id}/cancel`, {});
      alert('Purchase Order cancelled successfully!');
      await fetchData();
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const receipts = Object.entries(receiptQuantities)
      .map(([itemId, qty]) => ({ itemId, quantityToReceive: qty }))
      .filter(r => r.quantityToReceive > 0);

    if (receipts.length === 0) {
      alert('Enter at least one item quantity greater than 0 to receive.');
      return;
    }

    try {
      await api.put(`/purchase/${selectedOrder.id}/receive`, { receipts });
      alert('Goods received and stock counts updated successfully!');
      await fetchData();
    } catch (err: any) {
      alert(`Receipt processing failed: ${err.message}`);
    }
  };

  const handleStartCreate = () => {
    setSelectedOrder(null);
    setIsCreating(true);
    setVendorId('');
    setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    setItems(prev => prev.map((row, i) => {
      if (i === idx) {
        const updated = { ...row, [field]: value };
        if (field === 'productId') {
          // Pre-populate unitPrice from product details costPrice
          const product = products.find(p => p.id === value);
          if (product) {
            updated.unitPrice = product.costPrice;
          }
        }
        return updated;
      }
      return row;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      alert('Select vendor supplier target before saving.');
      return;
    }
    const filteredItems = items.filter(item => item.productId && item.quantity > 0);
    if (filteredItems.length === 0) {
      alert('Select at least one product SKU to save order.');
      return;
    }

    try {
      await api.post('/purchase', { vendorId, items: filteredItems });
      alert('Purchase Order registered successfully!');
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
          <span>Synchronizing purchase database cockpit...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Purchase Orders
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Generate supplier replenishment POs and verify inventory receipt counts.</p>
        </div>
        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-sky-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
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
                    <th className="p-4 font-bold">PO No</th>
                    <th className="p-4 font-bold">Vendor</th>
                    <th className="p-4 font-bold text-center">Status</th>
                    <th className="p-4 font-bold text-right font-mono">Total</th>
                    <th className="p-4 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {orders.map((o) => {
                    const isSelected = selectedOrder?.id === o.id;
                    const total = o.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0) || 0;
                    return (
                      <tr
                        key={o.id}
                        onClick={() => handleSelectOrder(o)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-500/10 text-sky-300 font-semibold' : 'hover:bg-slate-900/30'
                        }`}
                      >
                        <td className="p-4 font-mono font-bold text-sky-450">{o.orderNumber}</td>
                        <td className="p-4 font-semibold text-slate-200">{o.vendor?.name}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider border ${
                            o.status === 'FULLY_RECEIVED'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : o.status === 'PARTIALLY_RECEIVED'
                              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                              : o.status === 'CONFIRMED'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-450'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-400">${total.toFixed(2)}</td>
                        <td className="p-4 text-slate-500 font-mono">
                          {new Date(o.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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
        <div className="w-full xl:w-[480px] shrink-0">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 sticky top-6">
            {isCreating ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-1.5 text-sky-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Configure Purchase Order</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Supplier Vendor</label>
                  <select
                    required
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-200"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                {/* Items dynamic grid */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Procured Items</span>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xxs text-sky-400 hover:text-sky-350 font-bold flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {items.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          required
                          value={row.productId}
                          onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                          className="flex-1 glass-input px-2 py-1.5 rounded-lg text-xxs bg-slate-900 text-slate-200"
                        >
                          <option value="">Select SKU</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                        </select>
                        <input
                          type="number"
                          step="1"
                          required
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => updateItemRow(idx, 'quantity', Number(e.target.value))}
                          className="w-14 glass-input px-2 py-1.5 rounded-lg text-xxs font-mono text-center"
                        />
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Price"
                          value={row.unitPrice}
                          onChange={(e) => updateItemRow(idx, 'unitPrice', Number(e.target.value))}
                          className="w-16 glass-input px-2 py-1.5 rounded-lg text-xxs font-mono text-center"
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1.5 text-rose-450 hover:bg-rose-500/10 rounded-lg cursor-pointer animate-fade-in"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
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
                    Save Draft
                  </button>
                </div>
              </form>
            ) : selectedOrder ? (
              <div className="space-y-4 font-sans">
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>PO: {selectedOrder.orderNumber}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {selectedOrder.id.slice(0, 8)}</span>
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-450 font-semibold uppercase tracking-wider">Vendor Supplier</span>
                    <span className="text-slate-200">{selectedOrder.vendor?.name}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-450 font-semibold uppercase tracking-wider">Vendor Lead Time</span>
                    <span className="text-slate-350">{selectedOrder.vendor?.leadTimeDays} Days</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-450 font-semibold uppercase tracking-wider">Register Date</span>
                    <span className="text-slate-350">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-450 font-semibold uppercase tracking-wider">Verification Status</span>
                    <span className="text-sky-400 font-bold uppercase">{selectedOrder.status}</span>
                  </div>
                  {selectedOrder.procurementRequest && (
                    <div className="p-2.5 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1 font-mono text-[10px] text-slate-450">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Procurement Link</span>
                      <div className="flex justify-between">
                        <span>Strategy:</span>
                        <span className="text-slate-300 font-bold">{selectedOrder.procurementRequest.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Source Doc:</span>
                        <span className="text-slate-300 font-bold">{selectedOrder.procurementRequest.sourceDocument}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Req Status:</span>
                        <span className="text-sky-400 font-bold">{selectedOrder.procurementRequest.status}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono block">Order Items List</span>
                  
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5 text-xxs font-mono">
                        <div className="flex justify-between font-bold text-slate-200">
                          <span>{item.product?.name} ({item.product?.sku})</span>
                          <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-slate-450 text-[10px]">
                          <div>
                            <span className="text-slate-500 block">Ordered</span>
                            <span>{item.quantity}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Cost Price</span>
                            <span>${item.unitPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-emerald-400">Received</span>
                            <span>{item.receivedQty}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm / Cancel Actions for DRAFT */}
                {selectedOrder.status === 'DRAFT' && (
                  <div className="flex gap-2 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCancelPO(selectedOrder.id)}
                      className="flex-1 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                    >
                      Cancel Order
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmPO(selectedOrder.id)}
                      className="flex-1 px-3 py-2 bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/5"
                    >
                      Confirm PO
                    </button>
                  </div>
                )}

                {/* Goods Receipt checklist form for CONFIRMED or PARTIALLY_RECEIVED */}
                {(selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'PARTIALLY_RECEIVED') && (
                  <form onSubmit={handleReceiveGoods} className="space-y-3.5 pt-4 border-t border-slate-800">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono block">Receive Incoming Goods</span>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {selectedOrder.items?.map((item: any) => {
                        const remaining = item.quantity - item.receivedQty;
                        if (remaining <= 0) return null;
                        return (
                          <div key={item.id} className="flex justify-between items-center gap-4 bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                            <div className="flex-1 font-mono text-[10px]">
                              <span className="text-slate-200 font-bold block">{item.product?.sku}</span>
                              <span className="text-slate-500">Remaining: {remaining}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max={remaining}
                                step="1"
                                value={receiptQuantities[item.id] ?? 0}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(remaining, Number(e.target.value)));
                                  setReceiptQuantities(prev => ({
                                    ...prev,
                                    [item.id]: val
                                  }));
                                }}
                                className="w-16 glass-input px-2 py-1 rounded text-center text-xs font-mono"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      {/* Cancel PO is only allowed in CONFIRMED when nothing has been received yet */}
                      {selectedOrder.status === 'CONFIRMED' &&
                        selectedOrder.items?.every((item: any) => item.receivedQty === 0) && (
                          <button
                            type="button"
                            onClick={() => handleCancelPO(selectedOrder.id)}
                            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                          >
                            Cancel PO
                          </button>
                        )}
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-sky-500/15"
                      >
                        Receive Goods
                      </button>
                    </div>
                  </form>
                )}

                {selectedOrder.status === 'FULLY_RECEIVED' && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-center">
                    <span className="text-xs font-mono text-emerald-400 font-bold block">FULLY COMPLETED</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">All goods have been successfully verified and received.</span>
                  </div>
                )}

                {selectedOrder.status === 'CANCELLED' && (
                  <div className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-center">
                    <span className="text-xs font-mono text-rose-400 font-bold block">CANCELLED ORDER</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">This replenishment order has been cancelled.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-3 font-mono">
                <Info className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-[10px]">Select a Purchase Order from lists grid on the left to review metrics or toggle goods receipts confirmation panels.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
