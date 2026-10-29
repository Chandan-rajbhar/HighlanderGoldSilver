import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Package, 
  Plus, 
  Trash2, 
  DollarSign, 
  Check 
} from 'lucide-react';
import { Select } from '../ui/Select';
import { customerService } from '../../services/customerService';

const ORDER_STATUSES = [
  { value: 'Placed', label: 'Placed' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const PAYMENT_STATUSES = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Settled', label: 'Settled' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Refunded', label: 'Refunded' },
  { value: 'Cancelled', label: 'Cancelled' }
];

export const OrderFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  availableItems = [],
  isLoading = false
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(initialData);

  const [registeredCustomers, setRegisteredCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const [formData, setFormData] = useState({
    order_number: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    items: [],
    order_status: 'Placed',
    fulfillment_status: 'Placed',
    payment_status: 'Paid',
    payment_method: 'Bank Wire',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Fetch registered customers for the dropdown
  useEffect(() => {
    customerService.getCustomers({ pageSize: 50 })
      .then(res => setRegisteredCustomers(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (initialData) {
      const itemsList = initialData.items && initialData.items.length > 0 
        ? initialData.items.map(it => ({
            id: it.item_id || it.id || String(Math.random()),
            item_id: it.item_id || it.id || '',
            title: it.title || it.name || 'Catalog Item',
            quantity: Number(it.quantity) || 1,
            price: Number(it.price || it.base_price || 0)
          }))
        : [
            {
              id: String(Math.random()),
              item_id: availableItems[0]?.id || '',
              title: availableItems[0]?.title || 'Catalog Item',
              quantity: 1,
              price: Number(availableItems[0]?.price) || Number(initialData.total_amount) || 75
            }
          ];

      setFormData({
        order_number: initialData.order_number || initialData.order_id || '',
        customer_name: initialData.customer_name || '',
        customer_email: initialData.customer_email || '',
        customer_phone: initialData.customer_phone || initialData.phone || '',
        items: itemsList,
        order_status: initialData.fulfillment_status || initialData.order_status || 'Placed',
        fulfillment_status: initialData.fulfillment_status || initialData.order_status || 'Placed',
        payment_status: initialData.payment_status || 'Paid',
        payment_method: initialData.payment_method || 'Bank Wire',
        notes: initialData.notes || ''
      });
      setSelectedCustomerId('');
    } else {
      const firstItem = availableItems[0];
      setFormData({
        order_number: `HGS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        items: [
          {
            id: String(Math.random()),
            item_id: firstItem ? firstItem.id : '',
            title: firstItem ? firstItem.title : 'Catalog Item',
            quantity: 1,
            price: firstItem ? Number(firstItem.price) : 75
          }
        ],
        order_status: 'Placed',
        fulfillment_status: 'Placed',
        payment_status: 'Paid',
        payment_method: 'Bank Wire',
        notes: ''
      });
      setSelectedCustomerId('');
    }
    setErrors({});
  }, [initialData, isOpen, availableItems]);

  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = registeredCustomers.find(c => c.id === custId || c.email === custId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        customer_name: found.name || found.customer_name || '',
        customer_email: found.email || '',
        customer_phone: found.phone || ''
      }));
    }
  };

  const handleAddItem = () => {
    const defaultItem = availableItems[0];
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: String(Math.random()),
          item_id: defaultItem ? defaultItem.id : '',
          title: defaultItem ? defaultItem.title : 'Catalog Item',
          quantity: 1,
          price: defaultItem ? Number(defaultItem.price) : 50
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      if (field === 'item_id') {
        const selectedProd = availableItems.find(i => i.id === value);
        updated[index] = {
          ...updated[index],
          item_id: value,
          title: selectedProd ? selectedProd.title : updated[index].title,
          price: selectedProd ? Number(selectedProd.price) : updated[index].price
        };
      } else if (field === 'quantity') {
        updated[index] = {
          ...updated[index],
          quantity: Math.max(1, Number(value) || 1)
        };
      } else if (field === 'price') {
        updated[index] = {
          ...updated[index],
          price: Math.max(0, Number(value) || 0)
        };
      }
      return { ...prev, items: updated };
    });
  };

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const total = subtotal;

  const validate = () => {
    const newErrors = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
    if (!formData.customer_email.trim()) newErrors.customer_email = 'Customer email is required';
    if (formData.items.length === 0) newErrors.items = 'At least one item is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      base_subtotal: subtotal,
      total_settlement: total,
      total_amount: total,
      fulfillment_status: formData.order_status,
      order_status: formData.order_status
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
        <div className="w-screen max-w-xl md:max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
          
          {/* Header */}
          <div 
            className="px-6 py-5 text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0"
            style={{ background: 'linear-gradient(135deg, #0B2B4E 0%, #114275 100%)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30">
                  #{formData.order_number}
                </span>
                <span className="text-xs text-slate-300">
                  {isEditing ? 'Update Order Details' : 'New Order'}
                </span>
              </div>
              <h2 className="text-lg font-bold font-sans text-white mt-1">
                {isEditing ? `Edit Order #${formData.order_number}` : 'Create Order'}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Patient / Customer Information Card */}
              <div className="rounded-2xl border border-[#DCE5F0] p-4 bg-white space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  <User className="w-4 h-4 text-[#071A35]" />
                  <span>Customer Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Select Registered Customer
                    </label>
                    <Select
                      value={selectedCustomerId}
                      onChange={handleCustomerSelect}
                      options={[
                        { value: '', label: 'Select customer...' },
                        ...registeredCustomers.map(c => ({
                          value: c.id,
                          label: `${c.name || c.customer_name} (${c.email})`
                        }))
                      ]}
                      className="w-full"
                      triggerClassName="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="e.g. William Sterling"
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        errors.customer_name ? 'border-rose-400 bg-rose-50' : 'border-[#DCE5F0] bg-white'
                      } focus:outline-none focus:ring-1 focus:ring-[#071A35]`}
                    />
                    {errors.customer_name && <p className="text-[11px] text-rose-500 mt-1">{errors.customer_name}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Customer Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      placeholder="client@gmail.com"
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        errors.customer_email ? 'border-rose-400 bg-rose-50' : 'border-[#DCE5F0] bg-white'
                      } focus:outline-none focus:ring-1 focus:ring-[#071A35]`}
                    />
                    {errors.customer_email && <p className="text-[11px] text-rose-500 mt-1">{errors.customer_email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="8736528521"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE5F0] bg-white focus:outline-none focus:ring-1 focus:ring-[#071A35]"
                    />
                  </div>
                </div>
              </div>

              {/* Purchased Products & Formulations Card */}
              <div className="rounded-2xl border border-[#DCE5F0] p-4 bg-white space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    <Package className="w-4 h-4 text-[#071A35]" />
                    <span>Purchased Products & Items</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE5F0] hover:border-slate-300 bg-white text-xs font-semibold text-[#071A35] hover:bg-[#F5F8FC] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C9A23A]" />
                    Add Product
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-2.5">
                  {formData.items.map((item, idx) => {
                    const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
                    return (
                      <div 
                        key={item.id || idx} 
                        className="p-3 bg-[#F8FAFC] rounded-xl border border-[#DCE5F0] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs"
                      >
                        {/* Product Select */}
                        <div className="flex-1">
                          <Select
                            value={item.item_id}
                            onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
                            options={availableItems.map(p => ({
                              value: p.id,
                              label: `${p.title} ($${Number(p.price).toLocaleString()})`
                            }))}
                            className="w-full"
                            triggerClassName="w-full text-xs font-medium"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="w-16">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2.5 py-2 text-xs text-center font-mono font-semibold rounded-xl border border-[#DCE5F0] bg-white focus:outline-none"
                            placeholder="Qty"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="w-24">
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-full px-2.5 py-2 text-xs font-mono font-semibold rounded-xl border border-[#DCE5F0] bg-white focus:outline-none"
                            placeholder="Price"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="w-24 text-right">
                          <span className="font-bold text-emerald-600 font-mono text-sm">
                            ${lineTotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          disabled={formData.items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Selectors Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#DCE5F0] p-4 bg-white space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Order Status
                  </label>
                  <Select
                    value={formData.order_status}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      order_status: e.target.value, 
                      fulfillment_status: e.target.value 
                    })}
                    options={ORDER_STATUSES}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>

                <div className="rounded-2xl border border-[#DCE5F0] p-4 bg-white space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Payment Status
                  </label>
                  <Select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      payment_status: e.target.value 
                    })}
                    options={PAYMENT_STATUSES}
                    className="w-full"
                    triggerClassName="w-full"
                  />
                </div>
              </div>

              {/* Subtotal & Total Banner */}
              <div className="p-4 rounded-2xl bg-[#F5F8FC] border border-[#DCE5F0] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Subtotal:</span>{' '}
                  <span className="font-mono font-semibold text-slate-800">${subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium mr-1.5">Total:</span>
                  <span className="font-mono font-bold text-base text-emerald-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-[#DCE5F0] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#DCE5F0] hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
