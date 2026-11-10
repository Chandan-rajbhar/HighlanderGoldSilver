import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign,
  Tag,
  CheckCircle2,
  Package,
  Layers,
  Award,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { resolveInventoryImageUrl } from '../../services/imageUploadService';

export const ItemDetailModal = ({
  isOpen,
  onClose,
  item,
  onEdit
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => {
    setActiveImageIndex(0);
    setFailedImages({});
  }, [item?.id, isOpen]);

  if (!isOpen || !item) return null;

  const basePrice = Number(item.price) || 0;
  const settlementFee = (basePrice * 1.15).toFixed(2);
  const rawAdditional = Array.isArray(item.additional_images) && item.additional_images.length > 0
    ? item.additional_images
    : (Array.isArray(item.images) && item.images.length > 0 ? item.images : []);

  const images = Array.from(
    new Set(
      [
        ...(item.featured_image ? [item.featured_image] : []),
        ...rawAdditional,
      ]
        .map(resolveInventoryImageUrl)
        .filter(Boolean)
    )
  );
  const activeImage = images[activeImageIndex] || images[0] || '';
  const isMainImageMissing = !activeImage || Boolean(failedImages[activeImage]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Drawer */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl lg:max-w-3xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
          
          {/* Header styled with Highlander Sidebar Blue Gradient */}
          <div 
            className="px-6 py-5 text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0"
            style={{ background: 'linear-gradient(135deg, #0B2B4E 0%, #114275 100%)' }}
          >
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30">
                  ITEM #{item.lot_number}
                </span>
                <span className="text-xs text-slate-300 truncate">
                  {item.category || 'Gold'} • {item.sku || `HGS-${item.lot_number}`}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-sans text-white mt-1 truncate" title={item.title}>
                {item.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 shrink-0"
              aria-label="Close drawer"
              title="Close"
            >
              <X className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </div>

          {/* Scrollable Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-50/40">
            
            {/* Visuals Gallery */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="w-full aspect-[4/3] sm:aspect-[16/10] max-h-80 rounded-xl bg-[#FAF8F5] border border-slate-200/80 overflow-hidden flex items-center justify-center p-3 relative group">
                {!isMainImageMissing ? (
                  <img
                    src={activeImage}
                    alt={item.title}
                    className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                    onError={() => {
                      setFailedImages((prev) => (prev[activeImage] ? prev : { ...prev, [activeImage]: true }));
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2 py-8">
                    <ImageIcon className="w-10 h-10 text-slate-300" />
                    <span className="text-xs font-sans text-slate-400">No image preview available</span>
                  </div>
                )}
                <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#071A35]/85 text-[#E5C365] border border-[#C9A23A]/30 shadow-xs">
                  {images.length > 1 ? `Image ${activeImageIndex + 1} of ${images.length}` : 'Highlander Catalog Visual'}
                </span>
              </div>

              {/* Thumbnails if multiple images exist */}
              {images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 bg-white shrink-0 transition-all cursor-pointer flex items-center justify-center ${
                        activeImageIndex === idx 
                          ? 'border-[#C9A23A] shadow-xs ring-2 ring-[#C9A23A]/25 scale-105' 
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      {!failedImages[img] ? (
                        <img 
                          src={img} 
                          alt={`View ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          onError={() => {
                            setFailedImages((prev) => (prev[img] ? prev : { ...prev, [img]: true }));
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Banner Card */}
            <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EBE3D7] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                  Storefront Listed Price
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 block mt-0.5">
                  ${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                {item.estimate_range && (
                  <span className="text-xs text-slate-500 block mt-0.5 font-sans">
                    Market Range: {item.estimate_range}
                  </span>
                )}
              </div>

              <div className="sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EBE3D7]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                  Settlement with 15% Fee
                </span>
                <span className="text-2xl font-bold font-mono text-[#C9A23A] block mt-0.5">
                  ${Number(settlementFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-emerald-700 font-medium block mt-0.5 font-sans">
                  Montana 0% State Sales Tax
                </span>
              </div>
            </div>

            {/* Specifications Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <span className="text-xs font-bold font-sans text-slate-800 uppercase tracking-wider">
                  Numismatic Dossier & Specs
                </span>
                <StatusBadge status={item.storefront_status || item.status || 'Active'} />
              </div>

              <div className="divide-y divide-slate-100 text-xs font-sans">
                <div className="grid grid-cols-3 p-3">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider font-sans text-[11px]">Item Number</span>
                  <span className="col-span-2 text-slate-800 font-semibold font-mono">Item #{item.lot_number || '—'}</span>
                </div>

                <div className="grid grid-cols-3 p-3 bg-slate-50/40">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider font-sans text-[11px]">Item Code</span>
                  <span className="col-span-2 text-slate-800 font-medium font-mono">{item.sku || '—'}</span>
                </div>

                <div className="grid grid-cols-3 p-3">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider font-sans text-[11px]">Classification</span>
                  <span className="col-span-2 text-slate-800 font-medium">
                    {item.category || '—'}{item.metal ? ` (${item.metal})` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-3 p-3 bg-slate-50/40">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider font-sans text-[11px]">Purity / Metal</span>
                  <span className="col-span-2 text-slate-800 font-medium">{item.purity || '—'}</span>
                </div>

                <div className="grid grid-cols-3 p-3">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider font-sans text-[11px]">Certified Grade</span>
                  <span className="col-span-2 text-slate-800 font-medium">{item.grade || '—'}</span>
                </div>

                <div className="grid grid-cols-3 p-3 bg-slate-50/40">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider font-sans text-[11px]">Weight / Mintage</span>
                  <span className="col-span-2 text-slate-800 font-medium">{item.weight || item.mintage || '—'}</span>
                </div>

                <div className="grid grid-cols-3 p-3">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider font-sans text-[11px]">Fulfillment</span>
                  <span className="col-span-2 text-slate-800 font-medium">{item.fulfillment || 'In-House Insured USPS Priority Packaging'}</span>
                </div>

                <div className="grid grid-cols-3 p-3 bg-slate-50/40">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider font-sans text-[11px]">Stock Count</span>
                  <span className="col-span-2 text-slate-800 font-semibold font-mono">
                    {item.inventory ?? item.stock_quantity ?? 1} unit(s) available
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <span className="text-xs font-bold font-sans text-slate-800 uppercase tracking-wider block">
                Catalog Description
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {item.description || item.lead || 'No catalog description provided.'}
              </p>
            </div>



          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 px-6 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B2B4E] hover:bg-[#114275] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C9A23A]" />
                <span>Edit Product</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
