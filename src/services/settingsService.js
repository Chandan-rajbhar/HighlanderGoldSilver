import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { 
  storefrontSettings, 
  collectionStoreSettings, 
  aboutStoreSettings, 
  contactStoreSettings, 
  defaultAllStoreSettings 
} from '../data/initialData';

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
  'difference_eyebrow',
  'difference_title',
  'difference_subtitle',
  'card1_title',
  'card1_desc',
  'card2_title',
  'card2_desc',
  'card3_title',
  'card3_desc',
  'card4_title',
  'card4_desc',
  'guarantee_badge',
  'guarantee_title',
  'guarantee_desc',
  'guarantee_promise_prefix',
  'guarantee_promise_text',
  'guarantee_badge_1',
  'guarantee_badge_2',
  'guarantee_badge_3',
  'guarantee_badge_4',
  'heritage_title',
  'heritage_desc',
  'heritage_btn_primary',
  'heritage_btn_secondary',
  'hero_background',
  'hero_logo',
  'hero_image',
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

function getDefaultSection(sectionId) {
  const norm = sectionId === 'home' ? 'current' : sectionId;
  switch (norm) {
    case 'collection':
      return { ...collectionStoreSettings };
    case 'about':
      return { ...aboutStoreSettings };
    case 'contact':
      return { ...contactStoreSettings };
    case 'current':
    default:
      return { ...storefrontSettings };
  }
}

export const settingsService = {
  // Fetch a single section ('current'/'home', 'collection', 'about', 'contact')
  async getSettings(sectionId = 'current') {
    const normId = sectionId === 'home' ? 'current' : sectionId;
    const baseDefault = getDefaultSection(normId);
    const local = localDB.getSectionSettings(normId);
    const base = { ...baseDefault, ...(local || {}) };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', normId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn(`Supabase getSettings query note for ${normId}:`, error.message);
        } else if (data) {
          const merged = { ...base, ...data };
          localDB.setSectionSettings(normId, merged);
          return merged;
        }
      } catch (err) {
        console.warn(`Supabase getSettings fallback to local storage for ${normId}:`, err.message);
      }
    }
    return base;
  },

  // Fetch all 4 sections simultaneously
  async getAllSections() {
    const defaultAll = {
      home: { ...storefrontSettings },
      current: { ...storefrontSettings },
      collection: { ...collectionStoreSettings },
      about: { ...aboutStoreSettings },
      contact: { ...contactStoreSettings }
    };

    const localAll = localDB.getAllSectionSettings() || {};
    const mergedAll = {
      home: { ...defaultAll.home, ...(localAll.current || localAll.home || {}) },
      current: { ...defaultAll.current, ...(localAll.current || localAll.home || {}) },
      collection: { ...defaultAll.collection, ...(localAll.collection || {}) },
      about: { ...defaultAll.about, ...(localAll.about || {}) },
      contact: { ...defaultAll.contact, ...(localAll.contact || {}) }
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*');

        if (error) {
          console.warn('Supabase getAllSections query note:', error.message);
        } else if (data && data.length > 0) {
          data.forEach(row => {
            const rowId = row.id;
            if (rowId === 'current') {
              mergedAll.current = { ...mergedAll.current, ...row };
              mergedAll.home = { ...mergedAll.home, ...row };
            } else if (mergedAll[rowId]) {
              mergedAll[rowId] = { ...mergedAll[rowId], ...row };
            }
          });
          localDB.setAllSectionSettings(mergedAll);
          return mergedAll;
        }
      } catch (err) {
        console.warn('Supabase getAllSections fallback:', err.message);
      }
    }

    return mergedAll;
  },

  // Update a specific section in Supabase and local storage
  async updateSettings(settingsData, sectionId = 'current') {
    const normId = (sectionId === 'home' || !sectionId) ? 'current' : sectionId;
    const current = await this.getSettings(normId);
    const updated = { ...current, ...settingsData, id: normId };

    // Always update local database with full schema
    localDB.setSectionSettings(normId, updated);

    // Notify any active UI listeners across the app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hgs:settings-updated', { 
        detail: { 
          section: normId, 
          id: normId, 
          data: updated,
          ...updated 
        } 
      }));
    }

    if (isSupabaseConfigured()) {
      try {
        const payload = sanitizeStoreSettingsPayload(updated);
        
        // 1. Try update existing row
        let { data, error } = await supabase
          .from('store_settings')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', normId)
          .select()
          .maybeSingle();

        // 2. If update returned no row or failed, try upsert
        if (!data || error) {
          const upsertRes = await supabase
            .from('store_settings')
            .upsert([{ id: normId, ...payload, updated_at: new Date().toISOString() }])
            .select()
            .maybeSingle();

          if (upsertRes.data) {
            data = upsertRes.data;
            error = null;
          } else if (upsertRes.error && !error) {
            error = upsertRes.error;
          }
        }

        if (error) {
          console.warn(`Supabase store_settings update warning for ${normId}:`, error.message);
        } else if (data) {
          const result = { ...updated, ...data };
          localDB.setSectionSettings(normId, result);
          return result;
        }
      } catch (err) {
        console.warn(`Supabase updateSettings fallback to local storage for ${normId}:`, err.message);
      }
    }
    return updated;
  },

  getActiveStorefrontContent(sectionId = 'current') {
    const normId = sectionId === 'home' ? 'current' : sectionId;
    const baseDefault = getDefaultSection(normId);
    const local = localDB.getSectionSettings(normId);
    return { ...baseDefault, ...(local || {}) };
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
