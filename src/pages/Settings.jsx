import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Award,
  Layers,
  Phone,
  Check,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Clock,
  MapPin,
  Mail,
  DollarSign,
  Building,
  Sparkles,
  ShieldCheck,
  CreditCard,
  FileText,
  Loader2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { settingsService } from '../services/settingsService';
import { useToast } from '../context/ToastContext';
import { SettingsImageUploadCard } from '../components/settings/SettingsImageUploadCard';

// =============================================================================
// SUB-COMPONENT: CLEAN SECTION HEADER
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
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
    {badge && (
      <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-[#071A35]/5 text-[#071A35] border border-[#071A35]/10 font-sans">
        {badge}
      </span>
    )}
  </div>
);

// =============================================================================
// SUB-COMPONENT: DYNAMIC FORM INPUT
// =============================================================================
const FormInput = ({ label, value, onChange, placeholder, type = 'text', helper, icon: Icon, required = false }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-700 tracking-wide">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10.5 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all`}
      />
    </div>
    {helper && <p className="text-[11px] text-slate-400 leading-normal">{helper}</p>}
  </div>
);

// =============================================================================
// SUB-COMPONENT: DYNAMIC FORM TEXTAREA
// =============================================================================
const FormTextarea = ({ label, value, onChange, placeholder, rows = 3, helper, required = false }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-700 tracking-wide">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <textarea
      rows={rows}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#071A35] focus:ring-2 focus:ring-[#071A35]/10 transition-all leading-relaxed"
    />
    {helper && <p className="text-[11px] text-slate-400 leading-normal">{helper}</p>}
  </div>
);

// =============================================================================
// MAIN COMPONENT: SETTINGS (EXACTLY 4 DYNAMIC SECTIONS: HOME, ABOUT, COLLECTION, CONTACT)
// =============================================================================
export const Settings = () => {
  const { toast } = useToast();

  // ONLY 4 SECTIONS AS EXPLICITLY REQUESTED
  const [activeTab, setActiveTab] = useState('home');

  // Dynamic state loaded strictly from database
  const [sectionsData, setSectionsData] = useState({
    home: {},
    about: {},
    collection: {},
    contact: {}
  });

  const [savedSectionsData, setSavedSectionsData] = useState({
    home: {},
    about: {},
    collection: {},
    contact: {}
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Maps section key to database store_settings row ID
  const tabToRowId = {
    home: 'current',
    about: 'about',
    collection: 'collection',
    contact: 'contact'
  };

  const activeRowId = tabToRowId[activeTab] || 'current';

  // Load all 4 rows directly from Supabase store_settings table
  useEffect(() => {
    let isMounted = true;

    const loadDynamicSettings = async () => {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase
            .from('store_settings')
            .select('*');

          if (error) {
            console.error('Error querying store_settings from database:', error);
            throw error;
          }

          if (data && isMounted) {
            const mapped = {
              home: {},
              about: {},
              collection: {},
              contact: {}
            };

            data.forEach(row => {
              if (row.id === 'current') mapped.home = { ...row };
              else if (row.id === 'about') mapped.about = { ...row };
              else if (row.id === 'collection') mapped.collection = { ...row };
              else if (row.id === 'contact') mapped.contact = { ...row };
            });

            setSectionsData(mapped);
            setSavedSectionsData(JSON.parse(JSON.stringify(mapped)));
          }
        } else {
          // Local fallback if Supabase not configured
          const allLocal = await settingsService.getAllSections();
          if (isMounted) {
            const mapped = {
              home: allLocal.current || allLocal.home || {},
              about: allLocal.about || {},
              collection: allLocal.collection || {},
              contact: allLocal.contact || {}
            };
            setSectionsData(mapped);
            setSavedSectionsData(JSON.parse(JSON.stringify(mapped)));
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast.error('Failed to load settings from database.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDynamicSettings();

    return () => { isMounted = false; };
  }, [toast]);

  // Handle dynamic field changes for the current section
  const handleFieldChange = (field, value) => {
    setSectionsData(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  // Check if current active section has unsaved changes
  const hasActiveTabUnsavedChanges = useMemo(() => {
    return JSON.stringify(sectionsData[activeTab]) !== JSON.stringify(savedSectionsData[activeTab]);
  }, [sectionsData, savedSectionsData, activeTab]);

  // Check if any section has unsaved changes
  const hasAnyUnsavedChanges = useMemo(() => {
    return JSON.stringify(sectionsData) !== JSON.stringify(savedSectionsData);
  }, [sectionsData, savedSectionsData]);

  // Discard changes in active section
  const handleDiscard = () => {
    setSectionsData(prev => ({
      ...prev,
      [activeTab]: { ...savedSectionsData[activeTab] }
    }));
    toast.info(`Unsaved changes for ${activeTab.toUpperCase()} discarded.`);
  };

  // Save changes to the specific row in Supabase store_settings table
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);

    try {
      const payload = sectionsData[activeTab];
      const targetRow = tabToRowId[activeTab];

      const updated = await settingsService.updateSettings(payload, targetRow);

      setSectionsData(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], ...updated }
      }));
      setSavedSectionsData(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], ...updated }
      }));

      const sectionNames = {
        home: 'Home Page',
        about: 'About Page',
        collection: 'Collection Page',
        contact: 'Contact Page'
      };

      toast.success(`${sectionNames[activeTab]} settings successfully saved in database!`);
    } catch (err) {
      console.error('Error saving settings to database:', err);
      toast.error('Failed to save settings. Please check your network connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reload data from database for current section
  const handleReloadFromDatabase = async () => {
    try {
      const fresh = await settingsService.getSettings(activeRowId);
      setSectionsData(prev => ({ ...prev, [activeTab]: fresh }));
      setSavedSectionsData(prev => ({ ...prev, [activeTab]: fresh }));
      toast.success(`Reloaded latest ${activeTab.toUpperCase()} data from database.`);
    } catch (err) {
      toast.error('Failed to reload data from database.');
    }
  };

  // ONLY 4 SECTIONS
  const navItems = [
    {
      id: 'home',
      title: 'Home',
      description: 'Atmosphere visuals, emblem & homepage content',
      icon: Home
    },
    {
      id: 'about',
      title: 'About',
      description: 'Company heritage, inspection photo & 3 pillars',
      icon: Award
    },
    {
      id: 'collection',
      title: 'Collection',
      description: 'Showcase titles, badges & metals image',
      icon: Layers
    },
    {
      id: 'contact',
      title: 'Contact',
      description: 'Showroom specs, hotline & consultation artwork',
      icon: Phone
    }
  ];

  const currentHome = sectionsData.home || {};
  const currentAbout = sectionsData.about || {};
  const currentCollection = sectionsData.collection || {};
  const currentContact = sectionsData.contact || {};

  if (isLoading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <Loader2 className="w-8 h-8 text-[#C9A23A] animate-spin" />
        <p className="text-sm font-semibold text-slate-800">Loading storefront settings from database...</p>
        <span className="text-xs text-slate-400">Fetching live rows from store_settings</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24">
      {/* ===================================================================== */}
      {/* 1. CLEAN & PROFESSIONAL PAGE HEADER */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 tracking-tight">
                Storefront Settings
              </h1>
              {hasActiveTabUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved Changes ({activeTab.toUpperCase()})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Synchronized with Database
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Dynamically manage all four storefront pages (Home, About, Collection, and Contact).
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            {hasActiveTabUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
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
              <span>{isSaving ? 'Saving...' : `Save ${activeTab.toUpperCase()} Changes`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE (FOUR SECTIONS ONLY) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ----------------------------------------------------------------- */}
        {/* LEFT COLUMN: FOUR SECTIONS NAVIGATION */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">

          {/* Desktop Navigation Card */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
            <div className="px-3 py-2 border-b border-slate-100 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Storefront Sections (4)
              </span>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isItemModified = JSON.stringify(sectionsData[item.id]) !== JSON.stringify(savedSectionsData[item.id]);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer group ${isActive
                        ? 'bg-[#071A35] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isActive
                        ? 'bg-white/10 text-[#C9A23A]'
                        : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                      }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {item.title}
                        </span>
                        {isItemModified && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 ml-1" title="Unsaved changes" />
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 truncate leading-tight ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Horizontal Navigation Tabs */}
          <div className="lg:hidden bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${isActive
                        ? 'bg-[#071A35] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#C9A23A]' : 'text-slate-400'}`} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Database Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Database Status</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                CONNECTED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              All settings load dynamically from and persist to <code className="font-mono text-[#071A35]">store_settings</code>.
            </p>
            <button
              type="button"
              onClick={handleReloadFromDatabase}
              className="w-full pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reload Current Section from DB</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* RIGHT COLUMN: DYNAMIC SECTION CONTENT */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          {/* =============================================================== */}
          {/* SECTION 1: HOME PAGE */}
          {/* =============================================================== */}
          {activeTab === 'home' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in duration-200">
              <SectionHeader
                icon={Home}
                title="Home Page Settings"
                description="Manage storefront brand emblem, atmospheric hero visuals, identity coordinates, settlement terms, and homepage storytelling."
                badge="Home"
              />

              {/* Visual Assets & Brand Emblem */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Brand Imagery & Atmospheric Visuals
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SettingsImageUploadCard
                    label="Storefront Brand Emblem / Logo"
                    description="Emblem displayed at the top of the home page and header."
                    recommended="Transparent PNG • Max 15MB"
                    value={currentHome.hero_logo}
                    onChange={(url) => handleFieldChange('hero_logo', url)}
                    aspectClass="h-44"
                    darkPreview={true}
                  />

                  <SettingsImageUploadCard
                    label="Atmospheric Hero Background"
                    description="Mountain visual behind the home hero section."
                    recommended="16:9 • 1920 × 1080 px • Max 15MB"
                    value={currentHome.hero_background}
                    onChange={(url) => handleFieldChange('hero_background', url)}
                    aspectClass="h-44"
                  />
                </div>
              </div>

              {/* Storefront Identity */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Storefront Business Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Business Name"
                    value={currentHome.business_name}
                    onChange={(val) => handleFieldChange('business_name', val)}
                    placeholder="Highlander Gold & Silver"
                  />
                  <FormInput
                    label="Tagline / Business Subtitle"
                    value={currentHome.tagline}
                    onChange={(val) => handleFieldChange('tagline', val)}
                    placeholder="Rare Coins, Bullion & Precious Metals Marketplace"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <FormInput
                      label="Physical Street Address"
                      value={currentHome.street}
                      onChange={(val) => handleFieldChange('street', val)}
                      placeholder="119 Jewel Basin Ct. B3"
                      icon={MapPin}
                    />
                  </div>
                  <FormInput
                    label="City"
                    value={currentHome.city}
                    onChange={(val) => handleFieldChange('city', val)}
                    placeholder="Bigfork"
                  />
                  <FormInput
                    label="State"
                    value={currentHome.state}
                    onChange={(val) => handleFieldChange('state', val)}
                    placeholder="MT"
                  />
                  <FormInput
                    label="Postal / Zip Code"
                    value={currentHome.zip}
                    onChange={(val) => handleFieldChange('zip', val)}
                    placeholder="59911"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Storefront Telephone (Formatted)"
                    value={currentHome.phone_formatted}
                    onChange={(val) => handleFieldChange('phone_formatted', val)}
                    placeholder="(406) 407-0281"
                    icon={Phone}
                  />
                  <FormInput
                    label="Storefront Support Email"
                    value={currentHome.email}
                    onChange={(val) => handleFieldChange('email', val)}
                    placeholder="Stratford1955@icloud.com"
                    icon={Mail}
                  />
                </div>

                <FormInput
                  label="Operating Hours & Depository Schedule"
                  value={currentHome.operating_hours}
                  onChange={(val) => handleFieldChange('operating_hours', val)}
                  placeholder="Online Storefront 24/7 | Vault By Appointment"
                  icon={Clock}
                />
              </div>

              {/* Settlement Terms */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Settlement & Buyer Terms
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Buyer's Premium Rate"
                    type="number"
                    step="0.01"
                    value={currentHome.buyers_premium_percent}
                    onChange={(val) => handleFieldChange('buyers_premium_percent', parseFloat(val) || 0)}
                    placeholder="0.15"
                    icon={DollarSign}
                  />
                  <FormInput
                    label="PayPal / Direct Payment Portal URL"
                    value={currentHome.paypal_url}
                    onChange={(val) => handleFieldChange('paypal_url', val)}
                    placeholder="https://paypal.me/HighlanderGoldSilver"
                    icon={ExternalLink}
                  />
                </div>
                <FormTextarea
                  label="Bank Wire Settlement Instructions"
                  rows={3}
                  value={currentHome.bank_wire_instructions}
                  onChange={(val) => handleFieldChange('bank_wire_instructions', val)}
                  placeholder="Bank wire settlement instructions..."
                />
              </div>

              {/* Homepage Storytelling */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Difference Highlights & Storytelling
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Section Eyebrow"
                    value={currentHome.difference_eyebrow}
                    onChange={(val) => handleFieldChange('difference_eyebrow', val)}
                  />
                  <FormInput
                    label="Main Headline"
                    value={currentHome.difference_title}
                    onChange={(val) => handleFieldChange('difference_title', val)}
                  />
                  <FormInput
                    label="Highlight 1"
                    value={currentHome.card1_title}
                    onChange={(val) => handleFieldChange('card1_title', val)}
                  />
                  <FormInput
                    label="Highlight 2"
                    value={currentHome.card2_title}
                    onChange={(val) => handleFieldChange('card2_title', val)}
                  />
                  <FormInput
                    label="Highlight 3"
                    value={currentHome.card3_title}
                    onChange={(val) => handleFieldChange('card3_title', val)}
                  />
                  <FormInput
                    label="Highlight 4"
                    value={currentHome.card4_title}
                    onChange={(val) => handleFieldChange('card4_title', val)}
                  />
                </div>
              </div>

              {/* Guarantee & Depository */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sold Value Guarantee & Depository Heritage
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Guarantee Title"
                    value={currentHome.guarantee_title}
                    onChange={(val) => handleFieldChange('guarantee_title', val)}
                  />
                  <FormInput
                    label="Guarantee Badge"
                    value={currentHome.guarantee_badge}
                    onChange={(val) => handleFieldChange('guarantee_badge', val)}
                  />
                  <FormInput
                    label="Heritage Headline"
                    value={currentHome.heritage_title}
                    onChange={(val) => handleFieldChange('heritage_title', val)}
                  />
                  <FormInput
                    label="Primary Button Label"
                    value={currentHome.heritage_btn_primary}
                    onChange={(val) => handleFieldChange('heritage_btn_primary', val)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 2: ABOUT PAGE */}
          {/* =============================================================== */}
          {activeTab === 'about' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in duration-200">
              <SectionHeader
                icon={Award}
                title="About Page Settings"
                description="Manage the company heritage narrative, historical background descriptions, the 3 numismatic excellence pillars, and the hand-selected inspection photograph."
                badge="About"
              />

              {/* Inspection Photo Upload */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Hand-Selected Inspection Photograph
                </h4>
                <SettingsImageUploadCard
                  label="Inspection & Heritage Photograph"
                  description="High-resolution numismatic inspection photograph displayed on the about page narrative."
                  recommended="3:2 • 1200 × 800 px • Max 15MB"
                  value={currentAbout.hero_image}
                  onChange={(url) => handleFieldChange('hero_image', url)}
                  aspectClass="h-52 sm:h-64"
                />
              </div>

              {/* Company Heritage Story */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Company Heritage Narrative
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Main Heritage Headline"
                    value={currentAbout.heritage_title}
                    onChange={(val) => handleFieldChange('heritage_title', val)}
                  />
                  <FormInput
                    label="Heritage Location / Subtitle"
                    value={currentAbout.heritage_desc}
                    onChange={(val) => handleFieldChange('heritage_desc', val)}
                  />
                  <div className="sm:col-span-2">
                    <FormInput
                      label="Narrative Headline"
                      value={currentAbout.difference_title}
                      onChange={(val) => handleFieldChange('difference_title', val)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Historical Background Description"
                      rows={3}
                      value={currentAbout.difference_subtitle}
                      onChange={(val) => handleFieldChange('difference_subtitle', val)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Storefront Problem Statement & Founding Model"
                      rows={4}
                      value={currentAbout.operating_hours}
                      onChange={(val) => handleFieldChange('operating_hours', val)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Storefront Inspection & Operational Description"
                      rows={5}
                      value={currentAbout.bank_wire_instructions}
                      onChange={(val) => handleFieldChange('bank_wire_instructions', val)}
                    />
                  </div>
                  <FormInput
                    label="Explore Inventory Button Label"
                    value={currentAbout.heritage_btn_primary}
                    onChange={(val) => handleFieldChange('heritage_btn_primary', val)}
                  />
                  <FormInput
                    label="Contact Button Label"
                    value={currentAbout.heritage_btn_secondary}
                    onChange={(val) => handleFieldChange('heritage_btn_secondary', val)}
                  />
                </div>
              </div>

              {/* Three Pillars of Numismatic Excellence */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  The Three Core Standards of Numismatic Excellence
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Standards Section Title"
                    value={currentAbout.card4_title}
                    onChange={(val) => handleFieldChange('card4_title', val)}
                  />
                  <FormInput
                    label="Standards Section Subtitle"
                    value={currentAbout.card4_desc}
                    onChange={(val) => handleFieldChange('card4_desc', val)}
                  />
                </div>

                <div className="space-y-4">
                  {/* Pillar 1 */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                    <span className="text-xs font-bold text-[#071A35]">Standard 1: Hand-Selected Eye Appeal</span>
                    <FormInput
                      label="Standard Title"
                      value={currentAbout.card1_title}
                      onChange={(val) => handleFieldChange('card1_title', val)}
                    />
                    <FormTextarea
                      label="Standard Description"
                      rows={3}
                      value={currentAbout.card1_desc}
                      onChange={(val) => handleFieldChange('card1_desc', val)}
                    />
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                    <span className="text-xs font-bold text-[#071A35]">Standard 2: Certified Grading & Authenticity</span>
                    <FormInput
                      label="Standard Title"
                      value={currentAbout.card2_title}
                      onChange={(val) => handleFieldChange('card2_title', val)}
                    />
                    <FormTextarea
                      label="Standard Description"
                      rows={3}
                      value={currentAbout.card2_desc}
                      onChange={(val) => handleFieldChange('card2_desc', val)}
                    />
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                    <span className="text-xs font-bold text-[#071A35]">Standard 3: Precious Metal Integrity</span>
                    <FormInput
                      label="Standard Title"
                      value={currentAbout.card3_title}
                      onChange={(val) => handleFieldChange('card3_title', val)}
                    />
                    <FormTextarea
                      label="Standard Description"
                      rows={3}
                      value={currentAbout.card3_desc}
                      onChange={(val) => handleFieldChange('card3_desc', val)}
                    />
                  </div>
                </div>
              </div>

              {/* Full Market Value Guarantee & Terms */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Full Market Value Guarantee & Quality Badges
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Guarantee Badge"
                    value={currentAbout.guarantee_badge}
                    onChange={(val) => handleFieldChange('guarantee_badge', val)}
                  />
                  <FormInput
                    label="Guarantee Headline"
                    value={currentAbout.guarantee_title}
                    onChange={(val) => handleFieldChange('guarantee_title', val)}
                  />
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Fair Market Value Protection Promise"
                      rows={3}
                      value={currentAbout.guarantee_desc}
                      onChange={(val) => handleFieldChange('guarantee_desc', val)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="In-House Insured Packaging Promise"
                      rows={3}
                      value={currentAbout.guarantee_promise_prefix}
                      onChange={(val) => handleFieldChange('guarantee_promise_prefix', val)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Montana 0% Sales Tax Advantage"
                      rows={3}
                      value={currentAbout.guarantee_promise_text}
                      onChange={(val) => handleFieldChange('guarantee_promise_text', val)}
                    />
                  </div>
                  <FormInput
                    label="Pillar Badge 1"
                    value={currentAbout.guarantee_badge_1}
                    onChange={(val) => handleFieldChange('guarantee_badge_1', val)}
                  />
                  <FormInput
                    label="Pillar Badge 2"
                    value={currentAbout.guarantee_badge_2}
                    onChange={(val) => handleFieldChange('guarantee_badge_2', val)}
                  />
                  <FormInput
                    label="Pillar Badge 3"
                    value={currentAbout.guarantee_badge_3}
                    onChange={(val) => handleFieldChange('guarantee_badge_3', val)}
                  />
                  <FormInput
                    label="Summary Trust Line"
                    value={currentAbout.guarantee_badge_4}
                    onChange={(val) => handleFieldChange('guarantee_badge_4', val)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 3: COLLECTION PAGE */}
          {/* =============================================================== */}
          {activeTab === 'collection' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in duration-200">
              <SectionHeader
                icon={Layers}
                title="Collection Page Settings"
                description="Manage main titles, introductory descriptions, quality guarantee statements, promotional badges, and the featured precious metals showcase image."
                badge="Collection"
              />

              {/* Featured Showcase Artwork */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Featured Precious Metals Showcase Artwork
                </h4>
                <SettingsImageUploadCard
                  label="Showcase Artwork"
                  description="Curated precious metals showcase image featured on the collection page banner."
                  recommended="3:2 • 1200 × 800 px • Max 15MB"
                  value={currentCollection.hero_image}
                  onChange={(url) => handleFieldChange('hero_image', url)}
                  aspectClass="h-52 sm:h-64"
                />
              </div>

              {/* Collection Showcase Presentation */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Collection Presentation Titles & Descriptions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Collection Main Title"
                    value={currentCollection.difference_title}
                    onChange={(val) => handleFieldChange('difference_title', val)}
                  />
                  <FormInput
                    label="Vault Certification Header"
                    value={currentCollection.heritage_title}
                    onChange={(val) => handleFieldChange('heritage_title', val)}
                  />
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Introductory Description"
                      rows={3}
                      value={currentCollection.difference_subtitle}
                      onChange={(val) => handleFieldChange('difference_subtitle', val)}
                    />
                  </div>
                  <FormInput
                    label="Depository Location Tag"
                    value={currentCollection.heritage_desc}
                    onChange={(val) => handleFieldChange('heritage_desc', val)}
                  />
                </div>
              </div>

              {/* Guarantees & Badges */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quality Guarantee Statement & Promotional Badges
                </h4>
                <div className="space-y-4">
                  <FormInput
                    label="Guarantee Headline"
                    value={currentCollection.guarantee_title}
                    onChange={(val) => handleFieldChange('guarantee_title', val)}
                  />
                  <FormTextarea
                    label="Quality Guarantee Statement"
                    rows={3}
                    value={currentCollection.guarantee_desc}
                    onChange={(val) => handleFieldChange('guarantee_desc', val)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput
                      label="Promotional Badge 1"
                      value={currentCollection.card1_title}
                      onChange={(val) => handleFieldChange('card1_title', val)}
                    />
                    <FormInput
                      label="Promotional Badge 2"
                      value={currentCollection.card2_title}
                      onChange={(val) => handleFieldChange('card2_title', val)}
                    />
                    <FormInput
                      label="Promotional Badge 3"
                      value={currentCollection.card3_title}
                      onChange={(val) => handleFieldChange('card3_title', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* SECTION 4: CONTACT PAGE */}
          {/* =============================================================== */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in duration-200">
              <SectionHeader
                icon={Phone}
                title="Contact Page Settings"
                description="Manage inquiry headlines, private viewing consultation artwork, Montana showroom address, consultation hotline, state tax advantage, and insured packaging standards."
                badge="Contact"
              />

              {/* Consultation Artwork */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Private Viewing Consultation Artwork
                </h4>
                <SettingsImageUploadCard
                  label="Consultation Artwork"
                  description="Served through cloud storage to ensure fast, pristine viewing on the inquiry screen."
                  recommended="3:2 • 1200 × 800 px • Max 15MB"
                  value={currentContact.hero_image}
                  onChange={(url) => handleFieldChange('hero_image', url)}
                  aspectClass="h-52 sm:h-64"
                />
              </div>

              {/* Inquiry Overview */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Inquiry Headline & Overview Narrative
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormInput
                      label="Inquiry Headline"
                      value={currentContact.difference_title}
                      onChange={(val) => handleFieldChange('difference_title', val)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormTextarea
                      label="Overview Narrative"
                      rows={3}
                      value={currentContact.difference_subtitle}
                      onChange={(val) => handleFieldChange('difference_subtitle', val)}
                    />
                  </div>
                  <FormInput
                    label="Consultation Badge Title"
                    value={currentContact.heritage_title}
                    onChange={(val) => handleFieldChange('heritage_title', val)}
                  />
                  <FormInput
                    label="Consultation Badge Subtitle"
                    value={currentContact.heritage_desc}
                    onChange={(val) => handleFieldChange('heritage_desc', val)}
                  />
                  <FormInput
                    label="Quick Contact 1 (Phone Strip)"
                    value={currentContact.guarantee_badge_1}
                    onChange={(val) => handleFieldChange('guarantee_badge_1', val)}
                  />
                  <FormInput
                    label="Quick Contact 2 (Location Strip)"
                    value={currentContact.guarantee_badge_2}
                    onChange={(val) => handleFieldChange('guarantee_badge_2', val)}
                  />
                  <div className="sm:col-span-2">
                    <FormInput
                      label="Quick Contact 3 (Settlement Portal)"
                      value={currentContact.guarantee_badge_3}
                      onChange={(val) => handleFieldChange('guarantee_badge_3', val)}
                    />
                  </div>
                </div>
              </div>

              {/* Storefront Specifications Summary Card */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Storefront Specifications Card (Storefront at a Glance)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Card Title"
                    value={currentContact.tagline}
                    onChange={(val) => handleFieldChange('tagline', val)}
                  />
                  <FormInput
                    label="Header Badge"
                    value={currentContact.guarantee_badge}
                    onChange={(val) => handleFieldChange('guarantee_badge', val)}
                  />
                  <div className="sm:col-span-2">
                    <FormInput
                      label="Specifications Subtitle"
                      value={currentContact.operating_hours}
                      onChange={(val) => handleFieldChange('operating_hours', val)}
                    />
                  </div>

                  <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-[#071A35]">Specification 1: Montana Showroom Address</span>
                    <FormInput
                      label="Address Line"
                      value={currentContact.card1_title}
                      onChange={(val) => handleFieldChange('card1_title', val)}
                    />
                    <FormInput
                      label="Facility Detail"
                      value={currentContact.card1_desc}
                      onChange={(val) => handleFieldChange('card1_desc', val)}
                    />
                  </div>

                  <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-[#071A35]">Specification 2: Consultation Direct Line & Schedule</span>
                    <FormInput
                      label="Telephone Line"
                      value={currentContact.card2_title}
                      onChange={(val) => handleFieldChange('card2_title', val)}
                    />
                    <FormInput
                      label="Schedule Hours"
                      value={currentContact.card2_desc}
                      onChange={(val) => handleFieldChange('card2_desc', val)}
                    />
                  </div>

                  <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-[#071A35]">Specification 3: State Tax Advantages</span>
                    <FormInput
                      label="Tax Rate Advantage"
                      value={currentContact.card3_title}
                      onChange={(val) => handleFieldChange('card3_title', val)}
                    />
                    <FormInput
                      label="Exemption Detail"
                      value={currentContact.card3_desc}
                      onChange={(val) => handleFieldChange('card3_desc', val)}
                    />
                  </div>

                  <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-[#071A35]">Specification 4: Payment Terms & Settlement</span>
                    <FormInput
                      label="Payment Terms"
                      value={currentContact.card4_title}
                      onChange={(val) => handleFieldChange('card4_title', val)}
                    />
                    <FormInput
                      label="Settlement Protection Detail"
                      value={currentContact.card4_desc}
                      onChange={(val) => handleFieldChange('card4_desc', val)}
                    />
                  </div>

                  <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-[#071A35]">Specification 5: Insured Priority Packaging Standards</span>
                    <FormInput
                      label="Packaging Guarantee"
                      value={currentContact.guarantee_title}
                      onChange={(val) => handleFieldChange('guarantee_title', val)}
                    />
                    <FormInput
                      label="Tracking & Signature Detail"
                      value={currentContact.guarantee_desc}
                      onChange={(val) => handleFieldChange('guarantee_desc', val)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FormInput
                      label="Card Security Footer Badge"
                      value={currentContact.guarantee_promise_text}
                      onChange={(val) => handleFieldChange('guarantee_promise_text', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
