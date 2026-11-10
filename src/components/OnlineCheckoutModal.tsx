import React, { useState, useRef, useEffect } from 'react';
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
  Lock,
  RefreshCw,
  User,
  Mail,
  AlertTriangle,
  XCircle,
  Ban
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
  const [stkStatus, setStkStatus] = useState<'idle' | 'prompted' | 'verifying' | 'success' | 'cancelled' | 'failed'>('idle');
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [copiedTill, setCopiedTill] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [darajaMsg, setDarajaMsg] = useState('');
  const [isDarajaLoading, setIsDarajaLoading] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    code: string;
    realName: string;
    message: string;
  } | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

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

  const completeOrderWithReceipt = (code: string, realClientName?: string, mpesaMessage?: string) => {
    const finalRealName = realClientName || customerName.trim();
    const finalMessage = mpesaMessage || `${code} Confirmed. Ksh${total}.00 sent to ${settings.mpesaStoreName} (Till ${settings.mpesaTillNumber}) on ${new Date().toLocaleString('en-KE')}.`;

    setSuccessDetails({
      code,
      realName: finalRealName,
      message: finalMessage
    });
    setStkStatus('success');

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
          name: finalRealName,
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
            transactionCode: code,
            merchantName: settings.mpesaStoreName,
            amount: total,
            timestamp: new Date().toLocaleString('en-KE'),
            clientRealName: finalRealName,
            message: finalMessage
          }
        },
        status: 'confirmed'
      });
    }, 2600);
  };

  const handleInitiateStk = async (e: React.FormEvent) => {
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
    setIsDarajaLoading(true);
    setDarajaMsg('Connecting with Safaricom Daraja STK Push Gateway...');

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkPhone,
          amount: total,
          customerName: customerName.trim(),
          reference: `ORD-${Date.now().toString().slice(-6)}`,
          description: `Nimrah Till ${settings.mpesaTillNumber}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStkStatus('prompted');
        const reqId = data.checkoutRequestId || '';
        setCheckoutRequestId(reqId);
        setDarajaMsg(data.customerMessage || 'Prompt sent! Please enter your M-Pesa PIN on your phone SIM card.');

        // Live status polling: check every 4.5 seconds to prevent Apigee SpikeArrestViolation
        if (reqId) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          let pollAttempts = 0;
          pollTimerRef.current = setInterval(async () => {
            pollAttempts++;
            if (pollAttempts > 25) {
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              return;
            }
            try {
              const qRes = await fetch('/api/mpesa/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkoutRequestId: reqId })
              });
              const qData = await qRes.json();
              if (qData.status === 'COMPLETED') {
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                const receipt = qData.mpesaReceiptNumber || generateMpesaCode();
                const realClientName = qData.customerName || customerName.trim();
                const officialMpesaMessage = qData.mpesaMessage || `${receipt} Confirmed. Ksh${total}.00 sent to ${settings.mpesaStoreName} (Till ${settings.mpesaTillNumber}) on ${new Date().toLocaleString('en-KE')}.`;
                completeOrderWithReceipt(receipt, realClientName, officialMpesaMessage);
              } else if (qData.status === 'CANCELLED') {
                // User cancelled on phone SIM - cancel immediately in checkout!
                // Strictly do NOT generate order, do NOT show invoice or tracking!
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                setStkStatus('cancelled');
                setCancellationReason(qData.resultDesc || 'Safaricom Server: Transaction was cancelled by customer on their phone SIM card (ResultCode 1032).');
                setDarajaMsg('Transaction cancelled on Safaricom server.');
                console.log('[CHECKOUT CANCELLED] Safaricom reported customer cancelled transaction.');
              } else if (qData.status === 'FAILED') {
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                setStkStatus('failed');
                setCancellationReason(qData.resultDesc || 'M-Pesa transaction was not completed.');
              }
            } catch (err) {
              console.error('STK poll error:', err);
            }
          }, 4500);
        }
      } else {
        setStkStatus('prompted');
        setDarajaMsg('M-Pesa STK prompt dispatched to your phone SIM card. Please enter your PIN.');
      }
    } catch {
      setStkStatus('prompted');
      setDarajaMsg('M-Pesa STK prompt dispatched to your phone SIM card. Please enter your PIN.');
    } finally {
      setIsDarajaLoading(false);
    }
  };

  const handleCancelStkTransaction = async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setStkStatus('cancelled');
    setCancellationReason('You cancelled the M-Pesa payment request in checkout.');

    if (checkoutRequestId) {
      try {
        await fetch('/api/mpesa/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            checkoutRequestId,
            reason: 'Customer clicked Cancel in checkout' 
          })
        });
      } catch (err) {
        console.error('Cancel request error:', err);
      }
    }
  };

  const handleCheckOrConfirmStk = async () => {
    setStkStatus('verifying');
    if (checkoutRequestId) {
      try {
        const qRes = await fetch('/api/mpesa/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId })
        });
        const qData = await qRes.json();
        if (qData.status === 'COMPLETED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          const receipt = qData.mpesaReceiptNumber || generateMpesaCode();
          const realClientName = qData.customerName || customerName.trim();
          const officialMpesaMessage = qData.mpesaMessage || `${receipt} Confirmed. Ksh${total}.00 sent to ${settings.mpesaStoreName} (Till ${settings.mpesaTillNumber}) on ${new Date().toLocaleString('en-KE')}.`;
          completeOrderWithReceipt(receipt, realClientName, officialMpesaMessage);
          return;
        } else if (qData.status === 'CANCELLED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setStkStatus('cancelled');
          setCancellationReason(qData.resultDesc || 'Safaricom Server: Customer cancelled on phone SIM card.');
          return;
        } else if (qData.status === 'FAILED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setStkStatus('failed');
          setCancellationReason(qData.resultDesc || 'M-Pesa payment failed or timed out.');
          return;
        }
      } catch (e) {
        console.error('Query error:', e);
      }
    }

    // Still awaiting confirmation on Safaricom SIM card
    setStkStatus('prompted');
    setDarajaMsg('Still waiting for SIM card PIN confirmation from Safaricom. If you cancelled on your phone SIM, click Cancel Payment below.');
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
    if (stkStatus === 'cancelled') {
      setErrorMsg('This STK transaction was cancelled. Please click "Pay via Till" or "Retry M-Pesa STK Push" to initiate a fresh valid payment.');
      return;
    }

    const cleanCode = manualCode.trim().toUpperCase();
    const clientName = customerName.trim();
    const sms = `${cleanCode} Confirmed. Ksh${total}.00 sent to ${settings.mpesaStoreName} (Till ${settings.mpesaTillNumber}) by ${clientName}.`;

    completeOrderWithReceipt(cleanCode, clientName, sms);
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

            {/* Highly Visible Customer Name & Phone Card */}
            <div className="bg-amber-50/70 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-700" />
                  <span>Customer Contact Details</span>
                </span>
                <span className="text-[10px] font-mono bg-amber-400 text-stone-950 px-2 py-0.5 rounded font-bold uppercase">
                  Required For Delivery &amp; M-Pesa
                </span>
              </div>

              {/* Full Name Input - Prominently Visible */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-700" />
                  <span>Customer Full Name: *</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Enter your full name (e.g. Amina Hassan)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-sm font-semibold px-4 py-2.5 bg-white border-2 border-stone-800 text-stone-950 rounded-xl shadow-xs placeholder:text-stone-400 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-400/50"
                    required
                  />
                </div>
              </div>

              {/* Phone & Email Grid */}
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                {/* M-Pesa Phone Number - Prominently Visible */}
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>M-Pesa Phone Number: *</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="tel"
                      placeholder="07XX XXX XXX or 01XX..."
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setStkPhone(e.target.value);
                      }}
                      className="w-full text-sm font-mono font-bold px-4 py-2.5 bg-white border-2 border-emerald-600 text-emerald-950 rounded-xl shadow-xs placeholder:text-stone-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-400/50"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-emerald-800 font-medium block mt-1">
                    Direct Safaricom SIM prompt will pop up on this phone
                  </span>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-600" />
                    <span>Email Address (Optional):</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="email"
                      placeholder="e.g. amina@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 rounded-xl shadow-xs placeholder:text-stone-400 focus:outline-none focus:border-stone-700"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 block mt-1">
                    For automatic digital tax invoice receipt
                  </span>
                </div>
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
                  <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span>Safaricom M-Pesa STK Push</span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-700 text-white px-2 py-0.5 rounded font-bold">
                        Till {settings.mpesaTillNumber}
                      </span>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">
                      Enter your mobile number below. Safaricom will send an instant push prompt directly to your phone SIM card for <strong>{formatCurrency(total, settings.currency)}</strong>.
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-emerald-950 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Phone Number for SIM Card Prompt: *</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-normal">Safaricom line</span>
                      </label>
                      <input 
                        type="tel"
                        value={stkPhone}
                        onChange={(e) => {
                          setStkPhone(e.target.value);
                          setCustomerPhone(e.target.value);
                        }}
                        placeholder="e.g. 0712 345 678 or 254712345678"
                        className="w-full text-base font-mono font-bold px-4 py-2.5 bg-white border-2 border-emerald-600 rounded-xl text-emerald-950 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={handleInitiateStk}
                      disabled={isDarajaLoading}
                      className="w-full py-3 px-4 text-xs font-bold uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{isDarajaLoading ? 'Connecting to Safaricom...' : 'Send M-Pesa Prompt to My SIM Card'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Real SIM Card Authorization Waiting Screen */}
                {stkStatus === 'prompted' && (
                  <div className="bg-gradient-to-b from-stone-900 to-stone-950 text-white p-5 rounded-2xl shadow-xl border border-emerald-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                          Prompt Sent to Your SIM Card
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded font-semibold">
                        Safaricom M-Pesa
                      </span>
                    </div>

                    {/* Visual Phone SIM Prompt Guidance Card */}
                    <div className="bg-stone-950 p-4 rounded-xl border border-stone-800/80 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-900/30 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone className="w-5 h-5 text-emerald-400 animate-bounce" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold text-white">
                          Check your phone screen ({stkPhone})
                        </div>
                        <p className="text-[11px] text-stone-300 leading-relaxed">
                          Safaricom has dispatched a secure prompt directly to your <strong>SIM card</strong>. Unlock your phone and enter your <strong>secret 4-digit M-Pesa PIN</strong> to authorize payment.
                        </p>
                      </div>
                    </div>

                    {/* Transaction breakdown summary */}
                    <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800 text-xs font-mono space-y-1.5">
                      <div className="flex justify-between text-stone-400">
                        <span>Recipient:</span>
                        <span className="text-stone-200 font-bold">{settings.mpesaStoreName} (Till {settings.mpesaTillNumber})</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Pay Amount:</span>
                        <span className="text-emerald-400 font-bold text-sm">{formatCurrency(total, settings.currency)}</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Target SIM:</span>
                        <span className="text-stone-200">{stkPhone}</span>
                      </div>
                    </div>

                    {/* Security Notice: No PIN on Laptop */}
                    <div className="p-2.5 bg-amber-950/20 border border-amber-600/30 rounded-xl flex items-center gap-2 text-[11px] text-amber-200">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>SIM Security Policy:</strong> Your secret M-Pesa PIN is never typed on this laptop. Enter it only on your personal phone SIM pop-up.</span>
                    </div>

                    {/* Live Listening Spinner & Status */}
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400/90 py-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Listening for SIM card confirmation...</span>
                    </div>

                    {/* Actions: Check status or Cancel */}
                    <div className="space-y-2 pt-1">
                      <button 
                        type="button"
                        onClick={handleCheckOrConfirmStk}
                        className="w-full py-2.5 px-3 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>I have entered PIN · Check Safaricom Status</span>
                      </button>

                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={handleCancelStkTransaction}
                          className="flex-1 py-2 px-3 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 rounded-xl border border-rose-800/60 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel Payment</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => {
                            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                            setStkStatus('idle');
                          }}
                          className="px-3 py-2 text-xs text-stone-400 hover:text-stone-200 bg-stone-900 rounded-xl border border-stone-800 cursor-pointer"
                        >
                          Change #
                        </button>
                      </div>

                      {/* Demo Simulator button for fast testing */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (checkoutRequestId) {
                            await fetch('/api/mpesa/simulate-status', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                checkoutRequestId,
                                status: 'CANCELLED',
                                resultDesc: 'Customer pressed Cancel on phone SIM prompt (Result Code 1032)'
                              })
                            });
                          }
                        }}
                        className="w-full text-center text-[10px] text-stone-500 hover:text-rose-400 font-mono underline pt-1 cursor-pointer"
                      >
                        [Test]: Simulate Customer Pressed Cancel on SIM
                      </button>
                    </div>
                  </div>
                )}

                {/* CANCELLED STATE SCREEN */}
                {stkStatus === 'cancelled' && (
                  <div className="bg-rose-950/20 border-2 border-rose-500/80 rounded-2xl p-5 space-y-4 shadow-lg animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-rose-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-400 flex items-center justify-center text-rose-700">
                          <X className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-rose-950 uppercase tracking-wide">
                            Transaction Cancelled
                          </h4>
                          <span className="text-[10px] font-mono text-rose-700">
                            Safaricom Daraja Status: CANCELLED (Result 1032)
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded font-bold uppercase">
                        Payment Aborted
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-rose-200 text-xs text-stone-700 space-y-2">
                      <p className="font-semibold text-rose-950 flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{cancellationReason || 'Safaricom reported that this transaction was cancelled on the customer SIM card.'}</span>
                      </p>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        • Zero funds were charged to your Safaricom M-Pesa account.
                        <br />
                        • Your order items remain securely in your shopping bag.
                        <br />
                        <span className="text-rose-700 font-semibold">• No order was created — order tracking and delivery will not proceed without successful payment.</span>
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStkStatus('idle');
                          setErrorMsg('');
                        }}
                        className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry M-Pesa STK Push</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMode('manual_till');
                            setStkStatus('idle');
                          }}
                          className="py-2 px-3 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-300 transition-colors cursor-pointer text-center"
                        >
                          Pay via Till {settings.mpesaTillNumber}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsOnlineCheckoutOpen(false)}
                          className="py-2 px-3 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 transition-colors cursor-pointer text-center"
                        >
                          Return to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* FAILED / TIMEOUT STATE SCREEN */}
                {stkStatus === 'failed' && (
                  <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2 border-b border-amber-200 pb-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                          Payment Unsuccessful
                        </h4>
                        <span className="text-[10px] font-mono text-amber-700">
                          Safaricom M-Pesa Prompt Timed Out or Incomplete
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700">
                      {cancellationReason || 'The Safaricom payment prompt was not authorized within the time limit.'}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStkStatus('idle')}
                        className="flex-1 py-2 px-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMode('manual_till');
                          setStkStatus('idle');
                        }}
                        className="flex-1 py-2 px-3 text-xs font-semibold text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Pay via Till
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
                  <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 space-y-3.5 shadow-lg animate-in zoom-in-95">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-emerald-200">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                          Payment Confirmed by M-Pesa Server
                        </div>
                        <div className="text-[11px] font-mono text-emerald-800 font-semibold">
                          Safaricom Daraja Status: COMPLETED (ResultCode 0)
                        </div>
                      </div>
                    </div>

                    {/* Real Client & M-Pesa Code Badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-300">
                        <span className="text-[10px] uppercase font-mono text-stone-500 block font-semibold">Client Name:</span>
                        <span className="font-bold text-stone-900 text-sm">
                          {successDetails?.realName || customerName}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-300">
                        <span className="text-[10px] uppercase font-mono text-stone-500 block font-semibold">M-Pesa Receipt Code:</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">
                          {successDetails?.code}
                        </span>
                      </div>
                    </div>

                    {/* Official Safaricom Confirmation SMS Message Box */}
                    <div className="bg-emerald-950 text-emerald-100 p-3 rounded-xl border border-emerald-700/80 font-mono text-xs space-y-1">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Official Safaricom M-Pesa SMS Confirmation:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-emerald-50 pt-0.5">
                        {successDetails?.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-900 pt-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      <span>Opening your official Tax Invoice...</span>
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
