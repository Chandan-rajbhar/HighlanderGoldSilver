import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon,
  Edit2,
  Check
} from 'lucide-react';
import { uploadSettingsImage } from '../../services/imageUploadService';
import { useToast } from '../../context/ToastContext';

export const SettingsImageUploadCard = ({
  label,
  description,
  recommended = '16:9 ratio • Max 15MB (JPG, PNG, WebP, SVG)',
  value = '',
  onChange,
  aspectClass = 'h-48 sm:h-56',
  darkPreview = false
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(value || '');

  useEffect(() => {
    setManualUrl(value || '');
    setImgError(false);
  }, [value]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again if needed
    e.target.value = '';

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit. Please choose a smaller image.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP, SVG).');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const publicUrl = await uploadSettingsImage(file);
      if (publicUrl) {
        onChange(publicUrl);
        setUploadSuccess(true);
        toast.success(`${label || 'Image'} uploaded successfully to cloud storage.`);
        setTimeout(() => setUploadSuccess(false), 3500);
      } else {
        throw new Error('Upload succeeded but no public URL was returned.');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to upload image. Your existing image was preserved.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove the ${label || 'image'}?`)) {
      onChange('');
      setImgError(false);
      toast.info(`${label || 'Image'} removed. Click "Save Changes" to commit.`);
    }
  };

  const handleManualApply = () => {
    onChange(manualUrl.trim());
    setShowManualInput(false);
    toast.success('Image link updated.');
  };

  const hasImage = Boolean(value && value.trim() !== '');

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-slate-300">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#C9A23A]" />
            <span>{label}</span>
          </h4>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
          {recommended}
        </span>
      </div>

      {/* Main Preview Box */}
      <div className="mt-4 space-y-3">
        <div 
          className={`relative ${aspectClass} w-full rounded-xl border border-slate-200/80 overflow-hidden flex items-center justify-center transition-all ${
            darkPreview ? 'bg-[#071A35]' : 'bg-slate-50/80'
          }`}
        >
          {hasImage && !imgError ? (
            <img
              src={value}
              alt={label}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain p-2 transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-200/60 flex items-center justify-center mx-auto text-slate-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-600">
                {imgError ? 'Failed to load image from address' : 'No image asset assigned'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Upload a high-resolution brand asset to display across the Highlander storefront.
              </p>
            </div>
          )}

          {/* Uploading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-[#071A35]/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-10 animate-in fade-in duration-150">
              <div className="w-7 h-7 border-2 border-white/30 border-t-[#C9A23A] rounded-full animate-spin" />
              <p className="text-xs font-semibold text-white">Uploading to cloud storage...</p>
              <span className="text-[10px] text-slate-300">Synchronizing permanent URL</span>
            </div>
          )}

          {/* Success Badge */}
          {uploadSuccess && (
            <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-150 z-10">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Uploaded Successfully</span>
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#071A35] hover:bg-[#0c2a54] text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {hasImage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#C9A23A]" />
                  <span>Replace Image</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-[#C9A23A]" />
                  <span>Upload Image</span>
                </>
              )}
            </button>

            {hasImage && (
              <button
                type="button"
                disabled={isUploading}
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}

            {hasImage && (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 transition-all"
              >
                <span>View Full Asset</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            )}
          </div>

          {/* Secondary: Manual Link toggle */}
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>{showManualInput ? 'Hide Web Link' : 'Edit Web Link directly'}</span>
          </button>
        </div>

        {/* Collapsible Manual URL Input */}
        {showManualInput && (
          <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150 space-y-2">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Direct Storage / CDN Web Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:border-[#071A35]"
              />
              <button
                type="button"
                onClick={handleManualApply}
                className="px-3 h-9 text-xs font-semibold bg-[#071A35] text-white rounded-lg hover:bg-[#0c2a54] transition-all cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5 text-[#C9A23A]" />
                <span>Apply Link</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

