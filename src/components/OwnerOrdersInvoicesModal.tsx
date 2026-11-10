import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Search, 
  Printer, 
  Smartphone, 
  Store, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Eye, 
  Crown, 
  Receipt, 
  DollarSign, 
  Calendar, 
  Tag, 
  ArrowUpRight,
  ShieldCheck,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate } from '../utils/formatters';

interface OwnerOrdersInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'orders' | 'invoices';
}

export const OwnerOrdersInvoicesModal: React.FC<OwnerOrdersInvoicesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'orders'
}) => {
  const { 
    orders, 
    settings, 
    openInvoice, 
    updateOrderStatus, 
    posStaffUser,
    clearAllOrders 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'pos' | 'online' | 'whatsapp'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!isOpen) return null;

  const isShopOwner = posStaffUser?.role === 'Shop Owner';

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesSource = sourceFilter === 'all' || o.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      o.id.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q) ||
      (o.payment.mpesaDetails && o.payment.mpesaDetails.transactionCode.toLowerCase().includes(q));
    return matchesSource && matchesStatus && matchesSearch;
  });

  const totalVolume = orders.reduce((sum, o) => sum + o.total, 0);
  const mpesaVolume = orders
    .filter(o => o.payment.method === 'mpesa_till' || o.payment.method === 'split')
    .reduce((sum, o) => sum + (o.payment.method === 'split' ? o.total / 2 : o.total), 0);
  const totalTaxCollected = orders.reduce((sum, o) => sum + o.tax, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        className="relative bg-[#111116] border-2 border-amber-500/40 rounded-3xl max-w-5xl w-full shadow-2xl text-stone-100 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 bg-gradient-to-r from-amber-950/60 via-[#161620] to-[#121218] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg font-bold shrink-0">
              <Crown className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Owner POS: Orders &amp; Invoices
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-bold uppercase">
                  Real Orders Space
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Full boutique ledger, customer delivery contacts, and KRA/eTIMS compliant tax invoices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isShopOwner && orders.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Delete all cached test orders to leave pure space for real incoming orders?')) {
                    clearAllOrders();
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 rounded-xl transition-colors cursor-pointer"
              >
                Purge All Orders
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & High-level Metrics */}
        <div className="p-4 sm:px-6 bg-[#0d0d12] border-b border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex bg-[#181822] p-1 rounded-xl border border-stone-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Orders Registry ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Tax Invoices (ETIMS / KRA)</span>
            </button>
          </div>

          {/* KPI Pills */}
          <div className="flex items-center gap-2 font-mono text-[11px] overflow-x-auto">
            <div className="bg-[#181822] px-3 py-1.5 rounded-lg border border-stone-800 shrink-0">
              <span className="text-stone-400">Total Volume: </span>
              <span className="text-white font-bold">{formatCurrency(totalVolume, settings.currency)}</span>
            </div>
            <div className="bg-[#181822] px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 shrink-0">
              <span className="text-emerald-400">Till 5428901: </span>
              <span className="font-bold">{formatCurrency(mpesaVolume, settings.currency)}</span>
            </div>
            <div className="bg-[#181822] px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 shrink-0">
              <span className="text-amber-400">VAT 16%: </span>
              <span className="font-bold">{formatCurrency(totalTaxCollected, settings.currency)}</span>
            </div>
          </div>
        </div>

        {/* Search & Channel Filters */}
        <div className="p-4 sm:px-6 bg-[#12121a] border-b border-stone-800/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" />
            <input 
              type="text"
              placeholder="Search Order #, customer name, phone, M-Pesa code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-mono pl-10 pr-3 py-2 bg-[#181824] border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Channel filter */}
            <div className="flex bg-[#181824] p-0.5 rounded-xl border border-stone-700 text-xs">
              <button 
                onClick={() => setSourceFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  sourceFilter === 'all' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setSourceFilter('pos')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  sourceFilter === 'pos' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                POS Register
              </button>
              <button 
                onClick={() => setSourceFilter('online')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  sourceFilter === 'online' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                Online Checkouts
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-[#181824] border border-stone-700 rounded-xl px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: ORDERS REGISTRY */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-[#161622] rounded-2xl border border-stone-800 text-stone-400 text-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-600/40 text-amber-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {orders.length === 0 ? 'Space Reserved Exclusively for Real Incoming Orders' : 'No Transactions Match Query'}
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-1 max-w-md mx-auto leading-relaxed">
                      {orders.length === 0 
                        ? 'All mock orders deleted. Live customer sales via Safaricom M-Pesa Till 5428901 and POS boutique checkouts will automatically populate here in real-time.' 
                        : 'Try adjusting your search terms, sales channel, or order fulfillment status.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const mpesaCode = order.payment.mpesaDetails?.transactionCode;
                  return (
                    <div 
                      key={order.id}
                      className="bg-[#15151e] border border-stone-800/90 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-sm space-y-3"
                    >
                      {/* Top Bar of Order Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-amber-400">
                            {order.id}
                          </span>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            order.source === 'pos'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                              : order.source === 'online'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/80'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                          }`}>
                            {order.source === 'pos' ? 'Store POS' : order.source === 'online' ? 'Online Boutique' : 'WhatsApp'}
                          </span>
                          <span className="text-xs text-stone-400 font-mono">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Order Status Pill */}
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            order.status === 'confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50' :
                            order.status === 'delivered' ? 'bg-blue-950 text-blue-300 border border-blue-500/50' :
                            order.status === 'processing' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                            'bg-rose-950 text-rose-300 border border-rose-500/50'
                          }`}>
                            {order.status}
                          </span>

                          {/* Print Invoice Button */}
                          <button
                            onClick={() => openInvoice(order)}
                            className="px-3 py-1 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>

                      {/* Customer & Items Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                        {/* Customer Column */}
                        <div className="sm:col-span-4 bg-[#1a1a24] p-3 rounded-xl border border-stone-800/80 space-y-1">
                          <span className="text-[10px] font-mono uppercase text-stone-400 block font-semibold">
                            Customer Info:
                          </span>
                          <div className="font-bold text-white text-sm">
                            {order.customer.name}
                          </div>
                          <div className="text-stone-300 font-mono text-[11px]">
                            {order.customer.phone}
                          </div>
                          {order.customer.address && (
                            <div className="text-stone-400 text-[11px] truncate">
                              📍 {order.customer.address}
                            </div>
                          )}
                          {order.cashierName && (
                            <div className="text-amber-400/80 text-[10px] font-mono pt-1">
                              Staff: {order.cashierName}
                            </div>
                          )}
                        </div>

                        {/* Items Column */}
                        <div className="sm:col-span-5 bg-[#1a1a24] p-3 rounded-xl border border-stone-800/80 space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-stone-400 block font-semibold">
                            Items ({order.items.reduce((s, i) => s + i.quantity, 0)}):
                          </span>
                          <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between text-[11px]">
                                <span className="text-stone-200 truncate pr-2">
                                  {it.quantity}x {it.product?.name || 'Garment Item'} ({it.selectedSize})
                                </span>
                                <span className="text-stone-400 font-mono shrink-0">
                                  {formatCurrency(it.unitPrice * it.quantity, settings.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payment & Total Column */}
                        <div className="sm:col-span-3 bg-[#1a1a24] p-3 rounded-xl border border-stone-800/80 space-y-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-stone-400 block font-semibold">
                              Payment:
                            </span>
                            <div className="text-xs font-semibold text-stone-200">
                              {order.payment.method === 'mpesa_till' ? 'M-Pesa Till 5428901' : 
                               order.payment.method === 'cash' ? 'Cash Tendered' : 
                               order.payment.method === 'split' ? 'Split (M-Pesa + Cash)' : 'POS Card'}
                            </div>
                            {mpesaCode && (
                              <div className="text-emerald-400 font-mono font-bold text-[11px] truncate">
                                Code: {mpesaCode}
                              </div>
                            )}
                          </div>
                          <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline">
                            <span className="text-stone-400 text-[10px] uppercase font-mono">Total:</span>
                            <span className="font-mono text-base font-bold text-amber-400">
                              {formatCurrency(order.total, settings.currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Update Quick Dropdown */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800/60">
                        <span className="text-stone-500 font-mono text-[10px]">
                          Update Fulfillment Status:
                        </span>
                        <div className="flex items-center gap-1">
                          {(['confirmed', 'processing', 'delivered'] as OrderStatus[]).map(st => (
                            <button
                              key={st}
                              onClick={() => updateOrderStatus(order.id, st)}
                              disabled={order.status === st}
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase transition-colors cursor-pointer ${
                                order.status === st
                                  ? 'bg-amber-400 text-stone-950 font-bold'
                                  : 'text-stone-400 hover:text-white bg-stone-900 border border-stone-800'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: TAX INVOICES (ETIMS / KRA REGISTRY) */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-amber-950/40 to-stone-900 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span className="font-serif text-base font-bold text-white">
                      Official Tax Invoice Archive
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-bold">
                      KRA eTIMS Standard
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Each sale automatically generates a unique tax invoice linked to KRA PIN <strong>{settings.kraPin}</strong> and Till <strong>{settings.mpesaTillNumber}</strong>.
                  </p>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-[#15151e] border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-[#1a1a26] text-stone-400 uppercase font-mono text-[10px] border-b border-stone-800">
                      <tr>
                        <th className="py-3 px-4">Invoice / Order #</th>
                        <th className="py-3 px-4">Date &amp; Time</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Payment &amp; Code</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                        <th className="py-3 px-4 text-right">VAT (16%)</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800 font-mono">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-stone-500 font-sans text-xs">
                            Space reserved for real incoming tax invoices (0 registered).
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr key={order.id} className="hover:bg-[#1c1c28] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-amber-400">
                              {order.id}
                            </td>
                          <td className="py-3.5 px-4 text-stone-400 text-[11px]">
                            {new Date(order.createdAt).toLocaleDateString('en-KE', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-sans font-medium text-white">
                            <div>{order.customer.name}</div>
                            <div className="text-[10px] text-stone-500 font-mono">{order.customer.phone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-emerald-400 font-bold block">
                              {order.payment.mpesaDetails?.transactionCode || 'CASH / POS'}
                            </span>
                            <span className="text-[10px] text-stone-500 font-sans capitalize">
                              {order.payment.method.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-stone-300">
                            {formatCurrency(order.subtotal, settings.currency)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-amber-300">
                            {formatCurrency(order.tax, settings.currency)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                            {formatCurrency(order.total, settings.currency)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => openInvoice(order)}
                              className="px-2.5 py-1 text-[11px] font-sans font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                            >
                              <Printer className="w-3 h-3" />
                              <span>View / Print</span>
                            </button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
