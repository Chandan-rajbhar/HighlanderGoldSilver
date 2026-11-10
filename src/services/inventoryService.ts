import { InventoryItem, PastAuctionItem } from '../types';
import { INVENTORY_ITEMS } from '../data/inventory';
import { PAST_AUCTIONS } from '../data/pastAuctions';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { categoryService } from './categoryService';
import { resolveInventoryImageUrl } from './imageUploadService';

const naturalCollator = new Intl.Collator('en-US', { numeric: true, sensitivity: 'base' });

const parseNumericLot = (val: unknown): number | null => {
  const s = String(val ?? '').trim();
  if (!s) return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const num = Number(s);
    return Number.isFinite(num) ? num : null;
  }
  const leading = s.match(/^(\d+)/);
  return leading ? Number(leading[1]) : null;
};

export const compareByLotNumber = (a: InventoryItem, b: InventoryItem): number => {
  const aNum = parseNumericLot(a.lotNumber);
  const bNum = parseNumericLot(b.lotNumber);
  if (aNum !== null && bNum !== null && aNum !== bNum) {
    return aNum - bNum;
  }
  if (aNum !== null && bNum === null) return -1;
  if (aNum === null && bNum !== null) return 1;
  const lotCmp = naturalCollator.compare(a.lotNumber || '', b.lotNumber || '');
  if (lotCmp !== 0) return lotCmp;
  return naturalCollator.compare(String(a.id || ''), String(b.id || ''));
};

const isStorefrontVisible = (row: any): boolean => {
  const storefrontStatus = String(row?.storefront_status || '').trim().toLowerCase();
  return storefrontStatus !== 'hidden' && storefrontStatus !== 'draft';
};

const mapRowStatus = (row: any): InventoryItem['status'] => {
  const raw = String(row?.status || '').trim();
  const qty = row?.inventory ?? row?.stock_quantity;
  if (raw === 'Unavailable' || raw === 'Sold' || (qty !== undefined && qty !== null && Number(qty) <= 0)) {
    return 'Unavailable';
  }
  if (raw === 'Pending' || raw === 'Reserved') return 'Pending';
  if (raw === 'Closed') return 'Closed';
  return 'Available';
};

const mapRowToInventoryItem = (row: any): InventoryItem => {
  const price = Number(row.price) || 0;
  const priceFormatted = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const rawAddImgs = Array.isArray(row.additional_images) ? row.additional_images : [];
  const addImgs = rawAddImgs.map(resolveInventoryImageUrl).filter(Boolean);
  const resolvedFeat = resolveInventoryImageUrl(row.featured_image || '');
  const featImg = resolvedFeat || addImgs[0] || '/assets/products/gold_union_obverse.png';

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
    status: mapRowStatus(row),
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
        const batchSize = 1000;
        let offset = 0;
        const allRows: any[] = [];

        while (true) {
          const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
            .range(offset, offset + batchSize - 1);
          if (error) throw error;
          const rows = data || [];
          allRows.push(...rows);
          if (rows.length < batchSize) break;
          offset += batchSize;
        }

        if (allRows.length > 0) {
          return allRows
            .filter(isStorefrontVisible)
            .map(mapRowToInventoryItem)
            .sort(compareByLotNumber);
        }
        return [];
      } catch (err) {
        console.error('Supabase InventoryService.getInventory error, fallback to localDB:', err);
      }
    }

    try {
      const local = localDB.getInventory();
      if (Array.isArray(local) && local.length > 0) {
        return local
          .filter(isStorefrontVisible)
          .map(mapRowToInventoryItem)
          .sort(compareByLotNumber);
      }
    } catch {
      // fallback
    }

    return [...INVENTORY_ITEMS].sort(compareByLotNumber);
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
