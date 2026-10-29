import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { X, Tag, DollarSign, Percent, Check, AlertCircle } from 'lucide-react';

export const CouponFormDrawer = ({
  isOpen,
  onClose,
  onSave,
  mode = 'create',
  coupon = null,
  isLoading = false
}) => {
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'Percentage',
    discount_value: 10,
    minimum_order_amount: 500,
    max_discount_amount: 250,
    start_date: new Date().toISOString().slice(0, 10),
    expiry_date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    usage_limit: 100,
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (isEdit && coupon) {
        setFormData({
          code: coupon.code || '',
          description: coupon.description || '',
          discount_type: coupon.discount_type || 'Percentage',
          discount_value: coupon.discount_value ?? 10,
          minimum_order_amount: coupon.minimum_order_amount ?? 500,
          max_discount_amount: coupon.max_discount_amount ?? 250,
          start_date: coupon.start_date || new Date().toISOString().slice(0, 10),
          expiry_date: coupon.expiry_date || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
          usage_limit: coupon.usage_limit ?? 100,
          status: coupon.status || 'Active'
        });
      } else {
        setFormData({
          code: '',
          description: '',
          discount_type: 'Percentage',
          discount_value: 10,
          minimum_order_amount: 500,
          max_discount_amount: 250,
          start_date: new Date().toISOString().slice(0, 10),
          expiry_date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
          usage_limit: 100,
          status: 'Active'
        });
      }
      setErrors({});
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isEdit, coupon]);

  const validate = () => {
    const errs = {};
    if (!formData.code.trim()) errs.code = 'Coupon code is required';
    if (!formData.discount_value || Number(formData.discount_value) <= 0) {
      errs.discount_value = 'Discount value must be greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...formData,
      code: formData.code.toUpperCase().trim(),
      discount_value: Number(formData.discount_value),
      minimum_order_amount: Number(formData.minimum_order_amount) || 0,
      max_discount_amount: Number(formData.max_discount_amount) || 0,
      usage_limit: Number(formData.usage_limit) || 100
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="fixed inset-0 bg-aubergine-dark/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-aubergine-dark to-aubergine text-white flex items-center justify-between border-b border-aubergine-light shrink-0">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-gold font-bold px-2 py-0.5 rounded bg-gold/15 border border-gold/30">
                {isEdit ? 'Edit Coupon' : 'Create Promotion'}
              </span>
              <h2 className="text-lg font-bold font-sans tracking-wide text-white mt-1">
                {isEdit ? `Coupon: ${formData.code}` : 'New Discount Code'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form id="coupon-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. BIGFORK10"
                className={`w-full px-3 py-2 text-sm font-mono font-bold tracking-wider rounded-lg border ${
                  errors.code ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-aubergine`}
              />
              {errors.code && <p className="text-[11px] text-rose-500 mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Montana Local Collector Credit"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Discount Type
                </label>
                <Select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  options={[
                    { value: 'Percentage', label: 'Percentage (%)' },
                    { value: 'Fixed', label: 'Fixed Amount ($)' }
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Value ({formData.discount_type === 'Percentage' ? '%' : '$'}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 bg-white focus:outline-none"
                />
                {errors.discount_value && <p className="text-[11px] text-rose-500 mt-1">{errors.discount_value}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Min. Order ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimum_order_amount}
                  onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Disabled', label: 'Disabled' },
                  { value: 'Expired', label: 'Expired' }
                ]}
                className="w-full"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="coupon-drawer-form"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold font-sans uppercase tracking-wider text-white bg-aubergine hover:bg-aubergine-light rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-gold" />
              {isEdit ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

