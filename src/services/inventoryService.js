import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

// Columns for list views - Egress Optimization: Never select('*') on lists!
const LIST_COLUMNS = 'id, lot_number, sku, title, lead, category, metal, purity, grade, price, inventory, stock_quantity, stock_status, storefront_status, status, show_on_storefront, is_featured, featured_image, created_at';

export const inventoryService = {
  /**
   * Fetch paginated inventory with filtering, sorting, and search
   * Uses server-side pagination with Supabase range() when connected
   */
  async getInventory({
    page = 1,
    pageSize = 10,
    search = '',
    category = '',
    metal = '',
    status = '',
    stockStatus = '',
    storefrontStatus = '',
    sortBy = 'lot_number',
    sortAsc = true
  } = {}) {
    if (isSupabaseConfigured()) {
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('inventory')
          .select(LIST_COLUMNS, { count: 'exact' });

        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        if (metal && metal !== 'All') {
          query = query.eq('metal', metal);
        }

        if (status && status !== 'All') {
          query = query.eq('status', status);
        }

        if (stockStatus && stockStatus !== 'All') {
          query = query.eq('stock_status', stockStatus);
        }

        if (storefrontStatus && storefrontStatus !== 'All') {
          query = query.eq('storefront_status', storefrontStatus);
        }

        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`title.ilike.%${s}%,lot_number.ilike.%${s}%,sku.ilike.%${s}%,metal.ilike.%${s}%,grade.ilike.%${s}%,category.ilike.%${s}%`);
        }

        query = query.order(sortBy, { ascending: sortAsc }).range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
          data: data || [],
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        };
      } catch (err) {
        console.error('Supabase getInventory error, using local fallback:', err);
      }
    }

    // Local in-memory / localStorage fallback with matching pagination logic
    let items = localDB.getInventory();

    // Filters
    if (category && category !== 'All') {
      items = items.filter(i => i.category === category);
    }
    if (metal && metal !== 'All') {
      items = items.filter(i => i.metal === metal);
    }
    if (status && status !== 'All') {
      items = items.filter(i => (i.storefront_status === status || i.status === status));
    }
    if (stockStatus && stockStatus !== 'All') {
      items = items.filter(i => i.stock_status === stockStatus);
    }
    if (storefrontStatus && storefrontStatus !== 'All') {
      items = items.filter(i => i.storefront_status === storefrontStatus);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      items = items.filter(i => 
        (i.title && i.title.toLowerCase().includes(q)) ||
        (i.lot_number && i.lot_number.toLowerCase().includes(q)) ||
        (i.sku && i.sku.toLowerCase().includes(q)) ||
        (i.metal && i.metal.toLowerCase().includes(q)) ||
        (i.grade && i.grade.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
      );
    }

    // Sort
    items.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'lot_number') {
        const numA = parseInt(valA, 10);
        const numB = parseInt(valB, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortAsc ? numA - numB : numB - numA;
        }
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    const total = items.length;
    const from = (page - 1) * pageSize;
    const paginated = items.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getItemById(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase getItemById error:', err);
      }
    }

    const items = localDB.getInventory();
    return items.find(i => i.id === id) || null;
  },

  async createItem(itemData) {
    const newItem = {
      ...itemData,
      id: itemData.id || `item-${Date.now().toString().slice(-4)}`,
      sku: itemData.sku || `HGS-${(itemData.category || 'COIN').slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      stock_status: Number(itemData.inventory || itemData.stock_quantity) > 0 ? 'In Stock' : 'Out of Stock',
      storefront_status: itemData.storefront_status || 'Active',
      status: Number(itemData.inventory || itemData.stock_quantity) > 0 ? 'Available' : 'Unavailable',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .insert([newItem])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase createItem error:', err);
        throw err;
      }
    }

    const items = localDB.getInventory();
    const updated = [newItem, ...items];
    localDB.setInventory(updated);
    return newItem;
  },

  async updateItem(id, itemData) {
    const qty = Number(itemData.inventory ?? itemData.stock_quantity ?? 1);
    const updatePayload = {
      ...itemData,
      stock_status: qty > 0 ? (itemData.stock_status || 'In Stock') : 'Out of Stock',
      status: qty > 0 ? (itemData.status || 'Available') : 'Unavailable',
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase updateItem error:', err);
        throw err;
      }
    }

    const items = localDB.getInventory();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`Item ${id} not found`);

    const updatedItem = { ...items[index], ...updatePayload };
    items[index] = updatedItem;
    localDB.setInventory([...items]);
    return updatedItem;
  },

  async duplicateItem(id) {
    const original = await this.getItemById(id);
    if (!original) throw new Error(`Item ${id} not found for duplication`);

    const duplicateLot = `${parseInt(original.lot_number || '1', 10) + 100}`;
    const duplicateData = {
      ...original,
      id: `item-${Date.now().toString().slice(-4)}`,
      lot_number: duplicateLot,
      sku: `${original.sku || 'HGS-ITEM'}-COPY`,
      title: `${original.title} (Copy)`,
      storefront_status: 'Draft',
      status: 'Available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await this.createItem(duplicateData);
  },

  async updateListingStatus(id, newStatus) {
    return await this.updateItem(id, {
      storefront_status: newStatus,
      status: (newStatus === 'Sold' || newStatus === 'Out of Stock') ? 'Unavailable' : 'Available'
    });
  },

  async deleteItem(id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Supabase deleteItem error:', err);
        throw err;
      }
    }

    const items = localDB.getInventory();
    const filtered = items.filter(i => i.id !== id);
    localDB.setInventory(filtered);
    return true;
  }
};
