'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import { useStore } from '../../lib/store';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Save,
  Info,
  Loader2,
  Clock,
  User,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function SalesPage() {
  const { user } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Master-Detail selection state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State for creating SO
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([]);

  // Form State for Dispatch deliveries
  const [dispatchQty, setDispatchQty] = useState<Record<string, string>>({});
  const [tempCourier, setTempCourier] = useState('');
  const [tempTrackingNum, setTempTrackingNum] = useState('');

  const isSalesStaff = user?.role === 'ADMIN' || user?.role === 'OWNER' || user?.role === 'SALES';

  const fetchData = async () => {
    try {
      setLoading(true);
      const ordersData = await api.get('/sales');
      setOrders(ordersData || []);

      const customersData = await api.get('/customers');
      setCustomers(customersData || []);

      const productsData = await api.get('/products');
      setProducts(productsData || []);

      // If we have a selected order, sync it to reflect updates
      if (selectedOrder) {
        const updatedSelected = ordersData.find((o: any) => o.id === selectedOrder.id);
        if (updatedSelected) {
          setSelectedOrder(updatedSelected);
          setTempCourier(updatedSelected.courierName || '');
          setTempTrackingNum(updatedSelected.trackingNumber || '');
        }
      }
    } catch (err) {
      console.error('Error fetching sales database:', err);
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
    setTempCourier(o.courierName || '');
    setTempTrackingNum(o.trackingNumber || '');
    
    // Clear dynamic dispatch form inputs
    const initialDispatch: Record<string, string> = {};
    o.items?.forEach((item: any) => {
      initialDispatch[item.id] = String(item.reservedQty); // Default to full reserved quantity
    });
    setDispatchQty(initialDispatch);
  };

  const handleUpdateTracking = async (status: string) => {
    if (!selectedOrder) return;
    try {
      setLoading(true);
      await api.put(`/sales/${selectedOrder.id}/tracking`, {
        courierName: tempCourier.trim(),
        trackingNumber: tempTrackingNum.trim(),
        trackingStatus: status,
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update tracking details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCreate = () => {
    setSelectedOrder(null);
    setIsCreating(true);
    setCustomerId('');
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
          const product = products.find(p => p.id === value);
          if (product) {
            updated.unitPrice = product.sellingPrice;
          }
        }
        return updated;
      }
      return row;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Select customer target before saving.');
      return;
    }
    const filteredItems = items.filter(item => item.productId && item.quantity > 0);
    if (filteredItems.length === 0) {
      alert('Select at least one product SKU to save order.');
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/sales', { customerId, items: filteredItems });
      alert('Sales Order registered successfully!');
      setIsCreating(false);
      setSelectedOrder(null);
      fetchData();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const updated = await api.put(`/sales/${selectedOrder.id}/confirm`, {});
      alert(`Sales Order ${updated.orderNumber} confirmed successfully! MTS allocations reserved and MTO procurement triggered.`);
      fetchData();
    } catch (err: any) {
      alert(`Confirmation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    if (!confirm('Are you sure you want to cancel this Sales Order? Reservations will be released.')) return;
    
    try {
      setActionLoading(true);
      await api.put(`/sales/${selectedOrder.id}/cancel`, {});
      alert(`Sales Order has been cancelled.`);
      fetchData();
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const deliveries = Object.keys(dispatchQty)
      .map((itemId) => ({
        itemId,
        quantityToDeliver: Number(dispatchQty[itemId] || 0),
      }))
      .filter((d) => d.quantityToDeliver > 0);

    if (deliveries.length === 0) {
      alert('Please specify a positive delivery count for at least one item.');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.put(`/sales/${selectedOrder.id}/deliver`, { deliveries });
      alert(`Delivery processed successfully! Overall order status is now: ${response.status}`);
      fetchData();
    } catch (err: any) {
      alert(`Delivery dispatch failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchQtyChange = (itemId: string, val: string) => {
    setDispatchQty(prev => ({
      ...prev,
      [itemId]: val
    }));
  };

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
    o.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Sales & Orders
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Create customer orders, allocate stocks, and track delivery status.</p>
        </div>
        {isSalesStaff && (
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-sky-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Order</span>
          </button>
        )}
      </div>

      {/* Split Master-Detail Layout */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Side: Orders list */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex gap-4 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search orders by PO, customer or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full glass-input px-4 py-3 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                    <th className="p-4 font-bold">Order Number</th>
                    <th className="p-4 font-bold">Customer</th>
                    <th className="p-4 font-bold">Date Registered</th>
                    <th className="p-4 font-bold text-center">Items Count</th>
                    <th className="p-4 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredOrders.map((o) => {
                    const isSelected = selectedOrder?.id === o.id;
                    return (
                      <tr
                        key={o.id}
                        onClick={() => handleSelectOrder(o)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-500/10 text-sky-300 font-semibold border-l-4 border-sky-400' : 'hover:bg-slate-900/30'
                        }`}
                      >
                        <td className="p-4 font-mono font-bold">{o.orderNumber}</td>
                        <td className="p-4 font-semibold text-slate-200">{o.customer?.name}</td>
                        <td className="p-4 text-slate-500 font-mono">
                          {new Date(o.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4 text-center font-mono text-slate-400">{o.items?.length || 0}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider border ${
                            o.status === 'FULLY_DELIVERED'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : o.status === 'PARTIALLY_DELIVERED'
                              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                              : o.status === 'CONFIRMED'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-450'
                              : o.status === 'CANCELLED'
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-450'
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
        <div className="w-full xl:w-[480px] shrink-0">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 sticky top-6">
            {actionLoading ? (
              <div className="flex h-64 items-center justify-center text-slate-400 font-mono text-xs">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                  <span>Processing transaction workflow...</span>
                </div>
              </div>
            ) : isCreating ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-1.5 text-sky-400">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Configure Sales Order</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Target Customer</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-200"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Items dynamic grid */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Ordered Items</span>
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
                      <div key={idx} className="flex gap-2 items-center animate-fade-in">
                        <select
                          required
                          value={row.productId}
                          onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                          className="flex-1 glass-input px-2 py-1.5 rounded-lg text-xxs bg-slate-900 text-slate-200"
                        >
                          <option value="">Select SKU</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} — {p.name} (${p.sellingPrice.toFixed(2)})
                            </option>
                          ))}
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
                          className="w-16 glass-input px-2 py-1.5 rounded-lg text-xxs font-mono text-center font-bold text-sky-400"
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1.5 text-rose-455 hover:bg-rose-500/10 rounded-lg cursor-pointer"
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
              <div className="space-y-5">
                {/* Order Summary details */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 text-sky-400">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Order: {selectedOrder.orderNumber}</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    selectedOrder.status === 'FULLY_DELIVERED'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : selectedOrder.status === 'PARTIALLY_DELIVERED'
                      ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                      : selectedOrder.status === 'CONFIRMED'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-450'
                      : selectedOrder.status === 'CANCELLED'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="space-y-2 text-xxs font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">Customer Name:</span>
                    <span className="text-slate-200">{selectedOrder.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">Customer Email:</span>
                    <span className="text-slate-350">{selectedOrder.customer?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">Created At:</span>
                    <span className="text-slate-350">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Items and allocation checklist */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono block">
                    Line Items & Procurement Status
                  </span>
                  
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any) => {
                      // Lookup MTO procurement status if exists
                      const procRequest = selectedOrder.procurementRequests?.find(
                        (r: any) => r.productId === item.productId
                      );

                      return (
                        <div key={item.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 text-xxs font-mono">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>{item.product?.name} ({item.product?.sku})</span>
                            <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 text-slate-450 text-[10px]">
                            <div>
                              <span className="text-slate-500 block">Ordered</span>
                              <span>{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Price</span>
                              <span>${item.unitPrice.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-amber-500">Reserved</span>
                              <span>{item.reservedQty}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-emerald-400">Delivered</span>
                              <span>{item.deliveredQty}</span>
                            </div>
                          </div>

                          {/* Procurement Status block (MTO item specific) */}
                          {item.product?.procurementStrategy === 'MTO' && (
                            <div className="pt-1.5 border-t border-slate-850 flex justify-between items-center text-[10px]">
                              <span className="text-indigo-400 font-semibold">Strict MTO Workflow:</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                procRequest?.status === 'TRIGGERED' || procRequest?.status === 'IN_PROGRESS'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : procRequest?.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : procRequest?.status === 'CANCELLED'
                                  ? 'bg-rose-500/10 text-rose-450'
                                  : 'bg-amber-500/10 text-amber-450'
                              }`}>
                                {procRequest?.status || 'PENDING'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm/Cancel Actions for DRAFT */}
                {selectedOrder.status === 'DRAFT' && isSalesStaff && (
                  <div className="flex gap-2 pt-4 border-t border-slate-800 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel Order
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmOrder}
                      className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-sky-500/15"
                    >
                      Confirm Order
                    </button>
                  </div>
                )}

                {/* Dispatch Delivery Form for CONFIRMED / PARTIALLY_DELIVERED */}
                {(selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'PARTIALLY_DELIVERED') && (
                  <form onSubmit={handleDispatchDelivery} className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">
                        Dispatch Delivery Console
                      </span>
                      {selectedOrder.items?.every((item: any) => item.deliveredQty === 0) && isSalesStaff && (
                        <button
                          type="button"
                          onClick={handleCancelOrder}
                          className="text-[10px] text-rose-400 hover:underline font-bold font-mono"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {selectedOrder.items?.map((item: any) => {
                        const remaining = item.quantity - item.deliveredQty;
                        if (remaining <= 0) return null;

                        return (
                          <div key={item.id} className="flex items-center gap-2 text-xxs font-mono">
                            <span className="flex-1 text-slate-200 truncate">
                              {item.product?.sku} (Max: {Math.min(remaining, item.reservedQty)})
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={Math.min(remaining, item.reservedQty)}
                              required
                              value={dispatchQty[item.id] || '0'}
                              onChange={(e) => handleDispatchQtyChange(item.id, e.target.value)}
                              className="w-16 glass-input px-2 py-1 rounded text-center"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/15 hover:from-emerald-600 hover:to-teal-600 transition-all cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Dispatch Delivery</span>
                    </button>
                  </form>
                )}

                {/* Shipment Tracking & Delivery Info update console */}
                {selectedOrder.status !== 'DRAFT' && selectedOrder.status !== 'CANCELLED' && (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono block">
                      Shipment Tracking & Delivery Info
                    </span>
                    
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xxs font-mono">
                        <div>
                          <span className="text-slate-500 block uppercase">Courier:</span>
                          <span className="text-slate-200">{selectedOrder.courierName || 'Not Assigned'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase">Tracking Number:</span>
                          <span className="text-slate-200">{selectedOrder.trackingNumber || 'Not Assigned'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase">Status:</span>
                          <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold font-mono rounded bg-slate-900 border border-slate-800 text-sky-400 uppercase">
                            {selectedOrder.trackingStatus || 'PENDING'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase">Estimated Delivery:</span>
                          <span className="text-slate-200">{selectedOrder.estimatedDelivery || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-900">
                        <div className="grid grid-cols-2 gap-2 text-xxs font-mono">
                          <label className="space-y-1 block">
                            <span className="text-slate-500 font-bold block">Courier Name</span>
                            <input
                              type="text"
                              value={tempCourier}
                              onChange={(e) => setTempCourier(e.target.value)}
                              placeholder="e.g. BlueDart"
                              className="w-full glass-input px-2 py-1 rounded text-slate-200"
                            />
                          </label>
                          <label className="space-y-1 block">
                            <span className="text-slate-500 font-bold block">Tracking Number</span>
                            <input
                              type="text"
                              value={tempTrackingNum}
                              onChange={(e) => setTempTrackingNum(e.target.value)}
                              placeholder="e.g. AWD12345"
                              className="w-full glass-input px-2 py-1 rounded text-slate-200"
                            />
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateTracking('SHIPPED')}
                            className="flex-1 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/15 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Mark Dispatched
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateTracking('DELIVERED')}
                            className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Mark Delivered
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateTracking('IN_TRANSIT')}
                            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Save Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-3 font-mono">
                <Info className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-[10px]">Select a Sales Order from lists grid on the left to review metrics or trigger stock allocation checks.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
