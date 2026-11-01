/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { StorefrontView } from './components/StorefrontView';
import { POSTerminal } from './components/POSTerminal';
import { InventoryDashboard } from './components/InventoryDashboard';
import { OrdersDashboard } from './components/OrdersDashboard';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { OnlineCheckoutModal } from './components/OnlineCheckoutModal';
import { InvoiceModal } from './components/InvoiceModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { WhatsAppFloatingWidget } from './components/WhatsAppFloatingWidget';
import { AiClientAssistant } from './components/AiClientAssistant';

const MainAppContent: React.FC = () => {
  const { 
    activeView, 
    selectedProductForModal, 
    setSelectedProductForModal,
    isAiAssistantOpen,
    setIsAiAssistantOpen
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0e] text-stone-100 font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* If POS is active, render dedicated POS terminal full screen without standard store navbar */}
      {activeView === 'pos' ? (
        <POSTerminal />
      ) : (
        <>
          <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          <main className="flex-1">
            {activeView === 'storefront' && (
              <StorefrontView 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
              />
            )}

            {activeView === 'inventory' && (
              <InventoryDashboard />
            )}

            {activeView === 'orders' && (
              <OrdersDashboard />
            )}
          </main>
        </>
      )}

      {/* Global Interactive Modals & Drawers */}
      <CartDrawer />
      
      {selectedProductForModal && (
        <ProductDetailModal 
          product={selectedProductForModal} 
          onClose={() => setSelectedProductForModal(null)} 
        />
      )}

      <OnlineCheckoutModal />
      <InvoiceModal />
      <OrderTrackingModal />
      <StoreSettingsModal />
      <WhatsAppFloatingWidget />
      
      {/* AI Client Assistance Drawer/Modal */}
      <AiClientAssistant 
        isOpen={isAiAssistantOpen} 
        onClose={() => setIsAiAssistantOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}
