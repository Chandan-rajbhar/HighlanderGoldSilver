import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Check } from 'lucide-react';

const ACCOUNT_STATUSES = ['Active', 'Suspended', 'Pending Verification'];

export const CustomerFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isLoading = false
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    customer_id: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'Customer', // 'Customer' | 'Admin'
    admin_role: 'Super Admin',
    title: 'Administrative Staff',
    city: 'Bigfork',
    state: 'MT',
    interest: 'Morgan Dollars & Bullion',
    total_spent: 0,
    orders_count: 0,
    account_status: 'Active',
    tier: 'Collector',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const isAdm = initialData.is_admin || initialData.role === 'Admin' || initialData.admin_role;
      setFormData({
        customer_id: initialData.customer_id || (isAdm ? `STAFF-${initialData.id?.replace('adm-', '00') || '001'}` : `CUST-${initialData.id?.slice(-4).toUpperCase() || '1000'}`),
        full_name: initialData.full_name || initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        role: isAdm ? 'Admin' : 'Customer',
        admin_role: initialData.admin_role || initialData.role || 'Super Admin',
        title: initialData.title || (isAdm ? 'Senior Numismatist & Vault Director' : ''),
        city: initialData.city || (initialData.location ? initialData.location.split(' ')[0] : 'Bigfork'),
        state: initialData.state || 'MT',
        interest: initialData.interest || '',
        total_spent: initialData.total_spent || 0,
        orders_count: initialData.orders_count || 0,
        account_status: initialData.account_status || initialData.status || 'Active',
        tier: initialData.tier || 'Collector',
        notes: initialData.notes || '',
      });
    } else {
      const generatedId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      setFormData({
        customer_id: generatedId,
        full_name: '',
        email: '',
        phone: '',
        role: 'Customer',
        admin_role: 'Super Admin',
        title: 'Senior Numismatist',
        city: 'Bigfork',
        state: 'MT',
        interest: 'Gold & Rare Morgan Dollars',
        total_spent: 0,
        orders_count: 0,
        account_status: 'Active',
        tier: 'Collector',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...formData,
      total_spent: Number(formData.total_spent) || 0,
      orders_count: Number(formData.orders_count) || 0
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit User: ${formData.full_name}` : 'Register New User'}
      subtitle="Highlander Gold & Silver Accounts & Directory"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              User ID *
            </label>
            <input
              type="text"
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              placeholder={formData.role === 'Admin' ? 'e.g. STAFF-001' : 'e.g. CUST-1001'}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Account Role *
            </label>
            <Select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  role: newRole,
                  customer_id: newRole === 'Admin' ? `STAFF-${Math.floor(100 + Math.random() * 900)}` : `CUST-${Math.floor(1000 + Math.random() * 9000)}`
                }));
              }}
              options={[
                { value: 'Customer', label: 'Customer (User)' },
                { value: 'Admin', label: 'Admin (Staff)' }
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Account Status *
            </label>
            <Select
              value={formData.account_status}
              onChange={(e) => setFormData({ ...formData, account_status: e.target.value })}
              options={ACCOUNT_STATUSES.map(s => ({ value: s, label: s }))}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder={formData.role === 'Admin' ? 'e.g. Alexander MacLeod' : 'e.g. William Sterling'}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.full_name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
            } focus:ring-2 focus:ring-aubergine-muted focus:outline-none`}
          />
          {errors.full_name && <p className="text-[11px] text-rose-500 mt-1">{errors.full_name}</p>}
        </div>

        {formData.role === 'Admin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/60 border border-purple-200/60 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-purple-900 uppercase tracking-wider mb-1">
                Admin Staff Role
              </label>
              <Select
                value={formData.admin_role}
                onChange={(e) => setFormData({ ...formData, admin_role: e.target.value })}
                options={[
                  { value: 'Super Admin', label: 'Super Admin' },
                  { value: 'Inventory Manager', label: 'Inventory Manager' },
                  { value: 'Order Manager', label: 'Order Manager' },
                  { value: 'Vault Staff', label: 'Vault Staff' }
                ]}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-900 uppercase tracking-wider mb-1">
                Department / Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Numismatist & Vault Director"
                className="w-full px-3 py-2 text-sm rounded-lg border border-purple-200 bg-white text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@example.com"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
              } focus:ring-2 focus:ring-aubergine-muted focus:outline-none`}
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(406) 555-0199"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Bigfork"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              State
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="MT"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Customer Notes & Acquisition Preferences
          </label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special collector requests, preferred payment method (Bank wire/PayPal), etc."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
          />
        </div>

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
            {isEditing ? 'Save Changes' : (formData.role === 'Admin' ? 'Register Admin User' : 'Register Customer')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
