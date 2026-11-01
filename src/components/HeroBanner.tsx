import React from 'react';
import { ArrowRight, MessageSquare, Truck, Sparkles, CreditCard, MapPin } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { cleanPhoneNumber } from '../utils/whatsapp';

export const HeroBanner: React.FC = () => {
  const { settings, setActiveView, setIsAiAssistantOpen } = useStore();

  const scrollToCatalog = () => {
    const catalogElement = document.getElementById('collection-catalog');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cleanWaNumber = cleanPhoneNumber(settings.whatsappNumber);

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
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="max-w-3xl space-y-6">
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
