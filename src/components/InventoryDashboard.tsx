import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Package, 
  X, 
  Trash2, 
  RefreshCw, 
  Barcode, 
  Crown, 
  Lock, 
  ArrowLeft,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';
import { PosAuthModal } from './PosAuthModal';
import { OwnerProductManagerModal } from './OwnerProductManagerModal';

export const InventoryDashboard: React.FC = () => {
  const { 
    products, 
    updateProductStock, 
    deleteProduct, 
    settings, 
    setActiveView,
    posStaffUser,
    logoutPosStaff
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Owner Product & Inventory Manager Modal State
  const [isOwnerProductModalOpen, setIsOwnerProductModalOpen] = useState(false);
  const [ownerModalInitialMode, setOwnerModalInitialMode] = useState<'add' | 'delete' | 'inventory'>('add');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Auth gatekeeper state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Quick restock feedback
  const [restockedId, setRestockedId] = useState<string | null>(null);

  const isShopOwner = posStaffUser?.role === 'Shop Owner';

  // GATEKEEPER: If not logged in as Store Owner, display locked gatekeeper
  if (!isShopOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center select-none animate-in fade-in">
        {showAuthModal ? (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <PosAuthModal 
              initialRole="owner"
              onSuccess={() => setShowAuthModal(false)}
              onCancel={() => setShowAuthModal(false)}
            />
          </div>
        ) : (
          <div className="bg-[#111116] border-2 border-amber-500/40 rounded-3xl p-8 sm:p-12 text-stone-100 shadow-2xl space-y-6 max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-amber-950/70 border-2 border-amber-400/60 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-950/50">
              <Crown className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full">
                Restricted Executive Clearance
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Store Owner Access Required
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
                Adding products, uploading photography, removing catalog items, and tracking wholesale inventory valuation are strictly reserved for the <strong>Shop Owner</strong>.
              </p>
            </div>

            <div className="bg-[#181820] p-4 rounded-2xl border border-stone-800 text-xs space-y-2.5 text-left">
              <div className="flex items-center justify-between text-stone-400">
                <span>Active Personnel Session:</span>
                <span className="font-mono text-stone-200 font-bold">
                  {posStaffUser ? `${posStaffUser.name} (${posStaffUser.role})` : 'Not Signed In'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-rose-300 text-[11px]">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {posStaffUser 
                    ? `Role "${posStaffUser.role}" does not have authority to add/remove products or view wholesale margins.`
                    : 'Please log in or register a new Shop Owner account to unlock full inventory authority.'
                  }
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer hover:scale-[1.01]"
              >
                <Crown className="w-4 h-4" />
                <span>Log In or Create Shop Owner Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('pos')}
                  className="flex-1 py-2.5 px-4 text-xs font-medium text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-colors cursor-pointer"
                >
                  Switch to POS Register
                </button>
                <button
                  onClick={() => setActiveView('storefront')}
                  className="flex-1 py-2.5 px-4 text-xs font-medium text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-xl transition-colors cursor-pointer"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
  const potentialProfit = totalRetailVal - totalCostVal;
  const avgMargin = totalRetailVal > 0 ? Math.round((potentialProfit / totalRetailVal) * 100) : 0;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  const handleQuickAddStock = (productId: string, amount: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    updateProductStock(productId, prod.stock + amount);
    setRestockedId(productId);
    setTimeout(() => setRestockedId(null), 1500);
  };

  const categories = ['All', 'Abayas', 'Co-ords & Sets', 'Artisanal Kaftans', 'Signature Fragrance', 'Luxury Hijabs', 'Accessories'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Inventory &amp; Stock Synchronization
            </h1>
            <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold uppercase">
              👑 Owner Clearance
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Logged in as <strong>{posStaffUser.name}</strong> ({posStaffUser.badgeNumber}) · Wholesale valuation, product creation, photo management, and catalog deletion
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveView('pos')}
            className="px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors cursor-pointer border border-stone-200"
          >
            Switch to POS
          </button>

          <button 
            onClick={() => {
              setOwnerModalInitialMode('add');
              setIsOwnerProductModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold bg-stone-900 hover:bg-black text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Item &amp; Photo</span>
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
          <span className="text-[11px] text-stone-400 mt-0.5 block">Eastleigh G7 Retail Hub</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">Inventory Valuation (Retail)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900 mt-1 tabular-nums">
            {formatCurrency(totalRetailVal, settings.currency)}
          </div>
          <span className="text-[11px] text-stone-500 mt-0.5 block font-mono">
            Cost: {formatCurrency(totalCostVal, settings.currency)} · {avgMargin}% Margin
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
                <th className="py-3 px-4 text-center">Quick Adjust</th>
                <th className="py-3 px-4 text-center">Delete Item</th>
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
                          onClick={() => handleQuickAddStock(product.id, -1)}
                          title="Reduce 1 unit"
                          className="w-6 h-6 bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => handleQuickAddStock(product.id, 1)}
                          title="Restock +1 unit"
                          className="w-6 h-6 bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center"
                        >
                          +1
                        </button>
                        <button 
                          onClick={() => handleQuickAddStock(product.id, 5)}
                          title="Restock +5 units"
                          className="px-1.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-[11px] font-semibold rounded transition-colors cursor-pointer"
                        >
                          +5
                        </button>
                        {restockedId === product.id && (
                          <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                            ✓
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setProductToDelete(product);
                          setOwnerModalInitialMode('delete');
                          setIsOwnerProductModalOpen(true);
                        }}
                        title="Remove product from catalog"
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Owner Product & Inventory Suite Modal */}
      <OwnerProductManagerModal
        isOpen={isOwnerProductModalOpen}
        onClose={() => {
          setIsOwnerProductModalOpen(false);
          setProductToDelete(null);
        }}
        initialMode={ownerModalInitialMode}
        productToDelete={productToDelete}
        onOpenAuthForOwner={() => {
          setIsOwnerProductModalOpen(false);
          setShowAuthModal(true);
        }}
      />
    </div>
  );
};
