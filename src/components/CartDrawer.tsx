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
  ShieldCheck 
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-800" />
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              Shopping Bag
            </h3>
            <span className="text-xs font-mono bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
              {onlineCart.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          </div>

          <button 
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 text-stone-500 hover:text-stone-950 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Itemized List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-stone-100">
          {onlineCart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-medium text-stone-800">Your bag is empty</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Discover our pure silk abayas, embroidered evening kaftans, and artisanal fragrances.
                </p>
              </div>
              <button 
                onClick={() => setIsCartDrawerOpen(false)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
              >
                Browse Collection
              </button>
            </div>
          ) : (
            onlineCart.map((item, idx) => (
              <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor.name}-${idx}`} className="py-4 flex gap-4">
                {/* Product Thumbnail */}
                <div className="w-20 h-24 bg-stone-100 rounded-lg overflow-hidden shrink-0">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-stone-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button 
                        onClick={() => removeFromOnlineCart(item.productId, item.selectedSize, item.selectedColor.name)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                      <span>Size: <strong className="font-mono text-stone-700">{item.selectedSize}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-stone-300"
                          style={{ backgroundColor: item.selectedColor.hex }}
                        />
                        <span>{item.selectedColor.name}</span>
                      </span>
                    </div>

                    <div className="text-xs text-stone-400 font-mono mt-0.5">
                      SKU: {item.product.sku}
                    </div>
                  </div>

                  {/* Quantity Stepper & Line Price */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-stone-300 rounded bg-stone-50">
                      <button 
                        onClick={() => updateOnlineCartQty(item.productId, item.selectedSize, item.selectedColor.name, item.quantity - 1)}
                        className="p-1 text-stone-600 hover:text-black cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-xs font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateOnlineCartQty(item.productId, item.selectedSize, item.selectedColor.name, item.quantity + 1)}
                        className="p-1 text-stone-600 hover:text-black cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-sm font-semibold font-mono text-stone-950 tabular-nums">
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
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-4">
            {/* Promo Code input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Coupon (e.g. NIMRAH10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full text-xs uppercase font-mono px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-800"
                />
                <Tag className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5" />
              </div>
              <button 
                type="submit"
                className="px-3 py-2 text-xs font-medium text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-lg transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>

            {promoError && (
              <p className="text-[11px] text-rose-600">{promoError}</p>
            )}

            {appliedDiscount && (
              <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                <span>Coupon Applied: <strong>{appliedDiscount.code}</strong> ({appliedDiscount.percent}% OFF)</span>
                <button 
                  onClick={() => setAppliedDiscount(null)}
                  className="text-stone-500 hover:text-rose-600 text-[10px] underline ml-2"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({appliedDiscount.percent}%)</span>
                  <span className="font-mono tabular-nums">-{formatCurrency(discountAmount, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-stone-600">
                <span>VAT (16% inclusive)</span>
                <span className="font-mono tabular-nums">{formatCurrency(total - (total / 1.16), settings.currency)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-950 pt-2 border-t border-stone-200">
                <span>Total Due</span>
                <span className="font-mono text-base tabular-nums">{formatCurrency(total, settings.currency)}</span>
              </div>
            </div>

            {/* M-Pesa Till Checkout */}
            <div className="space-y-2 pt-1">
              <button 
                onClick={handleCheckoutModalOpen}
                className="w-full py-3.5 px-4 text-sm font-semibold text-white bg-stone-950 hover:bg-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Pay via M-Pesa Till {settings.mpesaTillNumber}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button 
                onClick={handleWhatsAppCheckout}
                className="w-full py-3 px-4 text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Fast Order via WhatsApp Chat</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official KRA Tax Invoice Generated</span>
              </span>
              <button 
                onClick={clearOnlineCart}
                className="text-stone-400 hover:text-stone-700 underline"
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
