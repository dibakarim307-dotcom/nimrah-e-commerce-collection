import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Truck, 
  MessageSquare,
  Star,
  Mail,
  Instagram,
  Store,
  Bot
} from 'lucide-react';
import { HeroBanner } from './HeroBanner';
import { ProductCard } from './ProductCard';
import { useStore } from '../context/StoreContext';
import { ProductCategory } from '../types';
import { cleanPhoneNumber } from '../utils/whatsapp';

interface StorefrontViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({ searchQuery, onSearchChange }) => {
  const { products, settings, setActiveView, setIsAiAssistantOpen } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  const categories: (ProductCategory | 'All')[] = [
    'All',
    'Abayas',
    'Co-ords & Sets',
    'Artisanal Kaftans',
    'Signature Fragrance',
    'Luxury Hijabs',
    'Accessories'
  ];

  // Filter & sort
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fabric.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.collection.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStock = !inStockOnly || p.stock > 0;
      return matchesCat && matchesSearch && matchesStock;
    });

    if (sortBy === 'price_low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, selectedCategory, searchQuery, inStockOnly, sortBy]);

  const cleanWaNumber = cleanPhoneNumber(settings.whatsappNumber);

  return (
    <div className="space-y-16 pb-16 bg-[#0b0b0e] text-stone-100">
      {/* 1. Hero Campaign Banner */}
      <HeroBanner />

      {/* 2. Main Product Catalog Section */}
      <section id="collection-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-mono mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Haute Atelier 2026</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white tracking-tight">
              Curated Modesty &amp; Fragrance
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-lg font-light">
              Tailored in rich French velvets, spun raw silks, and pure Moroccan crepes. Available online or at our Eastleigh Shop G7 boutique.
            </p>
          </div>

          {/* Quick Stats & AI prompt */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAiAssistantOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-400/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Ask AI Sizing Guide</span>
            </button>
            <span className="text-xs text-stone-500 font-mono hidden sm:inline">
              Till #{settings.mpesaTillNumber}
            </span>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-950/40' 
                    : 'bg-[#16161d] text-stone-300 hover:bg-[#202028] border border-stone-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sorting & Stock Filter Sub-bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300 bg-[#121217] p-3.5 rounded-2xl border border-amber-500/15">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-200">
                <input 
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-900 text-amber-400 focus:ring-amber-400"
                />
                <span>In Stock Only</span>
              </label>

              {searchQuery && (
                <div className="flex items-center gap-1.5 text-stone-300 font-mono">
                  <span>Keyword: "{searchQuery}"</span>
                  <button 
                    onClick={() => onSearchChange('')}
                    className="text-amber-400 hover:underline text-[10px]"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#181820] border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
              >
                <option value="featured">Curated Collection</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dedicated Animated Fragrance Banner (Exclusive to Signature Fragrance category) */}
        {selectedCategory === 'Signature Fragrance' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#181512] to-amber-950/40 border border-amber-500/30 p-6 text-stone-100 shadow-xl">
            {/* Animated Sillage Halo */}
            <div 
              className="absolute -right-10 -top-10 w-48 h-48 rounded-full animate-perfume-aura opacity-50 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(217, 119, 6, 0.15) 50%, transparent 75%)'
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="uppercase tracking-widest">Haute Parfumerie Atelier</span>
                  <span className="text-amber-500/60">·</span>
                  <span className="text-amber-300">35% Extrait Oil Concentration</span>
                </div>
                <h3 className="font-serif text-2xl text-white">
                  Nimrah Noir <span className="italic text-amber-200">Extrait de Parfum</span>
                </h3>
                <p className="text-xs text-stone-300 font-light max-w-xl">
                  Handcrafted with rare Cambodian Agarwood, Bulgarian Damask Rose, and warm Tahitian Vanilla. Experience continuous 24-hour animated sillage and olfactory presence.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-amber-400/30 text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Available at Eastleigh Shop G7 &amp; Online</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#131318] rounded-2xl border border-dashed border-stone-800 p-12 text-center space-y-3">
            <p className="font-serif text-lg text-stone-300">No items match your criteria</p>
            <p className="text-xs text-stone-500">
              Try switching category or clearing the search keyword.
            </p>
            <button 
              onClick={() => {
                setSelectedCategory('All');
                onSearchChange('');
                setInStockOnly(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 rounded-lg hover:bg-amber-300"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Eastleigh Boutique & Atelier Story Spotlight */}
      <section className="bg-[#101015] border-y border-amber-500/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Visual presentation */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-stone-900 border border-amber-500/30 shadow-2xl">
              <img 
                src="/src/assets/images/product_artisan_kaftan_1793448136736.jpg" 
                alt="Nimrah Collection Atelier Craftsmanship"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 block">
                  Atelier Heritage · Shop G7
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-medium text-amber-100">
                  Precision Craftsmanship &amp; Pure Silk Velvet
                </h3>
                <p className="text-xs text-stone-300 font-light">
                  Hand-embroidered zardozi and crystalline beadwork tailored with modesty.
                </p>
              </div>
            </div>

            {/* Prose */}
            <div className="space-y-6 lg:pl-6">
              <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Eastleigh 5th Street · UBAH Shopping Center</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white leading-tight">
                Visit Our Physical Boutique at <span className="text-gold-gradient font-bold">Shop G7</span>
              </h2>

              <p className="text-sm text-stone-300 leading-relaxed font-light">
                Experience our curated fabrics in person. Located at <strong>UBAH Shopping Center, Shop G7, Eastleigh 5th Street</strong>, our boutique offers private bridal &amp; formal fittings, live tailoring consultations, and instant in-store POS checkouts with automatic tax invoices.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-1 font-mono">
                <div className="p-4 bg-[#16161c] rounded-2xl border border-amber-500/20">
                  <div className="text-amber-400 font-bold text-lg">Shop G7</div>
                  <div className="text-xs text-stone-400 mt-1">UBAH Shopping Center, Eastleigh 5th St</div>
                </div>

                <div className="p-4 bg-[#16161c] rounded-2xl border border-amber-500/20">
                  <div className="text-amber-400 font-bold text-lg">Till 5428901</div>
                  <div className="text-xs text-stone-400 mt-1">Lipa na M-Pesa Buy Goods &amp; Services</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a 
                  href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Salam Nimrah Collection! I would like directions or assistance visiting your shop at UBAH Shopping Center G7 in Eastleigh.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/30"
                >
                  <MessageSquare className="w-4 h-4 text-stone-950" />
                  <span>WhatsApp Eastleigh Concierge</span>
                </a>

                <button 
                  onClick={() => setIsAiAssistantOpen(true)}
                  className="px-4 py-3 text-xs font-semibold text-amber-200 bg-[#16161c] hover:bg-stone-800 border border-amber-400/40 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ask AI Assistant</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Client Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-mono">
            Client Reviews
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-medium text-white">
            Loved Across Nairobi &amp; Beyond
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#131318] p-6 rounded-2xl border border-amber-500/20 shadow-xl space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-light italic">
              "Visited their Eastleigh shop at UBAH G7. The fabric quality of the emerald velvet abaya is breathtaking, and the cashier checkout on POS with M-Pesa Till 5428901 was completed in 10 seconds with a clean print receipt!"
            </p>
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-200">Amina H.</span>
              <span className="text-stone-500 font-mono text-[11px]">Eastleigh, Nairobi</span>
            </div>
          </div>

          <div className="bg-[#131318] p-6 rounded-2xl border border-amber-500/20 shadow-xl space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-light italic">
              "The AI Concierge helped me pick the exact abaya size 56 for my 5'6\" height. I paid via M-Pesa Till and received my delivery in South C the very same afternoon with the official KRA tax invoice."
            </p>
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-200">Zahra K.</span>
              <span className="text-stone-500 font-mono text-[11px]">South C, Nairobi</span>
            </div>
          </div>

          <div className="bg-[#131318] p-6 rounded-2xl border border-amber-500/20 shadow-xl space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-light italic">
              "Nimrah Noir extrait de parfum is a masterpiece. Warm Cambodian agarwood and Damask rose that stays on the silk scarf for over 2 days. Truly high-end craftsmanship."
            </p>
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-200">Dr. Leyla Abdi</span>
              <span className="text-stone-500 font-mono text-[11px]">Mombasa, Kenya</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Luxury Brand Footer in Signature Black & Gold */}
      <footer className="bg-black text-stone-400 text-xs border-t border-amber-500/20 pt-12 pb-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-amber-400 overflow-hidden bg-black shrink-0">
                  <img src={settings.brandLogoUrl} alt="NC" className="w-full h-full object-cover object-center scale-[2.2]" />
                </div>
                <span className="font-serif text-2xl font-bold tracking-tight text-gold-gradient">
                  {settings.storeName}
                </span>
              </div>
              <p className="text-stone-400 text-xs font-light leading-relaxed">
                {settings.brandTagline}. Handcrafted garments tailored for modesty, grace, and modern presence.
              </p>
              <div className="pt-1 font-mono text-[11px] text-amber-400">
                Lipa na M-Pesa Till: {settings.mpesaTillNumber}
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <span className="text-white font-semibold uppercase tracking-wider text-[11px] block">
                Boutique Location &amp; Hours
              </span>
              <div className="text-stone-400 space-y-1 font-light">
                <div className="text-amber-200 font-medium">{settings.storeAddress}</div>
                <div>Monday – Saturday: 9:30 AM – 7:30 PM</div>
                <div>Sunday: 11:00 AM – 5:00 PM</div>
              </div>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <span className="text-white font-semibold uppercase tracking-wider text-[11px] block">
                Contact &amp; Inquiries
              </span>
              <div className="text-stone-400 space-y-1 font-light">
                <div>Email: <a href={`mailto:${settings.contactEmail}`} className="text-amber-300 hover:underline">{settings.contactEmail}</a></div>
                <div>Social: <span className="text-amber-300 font-mono">{settings.socialHandle}</span></div>
                <div>WhatsApp: <a href={`https://wa.me/${cleanWaNumber}`} className="text-emerald-400 font-mono hover:underline">{settings.whatsappNumber}</a></div>
                <div>KRA Tax PIN: <span className="font-mono text-stone-500">{settings.kraPin}</span></div>
              </div>
            </div>

            {/* Col 4 */}
            <div className="space-y-2">
              <span className="text-white font-semibold uppercase tracking-wider text-[11px] block">
                Store Systems
              </span>
              <div className="space-y-1.5">
                <button 
                  onClick={() => setIsAiAssistantOpen(true)}
                  className="block text-amber-300 hover:text-white transition-colors"
                >
                  ✨ AI Client Assistant (Gemini 3.8)
                </button>
                <button 
                  onClick={() => setActiveView('pos')} 
                  className="block text-stone-300 hover:text-white transition-colors"
                >
                  → In-Store POS Register
                </button>
                <button 
                  onClick={() => setActiveView('inventory')} 
                  className="block text-stone-300 hover:text-white transition-colors"
                >
                  → Live Inventory Sync
                </button>
                <button 
                  onClick={() => setActiveView('orders')} 
                  className="block text-stone-300 hover:text-white transition-colors"
                >
                  → Automatic Tax Invoices
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-900 flex flex-col sm:flex-row justify-between items-center gap-3 text-stone-600 text-[11px]">
            <div>
              © 2026 {settings.storeName} ({settings.socialHandle}). UBAH Shopping Center G7, Eastleigh 5th Street, Nairobi, Kenya.
            </div>
            <div className="flex items-center gap-4">
              <span>Safaricom M-Pesa Buy Goods Till {settings.mpesaTillNumber}</span>
              <span>·</span>
              <span>KRA eTIMS Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
