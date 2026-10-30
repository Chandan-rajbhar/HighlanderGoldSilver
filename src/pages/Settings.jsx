import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Layers, 
  Check, 
  RotateCcw, 
  Eye, 
  CreditCard, 
  Package, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  Save, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Shield,
  FileText,
  Sliders,
  Store,
  Calendar
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { useToast } from '../context/ToastContext';
import { storefrontSettings } from '../data/initialData';

// =============================================================================
// SUB-COMPONENT: REUSABLE SECTION HEADER
// =============================================================================
const SectionHeader = ({ icon: Icon, title, description, badge }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#071A35]/5 border border-[#071A35]/10 flex items-center justify-center text-[#071A35] shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-[#C9A23A]" />
      </div>
      <div>
        <h3 className="text-base font-bold font-sans text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
    </div>
    {badge && (
      <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-[#071A35]/5 text-[#071A35] border border-[#071A35]/10">
        {badge}
      </span>
    )}
  </div>
);

// =============================================================================
// SUB-COMPONENT: REUSABLE LIVE PREVIEW FRAME
// =============================================================================
const LivePreviewFrame = ({ route, label, children }) => (
  <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
    {/* Browser-style Chrome Header */}
    <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 ml-2 px-3 py-1 rounded-md bg-white border border-slate-200/70 text-[11px] font-mono text-slate-600 shadow-2xs">
          <Store className="w-3 h-3 text-slate-400" />
          <span>https://highlandergoldsilver.com{route}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8F7220] bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded-md">
          <Eye className="w-3 h-3 text-[#C9A23A]" />
          <span>{label || 'Storefront Client Preview'}</span>
        </span>
      </div>
    </div>

    {/* Viewport Canvas */}
    <div className="p-6 sm:p-8 bg-[#FAF9F5]">
      {children}
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT: SETTINGS
// =============================================================================
export const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('identity');
  const [settings, setSettings] = useState(() => ({ ...storefrontSettings }));
  const [savedSettings, setSavedSettings] = useState(() => ({ ...storefrontSettings }));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load Initial Settings
  useEffect(() => {
    let isMounted = true;
    settingsService.getSettings()
      .then((data) => {
        if (isMounted) {
          const merged = { ...storefrontSettings, ...data };
          setSettings(merged);
          setSavedSettings(merged);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching settings:', err);
          setIsLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Detect Unsaved Changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(savedSettings);
  }, [settings, savedSettings]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleDiscard = () => {
    setSettings({ ...savedSettings });
    toast.info('Unsaved changes discarded.');
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await settingsService.updateSettings(settings);
      const merged = { ...settings, ...updated };
      setSettings(merged);
      setSavedSettings(merged);
      toast.success('Storefront & website settings saved successfully!');
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset storefront settings and website content to original Highlander Gold & Silver defaults?')) {
      settingsService.resetStoreData();
      const reset = { ...storefrontSettings };
      setSettings(reset);
      setSavedSettings(reset);
      toast.info('Settings restored to initial factory defaults. Refreshing...');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  // Navigation Items
  const navSections = [
    { 
      id: 'identity', 
      label: 'Storefront Identity', 
      description: 'Physical address, contact & hours', 
      icon: Building 
    },
    { 
      id: 'settlement', 
      label: 'Settlement & Terms', 
      description: "Buyer's premium & wire instructions", 
      icon: DollarSign 
    },
    { 
      id: 'difference', 
      label: 'Difference Highlights', 
      description: 'Homepage 4-card value proposition', 
      icon: Sparkles 
    },
    { 
      id: 'guarantee', 
      label: 'Sold Value Guarantee', 
      description: 'Authenticity & refund promise', 
      icon: ShieldCheck 
    },
    { 
      id: 'heritage', 
      label: 'Heritage & Depository', 
      description: 'Montana vault narrative & buttons', 
      icon: Compass 
    },
    { 
      id: 'all', 
      label: 'Full Overview (All)', 
      description: 'Single-page master document', 
      icon: Layers 
    }
  ];

  return (
    <div className="w-full space-y-6 pb-24">
      {/* ===================================================================== */}
      {/* PAGE HEADER */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 tracking-tight">
                Storefront & Website Settings
              </h1>
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All Saved
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Configure Highlander Gold & Silver public identity, Montana vault operating hours, settlement terms, and live homepage storytelling sections.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Discard
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold font-sans uppercase tracking-wider text-white bg-[#071A35] hover:bg-[#0c2a54] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-[#C9A23A]" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2-COLUMN MAIN SETTINGS WORKSPACE */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ----------------------------------------------------------------- */}
        {/* LEFT COLUMN: NAVIGATION SIDEBAR */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-4">
          <nav className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-1">
            <div className="px-3 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Settings Navigation
            </div>
            {navSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-[#071A35] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/10 text-[#C9A23A]'
                      : 'bg-slate-100 text-slate-500 group-hover:text-slate-900 group-hover:bg-slate-200/70'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`block text-xs font-bold leading-tight ${
                      isActive ? 'text-white' : 'text-slate-800'
                    }`}>
                      {sec.label}
                    </span>
                    <span className={`block text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}>
                      {sec.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Info & Depository Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#C9A23A]" />
                Storefront Depository
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Jurisdiction:</span>
                <span className="font-semibold text-slate-700">Montana (0% Tax)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Buyer's Premium:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {Math.round((settings.buyers_premium_percent || 0.15) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Depository Vault:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[130px]">Bigfork, MT</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Factory Defaults</span>
              </button>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* RIGHT COLUMN: MAIN FORM CONTENT */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">

            {/* =============================================================== */}
            {/* SECTION 1: STOREFRONT IDENTITY & CONTACT */}
            {/* =============================================================== */}
            {(activeTab === 'all' || activeTab === 'identity') && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
                <SectionHeader 
                  icon={Building}
                  title="Storefront Identity & Contact Information"
                  description="Primary legal identity, physical storefront coordinates in Bigfork, telephone lines, and customer service email."
                  badge="Physical Presence"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Business Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={settings.business_name || ''}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                      placeholder="Highlander Gold & Silver"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Tagline / Business Subtitle
                    </label>
                    <input
                      type="text"
                      value={settings.tagline || ''}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      placeholder="Rare Coins, Bullion & Precious Metals Marketplace"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Physical Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Physical Storefront Street Address
                    </label>
                    <input
                      type="text"
                      value={settings.street || ''}
                      onChange={(e) => handleChange('street', e.target.value)}
                      placeholder="119 Jewel Basin Ct. B3"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* City, State, Zip (Balanced 3-column subgrid) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      City, State & Zip Code
                    </label>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={settings.city || ''}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="City (Bigfork)"
                          className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={settings.state || ''}
                          onChange={(e) => handleChange('state', e.target.value)}
                          placeholder="State"
                          className="w-full h-10 px-2 text-center text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans font-medium"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={settings.zip || ''}
                          onChange={(e) => handleChange('zip', e.target.value)}
                          placeholder="Zip Code"
                          className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Storefront Telephone (Formatted)
                    </label>
                    <input
                      type="text"
                      value={settings.phone_formatted || ''}
                      onChange={(e) => handleChange('phone_formatted', e.target.value)}
                      placeholder="(406) 407-0281"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans font-mono"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Storefront Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="Stratford1955@icloud.com"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Operating Hours (Full Width) */}
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Operating Hours & Depository Schedule
                    </label>
                    <input
                      type="text"
                      value={settings.operating_hours || ''}
                      onChange={(e) => handleChange('operating_hours', e.target.value)}
                      placeholder="Online Storefront 24/7 | Vault By Appointment"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Displayed across website header, footer, and checkout depository scheduling modal.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION 2: SETTLEMENT & BUYER'S PREMIUM TERMS */}
            {/* =============================================================== */}
            {(activeTab === 'all' || activeTab === 'settlement') && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
                <SectionHeader 
                  icon={DollarSign}
                  title="Settlement & Buyer's Premium Terms"
                  description="Standard fee percentages calculated on precious metal and coin transactions, PayPal Me gateway, and bank wire routing."
                  badge="Financial Governance"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Buyer's Premium Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Buyer's Premium Rate (Decimal, e.g. 0.15 = 15%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="0.5"
                        value={settings.buyers_premium_percent ?? 0.15}
                        onChange={(e) => handleChange('buyers_premium_percent', Number(e.target.value))}
                        className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#071A35] bg-slate-100 px-2 py-0.5 rounded">
                        {Math.round((settings.buyers_premium_percent || 0.15) * 100)}%
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1.5 block">
                      Calculation: $1,000 hammer price + {Math.round((settings.buyers_premium_percent || 0.15) * 100)}% premium = ${(1000 * (1 + (settings.buyers_premium_percent || 0.15))).toLocaleString()} invoice settlement.
                    </span>
                  </div>

                  {/* PayPal Me URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      PayPal Me Storefront Payment URL
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={settings.paypal_url || ''}
                        onChange={(e) => handleChange('paypal_url', e.target.value)}
                        placeholder="https://paypal.me/HighlanderGoldSilver"
                        className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-mono"
                      />
                      {settings.paypal_url && (
                        <a
                          href={settings.paypal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#071A35] p-1 transition-colors"
                          title="Open PayPal Link in New Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1.5 block">
                      Target destination for client instantaneous deposit payments.
                    </span>
                  </div>

                  {/* Bank Wire Instructions */}
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Bank Wire Instructions & Settlement Details
                    </label>
                    <textarea
                      rows="3"
                      value={settings.bank_wire_instructions || ''}
                      onChange={(e) => handleChange('bank_wire_instructions', e.target.value)}
                      placeholder="Bigfork First National Bank | Account: Highlander Gold & Silver LLC | Routing: 092901234"
                      className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-mono leading-relaxed"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Provided on invoice documents and wire settlement instructions for high-value numismatic lots.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION 3: THE HIGHLANDER DIFFERENCE & HIGHLIGHTS */}
            {/* =============================================================== */}
            {(activeTab === 'all' || activeTab === 'difference') && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
                <SectionHeader 
                  icon={Sparkles}
                  title="The Highlander Difference & Highlights"
                  description="Homepage storytelling model: section headline, narrative overview, and the 4 value highlight cards displayed to collectors."
                  badge="Homepage Section"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Eyebrow */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Section Eyebrow Subtitle
                    </label>
                    <input
                      type="text"
                      value={settings.difference_eyebrow || ''}
                      onChange={(e) => handleChange('difference_eyebrow', e.target.value)}
                      placeholder="The Highlander Difference · Bigfork, Montana"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Section Main Headline
                    </label>
                    <input
                      type="text"
                      value={settings.difference_title || ''}
                      onChange={(e) => handleChange('difference_title', e.target.value)}
                      placeholder="A Dedicated Storefront for Numismatic Collectors"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Overview Narrative */}
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Section Overview Narrative / Body Text
                    </label>
                    <textarea
                      rows="3"
                      value={settings.difference_subtitle || ''}
                      onChange={(e) => handleChange('difference_subtitle', e.target.value)}
                      placeholder="We operate as a direct storefront rather than an auction house..."
                      className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* The 4 Feature Cards */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      The 4 Value Proposition Cards
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">Standard 4-Column Grid</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Direct Storefront Purchase */}
                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <CreditCard className="w-4 h-4 text-[#C9A23A]" />
                        <span>Card 1: Direct Purchase</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settings.card1_title || ''}
                          onChange={(e) => handleChange('card1_title', e.target.value)}
                          placeholder="Direct Storefront Purchase"
                          className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Description</label>
                        <textarea
                          rows="2"
                          value={settings.card1_desc || ''}
                          onChange={(e) => handleChange('card1_desc', e.target.value)}
                          placeholder="Browse verified inventory and purchase immediately..."
                          className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35] leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Card 2: Sold Value Guarantee */}
                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <ShieldCheck className="w-4 h-4 text-[#C9A23A]" />
                        <span>Card 2: Value Guarantee</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settings.card2_title || ''}
                          onChange={(e) => handleChange('card2_title', e.target.value)}
                          placeholder="Sold Value Guarantee"
                          className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Description</label>
                        <textarea
                          rows="2"
                          value={settings.card2_desc || ''}
                          onChange={(e) => handleChange('card2_desc', e.target.value)}
                          placeholder="Every piece is evaluated for true luster..."
                          className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35] leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Card 3: In-House Insured Delivery */}
                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Package className="w-4 h-4 text-[#C9A23A]" />
                        <span>Card 3: Insured Delivery</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settings.card3_title || ''}
                          onChange={(e) => handleChange('card3_title', e.target.value)}
                          placeholder="In-House Insured Delivery"
                          className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Description</label>
                        <textarea
                          rows="2"
                          value={settings.card3_desc || ''}
                          onChange={(e) => handleChange('card3_desc', e.target.value)}
                          placeholder="All packaging is performed in-house from Jewel Basin Armory..."
                          className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35] leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Card 4: 0% Montana Sales Tax */}
                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Check className="w-4 h-4 text-[#C9A23A]" />
                        <span>Card 4: Montana Sales Tax</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settings.card4_title || ''}
                          onChange={(e) => handleChange('card4_title', e.target.value)}
                          placeholder="0% Montana Sales Tax"
                          className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Card Description</label>
                        <textarea
                          rows="2"
                          value={settings.card4_desc || ''}
                          onChange={(e) => handleChange('card4_desc', e.target.value)}
                          placeholder="Take advantage of Montana's 0% state sales tax on precious metals..."
                          className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35] leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Visual Preview */}
                <LivePreviewFrame route="/#difference" label="Difference Live Section">
                  <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
                    <p className="text-[11px] uppercase tracking-widest text-[#C9A23A] font-bold">
                      — {settings.difference_eyebrow || 'THE HIGHLANDER DIFFERENCE'} —
                    </p>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#071A35] tracking-tight">
                      {settings.difference_title || 'A Dedicated Storefront for Numismatic Collectors'}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {settings.difference_subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center space-y-1.5 flex flex-col justify-between">
                      <div>
                        <CreditCard className="w-5 h-5 mx-auto text-[#071A35] mb-2" />
                        <p className="text-xs font-bold font-serif text-[#071A35] uppercase tracking-wide">
                          {settings.card1_title || 'Direct Purchase'}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal line-clamp-3">
                        {settings.card1_desc}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center space-y-1.5 flex flex-col justify-between">
                      <div>
                        <ShieldCheck className="w-5 h-5 mx-auto text-[#071A35] mb-2" />
                        <p className="text-xs font-bold font-serif text-[#071A35] uppercase tracking-wide">
                          {settings.card2_title || 'Value Guarantee'}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal line-clamp-3">
                        {settings.card2_desc}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center space-y-1.5 flex flex-col justify-between">
                      <div>
                        <Package className="w-5 h-5 mx-auto text-[#071A35] mb-2" />
                        <p className="text-xs font-bold font-serif text-[#071A35] uppercase tracking-wide">
                          {settings.card3_title || 'Insured Delivery'}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal line-clamp-3">
                        {settings.card3_desc}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center space-y-1.5 flex flex-col justify-between">
                      <div>
                        <Check className="w-5 h-5 mx-auto text-[#071A35] mb-2" />
                        <p className="text-xs font-bold font-serif text-[#071A35] uppercase tracking-wide">
                          {settings.card4_title || 'Montana Sales Tax'}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal line-clamp-3">
                        {settings.card4_desc}
                      </p>
                    </div>
                  </div>
                </LivePreviewFrame>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION 4: SOLD VALUE GUARANTEE */}
            {/* =============================================================== */}
            {(activeTab === 'all' || activeTab === 'guarantee') && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
                <SectionHeader 
                  icon={ShieldCheck}
                  title="The Highlander Sold Value Guarantee"
                  description="Authenticity promise, market value difference refund commitment, numismatic curation criteria, and 4 trust badges."
                  badge="Trust & Guarantee"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Badge Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Badge / Eyebrow Text
                    </label>
                    <input
                      type="text"
                      value={settings.guarantee_badge || ''}
                      onChange={(e) => handleChange('guarantee_badge', e.target.value)}
                      placeholder="Authentic Value & Authenticity Promise"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Section Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Guarantee Section Title
                    </label>
                    <input
                      type="text"
                      value={settings.guarantee_title || ''}
                      onChange={(e) => handleChange('guarantee_title', e.target.value)}
                      placeholder="The Highlander Sold Value Guarantee"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Numismatic Standard Narrative */}
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Numismatic Standard & Curation Narrative
                    </label>
                    <textarea
                      rows="3"
                      value={settings.guarantee_desc || ''}
                      onChange={(e) => handleChange('guarantee_desc', e.target.value)}
                      placeholder="Highlander Gold & Silver hand-selects coins and precious metals for superior eye appeal..."
                      className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans leading-relaxed"
                    />
                  </div>

                  {/* Direct Promise Text */}
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Direct Promise Text (Refund & Market Value Integrity)
                    </label>
                    <textarea
                      rows="3"
                      value={settings.guarantee_promise_text || ''}
                      onChange={(e) => handleChange('guarantee_promise_text', e.target.value)}
                      placeholder="If at any time a customer proves that a piece they purchased was overpriced based on its current market state..."
                      className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* 4 Trust Badges */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    The 4 Authenticity Trust Badges
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 1</label>
                      <input
                        type="text"
                        value={settings.guarantee_badge_1 || ''}
                        onChange={(e) => handleChange('guarantee_badge_1', e.target.value)}
                        placeholder="Verified Guarantee"
                        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 2</label>
                      <input
                        type="text"
                        value={settings.guarantee_badge_2 || ''}
                        onChange={(e) => handleChange('guarantee_badge_2', e.target.value)}
                        placeholder="Hand-Selected Eye Appeal"
                        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 3</label>
                      <input
                        type="text"
                        value={settings.guarantee_badge_3 || ''}
                        onChange={(e) => handleChange('guarantee_badge_3', e.target.value)}
                        placeholder="Difference Refund Protection"
                        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 4</label>
                      <input
                        type="text"
                        value={settings.guarantee_badge_4 || ''}
                        onChange={(e) => handleChange('guarantee_badge_4', e.target.value)}
                        placeholder="0% Montana State Sales Tax"
                        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#071A35]"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Visual Preview */}
                <LivePreviewFrame route="/#guarantee" label="Guarantee Certificate Preview">
                  <div className="bg-white rounded-2xl border-l-4 border-l-[#C9A23A] border-y border-r border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8F7220]">
                      <ShieldCheck className="w-4 h-4 text-[#C9A23A]" />
                      <span>{settings.guarantee_badge || 'AUTHENTIC VALUE & AUTHENTICITY PROMISE'}</span>
                    </div>

                    <h3 className="text-lg font-serif font-bold text-[#071A35]">
                      {settings.guarantee_title || 'THE HIGHLANDER SOLD VALUE GUARANTEE'}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {settings.guarantee_desc}
                    </p>

                    <div className="bg-[#FAF6EC] border border-[#E9DCB8] rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 font-bold block mb-1">Our Direct Promise:</strong>
                      {settings.guarantee_promise_text}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        settings.guarantee_badge_1, 
                        settings.guarantee_badge_2, 
                        settings.guarantee_badge_3, 
                        settings.guarantee_badge_4
                      ].filter(Boolean).map((badge, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8F7220] bg-[#FAF3E0] px-3 py-1 rounded-md border border-[#E9DCB8]">
                          <Check className="w-3 h-3 text-[#C9A23A]" />
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </LivePreviewFrame>
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION 5: HERITAGE & PHYSICAL DEPOSITORY */}
            {/* =============================================================== */}
            {(activeTab === 'all' || activeTab === 'heritage') && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
                <SectionHeader 
                  icon={Compass}
                  title="Heritage & Physical Depository"
                  description="Bigfork, Montana physical location callout banner, heritage narrative, and primary/secondary storefront call-to-actions."
                  badge="Depository Banner"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Headline */}
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Banner Headline
                    </label>
                    <input
                      type="text"
                      value={settings.heritage_title || ''}
                      onChange={(e) => handleChange('heritage_title', e.target.value)}
                      placeholder="Rooted in Flathead Valley Numismatic Tradition"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Narrative */}
                  <div className="col-span-full">
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Depository & Physical Location Narrative
                    </label>
                    <textarea
                      rows="3"
                      value={settings.heritage_desc || ''}
                      onChange={(e) => handleChange('heritage_desc', e.target.value)}
                      placeholder="Operating from our physical location at 119 Jewel Basin Ct. B3 in Bigfork, Montana..."
                      className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans leading-relaxed"
                    />
                  </div>

                  {/* Primary CTA */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Primary Button Label
                    </label>
                    <input
                      type="text"
                      value={settings.heritage_btn_primary || ''}
                      onChange={(e) => handleChange('heritage_btn_primary', e.target.value)}
                      placeholder="Learn About Our Storefront"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>

                  {/* Secondary CTA */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                      Secondary Button Label
                    </label>
                    <input
                      type="text"
                      value={settings.heritage_btn_secondary || ''}
                      onChange={(e) => handleChange('heritage_btn_secondary', e.target.value)}
                      placeholder="Contact Our Team"
                      className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Live Visual Preview */}
                <LivePreviewFrame route="/#heritage" label="Depository Callout Banner">
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-7 sm:p-8 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8F7220]">
                      <MapPin className="w-4 h-4 text-[#C9A23A]" />
                      <span>Flathead Valley Physical Depository</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#071A35] tracking-wide uppercase">
                      {settings.heritage_title || 'ROOTED IN FLATHEAD VALLEY NUMISMATIC TRADITION'}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl font-sans">
                      {settings.heritage_desc}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#C9A23A] hover:bg-[#b8912e] text-slate-950 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{settings.heritage_btn_primary || 'Learn About Our Storefront'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                      >
                        {settings.heritage_btn_secondary || 'Contact Our Team'}
                      </button>
                    </div>
                  </div>
                </LivePreviewFrame>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* STICKY BOTTOM FLOATING SAVE BAR (WHEN UNSAVED CHANGES EXIST) */}
      {/* ===================================================================== */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-[#071A35] text-white rounded-2xl shadow-elevated border border-white/10 p-3 sm:p-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold leading-tight">
                Unsaved Changes Detected
              </p>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Your modifications have not been committed to the live database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold font-sans uppercase tracking-wider text-slate-950 bg-[#C9A23A] hover:bg-[#b8912e] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-slate-950" />
              )}
              Save Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
