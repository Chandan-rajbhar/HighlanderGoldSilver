import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  RefreshCw, 
  DollarSign, 
  Coins, 
  Award, 
  Check, 
  Image as ImageIcon,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';

const CATEGORIES = [
  'Gold',
  'Morgan Dollars',
  'Commemorative',
  'Silver Bullion',
  'Ancient'
];

const METALS = ['Gold', 'Silver', 'Platinum', 'Palladium', 'Copper', 'Other'];
const CERTIFICATIONS = ['NGC', 'PCGS', 'CAC', 'PCI', 'Mint Certified', 'Raw / Uncertified'];
const STATUSES = ['Active', 'Draft', 'Sold', 'Out of Stock', 'Hidden'];

export const CatalogItemFormDrawer = ({
  isOpen,
  onClose,
  onSave,
  mode = 'create', // 'create' or 'edit'
  item = null,
  categories = CATEGORIES,
  isLoading = false
}) => {
  const isEdit = mode === 'edit';
  const fileInputRef = useRef(null);

  const defaultFormData = {
    title: '',
    lot_number: '',
    sku: '',
    category: 'Gold',
    metal: 'Gold',
    coin_type: 'Private Issue Gold Pattern',
    grade: 'NGC Ultra Cameo Gem Proof',
    cert_company: 'NGC',
    purity: '.999 Pure Gold',
    weight: '1 Troy Oz (31.10g)',
    price: 4850,
    inventory: 1,
    description: '',
    storefront_status: 'Active',
    featured_image: 'https://highlander-goldandsilver.vercel.app/assets/items/lot1_morgan_gold_gem.jpg',
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && item) {
        setFormData({
          title: item.title || '',
          lot_number: item.lot_number || '',
          sku: item.sku || `HGS-${(item.category || 'GOLD').slice(0, 4).toUpperCase()}-${item.lot_number || '001'}`,
          category: item.category || 'Gold',
          metal: item.metal || 'Gold',
          coin_type: item.coin_type || 'Private Issue Pattern',
          grade: item.grade || 'NGC Ultra Cameo Gem Proof',
          cert_company: item.cert_company || 'NGC',
          purity: item.purity || '.999 Pure Gold',
          weight: item.weight || '1 Troy Oz (31.10g)',
          price: item.price ?? 4850,
          inventory: item.inventory ?? item.stock_quantity ?? 1,
          description: item.description || '',
          storefront_status: item.storefront_status || item.status || 'Active',
          featured_image: item.featured_image || 'https://highlander-goldandsilver.vercel.app/assets/items/lot1_morgan_gold_gem.jpg',
        });
      } else {
        const randomNum = Math.floor(1 + Math.random() * 99);
        setFormData({
          ...defaultFormData,
          lot_number: String(randomNum),
          sku: `HGS-GOLD-${randomNum}`
        });
      }
      setErrors({});
      setIsDirty(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isEdit, item]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  const handleAttemptClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard and close drawer?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleRegenerateSKU = () => {
    const cat = (formData.category || 'GOLD').slice(0, 4).toUpperCase();
    const num = formData.lot_number || Math.floor(100 + Math.random() * 900);
    updateField('sku', `HGS-${cat}-${num}`);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('featured_image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    updateField('featured_image', '');
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Product name is required';
    if (!formData.lot_number.trim()) errs.lot_number = 'Item number is required';
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      errs.price = 'Valid price is required';
    }
    if (formData.inventory === '' || isNaN(formData.inventory) || Number(formData.inventory) < 0) {
      errs.inventory = 'Valid inventory quantity is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      price: Number(formData.price),
      inventory: Number(formData.inventory),
      stock_quantity: Number(formData.inventory),
      stock_status: Number(formData.inventory) > 0 ? 'In Stock' : 'Out of Stock',
      status: Number(formData.inventory) > 0 && formData.storefront_status === 'Active' ? 'Available' : 'Unavailable'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay with luxury glass blur */}
      <div 
        className="fixed inset-0 glass-overlay transition-opacity animate-in fade-in duration-200"
        onClick={handleAttemptClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        {/* Slide-over Drawer Panel */}
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
          
          {/* Header */}
          <div className="px-6 py-5 bg-[#071A35] text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30 font-serif">
                  {isEdit ? 'Edit Product' : 'Add Product'}
                </span>
                {formData.lot_number && (
                  <span className="text-xs font-mono text-slate-300">
                    Item #{formData.lot_number}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold font-serif tracking-wide text-white mt-1">
                {isEdit ? 'Edit Product' : 'Add Product'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {isEdit 
                  ? `Update details for Item #${formData.lot_number}: ${formData.title}`
                  : 'Add precious metals, rare coins, gold, silver, or bullion to the inventory.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAttemptClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#0B2348] rounded-xl transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form id="product-form-drawer" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            
            {/* 1. Product Image Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#0B2348] border-b border-[#E4E0D8] pb-2">
                <ImageIcon className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-serif text-[#0B2348]">
                  Product Image
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#F8F6F1] border border-[#E4E0D8]">
                <div className="w-24 h-24 rounded-xl bg-white border border-[#E4E0D8] overflow-hidden flex items-center justify-center relative shadow-sm shrink-0">
                  {formData.featured_image ? (
                    <img 
                      src={formData.featured_image} 
                      alt="Product preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.currentTarget.src = 'https://highlander-goldandsilver.vercel.app/assets/items/lot1_morgan_gold_gem.jpg'; }}
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B2348] hover:bg-[#071A35] text-white text-xs font-medium transition-colors shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#C9A23A]" />
                      Upload Image
                    </button>

                    {formData.featured_image && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Image
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={formData.featured_image}
                    onChange={(e) => updateField('featured_image', e.target.value)}
                    placeholder="Or enter direct image URL..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E4E0D8] bg-white font-mono text-slate-600 focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Core Product Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2348] border-b border-[#E4E0D8] pb-2">
                <Coins className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-serif text-[#0B2348]">
                  Product Information
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g. 1876 George T. Morgan Proposed $100 Gold Union™"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.title ? 'border-rose-400 bg-rose-50' : 'border-[#E4E0D8] bg-white'
                  } focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none`}
                />
                {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Item Number *
                  </label>
                  <input
                    type="text"
                    value={formData.lot_number}
                    onChange={(e) => updateField('lot_number', e.target.value)}
                    placeholder="e.g. 1"
                    className={`w-full px-3 py-2 text-sm font-mono rounded-lg border ${
                      errors.lot_number ? 'border-rose-400 bg-rose-50' : 'border-[#E4E0D8] bg-white'
                    } focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none`}
                  />
                  {errors.lot_number && <p className="text-[11px] text-rose-500 mt-1">{errors.lot_number}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider">
                      SKU
                    </label>
                    <button
                      type="button"
                      onClick={handleRegenerateSKU}
                      className="text-[10px] text-[#C9A23A] hover:underline flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    placeholder="e.g. HGS-GOLD-001"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E4E0D8] bg-white focus:ring-1 focus:ring-[#C9A23A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  >
                    {categories.map(c => {
                      const name = typeof c === 'string' ? c : c.name;
                      return <option key={name} value={name}>{name}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Metal Type *
                  </label>
                  <select
                    value={formData.metal}
                    onChange={(e) => updateField('metal', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  >
                    {METALS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Coin Type
                  </label>
                  <input
                    type="text"
                    value={formData.coin_type}
                    onChange={(e) => updateField('coin_type', e.target.value)}
                    placeholder="e.g. Pattern, Bullion"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Numismatic Specifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2348] border-b border-[#E4E0D8] pb-2">
                <Award className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-serif text-[#0B2348]">
                  Numismatic Specifications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => updateField('grade', e.target.value)}
                    placeholder="e.g. NGC Ultra Cameo Gem Proof"
                    className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Certification
                  </label>
                  <select
                    value={formData.cert_company}
                    onChange={(e) => updateField('cert_company', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  >
                    {CERTIFICATIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Metal Purity
                  </label>
                  <input
                    type="text"
                    value={formData.purity}
                    onChange={(e) => updateField('purity', e.target.value)}
                    placeholder="e.g. .999 Pure Gold"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    placeholder="e.g. 1 Troy Oz (31.10g)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Pricing & Inventory Quantity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2348] border-b border-[#E4E0D8] pb-2">
                <DollarSign className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-serif text-[#0B2348]">
                  Price & Inventory
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Price ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-semibold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      placeholder="4850.00"
                      className={`w-full pl-7 pr-3 py-2 text-sm font-bold font-mono rounded-lg border ${
                        errors.price ? 'border-rose-400 bg-rose-50' : 'border-[#E4E0D8] bg-white'
                      } focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none`}
                    />
                  </div>
                  {errors.price && <p className="text-[11px] text-rose-500 mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Inventory Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => updateField('inventory', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                  {errors.inventory && <p className="text-[11px] text-rose-500 mt-1">{errors.inventory}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider mb-1">
                    Product Status
                  </label>
                  <select
                    value={formData.storefront_status}
                    onChange={(e) => updateField('storefront_status', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 5. Product Description */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#0B2348] uppercase tracking-wider">
                Product Description
              </label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Provenance, historical significance, minting details, and condition..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E0D8] bg-white focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none leading-relaxed"
              />
            </div>
          </form>

          {/* Sticky Footer Actions */}
          <div className="px-6 py-4 bg-[#F8F6F1] border-t border-[#E4E0D8] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 text-xs font-semibold text-[#0B2348] bg-white border border-[#E4E0D8] hover:bg-[#E8F0F8] rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="product-form-drawer"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A23A] hover:bg-[#B58D27] text-[#071A35] text-xs font-bold font-serif uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-[#071A35]/30 border-t-[#071A35] rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-[#071A35]" />
              )}
              Save Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
