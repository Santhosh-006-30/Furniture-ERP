'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Save,
  Info,
  Loader2,
  Clock,
  ArrowRight,
  Hammer
} from 'lucide-react';

export default function BomPage() {
  const [boms, setBoms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Master-Detail States
  const [selectedBom, setSelectedBom] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [version, setVersion] = useState('1');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [yieldQty, setYieldQty] = useState('1.0');
  const [simulatedQty, setSimulatedQty] = useState(1);
  
  // Dynamic arrays
  const [components, setComponents] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [operations, setOperations] = useState<Array<{ workCenterId: string; operationName: string; durationMinutes: number; sequence: number }>>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bomsData = await api.get('/bom');
      setBoms(bomsData || []);

      const productsData = await api.get('/products');
      setProducts(productsData || []);

      const wcData = await api.get('/workcenters');
      setWorkCenters(wcData || []);
    } catch (err) {
      console.error('Error fetching BoM parameters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectBom = (bom: any) => {
    setSelectedBom(bom);
    setIsCreating(false);
    
    setName(bom.name);
    setProductId(bom.productId);
    setVersion(String(bom.version));
    setYieldQty(String(bom.yieldQty || '1.0'));
    setEstimatedCost(String(bom.estimatedCost));
    setComponents(bom.components.map((c: any) => ({ productId: c.productId, quantity: c.quantity })));
    setOperations(bom.routingSteps.map((o: any) => ({
      workCenterId: o.workCenterId,
      operationName: o.operationName,
      durationMinutes: o.durationMinutes,
      sequence: o.sequence
    })));
    setSimulatedQty(1);
  };

  const handleStartCreate = () => {
    setSelectedBom(null);
    setIsCreating(true);

    setName('');
    setProductId('');
    setVersion('1');
    setYieldQty('1.0');
    setEstimatedCost('0');
    setComponents([{ productId: '', quantity: 1 }]);
    setOperations([{ workCenterId: '', operationName: '', durationMinutes: 10, sequence: 1 }]);
  };

  // Components row controls
  const addComponentRow = () => {
    setComponents(prev => [...prev, { productId: '', quantity: 1 }]);
  };
  const removeComponentRow = (idx: number) => {
    setComponents(prev => prev.filter((_, i) => i !== idx));
  };
  const updateComponentRow = (idx: number, field: string, value: any) => {
    setComponents(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  // Operations row controls
  const addOperationRow = () => {
    setOperations(prev => [...prev, { workCenterId: '', operationName: '', durationMinutes: 10, sequence: prev.length + 1 }]);
  };
  const removeOperationRow = (idx: number) => {
    setOperations(prev => prev.filter((_, i) => i !== idx));
  };
  const updateOperationRow = (idx: number, field: string, value: any) => {
    setOperations(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!productId) {
      alert('Yield yield product is required.');
      return;
    }
    const filteredComps = components.filter(c => c.productId && c.quantity > 0);
    if (filteredComps.length === 0) {
      alert('At least one component product must be selected.');
      return;
    }

    try {
      const payload = {
        name,
        productId,
        yieldQty: Number(yieldQty),
        components: filteredComps,
        operations: operations.filter(o => o.workCenterId && o.operationName)
      };

      await api.post('/bom', payload);
      alert('Bill of Materials seeded successfully!');
      
      setIsCreating(false);
      setSelectedBom(null);
      fetchData();
    } catch (err: any) {
      alert(`Save failed: ${err.message || err}`);
    }
  };

  // Real-time Preview calculations
  const calculatePreview = () => {
    let cost = 0;
    let duration = 0;

    components.forEach((c) => {
      if (c.productId && c.quantity > 0) {
        const prod = products.find((p) => p.id === c.productId);
        if (prod) {
          cost += prod.costPrice * c.quantity;
        }
      }
    });

    operations.forEach((o) => {
      if (o.workCenterId && o.durationMinutes > 0) {
        const wc = workCenters.find((w) => w.id === o.workCenterId);
        if (wc) {
          cost += (o.durationMinutes * wc.hourlyCost) / 60.0 + wc.setupCost;
          duration += o.durationMinutes;
        }
      }
    });

    return { cost, duration };
  };

  const preview = calculatePreview();

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span>Synchronizing bill of materials registry...</span>
        </div>
      </div>
    );
  }

  // Filter finished goods for yield product option
  const finishedGoods = products.filter(p => p.category === 'FINISHED_GOOD');

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Bill of Materials (BoM)
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Design finished goods component layouts and WorkCenter routing steps.</p>
        </div>
        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-sky-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>Create BoM</span>
        </button>
      </div>

      {/* Master-Detail Split Pane */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Side: BoM List */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                    <th className="p-4 font-bold">BoM Name</th>
                    <th className="p-4 font-bold">Yield Product</th>
                    <th className="p-4 font-bold text-center">Version</th>
                    <th className="p-4 font-bold text-center">Status</th>
                    <th className="p-4 font-bold text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {boms.map((b) => {
                    const isSelected = selectedBom?.id === b.id;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => handleSelectBom(b)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-500/10 text-sky-300' : 'hover:bg-slate-900/30'
                        }`}
                      >
                        <td className="p-4 font-semibold text-slate-250">{b.name}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200">{b.product?.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{b.product?.sku}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-400">v{b.version}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider border ${
                            b.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 border-slate-700 text-slate-450'
                          }`}>
                            {b.isActive ? 'ACTIVE' : 'ARCHIVED'}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-400">${b.estimatedCost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: details or creator form */}
        <div className="w-full xl:w-[480px] shrink-0">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 sticky top-6">
            {isCreating ? (
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-1.5 text-sky-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Configure BoM Layout</span>
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">BoM Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Wooden Chair build"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Yield Product</label>
                    <select
                      required
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-200"
                    >
                      <option value="">Select Finished Item</option>
                      {finishedGoods.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Yield Qty (Output)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={yieldQty}
                      onChange={(e) => setYieldQty(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Real-time preview card */}
                <div className="p-3 bg-slate-900/50 border border-sky-500/25 rounded-xl space-y-1 font-mono text-xxs text-sky-400 flex justify-between items-center">
                  <span>🛠️ Live cost estimation:</span>
                  <div className="space-x-3">
                    <span>Est. Cost: <strong className="text-emerald-400 font-bold">${preview.cost.toFixed(2)}</strong></span>
                    <span>Duration: <strong className="text-slate-200 font-bold">{preview.duration} mins</strong></span>
                  </div>
                </div>

                {/* Components section */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">BoM Components</span>
                    <button
                      type="button"
                      onClick={addComponentRow}
                      className="text-xxs text-sky-400 hover:text-sky-350 font-bold flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {components.map((comp, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          required
                          value={comp.productId}
                          onChange={(e) => updateComponentRow(idx, 'productId', e.target.value)}
                          className="flex-1 glass-input px-2 py-1.5 rounded-lg text-xxs bg-slate-900 text-slate-200"
                        >
                          <option value="">Select component</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
                        </select>
                        <input
                          type="number"
                          step="1"
                          required
                          placeholder="Qty"
                          value={comp.quantity}
                          onChange={(e) => updateComponentRow(idx, 'quantity', Number(e.target.value))}
                          className="w-16 glass-input px-2 py-1.5 rounded-lg text-xxs font-mono text-center"
                        />
                        {components.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeComponentRow(idx)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operations Section */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Routing Steps (Operations)</span>
                    <button
                      type="button"
                      onClick={addOperationRow}
                      className="text-xxs text-sky-400 hover:text-sky-350 font-bold flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Op</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {operations.map((op, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          required
                          value={op.workCenterId}
                          onChange={(e) => updateOperationRow(idx, 'workCenterId', e.target.value)}
                          className="w-1/3 glass-input px-2 py-1.5 rounded-lg text-xxs bg-slate-900 text-slate-200"
                        >
                          <option value="">Station</option>
                          {workCenters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <input
                          type="text"
                          required
                          placeholder="Op Name"
                          value={op.operationName}
                          onChange={(e) => updateOperationRow(idx, 'operationName', e.target.value)}
                          className="flex-1 glass-input px-2 py-1.5 rounded-lg text-xxs"
                        />
                        <input
                          type="number"
                          required
                          placeholder="Mins"
                          value={op.durationMinutes}
                          onChange={(e) => updateOperationRow(idx, 'durationMinutes', Number(e.target.value))}
                          className="w-14 glass-input px-2 py-1.5 rounded-lg text-xxs font-mono text-center"
                        />
                        {operations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOperationRow(idx)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
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
                    onClick={() => { setSelectedBom(null); setIsCreating(false); }}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-450 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Save BoM
                  </button>
                </div>
              </form>
            ) : selectedBom ? (
              <div className="space-y-4 font-sans max-h-[85vh] overflow-y-auto pr-1">
                {/* BoM Header */}
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>BoM: {selectedBom.name}</span>
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-slate-500">v{selectedBom.version}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider border ${
                      selectedBom.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-450'
                    }`}>
                      {selectedBom.isActive ? 'ACTIVE' : 'ARCHIVED'}
                    </span>
                  </div>
                </h3>

                {/* Target Finished Product */}
                <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono block">Yield Product Specs</span>
                  <div className="flex justify-between items-center text-xs">
                    <div className="font-semibold text-slate-200">{selectedBom.product?.name}</div>
                    <div className="font-mono text-slate-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">{selectedBom.product?.sku}</div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-450 pt-1 border-t border-slate-850">
                    <span>Base Yield Qty:</span>
                    <span className="font-bold text-slate-300">{selectedBom.yieldQty} Units</span>
                  </div>
                </div>

                {/* Cost & Duration Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Estimated Cost</span>
                    <span className="text-lg font-mono font-extrabold text-emerald-400 mt-1 block">
                      ${selectedBom.estimatedCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Total Routing Time</span>
                    <span className="text-lg font-mono font-extrabold text-sky-400 mt-1 block">
                      {selectedBom.routingSteps?.reduce((sum: number, o: any) => sum + o.durationMinutes, 0) || 0} mins
                    </span>
                  </div>
                </div>

                {/* Components Table Summary */}
                <div className="space-y-2 pt-2 border-t border-slate-850">
                  <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono block">BoM Component Layout</span>
                  <div className="border border-slate-850 rounded-xl overflow-hidden text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/40 text-slate-500 uppercase font-mono font-bold border-b border-slate-850">
                          <th className="p-2">Component</th>
                          <th className="p-2 text-center">Qty Required</th>
                          <th className="p-2 text-right">Unit Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {selectedBom.components?.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-900/20">
                            <td className="p-2 font-mono">
                              <span className="text-slate-200 block font-semibold">{c.product?.name}</span>
                              <span className="text-slate-500 text-[8px]">{c.product?.sku}</span>
                            </td>
                            <td className="p-2 text-center font-mono text-slate-350">{c.quantity}</td>
                            <td className="p-2 text-right font-mono text-slate-450">${c.product?.costPrice?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operations Table Summary */}
                {selectedBom.routingSteps && selectedBom.routingSteps.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono block">WorkCenter Routing Steps</span>
                    <div className="border border-slate-850 rounded-xl overflow-hidden text-[10px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/40 text-slate-500 uppercase font-mono font-bold border-b border-slate-850">
                            <th className="p-2">Seq</th>
                            <th className="p-2">Station / Op</th>
                            <th className="p-2 text-center">Duration</th>
                            <th className="p-2 text-right">WC Setup</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {selectedBom.routingSteps.map((o: any) => (
                            <tr key={o.id} className="hover:bg-slate-900/20">
                              <td className="p-2 font-mono text-slate-500">{o.sequence}</td>
                              <td className="p-2">
                                <span className="text-slate-200 block font-semibold">{o.operationName}</span>
                                <span className="text-slate-500 text-[8px] font-mono">{o.workCenter?.name}</span>
                              </td>
                              <td className="p-2 text-center font-mono text-slate-350">{o.durationMinutes} mins</td>
                              <td className="p-2 text-right font-mono text-slate-450">${o.workCenter?.setupCost?.toFixed(2) || '0.00'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Material Requirement Simulator Preview Panel */}
                <div className="space-y-2.5 pt-4 border-t border-slate-850 bg-slate-900/20 p-3 rounded-xl border border-slate-850">
                  <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono flex justify-between items-center">
                    <span>Material Requirement Simulator</span>
                    <span className="text-sky-400 font-normal normal-case text-[10px]">Preview shortages</span>
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] text-slate-450 font-mono">Simulate Qty Yield:</label>
                    <input
                      type="number"
                      min="1"
                      value={simulatedQty}
                      onChange={(e) => setSimulatedQty(Math.max(1, Number(e.target.value)))}
                      className="w-20 glass-input px-2 py-1 rounded text-center text-xs font-mono"
                    />
                  </div>

                  <div className="border border-slate-850 rounded-lg overflow-hidden text-[9px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/40 text-slate-500 uppercase font-mono font-bold border-b border-slate-850">
                          <th className="p-2">Component</th>
                          <th className="p-2 text-center">Required</th>
                          <th className="p-2 text-center">Free Available</th>
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-mono">
                        {selectedBom.components?.map((c: any) => {
                          const required = (c.quantity / selectedBom.yieldQty) * simulatedQty;
                          const free = Math.max(0, c.product?.stockQty - c.product?.reservedQty);
                          const isAvailable = free >= required;
                          const shortage = Math.max(0, required - free);

                          return (
                            <tr key={c.id} className="hover:bg-slate-900/20">
                              <td className="p-2 text-slate-250 font-semibold">{c.product?.sku}</td>
                              <td className="p-2 text-center text-slate-300">{required.toFixed(1)}</td>
                              <td className="p-2 text-center text-slate-400">{free.toFixed(1)}</td>
                              <td className="p-2 text-center">
                                {isAvailable ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold">
                                    AVAILABLE
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-bold">
                                    SHORT: {shortage.toFixed(1)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-3 font-mono">
                <Info className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-[10px]">Select a Bill of Materials configuration from list on the left to inspect or review child yield operations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
