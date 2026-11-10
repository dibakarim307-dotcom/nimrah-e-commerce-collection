import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  MessageSquare, 
  Tag, 
  ShieldCheck,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';
import { buildWhatsAppOrderUrl } from '../utils/whatsapp';

export const CartDrawer: React.FC = () => {
  const { 
    onlineCart, 
    settings, 
    isCartDrawerOpen, 
    setIsCartDrawerOpen, 
    updateOnlineCartQty, 
    removeFromOnlineCart, 
    clearOnlineCart, 
    setIsOnlineCheckoutOpen 
  } = useStore();

  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  if (!isCartDrawerOpen) return null;

  const subtotal = onlineCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percent) / 100 : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'RAMADAN10' || code === 'NIMRAH10' || code === 'VIP10') {
      setAppliedDiscount({ code, percent: 10 });
    } else if (code === 'ATELIER15') {
      setAppliedDiscount({ code, percent: 15 });
    } else {
      setPromoError('Invalid coupon. Try NIMRAH10 or RAMADAN10');
    }
  };

  const handleCheckoutModalOpen = () => {
    setIsCartDrawerOpen(false);
    setIsOnlineCheckoutOpen(true);
  };

  const handleWhatsAppCheckout = () => {
    const url = buildWhatsAppOrderUrl(
      onlineCart, 
      { name: 'Online Guest' }, 
      total, 
      settings
    );
    window.open(url, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-xs flex justify-end no-print"
      onClick={() => setIsCartDrawerOpen(false)}
    >
      <div 
        className="w-full sm:max-w-md bg-[#0f0f15] border-l border-amber-500/25 h-full shadow-2xl flex flex-col justify-between overflow-hidden text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-500/20 flex items-center justify-between bg-[#14141c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-wide">
                Bespoke Shopping Bag
              </h3>
              <p className="text-[10px] text-stone-400 font-mono">
                Eastleigh Shop G7 · Till {settings.mpesaTillNumber}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsCartDrawerOpen(false)}
            aria-label="Close cart"
            className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Itemized List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-stone-800/80">
          {onlineCart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#14141d] border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-medium text-white">Your bag is empty</h4>
                <p className="text-xs text-stone-400 mt-1 max-w-xs font-light">
                  Discover our pure silk abayas, embroidered evening kaftans, and signature Nimrah Noir extrait.
                </p>
              </div>
              <button 
                onClick={() => setIsCartDrawerOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            onlineCart.map((item, idx) => (
              <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor.name}-${idx}`} className="py-4 flex gap-3.5">
                {/* Product Thumbnail */}
                <div className="w-18 h-22 sm:w-20 sm:h-24 bg-stone-900 rounded-xl overflow-hidden shrink-0 border border-stone-800">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button 
                        onClick={() => removeFromOnlineCart(item.productId, item.selectedSize, item.selectedColor.name)}
                        className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-1">
                      <span>Size: <strong className="font-mono text-amber-300">{item.selectedSize}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 truncate">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-stone-700 shrink-0"
                          style={{ backgroundColor: item.selectedColor.hex }}
                        />
                        <span className="truncate">{item.selectedColor.name}</span>
                      </span>
                    </div>

                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                      SKU: {item.product.sku}
                    </div>
                  </div>

                  {/* Quantity Stepper & Line Price */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-stone-700 rounded-lg bg-stone-900">
                      <button 
                        onClick={() => updateOnlineCartQty(item.productId, item.selectedSize, item.selectedColor.name, item.quantity - 1)}
                        className="p-1 sm:p-1.5 text-stone-400 hover:text-white cursor-pointer transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-xs font-semibold tabular-nums text-white">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateOnlineCartQty(item.productId, item.selectedSize, item.selectedColor.name, item.quantity + 1)}
                        className="p-1 sm:p-1.5 text-stone-400 hover:text-white cursor-pointer transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs sm:text-sm font-semibold font-mono text-amber-300 tabular-nums">
                      {formatCurrency(item.unitPrice * item.quantity, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with promo, breakdown & checkout */}
        {onlineCart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-amber-500/20 bg-[#121218] space-y-3.5 shrink-0 safe-area-bottom">
            {/* Promo Code input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Coupon (e.g. NIMRAH10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full text-xs uppercase font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                />
                <Tag className="w-3.5 h-3.5 text-stone-500 absolute right-3 top-2.5" />
              </div>
              <button 
                type="submit"
                className="px-3 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>

            {promoError && (
              <p className="text-[11px] text-rose-400">{promoError}</p>
            )}

            {appliedDiscount && (
              <div className="flex items-center justify-between text-xs text-amber-200 bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-500/40">
                <span>Coupon Applied: <strong className="font-mono text-amber-400">{appliedDiscount.code}</strong> ({appliedDiscount.percent}% OFF)</span>
                <button 
                  onClick={() => setAppliedDiscount(null)}
                  className="text-stone-400 hover:text-rose-400 text-[10px] underline ml-2 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs text-stone-400 font-mono">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums text-white">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Discount ({appliedDiscount.percent}%)</span>
                  <span className="tabular-nums">-{formatCurrency(discountAmount, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>VAT (16% inclusive)</span>
                <span className="tabular-nums">{formatCurrency(total - (total / 1.16), settings.currency)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-white pt-2 border-t border-stone-800">
                <span>Total Due</span>
                <span className="text-amber-300 font-mono text-base sm:text-lg tabular-nums">
                  {formatCurrency(total, settings.currency)}
                </span>
              </div>
            </div>

            {/* M-Pesa Till Checkout */}
            <div className="space-y-2 pt-1">
              <button 
                onClick={handleCheckoutModalOpen}
                className="w-full py-3 sm:py-3.5 px-4 text-xs sm:text-sm font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay via M-Pesa Till {settings.mpesaTillNumber}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button 
                onClick={handleWhatsAppCheckout}
                className="w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Fast Order via WhatsApp Chat</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official KRA Electronic Tax Invoice</span>
              </span>
              <button 
                onClick={clearOnlineCart}
                className="text-stone-400 hover:text-stone-200 underline cursor-pointer"
              >
                Clear Bag
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
