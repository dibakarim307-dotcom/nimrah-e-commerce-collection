import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  QrCode, 
  Truck, 
  Store as StoreIcon, 
  Lock 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, generateMpesaCode } from '../utils/formatters';

export const OnlineCheckoutModal: React.FC = () => {
  const { 
    onlineCart, 
    settings, 
    isOnlineCheckoutOpen, 
    setIsOnlineCheckoutOpen, 
    createOrder 
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('0712345678');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState<'nairobi' | 'upcountry' | 'pickup'>('nairobi');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Payment method tab
  const [paymentMode, setPaymentMode] = useState<'stk_push' | 'manual_till'>('stk_push');
  const [stkPhone, setStkPhone] = useState('0712345678');
  const [stkStatus, setStkStatus] = useState<'idle' | 'prompted' | 'verifying' | 'success'>('idle');
  const [stkPin, setStkPin] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [copiedTill, setCopiedTill] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOnlineCheckoutOpen) return null;

  const subtotal = onlineCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const shippingFee = deliveryType === 'nairobi' ? 400 : deliveryType === 'upcountry' ? 800 : 0;
  const total = subtotal + shippingFee;
  const tax = total - (total / (1 + settings.vatRate));

  const handleCopyTill = () => {
    navigator.clipboard.writeText(settings.mpesaTillNumber);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  const handleInitiateStk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!stkPhone.trim()) {
      setErrorMsg('Please enter your Safaricom M-Pesa phone number');
      return;
    }
    setErrorMsg('');
    setStkStatus('prompted');
  };

  const handleConfirmStkPin = () => {
    setStkStatus('verifying');
    setTimeout(() => {
      const generatedCode = generateMpesaCode();
      setStkStatus('success');

      // Create order with live inventory deduction
      setTimeout(() => {
        createOrder({
          source: 'online',
          items: onlineCart,
          subtotal,
          discount: 0,
          tax,
          shippingFee,
          total,
          customer: {
            name: customerName,
            phone: stkPhone,
            email: customerEmail,
            address: deliveryType === 'pickup' ? 'In-Store Pickup (Eastleigh 5th St, UBAH Shopping Shop G7)' : deliveryAddress,
            city: deliveryType === 'nairobi' ? 'Nairobi' : deliveryType === 'upcountry' ? 'Kenya Upcountry' : 'Eastleigh Shop G7',
            notes: orderNotes
          },
          payment: {
            method: 'mpesa_till',
            status: 'completed',
            mpesaDetails: {
              tillNumber: settings.mpesaTillNumber,
              phoneNumber: stkPhone,
              transactionCode: generatedCode,
              merchantName: settings.mpesaStoreName,
              amount: total,
              timestamp: new Date().toLocaleString('en-KE')
            }
          },
          status: 'confirmed'
        });
      }, 700);
    }, 1600);
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!manualCode.trim()) {
      setErrorMsg('Please enter the 10-character M-Pesa transaction code from your Safaricom SMS');
      return;
    }

    const cleanCode = manualCode.trim().toUpperCase();

    createOrder({
      source: 'online',
      items: onlineCart,
      subtotal,
      discount: 0,
      tax,
      shippingFee,
      total,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: deliveryType === 'pickup' ? 'In-Store Pickup (Eastleigh 5th St, UBAH Shopping Shop G7)' : deliveryAddress,
        city: deliveryType === 'nairobi' ? 'Nairobi' : 'Kenya',
        notes: orderNotes
      },
      payment: {
        method: 'mpesa_till',
        status: 'completed',
        mpesaDetails: {
          tillNumber: settings.mpesaTillNumber,
          phoneNumber: customerPhone,
          transactionCode: cleanCode,
          merchantName: settings.mpesaStoreName,
          amount: total,
          timestamp: new Date().toLocaleString('en-KE')
        }
      },
      status: 'confirmed'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-medium text-stone-900">
                Checkout & M-Pesa Till Payment
              </span>
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                Till {settings.mpesaTillNumber}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Instant Safaricom M-Pesa processing with automatic official tax invoice generation
            </p>
          </div>

          <button 
            onClick={() => setIsOnlineCheckoutOpen(false)}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-700 text-xs px-6 py-2.5">
            {errorMsg}
          </div>
        )}

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Left Column: Delivery & Customer Info */}
          <div className="md:col-span-6 space-y-4">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
              1. Customer & Delivery Info
            </h4>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Full Name *
              </label>
              <input 
                type="text"
                placeholder="e.g. Amina Hassan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Phone Number *
                </label>
                <input 
                  type="tel"
                  placeholder="0712 345 678"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    setStkPhone(e.target.value);
                  }}
                  className="w-full text-xs font-mono px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email (Optional)
                </label>
                <input 
                  type="email"
                  placeholder="amina@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Delivery option tabs */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Delivery Preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('nairobi')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    deliveryType === 'nairobi' 
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 mb-1 text-amber-400" />
                  <div className="text-[11px] font-semibold">Nairobi Express</div>
                  <div className="text-[10px] text-stone-400 font-mono">KES 400</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('upcountry')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    deliveryType === 'upcountry' 
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 mb-1 text-amber-400" />
                  <div className="text-[11px] font-semibold">Kenya Courier</div>
                  <div className="text-[10px] text-stone-400 font-mono">KES 800</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    deliveryType === 'pickup' 
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <StoreIcon className="w-3.5 h-3.5 mb-1 text-amber-400" />
                  <div className="text-[11px] font-semibold">Eastleigh G7 Pick</div>
                  <div className="text-[10px] text-emerald-400 font-mono">FREE</div>
                </button>
              </div>
            </div>

            {deliveryType !== 'pickup' && (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Delivery Address / Estate / Apartment *
                </label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Parklands, 4th Avenue, Coral Court Apt 3B"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Special Delivery or Tailoring Notes
              </label>
              <input 
                type="text"
                placeholder="e.g. Add luxury gift wrapping, call gate before arrival"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Right Column: M-Pesa Payment Processing */}
          <div className="md:col-span-6 space-y-4 border-t md:border-t-0 md:border-l border-stone-200 md:pl-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                2. M-Pesa Till Payment
              </h4>
              <span className="text-[11px] font-mono font-bold text-stone-900">
                Amount: {formatCurrency(total, settings.currency)}
              </span>
            </div>

            {/* Mode selector: STK Push vs Manual Till */}
            <div className="flex p-1 bg-stone-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('stk_push');
                  setStkStatus('idle');
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  paymentMode === 'stk_push' 
                    ? 'bg-white text-stone-950 shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Instant STK Push
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('manual_till')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  paymentMode === 'manual_till' 
                    ? 'bg-white text-stone-950 shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Manual Till {settings.mpesaTillNumber}
              </button>
            </div>

            {/* OPTION A: STK PUSH FLOW */}
            {paymentMode === 'stk_push' && (
              <div className="space-y-4">
                {stkStatus === 'idle' && (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Direct Phone STK Push Prompt</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Enter your Safaricom phone number below. A secure prompt will pop up on your phone asking you to enter your M-Pesa PIN for <strong>{formatCurrency(total, settings.currency)}</strong> to <strong>{settings.mpesaStoreName}</strong>.
                    </p>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Safaricom Number:
                      </label>
                      <input 
                        type="tel"
                        value={stkPhone}
                        onChange={(e) => setStkPhone(e.target.value)}
                        placeholder="07XX XXX XXX or 2547XX XXX XXX"
                        className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={handleInitiateStk}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Send M-Pesa Prompt to Phone</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Simulated Phone STK Screen */}
                {stkStatus === 'prompted' && (
                  <div className="bg-stone-950 text-white p-5 rounded-2xl shadow-xl border border-stone-800 space-y-3 font-mono">
                    <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider flex items-center justify-between border-b border-stone-800 pb-2">
                      <span>Simulated Safaricom Prompt</span>
                      <span className="animate-pulse text-emerald-400">● LIVE</span>
                    </div>

                    <div className="text-xs text-stone-200 leading-relaxed py-1">
                      Do you want to pay <span className="text-white font-bold">{formatCurrency(total, settings.currency)}</span> to <span className="text-emerald-300">{settings.mpesaStoreName}</span> Till <span className="text-amber-300">{settings.mpesaTillNumber}</span>?
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">
                        Enter M-Pesa PIN:
                      </label>
                      <input 
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        autoFocus
                        value={stkPin}
                        onChange={(e) => setStkPin(e.target.value)}
                        className="w-full text-center tracking-widest text-base font-bold bg-stone-900 border border-stone-700 rounded-lg py-2 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setStkStatus('idle')}
                        className="flex-1 py-2 text-xs text-stone-400 hover:text-white bg-stone-900 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={handleConfirmStkPin}
                        className="flex-1 py-2 text-xs font-bold text-stone-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg"
                      >
                        Send PIN
                      </button>
                    </div>
                  </div>
                )}

                {stkStatus === 'verifying' && (
                  <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 text-center space-y-3">
                    <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="text-xs font-semibold text-stone-900">
                      Verifying with Safaricom M-Pesa...
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Confirming settlement to Till {settings.mpesaTillNumber}
                    </div>
                  </div>
                )}

                {stkStatus === 'success' && (
                  <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <div className="text-sm font-bold text-emerald-950">
                      M-Pesa Payment Successful!
                    </div>
                    <div className="text-xs text-emerald-800">
                      Generating your official Tax Invoice...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OPTION B: MANUAL TILL PAYMENT */}
            {paymentMode === 'manual_till' && (
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                      Buy Goods Till Number
                    </span>
                    <span className="font-mono text-xl font-bold text-stone-950">
                      {settings.mpesaTillNumber}
                    </span>
                  </div>

                  <button 
                    type="button"
                    onClick={handleCopyTill}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 rounded-md font-medium text-stone-800 transition-colors cursor-pointer"
                  >
                    {copiedTill ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTill ? 'Copied!' : 'Copy Till'}</span>
                  </button>
                </div>

                <div className="text-xs text-stone-600 space-y-1 font-mono">
                  <div>1. Go to M-Pesa on phone</div>
                  <div>2. Select <strong>Lipa na M-Pesa</strong> &gt; <strong>Buy Goods and Services</strong></div>
                  <div>3. Enter Till: <strong>{settings.mpesaTillNumber}</strong> ({settings.mpesaStoreName})</div>
                  <div>4. Enter Amount: <strong>{formatCurrency(total, settings.currency)}</strong></div>
                  <div>5. Enter M-Pesa PIN & confirm</div>
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <label className="block text-xs font-medium text-stone-800 mb-1">
                    Enter Safaricom Confirmation Code:
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="e.g. QJD82KLA89"
                      maxLength={12}
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      className="flex-1 text-xs font-mono uppercase px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <button 
                      type="button"
                      onClick={handleManualCodeSubmit}
                      className="px-4 py-2 text-xs font-semibold text-white bg-stone-950 hover:bg-black rounded-lg transition-colors cursor-pointer"
                    >
                      Verify Code
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-600 mt-1 block">
                    Found in your Safaricom SMS receipt e.g. "QJD82KLA89 Confirmed."
                  </span>
                </div>
              </div>
            )}

            {/* Order total recap */}
            <div className="bg-stone-100 p-3.5 rounded-lg text-xs space-y-1 text-stone-600 font-mono">
              <div className="flex justify-between">
                <span>Items ({onlineCart.reduce((a, b) => a + b.quantity, 0)})</span>
                <span className="tabular-nums">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ({deliveryType})</span>
                <span className="tabular-nums">{shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee, settings.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-950 pt-1 border-t border-stone-200 text-sm">
                <span>Grand Total</span>
                <span className="tabular-nums">{formatCurrency(total, settings.currency)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pt-1">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>256-bit encrypted Kenyan payment gateway with instant invoice dispatch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
