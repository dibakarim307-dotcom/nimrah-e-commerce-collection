import React, { useState } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Smartphone, 
  Save, 
  Check, 
  ShieldCheck, 
  Store as StoreIcon,
  MessageSquare
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StoreSettings } from '../types';

export const StoreSettingsModal: React.FC = () => {
  const { 
    isSettingsModalOpen, 
    setIsSettingsModalOpen, 
    settings, 
    updateSettings 
  } = useStore();

  const [formState, setFormState] = useState<StoreSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      setIsSettingsModalOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-black rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-white" />
            <h3 className="font-serif text-xl font-bold text-black">
              M-Pesa Till &amp; Store Configuration
            </h3>
          </div>

          <button 
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1.5 text-stone-500 hover:text-black rounded-lg hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* M-Pesa section */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-black">
              <Smartphone className="w-4 h-4 text-black" />
              <span>Safaricom M-Pesa Till Integration</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-black mb-1">
                  M-Pesa Till Number *
                </label>
                <input 
                  type="text"
                  required
                  value={formState.mpesaTillNumber}
                  onChange={(e) => setFormState({ ...formState, mpesaTillNumber: e.target.value })}
                  placeholder="e.g. 5428901"
                  className="w-full font-mono text-sm font-bold px-3 py-2 bg-black border border-black rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block font-medium text-black mb-1">
                  M-Pesa Registered Store Name *
                </label>
                <input 
                  type="text"
                  required
                  value={formState.mpesaStoreName}
                  onChange={(e) => setFormState({ ...formState, mpesaStoreName: e.target.value.toUpperCase() })}
                  placeholder="e.g. NIMRAH COLLECTION"
                  className="w-full font-mono uppercase px-3 py-2 bg-black border border-white rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
            <p className="text-[14px] text-black">
              Customers will see this Till number on online checkout, invoices, and POS receipts.
            </p>
          </div>

          {/* WhatsApp section */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <MessageSquare className="w-4 h-4 text-black" />
              <span>Official WhatsApp Shop Number</span>
            </div>

            <div>
              <label className="block font-medium text-black mb-1">
                WhatsApp Phone Number (with Country Code) *
              </label>
              <input 
                type="text"
                required
                value={formState.whatsappNumber}
                onChange={(e) => setFormState({ ...formState, whatsappNumber: e.target.value })}
                placeholder="0700011077"
                className="w-full font-mono px-3 py-2 bg-white border border-stone-300 rounded-lg text-black focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
            <p className="text-[13px] text-black">
              Used for 1-click customer cart forwarding, order tracking inquiries, and concierge chat.
            </p>
          </div>

          {/* Boutique Profile */}
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Boutique Legal &amp; Receipt Profile
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-white mb-1">Boutique Brand Name</label>
                <input 
                  type="text"
                  value={formState.storeName}
                  onChange={(e) => setFormState({ ...formState, storeName: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-white mb-1">Brand Tagline</label>
                <input 
                  type="text"
                  value={formState.brandTagline}
                  onChange={(e) => setFormState({ ...formState, brandTagline: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-white mb-1">Official Boutique Email</label>
                <input 
                  type="email"
                  value={formState.contactEmail}
                  onChange={(e) => setFormState({ ...formState, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-white mb-1">Social Handle</label>
                <input 
                  type="text"
                  value={formState.socialHandle}
                  onChange={(e) => setFormState({ ...formState, socialHandle: e.target.value })}
                  className="w-full font-mono px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-white mb-1">Physical Boutique Address (For Invoices)</label>
              <input 
                type="text"
                value={formState.storeAddress}
                onChange={(e) => setFormState({ ...formState, storeAddress: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-white mb-1">KRA PIN Number</label>
                <input 
                  type="text"
                  value={formState.kraPin}
                  onChange={(e) => setFormState({ ...formState, kraPin: e.target.value.toUpperCase() })}
                  className="w-full font-mono uppercase px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-white mb-1">VAT Rate (0.16 = 16%)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={formState.vatRate}
                  onChange={(e) => setFormState({ ...formState, vatRate: Number(e.target.value) })}
                  className="w-full font-mono px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-white mb-1">Currency Code</label>
                <input 
                  type="text"
                  value={formState.currency}
                  onChange={(e) => setFormState({ ...formState, currency: e.target.value })}
                  className="w-full font-mono uppercase px-3 py-2 border border-stone-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200">
            <button 
              type="submit"
              className="w-full py-3 text-xs font-bold text-black bg-stone-900 hover:bg-white rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {savedNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              <span>{savedNotice ? 'Settings Saved Successfully!' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
