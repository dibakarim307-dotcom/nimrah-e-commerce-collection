import React, { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Clock, 
  MapPin, 
  CreditCard,
  Package,
  Bot
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { cleanPhoneNumber } from '../utils/whatsapp';

export const WhatsAppFloatingWidget: React.FC = () => {
  const { settings, activeView, setIsTrackingModalOpen, setIsAiAssistantOpen } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  // Hide in POS view to avoid cashier screen distraction
  if (activeView === 'pos') return null;

  const cleanNumber = cleanPhoneNumber(settings.whatsappNumber);

  const sendQuickPrompt = (promptText: string) => {
    const fullText = `Salam Nimrah Collection! ${promptText}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullText)}`, '_blank');
    setIsOpen(false);
  };

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    const fullText = `Salam Nimrah Collection! ${customMsg.trim()}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullText)}`, '_blank');
    setCustomMsg('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 no-print flex flex-col items-end gap-2.5">
      {/* Quick AI Assistance Floating Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#141419] hover:bg-[#1c1c24] text-amber-300 border border-amber-400/40 rounded-full shadow-xl transition-all cursor-pointer text-xs font-semibold hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Ask AI Assistant</span>
        </button>
      )}

      {/* Popover Card */}
      {isOpen && (
        <div className="mb-2 w-80 sm:w-96 bg-[#101015] text-stone-100 rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-[#101015] text-white p-4 flex items-center justify-between border-b border-emerald-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full border border-amber-400/60 overflow-hidden bg-black flex items-center justify-center shrink-0">
                <img src={settings.brandLogoUrl} alt="NC" className="w-full h-full object-cover object-center scale-[2.2]" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm tracking-wide text-amber-100">
                  Nimrah WhatsApp Concierge
                </h4>
                <div className="text-[11px] text-emerald-300 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Eastleigh Shop G7 · Online</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts List */}
          <div className="p-4 space-y-3 bg-[#0c0c10]">
            <div className="text-xs text-stone-300 bg-[#16161c] p-3 rounded-2xl border border-amber-500/20 shadow-2xs leading-relaxed">
              Salam &amp; welcome to <strong>{settings.storeName}</strong> ({settings.socialHandle}). How can we assist you with our Eastleigh boutique today?
            </div>

            {/* AI Assistant Callout */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsAiAssistantOpen(true);
              }}
              className="w-full text-left p-2.5 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 rounded-xl text-amber-200 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Chat with AI Client Assistant (Gemini 3.8)</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400">Instant</span>
            </button>

            <div className="space-y-1.5 text-xs">
              <button 
                onClick={() => sendQuickPrompt("I would like to visit your boutique at Eastleigh 5th Street, UBAH Shopping Center Shop G7. Are you open right now?")}
                className="w-full text-left p-2.5 bg-[#16161c] hover:bg-[#1f1f27] border border-stone-800 hover:border-amber-500/30 rounded-xl text-stone-300 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Eastleigh Shop G7 directions &amp; hours</span>
              </button>

              <button 
                onClick={() => sendQuickPrompt(`I am inquiring about Lipa na M-Pesa Till ${settings.mpesaTillNumber} for an order.`)}
                className="w-full text-left p-2.5 bg-[#16161c] hover:bg-[#1f1f27] border border-stone-800 hover:border-amber-500/30 rounded-xl text-stone-300 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>M-Pesa Till {settings.mpesaTillNumber} payment verification</span>
              </button>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  setIsTrackingModalOpen(true);
                }}
                className="w-full text-left p-2.5 bg-[#16161c] hover:bg-[#1f1f27] border border-stone-800 hover:border-amber-500/30 rounded-xl text-stone-300 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Track my active delivery</span>
              </button>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleCustomSend} className="pt-2 flex gap-1.5">
              <input 
                type="text"
                placeholder="Type your message to WhatsApp..."
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="flex-1 text-xs px-3 py-2 bg-[#181820] border border-stone-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
              <button 
                type="submit"
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="text-[10px] text-stone-400 text-center font-mono pt-1">
              WhatsApp Shop: {settings.whatsappNumber} · {settings.contactEmail}
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Direct WhatsApp Concierge"
        className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl hover:shadow-emerald-900/50 transition-all duration-200 flex items-center justify-center border-2 border-amber-400/80 cursor-pointer hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
