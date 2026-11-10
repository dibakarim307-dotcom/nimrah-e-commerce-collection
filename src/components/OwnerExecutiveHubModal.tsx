import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Settings, 
  ShieldCheck, 
  Tag, 
  Save, 
  Check, 
  CreditCard, 
  Building2, 
  Receipt, 
  Clock, 
  Percent, 
  HelpCircle,
  SlidersHorizontal,
  Sparkles,
  Plus
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';
import { Product } from '../types';

interface OwnerExecutiveHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrders?: (tab: 'orders' | 'invoices') => void;
  onOpenInventory?: () => void;
}

export const OwnerExecutiveHubModal: React.FC<OwnerExecutiveHubModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenOrders,
  onOpenInventory
}) => {
  const { 
    products, 
    orders, 
    settings, 
    updateProduct, 
    updateSettings, 
    posStaffUser, 
    setIsSettingsModalOpen,
    showcaseSlides,
    setIsOwnerShowcaseModalOpen
  } = useStore();

  const [activeTab, setActiveTab] = useState<'financials' | 'pricing' | 'staff' | 'till_tax' | 'display'>('financials');
  const [editingProducts, setEditingProducts] = useState<Product[]>(products);
  const [savedNotice, setSavedNotice] = useState(false);

  // Store settings edits
  const [tillNumber, setTillNumber] = useState(settings.mpesaTillNumber);
  const [storeName, setStoreName] = useState(settings.storeName);
  const [kraPin, setKraPin] = useState(settings.kraPin);
  const [vatRate, setVatRate] = useState(settings.vatRate.toString());
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  if (!isOpen) return null;

  // Real-time financial calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  
  // Calculate Cost of Goods Sold (COGS) and Gross Profit
  let totalCogs = 0;
  orders.forEach(order => {
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const cost = prod ? prod.costPrice : (item.product?.costPrice || item.unitPrice * 0.55);
      totalCogs += cost * item.quantity;
    });
  });

  const totalGrossProfit = totalRevenue - totalCogs;
  const profitMarginPercent = totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // M-Pesa vs Cash vs Card breakdown
  const mpesaOrders = orders.filter(o => o.payment.method === 'mpesa_till' || o.payment.method === 'split');
  const mpesaTotal = mpesaOrders.reduce((sum, o) => sum + (o.payment.method === 'split' ? o.total / 2 : o.total), 0);

  const cashOrders = orders.filter(o => o.payment.method === 'cash' || o.payment.method === 'split');
  const cashTotal = cashOrders.reduce((sum, o) => sum + (o.payment.method === 'split' ? o.total / 2 : o.total), 0);

  const totalTaxCollected = orders.reduce((sum, o) => sum + o.tax, 0);

  // Pricing edits handlers
  const handlePriceChange = (productId: string, field: 'price' | 'costPrice', val: number) => {
    setEditingProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, [field]: val };
      }
      return p;
    }));
  };

  const handleSavePrices = () => {
    editingProducts.forEach(p => {
      updateProduct(p);
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      mpesaTillNumber: tillNumber,
      storeName,
      kraPin,
      vatRate: parseFloat(vatRate) || 0.16,
      contactEmail
    });
    setSettingsSavedNotice(true);
    setTimeout(() => setSettingsSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none">
      <div 
        className="relative bg-[#0d0d12] border-2 border-amber-500/50 rounded-3xl max-w-5xl w-full shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#14141c] border-b border-amber-500/20 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-950/40 font-bold">
              <Crown className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  Shop Owner Executive Suite
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-bold uppercase flex items-center gap-1">
                  🔒 Confidential · Executive Tier 1
                </span>
              </div>
              <p className="text-xs text-stone-400 font-light">
                {posStaffUser?.name} ({posStaffUser?.badgeNumber}) · Sovereign Unrestricted Control · Admin Terminals Redacted
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-full border border-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-[#101017] border-b border-stone-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('financials')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'financials'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>P&amp;L &amp; Financial Health</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Wholesale Cost &amp; Price Overrides</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personnel &amp; Staff Access Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('till_tax')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'till_tax'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Till 5428901 &amp; KRA Tax Config</span>
          </button>

          <button
            onClick={() => setActiveTab('display')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'display'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Storefront Animation Display</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-100">
          {/* Executive Security Watermark Banner */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Classified Executive Domain
              </span>
              <span className="text-stone-500">·</span>
              <span className="text-stone-300">Wholesale cost margins &amp; merchant Till balances are masked on System Admin registers.</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase shrink-0">
              Clearance: Sovereign Tier 1
            </span>
          </div>

          {/* TAB 1: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              {/* Top 4 KPI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#14141c] rounded-2xl border border-amber-500/20 space-y-1">
                  <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Total Gross Revenue</span>
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums">
                    {formatCurrency(totalRevenue, settings.currency)}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    {orders.length} transactions settled
                  </div>
                </div>

                <div className="p-4 bg-[#14141c] rounded-2xl border border-emerald-500/20 space-y-1">
                  <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Estimated Gross Profit</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                    {formatCurrency(totalGrossProfit, settings.currency)}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono">
                    Overall Margin: <strong className="text-emerald-400">{profitMarginPercent}%</strong>
                  </div>
                </div>

                <div className="p-4 bg-[#14141c] rounded-2xl border border-amber-500/20 space-y-1">
                  <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
                    <span>M-Pesa Till 5428901</span>
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                    {formatCurrency(mpesaTotal, settings.currency)}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    Instant Bank/Till settlement
                  </div>
                </div>

                <div className="p-4 bg-[#14141c] rounded-2xl border border-stone-800 space-y-1">
                  <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Cash Register Drawer</span>
                    <Receipt className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-stone-200 tabular-nums">
                    {formatCurrency(cashTotal, settings.currency)}
                  </div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    In-store Shop G7 cash
                  </div>
                </div>
              </div>

              {/* COGS and KRA VAT Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-[#14141c] rounded-2xl border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="font-semibold text-sm text-white">Cost of Goods Sold (COGS)</span>
                    <span className="font-mono text-sm text-stone-300 font-bold">
                      {formatCurrency(totalCogs, settings.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-light leading-relaxed">
                    Based on wholesale manufacturing cost per piece (silk velvet, French zardozi beadwork, spun raw silk, and Italian amber perfume flacons).
                  </p>
                  <div className="pt-2 text-xs font-mono text-amber-300 flex items-center justify-between">
                    <span>Net Margin Retained:</span>
                    <span className="font-bold text-sm text-emerald-400">{profitMarginPercent}% Net Profit</span>
                  </div>
                </div>

                <div className="p-5 bg-[#14141c] rounded-2xl border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <span className="font-semibold text-sm text-white">KRA VAT Compliance (16%)</span>
                    <span className="font-mono text-sm text-amber-300 font-bold">
                      {formatCurrency(totalTaxCollected, settings.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-light leading-relaxed">
                    Automatically calculated and documented on each POS transaction for KRA PIN: <strong>{settings.kraPin}</strong>.
                  </p>
                  <div className="pt-2 text-xs font-mono text-stone-400 flex items-center justify-between">
                    <span>Tax Jurisdiction:</span>
                    <span>Kenya Revenue Authority (ETIMS Ready)</span>
                  </div>
                </div>
              </div>

              {/* Direct POS Ledger & Inventory Quick Jump */}
              <div className="p-4 bg-[#181824] rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Owner POS Operations: Orders, Invoices &amp; Stock</span>
                  </span>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Access complete customer transactions, reprint tax invoices, or update live inventory
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrders?.('orders');
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl transition-colors cursor-pointer"
                  >
                    View Orders
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrders?.('invoices');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 rounded-xl transition-colors cursor-pointer"
                  >
                    Tax Invoices
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenInventory?.();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Inventory
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & WHOLESALE COST EDITOR */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">Wholesale Cost &amp; Retail Price Authority</h3>
                  <p className="text-xs text-stone-400 font-light">
                    Only the Shop Owner can adjust cost baselines and retail prices. System Admins only have inventory quantity adjustment access.
                  </p>
                </div>
                <button
                  onClick={handleSavePrices}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
                >
                  {savedNotice ? <Check className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
                  <span>{savedNotice ? 'Prices Saved Successfully!' : 'Save Pricing Updates'}</span>
                </button>
              </div>

              <div className="bg-[#121217] rounded-2xl border border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181822] text-stone-400 font-mono text-[11px] border-b border-stone-800">
                      <tr>
                        <th className="py-3 px-4">Item Name &amp; Category</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Retail Price (KES)</th>
                        <th className="py-3 px-4">Wholesale Cost (KES)</th>
                        <th className="py-3 px-4">Unit Margin</th>
                        <th className="py-3 px-4">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                      {editingProducts.map(p => {
                        const unitMargin = p.price - p.costPrice;
                        const marginPct = p.price > 0 ? ((unitMargin / p.price) * 100).toFixed(0) : '0';
                        return (
                          <tr key={p.id} className="hover:bg-stone-900/40 transition-colors">
                            <td className="py-3 px-4 font-medium text-white">
                              <div>{p.name}</div>
                              <span className="text-[10px] text-amber-400 uppercase font-mono">{p.category}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-400">{p.sku}</td>
                            <td className="py-3 px-4">
                              <input 
                                type="number"
                                value={p.price}
                                onChange={(e) => handlePriceChange(p.id, 'price', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input 
                                type="number"
                                value={p.costPrice}
                                onChange={(e) => handlePriceChange(p.id, 'costPrice', parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-stone-300 font-mono focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                              +{formatCurrency(unitMargin, settings.currency)} ({marginPct}%)
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-300">{p.stock} units</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAFF DIRECTORY */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Authorized POS Personnel Directory</h3>
                <p className="text-xs text-stone-400 font-light">
                  Role assignments and branch access for Eastleigh 5th Street Shop G7.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#14141c] rounded-2xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Nimrah (Proprietor)</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-bold">
                      Shop Owner
                    </span>
                  </div>
                  <div className="text-xs text-stone-300 font-mono">nimrahcollection1@gmail.com</div>
                  <div className="text-[11px] text-stone-400">Badge: NC-OWN-01 · Eastleigh UBAH Shop G7</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Privileges: Full Unrestricted Sovereign Authority</div>
                </div>

                <div className="p-4 bg-[#14141c] rounded-2xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Diba Karim</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-bold">
                      Shop Owner
                    </span>
                  </div>
                  <div className="text-xs text-stone-300 font-mono">dibakarim307@gmail.com</div>
                  <div className="text-[11px] text-stone-400">Badge: NC-OWN-02 · Eastleigh UBAH Shop G7</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Privileges: Executive Financial Director</div>
                </div>

                <div className="p-4 bg-[#14141c] rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                      <ShieldCheck className="w-4 h-4 text-stone-300" />
                      <span>Store Administrator</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-700 text-stone-200">
                      System Admin
                    </span>
                  </div>
                  <div className="text-xs text-stone-300 font-mono">admin@nimrahcollection.co.ke</div>
                  <div className="text-[11px] text-stone-400">Badge: NC-ADM-01 · Eastleigh UBAH Shop G7</div>
                  <div className="text-[10px] text-stone-400 font-mono">Privileges: Operations, Stock Restock, Terminal Sales</div>
                </div>

                <div className="p-4 bg-[#14141c] rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-stone-400" />
                      <span>Fatuma K.</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-700 text-stone-200">
                      Lead Cashier
                    </span>
                  </div>
                  <div className="text-xs text-stone-300 font-mono">fatuma.eastleigh@nimrahcollection.co.ke</div>
                  <div className="text-[11px] text-stone-400">Badge: NC-CSH-02 · Eastleigh UBAH Shop G7</div>
                  <div className="text-[10px] text-stone-400 font-mono">Privileges: POS Checkout &amp; Receipt Issuance</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TILL 5428901 & KRA TAX */}
          {activeTab === 'till_tax' && (
            <form onSubmit={handleSaveSettings} className="space-y-5 max-w-xl">
              <div>
                <h3 className="text-base font-bold text-white">Payment Channel &amp; Tax Settlement Settings</h3>
                <p className="text-xs text-stone-400 font-light">
                  Configure official Lipa na M-Pesa Buy Goods Till and Kenya Revenue Authority PIN.
                </p>
              </div>

              <div className="space-y-4 bg-[#14141c] p-5 rounded-2xl border border-stone-800">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-300">
                    Lipa na M-Pesa Buy Goods Till Number *
                  </label>
                  <input 
                    type="text"
                    required
                    value={tillNumber}
                    onChange={(e) => setTillNumber(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-amber-300 focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <span className="text-[10px] text-stone-500 font-mono">Registered Merchant: NIMRAH COLLECTION</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-300">
                    KRA PIN (Tax Invoice Heading) *
                  </label>
                  <input 
                    type="text"
                    required
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-300">
                    VAT Rate (Decimal, e.g. 0.16 for 16%)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-300">
                    Official Boutique Invoicing Email
                  </label>
                  <input 
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  {settingsSavedNotice ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{settingsSavedNotice ? 'Settlement Settings Saved!' : 'Update Settlement & Tax Config'}</span>
                </button>

                <div className="pt-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 bg-stone-900 hover:bg-stone-800 border border-amber-500/30 text-amber-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    <span>Open Full Storefront &amp; M-Pesa Till Configuration</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 5: STOREFRONT ANIMATION DISPLAY MANAGEMENT */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-amber-950/40 via-[#181824] to-amber-950/20 rounded-2xl border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Sovereign Showcase Display Management</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Storefront Animated Craftsmanship Exhibition
                  </h3>
                  <p className="text-xs text-stone-300 font-light max-w-xl">
                    Configure the rotating picture slides, headlines, and storytelling that appear on your storefront showcase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOwnerShowcaseModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Upload &amp; Manage Display Pictures</span>
                </button>
              </div>

              {/* Active display pictures gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                  <span>Currently Active Display Pictures ({showcaseSlides.length})</span>
                  <span>Auto-rotating with smooth Ken-Burns animation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {showcaseSlides.map((slide, idx) => (
                    <div 
                      key={slide.id || idx}
                      className="bg-[#151520] rounded-2xl border border-stone-800 p-3 space-y-2 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-stone-700">
                        <img 
                          src={slide.imageUrl} 
                          alt={slide.title} 
                          className="w-full h-full object-cover" 
                        />
                        <span className="absolute top-1.5 left-1.5 bg-black/80 text-[10px] font-mono px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
                          Slide #{idx + 1}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-amber-400 block truncate">
                          {slide.badge || 'Atelier Showcase'}
                        </span>
                        <h4 className="text-xs font-serif font-bold text-white truncate" title={slide.title}>
                          {slide.title}
                        </h4>
                        <p className="text-[11px] text-stone-400 line-clamp-2" title={slide.subtitle}>
                          {slide.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#121217] border-t border-stone-800 px-6 py-3 flex items-center justify-between shrink-0 text-xs text-stone-400 font-mono">
          <span>Eastleigh 5th Street · UBAH Shopping Center Shop G7</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Executive Suite
          </button>
        </div>
      </div>
    </div>
  );
};
