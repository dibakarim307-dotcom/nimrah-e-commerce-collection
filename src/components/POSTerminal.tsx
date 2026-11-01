import React, { useState, useMemo } from 'react';
import { 
  Barcode, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  PauseCircle, 
  PlayCircle, 
  RotateCcw, 
  Printer, 
  CheckCircle2, 
  ArrowLeft, 
  Store as StoreIcon, 
  User, 
  Tag,
  ShieldCheck,
  AlertTriangle,
  X,
  LogOut
} from 'lucide-react';
import { Product, ProductCategory, PaymentMethod } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency, generateMpesaCode } from '../utils/formatters';
import { PosAuthModal } from './PosAuthModal';

export const POSTerminal: React.FC = () => {
  const {
    products,
    posCart,
    heldCarts,
    settings,
    setActiveView,
    posStaffUser,
    logoutPosStaff,
    posCashierName,
    setPosCashierName,
    posCustomerName,
    setPosCustomerName,
    posCustomerPhone,
    setPosCustomerPhone,
    posDiscountPercent,
    setPosDiscountPercent,
    addToPosCart,
    updatePosCartItemQty,
    removeFromPosCart,
    clearPosCart,
    holdCurrentPosCart,
    recallPosCart,
    deleteHeldCart,
    getPosCartTotals,
    createOrder,
    orders
  } = useStore();

  // Search & category filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // Quick product selection modal (for products with multiple sizes)
  const [quickSelectProduct, setQuickSelectProduct] = useState<Product | null>(null);
  const [quickSize, setQuickSize] = useState<string>('');
  const [quickColor, setQuickColor] = useState<Product['colors'][0] | null>(null);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa_till');
  const [mpesaCustomerPhone, setMpesaCustomerPhone] = useState(posCustomerPhone || '0722000000');
  const [mpesaRefCode, setMpesaRefCode] = useState('');
  const [isSimulatingStk, setIsSimulatingStk] = useState(false);
  
  // Cash calculations
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Held carts drawer
  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);
  const [holdLabelInput, setHoldLabelInput] = useState('');

  const { subtotal, discount, tax, total, count } = getPosCartTotals();

  // Filter products for POS
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.barcode.includes(searchQuery);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode quick punch
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const query = barcodeInput.trim();
    const found = products.find(p => 
      p.barcode === query || 
      p.sku.toLowerCase() === query.toLowerCase()
    );

    if (found) {
      if (found.stock <= 0) {
        alert(`Cannot add ${found.name}: Item is out of stock!`);
      } else {
        addToPosCart(found);
      }
      setBarcodeInput('');
    } else {
      alert(`No product matching SKU/Barcode: ${query}`);
    }
  };

  const handleProductCardClick = (product: Product) => {
    if (product.stock <= 0) return;
    if (product.sizes.length > 1 || product.colors.length > 1) {
      setQuickSelectProduct(product);
      setQuickSize(product.sizes[0] || 'Standard');
      setQuickColor(product.colors[0] || { name: 'Standard', hex: '#000000' });
    } else {
      addToPosCart(product);
    }
  };

  const confirmQuickAdd = () => {
    if (quickSelectProduct && quickColor) {
      addToPosCart(quickSelectProduct, quickSize, quickColor, 1);
      setQuickSelectProduct(null);
    }
  };

  // Open payment dialog
  const handleOpenPayment = () => {
    if (posCart.length === 0) return;
    setCashTendered(total);
    setMpesaCustomerPhone(posCustomerPhone || '0722000000');
    setMpesaRefCode(generateMpesaCode());
    setIsPaymentModalOpen(true);
  };

  // Process POS transaction
  const handleCompletePosSale = () => {
    const finalMpesaCode = mpesaRefCode.trim().toUpperCase() || generateMpesaCode();
    
    createOrder({
      source: 'pos',
      items: posCart,
      subtotal,
      discount,
      discountCode: posDiscountPercent > 0 ? `POS-STAFF-${posDiscountPercent}%` : undefined,
      tax,
      shippingFee: 0,
      total,
      customer: {
        name: posCustomerName || 'Walk-in Boutique Client',
        phone: posCustomerPhone || mpesaCustomerPhone || '+254 700 000 000',
        city: 'Nairobi (Eastleigh UBAH Shop G7)'
      },
      payment: {
        method: paymentMethod,
        status: 'completed',
        mpesaDetails: paymentMethod === 'mpesa_till' || paymentMethod === 'split' ? {
          tillNumber: settings.mpesaTillNumber,
          phoneNumber: mpesaCustomerPhone,
          transactionCode: finalMpesaCode,
          merchantName: settings.mpesaStoreName,
          amount: paymentMethod === 'split' ? total / 2 : total,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } : undefined,
        cashReceived: paymentMethod === 'cash' ? cashTendered : undefined,
        cashChange: paymentMethod === 'cash' ? Math.max(0, cashTendered - total) : undefined,
        cardLast4: paymentMethod === 'card' ? '4089' : undefined
      },
      status: 'confirmed',
      cashierName: posStaffUser ? `${posStaffUser.name} (${posStaffUser.badgeNumber})` : posCashierName
    });

    setIsPaymentModalOpen(false);
  };

  // Live Register calculations
  const todayPosSales = orders
    .filter(o => o.source === 'pos')
    .reduce((sum, o) => sum + o.total, 0);

  const categories: (ProductCategory | 'All')[] = [
    'All',
    'Abayas',
    'Co-ords & Sets',
    'Artisanal Kaftans',
    'Signature Fragrance',
    'Luxury Hijabs',
    'Accessories'
  ];

  const cashChange = Math.max(0, cashTendered - total);

  // If not logged in as authorized staff, display secure authentication portal
  if (!posStaffUser) {
    return <PosAuthModal onCancel={() => setActiveView('storefront')} />;
  }

  return (
    <div className="min-h-screen bg-[#09090c] text-stone-100 flex flex-col font-sans select-none">
      {/* 1. POS Top Bar */}
      <header className="bg-[#0f0f14] border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView('storefront')}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <div className="h-5 w-px bg-stone-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-amber-400" />
            <span className="font-serif text-lg font-semibold tracking-tight text-white">
              {settings.storeName} POS
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
              Till: {settings.mpesaTillNumber}
            </span>
          </div>
        </div>

        {/* Register summary stats & Authenticated Staff */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#16161d] px-2.5 py-1 rounded-lg border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-stone-400">Staff:</span>
            <span className="font-bold text-amber-300">{posStaffUser.name}</span>
            <span className="text-[10px] text-stone-400">({posStaffUser.badgeNumber})</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#16161d] px-2.5 py-1 rounded-lg border border-stone-800">
            <span className="text-stone-400">Shift Total:</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {formatCurrency(todayPosSales, settings.currency)}
            </span>
          </div>
        </div>

        {/* Quick action buttons & Lock */}
        <div className="flex items-center gap-2">
          {heldCarts.length > 0 && (
            <button 
              onClick={() => setShowHeldCartsModal(true)}
              className="px-2.5 py-1.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg flex items-center gap-1.5 animate-pulse"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Recalls ({heldCarts.length})</span>
            </button>
          )}

          <button 
            onClick={() => setActiveView('inventory')}
            className="px-2.5 py-1.5 text-xs text-stone-300 hover:text-white bg-[#16161d] border border-stone-800 rounded-lg"
          >
            Inventory
          </button>

          {/* Lock Register / Sign Out */}
          <button
            onClick={logoutPosStaff}
            title="Lock Register & Sign Out"
            className="px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock POS</span>
          </button>
        </div>
      </header>

      {/* 2. Main POS Workspace: Left Catalog + Right Ticket */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Product Grid & Barcode Punch */}
        <div className="flex-1 flex flex-col bg-stone-900 border-r border-stone-800 overflow-hidden">
          {/* Barcode scanner & search bar */}
          <div className="p-3 bg-stone-950/70 border-b border-stone-800 flex flex-col sm:flex-row gap-2.5 shrink-0">
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
              <Barcode className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Scan Barcode or type SKU (e.g. 616400192831, NC-ABY-01)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full text-xs font-mono pl-9 pr-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </form>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Quick name search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 py-2 bg-stone-900 border-b border-stone-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-amber-400 text-stone-950 font-semibold shadow-xs' 
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Fast Touch Products Grid */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map(product => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductCardClick(product)}
                  className={`relative p-2.5 bg-stone-950/80 border rounded-xl flex flex-col justify-between transition-all text-left ${
                    isOutOfStock 
                      ? 'border-stone-800 opacity-50 cursor-not-allowed' 
                      : 'border-stone-800 hover:border-amber-400/80 hover:bg-stone-950 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-stone-900 mb-2">
                    {product.images[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-stone-600">
                        No Image
                      </div>
                    )}

                    {/* Stock badge */}
                    <div className="absolute top-1.5 left-1.5">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-mono bg-rose-950/90 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded">
                          0 IN STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-mono bg-amber-950/90 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                          {product.stock} LEFT
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-emerald-950/90 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                          {product.stock} PCS
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-stone-400 uppercase">
                      {product.sku}
                    </div>
                    <div className="text-xs font-semibold text-white line-clamp-1 mt-0.5">
                      {product.name}
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-300 mt-1 tabular-nums">
                      {formatCurrency(product.price, settings.currency)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active POS Register Ticket */}
        <div className="w-full lg:w-96 xl:w-[420px] bg-stone-950 flex flex-col justify-between shrink-0 border-t lg:border-t-0 lg:border-l border-stone-800">
          {/* Ticket Header & Customer Selector */}
          <div className="p-3 border-b border-stone-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Current Register Ticket</span>
              </span>
              <span className="text-xs font-mono text-stone-400">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Customer input */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2" />
                <input 
                  type="text"
                  placeholder="Customer Name"
                  value={posCustomerName}
                  onChange={(e) => setPosCustomerName(e.target.value)}
                  className="w-full text-xs pl-7 pr-2 py-1.5 bg-stone-900 border border-stone-800 rounded-md text-white focus:outline-none focus:border-stone-600"
                />
              </div>

              <div className="relative">
                <Smartphone className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2" />
                <input 
                  type="tel"
                  placeholder="M-Pesa Phone"
                  value={posCustomerPhone}
                  onChange={(e) => {
                    setPosCustomerPhone(e.target.value);
                    setMpesaCustomerPhone(e.target.value);
                  }}
                  className="w-full text-xs font-mono pl-7 pr-2 py-1.5 bg-stone-900 border border-stone-800 rounded-md text-white focus:outline-none focus:border-stone-600"
                />
              </div>
            </div>
          </div>

          {/* Ticket Line Items */}
          <div className="flex-1 overflow-y-auto p-3 divide-y divide-stone-900">
            {posCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <Barcode className="w-10 h-10 mb-2 text-stone-600 stroke-1" />
                <p className="text-xs">No items on current ticket</p>
                <p className="text-[11px] text-stone-600 mt-1">
                  Scan barcode, search SKU, or tap catalog items to ring up
                </p>
              </div>
            ) : (
              posCart.map((item, index) => (
                <div key={index} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                      <span>Sz: {item.selectedSize}</span>
                      <span>·</span>
                      <span className="truncate">{item.selectedColor.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-stone-500">
                      {formatCurrency(item.unitPrice, settings.currency)} ea
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-stone-900 rounded p-1 border border-stone-800">
                    <button 
                      onClick={() => updatePosCartItemQty(index, item.quantity - 1)}
                      className="p-1 text-stone-400 hover:text-white cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-1.5 font-mono text-xs font-bold text-amber-300 tabular-nums">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updatePosCartItemQty(index, item.quantity + 1)}
                      className="p-1 text-stone-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total & Delete */}
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white tabular-nums">
                      {formatCurrency(item.unitPrice * item.quantity, settings.currency)}
                    </div>
                    <button 
                      onClick={() => removeFromPosCart(index)}
                      className="text-stone-500 hover:text-rose-400 text-[10px] mt-0.5 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ticket Footer: Discounts, Totals & Pay Button */}
          <div className="p-3 bg-stone-900 border-t border-stone-800 space-y-3 shrink-0">
            {/* Quick Discount Buttons */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Discount:</span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15, 20].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setPosDiscountPercent(pct)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                      posDiscountPercent === pct 
                        ? 'bg-amber-400 text-stone-950 font-bold' 
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-1 text-xs font-mono text-stone-400 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums text-stone-200">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({posDiscountPercent}%)</span>
                  <span className="tabular-nums">-{formatCurrency(discount, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>VAT 16% (Inclusive)</span>
                <span className="tabular-nums">{formatCurrency(tax, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-stone-800">
                <span>Grand Total</span>
                <span className="text-amber-300 font-mono text-lg tabular-nums">
                  {formatCurrency(total, settings.currency)}
                </span>
              </div>
            </div>

            {/* Ticket Management Buttons */}
            <div className="flex gap-2">
              <button 
                type="button"
                disabled={posCart.length === 0}
                onClick={() => {
                  const lbl = prompt('Enter a label for this held ticket (e.g. Amina - Changing Room):', posCustomerName || 'Walk-in');
                  if (lbl !== null) holdCurrentPosCart(lbl);
                }}
                className="flex-1 py-1.5 px-2 text-xs text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 rounded-md transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Hold Ticket</span>
              </button>

              <button 
                type="button"
                disabled={posCart.length === 0}
                onClick={clearPosCart}
                className="py-1.5 px-3 text-xs text-stone-400 hover:text-stone-200 bg-stone-800 rounded-md disabled:opacity-30 cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Giant Process Payment Button */}
            <button 
              type="button"
              disabled={posCart.length === 0}
              onClick={handleOpenPayment}
              className="w-full py-3.5 px-4 text-sm font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:bg-stone-800 disabled:text-stone-500 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Charge {formatCurrency(total, settings.currency)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Quick Size / Color Selector Modal for Multi-variant items */}
      {quickSelectProduct && quickColor && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-4 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm">{quickSelectProduct.name}</h4>
                <p className="text-xs text-amber-300 font-mono mt-0.5">
                  {formatCurrency(quickSelectProduct.price, settings.currency)}
                </p>
              </div>
              <button 
                onClick={() => setQuickSelectProduct(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">
                Choose Size:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickSelectProduct.sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setQuickSize(s)}
                    className={`px-3 py-1 text-xs font-mono rounded border ${
                      quickSize === s 
                        ? 'bg-amber-400 text-stone-950 border-amber-400 font-bold' 
                        : 'bg-stone-800 border-stone-700 text-stone-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">
                Choose Color: <span className="text-stone-200">{quickColor.name}</span>
              </label>
              <div className="flex items-center gap-2">
                {quickSelectProduct.colors.map(col => (
                  <button
                    key={col.name}
                    onClick={() => setQuickColor(col)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      quickColor.name === col.name ? 'ring-2 ring-amber-400 border-white' : 'border-stone-700'
                    }`}
                    style={{ backgroundColor: col.hex }}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={confirmQuickAdd}
              className="w-full py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer mt-2"
            >
              Add to Ticket
            </button>
          </div>
        </div>
      )}

      {/* 4. POS Payment Processing Modal (M-Pesa Till / Cash / Card / Split) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Settle POS Transaction</span>
                </h3>
                <span className="text-xs text-stone-400 font-mono">
                  Till Number: {settings.mpesaTillNumber} ({settings.mpesaStoreName})
                </span>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total due display */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 block">Total Due</span>
                <span className="text-2xl font-mono font-bold text-amber-300 tabular-nums">
                  {formatCurrency(total, settings.currency)}
                </span>
              </div>
              <div className="text-right text-xs font-mono text-stone-400">
                <div>Client: {posCustomerName || 'Walk-in'}</div>
                <div>Cashier: {posCashierName}</div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setPaymentMethod('mpesa_till')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'mpesa_till' 
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold' 
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <div className="text-[11px]">M-Pesa Till</div>
              </button>

              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'cash' 
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold' 
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <div className="text-[11px]">Cash</div>
              </button>

              <button 
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'card' 
                    ? 'bg-blue-950/80 border-blue-500 text-blue-300 font-bold' 
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                <div className="text-[11px]">Card / POS</div>
              </button>

              <button 
                onClick={() => setPaymentMethod('split')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  paymentMethod === 'split' 
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300 font-bold' 
                    : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                <RotateCcw className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <div className="text-[11px]">Split Pay</div>
              </button>
            </div>

            {/* M-PESA TILL DETAILS */}
            {paymentMethod === 'mpesa_till' && (
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">M-Pesa Buy Goods Till #{settings.mpesaTillNumber}</span>
                  <span className="text-stone-400 font-mono text-[11px]">Instant STK / Code</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Customer Phone Number:
                    </label>
                    <input 
                      type="tel"
                      value={mpesaCustomerPhone}
                      onChange={(e) => setMpesaCustomerPhone(e.target.value)}
                      placeholder="07XX XXX XXX"
                      className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      M-Pesa Receipt Code:
                    </label>
                    <input 
                      type="text"
                      value={mpesaRefCode}
                      onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                      placeholder="e.g. QJD82KLA89"
                      className="w-full text-xs font-mono uppercase px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-emerald-300"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSimulatingStk(true);
                      setTimeout(() => {
                        setIsSimulatingStk(false);
                        setMpesaRefCode(generateMpesaCode());
                      }, 1200);
                    }}
                    className="flex-1 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 cursor-pointer"
                  >
                    {isSimulatingStk ? 'Sending STK Prompt...' : 'Send STK Prompt to Client'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setMpesaRefCode(generateMpesaCode())}
                    className="px-3 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 cursor-pointer"
                  >
                    Generate Ref
                  </button>
                </div>
              </div>
            )}

            {/* CASH DETAILS */}
            {paymentMethod === 'cash' && (
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-bold">Cash Payment & Change Calculator</span>
                </div>

                {/* Preset denomination buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setCashTendered(total)}
                    className="px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-mono"
                  >
                    Exact ({formatCurrency(total, settings.currency)})
                  </button>
                  {[1000, 2000, 5000, 10000, 20000, 30000, 50000].filter(a => a >= total).slice(0, 4).map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashTendered(amt)}
                      className="px-2.5 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-mono"
                    >
                      {formatCurrency(amt, settings.currency)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Cash Received (KES):
                    </label>
                    <input 
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      className="w-full text-sm font-mono font-bold px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Change Due:
                    </label>
                    <div className="text-sm font-mono font-bold px-3 py-2 bg-stone-900/60 border border-stone-800 rounded-lg text-emerald-400 tabular-nums">
                      {formatCurrency(cashChange, settings.currency)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CARD DETAILS */}
            {paymentMethod === 'card' && (
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2 text-xs">
                <div className="text-blue-400 font-bold">KCB / Stanbic POS Card Terminal</div>
                <p className="text-stone-400 text-[11px]">
                  Swipe or tap customer's Visa / Mastercard on the counter terminal.
                </p>
                <div className="flex items-center gap-2 text-stone-300 font-mono text-[11px] pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Terminal Ready · Auth Code Auto-Verified</span>
                </div>
              </div>
            )}

            {/* SPLIT PAYMENT */}
            {paymentMethod === 'split' && (
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2 text-xs font-mono">
                <div className="text-purple-400 font-bold">Split: 50% M-Pesa + 50% Cash</div>
                <div className="flex justify-between text-stone-300">
                  <span>M-Pesa Till:</span>
                  <span>{formatCurrency(total / 2, settings.currency)} (Code: {mpesaRefCode})</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(total / 2, settings.currency)}</span>
                </div>
              </div>
            )}

            {/* Confirm & Print Action */}
            <div className="pt-2">
              <button 
                type="button"
                onClick={handleCompletePosSale}
                className="w-full py-3.5 text-sm font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>Complete Sale & Generate Invoice / Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Held Carts Recall Modal */}
      {showHeldCartsModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 space-y-3 text-white">
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <span>Held Register Tickets ({heldCarts.length})</span>
              </h4>
              <button 
                onClick={() => setShowHeldCartsModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-stone-800 max-h-72 overflow-y-auto">
              {heldCarts.map(h => {
                const hTotal = h.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
                return (
                  <div key={h.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">{h.label}</div>
                      <div className="text-[11px] text-stone-400 font-mono">
                        {h.createdAt} · {h.items.length} items · {formatCurrency(hTotal, settings.currency)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          recallPosCart(h.id);
                          setShowHeldCartsModal(false);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-400 text-stone-950 rounded hover:bg-amber-300"
                      >
                        Recall
                      </button>
                      <button 
                        onClick={() => deleteHeldCart(h.id)}
                        className="p-1 text-stone-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
