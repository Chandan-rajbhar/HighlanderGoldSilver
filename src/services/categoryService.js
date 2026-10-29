import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

const LIST_COLUMNS = 'id, name, slug, description, metal_type, item_count, total_valuation, is_active, display_order, created_at';

let _cachedCategories = null;

const computeLocalCategories = () => {
  const cats = localDB.getCategories();
  const items = localDB.getInventory();
  return cats.map(cat => {
    const catItems = items.filter(i => i.category === cat.name);
    const val = catItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    return {
      ...cat,
      item_count: catItems.length,
      total_valuation: val
    };
  });
};

export const categoryService = {
  // Synchronous cache for instant 0ms initial render
  getCategoriesSync() {
    if (!_cachedCategories) {
      _cachedCategories = computeLocalCategories();
    }
    return _cachedCategories;
  },

  async getCategories() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select(LIST_COLUMNS)
          .order('display_order', { ascending: true });
        if (error) throw error;
        _cachedCategories = data || [];
        return _cachedCategories;
      } catch (err) {
        console.error('Supabase getCategories error:', err);
      }
    }

    _cachedCategories = computeLocalCategories();
    return _cachedCategories;
  },

  async createCategory(catData) {
    const newCat = {
      ...catData,
      id: catData.id || `cat-${Date.now().toString().slice(-4)}`,
      item_count: 0,
      total_valuation: 0,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert([newCat])
          .select()
          .single();
        if (error) throw error;
        _cachedCategories = null;
        return data;
      } catch (err) {
        console.error('Supabase createCategory error:', err);
        throw err;
      }
    }

    const cats = localDB.getCategories();
    const updated = [...cats, newCat];
    localDB.setCategories(updated);
    _cachedCategories = null;
    return newCat;
  },

  async updateCategory(id, catData) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(catData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        _cachedCategories = null;
        return data;
      } catch (err) {
        console.error('Supabase updateCategory error:', err);
        throw err;
      }
    }

    const cats = localDB.getCategories();
    const index = cats.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    cats[index] = { ...cats[index], ...catData };
    localDB.setCategories([...cats]);
    _cachedCategories = null;
    return cats[index];
  },

  async deleteCategory(id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        if (error) throw error;
        _cachedCategories = null;
        return true;
      } catch (err) {
        console.error('Supabase deleteCategory error:', err);
        throw err;
      }
    }

    const cats = localDB.getCategories();
    const filtered = cats.filter(c => c.id !== id);
    localDB.setCategories(filtered);
    _cachedCategories = null;
    return true;
  }
};
