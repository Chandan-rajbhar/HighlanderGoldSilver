import { InventoryItem, PastAuctionItem } from '../types';
import { INVENTORY_ITEMS } from '../data/inventory';
import { PAST_AUCTIONS } from '../data/pastAuctions';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { categoryService } from './categoryService';

const mapRowToInventoryItem = (row: any): InventoryItem => {
  const price = Number(row.price) || 0;
  const priceFormatted = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const featImg = row.featured_image || (Array.isArray(row.additional_images) && row.additional_images[0]) || '/assets/products/gold_union_obverse.png';
  const addImgs = Array.isArray(row.additional_images) ? row.additional_images : [];

  return {
    id: String(row.id || ''),
    lotNumber: String(row.lot_number || ''),
    title: String(row.title || ''),
    lead: row.lead || '',
    description: row.description || '',
    category: String(row.category || ''),
    metal: String(row.metal || ''),
    purity: row.purity || '',
    grade: row.grade || '',
    mintage: row.mintage || '',
    price,
    priceFormatted,
    estimateRange: row.estimate_range || '',
    paymentNote: row.payment_note || '',
    featuredImage: featImg,
    additionalImages: addImgs,
    isFeatured: Boolean(row.is_featured),
    status: (row.status === 'Available' || row.status === 'Active' || row.storefront_status === 'Active') ? 'Available' : 'Available',
    statusNote: row.status_note || ''
  };
};

/**
 * Highlander Gold & Silver — Inventory & Auction Data Service
 * 
 * Provides an asynchronous abstraction layer over static and database sources.
 */
export class InventoryService {
  /**
   * Fetches all active inventory items from database (Supabase / localDB fallback)
   */
  static async getInventory(): Promise<InventoryItem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('lot_number', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          return data.map(mapRowToInventoryItem);
        }
      } catch (err) {
        console.error('Supabase InventoryService.getInventory error, fallback to localDB:', err);
      }
    }

    try {
      const local = localDB.getInventory();
      if (Array.isArray(local) && local.length > 0) {
        return local.map(mapRowToInventoryItem);
      }
    } catch {
      // fallback
    }

    return [...INVENTORY_ITEMS];
  }

  /**
   * Fetches a single item by id or lot number
   */
  static async getItemById(idOrLot: string): Promise<InventoryItem | null> {
    const all = await this.getInventory();
    const found = all.find(
      i => String(i.id) === String(idOrLot) || String(i.lotNumber) === String(idOrLot)
    );
    return found ? { ...found } : null;
  }

  /**
   * Fetches past closed/realized auctions
   */
  static async getPastAuctions(): Promise<PastAuctionItem[]> {
    return Promise.resolve([...PAST_AUCTIONS]);
  }

  /**
   * Returns list of unique metal / collection categories from database
   */
  static async getCategories(): Promise<string[]> {
    try {
      const dbCats = await (categoryService as any).getStorefrontCategoryNames();
      if (Array.isArray(dbCats) && dbCats.length > 0) {
        return ['all', ...dbCats];
      }
    } catch {
      // fallback
    }
    const all = await this.getInventory();
    const categories = Array.from(new Set(all.map(i => i.category)));
    return ['all', ...categories];
  }
}

export default InventoryService;
