import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  Phone,
  ShoppingCart,
  CreditCard
} from 'lucide-react';

export const ItemDetailModal = ({
  isOpen,
  onClose,
  item,
  onEdit
}) => {
  if (!isOpen || !item) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const basePrice = Number(item.price) || 0;
  const settlementFee = (basePrice * 1.15).toFixed(2);
  const images = Array.isArray(item.additional_images) && item.additional_images.length > 0
    ? item.additional_images
    : [item.featured_image || '/assets/items/lot1_morgan_gold_gem.jpg'];

  const activeImage = images[activeImageIndex] || item.featured_image || '/assets/items/lot1_morgan_gold_gem.jpg';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        {/* Modal Card matching Client-Side Storefront UI */}
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-white/90 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Left Column: Visuals & Guarantee Badge */}
            <div className="lg:col-span-5 bg-[#FAF8F5] p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200/80">
              <div className="space-y-4">
                {/* Main Square Product Photo */}
                <div className="w-full aspect-square rounded-xl bg-white border border-slate-200/80 shadow-xs overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={activeImage}
                    alt={item.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/items/lot1_morgan_gold_gem.jpg';
                    }}
                  />
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    {images.slice(0, 4).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 bg-white transition-all ${
                          activeImageIndex === idx ? 'border-gold shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Verified Vault Badge */}
              <div className="mt-6 p-3 rounded-xl bg-[#F5EFE6] border border-[#E5DAC8] text-center text-xs">
                <div className="flex items-center justify-center gap-1.5 text-slate-800 font-bold font-sans">
                  <ShieldCheck className="w-4 h-4 text-gold-dark" />
                  <span>Certified & Inspected by HGS</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans block mt-0.5">
                  Bigfork, Montana Armory Inventory
                </span>
              </div>
            </div>

            {/* Right Column: Exact Client-side Numismatic Dossier */}
            <div className="lg:col-span-7 p-6 sm:p-7 space-y-5 overflow-y-auto max-h-[85vh]">
              
              {/* Category Breadcrumb & Title */}
              <div>
                <span className="text-xs font-bold font-sans uppercase tracking-widest text-gold-dark">
                  ITEM #{item.lot_number} • {item.category || 'GOLD'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 uppercase tracking-tight mt-1 leading-snug">
                  {item.title}
                </h2>
              </div>

              {/* Price Banner Card */}
              <div className="p-4 rounded-xl bg-[#FDFBF7] border border-[#EBE3D7] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                    Storefront Price
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 block">
                    ${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Market Range: {item.estimate_range || '$4,250.00 – $5,700.00 USD'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                    Settlement with 15% Fee
                  </span>
                  <span className="text-xl font-bold font-mono text-gold-dark block">
                    ${Number(settlementFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block">
                    Montana 0% Sales Tax
                  </span>
                </div>
              </div>

              {/* Specifications Table */}
              <div className="border border-slate-200/90 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="grid grid-cols-3 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">Item #</span>
                  <span className="col-span-2 text-slate-800 font-semibold font-mono">Item #{item.lot_number}</span>
                </div>

                <div className="grid grid-cols-3 p-2.5">
                  <span className="text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">Classification</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{item.category} ({item.metal || item.category})</span>
                </div>

                <div className="grid grid-cols-3 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">Purity / Metal</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{item.purity || '.999 Pure Gold (1 Troy Oz)'}</span>
                </div>

                <div className="grid grid-cols-3 p-2.5">
                  <span className="text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">Certified Grade</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{item.grade || 'NGC Ultra Cameo Gem Proof'}</span>
                </div>

                <div className="grid grid-cols-3 p-2.5 bg-slate-50/50">
                  <span className="text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">Mintage / Issue</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{item.mintage || '999 Units Worldwide'}</span>
                </div>

                <div className="grid grid-cols-3 p-2.5">
                  <span className="text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">Fulfillment</span>
                  <span className="col-span-2 text-slate-800 font-semibold">{item.fulfillment || 'In-House Insured USPS Priority Packaging'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-slate-700 leading-relaxed space-y-2">
                <p>
                  {item.description || item.lead}
                </p>
              </div>

              {/* Acquisition Terms */}
              <div className="border-l-4 border-gold bg-[#FFFDF9] p-3.5 text-xs text-slate-800 rounded-r-lg">
                <span className="font-bold text-slate-900">Acquisition Terms: </span>
                {item.payment_note || item.acquisition_terms || 'High-value acquisition: Direct bank wire payment preferred with HGS wire credit applied on settlement.'}
              </div>

              {/* HGS Sold Value Guarantee */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                <span className="font-bold text-aubergine block mb-1">HGS Sold Value Guarantee:</span>
                <p className="text-slate-600 leading-relaxed">
                  {item.guarantee_note || 'If proof is presented that any purchased piece was overpriced based on current market state, HGS refunds the difference or accepts as-sold return.'}
                </p>
              </div>

              {/* Public Storefront Buttons & Links */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-aubergine text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:bg-aubergine-light transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 text-gold" />
                  Add to Cart (${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </button>

                <a
                  href={`https://paypal.me/HighlanderGoldSilver/${settlementFee}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-light text-aubergine-dark text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-aubergine-dark" />
                  Buy Now via PayPal
                </a>
              </div>

              {/* Direct Settlement Note */}
              <div className="text-center text-[11px] text-slate-500 pt-1">
                Direct settlement via verified PayPal portal:{' '}
                <a 
                  href="https://paypal.me/HighlanderGoldSilver" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-aubergine underline font-medium"
                >
                  paypal.me/HighlanderGoldSilver
                </a>
                {' '}• Phone: (406) 407-0281
              </div>

              {/* Admin Actions */}
              {onEdit && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(item);
                    }}
                    className="text-xs font-semibold text-aubergine hover:text-gold flex items-center gap-1.5"
                  >
                    Edit Product in Admin Drawer →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
