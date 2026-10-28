import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

export const settingsService = {
  async getSettings() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) return data;
      } catch (err) {
        console.error('Supabase getSettings error:', err);
      }
    }
    return localDB.getSettings();
  },

  async updateSettings(settingsData) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .upsert([{ id: 'current', ...settingsData, updated_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase updateSettings error:', err);
        throw err;
      }
    }
    const current = localDB.getSettings();
    const updated = { ...current, ...settingsData };
    localDB.setSettings(updated);
    return updated;
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

