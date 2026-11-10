import React, { useState } from 'react';
import { ShoppingBag, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { buildWhatsAppInquiryUrl } from '../utils/whatsapp';
import { useStore } from '../context/StoreContext';
import { PerfumeAnimationOverlay } from './PerfumeAnimationOverlay';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    settings, 
    addToOnlineCart, 
    setSelectedProductForModal
  } = useStore();

  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isPerfume = product.category === 'Signature Fragrance' || product.id === 'prod-04';
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    const defaultSize = product.sizes[0] || 'Standard';
    const defaultColor = product.colors[0] || { name: 'Standard', hex: '#000000' };
    addToOnlineCart(product, defaultSize, defaultColor, 1);
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleWhatsAppInquire = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildWhatsAppInquiryUrl(product, settings, product.sizes[0], product.colors[0]?.name);
    window.open(url, '_blank');
  };

  return (
    <div 
      onClick={() => setSelectedProductForModal(product)}
      className={`group relative bg-[#131318] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer text-stone-100 ${
        isPerfume 
          ? 'border-2 border-amber-400/60 shadow-xl shadow-amber-950/30 hover:border-amber-300 ring-1 ring-amber-400/20' 
          : 'border border-amber-500/20 hover:border-amber-400/70 hover:shadow-amber-950/20'
      }`}
    >
      {/* Product Image Slot */}
      <div className="relative aspect-[4/3] sm:aspect-[1/1] w-full bg-[#181820] overflow-hidden">
        {!imageError && product.images[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 brightness-95 group-hover:brightness-100 ${
              isPerfume ? 'animate-perfume-levitate' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-400 p-4 text-center">
            <span className="font-serif text-lg font-bold text-amber-200">{product.name}</span>
            <span className="text-xs text-stone-500 mt-1">{product.category}</span>
          </div>
        )}

        {/* Exclusive animated mist, sillage aura, and floating gold scent particles for Perfume ONLY */}
        {isPerfume && <PerfumeAnimationOverlay compact={true} />}

        {/* Stock status indicator */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 bg-black/90 text-stone-400 border border-stone-800 rounded">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="text-[10px] font-mono font-bold tracking-wide text-amber-900 bg-amber-400 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <AlertCircle className="w-3 h-3 text-amber-950" />
              <span>Only {product.stock} Left</span>
            </span>
          ) : null}
        </div>

        {/* Quick action buttons floating on hover, visible on touch */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button 
            onClick={handleWhatsAppInquire}
            title="Ask on WhatsApp"
            className="p-1.5 sm:p-2 bg-black/90 hover:bg-emerald-950 text-emerald-400 rounded-full shadow-lg transition-colors border border-amber-500/30 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductForModal(product);
            }}
            title="Quick View"
            className="p-1.5 sm:p-2 bg-black/90 hover:bg-stone-900 text-amber-300 rounded-full shadow-lg transition-colors border border-amber-500/30 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Desktop hover quick add button */}
        {!isOutOfStock && (
          <div className="hidden lg:block absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            <button 
              onClick={handleQuickAdd}
              className="w-full py-2.5 px-3 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Added to Bag!' : 'Quick Add to Bag'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Metadata */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between bg-[#121217]">
        <div>
          {/* Category & Collection */}
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <span className="uppercase tracking-widest font-semibold text-[10px] text-amber-400">{product.category}</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="truncate text-stone-400 text-[11px]">{product.collection}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-200 transition-colors line-clamp-1 font-serif">
            {product.name}
          </h3>

          {/* Fabric */}
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 line-clamp-1 font-light">
            {product.fabric}
          </p>
        </div>

        {/* Price, SKU & Mobile 1-Tap Add */}
        <div className="mt-2.5 pt-2.5 border-t border-stone-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold font-mono text-amber-300 tabular-nums">
              {formatCurrency(product.price, settings.currency)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-stone-500 font-mono">
              SKU: {product.sku}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile & Tablet Direct Add Button */}
            {!isOutOfStock && (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="lg:hidden px-2.5 py-1 text-[11px] font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-sm"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>{isAdding ? 'Added!' : '+ Add'}</span>
              </button>
            )}

            {/* Color swatches */}
            <div className="hidden sm:flex items-center gap-1">
              {product.colors.slice(0, 3).map((col, idx) => (
                <span 
                  key={idx}
                  title={col.name}
                  className="w-3.5 h-3.5 rounded-full border border-stone-700 shadow-2xs"
                  style={{ backgroundColor: col.hex }}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[10px] text-stone-500 font-mono">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
