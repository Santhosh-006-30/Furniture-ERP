'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  Package,
  Plus,
  Search,
  Filter,
  DollarSign,
  Info,
  Loader2,
  Trash2,
  Edit,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Master-Detail Selection States
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Editable Form fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('RAW_MATERIAL');
  const [costPrice, setCostPrice] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [procurementStrategy, setProcurementStrategy] = useState('MTO');
  const [procurementType, setProcurementType] = useState('PURCHASE');
  const [procureOnDemand, setProcureOnDemand] = useState(false);
  const [reorderLevel, setReorderLevel] = useState('5');
  const [vendorId, setVendorId] = useState('');
  const [stockQty, setStockQty] = useState('0');

  const fetchData = async () => {
    try {
      setLoading(true);
      const prodList = await api.get('/products');
      setProducts(prodList);

      const vendorList = await api.get('/vendors');
      setVendors(vendorList);
      
      const bomsList = await api.get('/bom');
      setBoms(bomsList || []);
    } catch (err) {
      console.error('Error fetching catalog details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectProduct = (p: any) => {
    setSelectedProduct(p);
    setIsCreating(false);
    
    // Fill form states
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(String(p.costPrice));
    setSellingPrice(String(p.sellingPrice));
    setProcurementStrategy(p.procurementStrategy);
    setProcurementType(p.procurementType);
    setProcureOnDemand(p.procureOnDemand);
    setReorderLevel(String(p.reorderLevel));
    setVendorId(p.preferredVendorId || '');
    setStockQty(String(p.stockQty));
  };

  const handleStartCreate = () => {
    setSelectedProduct(null);
    setIsCreating(true);
    
    // Reset form states
    setSku('');
    setName('');
    setCategory('RAW_MATERIAL');
    setCostPrice('0');
    setSellingPrice('0');
    setProcurementStrategy('MTO');
    setProcurementType('PURCHASE');
    setProcureOnDemand(false);
    setReorderLevel('5');
    setVendorId('');
    setStockQty('0');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        sku,
        name,
        category,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        procurementStrategy,
        procurementType,
        procureOnDemand,
        reorderLevel: Number(reorderLevel),
        preferredVendorId: vendorId || null,
        stockQty: Number(stockQty),
      };

      if (isCreating) {
        await api.post('/products', payload);
        alert('Product SKU registered successfully!');
      } else {
        await api.put(`/products/${selectedProduct.id}`, payload);
        alert('Product details updated successfully!');
      }
      
      setIsCreating(false);
      setSelectedProduct(null);
      fetchData();
    } catch (err: any) {
      alert(`Failed to save product details: ${err.message || err}`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span>Synchronizing products database registry...</span>
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
            Products Registry
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Manage item catalogs, pricing structures, and reorder replenish targets.</p>
        </div>
        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-sky-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>Create Product</span>
        </button>
      </div>

      {/* Main Split Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Product SKU Grid Table */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex gap-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products by SKU or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                    <th className="p-4 font-bold">SKU</th>
                    <th className="p-4 font-bold">Product Name</th>
                    <th className="p-4 font-bold">Category</th>
                    <th className="p-4 font-bold">Prices</th>
                    <th className="p-4 font-bold text-center">On Hand</th>
                    <th className="p-4 font-bold text-center">Reserved</th>
                    <th className="p-4 font-bold text-center">Free</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedProduct?.id === p.id;
                    const freeQty = Math.max(0, p.stockQty - p.reservedQty);
                    const isLow = freeQty <= p.reorderLevel;
                    return (
                      <tr 
                        key={p.id} 
                        onClick={() => handleSelectProduct(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-sky-500/10 hover:bg-sky-500/15 text-sky-300' 
                            : 'hover:bg-slate-900/30'
                        }`}
                      >
                        <td className="p-4 font-mono font-bold">{p.sku}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-250">{p.name}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              Strategy: {p.procurementStrategy} / {p.procurementType}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px] font-bold">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-4 font-mono">
                          <div className="flex flex-col text-[11px]">
                            <span>S: ${p.sellingPrice.toFixed(2)}</span>
                            <span className="text-slate-500 text-[10px]">C: ${p.costPrice.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-semibold font-mono">{p.stockQty}</td>
                        <td className="p-4 text-center font-semibold font-mono text-slate-500">{p.reservedQty}</td>
                        <td className={`p-4 text-center font-bold font-mono ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {freeQty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Editable details form */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 sticky top-6">
            {selectedProduct || isCreating ? (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Package className="w-4 h-4" />
                    {isCreating ? 'Register Product SKU' : 'Product Parameters'}
                  </span>
                  {!isCreating && (
                    <span className="text-xxs text-slate-500 font-mono">ID: {selectedProduct.id.slice(0, 8)}</span>
                  )}
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Wooden Dining Table Top"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">SKU Code</label>
                    <input
                      type="text"
                      required
                      placeholder="RAW-WD-TOP"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs bg-slate-900 font-bold"
                    >
                      <option value="RAW_MATERIAL">RAW MATERIAL</option>
                      <option value="COMPONENT">COMPONENT</option>
                      <option value="FINISHED_GOOD">FINISHED GOOD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">Sales Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono font-mono">Reorder Alert Level</label>
                    <input
                      type="number"
                      required
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono font-mono">Initial Qty</label>
                    <input
                      type="number"
                      required
                      disabled={!isCreating}
                      value={stockQty}
                      onChange={(e) => setStockQty(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Procurement parameters from mockup */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-xxs text-slate-500 font-bold uppercase tracking-wider font-mono">Procurement Matrix Setup</label>
                  
                  <div className="space-y-3 mt-1.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Strategy</span>
                        <select
                          value={procurementStrategy}
                          onChange={(e) => setProcurementStrategy(e.target.value)}
                          className="w-full glass-input px-2 py-1 rounded text-xs bg-slate-900"
                        >
                          <option value="MTO">MTO (Order)</option>
                          <option value="MTS">MTS (Stock)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Replenish Via</span>
                        <select
                          value={procurementType}
                          onChange={(e) => setProcurementType(e.target.value)}
                          className="w-full glass-input px-2 py-1 rounded text-xs bg-slate-900"
                        >
                          <option value="PURCHASE">PURCHASE</option>
                          <option value="MANUFACTURING">MANUFACTURING</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-mono">Preferred Supplier</span>
                      <select
                        value={vendorId}
                        onChange={(e) => setVendorId(e.target.value)}
                        className="w-full glass-input px-2 py-1.5 rounded text-xs bg-slate-900"
                      >
                        <option value="">No vendor assigned</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>

                    {category === 'FINISHED_GOOD' && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-mono">Product Active BoM</span>
                        <div className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xxs font-mono text-slate-400 flex items-center justify-between">
                          <span>
                            {boms.find(b => b.productId === (selectedProduct?.id || ''))?.name || 'No BoM linked'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-slate-200">
                      <input
                        type="checkbox"
                        checked={procureOnDemand}
                        onChange={(e) => setProcureOnDemand(e.target.checked)}
                        className="w-4 h-4 accent-sky-500 rounded bg-slate-900 border-slate-800"
                      />
                      <span>Procure on Demand (MTO)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setSelectedProduct(null); setIsCreating(false); }}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer shadow-lg shadow-sky-500/10"
                  >
                    Save SKU
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-3 font-mono">
                <Info className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-[10px]">Select a product SKU from registry grid on the left to review or edit detail metrics.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
