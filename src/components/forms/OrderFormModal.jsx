import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { DollarSign, Check } from 'lucide-react';

const PAYMENT_METHODS = ['Bank Wire', 'PayPal', 'Vault Pickup', 'Check', 'Other'];
const PAYMENT_STATUSES = ['Pending Wire', 'Settled', 'Refunded', 'Cancelled'];
const FULFILLMENT_STATUSES = ['Awaiting Payment', 'Vault Dispatch', 'Dispatched', 'Delivered', 'Cancelled'];

export const OrderFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  availableItems = [],
  isLoading = false
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    order_number: '',
    customer_name: '',
    customer_email: '',
    selected_item_id: '',
    item_title: '',
    base_subtotal: 0,
    buyers_premium_percent: 0.15,
    payment_method: 'Bank Wire',
    payment_status: 'Pending Wire',
    fulfillment_status: 'Awaiting Payment',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        order_number: initialData.order_number || '',
        customer_name: initialData.customer_name || '',
        customer_email: initialData.customer_email || '',
        selected_item_id: initialData.items?.[0]?.item_id || '',
        item_title: initialData.items?.[0]?.title || '',
        base_subtotal: initialData.base_subtotal || 0,
        buyers_premium_percent: 0.15,
        payment_method: initialData.payment_method || 'Bank Wire',
        payment_status: initialData.payment_status || 'Pending Wire',
        fulfillment_status: initialData.fulfillment_status || 'Awaiting Payment',
        notes: initialData.notes || '',
      });
    } else {
      const firstItem = availableItems[0];
      setFormData({
        order_number: `HGS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_name: '',
        customer_email: '',
        selected_item_id: firstItem ? firstItem.id : '',
        item_title: firstItem ? `Lot #${firstItem.lot_number}: ${firstItem.title}` : '',
        base_subtotal: firstItem ? Number(firstItem.price) : 0,
        buyers_premium_percent: 0.15,
        payment_method: 'Bank Wire',
        payment_status: 'Pending Wire',
        fulfillment_status: 'Awaiting Payment',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen, availableItems]);

  const handleItemSelect = (itemId) => {
    const item = availableItems.find(i => i.id === itemId);
    if (item) {
      setFormData(prev => ({
        ...prev,
        selected_item_id: item.id,
        item_title: `Lot #${item.lot_number}: ${item.title}`,
        base_subtotal: Number(item.price) || 0
      }));
    }
  };

  const basePrice = Number(formData.base_subtotal) || 0;
  const buyersPremium = basePrice * 0.15;
  const totalSettlement = basePrice + buyersPremium;

  const validate = () => {
    const newErrors = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
    if (!formData.customer_email.trim()) newErrors.customer_email = 'Customer email is required';
    if (basePrice <= 0) newErrors.base_subtotal = 'Base price must be greater than $0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      base_subtotal: basePrice,
      buyers_premium_total: buyersPremium,
      total_settlement: totalSettlement,
      items: [
        {
          item_id: formData.selected_item_id,
          title: formData.item_title,
          base_price: basePrice,
          buyers_premium_percent: 0.15,
          buyers_premium: buyersPremium,
          total: totalSettlement
        }
      ]
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Order #${formData.order_number}` : 'Record New Numismatic Settlement / Order'}
      subtitle="Highlander Gold & Silver Acquisition Record"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Order #, Customer Name, Email */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Order #
            </label>
            <input
              type="text"
              readOnly={isEditing}
              value={formData.order_number}
              onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Collector Name *
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="e.g. William Sterling"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.customer_name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
              } focus:ring-2 focus:ring-aubergine-muted focus:outline-none`}
            />
            {errors.customer_name && <p className="text-[11px] text-rose-500 mt-1">{errors.customer_name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              placeholder="client@domain.com"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.customer_email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
              } focus:ring-2 focus:ring-aubergine-muted focus:outline-none`}
            />
            {errors.customer_email && <p className="text-[11px] text-rose-500 mt-1">{errors.customer_email}</p>}
          </div>
        </div>

        {/* Item Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Select Catalog Item / Lot
          </label>
          <select
            value={formData.selected_item_id}
            onChange={(e) => handleItemSelect(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
          >
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                Lot #{item.lot_number} — {item.title} (${Number(item.price).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Financial Calculation Box */}
        <div className="p-4 rounded-xl bg-gold-surface border border-gold-border">
          <div className="flex items-center gap-2 mb-2 text-gold-dark font-serif font-bold text-xs uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            Settlement Breakdown (Standard 15% Buyer's Premium)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Base Subtotal ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.base_subtotal}
                onChange={(e) => setFormData({ ...formData, base_subtotal: e.target.value })}
                className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-300 bg-white font-mono"
              />
              {errors.base_subtotal && <p className="text-[11px] text-rose-500 mt-1">{errors.base_subtotal}</p>}
            </div>

            <div className="p-2 rounded-lg bg-white/80 border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Buyer's Premium (15%)</span>
              <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                +${buyersPremium.toFixed(2)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-gold/40 shadow-sm">
              <span className="text-[11px] text-gold-dark font-semibold block">Total Settlement</span>
              <span className="text-base font-bold text-aubergine font-mono mt-0.5 block">
                ${totalSettlement.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment & Fulfillment Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <select
              value={formData.payment_status}
              onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            >
              {PAYMENT_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Fulfillment
            </label>
            <select
              value={formData.fulfillment_status}
              onChange={(e) => setFormData({ ...formData, fulfillment_status: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            >
              {FULFILLMENT_STATUSES.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Order Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Settlement Notes & Tracking Info
          </label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Wire reference, USPS/FedEx tracking number, vault pickup verification..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-aubergine hover:bg-aubergine-light rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-gold" />
            )}
            {isEditing ? 'Save Order Changes' : 'Record Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

