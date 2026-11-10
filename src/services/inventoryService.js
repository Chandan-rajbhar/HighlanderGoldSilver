import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { normalizeImageToLink } from './imageUploadService';

// Columns for list views - Egress Optimization: Never select('*') on lists!
const LIST_COLUMNS = 'id, lot_number, sku, title, lead, description, category, metal, purity, grade, price, inventory, stock_quantity, stock_status, storefront_status, status, show_on_storefront, is_featured, featured_image, additional_images, weight, mintage, cert_company, cert_number, estimate_range, payment_note, created_at';

const NATURAL_COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Parse numeric value from Item Number (lot_number).
 * Keeps non-numeric values sorted deterministically after numbers.
 */
export const parseNumericLot = (val) => {
  if (val === null || val === undefined) return { hasNum: false, num: Infinity, raw: '' };
  const str = String(val).trim();
  if (!str) return { hasNum: false, num: Infinity, raw: '' };
  if (/^-?\d+(?:\.\d+)?$/.test(str)) {
    return { hasNum: true, num: Number(str), raw: str };
  }
  const leadingMatch = str.match(/^(-?\d+(?:\.\d+)?)/);
  if (leadingMatch) {
    return { hasNum: true, num: Number(leadingMatch[1]), raw: str };
  }
  return { hasNum: false, num: Infinity, raw: str };
};

/**
 * Deterministic comparator for inventory items across both Supabase queries and local fallback.
 * Strictly separates Item Number (lot_number) from Item Code (sku).
 */
export const compareInventoryItems = (a, b, sortBy = 'lot_number', sortAsc = true) => {
  const dir = sortAsc ? 1 : -1;
  let primaryCmp = 0;

  if (sortBy === 'lot_number') {
    const lotA = parseNumericLot(a.lot_number);
    const lotB = parseNumericLot(b.lot_number);
    if (lotA.hasNum && lotB.hasNum) {
      primaryCmp = lotA.num - lotB.num;
      if (primaryCmp === 0) {
        primaryCmp = NATURAL_COLLATOR.compare(lotA.raw, lotB.raw);
      }
    } else if (lotA.hasNum !== lotB.hasNum) {
      primaryCmp = lotA.hasNum ? -1 : 1;
    } else {
      primaryCmp = NATURAL_COLLATOR.compare(lotA.raw, lotB.raw);
    }
  } else if (sortBy === 'sku') {
    const skuA = String(a.sku || '').trim();
    const skuB = String(b.sku || '').trim();
    if (!skuA && skuB) primaryCmp = 1;
    else if (skuA && !skuB) primaryCmp = -1;
    else primaryCmp = NATURAL_COLLATOR.compare(skuA, skuB);
  } else if (sortBy === 'price' || sortBy === 'inventory' || sortBy === 'stock_quantity') {
    const numA = sortBy === 'inventory'
      ? Number(a.inventory ?? a.stock_quantity ?? 0)
      : Number(a[sortBy] ?? 0);
    const numB = sortBy === 'inventory'
      ? Number(b.inventory ?? b.stock_quantity ?? 0)
      : Number(b[sortBy] ?? 0);
    primaryCmp = numA - numB;
  } else if (sortBy === 'storefront_status') {
    const stA = String(a.storefront_status || a.status || '');
    const stB = String(b.storefront_status || b.status || '');
    primaryCmp = NATURAL_COLLATOR.compare(stA, stB);
  } else {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';
    primaryCmp = NATURAL_COLLATOR.compare(String(valA), String(valB));
  }

  if (primaryCmp !== 0) {
    return primaryCmp * dir;
  }

  // Deterministic secondary sorting condition:
  // 1. Numeric lot_number ascending (when primary sort is not lot_number)
  if (sortBy !== 'lot_number') {
    const lotA = parseNumericLot(a.lot_number);
    const lotB = parseNumericLot(b.lot_number);
    if (lotA.hasNum && lotB.hasNum && lotA.num !== lotB.num) {
      return lotA.num - lotB.num;
    }
    const lotStrCmp = NATURAL_COLLATOR.compare(lotA.raw, lotB.raw);
    if (lotStrCmp !== 0) return lotStrCmp;
  }

  // 2. Created timestamp ascending
  const timeA = String(a.created_at || '');
  const timeB = String(b.created_at || '');
  if (timeA !== timeB) {
    return timeA.localeCompare(timeB);
  }

  // 3. Primary key ID ascending
  return String(a.id || '').localeCompare(String(b.id || ''));
};

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

  if (sanitized.lot_number !== undefined && sanitized.lot_number !== null) {
    sanitized.lot_number = String(sanitized.lot_number).trim();
  }
  if (sanitized.sku !== undefined) {
    const cleanSku = String(sanitized.sku || '').trim();
    sanitized.sku = cleanSku === '' ? null : cleanSku;
  }
  if (sanitized.price !== undefined) sanitized.price = Number(sanitized.price) || 0;
  if (sanitized.inventory !== undefined) sanitized.inventory = Number(sanitized.inventory) || 0;
  if (sanitized.stock_quantity !== undefined) sanitized.stock_quantity = Number(sanitized.stock_quantity) || 0;
  
  return sanitized;
};

const formatInventoryMutationError = (err, itemData = {}) => {
  const msg = String(err?.message || '');
  if (err?.code === '23505' || msg.includes('duplicate key')) {
    if (msg.includes('lot_number')) {
      return new Error(`Item Number #${itemData.lot_number || ''} already exists. Please use a unique Item Number.`);
    }
    if (msg.includes('sku')) {
      return new Error(`Item Code "${itemData.sku || ''}" already exists. Please use a unique Item Code.`);
    }
    return new Error('A product with this identifier already exists in the database.');
  }
  return err instanceof Error ? err : new Error(msg || 'Database operation failed.');
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
      (i.lot_number && String(i.lot_number).toLowerCase().includes(q)) ||
      (i.sku && String(i.sku).toLowerCase().includes(q)) ||
      (i.metal && i.metal.toLowerCase().includes(q)) ||
      (i.grade && i.grade.toLowerCase().includes(q)) ||
      (i.category && i.category.toLowerCase().includes(q))
    );
  }

  // Unified deterministic sort (identical to Supabase mode)
  items.sort((a, b) => compareInventoryItems(a, b, sortBy, sortAsc));

  const total = items.length;
  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const from = (safePage - 1) * pageSize;
  const paginated = items.slice(from, from + pageSize);

  return {
    data: paginated,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
};

export const inventoryService = {
  // Instant synchronous retrieval for 0ms page transitions
  getInventorySync(params = {}) {
    return filterAndPaginateLocalInventory(params);
  },

  /**
   * Fetch paginated inventory with filtering, deterministic numeric sorting, and search.
   * Ensures Item Number (lot_number) sorts numerically and Item Code (sku) sorts naturally.
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
    sortAsc = true,
    signal
  } = {}) {
    if (isSupabaseConfigured() && supabase) {
      const batchSize = 1000;
      let offset = 0;
      let allMatching = [];

      while (true) {
        let query = supabase
          .from('inventory')
          .select(LIST_COLUMNS);

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
          const s = search.trim().replace(/[,()]/g, ' ').trim();
          if (s) {
            query = query.or(`title.ilike.%${s}%,lot_number.ilike.%${s}%,sku.ilike.%${s}%,metal.ilike.%${s}%,grade.ilike.%${s}%,category.ilike.%${s}%`);
          }
        }

        // Deterministic DB order for clean batch boundaries before numeric/natural ordering
        query = query
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + batchSize - 1);

        if (signal && typeof query.abortSignal === 'function') {
          query = query.abortSignal(signal);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          allMatching = allMatching.concat(data);
        }
        if (!data || data.length < batchSize) {
          break;
        }
        offset += batchSize;
      }

      // Deterministic numeric/natural sorting + stable secondary tie-breakers
      allMatching.sort((a, b) => compareInventoryItems(a, b, sortBy, sortAsc));

      const total = allMatching.length;
      const safePageSize = Math.max(1, Number(pageSize) || 10);
      const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize);
      const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
      const from = (safePage - 1) * safePageSize;
      const paginated = allMatching.slice(from, from + safePageSize);

      return {
        data: paginated,
        total,
        page: safePage,
        pageSize: safePageSize,
        totalPages,
      };
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
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }

    const items = localDB.getInventory();
    return items.find(i => i.id === id) || null;
  },

  async createItem(itemData) {
    const newItem = {
      ...itemData,
      id: itemData.id || `inv-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 89)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      const supabasePayload = sanitizeInventoryPayload(newItem);
      const { data, error } = await supabase
        .from('inventory')
        .insert([supabasePayload])
        .select()
        .single();
      if (error) {
        throw formatInventoryMutationError(error, supabasePayload);
      }
      if (data) {
        const items = localDB.getInventory();
        localDB.setInventory([data, ...items.filter(i => i.id !== data.id)]);
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hgs:inventory-updated", { detail: data }));
        return data;
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

    if (isSupabaseConfigured() && supabase) {
      const supabasePayload = sanitizeInventoryPayload(updatedFields);
      const { data, error } = await supabase
        .from('inventory')
        .update(supabasePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        throw formatInventoryMutationError(error, supabasePayload);
      }
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
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      if (error) {
        throw formatInventoryMutationError(error);
      }
    }

    const items = localDB.getInventory();
    const filtered = items.filter(i => i.id !== id);
    localDB.setInventory(filtered);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hgs:inventory-updated", { detail: { id, deleted: true } }));
    return true;
  }
};
