import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MessageSquare, 
  FileText,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Ban
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { buildWhatsAppTrackUrl } from '../utils/whatsapp';

export const OrderTrackingModal: React.FC = () => {
  const { 
    isTrackingModalOpen, 
    setIsTrackingModalOpen, 
    orders, 
    settings, 
    openInvoice,
    setIsOnlineCheckoutOpen
  } = useStore();

  const [searchRef, setSearchRef] = useState('');
  const activePaidOrders = orders.filter(o => o.payment.status === 'completed' && o.status !== 'cancelled');
  const [searchedOrder, setSearchedOrder] = useState<typeof orders[0] | null>(() => {
    return activePaidOrders[0] || orders[0] || null;
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isTrackingModalOpen && orders.length > 0) {
      if (!searchedOrder) {
        setSearchedOrder(activePaidOrders[0] || orders[0]);
      }
    }
  }, [orders, isTrackingModalOpen]);

  if (!isTrackingModalOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const q = searchRef.trim().toLowerCase();
    if (!q) return;

    const found = orders.find(o => 
      o.id.toLowerCase() === q || 
      o.customer.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')) ||
      (o.payment.mpesaDetails && o.payment.mpesaDetails.transactionCode.toLowerCase() === q)
    );

    if (found) {
      setSearchedOrder(found);
    } else {
      setErrorMsg(`No order found matching "${searchRef}". Check your invoice number (e.g. ${orders[0]?.id || 'NC-2026-7841'}).`);
    }
  };

  const handleWhatsAppTrack = () => {
    if (!searchedOrder) return;
    const url = buildWhatsAppTrackUrl(searchedOrder.id, settings);
    window.open(url, '_blank');
  };

  const isCancelled = searchedOrder ? (
    searchedOrder.status === 'cancelled' ||
    searchedOrder.payment.status === 'cancelled' ||
    searchedOrder.payment.status === 'failed'
  ) : false;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-700" />
              <span>Track Your Nimrah Collection Order</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your Order Number (e.g. {orders[0]?.id || 'NC-2026-7841'}), phone number, or M-Pesa Code
            </p>
          </div>

          <button 
            onClick={() => setIsTrackingModalOpen(false)}
            className="p-1.5 text-stone-500 hover:text-stone-950 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input 
                type="text"
                placeholder="Search by Order # (e.g. NC-2026-7841) or M-Pesa Code..."
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                className="w-full text-xs font-mono pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
            </div>
            <button 
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-black rounded-lg transition-colors cursor-pointer"
            >
              Lookup
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-600 mt-2">{errorMsg}</p>
          )}
        </div>

        {/* Order Details: CANCELLED STATE vs ACTIVE TRACKING PIPELINE */}
        {searchedOrder && (
          <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Order meta chip */}
            <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border ${
              isCancelled 
                ? 'bg-rose-50/80 border-rose-200' 
                : 'bg-stone-50 border-stone-200'
            }`}>
              <div>
                <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider block">
                  Order Reference
                </span>
                <span className="font-mono text-base font-bold text-stone-950">
                  #{searchedOrder.id}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider block">
                  Date
                </span>
                <span className="text-xs text-stone-700">
                  {formatDate(searchedOrder.createdAt)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider block">
                  Payment Status
                </span>
                {isCancelled ? (
                  <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    <span>CANCELLED (UNPAID)</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {searchedOrder.payment.status.toUpperCase()} (Till {settings.mpesaTillNumber})
                  </span>
                )}
              </div>

              <button 
                onClick={() => {
                  setIsTrackingModalOpen(false);
                  openInvoice(searchedOrder);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 flex items-center gap-1 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isCancelled ? 'View Void Invoice' : 'View Tax Invoice'}</span>
              </button>
            </div>

            {/* IF CANCELLED: DO NOT PROCEED TO ORDERS TRACKING — JUST SHOW IT WAS CANCELLED! */}
            {isCancelled ? (
              <div className="space-y-4">
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 sm:p-6 text-stone-900 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-start justify-between gap-3 border-b border-rose-200 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shadow-xs">
                        <XCircle className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                            Transaction Cancelled
                          </span>
                          <span className="text-xs font-mono text-rose-800 font-semibold">
                            Payment Not Settled
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-rose-950 mt-1">
                          Order Tracking Inactive
                        </h4>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono bg-rose-100 text-rose-900 border border-rose-200 px-2 py-0.5 rounded font-bold uppercase">
                      Payment Aborted
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-rose-200 text-xs text-stone-700 space-y-2.5">
                    <p className="font-semibold text-rose-950 flex items-start gap-1.5 text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>This transaction was cancelled prior to payment completion.</span>
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Because payment was not authorized or was cancelled on the phone SIM prompt:
                    </p>
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-stone-600">
                        <span>• Account Deduction:</span>
                        <span className="text-emerald-700 font-bold">KES 0 (Zero funds charged)</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                        <span>• Boutique Atelier Status:</span>
                        <span className="text-rose-700 font-bold">Halted (Not in production)</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                        <span>• Dispatch &amp; Delivery:</span>
                        <span className="text-stone-500 font-bold">Disabled (Requires paid order)</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions to recover */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={() => {
                        setIsTrackingModalOpen(false);
                        setIsOnlineCheckoutOpen(true);
                      }}
                      className="flex-1 py-3 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Make Payment &amp; Place Order</span>
                    </button>

                    <button
                      onClick={handleWhatsAppTrack}
                      className="py-3 px-4 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Chat with Concierge</span>
                    </button>
                  </div>
                </div>

                {/* Cancelled Package Items (Displayed with line-through) */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Cancelled Cart Items ({searchedOrder.items.length} items)
                  </h4>
                  <div className="divide-y divide-stone-100">
                    {searchedOrder.items.map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs text-stone-500 line-through">
                        <div>
                          <span className="font-semibold text-stone-600">{it.product.name}</span>
                          <span className="ml-2 font-mono text-[11px]">
                            ({it.selectedSize}, {it.selectedColor.name})
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-stone-500">
                          {it.quantity} x {formatCurrency(it.unitPrice, settings.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE FULL PIPELINE ONLY FOR CONFIRMED & PAID ORDERS */
              <>
                {/* Stepper Pipeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Fulfillment &amp; Delivery Timeline
                  </h4>

                  <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3 relative">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 z-10">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-900">1. Order Placed &amp; Registered</h5>
                        <p className="text-[11px] text-stone-500">
                          Order logged into boutique system via {searchedOrder.source.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 relative">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 z-10">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-900">2. M-Pesa Till Payment Settled</h5>
                        <p className="text-[11px] text-stone-500 font-mono">
                          Settled to Till #{settings.mpesaTillNumber} · Safaricom Code: {searchedOrder.payment.mpesaDetails?.transactionCode || 'QJD82KLA89'}
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3 relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${searchedOrder.status !== 'confirmed' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-900">3. Atelier Garment Quality Inspection</h5>
                        <p className="text-[11px] text-stone-500">
                          Hand-pressing, embroidery check &amp; signature boutique oud mist applied
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-3 relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${searchedOrder.status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-900">4. Dispatched for Delivery / Boutique Ready</h5>
                        <p className="text-[11px] text-stone-500">
                          Delivery to {searchedOrder.customer.address || searchedOrder.customer.city || 'Nairobi Address'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Package Contents ({searchedOrder.items.length} items)
                  </h4>
                  <div className="divide-y divide-stone-100">
                    {searchedOrder.items.map((it, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-stone-900">{it.product.name}</span>
                          <span className="text-stone-500 ml-2 font-mono text-[11px]">
                            (Size: {it.selectedSize}, Color: {it.selectedColor.name})
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-stone-800 font-bold">
                          {it.quantity} x {formatCurrency(it.unitPrice, settings.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp live agent tracking */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-700" />
                      <span>Need urgent delivery updates?</span>
                    </span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Chat directly with the dispatch rider &amp; boutique concierge on WhatsApp
                    </p>
                  </div>

                  <button 
                    onClick={handleWhatsAppTrack}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Track on WhatsApp</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
