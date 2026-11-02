import { Select } from '../ui/Select';
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { ShieldCheck, Check, Camera, Upload, Trash2 } from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';
import { getCachedAvatar } from '../../utils/avatarStorage';

const ROLES = ['Super Admin', 'Admin', 'Inventory Manager', 'Order Manager'];
const STATUSES = ['Active', 'Suspended'];

export const AdminUserFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isLoading = false
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Inventory Manager',
    title: '',
    location: 'Bigfork Storefront & Vault',
    status: 'Active',
    avatar_url: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        role: initialData.role || 'Inventory Manager',
        title: initialData.title || '',
        location: initialData.location || 'Bigfork Storefront & Vault',
        status: initialData.status || 'Active',
        avatar_url: initialData.avatar_url || getCachedAvatar(initialData.id, initialData.email) || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Inventory Manager',
        title: 'Vault Specialist',
        location: 'Bigfork Storefront & Vault',
        status: 'Active',
        avatar_url: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 320, 320, 0.88);
      setFormData(prev => ({ ...prev, avatar_url: dataUrl }));
    } catch (err) {
      console.error('Image compression error:', err);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Staff Member: ${formData.name}` : 'Provision Administrator / Staff Role'}
      subtitle="Highlander Internal Staff Credentials"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Photo Uploader */}
        <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Staff Profile Photo
          </label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#071A35] border-2 border-[#C9A23A] flex items-center justify-center text-[#C9A23A] font-bold text-sm overflow-hidden shrink-0 shadow-xs">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Staff preview" className="w-full h-full object-cover" />
              ) : (
                <span>{formData.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0B2B4E] hover:bg-[#114275] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-[#C9A23A]" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                  />
                </label>
                {formData.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar_url: '' }))}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium border border-rose-200"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                PNG, JPG or WebP. Syncs across the admin dashboard.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Katherine Ross"
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
            } focus:outline-none focus:ring-2 focus:ring-aubergine`}
          />
          {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Staff Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="staff@highlandergoldsilver.com"
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-300 bg-white'
            } focus:outline-none focus:ring-2 focus:ring-aubergine`}
          />
          {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Role Permission
            </label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={ROLES.map(r => ({ value: r, label: r }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Account Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={STATUSES.map(s => ({ value: s, label: s }))}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Staff Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Certified Coin Cataloger & Appraiser"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-sans uppercase tracking-wider text-white bg-[#0B2B4E] hover:bg-[#114275] rounded-lg shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4 text-gold" />
            {isEditing ? 'Save Changes' : 'Provision Staff'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
