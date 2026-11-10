import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  CheckCircle2, 
  FileText, 
  Receipt, 
  Copy, 
  Check, 
  ShieldCheck,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { buildWhatsAppInvoiceShareUrl } from '../utils/whatsapp';

export const InvoiceModal: React.FC = () => {
  const { 
    isInvoiceModalOpen, 
    setIsInvoiceModalOpen, 
    selectedOrderForInvoice, 
    settings 
  } = useStore();

  const [formatMode, setFormatMode] = useState<'a4' | 'thermal'>('a4');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isInvoiceModalOpen || !selectedOrderForInvoice) return null;

  const order = selectedOrderForInvoice;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const url = buildWhatsAppInvoiceShareUrl(order, settings);
    window.open(url, '_blank');
  };

  const handleCopyMpesaCode = () => {
    if (order.payment.mpesaDetails?.transactionCode) {
      navigator.clipboard.writeText(order.payment.mpesaDetails.transactionCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden during actual print) */}
        <div className="p-4 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs font-semibold text-white block">
                Automatic Invoice Generated · Order #{order.id}
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                Payment verified via M-Pesa Till {settings.mpesaTillNumber}
              </span>
            </div>
          </div>

          {/* Format switcher & actions */}
          <div className="flex items-center gap-2">
            <div className="flex bg-stone-800 p-1 rounded-lg">
              <button 
                onClick={() => setFormatMode('a4')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  formatMode === 'a4' 
                    ? 'bg-amber-400 text-stone-950 font-bold' 
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Tax Invoice</span>
              </button>

              <button 
                onClick={() => setFormatMode('thermal')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  formatMode === 'thermal' 
                    ? 'bg-amber-400 text-stone-950 font-bold' 
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm POS Slip</span>
              </button>
            </div>

            <button 
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white text-stone-900 hover:bg-stone-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button 
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </button>

            <button 
              onClick={() => setIsInvoiceModalOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content Area */}
        <div className="p-6 sm:p-10 max-h-[82vh] overflow-y-auto bg-stone-50 flex justify-center print-wrapper">
          {/* FORMAT 1: A4 LUXURY TAX INVOICE */}
          {formatMode === 'a4' && (
            <div className="w-full max-w-3xl bg-white p-8 sm:p-12 shadow-sm rounded-xl border border-stone-200 text-stone-900 font-sans print-container">
              {/* Header: Brand & Invoice Meta */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b-2 border-stone-900">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-amber-600/60 overflow-hidden bg-black shrink-0">
                    <img src={settings.brandLogoUrl} alt="NC" className="w-full h-full object-cover object-center scale-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-3xl font-bold tracking-tight text-stone-950">
                        {settings.storeName}
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs text-stone-500 uppercase tracking-widest mt-0.5 font-medium">
                      {settings.brandTagline} · {settings.socialHandle}
                    </p>
                    <div className="text-xs text-stone-600 mt-2 space-y-0.5 font-light">
                      <div>{settings.storeAddress}</div>
                      <div>Concierge: {settings.storePhone} · {settings.contactEmail}</div>
                      <div className="font-mono text-stone-500">KRA PIN: {settings.kraPin} · VAT Registered</div>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="inline-block text-xs font-mono font-bold tracking-widest bg-stone-900 text-white px-3 py-1 rounded">
                    TAX INVOICE
                  </span>
                  <div className="text-sm font-mono font-bold text-stone-900 pt-1">
                    Invoice #{order.id}
                  </div>
                  <div className="text-xs text-stone-500">
                    Date: <span className="text-stone-800">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Channel: <span className="uppercase font-semibold text-stone-800">{order.source}</span>
                  </div>
                  {order.cashierName && (
                    <div className="text-xs text-stone-500">
                      Cashier: <span className="text-stone-800">{order.cashierName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill To & Payment Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-stone-200 text-xs">
                <div>
                  <span className="uppercase text-[11px] font-bold text-stone-400 tracking-wider block mb-1">
                    Billed To (Customer):
                  </span>
                  <div className="text-sm font-bold text-stone-900">{order.customer.name}</div>
                  <div className="text-stone-600 font-mono mt-0.5">{order.customer.phone}</div>
                  {order.customer.email && (
                    <div className="text-stone-600">{order.customer.email}</div>
                  )}
                  {order.customer.address && (
                    <div className="text-stone-600 mt-1">{order.customer.address}, {order.customer.city}</div>
                  )}
                  {order.customer.notes && (
                    <div className="text-stone-500 italic mt-1">Note: "{order.customer.notes}"</div>
                  )}
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/90 space-y-2">
                  <span className="uppercase text-[11px] font-bold text-stone-500 tracking-wider block">
                    Settlement Details:
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Payment Channel:</span>
                    <span className="font-semibold text-stone-900 uppercase">
                      {order.payment.method.replace('_', ' ')}
                    </span>
                  </div>

                  {order.payment.mpesaDetails && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600">M-Pesa Till:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {order.payment.mpesaDetails.tillNumber} ({order.payment.mpesaDetails.merchantName})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600">Safaricom Receipt Code:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {order.payment.mpesaDetails.transactionCode}
                          </span>
                          <button 
                            onClick={handleCopyMpesaCode}
                            className="text-stone-400 hover:text-stone-700 p-1 no-print"
                            title="Copy code"
                          >
                            {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      {order.payment.mpesaDetails.clientRealName && (
                        <div className="flex justify-between items-center">
                          <span className="text-stone-600">M-Pesa Verified Client:</span>
                          <span className="font-semibold text-stone-900">
                            {order.payment.mpesaDetails.clientRealName}
                          </span>
                        </div>
                      )}
                      {order.payment.mpesaDetails.message && (
                        <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-300 font-mono text-[11px] text-emerald-950 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                            Safaricom M-Pesa Official Confirmation SMS:
                          </span>
                          <p className="leading-snug">
                            {order.payment.mpesaDetails.message}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {order.payment.cashReceived !== undefined && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600">Cash Tendered:</span>
                        <span className="font-mono text-stone-900">{formatCurrency(order.payment.cashReceived, settings.currency)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-600">Change Returned:</span>
                        <span className="font-mono text-stone-900">{formatCurrency(order.payment.cashChange || 0, settings.currency)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t border-stone-200 text-emerald-800 font-bold">
                    <span>Status:</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PAID &amp; SETTLED</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-300 text-stone-500 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 font-semibold">Item &amp; Specifications</th>
                      <th className="py-2.5 font-semibold text-center">SKU</th>
                      <th className="py-2.5 font-semibold text-center">Size / Color</th>
                      <th className="py-2.5 font-semibold text-center">Qty</th>
                      <th className="py-2.5 font-semibold text-right">Unit Price</th>
                      <th className="py-2.5 font-semibold text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-light">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-3 font-medium text-stone-900">
                          {item.product.name}
                        </td>
                        <td className="py-3 text-center font-mono text-stone-500 text-[11px]">
                          {item.product.sku}
                        </td>
                        <td className="py-3 text-center text-stone-600 font-mono text-[11px]">
                          {item.selectedSize} · {item.selectedColor.name}
                        </td>
                        <td className="py-3 text-center font-mono font-semibold">
                          {item.quantity}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">
                          {formatCurrency(item.unitPrice, settings.currency)}
                        </td>
                        <td className="py-3 text-right font-mono font-semibold tabular-nums text-stone-950">
                          {formatCurrency(item.unitPrice * item.quantity, settings.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-4 border-t-2 border-stone-200">
                {/* Official Stamp & Verification */}
                <div className="w-full sm:w-1/2 p-4 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full border-2 border-dashed border-emerald-600 flex items-center justify-center rotate-[-8deg] mb-2 text-emerald-800">
                    <div className="text-[9px] font-bold font-mono tracking-tight text-center leading-tight">
                      NIMRAH<br />COLLECTION<br />VERIFIED
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-stone-600 font-semibold">
                    Authorized Digital E-Receipt &amp; Tax Slip
                  </div>
                  <div className="text-[10px] text-stone-600 mt-0.5">
                    For exchanges or tailoring queries, present this invoice within 14 days.
                  </div>
                </div>

                {/* Totals */}
                <div className="w-full sm:w-72 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span className="tabular-nums">{formatCurrency(order.subtotal, settings.currency)}</span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({order.discountCode || 'Applied'}):</span>
                      <span className="tabular-nums">-{formatCurrency(order.discount, settings.currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600">
                    <span>Delivery Fee:</span>
                    <span className="tabular-nums">{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee, settings.currency)}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-stone-600 pt-1 border-t border-stone-200">
                    <span>VAT 16% (Inclusive):</span>
                    <span className="tabular-nums">{formatCurrency(order.tax, settings.currency)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-stone-950 pt-2 border-t-2 border-stone-900">
                    <span>Net Paid:</span>
                    <span className="tabular-nums text-lg text-amber-900">
                      {formatCurrency(order.total, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer text */}
              <div className="mt-10 pt-6 border-t border-stone-200 text-center text-[11px] text-stone-600 space-y-1">
                <div>Thank you for choosing <strong>{settings.storeName}</strong>. May your garment bring grace and barakah.</div>
                <div>Eastleigh 5th St, UBAH Shopping G7 · WhatsApp: {settings.whatsappNumber} · {settings.contactEmail}</div>
              </div>
            </div>
          )}

          {/* FORMAT 2: 80MM THERMAL RECEIPT (POS Printer Format) */}
          {formatMode === 'thermal' && (
            <div className="w-[320px] bg-white p-6 shadow-md border border-stone-300 font-mono text-xs text-stone-900 print-thermal">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-400">
                <div className="text-base font-bold uppercase">{settings.storeName}</div>
                <div className="text-[10px] text-stone-600">{settings.brandTagline}</div>
                <div className="text-[10px]">{settings.storeAddress}</div>
                <div className="text-[10px]">Tel: {settings.storePhone}</div>
                <div className="text-[10px] font-bold">KRA PIN: {settings.kraPin}</div>
              </div>

              <div className="py-2.5 text-[11px] space-y-0.5 border-b border-dashed border-stone-400">
                <div className="flex justify-between">
                  <span>RCVD: {order.id}</span>
                  <span>{order.createdAt.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TIME: {order.createdAt.slice(11, 16)}</span>
                  <span>OP: {order.cashierName?.slice(0, 12) || 'COUNTER-1'}</span>
                </div>
                <div>CUST: {order.customer.name.slice(0, 22)}</div>
                {order.customer.phone && (
                  <div>TEL: {order.customer.phone}</div>
                )}
              </div>

              {/* Items */}
              <div className="py-3 border-b border-dashed border-stone-400 space-y-2">
                {order.items.map((it, idx) => (
                  <div key={idx}>
                    <div className="font-bold line-clamp-1">{it.product.name}</div>
                    <div className="flex justify-between text-[11px] text-stone-600">
                      <span>{it.quantity} x {formatCurrency(it.unitPrice, settings.currency)} ({it.selectedSize})</span>
                      <span className="font-bold text-stone-900">
                        {formatCurrency(it.unitPrice * it.quantity, settings.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-3 space-y-1 text-[11px] border-b border-dashed border-stone-400">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span>{formatCurrency(order.subtotal, settings.currency)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>DISCOUNT</span>
                    <span>-{formatCurrency(order.discount, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-stone-500">
                  <span>VAT (16% INC)</span>
                  <span>{formatCurrency(order.tax, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-stone-300">
                  <span>TOTAL DUE</span>
                  <span>{formatCurrency(order.total, settings.currency)}</span>
                </div>
              </div>

              {/* M-Pesa details */}
              <div className="py-3 border-b border-dashed border-stone-400 space-y-1 text-[10px]">
                <div className="font-bold text-stone-900">PAYMENT DETAILS:</div>
                <div className="flex justify-between">
                  <span>MODE:</span>
                  <span className="uppercase font-bold">{order.payment.method.replace('_', ' ')}</span>
                </div>
                {order.payment.mpesaDetails && (
                  <>
                    <div className="flex justify-between">
                      <span>TILL NO:</span>
                      <span className="font-bold">{order.payment.mpesaDetails.tillNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>M-PESA REF:</span>
                      <span className="font-bold">{order.payment.mpesaDetails.transactionCode}</span>
                    </div>
                    {order.payment.mpesaDetails.clientRealName && (
                      <div className="flex justify-between">
                        <span>CLIENT:</span>
                        <span className="font-bold">{order.payment.mpesaDetails.clientRealName}</span>
                      </div>
                    )}
                    {order.payment.mpesaDetails.message && (
                      <div className="text-[9px] pt-1 text-stone-700 leading-tight border-t border-dashed border-stone-300">
                        SMS: {order.payment.mpesaDetails.message}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Barcode representation */}
              <div className="pt-4 text-center space-y-1">
                <div className="font-mono text-lg tracking-widest font-bold">
                  ||||| | |||| ||| |||| |
                </div>
                <div className="text-[10px] text-stone-500">*{order.id}*</div>
                <div className="text-[9px] text-stone-500 pt-1">
                  Thank You for Shopping with Nimrah Collection
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
