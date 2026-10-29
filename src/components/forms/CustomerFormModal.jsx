import React, { useState, useEffect } from 'react';
import { X, User, ShieldCheck, Check } from 'lucide-react';
import { Select } from '../ui/Select';

const ACCOUNT_STATUSES = ['Active', 'Suspended', 'Pending Verification'];

export const CustomerFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isLoading = false
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Drawer */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-lg md:max-w-xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
          
          {/* Header */}
          <div className="px-6 py-5 bg-[#071A35] text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30">
                  #{formData.customer_id}
                </span>
                <span className="text-xs text-slate-300">
                  {isEditing ? 'Update User Details' : 'New User Registration'}
                </span>
              </div>
              <h2 className="text-lg font-bold font-sans text-white mt-1">
                {isEditing ? `Edit User: ${formData.full_name}` : 'Register New User'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Account Role & Identifier */}
              <div className="rounded-2xl border border-[#DCE5F0] p-4 bg-white space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  <User className="w-4 h-4 text-[#071A35]" />
                  <span>Account Credentials</span>
                </div>

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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono focus:outline-none"
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
                        { value: 'Customer', label: 'Customer' },
                        { value: 'Admin', label: 'Admin (Staff)' }
                      ]}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Status *
                    </label>
                    <Select
                      value={formData.account_status}
                      onChange={(e) => setFormData({ ...formData, account_status: e.target.value })}
                      options={ACCOUNT_STATUSES.map(s => ({ value: s, label: s }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="rounded-2xl border border-[#DCE5F0] p-4 bg-white space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#071A35]" />
                  <span>Profile Information</span>
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
                    className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border ${
                      errors.full_name ? 'border-rose-400 bg-rose-50' : 'border-[#DCE5F0] bg-white'
                    } focus:ring-2 focus:ring-[#071A35]/10 focus:border-[#071A35] focus:outline-none`}
                  />
                  {errors.full_name && <p className="text-[11px] text-rose-500 mt-1">{errors.full_name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="collector@example.com"
                      className={`w-full px-3.5 py-2 text-xs font-medium rounded-xl border ${
                        errors.email ? 'border-rose-400 bg-rose-50' : 'border-[#DCE5F0] bg-white'
                      } focus:ring-2 focus:ring-[#071A35]/10 focus:border-[#071A35] focus:outline-none`}
                    />
                    {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(406) 555-0199"
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-[#DCE5F0] bg-white focus:ring-2 focus:ring-[#071A35]/10 focus:border-[#071A35] focus:outline-none"
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
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-[#DCE5F0] bg-white focus:outline-none"
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
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-[#DCE5F0] bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Staff Details (only if Admin) */}
              {formData.role === 'Admin' && (
                <div className="rounded-2xl border border-purple-200/80 p-4 bg-purple-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-900 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Internal Staff Administration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-purple-200 bg-white text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Card */}
              <div className="rounded-2xl border border-[#DCE5F0] p-4 bg-white space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Customer Notes & Depository Instructions
                </label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special collector requests, preferred wire routing, insured depository transport notes, etc."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#DCE5F0] bg-white focus:ring-2 focus:ring-[#071A35]/10 focus:border-[#071A35] focus:outline-none"
                />
              </div>

            </div>

            {/* Sticky Bottom Actions Bar */}
            <div className="px-6 py-4 bg-slate-50 border-t border-[#DCE5F0] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-[#DCE5F0] hover:border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#071A35] hover:bg-[#0B2548] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-[#C9A23A]" />
                )}
                {isEditing ? 'Save Changes' : (formData.role === 'Admin' ? 'Register Admin User' : 'Register Customer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
