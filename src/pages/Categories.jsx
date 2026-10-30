import React, { useState, useEffect } from 'react';
import { Plus, Layers, Coins, DollarSign, Edit3, Trash2 } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { DataTable } from '../components/ui/DataTable';
import { CategoryFormModal } from '../components/forms/CategoryFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const Categories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState(() => categoryService.getCategoriesSync?.() || []);
  const [isLoading, setIsLoading] = useState(() => (!categories || categories.length === 0));
  const [search, setSearch] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(categories.length === 0);
  }, []);

  const handleAddNew = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cat) => {
    setSelectedCategory(cat);
    setIsFormOpen(true);
  };

  const handleDeletePrompt = (cat) => {
    setSelectedCategory(cat);
    setIsConfirmOpen(true);
  };

  const handleSaveCategory = async (formData) => {
    setIsSaving(true);
    try {
      if (selectedCategory) {
        const updated = await categoryService.updateCategory(selectedCategory.id, formData);
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success(`Category "${updated.name}" updated!`);
      } else {
        const created = await categoryService.createCategory(formData);
        setCategories(prev => [...prev, created]);
        toast.success(`Category "${created.name}" created!`);
      }
      setIsFormOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error('Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    setIsSaving(true);
    try {
      await categoryService.deleteCategory(selectedCategory.id);
      setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
      toast.success(`Category "${selectedCategory.name}" deleted.`);
      setIsConfirmOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete category.');
    } finally {
      setIsSaving(false);
    }
  };

  // Client search filter for categories
  const filteredCategories = categories.filter(c => 
    !search || 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.metal_type && c.metal_type.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      className: 'font-medium text-slate-900 min-w-[260px]',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-sm font-sans tracking-normal">
            {row.name}
          </span>
          {row.description && (
            <span className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">
              {row.description}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'metal_type',
      header: 'Metal Type',
      className: 'w-48 text-left',
      render: (row) => {
        const metal = row.metal_type || 'Unspecified';
        const isGold = metal.toLowerCase().includes('gold');
        const isSilver = metal.toLowerCase().includes('silver');
        const isPlatinum = metal.toLowerCase().includes('platinum');

        const badgeColor = isGold 
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : isSilver
          ? 'bg-slate-100 text-slate-800 border-slate-300'
          : isPlatinum
          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
          : 'bg-gray-100 text-gray-700 border-gray-200';

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}`}>
            {metal}
          </span>
        );
      }
    },
    {
      key: 'item_count',
      header: 'Total Items',
      className: 'w-36 text-left',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 text-xs block pl-1">
          {row.item_count ?? 0}
        </span>
      )
    },
    {
      key: 'is_active',
      header: 'Visibility',
      className: 'w-36 text-left',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          row.is_active 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {row.is_active ? 'Visible' : 'Hidden'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900">
            Categories & Metals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize catalog groupings (Gold, Morgan Dollars, Silver Bullion, Ancient, Commemorative).
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B2B4E] hover:bg-[#114275] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#C9A23A]" />
          Add Category
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
        total={filteredCategories.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter categories by name or metal..."
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        editLabel="Edit Category"
        emptyTitle="No categories found"
        emptyDescription="Create your first collection category to begin organizing lots."
      />

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCategory(null);
        }}
        onSave={handleSaveCategory}
        initialData={selectedCategory}
        isLoading={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? Items currently tagged with this category will become unassigned.`}
        confirmText="Delete Category"
        isLoading={isSaving}
      />
    </div>
  );
};
