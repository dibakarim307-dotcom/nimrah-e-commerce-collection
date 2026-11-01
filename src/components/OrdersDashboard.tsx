import React, { useState } from 'react';
import { 
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
  ArrowRight
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const OrdersDashboard: React.FC = () => {
  const { 
    orders, 
    settings, 
    openInvoice, 
    updateOrderStatus, 
    setActiveView 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'pos' | 'online' | 'whatsapp'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-700" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Orders &amp; Tax Invoices Registry
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Complete transaction ledger with automatic Tax Invoices, M-Pesa Till receipts, and delivery states
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveView('pos')}
            className="px-3.5 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Open POS Register
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">Total Transactions</span>
          <div className="text-2xl font-bold font-mono text-stone-950 mt-1">
            {orders.length} Orders
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">Online + POS + WhatsApp</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">Total Revenue</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-stone-950 mt-1 tabular-nums">
            {formatCurrency(totalVolume, settings.currency)}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">100% Reconciled</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">M-Pesa Till {settings.mpesaTillNumber}</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
            {formatCurrency(mpesaVolume, settings.currency)}
          </div>
          <span className="text-[11px] text-stone-400 mt-0.5 block">Safaricom settlement</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-stone-500 block">Tax Collected (VAT 16%)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900 mt-1 tabular-nums">
            {formatCurrency(totalVolume - (totalVolume / 1.16), settings.currency)}
          </div>
          <span className="text-[11px] text-stone-500 mt-0.5 block font-mono">PIN: {settings.kraPin}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder="Search Order #, customer name, M-Pesa code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel selector */}
          <div className="flex bg-stone-100 p-1 rounded-lg text-xs">
            <button 
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                sourceFilter === 'all' ? 'bg-white font-bold text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              All Channels
            </button>
            <button 
              onClick={() => setSourceFilter('pos')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                sourceFilter === 'pos' ? 'bg-white font-bold text-amber-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Store POS
            </button>
            <button 
              onClick={() => setSourceFilter('online')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                sourceFilter === 'online' ? 'bg-white font-bold text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Online Store
            </button>
          </div>

          {/* Status selector */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Invoice / Order #</th>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-3">Channel</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Payment Info</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-center">Invoice Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    No orders matching query
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      #{order.id}
                    </td>

                    <td className="py-3.5 px-3 text-stone-600">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        order.source === 'pos' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                          : 'bg-stone-100 text-stone-800 border border-stone-200'
                      }`}>
                        {order.source}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-stone-900">{order.customer.name}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{order.customer.phone}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      {order.payment.mpesaDetails ? (
                        <div className="font-mono text-[11px]">
                          <span className="text-emerald-700 font-bold">M-Pesa Till: {order.payment.mpesaDetails.tillNumber}</span>
                          <div className="text-stone-500">Ref: {order.payment.mpesaDetails.transactionCode}</div>
                        </div>
                      ) : (
                        <span className="font-mono text-stone-700 uppercase">
                          {order.payment.method}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-stone-950 tabular-nums text-sm">
                      {formatCurrency(order.total, settings.currency)}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="text-[11px] font-mono bg-stone-50 border border-stone-300 rounded px-2 py-1 text-stone-800"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={() => openInvoice(order)}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-black text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
