import { Select } from '../ui/Select';
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
  Sparkles,
  Plus,
  Link as LinkIcon
} from 'lucide-react';
import { uploadMultipleInventoryImages, normalizeImageToLink } from '../../services/imageUploadService';

const CATEGORIES = [
  'Gold',
  'Morgan Dollar',
  'Commemorative',
  'Silver Bullion',
  'Ancient'
];

const METALS = ['Gold', 'Silver', 'Platinum', 'Palladium', 'Copper', 'Other'];
const CERTIFICATIONS = ['NGC', 'PCGS', 'CAC', 'PCI', 'Mint Certified', 'Raw / Uncertified'];
const STATUSES = ['Active', 'Draft', 'Sold', 'Out of Stock', 'Hidden'];

const createEmptyNewItemForm = () => ({
  title: '',
  lot_number: '',
  sku: '',
  category: '',
  metal: '',
  coin_type: '',
  grade: '',
  cert_company: '',
  purity: '',
  weight: '',
  price: '',
  inventory: 1,
  description: '',
  storefront_status: 'Active',
  featured_image: '',
});

const mapExistingItemToForm = (item) => {
  const rawImgs = Array.isArray(item.additional_images) && item.additional_images.length > 0
    ? item.additional_images
    : (Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.featured_image ? [item.featured_image] : []));
  const initialImgs = rawImgs.map(normalizeImageToLink).filter(Boolean);

  return {
    initialImgs,
    fields: {
      title: item.title || '',
      lot_number: item.lot_number ?? '',
      sku: item.sku || '',
      category: item.category || '',
      metal: item.metal || '',
      coin_type: item.coin_type || '',
      grade: item.grade || '',
      cert_company: item.cert_company || '',
      purity: item.purity || '',
      weight: item.weight || '',
      price: item.price ?? '',
      inventory: item.inventory ?? item.stock_quantity ?? 1,
      description: item.description || '',
      storefront_status: item.storefront_status || item.status || 'Active',
      featured_image: initialImgs[0] || (item.featured_image ? normalizeImageToLink(item.featured_image) : ''),
    }
  };
};

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

  const [formData, setFormData] = useState(createEmptyNewItemForm);
  const [selectedMetal, setSelectedMetal] = useState('');
  const [customMetal, setCustomMetal] = useState('');
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isEdit && item) {
        const { initialImgs, fields } = mapExistingItemToForm(item);
        setImages(initialImgs);

        const standardMetals = ['Gold', 'Silver', 'Platinum', 'Palladium', 'Copper'];
        const itemMetal = item.metal || '';
        const isStandard = standardMetals.includes(itemMetal);
        const isOther = Boolean(itemMetal) && !isStandard;
        setSelectedMetal(isOther ? 'Other' : itemMetal);
        setCustomMetal(isOther ? (itemMetal === 'Other' ? '' : itemMetal) : '');
        setFormData(fields);
      } else {
        setImages([]);
        setSelectedMetal('');
        setCustomMetal('');
        setFormData(createEmptyNewItemForm());
      }
      setImageUrlInput('');
      setIsUploadingImages(false);
      setUploadError('');
      setErrors({});
      setIsDirty(false);
      document.body.style.overflow = 'hidden';
    } else {
      setFormData(createEmptyNewItemForm());
      setImages([]);
      setImageUrlInput('');
      setSelectedMetal('');
      setCustomMetal('');
      setErrors({});
      setIsDirty(false);
      setIsUploadingImages(false);
      setUploadError('');
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isEdit, item]);

  // Keep featured_image synchronized cleanly with images[0] without nested state updaters
  useEffect(() => {
    if (!isOpen) return;
    const primaryImg = images[0] || '';
    setFormData((prev) => (prev.featured_image === primaryImg ? prev : { ...prev, featured_image: primaryImg }));
  }, [images, isOpen]);

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

  const handleMetalChange = (val) => {
    setSelectedMetal(val);
    setIsDirty(true);
    if (errors.metal) {
      setErrors(prev => ({ ...prev, metal: null }));
    }
    if (val === 'Other') {
      updateField('metal', customMetal.trim() || 'Other');
    } else {
      updateField('metal', val);
    }
  };

  const handleCustomMetalChange = (val) => {
    setCustomMetal(val);
    updateField('metal', val.trim() || 'Other');
  };

  const handleMultipleFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    setUploadError('');
    try {
      const uploadedLinks = await uploadMultipleInventoryImages(files, 'items');
      const cleanLinks = (uploadedLinks || []).map(normalizeImageToLink).filter(Boolean);
      if (cleanLinks.length === 0) {
        throw new Error('No image URL was returned from storage.');
      }
      setImages(prev => [...prev, ...cleanLinks]);
      setIsDirty(true);
    } catch (err) {
      console.error('Image upload error:', err);
      setUploadError(err?.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrlImage = () => {
    if (!imageUrlInput.trim()) return;
    const cleanLink = normalizeImageToLink(imageUrlInput.trim());
    if (!cleanLink) return;
    setImages(prev => [...prev, cleanLink]);
    setImageUrlInput('');
    setUploadError('');
    setIsDirty(true);
  };

  const handleRemoveImageIndex = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setIsDirty(true);
  };

  const handleSetPrimary = (index) => {
    setImages(prev => {
      if (index === 0) return prev;
      const target = prev[index];
      const rest = prev.filter((_, idx) => idx !== index);
      return [target, ...rest];
    });
    setIsDirty(true);
  };

  const validate = () => {
    const errs = {};
    if (!String(formData.title || '').trim()) errs.title = 'Product name is required';
    if (!String(formData.lot_number || '').trim()) errs.lot_number = 'Item number is required';
    if (!String(formData.category || '').trim()) errs.category = 'Category is required';
    const resolvedMetal = selectedMetal === 'Other' ? customMetal.trim() : selectedMetal;
    if (!String(resolvedMetal || '').trim()) errs.metal = 'Metal type is required';
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
    if (isUploadingImages) return;
    if (!validate()) return;

    const pendingUrl = imageUrlInput.trim() ? [imageUrlInput.trim()] : [];
    const baseImgs = images.length > 0 ? images : (formData.featured_image ? [formData.featured_image] : []);
    const rawImgs = [...baseImgs, ...pendingUrl];
    const finalImages = Array.from(new Set(rawImgs.map(normalizeImageToLink).filter(Boolean)));
    const finalMetal = selectedMetal === 'Other' ? (customMetal.trim() || 'Other') : selectedMetal;
    onSave({
      ...formData,
      metal: finalMetal,
      featured_image: finalImages[0] || '',
      additional_images: finalImages,
      price: Number(formData.price),
      inventory: Number(formData.inventory),
      stock_quantity: Number(formData.inventory),
      stock_status: Number(formData.inventory) > 0 ? 'In Stock' : 'Out of Stock',
      status: Number(formData.inventory) > 0 && formData.storefront_status === 'Active' ? 'Available' : 'Unavailable'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop overlay with luxury glass blur */}
      <div 
        className="fixed inset-0 glass-overlay transition-opacity animate-in fade-in duration-200"
        onClick={handleAttemptClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
        {/* Slide-over Drawer Panel */}
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
          
          {/* Header */}
          <div className="px-6 py-5 text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0"
            style={{ background: 'linear-gradient(135deg, #0B2B4E 0%, #114275 100%)' }}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans uppercase tracking-wider text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30">
                  {isEdit ? 'Edit Product' : 'Add Product'}
                </span>
                {formData.lot_number && (
                  <span className="text-xs font-mono text-slate-300">
                    Item #{formData.lot_number}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold font-sans tracking-normal text-white mt-1">
                {isEdit ? 'Edit Product' : 'Add Product'}
              </h2>
              <p className="text-xs font-normal font-sans text-slate-300 mt-0.5">
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
            
            {/* 1. Product Image Section (Multiple Photos Support) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-2">
                <div className="flex items-center gap-2 text-[#0B2348]">
                  <ImageIcon className="w-4 h-4 text-[#C9A23A]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-sans text-[#0B2348]">
                    Product Images &amp; Gallery ({images.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-sans">
                  {images.length === 1 ? '1 Photo (Primary Cover)' : `${images.length} Photos Uploaded`}
                </span>
              </div>

              {/* Hidden file input supporting multiple files */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleFilesChange}
                className="hidden"
              />

              {/* Case A: Exactly 1 Image (Looks clean, centered, and perfect) */}
              {images.length === 1 ? (
                <div className="p-4 rounded-xl bg-[#F8F6F1] border border-[#E4E0D8] space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-28 h-28 rounded-xl bg-white border border-[#E4E0D8] overflow-hidden flex items-center justify-center relative shadow-sm shrink-0 group">
                      <img 
                        src={images[0]} 
                        alt="Product preview" 
                        className="w-full h-full object-cover" 
                        onLoad={(e) => { e.currentTarget.style.display = ''; }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold font-sans bg-[#071A35]/85 text-[#E5C365] py-0.5 rounded text-center tracking-wider uppercase">
                        Cover Photo
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B2B4E] hover:bg-[#114275] text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#C9A23A]" />
                          Upload / Replace
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#0B2348]/20 hover:border-[#0B2348] text-[#0B2348] text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#C9A23A]" />
                          Add More Photos
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveImageIndex(0)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>

                      
                    </div>
                  </div>
                </div>
              ) : images.length > 1 ? (
                /* Case B: Multiple Images */
                <div className="p-4 rounded-xl bg-[#F8F6F1] border border-[#E4E0D8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 font-sans">
                      Gallery Photos (First image is the Primary Cover)
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B2B4E] hover:bg-[#114275] text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#C9A23A]" />
                      Upload More
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div 
                        key={idx} 
                        className={`relative rounded-xl overflow-hidden border-2 bg-white aspect-square shadow-xs group transition-all ${
                          idx === 0 ? 'border-[#C9A23A] ring-2 ring-[#C9A23A]/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Photo ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          onLoad={(e) => { e.currentTarget.style.display = ''; }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />

                        {/* Tag */}
                        {idx === 0 ? (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#071A35]/90 text-[#E5C365] tracking-wider uppercase font-sans">
                            ★ Primary
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/90 hover:bg-[#071A35] hover:text-[#E5C365] text-slate-700 shadow-xs cursor-pointer font-sans"
                          >
                            Set Cover
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImageIndex(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-white/90 hover:bg-rose-600 hover:text-white text-slate-500 shadow-xs transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-black/60 text-white">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}

                    {/* Add More Slot */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border-2 border-dashed border-slate-300 hover:border-[#C9A23A] bg-white/50 hover:bg-white flex flex-col items-center justify-center p-3 text-slate-400 hover:text-[#0B2348] transition-all aspect-square cursor-pointer"
                    >
                      <Plus className="w-5 h-5 mb-1 text-[#C9A23A]" />
                      <span className="text-[11px] font-medium font-sans">Add Photo</span>
                    </button>
                  </div>

                  
                </div>
              ) : (
                /* Case C: 0 Images (Empty state) */
                <div className="p-6 rounded-xl bg-[#F8F6F1] border-2 border-dashed border-[#E4E0D8] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#E4E0D8] mx-auto flex items-center justify-center text-slate-400 shadow-2xs">
                    <ImageIcon className="w-6 h-6 text-[#C9A23A]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">No images added yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Upload single or multiple product photos</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B2B4E] hover:bg-[#114275] text-white text-xs font-medium shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#C9A23A]" />
                      Upload Photos
                    </button>
                  </div>
                </div>
              )}

              {/* Cloud Uploading State */}
              {isUploadingImages && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0B2348]/5 border border-[#C9A23A]/30 text-xs text-[#0B2348] font-medium animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C9A23A]" />
                  <span>Uploading image to Supabase Storage and generating public URL link...</span>
                </div>
              )}

              {uploadError && (
                <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {uploadError}
                </div>
              )}

              {/* Add by Direct Web Link */}
              <div className="p-3 rounded-xl bg-[#F8F6F1] border border-[#E4E0D8] space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <LinkIcon className="w-3.5 h-3.5 text-[#C9A23A]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider font-sans">
                    Or Add Image via Direct Web Link
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://.../coin-photo.jpg"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A] font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrlImage();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    disabled={!imageUrlInput.trim()}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0B2B4E] text-white hover:bg-[#114275] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    + Add Link
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Core Product Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2B4E] border-b border-[#E4E0D8] pb-2">
                <Coins className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-sans text-[#0B2B4E]">
                  Product Information
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g. 1889 Morgan Silver Dollar MS-65"
                  className={`w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 rounded-lg border ${
                    errors.title ? 'border-rose-400 bg-rose-50' : 'border-[#E4E0D8] bg-white'
                  } focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none`}
                />
                {errors.title && <p className="text-[11px] font-normal font-sans text-rose-500 mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Item Number *
                  </label>
                  <input
                    type="text"
                    value={formData.lot_number}
                    onChange={(e) => updateField('lot_number', e.target.value)}
                    placeholder="e.g. 101"
                    className={`w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 tabular-nums rounded-lg border ${
                      errors.lot_number ? 'border-rose-400 bg-rose-50' : 'border-[#E4E0D8] bg-white'
                    } focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none`}
                  />
                  {errors.lot_number && <p className="text-[11px] font-normal font-sans text-rose-500 mt-1">{errors.lot_number}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Item Code
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    placeholder="e.g. HGS-Silver-101"
                    className="w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 rounded-lg border border-[#E4E0D8] bg-white focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <Select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    placeholder="Select category..."
                    options={categories.map(cat => {
                      const name = typeof cat === 'string' ? cat : cat.name;
                      return { value: name, label: name };
                    })}
                    triggerClassName={errors.category ? 'border-rose-400 bg-rose-50' : ''}
                    className="w-full font-sans"
                  />
                  {errors.category && <p className="text-[11px] font-normal font-sans text-rose-500 mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Metal Type *
                  </label>
                  <Select
                    value={selectedMetal}
                    onChange={(e) => handleMetalChange(e.target.value)}
                    placeholder="Select metal..."
                    options={METALS.map(m => ({ value: m, label: m }))}
                    triggerClassName={errors.metal ? 'border-rose-400 bg-rose-50' : ''}
                    className="w-full font-sans"
                  />
                  {errors.metal && <p className="text-[11px] font-normal font-sans text-rose-500 mt-1">{errors.metal}</p>}
                  {selectedMetal === 'Other' && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[11px] font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1">
                        Specify Metal Name *
                      </label>
                      <input
                        type="text"
                        value={customMetal}
                        onChange={(e) => handleCustomMetalChange(e.target.value)}
                        placeholder="e.g. White Gold, Bronze, Brass..."
                        className="w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Coin Type
                  </label>
                  <input
                    type="text"
                    value={formData.coin_type}
                    onChange={(e) => updateField('coin_type', e.target.value)}
                    placeholder="e.g. Morgan Dollar, Bullion"
                    className="w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>
              </div>
            </div>

            {/* 3. Numismatic Specifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2B4E] border-b border-[#E4E0D8] pb-2">
                <Award className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-sans text-[#0B2B4E]">
                  Numismatic Specifications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => updateField('grade', e.target.value)}
                    placeholder="e.g. MS-65 PL"
                    className="w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Certification
                  </label>
                  <Select
                    value={formData.cert_company}
                    onChange={(e) => updateField('cert_company', e.target.value)}
                    placeholder="Select certification..."
                    options={CERTIFICATIONS.map(cert => ({ value: cert, label: cert }))}
                    className="w-full font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Metal Purity
                  </label>
                  <input
                    type="text"
                    value={formData.purity}
                    onChange={(e) => updateField('purity', e.target.value)}
                    placeholder="e.g. .999 Fine Silver"
                    className="w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    placeholder="e.g. 1 Troy Oz (31.10g)"
                    className="w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Pricing & Inventory Quantity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0B2B4E] border-b border-[#E4E0D8] pb-2">
                <DollarSign className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-sans text-[#0B2B4E]">
                  Price & Inventory
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Price ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      placeholder="0.00"
                      className={`w-full pl-7 pr-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 tabular-nums rounded-lg border ${
                        errors.price ? 'border-rose-400 bg-rose-50' : 'border-[#E4E0D8] bg-white'
                      } focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none`}
                    />
                  </div>
                  {errors.price && <p className="text-[11px] font-normal font-sans text-rose-500 mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Inventory Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => updateField('inventory', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 tabular-nums rounded-lg border border-[#E4E0D8] bg-white focus:outline-none focus:border-[#C9A23A]"
                  />
                  {errors.inventory && <p className="text-[11px] font-normal font-sans text-rose-500 mt-1">{errors.inventory}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider mb-1.5">
                    Product Status
                  </label>
                  <Select
                    value={formData.storefront_status}
                    onChange={(e) => updateField('storefront_status', e.target.value)}
                    options={STATUSES.map(s => ({ value: s, label: s }))}
                    className="w-full font-sans"
                  />
                </div>
              </div>
            </div>

            {/* 5. Product Description */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold font-sans text-[#0B2B4E] uppercase tracking-wider">
                Product Description
              </label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Provenance, historical significance, minting details, and condition..."
                className="w-full px-3 py-2 text-sm font-normal font-sans text-slate-900 placeholder:text-slate-400 rounded-lg border border-[#E4E0D8] bg-white focus:ring-1 focus:ring-[#C9A23A] focus:border-[#C9A23A] focus:outline-none leading-relaxed"
              />
            </div>
          </form>

          {/* Sticky Footer Actions */}
          <div className="px-6 py-4 bg-[#F8F6F1] border-t border-[#E4E0D8] flex items-center justify-between shrink-0 font-sans">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 text-xs font-semibold font-sans text-[#0B2B4E] bg-white border border-[#E4E0D8] hover:bg-[#E8F0F8] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="product-form-drawer"
              disabled={isLoading || isUploadingImages}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A23A] hover:bg-[#B58D27] text-[#071A35] text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading || isUploadingImages ? (
                <span className="w-4 h-4 border-2 border-[#071A35]/30 border-t-[#071A35] rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-[#071A35]" />
              )}
              {isUploadingImages ? 'Uploading Images...' : 'Save Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
