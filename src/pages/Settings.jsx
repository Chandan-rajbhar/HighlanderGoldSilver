import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Database, 
  DollarSign, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Check, 
  Copy, 
  RotateCcw,
  Code2,
  ExternalLink
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { isSupabaseConfigured, getSupabaseStatus } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    business_name: '',
    tagline: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    phone_formatted: '',
    email: '',
    paypal_url: '',
    buyers_premium_percent: 0.15,
    operating_hours: '',
    bank_wire_instructions: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseStatus = getSupabaseStatus();

  useEffect(() => {
    settingsService.getSettings()
      .then((data) => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching settings:', err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await settingsService.updateSettings(settings);
      setSettings(updated);
      toast.success('Storefront & settlement settings saved successfully!');
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset local inventory & records to original website state? Any locally created items will be refreshed.')) {
      settingsService.resetStoreData();
      toast.info('Local database reset to original Highlander Gold & Silver catalog state. Refreshing...');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const sqlSample = `-- HIGHLANDER GOLD & SILVER SCHEMA MIGRATION
-- Run in Supabase SQL Editor:
-- File located at: src/lib/schema.sql`;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
          Storefront & Supabase Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure business metadata, settlement buyer's premium, bank wire accounts, and database integration.
        </p>
      </div>

      {/* Supabase Status & Architecture Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              supabaseStatus.isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Supabase Database Engine
              </h3>
              <p className="text-xs text-slate-500">
                {supabaseStatus.statusText}
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
            supabaseStatus.isConfigured ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            {supabaseStatus.isConfigured ? 'Connected' : 'Offline / Dev Mode'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <p>
            <strong>How Supabase Integration Works:</strong>
          </p>
          <p>
            The entire dashboard is built on a modular service layer (<code className="font-mono bg-white px-1 py-0.5 border rounded">src/services/*</code>) and centralized Supabase client (<code className="font-mono bg-white px-1 py-0.5 border rounded">src/lib/supabaseClient.js</code>).
          </p>
          <p>
            When you provide <code className="font-mono bg-white px-1 py-0.5 border rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-white px-1 py-0.5 border rounded">VITE_SUPABASE_ANON_KEY</code> in your environment, all CRUD operations instantly switch to Supabase with server-side pagination, range queries, and column-selective egress optimization. No UI or component changes required!
          </p>
        </div>
      </div>

      {/* Storefront Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-bold font-serif text-slate-900">
            Storefront Identity & Location
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={settings.business_name}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Storefront Address
            </label>
            <input
              type="text"
              value={settings.street}
              onChange={(e) => setSettings({ ...settings, street: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State
              </label>
              <input
                type="text"
                value={settings.state}
                onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Zip
              </label>
              <input
                type="text"
                value={settings.zip}
                onChange={(e) => setSettings({ ...settings, zip: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Telephone
            </label>
            <input
              type="text"
              value={settings.phone_formatted}
              onChange={(e) => setSettings({ ...settings, phone_formatted: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Financial & Terms */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-bold font-serif text-slate-900">
              Settlement, Buyer's Premium & Wire Terms
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Buyer's Premium Rate (Standard: 0.15 = 15%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="0.5"
                value={settings.buyers_premium_percent}
                onChange={(e) => setSettings({ ...settings, buyers_premium_percent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-mono focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Applied automatically across all catalog hammer prices ({Math.round(settings.buyers_premium_percent * 100)}%).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                PayPal Me Storefront URL
              </label>
              <input
                type="text"
                value={settings.paypal_url}
                onChange={(e) => setSettings({ ...settings, paypal_url: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Bank Wire Instructions & Settlement Details
              </label>
              <textarea
                rows="2"
                value={settings.bank_wire_instructions}
                onChange={(e) => setSettings({ ...settings, bank_wire_instructions: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Local Seed Data
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold font-serif uppercase tracking-wider text-white bg-aubergine hover:bg-aubergine-light rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-gold" />
            )}
            Save Storefront Settings
          </button>
        </div>
      </form>
    </div>
  );
};

