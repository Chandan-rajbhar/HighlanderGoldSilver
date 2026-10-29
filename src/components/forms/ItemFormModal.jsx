import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Sparkles, DollarSign, Image, Check, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'Gold',
  'Morgan Dollars',
  'Commemorative',
  'Silver Bullion',
  'Ancient'
];

const METALS = ['Gold', 'Silver', 'Platinum', 'Palladium', 'Copper', 'Other'];
const STATUSES = ['Available', 'Reserved', 'Sold', 'Unavailable'];

export const ItemFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isLoading = false
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    lot_number: '',
    title: '',
    lead: '',
    description: '',
    category: 'Gold',
    metal: 'Gold',
    purity: '.999 Pure Gold',
    grade: 'Gem Proof',
    mintage: 'Limited Mintage',
    price: 1000,
    estimate_range: '$900.00 – $1,200.00 USD',
    payment_note: 'Direct bank wire or instant PayPal checkout.',
    featured_image: '',
    is_featured: false,
    status: 'Available',
    stock_quantity: 1,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        lot_number: initialData.lot_number || '',
        title: initialData.title || '',
        lead: initialData.lead || '',
        description: initialData.description || '',
        category: initialData.category || 'Gold',
        metal: initialData.metal || 'Gold',
        purity: initialData.purity || '',
        grade: initialData.grade || '',
        mintage: initialData.mintage || '',
        price: initialData.price || 0,
        estimate_range: initialData.estimate_range || '',
        payment_note: initialData.payment_note || 'Direct checkout or bank wire.',
        featured_image: initialData.featured_image || '',
        is_featured: Boolean(initialData.is_featured),
        status: initialData.status || 'Available',
        stock_quantity: initialData.stock_quantity ?? 1,
      });
    } else {
      setFormData({
        lot_number: '',
        title: '',
        lead: '',
        description: '',
        category: 'Gold',
        metal: 'Gold',
        purity: '.999 Pure Gold (1 Troy Oz)',
        grade: 'NGC MS-65',
        mintage: 'Limited Release',
        price: 950,
        estimate_range: '$850.00 – $1,100.00 USD',
        payment_note: 'Direct bank wire or PayPal checkout.',
        featured_image: '/assets/items/lot1_morgan_gold_gem.jpg',
        is_featured: false,
        status: 'Available',
        stock_quantity: 1,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.lot_number.trim()) newErrors.lot_number = 'Lot number is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.price <= 0 || isNaN(formData.price)) newErrors.price = 'Price must be greater than $0';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.metal) newErrors.metal = 'Metal is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      price: Number(formData.price),
      stock_quantity: Number(formData.stock_quantity) || 1,
    });
  };

  const basePrice = Number(formData.price) || 0;
  const buyersPremium = basePrice * 0.15; // 15% standard HGS Buyer's premium
  const totalSettlement = basePrice + buyersPremium;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Lot #${formData.lot_number} — ${formData.title}` : 'Catalog New Numismatic Item / Lot'}
      subtitle="Highlander Gold & Silver Catalog Spec Sheet"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Lot #, Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Lot Number *
            </label>
            <input
              type="text"
              value={formData.lot_number}
              onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              placeholder="e.g. 1"
              className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                errors.lot_number ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
              } focus:ring-2 focus:ring-aubergine-muted focus:outline-none`}
            />
            {errors.lot_number && <p className="text-[11px] text-rose-500 mt-1">{errors.lot_number}</p>}
          </div>

          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Title / Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 1876 George T. Morgan Proposed $100 Gold Union™"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.title ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
              } focus:ring-2 focus:ring-aubergine-muted focus:outline-none`}
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lead subtitle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Lead Summary / Subtitle
          </label>
          <input
            type="text"
            value={formData.lead}
            onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
            placeholder="e.g. 1876 Private Issue George T. Morgan Ultra High Relief Gold Union .999 Gem Proof"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
          />
        </div>

        {/* Row 2: Metal, Purity, Grade, Mintage */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Metal *
            </label>
            <select
              value={formData.metal}
              onChange={(e) => setFormData({ ...formData, metal: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
            >
              {METALS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Purity / Weight
            </label>
            <input
              type="text"
              value={formData.purity}
              onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
              placeholder="e.g. .999 Pure Gold (1 Oz)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Grading / Cert
            </label>
            <input
              type="text"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              placeholder="e.g. PCGS MS-66, NGC MS-65"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mintage
            </label>
            <input
              type="text"
              value={formData.mintage}
              onChange={(e) => setFormData({ ...formData, mintage: e.target.value })}
              placeholder="e.g. 999 Units, 2.8M"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
            />
          </div>
        </div>

        {/* Pricing & 15% Buyer's Premium calculation box */}
        <div className="p-4 rounded-xl bg-gold-surface border border-gold-border">
          <div className="flex items-center gap-2 mb-3 text-gold-dark font-serif font-bold text-xs uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            Highlander Pricing & Settlement Matrix (15% Buyer's Premium)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Hammer Price ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-gold focus:outline-none font-mono"
                />
              </div>
              {errors.price && <p className="text-[11px] text-rose-500 mt-1">{errors.price}</p>}
            </div>

            <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Buyer's Premium (15%)</span>
              <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                +${buyersPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/90 border border-gold/40 shadow-sm">
              <span className="text-[11px] text-gold-dark font-semibold block">Total Settlement</span>
              <span className="text-lg font-bold text-aubergine font-mono mt-0.5 block">
                ${totalSettlement.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">
                Estimate Range
              </label>
              <input
                type="text"
                value={formData.estimate_range}
                onChange={(e) => setFormData({ ...formData, estimate_range: e.target.value })}
                placeholder="e.g. $4,250.00 – $5,700.00 USD"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1 font-medium">
                Payment & Wire Instructions Note
              </label>
              <input
                type="text"
                value={formData.payment_note}
                onChange={(e) => setFormData({ ...formData, payment_note: e.target.value })}
                placeholder="e.g. Bank wire preferred with HGS wire credit"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Featured Image URL & Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Featured Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.featured_image}
              onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
              placeholder="https://..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none font-mono text-xs"
            />
            {formData.featured_image && (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                <img
                  src={formData.featured_image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Numismatic Description
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Historical context, mint mark details, strike quality, eye appeal..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
          />
        </div>

        {/* Status, Stock & Featured Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Availability Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-mono"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded text-aubergine focus:ring-aubergine border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Featured on Homepage
              </span>
            </label>
          </div>
        </div>

        {/* Modal Action Buttons */}
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
            {isEditing ? 'Save Lot Changes' : 'Catalog Lot Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

