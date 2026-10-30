import React from 'react';
import { InventoryItem } from '../../types';

export interface CategoryPillsProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  allItems?: InventoryItem[];
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories = [],
  activeCategory = 'all',
  onSelectCategory,
  allItems = []
}) => {
  return (
    <div
      className="category-pills-row"
      id="categoryPillsContainer"
      role="tablist"
      aria-label="Filter items by metal and type"
    >
      {categories.map((cat) => {
        const isAll = cat.toLowerCase() === 'all';
        const label = isAll ? 'All Pieces' : cat;
        const count = isAll 
          ? (allItems?.length || 0)
          : (allItems || []).filter((i) => (i.category || '').trim().toLowerCase() === cat.trim().toLowerCase()).length;
        const isActive = activeCategory.trim().toLowerCase() === cat.trim().toLowerCase();

        return (
          <button
            key={cat}
            type="button"
            className={`category-pill ${isActive ? 'active' : ''}`}
            data-category={cat}
            onClick={() => onSelectCategory(cat)}
            role="tab"
            aria-selected={isActive}
          >
            {label}
            <span style={{ opacity: 0.65, fontSize: '0.65rem', marginLeft: '0.35rem' }}>
              ({count})
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryPills;
