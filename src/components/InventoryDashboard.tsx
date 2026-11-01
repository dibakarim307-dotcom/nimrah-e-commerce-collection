import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpDown, 
  TrendingUp, 
  DollarSign, 
  Package, 
  X,
  Edit,
  Trash2,
  RefreshCw,
  Barcode
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';

export const InventoryDashboard: React.FC = () => {
  const { 
    products, 
    updateProductStock, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    settings, 
    setActiveView 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Add product modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('Abayas');
  const [newProdCollection, setNewProdCollection] = useState('Ramadan 2026');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number>(12000);
  const [newProdCost, setNewProdCost] = useState<number>(6000);
  const [newProdStock, setNewProdStock] = useState<number>(10);
  const [newProdSizes, setNewProdSizes] = useState<string>('52, 54, 56, 58');
  const [newProdFabric, setNewProdFabric] = useState('Pure Japanese Georgette');
  const [newProdDescription, setNewProdDescription] = useState('Artisanal modest fashion piece tailored for Nimrah Collection.');

  // Quick restock feedback
  const [restockedId, setRestockedId] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery);
    const matchesStock = stockFilter === 'all' 
      ? true 
      : stockFilter === 'low' 
        ? (p.stock > 0 && p.stock <= p.lowStockThreshold) 
        : p.stock <= 0;
    return matchesCat && matchesSearch && matchesStock;
  });

  // KPI calculations
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalRetailVal = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalCostVal = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  const handleQuickAddStock = (productId: string, amount: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    updateProductStock(productId, prod.stock + amount);
    setRestockedId(productId);
    setTimeout(() => setRestockedId(null), 1500);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const sizesArr = newProdSizes.split(',').map(s => s.trim()).filter(Boolean);
    const generatedSku = newProdSku.trim() || `NC-${newProdCategory.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`;
    const generatedBarcode = newProdBarcode.trim() || `616400${Math.floor(100000 + Math.random() * 900000)}`;

    addProduct({
      name: newProdName,
      sku: generatedSku,
      barcode: generatedBarcode,
      category: newProdCategory,
      collection: newProdCollection,
      price: Number(newProdPrice),
      costPrice: Number(newProdCost),
      stock: Number(newProdStock),
      lowStockThreshold: 5,
      sizes: sizesArr.length > 0 ? sizesArr : ['Standard'],
      colors: [
        { name: 'Onyx Black', hex: '#18181b' },
        { name: 'Champagne Gold', hex: '#d4af37' }
      ],
      images: ['/src/assets/images/product_emerald_abaya_1793448135180.jpg'],
      description: newProdDescription,
      fabric: newProdFabric,
      rating: 5.0,
      reviewsCount: 1
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewProdName('');
  };

  const categories = ['All', 'Abayas', 'Co-ords & Sets', 'Artisanal Kaftans', 'Signature Fragrance', 'Luxury Hijabs', 'Accessories'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-700" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Inventory &amp; Stock Synchronization
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time live multi-channel inventory synchronized between Online Storefront and Retail POS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveView('pos')}
            className="px-3.5 py-2 text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            Switch to POS
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-stone-900 hover:bg-black text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">Catalog SKUs</span>
          <div className="text-2xl font-bold font-mono text-stone-950 mt-1">
            {products.length} Items
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">6 active categories</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">Total Units In Stock</span>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {totalStockUnits} Pcs
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">Nairobi Westlands Hub</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">Inventory Valuation (Retail)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900 mt-1 tabular-nums">
            {formatCurrency(totalRetailVal, settings.currency)}
          </div>
          <span className="text-[11px] text-stone-500 mt-0.5 block font-mono">
            Cost: {formatCurrency(totalCostVal, settings.currency)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">Stock Health Alerts</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-700">
              {lowStockCount} Low
            </span>
            {outOfStockCount > 0 && (
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                {outOfStockCount} Out
              </span>
            )}
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">Automated threshold triggers</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder="Filter by product name, SKU, or Barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:outline-none"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock Filter Buttons */}
          <div className="flex bg-stone-100 p-1 rounded-lg text-xs">
            <button 
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                stockFilter === 'all' ? 'bg-white font-bold text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              All Items ({products.length})
            </button>
            <button 
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                stockFilter === 'low' ? 'bg-white font-bold text-amber-800 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button 
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                stockFilter === 'out' ? 'bg-white font-bold text-rose-800 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">SKU &amp; Barcode</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Retail Price</th>
                <th className="py-3 px-3 text-right">Gross Margin</th>
                <th className="py-3 px-4 text-center">Live Stock</th>
                <th className="py-3 px-4 text-center">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
                const marginPercent = Math.round(((product.price - product.costPrice) / product.price) * 100);

                return (
                  <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        {product.images[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900">{product.name}</div>
                        <div className="text-[11px] text-stone-500 font-light truncate max-w-xs">{product.fabric}</div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="font-bold text-stone-800">{product.sku}</div>
                      <div className="text-stone-400">{product.barcode}</div>
                    </td>

                    <td className="py-3 px-3 text-stone-600">
                      <span className="font-medium">{product.category}</span>
                      <div className="text-[10px] text-stone-400">{product.collection}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-stone-600 tabular-nums">
                      {formatCurrency(product.costPrice, settings.currency)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-900 tabular-nums">
                      {formatCurrency(product.price, settings.currency)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                      {marginPercent}%
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {isOutOfStock ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          0 OUT
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {product.stock} LOW
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {product.stock} units
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleQuickAddStock(product.id, 5)}
                          title="Restock +5 units"
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-[11px] font-semibold rounded transition-colors cursor-pointer"
                        >
                          +5
                        </button>
                        <button 
                          onClick={() => handleQuickAddStock(product.id, 10)}
                          title="Restock +10 units"
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-[11px] font-semibold rounded transition-colors cursor-pointer"
                        >
                          +10
                        </button>
                        {restockedId === product.id && (
                          <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                            Restocked ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Add New Garment / Fragrance to Inventory
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Product Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Royal Silk Batwing Abaya" 
                  value={newProdName} 
                  onChange={(e) => setNewProdName(e.target.value)} 
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Category</label>
                  <select 
                    value={newProdCategory} 
                    onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                  >
                    <option value="Abayas">Abayas</option>
                    <option value="Co-ords & Sets">Co-ords &amp; Sets</option>
                    <option value="Artisanal Kaftans">Artisanal Kaftans</option>
                    <option value="Signature Fragrance">Signature Fragrance</option>
                    <option value="Luxury Hijabs">Luxury Hijabs</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Collection</label>
                  <input 
                    type="text" 
                    value={newProdCollection} 
                    onChange={(e) => setNewProdCollection(e.target.value)} 
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Retail Price (KES) *</label>
                  <input 
                    type="number" 
                    required
                    value={newProdPrice} 
                    onChange={(e) => setNewProdPrice(Number(e.target.value))} 
                    className="w-full font-mono px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Cost Price (KES)</label>
                  <input 
                    type="number" 
                    value={newProdCost} 
                    onChange={(e) => setNewProdCost(Number(e.target.value))} 
                    className="w-full font-mono px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Initial Stock *</label>
                  <input 
                    type="number" 
                    required
                    value={newProdStock} 
                    onChange={(e) => setNewProdStock(Number(e.target.value))} 
                    className="w-full font-mono px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Custom SKU (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Auto-generated if empty" 
                    value={newProdSku} 
                    onChange={(e) => setNewProdSku(e.target.value)} 
                    className="w-full font-mono px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Barcode (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Auto-generated if empty" 
                    value={newProdBarcode} 
                    onChange={(e) => setNewProdBarcode(e.target.value)} 
                    className="w-full font-mono px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Sizes (Comma separated)</label>
                <input 
                  type="text" 
                  value={newProdSizes} 
                  onChange={(e) => setNewProdSizes(e.target.value)} 
                  className="w-full font-mono px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Fabric Specifications</label>
                <input 
                  type="text" 
                  value={newProdFabric} 
                  onChange={(e) => setNewProdFabric(e.target.value)} 
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 text-xs font-bold text-white bg-stone-900 hover:bg-black rounded-xl transition-colors cursor-pointer mt-2"
              >
                Create Product &amp; Sync to POS &amp; Storefront
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
