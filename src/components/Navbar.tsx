import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Search, 
  Package, 
  FileText, 
  Layers, 
  SlidersHorizontal,
  PhoneCall,
  Menu,
  X,
  Sparkles,
  MapPin,
  Bot,
  Crown,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { cleanPhoneNumber } from '../utils/whatsapp';

interface NavbarProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchChange, searchQuery = '' }) => {
  const { 
    settings, 
    activeView, 
    setActiveView, 
    getOnlineCartTotal, 
    setIsCartDrawerOpen, 
    setIsTrackingModalOpen,
    setIsSettingsModalOpen,
    setIsAiAssistantOpen,
    posStaffUser,
    posPortalIntent,
    setPosPortalIntent
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const { count: cartCount } = getOnlineCartTotal();

  const handleNavClick = (view: 'storefront' | 'pos' | 'inventory' | 'orders' | 'settings') => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const cleanWaNumber = cleanPhoneNumber(settings.whatsappNumber);

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0d]/95 backdrop-blur-md border-b border-amber-500/20 transition-all text-stone-100">
      {/* Top announcement bar in deep black & gold */}
      <div className="bg-black/95 text-stone-300 text-xs py-1.5 px-4 text-center tracking-wider flex items-center justify-between border-b border-stone-900 no-print">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-200/90 font-mono">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Eastleigh 5th Street, UBAH Shopping G7</span>
        </div>

        <div className="flex-1 text-center font-medium text-xs">
          Lipa na M-Pesa Buy Goods Till: <span className="text-amber-400 font-mono font-bold tracking-normal">{settings.mpesaTillNumber}</span>
          <span className="hidden md:inline text-stone-400 ml-2">· {settings.socialHandle}</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <a 
            href={`https://wa.me/${cleanWaNumber}`} 
            target="_blank" 
            rel="noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
          >
            <PhoneCall className="w-3 h-3" />
            <span>WhatsApp: {settings.whatsappNumber}</span>
          </a>
        </div>
      </div>

      {/* Main Top Bar: 3 Zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand Wordmark & Official Emblem */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => handleNavClick('storefront')}
            className="flex items-center gap-3 group cursor-pointer text-left"
          >
            {/* Authentic Brand Logo Image from user attachment */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-amber-400/80 overflow-hidden bg-black shadow-lg shadow-amber-950/30 group-hover:border-amber-300 transition-all shrink-0">
              <img 
                src={settings.brandLogoUrl} 
                alt="Nimrah Collection Emblem" 
                className="w-full h-full object-cover object-center scale-[2.2]"
              />
            </div>

            <div>
              <div className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-gold-gradient leading-none">
                {settings.storeName}
              </div>
              <div className="text-[10px] text-stone-400 tracking-widest uppercase font-mono mt-0.5">
                {settings.socialHandle} · Boutique &amp; POS
              </div>
            </div>
          </button>

          {/* Active Mode Tag */}
          {activeView !== 'storefront' && (
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase tracking-wider font-semibold">
              {activeView === 'pos' ? 'Retail POS' : activeView}
            </span>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-300">
          <button 
            onClick={() => handleNavClick('storefront')}
            className={`cursor-pointer transition-colors py-1 hover:text-amber-300 ${activeView === 'storefront' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''}`}
          >
            Collection
          </button>

          <button 
            onClick={() => {
              handleNavClick('storefront');
              const el = document.getElementById('collection-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="cursor-pointer transition-colors py-1 hover:text-amber-300"
          >
            Abayas &amp; Fragrance
          </button>

          {/* Separated POS Links for Shop Owner and Admin */}
          <div className="flex items-center gap-1 bg-[#14141c] p-1 rounded-xl border border-stone-800">
            <button 
              onClick={() => {
                setPosPortalIntent('owner');
                handleNavClick('pos');
              }}
              className={`cursor-pointer transition-all px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 font-medium ${
                activeView === 'pos' && posStaffUser?.role === 'Shop Owner'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs' 
                  : 'text-amber-300 hover:text-white hover:bg-stone-800/60'
              }`}
              title="Shop Owner POS Terminal (Financial Sovereignty & P&L)"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Owner POS</span>
            </button>

            <button 
              onClick={() => {
                setPosPortalIntent('admin');
                handleNavClick('pos');
              }}
              className={`cursor-pointer transition-all px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 font-medium ${
                activeView === 'pos' && posStaffUser?.role === 'System Admin'
                  ? 'bg-stone-200 text-stone-950 font-bold shadow-xs' 
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
              title="System Admin POS Terminal (Operations & Inventory Register)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-stone-300" />
              <span>Admin POS</span>
            </button>
          </div>

          <button 
            onClick={() => handleNavClick('inventory')}
            className={`cursor-pointer transition-colors py-1 hover:text-amber-300 flex items-center gap-1.5 ${activeView === 'inventory' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''}`}
          >
            <Layers className="w-4 h-4 text-stone-400" />
            <span>Inventory</span>
          </button>

          <button 
            onClick={() => handleNavClick('orders')}
            className={`cursor-pointer transition-colors py-1 hover:text-amber-300 flex items-center gap-1.5 ${activeView === 'orders' ? 'text-amber-400 font-semibold border-b-2 border-amber-400' : ''}`}
          >
            <FileText className="w-4 h-4 text-stone-400" />
            <span>Orders &amp; Invoices</span>
          </button>

          <button 
            onClick={() => setIsTrackingModalOpen(true)}
            className="cursor-pointer transition-colors py-1 hover:text-amber-300 flex items-center gap-1"
          >
            <Package className="w-4 h-4 text-stone-400" />
            <span>Track Order</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Utilities */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* AI Client Assistance Trigger */}
          <button 
            onClick={() => setIsAiAssistantOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-200 bg-amber-950/80 hover:bg-amber-900 border border-amber-400/50 rounded-xl transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            title="Ask Nimrah AI Concierge"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">AI Concierge</span>
          </button>

          {/* Search Toggle */}
          {showSearchInput ? (
            <div className="relative flex items-center">
              <input 
                type="text"
                placeholder="Search abayas, perfumes, SKUs..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                autoFocus
                className="w-40 sm:w-52 text-xs bg-[#18181f] border border-amber-500/40 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button 
                onClick={() => {
                  setShowSearchInput(false);
                  onSearchChange?.('');
                }}
                className="absolute right-2 text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowSearchInput(true)}
              aria-label="Search Collection"
              className="p-2 text-stone-300 hover:text-amber-300 transition-colors rounded-lg hover:bg-stone-900 cursor-pointer"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          )}

          {/* POS Terminal Quick Switch */}
          {activeView !== 'pos' ? (
            <div className="hidden md:flex items-center gap-1.5">
              <button 
                onClick={() => {
                  setPosPortalIntent('owner');
                  setActiveView('pos');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-sm"
                title="Open Shop Owner POS Portal"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Owner POS</span>
              </button>
              <button 
                onClick={() => {
                  setPosPortalIntent('admin');
                  setActiveView('pos');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-200 bg-[#16161f] hover:bg-stone-800 border border-stone-700 rounded-lg transition-colors cursor-pointer"
                title="Open System Admin POS Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-stone-300" />
                <span>Admin</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveView('storefront')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              <span>Back to Store</span>
            </button>
          )}

          {/* Store Settings modal */}
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            title="Configure M-Pesa Till & Store"
            className="p-2 text-stone-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-stone-900 hidden sm:block cursor-pointer"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>

          {/* Shopping Cart Drawer Trigger */}
          <button 
            onClick={() => setIsCartDrawerOpen(true)}
            aria-label="Shopping Bag"
            className="relative p-2 text-stone-200 hover:text-amber-300 transition-colors rounded-lg hover:bg-stone-900 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[11px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu hamburger */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 lg:hidden text-stone-300 hover:text-white"
            aria-label="Open Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-amber-500/20 bg-[#0d0d10] px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => handleNavClick('storefront')}
              className={`text-left px-3 py-2 text-sm font-medium rounded-lg ${activeView === 'storefront' ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-500/30' : 'text-stone-300'}`}
            >
              Storefront Collection
            </button>
            {/* Mobile Separated POS Links */}
            <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
              <button 
                onClick={() => {
                  setPosPortalIntent('owner');
                  handleNavClick('pos');
                }}
                className={`text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between border ${
                  activeView === 'pos' && posStaffUser?.role === 'Shop Owner' 
                    ? 'bg-amber-400 text-stone-950 font-bold border-amber-300' 
                    : 'bg-[#15151e] text-amber-300 border-amber-500/30'
                }`}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Owner POS</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">P&amp;L</span>
              </button>

              <button 
                onClick={() => {
                  setPosPortalIntent('admin');
                  handleNavClick('pos');
                }}
                className={`text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between border ${
                  activeView === 'pos' && posStaffUser?.role === 'System Admin' 
                    ? 'bg-stone-200 text-stone-950 font-bold border-white' 
                    : 'bg-[#15151e] text-stone-300 border-stone-800'
                }`}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-300" />
                  <span>Admin POS</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">Sales</span>
              </button>
            </div>
            <button 
              onClick={() => {
                setIsAiAssistantOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 text-amber-200 bg-amber-950/50 border border-amber-500/30"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Client Concierge (Sizing &amp; Location)</span>
            </button>
            <button 
              onClick={() => handleNavClick('inventory')}
              className={`text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${activeView === 'inventory' ? 'bg-stone-800 text-white font-bold' : 'text-stone-300'}`}
            >
              <Layers className="w-4 h-4 text-stone-400" />
              <span>Inventory &amp; Restock</span>
            </button>
            <button 
              onClick={() => handleNavClick('orders')}
              className={`text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${activeView === 'orders' ? 'bg-stone-800 text-white font-bold' : 'text-stone-300'}`}
            >
              <FileText className="w-4 h-4 text-stone-400" />
              <span>Orders &amp; Invoices</span>
            </button>
            <button 
              onClick={() => {
                setIsTrackingModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 text-stone-300"
            >
              <Package className="w-4 h-4 text-stone-400" />
              <span>Track Order</span>
            </button>
            <a 
              href={`https://wa.me/${cleanWaNumber}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-left px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30"
            >
              <PhoneCall className="w-4 h-4" />
              <span>WhatsApp Shop: {settings.whatsappNumber}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
