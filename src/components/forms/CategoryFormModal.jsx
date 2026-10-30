import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const METALS = ['Gold', 'Silver', 'Platinum', 'Mixed', 'Other'];

export const CategoryFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isLoading = false
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    metal_type: 'Gold',
    display_order: 1,
    is_active: true
  });

  const [selectedMetal, setSelectedMetal] = useState('Gold');
  const [customMetal, setCustomMetal] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      const standardMetals = ['Gold', 'Silver', 'Platinum', 'Mixed'];
      const isStandard = standardMetals.includes(initialData.metal_type);
      const isOther = !isStandard;

      setSelectedMetal(isOther ? 'Other' : (initialData.metal_type || 'Gold'));
      setCustomMetal(isOther ? (initialData.metal_type === 'Other' ? '' : (initialData.metal_type || '')) : '');

      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        metal_type: initialData.metal_type || 'Gold',
        display_order: initialData.display_order ?? 1,
        is_active: initialData.is_active ?? true
      });
    } else {
      setSelectedMetal('Gold');
      setCustomMetal('');
      setFormData({
        name: '',
        slug: '',
        description: '',
        metal_type: 'Gold',
        display_order: 1,
        is_active: true
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNameChange = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : slug
    }));
  };

  const handleMetalSelect = (val) => {
    setSelectedMetal(val);
    if (val === 'Other') {
      setFormData(prev => ({
        ...prev,
        metal_type: customMetal.trim() || 'Other'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        metal_type: val
      }));
    }
  };

  const handleCustomMetalChange = (val) => {
    setCustomMetal(val);
    setFormData(prev => ({
      ...prev,
      metal_type: val.trim() || 'Other'
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Category name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const autoSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const finalMetalType = selectedMetal === 'Other' ? (customMetal.trim() || 'Other') : selectedMetal;
    onSave({
      ...formData,
      metal_type: finalMetalType,
      slug: autoSlug,
      is_active: formData.is_active ?? true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop overlay with blur */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        {/* Slide-over Drawer Panel */}
        <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
          
          {/* Drawer Header */}
          <div 
            className="px-6 py-5 text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0"
            style={{ background: 'linear-gradient(135deg, #0B2B4E 0%, #114275 100%)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30 font-sans">
                  {isEditing ? 'Edit Category' : 'New Category'}
                </span>
              </div>
              <h2 className="text-lg font-bold font-sans tracking-wide text-white mt-1">
                {isEditing ? `Edit Category: ${formData.name}` : 'Create New Collection Category'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Highlander Precious Metals Classification
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <form id="category-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Morgan Dollars"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                  errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
                } focus:ring-2 focus:ring-[#C9A23A]/50 focus:border-[#C9A23A] focus:outline-none transition-all`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Metal
                </label>
                <Select
                  value={selectedMetal}
                  onChange={(e) => handleMetalSelect(e.target.value)}
                  options={METALS.map(m => ({ value: m, label: m }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-[#C9A23A]/50 focus:border-[#C9A23A] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* When 'Other' is chosen, let user type any custom metal name */}
            {selectedMetal === 'Other' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specify Metal / Material Name *
                </label>
                <input
                  type="text"
                  value={customMetal}
                  onChange={(e) => handleCustomMetalChange(e.target.value)}
                  placeholder="e.g. Copper, Palladium, White Gold, Bronze, Rhodium..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#C9A23A]/50 focus:border-[#C9A23A] focus:outline-none transition-all"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Type the custom metal classification for this category.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief scope of items in this category..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#C9A23A]/50 focus:border-[#C9A23A] focus:outline-none transition-all resize-none"
              />
            </div>
          </form>

          {/* Sticky Footer */}
          <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-drawer-form"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#0B2B4E] hover:bg-[#114275] rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-gold" />
              )}
              {isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
