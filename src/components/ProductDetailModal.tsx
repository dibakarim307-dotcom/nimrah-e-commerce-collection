import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  MessageSquare, 
  Ruler, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Minus, 
  Plus,
  AlertCircle
} from 'lucide-react';
import { Product, ProductColor } from '../types';
import { formatCurrency } from '../utils/formatters';
import { buildWhatsAppOrderUrl } from '../utils/whatsapp';
import { useStore } from '../context/StoreContext';
import { PerfumeAnimationOverlay } from './PerfumeAnimationOverlay';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { 
    settings, 
    addToOnlineCart
  } = useStore();

  const isPerfume = product.category === 'Signature Fragrance' || product.id === 'prod-04';
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0] || { name: 'Default', hex: '#000000' });
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToOnlineCart(product, selectedSize, selectedColor, quantity);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 600);
  };

  const handleDirectWhatsAppOrder = () => {
    const singleCartItem = [{
      productId: product.id,
      product,
      selectedSize,
      selectedColor,
      quantity,
      unitPrice: product.price
    }];

    const url = buildWhatsAppOrderUrl(
      singleCartItem, 
      { name: 'Direct Customer' }, 
      product.price * quantity, 
      settings
    );
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-stone-500 hover:text-stone-900 bg-white/80 hover:bg-white rounded-full transition-colors border border-stone-200 shadow-xs cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image Showcase with Exclusive Perfume Animation */}
          <div className={`relative flex items-center justify-center p-6 min-h-[380px] md:min-h-[500px] overflow-hidden ${
            isPerfume ? 'bg-[#0c0c11]' : 'bg-stone-100'
          }`}>
            {product.images[0] ? (
              <img 
                src={product.images[0]} 
                alt={product.name}
                referrerPolicy="no-referrer"
                className={`w-full h-full max-h-[520px] object-cover rounded-xl shadow-xs transition-all duration-500 ${
                  isPerfume ? 'animate-perfume-levitate shadow-2xl shadow-amber-950/60' : ''
                }`}
              />
            ) : (
              <div className="text-stone-400 font-serif text-2xl font-light">
                {product.name}
              </div>
            )}

            {/* Exclusive animated mist, sillage aura, and floating gold scent particles for Perfume ONLY */}
            {isPerfume && <PerfumeAnimationOverlay compact={false} />}

            {/* Collection tag */}
            <div className="absolute top-4 left-4 z-20 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-mono px-3 py-1 rounded-md border border-stone-800">
              Collection: {product.collection}
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh]">
            <div className="space-y-4">
              {/* Category & Rating */}
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="uppercase tracking-widest font-semibold text-amber-800">
                  {product.category}
                </span>
                <span className="font-mono text-stone-600">
                  SKU: {product.sku}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-900 leading-snug">
                {product.name}
              </h2>

              {/* Price & Real-time Stock */}
              <div className="flex items-baseline justify-between pb-3 border-b border-stone-200">
                <span className="text-2xl font-semibold font-mono text-stone-950 tabular-nums">
                  {formatCurrency(product.price, settings.currency)}
                </span>
                
                {isOutOfStock ? (
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                    Currently Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Live Stock: Only {product.stock} units remaining</span>
                  </span>
                ) : (
                  <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-mono">
                    In Stock ({product.stock} units)
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-stone-600 leading-relaxed font-light">
                {product.description}
              </p>

              {/* Fabric Specs / Olfactory Pyramid */}
              {isPerfume ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs space-y-2.5">
                  <div className="flex items-center justify-between text-amber-950 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Artisanal Olfactory Pyramid</span>
                    </span>
                    <span className="font-mono text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      35% Pure Extrait
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-16 font-bold text-amber-900">Top:</span>
                      <span className="text-stone-700 bg-white/70 px-2 py-0.5 rounded border border-amber-200/60">Smoky Cambodian Oud · Italian Bergamot</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 font-bold text-amber-900">Heart:</span>
                      <span className="text-stone-700 bg-white/70 px-2 py-0.5 rounded border border-amber-200/60">Bulgarian Damask Rose · Ambergris</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 font-bold text-amber-900">Base:</span>
                      <span className="text-stone-700 bg-white/70 px-2 py-0.5 rounded border border-amber-200/60">Tahitian Vanilla Bean · Smoky White Musk</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-stone-600">
                    <span>Flacon: Italian Amber Glass &amp; Magnetic Onyx Cap</span>
                    <span className="font-semibold text-amber-800">24H+ Sillage</span>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-stone-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-medium">Fabric:</span>
                    <span className="text-stone-600">{product.fabric}</span>
                  </div>
                  {product.careInstructions && (
                    <div className="flex items-center gap-2 text-stone-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="font-medium">Care:</span>
                      <span className="text-stone-600">{product.careInstructions}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Size Selector */}
              {product.sizes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-900">
                      {isPerfume ? 'Select Flacon Volume:' : 'Select Size:'}
                    </span>
                    {!isPerfume && (
                      <button 
                        type="button"
                        onClick={() => setShowSizeGuide(!showSizeGuide)}
                        className="text-amber-800 hover:text-amber-950 font-medium flex items-center gap-1 underline cursor-pointer"
                      >
                        <Ruler className="w-3 h-3" />
                        <span>{showSizeGuide ? 'Hide Sizing Chart' : 'Abaya & Garment Size Guide'}</span>
                      </button>
                    )}
                  </div>

                  {/* Size Guide Info Box for Apparel */}
                  {!isPerfume && showSizeGuide && (
                    <div className="p-3 bg-stone-100 rounded-lg text-[11px] text-stone-700 space-y-1 font-mono border border-stone-200">
                      <div className="font-bold text-stone-900 mb-1">Standard Abaya Height Recommendations:</div>
                      <div>• Size 52: 152cm – 157cm (5'0" – 5'2")</div>
                      <div>• Size 54: 158cm – 162cm (5'3" – 5'4")</div>
                      <div>• Size 56: 163cm – 167cm (5'5" – 5'6")</div>
                      <div>• Size 58: 168cm – 172cm (5'7" – 5'8")</div>
                      <div>• Size 60: 173cm – 178cm (5'9" – 5'11")</div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md border transition-all cursor-pointer ${
                          selectedSize === size 
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                            : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-stone-900">
                    Selected Color: <span className="font-normal text-stone-600">{selectedColor.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.colors.map(col => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        title={col.name}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                          selectedColor.name === col.name 
                            ? 'ring-2 ring-stone-900 ring-offset-2 border-white' 
                            : 'border-stone-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-medium text-stone-900">Quantity:</span>
                <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                  <button 
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1.5 text-stone-600 hover:text-stone-950 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-mono text-xs font-medium text-stone-900 tabular-nums">
                    {quantity}
                  </span>
                  <button 
                    type="button"
                    disabled={quantity >= product.stock || isOutOfStock}
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-1.5 text-stone-600 hover:text-stone-950 disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Purchase CTA Buttons */}
            <div className="pt-6 space-y-2.5">
              <button 
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 text-sm font-semibold text-white bg-stone-900 hover:bg-black disabled:bg-stone-300 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{addedNotice ? 'Added to Bag ✓' : isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}</span>
              </button>

              <button 
                type="button"
                onClick={handleDirectWhatsAppOrder}
                className="w-full py-3 px-4 text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Direct Order via WhatsApp Concierge</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-2">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-stone-400" />
                  <span>Nairobi Express 3-Hour Delivery</span>
                </span>
                <span>·</span>
                <span>M-Pesa Till: {settings.mpesaTillNumber}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
