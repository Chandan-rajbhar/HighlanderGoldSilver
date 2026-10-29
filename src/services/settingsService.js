import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { storefrontSettings } from '../data/initialData';

// Supabase public.store_settings schema whitelist
const DB_STORE_SETTINGS_COLUMNS = [
  'id',
  'business_name',
  'tagline',
  'street',
  'city',
  'state',
  'zip',
  'phone',
  'phone_formatted',
  'email',
  'paypal_url',
  'buyers_premium_percent',
  'operating_hours',
  'bank_wire_instructions',
  'updated_at'
];

function sanitizeStoreSettingsPayload(data) {
  const sanitized = {};
  for (const col of DB_STORE_SETTINGS_COLUMNS) {
    if (data[col] !== undefined) {
      sanitized[col] = data[col];
    }
  }
  return sanitized;
}

export const settingsService = {
  async getSettings() {
    const local = localDB.getSettings();
    // Ensure all default fields exist if local was stored before these fields were added
    const base = { ...storefrontSettings, ...local };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .single();
        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase getSettings query note:', error.message);
        } else if (data) {
          const merged = { ...base, ...data };
          localDB.setSettings(merged);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase getSettings fallback to local storage:', err.message);
      }
    }
    return base;
  },

  async updateSettings(settingsData) {
    const current = await this.getSettings();
    const updated = { ...current, ...settingsData };

    // Always update local database with full schema including website sections
    localDB.setSettings(updated);

    // Notify any active UI listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hgs:settings-updated', { detail: updated }));
    }

    if (isSupabaseConfigured()) {
      try {
        const payload = sanitizeStoreSettingsPayload(updated);
        const { data, error } = await supabase
          .from('store_settings')
          .upsert([{ id: 'current', ...payload, updated_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) {
          console.warn('Supabase store_settings upsert warning:', error.message);
        } else if (data) {
          return { ...updated, ...data };
        }
      } catch (err) {
        console.warn('Supabase updateSettings fallback to local storage:', err.message);
      }
    }
    return updated;
  },

  getActiveStorefrontContent() {
    return { ...storefrontSettings, ...localDB.getSettings() };
  },

  getSpotPrices() {
    return localDB.getSpotPrices();
  },

  updateSpotPrices(spots) {
    localDB.setSpotPrices(spots);
    return spots;
  },

  resetStoreData() {
    localDB.resetAll();
    return true;
  }
};

export default settingsService;
