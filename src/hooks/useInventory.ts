import { useState, useEffect, useMemo, useCallback } from 'react';
import { InventoryItem } from '../types';
import { InventoryService } from '../services/inventoryService';
import { categoryService } from '../services/categoryService';

export function useInventory() {
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentSort, setCurrentSort] = useState<string>('lot-asc');

  // Dynamic categories fetched from database (Supabase / localDB)
  const [dbCategories, setDbCategories] = useState<string[]>(() => {
    try {
      const syncCats = (categoryService as any).getStorefrontCategoryNamesSync?.();
      if (Array.isArray(syncCats) && syncCats.length > 0) {
        return syncCats;
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    let isMounted = true;
    InventoryService.getInventory()
      .then(items => {
        if (isMounted) {
          setAllItems(items);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    // Fetch dynamic categories from database
    const loadCategories = async () => {
      try {
        const catNames = await (categoryService as any).getStorefrontCategoryNames();
        if (isMounted && Array.isArray(catNames) && catNames.length > 0) {
          setDbCategories(catNames);
        }
      } catch (err) {
        console.error('Error loading dynamic categories for storefront:', err);
      }
    };

    loadCategories();

    // Listen for category updates from admin dashboard
    const handleCategoryUpdate = () => {
      loadCategories();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hgs:categories-updated', handleCategoryUpdate);
      window.addEventListener('storage', handleCategoryUpdate);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('hgs:categories-updated', handleCategoryUpdate);
        window.removeEventListener('storage', handleCategoryUpdate);
      }
    };
  }, []);

  const categories = useMemo(() => {
    // Only show categories that are present and active in the database
    if (dbCategories.length > 0) {
      return ['all', ...dbCategories];
    }
    // Fallback while loading
    const unique = Array.from(new Set(allItems.map(i => i.category)));
    return ['all', ...unique];
  }, [dbCategories, allItems]);

  const filteredItems = useMemo(() => {
    let result = allItems.filter(item => {
      if (activeCategory !== 'all' && (item.category || '').toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const haystack = [
          item.lotNumber,
          item.title,
          item.description,
          item.category,
          item.grade || '',
          item.purity || '',
          item.priceFormatted
        ].join(' ').toLowerCase();

        return haystack.includes(q);
      });
    }

    result.sort((a, b) => {
      switch (currentSort) {
        case 'lot-asc':
          return Number(a.lotNumber) - Number(b.lotNumber);
        case 'lot-desc':
          return Number(b.lotNumber) - Number(a.lotNumber);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [allItems, activeCategory, searchQuery, currentSort]);

  const resetFilters = useCallback(() => {
    setActiveCategory('all');
    setSearchQuery('');
    setCurrentSort('lot-asc');
  }, []);

  const hasActiveFilters = activeCategory !== 'all' || searchQuery.trim().length > 0;

  return {
    allItems,
    filteredItems,
    categories,
    isLoading,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    currentSort,
    setCurrentSort,
    resetFilters,
    hasActiveFilters
  };
}
