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
  RotateCcw,
  Sparkles,
  Layers,
  Globe,
  Award,
  Compass,
  ArrowRight,
  Eye,
  CreditCard,
  Package
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { useToast } from '../context/ToastContext';
import { storefrontSettings } from '../data/initialData';

export const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [settings, setSettings] = useState(() => ({
    ...storefrontSettings
  }));

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings()
      .then((data) => {
        setSettings(prev => ({ ...prev, ...data }));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching settings:', err);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await settingsService.updateSettings(settings);
      setSettings(updated);
      toast.success('Storefront & website settings saved successfully!');
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset storefront settings and website content to original Highlander Gold & Silver defaults?')) {
      settingsService.resetStoreData();
      setSettings({ ...storefrontSettings });
      toast.info('Settings restored to initial factory defaults. Refreshing...');
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Settings', icon: Layers },
    { id: 'identity', label: 'Storefront Identity', icon: Building },
    { id: 'difference', label: 'Difference Highlights', icon: Sparkles },
    { id: 'guarantee', label: 'Sold Value Guarantee', icon: ShieldCheck },
    { id: 'heritage', label: 'Heritage & Depository', icon: Compass }
  ];

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 flex items-center gap-2.5">
            Storefront & Website Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage business metadata, settlement terms, homepage philosophy cards, guarantee promises, and depository narrative.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold font-sans uppercase tracking-wider text-white bg-[#0B2B4E] hover:bg-[#114275] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-[#C9A23A]" />
          )}
          Save All Settings
        </button>
      </div>

      {/* Navigation Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/70 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#0B2B4E] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C9A23A]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ========================================================================= */}
        {/* 1. STOREFRONT IDENTITY & CONTACT */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'identity') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-sm font-bold font-sans text-slate-900">
                  Storefront Identity & Contact Information
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-medium">Identity & Physical Presence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={settings.business_name || ''}
                  onChange={(e) => handleChange('business_name', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Storefront Address
                </label>
                <input
                  type="text"
                  value={settings.street || ''}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={settings.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={settings.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={settings.zip || ''}
                    onChange={(e) => handleChange('zip', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Telephone (Display Formatted)
                </label>
                <input
                  type="text"
                  value={settings.phone_formatted || ''}
                  onChange={(e) => handleChange('phone_formatted', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Storefront Support Email
                </label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Operating Hours / Depository Schedule
                </label>
                <input
                  type="text"
                  value={settings.operating_hours || ''}
                  onChange={(e) => handleChange('operating_hours', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>
            </div>

            {/* Financial & Settlement Terms */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C9A23A]" />
                <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-800">
                  Settlement & Buyer's Premium Terms
                </h4>
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
                    value={settings.buyers_premium_percent ?? 0.15}
                    onChange={(e) => handleChange('buyers_premium_percent', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Applied automatically across all catalog hammer prices ({Math.round((settings.buyers_premium_percent || 0.15) * 100)}%).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    PayPal Me Storefront URL
                  </label>
                  <input
                    type="text"
                    value={settings.paypal_url || ''}
                    onChange={(e) => handleChange('paypal_url', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Bank Wire Instructions & Settlement Details
                  </label>
                  <textarea
                    rows="2"
                    value={settings.bank_wire_instructions || ''}
                    onChange={(e) => handleChange('bank_wire_instructions', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. THE HIGHLANDER DIFFERENCE / STOREFRONT HIGHLIGHTS (IMAGE 2) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'difference') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-sm font-bold font-sans text-slate-900">
                  Website Section: The Highlander Difference & Highlights
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#C9A23A] bg-[#C9A23A]/10 px-2 py-0.5 rounded font-semibold">
                Homepage Model Section
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Customize the section header, subtitle, and the 4 highlight value cards shown on the website homepage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Section Eyebrow Subtitle
                </label>
                <input
                  type="text"
                  value={settings.difference_eyebrow || ''}
                  onChange={(e) => handleChange('difference_eyebrow', e.target.value)}
                  placeholder="The Highlander Difference · Bigfork, Montana"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Section Main Headline
                </label>
                <input
                  type="text"
                  value={settings.difference_title || ''}
                  onChange={(e) => handleChange('difference_title', e.target.value)}
                  placeholder="A Dedicated Storefront for Numismatic Collectors"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Section Overview Narrative / Subtitle
                </label>
                <textarea
                  rows="2"
                  value={settings.difference_subtitle || ''}
                  onChange={(e) => handleChange('difference_subtitle', e.target.value)}
                  placeholder="We operate as a direct storefront rather than an auction house..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>
            </div>

            {/* 4 Feature Cards */}
            <div className="pt-2">
              <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-800 mb-3">
                The 4 Value Highlight Cards
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-sans">
                    <CreditCard className="w-3.5 h-3.5 text-[#0B2B4E]" />
                    <span>Card 1: Direct Purchase</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.card1_title || ''}
                      onChange={(e) => handleChange('card1_title', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                    <textarea
                      rows="2"
                      value={settings.card1_desc || ''}
                      onChange={(e) => handleChange('card1_desc', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Card 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B2B4E]" />
                    <span>Card 2: Value Guarantee</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.card2_title || ''}
                      onChange={(e) => handleChange('card2_title', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                    <textarea
                      rows="2"
                      value={settings.card2_desc || ''}
                      onChange={(e) => handleChange('card2_desc', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Card 3 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-sans">
                    <Package className="w-3.5 h-3.5 text-[#0B2B4E]" />
                    <span>Card 3: Insured Delivery</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.card3_title || ''}
                      onChange={(e) => handleChange('card3_title', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                    <textarea
                      rows="2"
                      value={settings.card3_desc || ''}
                      onChange={(e) => handleChange('card3_desc', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* Card 4 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-sans">
                    <Check className="w-3.5 h-3.5 text-[#0B2B4E]" />
                    <span>Card 4: Montana Sales Tax</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.card4_title || ''}
                      onChange={(e) => handleChange('card4_title', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                    <textarea
                      rows="2"
                      value={settings.card4_desc || ''}
                      onChange={(e) => handleChange('card4_desc', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Visual Preview of Difference Section */}
            <div className="mt-4 p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-[#E9E4DC] pb-2">
                <span className="flex items-center gap-1.5 text-[#C9A23A]">
                  <Eye className="w-3.5 h-3.5" />
                  Live Storefront Preview
                </span>
                <span className="text-[11px] uppercase tracking-wider font-mono">Storefront Look</span>
              </div>

              <div className="text-center max-w-2xl mx-auto space-y-2 py-2">
                <p className="text-[11px] uppercase tracking-widest text-[#C9A23A] font-bold">
                  — {settings.difference_eyebrow || 'THE HIGHLANDER DIFFERENCE'} —
                </p>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#0B2B4E]">
                  {settings.difference_title || 'A Dedicated Storefront for Numismatic Collectors'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {settings.difference_subtitle}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs text-center space-y-1">
                  <CreditCard className="w-4 h-4 mx-auto text-[#0B2B4E]" />
                  <p className="text-[11px] font-bold font-serif text-[#0B2B4E] uppercase">{settings.card1_title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-3">{settings.card1_desc}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs text-center space-y-1">
                  <ShieldCheck className="w-4 h-4 mx-auto text-[#0B2B4E]" />
                  <p className="text-[11px] font-bold font-serif text-[#0B2B4E] uppercase">{settings.card2_title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-3">{settings.card2_desc}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs text-center space-y-1">
                  <Package className="w-4 h-4 mx-auto text-[#0B2B4E]" />
                  <p className="text-[11px] font-bold font-serif text-[#0B2B4E] uppercase">{settings.card3_title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-3">{settings.card3_desc}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs text-center space-y-1">
                  <Check className="w-4 h-4 mx-auto text-[#0B2B4E]" />
                  <p className="text-[11px] font-bold font-serif text-[#0B2B4E] uppercase">{settings.card4_title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-3">{settings.card4_desc}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SOLD VALUE GUARANTEE & AUTHENTICITY PROMISE (IMAGE 3) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'guarantee') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-sm font-bold font-sans text-slate-900">
                  Website Section: The Highlander Sold Value Guarantee
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#C9A23A] bg-[#C9A23A]/10 px-2 py-0.5 rounded font-semibold">
                Authenticity & Promise Callout
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Configure the guarantee banner heading, quality description, customer refund promise, and trust badges.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Badge / Eyebrow Text
                </label>
                <input
                  type="text"
                  value={settings.guarantee_badge || ''}
                  onChange={(e) => handleChange('guarantee_badge', e.target.value)}
                  placeholder="Authentic Value & Authenticity Promise"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Guarantee Section Title
                </label>
                <input
                  type="text"
                  value={settings.guarantee_title || ''}
                  onChange={(e) => handleChange('guarantee_title', e.target.value)}
                  placeholder="The Highlander Sold Value Guarantee"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Numismatic Standard & Curation Narrative
                </label>
                <textarea
                  rows="2"
                  value={settings.guarantee_desc || ''}
                  onChange={(e) => handleChange('guarantee_desc', e.target.value)}
                  placeholder="Highlander Gold & Silver hand-selects coins and precious metals for superior eye appeal..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Our Direct Promise Text (Refund & Market Value Integrity)
                </label>
                <textarea
                  rows="3"
                  value={settings.guarantee_promise_text || ''}
                  onChange={(e) => handleChange('guarantee_promise_text', e.target.value)}
                  placeholder="If at any time a customer proves that a piece they purchased was overpriced based on its current market state..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>
            </div>

            {/* Guarantee Trust Badges */}
            <div className="pt-2">
              <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-800 mb-2">
                The 4 Authenticity Badges
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 1</label>
                  <input
                    type="text"
                    value={settings.guarantee_badge_1 || ''}
                    onChange={(e) => handleChange('guarantee_badge_1', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 2</label>
                  <input
                    type="text"
                    value={settings.guarantee_badge_2 || ''}
                    onChange={(e) => handleChange('guarantee_badge_2', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 3</label>
                  <input
                    type="text"
                    value={settings.guarantee_badge_3 || ''}
                    onChange={(e) => handleChange('guarantee_badge_3', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge 4</label>
                  <input
                    type="text"
                    value={settings.guarantee_badge_4 || ''}
                    onChange={(e) => handleChange('guarantee_badge_4', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Live Visual Preview of Guarantee Card */}
            <div className="mt-4 p-6 rounded-2xl bg-white border-l-4 border-l-[#C9A23A] border-y border-r border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C9A23A]">
                <ShieldCheck className="w-4 h-4" />
                <span>{settings.guarantee_badge || 'AUTHENTIC VALUE & AUTHENTICITY PROMISE'}</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#0B2B4E]">
                {settings.guarantee_title || 'THE HIGHLANDER SOLD VALUE GUARANTEE'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {settings.guarantee_desc}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <strong className="text-slate-900">Our Direct Promise:</strong> {settings.guarantee_promise_text}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {[settings.guarantee_badge_1, settings.guarantee_badge_2, settings.guarantee_badge_3, settings.guarantee_badge_4].filter(Boolean).map((badge, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8F7220] bg-[#FAF3E0] px-2.5 py-1 rounded-md border border-[#E9DCB8]">
                    <Check className="w-3 h-3 text-[#C9A23A]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. HERITAGE & DEPOSITORY BANNER (IMAGE 4) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'heritage') && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#C9A23A]" />
                <h3 className="text-sm font-bold font-sans text-slate-900">
                  Website Section: Heritage & Physical Depository Banner
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#C9A23A] bg-[#C9A23A]/10 px-2 py-0.5 rounded font-semibold">
                Homepage Location Callout
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Update the headline, depository narrative text, and action buttons for the Bigfork heritage banner.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Banner Headline
                </label>
                <input
                  type="text"
                  value={settings.heritage_title || ''}
                  onChange={(e) => handleChange('heritage_title', e.target.value)}
                  placeholder="Rooted in Flathead Valley Numismatic Tradition"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Depository & Physical Location Narrative
                </label>
                <textarea
                  rows="3"
                  value={settings.heritage_desc || ''}
                  onChange={(e) => handleChange('heritage_desc', e.target.value)}
                  placeholder="Operating from our physical location at 119 Jewel Basin Ct. B3 in Bigfork, Montana..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={settings.heritage_btn_primary || ''}
                  onChange={(e) => handleChange('heritage_btn_primary', e.target.value)}
                  placeholder="Learn About Our Storefront"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Secondary Button Text
                </label>
                <input
                  type="text"
                  value={settings.heritage_btn_secondary || ''}
                  onChange={(e) => handleChange('heritage_btn_secondary', e.target.value)}
                  placeholder="Contact Our Team"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2B4E]"
                />
              </div>
            </div>

            {/* Live Visual Preview of Heritage Card */}
            <div className="mt-4 p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-lg font-serif font-bold text-[#0B2B4E] uppercase tracking-wide">
                {settings.heritage_title || 'ROOTED IN FLATHEAD VALLEY NUMISMATIC TRADITION'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                {settings.heritage_desc}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#C9A23A] text-slate-950 shadow-sm"
                >
                  <span>{settings.heritage_btn_primary || 'Learn About Our Storefront'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-300 text-slate-800 bg-white shadow-xs"
                >
                  {settings.heritage_btn_secondary || 'Contact Our Team'}
                </button>
              </div>
            </div>
          </div>
        )}

        
        {/* Global Bottom Actions Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Storefront Seed Data
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold font-sans uppercase tracking-wider text-white bg-[#0B2B4E] hover:bg-[#114275] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 self-end sm:self-auto"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-[#C9A23A]" />
            )}
            Save Storefront Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
