/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { StorefrontView } from './components/StorefrontView';
import { POSTerminal } from './components/POSTerminal';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { OnlineCheckoutModal } from './components/OnlineCheckoutModal';
import { InvoiceModal } from './components/InvoiceModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { WhatsAppFloatingWidget } from './components/WhatsAppFloatingWidget';
import { AiClientAssistant } from './components/AiClientAssistant';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OwnerProductManagerModal } from './components/OwnerProductManagerModal';
import { OwnerShowcaseManagerModal } from './components/OwnerShowcaseManagerModal';

const MainAppContent: React.FC = () => {
  const { 
    activeView, 
    selectedProductForModal, 
    setSelectedProductForModal,
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    isOwnerProductModalOpen,
    setIsOwnerProductModalOpen,
    ownerModalInitialMode,
    productForDeletion,
    setProductForDeletion
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={`flex flex-col bg-[#0b0b0e] text-stone-100 font-sans selection:bg-amber-400 selection:text-stone-950 ${
      (activeView === 'pos' || activeView === 'inventory' || activeView === 'orders')
        ? 'h-screen h-[100dvh] overflow-hidden pb-0'
        : 'min-h-screen pb-16 lg:pb-0'
    }`}>
      {/* If POS, inventory, or orders is active, route directly to the secure POS terminal */}
      {(activeView === 'pos' || activeView === 'inventory' || activeView === 'orders') ? (
        <POSTerminal />
      ) : (
        <>
          <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          <main className="flex-1">
            <StorefrontView 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery} 
            />
          </main>
        </>
      )}

      {/* Mobile & Tablet App Bar */}
      <MobileBottomNav />

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

      {/* Global Shop Owner Product Manager Modal: Add Garment/Fragrance, Picture Upload, Delete Product, Stock */}
      <OwnerProductManagerModal 
        isOpen={isOwnerProductModalOpen}
        onClose={() => {
          setIsOwnerProductModalOpen(false);
          setProductForDeletion(null);
        }}
        initialMode={ownerModalInitialMode}
        productToDelete={productForDeletion}
      />

      {/* Global Shop Owner Storefront Animation Display Manager */}
      <OwnerShowcaseManagerModal />
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
