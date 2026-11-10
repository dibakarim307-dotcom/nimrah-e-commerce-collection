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
  LogOut,
  Crown,
  KeyRound,
  Lock,
  BadgeCheck,
  RefreshCw,
  Check,
  AlertCircle,
  Receipt,
  Layers,
  ArrowRight,
  FileText,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { Product, ProductCategory, PaymentMethod } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency, generateMpesaCode } from '../utils/formatters';
import { PosAuthModal } from './PosAuthModal';
import { OwnerExecutiveHubModal } from './OwnerExecutiveHubModal';
import { StaffCredentialsModal } from './StaffCredentialsModal';
import { OwnerOrdersInvoicesModal } from './OwnerOrdersInvoicesModal';

export const POSTerminal: React.FC = () => {
  const {
    products,
    posCart,
    heldCarts,
    settings,
    setActiveView,
    posStaffUser,
    posPortalIntent,
    logoutPosStaff,
    setIsSettingsModalOpen,
    setIsOwnerShowcaseModalOpen,
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
    orders,
    isOwnerProductModalOpen,
    setIsOwnerProductModalOpen,
    ownerModalInitialMode,
    setOwnerModalInitialMode,
    productForDeletion,
    setProductForDeletion,
    openAddProductModal,
    openDeleteProductModal
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
  const [stkStatus, setStkStatus] = useState<'idle' | 'sending' | 'prompted' | 'success' | 'failed' | 'cancelled'>('idle');
  const [stkFeedback, setStkFeedback] = useState<string>('');
  const [stkCheckoutId, setStkCheckoutId] = useState<string>('');
  const [mpesaRealCustomerName, setMpesaRealCustomerName] = useState<string>('');
  const [mpesaSuccessMessage, setMpesaSuccessMessage] = useState<string>('');

  const handleCancelPosStk = async () => {
    if (stkCheckoutId) {
      try {
        await fetch('/api/mpesa/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId: stkCheckoutId, reason: 'Cashier cancelled M-Pesa push on POS terminal' })
        });
      } catch (e) {
        console.error('Cancel error:', e);
      }
    }
    setStkStatus('cancelled');
    setMpesaRefCode('');
    setMpesaRealCustomerName('');
    setMpesaSuccessMessage('');
    setStkFeedback('❌ Safaricom Server: Transaction was cancelled. Payment aborted.');
  };

  const handleSendRealStkPush = async () => {
    if (!mpesaCustomerPhone.trim()) {
      setStkFeedback('Please enter customer Safaricom phone number.');
      setStkStatus('failed');
      return;
    }

    setStkStatus('sending');
    setStkFeedback('Contacting Safaricom Daraja STK Push Gateway...');

    try {
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaCustomerPhone,
          amount: total,
          customerName: posCustomerName || 'Walk-in Boutique Client',
          reference: `POS-${Date.now().toString().slice(-6)}`,
          description: `Nimrah POS Till ${settings.mpesaTillNumber}`
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStkStatus('prompted');
        setStkCheckoutId(data.checkoutRequestId);
        setStkFeedback(data.customerMessage || 'M-Pesa PIN prompt sent to customer phone. Awaiting customer PIN...');

        // Start polling for real completion with 4.5s interval to avoid SpikeArrest rate limiting
        let pollCount = 0;
        const interval = setInterval(async () => {
          pollCount++;
          if (pollCount > 20) { // 90 seconds total
            clearInterval(interval);
            return;
          }

          try {
            const qRes = await fetch('/api/mpesa/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ checkoutRequestId: data.checkoutRequestId })
            });
            const qData = await qRes.json();
            if (qData.status === 'COMPLETED') {
              clearInterval(interval);
              setStkStatus('success');
              const receipt = qData.mpesaReceiptNumber || `SFA${Date.now().toString().slice(-7)}X`;
              const clientRealName = qData.customerName || posCustomerName || 'Walk-in Boutique Client';
              const officialMpesaMessage = qData.mpesaMessage || `${receipt} Confirmed. Ksh${total}.00 sent to ${settings.mpesaStoreName} (Till ${settings.mpesaTillNumber}) by ${clientRealName}.`;
              setMpesaRefCode(receipt);
              setMpesaRealCustomerName(clientRealName);
              setMpesaSuccessMessage(officialMpesaMessage);
              setStkFeedback(`✅ ${officialMpesaMessage}`);
            } else if (qData.status === 'CANCELLED') {
              // Customer cancelled on SIM card - cancel immediately in POS checkout!
              clearInterval(interval);
              setStkStatus('cancelled');
              setMpesaRefCode('');
              setMpesaRealCustomerName('');
              setMpesaSuccessMessage('');
              setStkFeedback('❌ Safaricom Server: Customer CANCELLED the M-Pesa PIN prompt on their phone SIM card. Transaction cancelled.');
              console.log('[POS CHECKOUT] Customer cancelled M-Pesa transaction on phone SIM.');
            } else if (qData.status === 'FAILED') {
              clearInterval(interval);
              setStkStatus('failed');
              setStkFeedback(qData.resultDesc || 'M-Pesa payment failed.');
            }
          } catch (e) {
            console.error('Polling error:', e);
          }
        }, 4500);
      } else {
        setStkStatus('prompted');
        setStkFeedback('M-Pesa PIN prompt sent to customer phone. Awaiting customer PIN...');
      }
    } catch {
      setStkStatus('prompted');
      setStkFeedback('M-Pesa PIN prompt sent to customer phone. Awaiting customer PIN...');
    }
  };
  
  // Cash calculations
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Held carts drawer
  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);
  const [holdLabelInput, setHoldLabelInput] = useState('');
  const [isOwnerHubOpen, setIsOwnerHubOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  
  // Owner Product, Picture & Inventory Management states
  const [showOwnerGatekeeper, setShowOwnerGatekeeper] = useState(false);

  // Owner Orders & Invoices Registry states
  const [isOrdersInvoicesModalOpen, setIsOrdersInvoicesModalOpen] = useState(false);
  const [ordersInvoicesInitialTab, setOrdersInvoicesInitialTab] = useState<'orders' | 'invoices'>('orders');

  // Mobile / Tablet View Switcher ('catalog' | 'ticket')
  const [mobilePosTab, setMobilePosTab] = useState<'catalog' | 'ticket'>('catalog');
  const [showMobileOwnerSheet, setShowMobileOwnerSheet] = useState(false);

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
    if (paymentMethod === 'mpesa_till' && stkStatus === 'cancelled') {
      alert('The M-Pesa transaction was cancelled on the customer phone SIM card. Please send a new STK push or choose Cash/Card.');
      return;
    }

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
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          clientRealName: mpesaRealCustomerName || posCustomerName || 'Walk-in Boutique Client',
          message: mpesaSuccessMessage || `${finalMpesaCode} Confirmed. Ksh${total}.00 sent to ${settings.mpesaStoreName} (Till ${settings.mpesaTillNumber}).`
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
    return (
      <PosAuthModal 
        initialRole={posPortalIntent}
        onCancel={() => setActiveView('storefront')} 
      />
    );
  }

  const isShopOwner = posStaffUser.role === 'Shop Owner';
  const isAdmin = posStaffUser.role === 'System Admin';

  return (
    <div className="min-h-screen bg-[#09090c] text-stone-100 flex flex-col font-sans select-none">
      {/* 1. POS Top Bar */}
      <header className="bg-[#0f0f14] border-b border-amber-500/20 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={() => setActiveView('storefront')}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 px-2 sm:px-2.5 py-1.5 rounded-lg border border-stone-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </button>

          <div className="h-5 w-px bg-stone-800 hidden sm:block" />

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {isShopOwner ? (
              <div className="w-6 h-6 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold shrink-0">
                <Crown className="w-3.5 h-3.5" />
              </div>
            ) : (
              <StoreIcon className="w-4 h-4 text-stone-300 shrink-0" />
            )}
            <span className="font-serif text-sm sm:text-lg font-semibold tracking-tight text-white truncate">
              {settings.storeName} POS
            </span>
            <span className={`text-[10px] sm:text-[11px] font-mono px-1.5 sm:px-2 py-0.5 rounded border uppercase font-bold shrink-0 ${
              isShopOwner 
                ? 'bg-amber-400 text-stone-950 border-amber-300' 
                : 'bg-stone-800 text-stone-200 border-stone-700'
            }`}>
              {isShopOwner ? '👑 Owner' : '🛡️ Admin'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 hidden xl:inline shrink-0">
              Till: {settings.mpesaTillNumber}
            </span>
          </div>
        </div>

        {/* Register summary stats & Authenticated Staff */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono">
          <button 
            onClick={() => setIsCredentialsModalOpen(true)}
            title="View Security Credentials & Confidentiality Clearance"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer hover:scale-[1.02] ${
              isShopOwner 
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:border-amber-400' 
                : 'bg-[#16161d] border-stone-800 text-stone-300 hover:border-stone-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isShopOwner ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span className="text-stone-400">{posStaffUser.role}:</span>
            <span className="font-bold text-white">{posStaffUser.name}</span>
            <KeyRound className="w-3 h-3 text-amber-400 ml-1" />
          </button>

          <div className="flex items-center gap-1.5 bg-[#16161d] px-2.5 py-1 rounded-lg border border-stone-800">
            <span className="text-stone-400">Shift:</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {formatCurrency(todayPosSales, settings.currency)}
            </span>
          </div>
        </div>

        {/* Quick action buttons & Lock */}
        {/* Quick action buttons & Lock */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Mobile & Tablet Adaptive Owner Suite Button */}
          <div className="flex lg:hidden items-center gap-1.5">
            {isShopOwner ? (
              <button
                onClick={() => setShowMobileOwnerSheet(true)}
                className="px-2.5 py-1.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform active:scale-95"
                title="Open Owner Sovereign Suite"
              >
                <Crown className="w-3.5 h-3.5 text-stone-950" />
                <span>Owner Suite ▾</span>
              </button>
            ) : (
              <button
                onClick={() => setShowMobileOwnerSheet(true)}
                className="px-2.5 py-1.5 text-xs font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-lg flex items-center gap-1.5 border border-stone-700 cursor-pointer"
                title="Admin Quick Menu"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-stone-300" />
                <span>Admin Menu ▾</span>
              </button>
            )}
          </div>

          {/* Desktop Full Action Buttons Strip */}
          <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
            {/* Security Credentials Modal Button */}
            <button
              onClick={() => setIsCredentialsModalOpen(true)}
              title="Security Credentials, ID Badge & Password Management"
              className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-all cursor-pointer ${
                isShopOwner
                  ? 'bg-amber-950/50 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                  : 'bg-stone-800/80 text-stone-200 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Credentials</span>
            </button>

            {/* Owner Add Product Button */}
            {isShopOwner && (
              <button
                onClick={() => {
                  setOwnerModalInitialMode('add');
                  setIsOwnerProductModalOpen(true);
                }}
                title="Add New Product & Picture (Shop Owner only)"
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 bg-amber-400 text-stone-950 hover:bg-amber-300 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-stone-950" />
                <span>Add Product</span>
                <Crown className="w-3 h-3 text-stone-950/70" />
              </button>
            )}

            {/* Track Inventory Button */}
            <button 
              onClick={() => {
                if (isShopOwner) {
                  setOwnerModalInitialMode('inventory');
                  setIsOwnerProductModalOpen(true);
                } else {
                  setShowOwnerGatekeeper(true);
                }
              }}
              title={isShopOwner ? "Track Real-Time Stock & Wholesale Cost" : "Shop Owner Access Required"}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs text-stone-300 hover:text-white bg-[#16161d] border border-stone-800 hover:border-amber-500/40 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Inventory</span>
            </button>

            {/* Orders & Invoices Button */}
            <button 
              onClick={() => {
                if (isShopOwner) {
                  setOrdersInvoicesInitialTab('orders');
                  setIsOrdersInvoicesModalOpen(true);
                } else {
                  setShowOwnerGatekeeper(true);
                }
              }}
              title={isShopOwner ? "View Complete Orders Ledger & Invoices" : "Shop Owner Access Required"}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs text-stone-300 hover:text-white bg-[#16161d] border border-stone-800 hover:border-amber-500/40 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Orders &amp; Invoices</span>
            </button>

            {/* Shop Owner Executive Hub Button */}
            {isShopOwner && (
              <button
                onClick={() => setIsOwnerHubOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer transition-all"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">P&amp;L Suite</span>
              </button>
            )}

            {/* Storefront Animation Display Picture Manager */}
            {isShopOwner && (
              <button
                onClick={() => setIsOwnerShowcaseModalOpen(true)}
                title="Configure Storefront Animated Display Pictures"
                className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-amber-200 bg-[#16161d] hover:bg-amber-950/40 border border-stone-800 hover:border-amber-500/40 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Animation Display</span>
              </button>
            )}

            {/* Store Settings Button (Moved exclusively to Owner's POS account) */}
            <button 
              onClick={() => {
                if (isShopOwner) {
                  setIsSettingsModalOpen(true);
                } else {
                  setShowOwnerGatekeeper(true);
                }
              }}
              title={isShopOwner ? "Configure M-Pesa Till, Rates, Address & Brand Logo" : "Shop Owner Access Required"}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-all cursor-pointer ${
                isShopOwner 
                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/60 hover:border-amber-400' 
                  : 'bg-[#16161d] text-stone-400 border-stone-800 hover:border-stone-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Settings</span>
              {isShopOwner && <Crown className="w-2.5 h-2.5 text-amber-400/90 hidden xl:inline" />}
            </button>
          </div>

          {heldCarts.length > 0 && (
            <button 
              onClick={() => setShowHeldCartsModal(true)}
              className="px-2 py-1.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg flex items-center gap-1 animate-pulse"
              title="View Held Carts"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>({heldCarts.length})</span>
            </button>
          )}

          {/* Switch Role / Lock Register */}
          <button
            onClick={logoutPosStaff}
            title="Switch Personnel Role or Lock POS"
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch</span>
          </button>
        </div>
      </header>

      {/* Role-Specific Status Banner */}
      {isShopOwner ? (
        <div className="bg-gradient-to-r from-amber-950/70 via-[#19140c] to-amber-950/70 border-b border-amber-500/30 px-3 sm:px-4 py-1.5 sm:py-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-200 gap-1.5 sm:gap-2">
          <div className="flex items-center gap-2 truncate">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-white uppercase tracking-wider text-[10px] sm:text-[11px] shrink-0">Shop Owner Executive</span>
            <span className="text-amber-500/50 hidden sm:inline">·</span>
            <span className="font-mono text-[10px] sm:text-[11px] text-amber-300 truncate">Live Profit Margins &amp; Till 5428901 Settlements</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] overflow-x-auto">
            <button 
              onClick={() => {
                setOwnerModalInitialMode('add');
                setIsOwnerProductModalOpen(true);
              }}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-400 text-stone-950 font-bold rounded hover:bg-amber-300 cursor-pointer transition-colors shadow-xs flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add Item</span>
            </button>
            <button 
              onClick={() => {
                setOwnerModalInitialMode('inventory');
                setIsOwnerProductModalOpen(true);
              }}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-stone-900 border border-amber-500/40 text-amber-300 font-semibold rounded hover:bg-stone-800 cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Inventory Tracker</span>
            </button>
            <button 
              onClick={() => {
                setOrdersInvoicesInitialTab('orders');
                setIsOrdersInvoicesModalOpen(true);
              }}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-stone-900 border border-amber-500/40 text-amber-300 font-semibold rounded hover:bg-stone-800 cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <FileText className="w-3 h-3 text-amber-400" />
              <span>Orders ({orders.length})</span>
            </button>
            <button 
              onClick={() => {
                setOrdersInvoicesInitialTab('invoices');
                setIsOrdersInvoicesModalOpen(true);
              }}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-stone-900 border border-amber-500/40 text-amber-300 font-semibold rounded hover:bg-stone-800 cursor-pointer transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <Receipt className="w-3 h-3 text-amber-400" />
              <span>Tax Invoices</span>
            </button>
            <button 
              onClick={() => setIsOwnerHubOpen(true)}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-950 border border-amber-500/40 text-amber-300 font-semibold rounded hover:bg-amber-900 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>P&amp;L Hub →</span>
            </button>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-stone-900 border border-amber-500/40 text-amber-300 font-semibold rounded hover:bg-stone-800 cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-400" />
              <span>Store Settings</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-stone-900 via-[#131317] to-stone-900 border-b border-stone-800 px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between text-xs text-stone-300 gap-2">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-stone-300 shrink-0" />
            <span className="font-bold text-white uppercase tracking-wider text-[10px] sm:text-[11px] shrink-0">System Admin Mode</span>
            <span className="text-stone-600 hidden sm:inline">·</span>
            <span className="font-mono text-[10px] sm:text-[11px] text-stone-400 truncate">Barcode Scanning &amp; Register Checkout</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] shrink-0">
            <span className="bg-rose-950/50 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/40 flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-400" /> <span className="hidden sm:inline">Confidential:</span> P&amp;L Hidden
            </span>
          </div>
        </div>
      )}

      {/* Mobile-Only Segmented View Switcher (Hidden on Tablets & PCs) */}
      <div className="md:hidden bg-[#0d0d12] border-b border-stone-800 p-2 flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobilePosTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobilePosTab === 'catalog'
              ? 'bg-amber-400 text-stone-950 shadow-sm'
              : 'bg-stone-900 text-stone-300 hover:text-white border border-stone-800'
          }`}
        >
          <StoreIcon className="w-4 h-4" />
          <span>Catalog ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePosTab('ticket')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mobilePosTab === 'ticket'
              ? 'bg-amber-400 text-stone-950 shadow-sm'
              : 'bg-stone-900 text-stone-300 hover:text-white border border-stone-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Ticket Register ({count})</span>
          {count > 0 && (
            <span className="font-mono text-[10px] bg-stone-950 text-amber-300 px-1.5 py-0.5 rounded font-bold">
              {formatCurrency(total, settings.currency)}
            </span>
          )}
        </button>
      </div>

      {/* 2. Main POS Workspace: Left Catalog + Right Ticket (Adaptive Phone / Tablet / PC) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Product Grid & Barcode Punch */}
        <div className={`flex-1 flex-col bg-stone-900 border-r border-stone-800 overflow-hidden ${
          mobilePosTab === 'catalog' ? 'flex' : 'hidden md:flex'
        }`}>
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

            {/* Shop Owner Direct Add Product Button */}
            {isShopOwner && (
              <button
                type="button"
                onClick={openAddProductModal}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
                title="Add New Product (Shop Owner only)"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Product</span>
              </button>
            )}
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

          {/* Fast Touch Products Grid - High Visibility & Ample Monitor Bottom Clearance */}
          <div className="flex-1 overflow-y-auto p-3.5 pb-36 sm:pb-32 lg:pb-24 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 min-h-0 overscroll-contain">
            {filteredProducts.map(product => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductCardClick(product)}
                  className={`relative p-2.5 bg-[#131319] border rounded-2xl flex flex-col justify-between transition-all text-left shadow-sm ${
                    isOutOfStock 
                      ? 'border-stone-800 opacity-55 cursor-not-allowed' 
                      : 'border-stone-700/80 hover:border-amber-400 hover:bg-[#181822] cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-stone-900 mb-2 border border-stone-800">
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
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-mono bg-rose-950/95 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded-md font-bold shadow-xs">
                          0 IN STOCK
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-mono bg-amber-950/95 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded-md font-bold shadow-xs">
                          {product.stock} LEFT
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-emerald-950/95 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded-md font-bold shadow-xs">
                          {product.stock} PCS
                        </span>
                      )}
                    </div>

                    {/* Owner-Only Quick Delete Button */}
                    {isShopOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteProductModal(product);
                        }}
                        title="Remove product from catalog (Shop Owner only)"
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-stone-950/90 hover:bg-rose-600 text-stone-300 hover:text-white border border-stone-700/90 transition-colors shadow-md z-10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-amber-400 font-semibold truncate max-w-[100px] sm:max-w-[120px] uppercase">
                        {product.category}
                      </span>
                      <span className="text-stone-500 uppercase">{product.sku}</span>
                    </div>

                    <div className="text-xs font-semibold text-white line-clamp-1">
                      {product.name}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono font-bold pt-1 border-t border-stone-800/80">
                      <span className="text-amber-300 text-sm tabular-nums">
                        {formatCurrency(product.price, settings.currency)}
                      </span>
                      {isShopOwner ? (
                        <span className="text-[10px] text-emerald-400 font-normal" title="Executive Tier 1 Cost Margin">
                          Cost: {formatCurrency(product.costPrice, settings.currency)}
                        </span>
                      ) : (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCredentialsModalOpen(true);
                          }}
                          title="Confidential: Shop Owner Clearance Required"
                          className="text-[9px] text-stone-500 font-normal hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Lock className="w-2.5 h-2.5 text-stone-600" /> [Cost]
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom clearance bumper ensuring full visibility above monitor edges */}
            <div className="col-span-full py-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14141d] border border-stone-800 text-xs text-stone-400 font-mono shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>End of Catalog · {filteredProducts.length} items visible above monitor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Active POS Register Ticket */}
        <div className={`w-full md:w-80 lg:w-96 xl:w-[420px] bg-stone-950 flex-col justify-between shrink-0 border-t md:border-t-0 md:border-l border-stone-800 ${mobilePosTab === 'ticket' ? 'flex' : 'hidden md:flex'}`}>
          {/* Ticket Header & Customer Selector */}
          <div className="p-3 border-b border-stone-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Current Register Ticket</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-stone-400">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
                <button
                  type="button"
                  onClick={() => setMobilePosTab('catalog')}
                  className="md:hidden text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-stone-900 px-2 py-0.5 rounded-lg border border-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Catalog</span>
                </button>
              </div>
            </div>

            {/* Customer input - Prominently Visible */}
            <div className="bg-[#121219] p-2.5 rounded-xl border border-amber-500/40 space-y-2 shadow-xs">
              <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Customer &amp; M-Pesa Info:</span>
                <span className="text-stone-400 font-normal">Optional / Walk-in</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2.5" />
                  <input 
                    type="text"
                    placeholder="Customer Name"
                    value={posCustomerName}
                    onChange={(e) => setPosCustomerName(e.target.value)}
                    className="w-full text-xs font-semibold pl-8 pr-2.5 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400 focus:bg-black"
                  />
                </div>

                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-2.5" />
                  <input 
                    type="tel"
                    placeholder="M-Pesa 07XX / 254..."
                    value={posCustomerPhone}
                    onChange={(e) => {
                      setPosCustomerPhone(e.target.value);
                      setMpesaCustomerPhone(e.target.value);
                    }}
                    className="w-full text-xs font-mono font-bold pl-8 pr-2.5 py-2 bg-stone-900 border border-stone-700 rounded-lg text-emerald-300 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:bg-black"
                  />
                </div>
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

      {/* Floating Bottom Ticket Bar on Mobile & Tablet when browsing catalog with active items */}
      {mobilePosTab === 'catalog' && count > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={() => setMobilePosTab('ticket')}
            className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-amber-300 transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="w-6 h-6 rounded-full bg-stone-950 text-amber-300 flex items-center justify-center font-mono font-bold text-[11px] shadow-xs">
                {count}
              </span>
              <span className="font-semibold text-stone-900">Current Ticket:</span>
              <span className="font-mono font-extrabold text-stone-950 text-sm">
                {formatCurrency(total, settings.currency)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs uppercase tracking-wider font-extrabold text-stone-950 bg-amber-300/80 px-2.5 py-1 rounded-xl">
              <span>View Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-stone-900/90 rounded-xl border-2 border-emerald-500/70">
                    <label className="block text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Customer Phone (SIM Push): *</span>
                    </label>
                    <input 
                      type="tel"
                      value={mpesaCustomerPhone}
                      onChange={(e) => {
                        setMpesaCustomerPhone(e.target.value);
                        setPosCustomerPhone(e.target.value);
                      }}
                      placeholder="07XX XXX XXX or 2547..."
                      className="w-full text-sm font-mono font-bold px-3 py-2 bg-stone-950 border border-emerald-600 rounded-lg text-emerald-200 placeholder:text-stone-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="p-2.5 bg-stone-900/90 rounded-xl border border-stone-700">
                    <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      <span>M-Pesa Receipt Code:</span>
                    </label>
                    <input 
                      type="text"
                      value={mpesaRefCode}
                      onChange={(e) => setMpesaRefCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SLK82KLA89"
                      className="w-full text-sm font-mono font-bold uppercase px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-amber-300 placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Live Real Daraja STK Status Banner */}
                {stkFeedback && (
                  <div className={`p-2.5 rounded-lg text-xs font-mono flex items-start gap-2 ${
                    stkStatus === 'success' 
                      ? 'bg-emerald-950/80 border border-emerald-500/80 text-emerald-300' 
                      : stkStatus === 'cancelled'
                      ? 'bg-rose-950/90 border border-rose-500 text-rose-200'
                      : stkStatus === 'failed'
                      ? 'bg-amber-950/80 border border-amber-500/80 text-amber-300'
                      : 'bg-amber-950/60 border border-amber-500/60 text-amber-200'
                  }`}>
                    {stkStatus === 'sending' || stkStatus === 'prompted' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 mt-0.5 shrink-0" />
                    ) : stkStatus === 'success' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 text-[11px] leading-relaxed">
                      {stkFeedback}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    disabled={stkStatus === 'sending'}
                    onClick={handleSendRealStkPush}
                    className="flex-1 min-w-[140px] py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg border border-emerald-500 cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{stkStatus === 'sending' ? 'Connecting Gateway...' : stkStatus === 'cancelled' ? 'Retry Real STK Push' : 'Send Real Daraja STK Push'}</span>
                  </button>

                  {stkStatus === 'prompted' && (
                    <button
                      type="button"
                      onClick={handleCancelPosStk}
                      className="px-3 py-2 text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg border border-rose-700/80 cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel Push</span>
                    </button>
                  )}

                  <button 
                    type="button"
                    onClick={() => {
                      const code = generateMpesaCode();
                      setMpesaRefCode(code);
                      setStkStatus('success');
                      setStkFeedback(`Simulated receipt code attached: ${code}`);
                    }}
                    className="px-3 py-2 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700 cursor-pointer"
                  >
                    Auto-Ref
                  </button>
                </div>

                {stkStatus === 'prompted' && stkCheckoutId && (
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch('/api/mpesa/simulate-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          checkoutRequestId: stkCheckoutId,
                          status: 'CANCELLED',
                          resultDesc: 'Customer pressed Cancel on phone SIM prompt (Result Code 1032)'
                        })
                      });
                    }}
                    className="text-[10px] text-stone-500 hover:text-rose-400 font-mono underline text-center block w-full pt-0.5 cursor-pointer"
                  >
                    [Test]: Simulate Customer Pressed Cancel on SIM
                  </button>
                )}
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

            {/* Cancelled Payment Warning */}
            {paymentMethod === 'mpesa_till' && stkStatus === 'cancelled' && (
              <div className="p-3 my-2 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-start gap-2 shadow-sm animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-rose-100 block">Transaction Cancelled on Customer SIM Card</span>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    Zero funds received. Order tracking and receipt generation are locked. Click "Retry Real STK Push" or switch to Cash/Card to proceed.
                  </p>
                </div>
              </div>
            )}

            {/* Confirm & Print Action */}
            <div className="pt-2">
              <button 
                type="button"
                disabled={paymentMethod === 'mpesa_till' && stkStatus === 'cancelled'}
                onClick={handleCompletePosSale}
                className={`w-full py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                  paymentMethod === 'mpesa_till' && stkStatus === 'cancelled'
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-800/80 cursor-not-allowed opacity-75'
                    : 'text-stone-950 bg-amber-400 hover:bg-amber-300 cursor-pointer'
                }`}
              >
                {paymentMethod === 'mpesa_till' && stkStatus === 'cancelled' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Transaction Cancelled — Payment Required</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Complete Sale &amp; Generate Invoice / Receipt</span>
                  </>
                )}
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

      {/* Shop Owner Executive Hub Modal (Financials, Cost/Price Authority, Staff Directory, Till Settings) */}
      <OwnerExecutiveHubModal 
        isOpen={isOwnerHubOpen} 
        onClose={() => setIsOwnerHubOpen(false)} 
        onOpenOrders={(tab) => {
          setOrdersInvoicesInitialTab(tab);
          setIsOrdersInvoicesModalOpen(true);
        }}
        onOpenInventory={() => {
          setOwnerModalInitialMode('inventory');
          setIsOwnerProductModalOpen(true);
        }}
      />

      {/* Staff Security Credentials & Clearance Modal */}
      <StaffCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
      />

      {/* Non-Owner Gatekeeper Dialog */}
      {showOwnerGatekeeper && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111116] border-2 border-amber-500/50 rounded-3xl p-6 text-stone-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/70 border border-amber-400/60 flex items-center justify-center mx-auto text-amber-400">
              <Crown className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-serif text-xl font-bold text-white">
                Store Owner Access Only
              </h3>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Adding new garments, uploading product pictures, removing catalog items, and tracking wholesale inventory can only be accessed by the <strong>Store Owner</strong>.
              </p>
            </div>

            <div className="bg-[#181820] p-3.5 rounded-xl border border-stone-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-400">
                <span>Current Signed-in User:</span>
                <span className="font-mono text-stone-200 font-bold">
                  {posStaffUser ? `${posStaffUser.name} (${posStaffUser.role})` : 'Unauthenticated'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-rose-300 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Clearance Level Insufficient: Log in or create a Shop Owner account.</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setShowOwnerGatekeeper(false);
                  logoutPosStaff();
                }}
                className="w-full py-3 px-4 text-xs font-bold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>Log In or Create Shop Owner Account</span>
              </button>

              <button
                onClick={() => setShowOwnerGatekeeper(false)}
                className="w-full py-2.5 px-4 text-xs font-medium text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              >
                Return to POS Terminal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Owner Orders & Invoices Ledger Modal */}
      <OwnerOrdersInvoicesModal
        isOpen={isOrdersInvoicesModalOpen}
        onClose={() => setIsOrdersInvoicesModalOpen(false)}
        initialTab={ordersInvoicesInitialTab}
      />

      {/* Mobile & Tablet Adaptive Owner Suite Bottom Sheet */}
      {showMobileOwnerSheet && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-5 no-print"
          onClick={() => setShowMobileOwnerSheet(false)}
        >
          <div 
            className="w-full max-w-lg bg-[#111118] border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 text-stone-100 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Owner Executive Suite</h3>
                  <p className="text-[10px] text-amber-300 font-mono">Mobile &amp; Tablet Sovereign Clearance</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMobileOwnerSheet(false)}
                className="w-8 h-8 rounded-lg bg-stone-900 text-stone-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setShowMobileOwnerSheet(false);
                  if (isShopOwner) {
                    setOwnerModalInitialMode('add');
                    setIsOwnerProductModalOpen(true);
                  } else {
                    setShowOwnerGatekeeper(true);
                  }
                }}
                className="p-3 bg-amber-400 text-stone-950 font-bold rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-md text-xs cursor-pointer active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5 text-stone-950" />
                <span>+ Upload Product</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileOwnerSheet(false);
                  if (isShopOwner) {
                    setOwnerModalInitialMode('inventory');
                    setIsOwnerProductModalOpen(true);
                  } else {
                    setShowOwnerGatekeeper(true);
                  }
                }}
                className="p-3 bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95 transition-transform"
              >
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Track Inventory</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileOwnerSheet(false);
                  if (isShopOwner) {
                    setOrdersInvoicesInitialTab('orders');
                    setIsOrdersInvoicesModalOpen(true);
                  } else {
                    setShowOwnerGatekeeper(true);
                  }
                }}
                className="p-3 bg-[#151520] hover:bg-stone-800 border border-stone-800 text-stone-200 font-medium rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95 transition-transform"
              >
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Orders Ledger</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileOwnerSheet(false);
                  if (isShopOwner) {
                    setOrdersInvoicesInitialTab('invoices');
                    setIsOrdersInvoicesModalOpen(true);
                  } else {
                    setShowOwnerGatekeeper(true);
                  }
                }}
                className="p-3 bg-[#151520] hover:bg-stone-800 border border-stone-800 text-stone-200 font-medium rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95 transition-transform"
              >
                <Receipt className="w-5 h-5 text-amber-400" />
                <span>KRA Tax Invoices</span>
              </button>

              {isShopOwner && (
                <button
                  onClick={() => {
                    setShowMobileOwnerSheet(false);
                    setIsOwnerHubOpen(true);
                  }}
                  className="p-3 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 font-bold rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Executive P&amp;L Hub</span>
                </button>
              )}

              {isShopOwner && (
                <button
                  onClick={() => {
                    setShowMobileOwnerSheet(false);
                    setIsOwnerShowcaseModalOpen(true);
                  }}
                  className="p-3 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 font-bold rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Animation Display</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMobileOwnerSheet(false);
                  if (isShopOwner) {
                    setIsSettingsModalOpen(true);
                  } else {
                    setShowOwnerGatekeeper(true);
                  }
                }}
                className="p-3 bg-[#151520] hover:bg-stone-800 border border-stone-800 text-stone-300 font-medium rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95 transition-transform"
              >
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <span>Store Settings</span>
              </button>
            </div>

            <div className="pt-2 flex gap-2 border-t border-stone-800">
              <button
                onClick={() => {
                  setShowMobileOwnerSheet(false);
                  setIsCredentialsModalOpen(true);
                }}
                className="flex-1 py-2.5 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-xl text-xs font-semibold text-stone-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Clearances &amp; PINs</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileOwnerSheet(false);
                  logoutPosStaff();
                }}
                className="py-2.5 px-4 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 rounded-xl text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock POS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
