import React, { useState, useEffect } from 'react';
import { Plus, Layers, Coins, DollarSign, Edit3, Trash2 } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { DataTable } from '../components/ui/DataTable';
import { CategoryFormModal } from '../components/forms/CategoryFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const Categories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
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
    fetchCategories();
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
    (c.slug && c.slug.toLowerCase().includes(search.toLowerCase())) ||
    (c.metal_type && c.metal_type.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name',
      className: 'font-semibold text-slate-900 font-serif',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.name}</span>
          {row.description && (
            <span className="text-[11px] text-slate-500 line-clamp-1">{row.description}</span>
          )}
        </div>
      )
    },
    {
      header: 'Slug',
      accessor: 'slug',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          /{row.slug}
        </span>
      )
    },
    {
      header: 'Metal Type',
      accessor: 'metal_type',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-surface text-gold-dark border border-gold-border">
          {row.metal_type || 'Precious Metals'}
        </span>
      )
    },
    {
      header: 'Total Items',
      accessor: 'item_count',
      className: 'font-mono text-center',
      render: (row) => (
        <span className="font-bold text-slate-800">
          {row.item_count || 0}
        </span>
      )
    },
    {
      header: 'Visibility',
      accessor: 'is_active',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          row.is_active 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-slate-100 text-slate-500 border-slate-200'
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
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Categories & Metals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize catalog groupings (Gold, Morgan Dollars, Silver Bullion, Ancient, Commemorative).
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aubergine hover:bg-aubergine-light text-white text-xs font-bold font-serif uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold" />
          Add Category
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
        total={filteredCategories.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter categories by name, slug, or metal..."
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
