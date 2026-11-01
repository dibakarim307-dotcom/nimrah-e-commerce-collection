import React from 'react';
import { ArrowRight, MessageSquare, Truck, Sparkles, CreditCard, MapPin } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { cleanPhoneNumber } from '../utils/whatsapp';
import { PerfumeAnimationOverlay } from './PerfumeAnimationOverlay';

export const HeroBanner: React.FC = () => {
  const { products, settings, setActiveView, setIsAiAssistantOpen, setSelectedProductForModal } = useStore();

  const scrollToCatalog = () => {
    const catalogElement = document.getElementById('collection-catalog');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cleanWaNumber = cleanPhoneNumber(settings.whatsappNumber);
  const perfumeProduct = products.find(p => p.id === 'prod-04' || p.category === 'Signature Fragrance');

  return (
    <section className="relative overflow-hidden bg-[#0a0a0d] text-stone-100 border-b border-amber-500/20">
      {/* Visual campaign backdrop with measured scrim */}
      <div className="relative min-h-[600px] lg:min-h-[660px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/src/assets/images/hero_nimrah_collection_1793448134362.jpg" 
            alt="Nimrah Collection Haute Couture Campaign"
            className="w-full h-full object-cover object-center brightness-75 contrast-110"
            referrerPolicy="no-referrer"
          />
          {/* Measured deep noir & gold gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-transparent to-black/60" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headlines & CTA Actions */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quiet text kicker with gold branding */}
              <div className="inline-flex items-center gap-2 text-amber-300 text-xs tracking-widest uppercase font-mono font-semibold bg-black/60 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings.socialHandle} · Haute Modesty 2026</span>
              </div>

              {/* Display Headline with balanced luxury serif */}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.15] text-balance">
                Timeless modesty in <span className="text-gold-gradient font-medium italic">black &amp; pure gold</span>.
              </h1>

              {/* Location & Brand Prose */}
              <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed max-w-2xl">
                Bespoke French silk velvet abayas, raw spun silk co-ords, and our signature <strong className="text-amber-200 font-medium">Nimrah Noir</strong> extrait de parfum. Visit our boutique at <span className="text-amber-300 font-medium">Eastleigh 5th Street, UBAH Shopping Center, Shop G7</span> or order online with instant M-Pesa Till settlement.
              </p>

              {/* Location Badge */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-300 font-mono">
                <span className="flex items-center gap-1.5 bg-[#16161c]/90 px-3.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Eastleigh 5th St · UBAH Shopping G7</span>
                </span>
                <span className="flex items-center gap-1.5 bg-[#16161c]/90 px-3.5 py-1.5 rounded-lg border border-amber-500/30 text-stone-300 shadow-sm">
                  <span>Lipa na M-Pesa Till: <strong className="text-amber-400">{settings.mpesaTillNumber}</strong></span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button 
                  onClick={scrollToCatalog}
                  className="px-6 py-3.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer whitespace-nowrap shrink-0 hover:scale-[1.02]"
                >
                  <span>Explore Atelier Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => setIsAiAssistantOpen(true)}
                  className="px-5 py-3.5 text-xs font-semibold text-amber-200 bg-[#16161d] hover:bg-[#1f1f27] border border-amber-400/40 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ask AI Client Concierge</span>
                </button>

                <a 
                  href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(`Salam Nimrah Collection! I am inquiring from Eastleigh regarding your latest collection and boutique fitting at Shop G7.`)}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="px-5 py-3.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-colors flex items-center gap-2 border border-emerald-500/40 whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span>WhatsApp Shop</span>
                </a>
              </div>
            </div>

            {/* Right Column: Exclusive Animated Perfume Showcase */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div 
                onClick={() => {
                  if (perfumeProduct) setSelectedProductForModal(perfumeProduct);
                }}
                className="group relative w-full max-w-[340px] sm:max-w-[370px] bg-[#121217]/95 backdrop-blur-md rounded-3xl border-2 border-amber-400/60 hover:border-amber-300 p-5 shadow-2xl shadow-amber-950/50 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="uppercase tracking-widest text-[10px]">Artisanal Parfumerie</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                    35% Extrait · 24H Sillage
                  </span>
                </div>

                {/* Animated Bottle Container */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#0c0c11] my-3 border border-amber-500/30">
                  <img 
                    src="/src/assets/images/product_signature_perfume_1793448136885.jpg" 
                    alt="Nimrah Noir Extrait de Parfum"
                    className="w-full h-full object-cover object-center animate-perfume-levitate brightness-100 transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Exclusive Animated Perfume Overlay with sillage aura, rising mist & interactive spritz spray */}
                  <PerfumeAnimationOverlay compact={false} />
                </div>

                {/* Perfume Info Footer */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                        Nimrah Noir Extrait
                      </h3>
                      <p className="text-[11px] text-stone-400 font-light">
                        Cambodian Oud · Damask Rose · Vanilla
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-amber-300">
                        KES 9,500
                      </span>
                      <span className="block text-[10px] text-stone-500 font-mono">
                        50ml Flacon
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (perfumeProduct) setSelectedProductForModal(perfumeProduct);
                      }}
                      className="w-full py-2.5 px-3 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors text-center shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                      <span>Experience Sillage &amp; Order</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Item Proof & Trust Strip with Black & Gold Luxury Style */}
      <div className="border-t border-amber-500/20 bg-[#08080a] text-stone-300 text-xs py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-white block">M-Pesa Till {settings.mpesaTillNumber}</span>
              <span className="text-[11px] text-stone-400">Automated KRA tax invoices on payment</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-white block">Eastleigh 5th Street</span>
              <span className="text-[11px] text-stone-400">UBAH Shopping Center, Shop G7</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-white block">AI Client Assistance</span>
              <span className="text-[11px] text-stone-400">Real-time sizing, fabric &amp; order help</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Truck className="w-4 h-4 text-stone-300 shrink-0" />
            <div>
              <span className="font-semibold text-white block">Nairobi Express Dispatch</span>
              <span className="text-[11px] text-stone-400">East Africa &amp; Global DHL shipping</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
