import React from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Search, 
  Store, 
  Crown, 
  Package, 
  Layers, 
  Receipt,
  Plus 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobileBottomNav: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    getOnlineCartTotal, 
    setIsCartDrawerOpen, 
    setIsAiAssistantOpen,
    setIsTrackingModalOpen,
    posStaffUser,
    setPosPortalIntent,
    openAddProductModal,
    isShopOwner
  } = useStore();

  const { count: cartCount } = getOnlineCartTotal();

  // If in POS view, provide POS-specific mobile bottom actions
  if (activeView === 'pos' || activeView === 'inventory' || activeView === 'orders') {
    return (
      <nav 
        aria-label="POS Mobile Navigation" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c11]/95 backdrop-blur-md border-t border-amber-500/30 px-3 py-1.5 flex items-center justify-around text-stone-300 no-print safe-area-bottom shadow-2xl"
      >
        <button
          onClick={() => setActiveView('storefront')}
          className="flex flex-col items-center justify-center py-1 px-2 text-[10px] text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <Store className="w-4 h-4 text-stone-400 mb-0.5" />
          <span>Storefront</span>
        </button>

        <button
          onClick={() => {
            setPosPortalIntent('owner');
            setActiveView('pos');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'pos' && isShopOwner
              ? 'text-amber-300 bg-amber-950/60 border border-amber-500/40 shadow-xs'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400 mb-0.5" />
          <span>Owner POS</span>
        </button>

        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 text-[10px] text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-400 mb-0.5 animate-pulse" />
          <span>AI Assist</span>
        </button>

        {isShopOwner && (
          <button
            onClick={openAddProductModal}
            className="flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold text-amber-300 hover:text-white transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-xs mb-0.5">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
            <span>+ Product</span>
          </button>
        )}

        <button
          onClick={() => {
            setPosPortalIntent('admin');
            setActiveView('pos');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'pos' && !isShopOwner
              ? 'text-stone-200 bg-stone-800 border border-stone-700 shadow-xs'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4 text-stone-300 mb-0.5" />
          <span>Admin</span>
        </button>
      </nav>
    );
  }

  // Storefront view mobile & tablet bottom bar
  return (
    <nav 
      aria-label="Mobile Storefront Navigation" 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-md border-t border-amber-500/25 px-2 py-1.5 flex items-center justify-around text-stone-300 no-print safe-area-bottom shadow-2xl"
    >
      {/* 1. Collection Catalog */}
      <button
        onClick={() => {
          setActiveView('storefront');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
          activeView === 'storefront' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-white'
        }`}
      >
        <Store className="w-4.5 h-4.5 mb-0.5" />
        <span>Collection</span>
      </button>

      {/* 2. AI Concierge */}
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium text-amber-300 hover:text-amber-200 transition-all cursor-pointer relative"
      >
        <div className="relative">
          <Sparkles className="w-4.5 h-4.5 mb-0.5 text-amber-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
        </div>
        <span>AI Stylist</span>
      </button>

      {/* 3. Search / Catalog */}
      <button
        onClick={() => {
          setActiveView('storefront');
          const el = document.getElementById('collection-catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium text-stone-400 hover:text-white transition-all cursor-pointer"
      >
        <Search className="w-4.5 h-4.5 mb-0.5 text-stone-400" />
        <span>Browse</span>
      </button>

      {/* 4. Shopping Bag */}
      <button
        onClick={() => setIsCartDrawerOpen(true)}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium text-stone-300 hover:text-amber-300 transition-all cursor-pointer relative"
      >
        <div className="relative">
          <ShoppingBag className="w-4.5 h-4.5 mb-0.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-amber-400 text-stone-950 font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          )}
        </div>
        <span>Bag</span>
      </button>


      {/* 6. Owner / Staff POS */}
      <button
        onClick={() => {
          setPosPortalIntent('owner');
          setActiveView('pos');
        }}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-500/30 transition-all cursor-pointer"
      >
        <Crown className="w-4 h-4 mb-0.5 text-amber-400" />
        <span>POS Terminal</span>
      </button>
    </nav>
  );
};
