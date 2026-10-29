import { Select } from '../ui/Select';
import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  User, 
  DollarSign, 
  CreditCard, 
  Truck, 
  Printer, 
  Ban, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const OrderDetailDrawer = ({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  onCancelOrder
}) => {
  if (!isOpen || !order) return null;

  const [currentStatus, setCurrentStatus] = useState(order.order_status || order.fulfillment_status || 'Processing');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusSelect = (status) => {
    setCurrentStatus(status);
    if (onUpdateStatus) {
      setIsUpdating(true);
      onUpdateStatus(order.id, status).finally(() => setIsUpdating(false));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];
  const baseSubtotal = Number(order.base_subtotal || order.total_amount || 0);
  const buyersPremium = Number(order.buyers_premium_total || (baseSubtotal * 0.15));
  const totalAmount = Number(order.total_settlement || order.total_amount || (baseSubtotal + buyersPremium));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-aubergine-dark/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 bg-[#071A35] text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30">
                  {order.order_id || order.order_number}
                </span>
                <span className="text-xs text-slate-300">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-base font-bold font-sans tracking-wide text-white mt-1">
                Order Dossier
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Status & Quick Action Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Order Status
                </span>
                <div className="mt-1">
                  <StatusBadge status={currentStatus} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={currentStatus}
                  onChange={(e) => handleStatusSelect(e.target.value)}
                  disabled={isUpdating}
                  options={ORDER_STATUSES.map(s => ({ value: s, label: s }))}
                  triggerClassName="px-2.5 py-1.5 text-xs font-semibold"
                />

                <button
                  onClick={handlePrint}
                  className="p-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-aubergine border-b border-slate-100 pb-1.5">
                <User className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                  Collector & Buyer
                </h3>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-900 text-sm font-sans">{order.customer_name}</p>
                <p className="text-slate-600 font-mono">{order.customer_email}</p>
                <p className="text-slate-500">{order.customer_id || 'Storefront Registered Collector'}</p>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-aubergine border-b border-slate-100 pb-1.5">
                <ShoppingBag className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                  Purchased Items & Lots ({items.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {items.map((it, idx) => (
                  <div key={idx} className="p-3.5 bg-white flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold font-sans text-slate-900 block">
                        {it.title || `Lot #${it.lot_number || idx + 1}`}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        SKU: {it.sku || `HGS-LOT-${it.lot_number || idx + 1}`} • Qty: {it.quantity || 1}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900 block">
                        ${Number(it.unit_price || it.base_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400">Hammer Base</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settlement Financial Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-aubergine border-b border-slate-100 pb-1.5">
                <DollarSign className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                  Settlement & Payment Details
                </h3>
              </div>

              <div className="p-4 bg-gold-surface border border-gold-border rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Hammer Subtotal</span>
                  <span className="font-mono font-semibold">${baseSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Standard 15% Buyer's Premium</span>
                  <span className="font-mono font-semibold text-gold-dark">+${buyersPremium.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Insured Vault Shipping</span>
                  <span className="font-mono font-semibold text-emerald-600">Complimentary</span>
                </div>
                <div className="pt-2 border-t border-gold-border/60 flex justify-between font-bold text-sm text-aubergine">
                  <span>Total Settlement</span>
                  <span className="font-mono text-base text-aubergine">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Payment Method: <strong>{order.payment_method}</strong></span>
                  <StatusBadge status={order.payment_status} />
                </div>
              </div>
            </div>

            

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            {currentStatus !== 'Cancelled' ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Cancel this order?')) {
                    handleStatusSelect('Cancelled');
                    if (onCancelOrder) onCancelOrder(order.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Order
              </button>
            ) : (
              <span className="text-xs text-rose-600 font-semibold">Order Cancelled</span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-aubergine hover:bg-aubergine-light rounded-xl transition-colors"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

