import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  MapPin, 
  CreditCard, 
  Ruler, 
  RotateCcw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { AiChatMessage } from '../types';
import { cleanPhoneNumber } from '../utils/whatsapp';

interface AiClientAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiClientAssistant: React.FC<AiClientAssistantProps> = ({ isOpen, onClose }) => {
  const { settings, setIsTrackingModalOpen } = useStore();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Salam and welcome to Nimrah Collection! ✨\n\nI am your dedicated AI Client Concierge. I can help you with:\n• Abaya sizing & height recommendations (Sizes 52–60)\n• Visiting our Eastleigh 5th Street UBAH Shopping Center boutique (Shop G7)\n• M-Pesa Till 5428901 payments & instant tax invoices\n• Fragrance notes for our signature Nimrah Noir extrait\n• Order tracking & delivery timelines\n\nHow may I assist you today?`,
      timestamp: 'Just now'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: "📐 Abaya sizing guide for my height", query: "Can you provide a sizing guide for your abayas based on my height?" },
    { label: "📍 Eastleigh boutique location & hours", query: "Where exactly is your shop located in Eastleigh and what are your opening hours?" },
    { label: "💳 How to pay via M-Pesa Till 5428901", query: "How do I pay using your M-Pesa Till number 5428901?" },
    { label: "✨ Tell me about Nimrah Noir perfume", query: "What are the fragrance notes and sillage of Nimrah Noir extrait de parfum?" },
    { label: "📦 How do I track my active order?", query: "How can I track the delivery status of my Nimrah Collection order?" }
  ];

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map(m => ({ role: m.sender, content: m.text }))
        })
      });

      const data = await response.json();
      const aiReplyText = data.reply || "Thank you for inquiring. Please feel free to also reach our team directly on WhatsApp for immediate support!";

      const assistantMsg: AiChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Failed to communicate with AI endpoint:', err);
      const fallbackMsg: AiChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: `We are pleased to assist you! For immediate personalized help with bespoke tailoring, sizing, or our Eastleigh UBAH G7 boutique, feel free to chat with our stylists directly on WhatsApp.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanWaNumber = cleanPhoneNumber(settings.whatsappNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-xs flex justify-end no-print">
      <div 
        className="w-full max-w-lg bg-[#0d0d0f] border-l border-amber-500/20 text-stone-100 h-full shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Black & Gold Luxury Brand Identity */}
        <div className="p-4 sm:p-5 border-b border-amber-500/20 bg-[#121216] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border border-amber-400/60 overflow-hidden bg-black flex items-center justify-center shadow-md">
                <img 
                  src={settings.brandLogoUrl} 
                  alt="Nimrah Collection" 
                  className="w-full h-full object-cover object-center scale-[2.2]"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif text-lg font-bold text-amber-200 tracking-wide">
                  Nimrah AI Concierge
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                <span>Gemini 3.8 Flash Powered</span>
                <span>·</span>
                <span>Eastleigh Shop G7</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessages([{
                  id: 'welcome',
                  sender: 'assistant',
                  text: 'How can I assist you with your modest wardrobe or perfume selection today?',
                  timestamp: 'Just now'
                }]);
              }}
              title="Reset conversation"
              className="p-1.5 text-stone-400 hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat message stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-[#0d0d0f] to-[#121216]">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full border border-amber-500/40 bg-stone-900 shrink-0 overflow-hidden flex items-center justify-center">
                  <img 
                    src={settings.brandLogoUrl} 
                    alt="NC" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none shadow-md' 
                  : 'bg-[#18181f] text-stone-200 border border-amber-500/20 rounded-tl-none shadow-sm'
              }`}>
                <div className="whitespace-pre-line">{msg.text}</div>
                <div className={`text-[10px] mt-1.5 font-mono ${
                  msg.sender === 'user' ? 'text-amber-950/70 text-right' : 'text-stone-500'
                }`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 shrink-0 flex items-center justify-center text-amber-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full border border-amber-500/40 bg-stone-900 shrink-0 overflow-hidden flex items-center justify-center">
                <img src={settings.brandLogoUrl} alt="NC" className="w-full h-full object-cover" />
              </div>
              <div className="bg-[#18181f] border border-amber-500/20 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-stone-400 ml-2 font-mono">Consulting atelier knowledge...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 bg-[#121216] border-t border-amber-500/10 space-y-2">
          <div className="text-[11px] font-mono text-stone-400 flex items-center justify-between">
            <span>Suggested client inquiries:</span>
            <span className="text-amber-400">Shop G7 Eastleigh</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.query)}
                disabled={isLoading}
                className="px-2.5 py-1 text-[11px] bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-amber-500/20 rounded-lg transition-colors cursor-pointer text-left"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar & WhatsApp Direct Route */}
        <div className="p-4 bg-[#0d0d0f] border-t border-amber-500/20 space-y-2.5">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputPrompt);
            }} 
            className="flex gap-2"
          >
            <input 
              type="text"
              placeholder="Ask about sizing, Eastleigh location, M-Pesa Till..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs px-3.5 py-2.5 bg-[#18181f] border border-stone-800 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50"
            />
            <button 
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold rounded-xl transition-colors flex items-center justify-center cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick link to human concierge on WhatsApp */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <a 
              href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent("Salam Nimrah Collection! I was chatting with your AI Concierge and would like direct assistance with an order/fitting at Shop G7.")}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 hover:underline"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Prefer WhatsApp? Chat with our Eastleigh Stylist</span>
            </a>

            <button 
              onClick={() => {
                onClose();
                setIsTrackingModalOpen(true);
              }}
              className="text-amber-300 hover:text-amber-200 hover:underline"
            >
              Track Order #
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
