import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { normalizeImageToLink } from './imageUploadService';

// Columns for list views - Egress Optimization: Never select('*') on lists!
const LIST_COLUMNS = 'id, lot_number, sku, title, lead, description, category, metal, purity, grade, price, inventory, stock_quantity, stock_status, storefront_status, status, show_on_storefront, is_featured, featured_image, additional_images, weight, mintage, cert_company, cert_number, estimate_range, payment_note, created_at';

// Valid PostgreSQL database columns for public.inventory schema
const INVENTORY_DB_COLUMNS = new Set([
  'id', 'lot_number', 'sku', 'title', 'lead', 'description', 
  'category', 'category_id', 'metal', 'coin_type', 'year', 
  'country_mint', 'denomination', 'weight', 'weight_troy_oz', 
  'purity', 'fineness', 'grade', 'cert_company', 'cert_number', 
  'special_features', 'mintage', 'price', 'inventory', 'stock_quantity', 
  'stock_status', 'storefront_status', 'status', 'show_on_storefront', 
  'is_featured', 'estimate_range', 'payment_note', 'featured_image', 
  'additional_images', 'created_at', 'updated_at'
]);

// Strip out extraneous non-schema fields (such as 'images') and normalize types for Supabase
const sanitizeInventoryPayload = (item) => {
  const sanitized = {};
  const additionalImgs = item.additional_images || item.images || (item.featured_image ? [item.featured_image] : []);
  
  for (const [key, value] of Object.entries(item)) {
    if (INVENTORY_DB_COLUMNS.has(key)) {
      sanitized[key] = value;
    }
  }
  
  const rawAdditional = Array.isArray(additionalImgs) ? additionalImgs : [];
  sanitized.additional_images = rawAdditional.map(normalizeImageToLink).filter(Boolean);
  if (!sanitized.featured_image && sanitized.additional_images.length > 0) {
    sanitized.featured_image = sanitized.additional_images[0];
  } else if (sanitized.featured_image) {
    sanitized.featured_image = normalizeImageToLink(sanitized.featured_image);
  }

  if (sanitized.price !== undefined) sanitized.price = Number(sanitized.price) || 0;
  if (sanitized.inventory !== undefined) sanitized.inventory = Number(sanitized.inventory) || 0;
  if (sanitized.stock_quantity !== undefined) sanitized.stock_quantity = Number(sanitized.stock_quantity) || 0;
  
  return sanitized;
};

// In-memory filter & pagination helper for instant sync reads
const filterAndPaginateLocalInventory = ({
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
} = {}) => {
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
};

export const inventoryService = {
  // Instant synchronous retrieval for 0ms page transitions
  getInventorySync(params = {}) {
    return filterAndPaginateLocalInventory(params);
  },

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

    return filterAndPaginateLocalInventory({
      page,
      pageSize,
      search,
      category,
      metal,
      status,
      stockStatus,
      storefrontStatus,
      sortBy,
      sortAsc
    });
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
      id: itemData.id || `inv-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const supabasePayload = sanitizeInventoryPayload(newItem);
        const { data, error } = await supabase
          .from('inventory')
          .insert([supabasePayload])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          const items = localDB.getInventory();
          localDB.setInventory([data, ...items.filter(i => i.id !== data.id)]);
          if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hgs:inventory-updated", { detail: data }));
          return data;
        }
      } catch (err) {
        console.warn('Supabase createItem error, seamlessly saving to local database fallback:', err);
      }
    }

    const items = localDB.getInventory();
    const updated = [newItem, ...items.filter(i => i.id !== newItem.id)];
    localDB.setInventory(updated);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hgs:inventory-updated", { detail: newItem }));
    return newItem;
  },

  async updateItem(id, itemData) {
    const updatedFields = {
      ...itemData,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const supabasePayload = sanitizeInventoryPayload(updatedFields);
        const { data, error } = await supabase
          .from('inventory')
          .update(supabasePayload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          const items = localDB.getInventory();
          const index = items.findIndex(i => i.id === id);
          if (index !== -1) {
            items[index] = { ...items[index], ...data };
            localDB.setInventory([...items]);
          }
          if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hgs:inventory-updated", { detail: data }));
          return data;
        }
      } catch (err) {
        console.warn('Supabase updateItem error, seamlessly saving to local database fallback:', err);
      }
    }

    const items = localDB.getInventory();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updatedFields };
      localDB.setInventory([...items]);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hgs:inventory-updated", { detail: items[index] }));
      return items[index];
    }
    return { id, ...updatedFields };
  },

  async deleteItem(id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase deleteItem error, seamlessly deleting from local database fallback:', err);
      }
    }

    const items = localDB.getInventory();
    const filtered = items.filter(i => i.id !== id);
    localDB.setInventory(filtered);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hgs:inventory-updated", { detail: { id, deleted: true } }));
    return true;
  }
};
