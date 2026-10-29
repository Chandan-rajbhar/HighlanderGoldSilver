import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Layers, 
  Coins, 
  Award, 
  Sparkles, 
  DollarSign,
  Download,
  Eye,
  Edit3,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { categoryService } from '../services/categoryService';
import { DataTable } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CatalogItemFormDrawer } from '../components/forms/CatalogItemFormDrawer';
import { ItemDetailModal } from '../components/forms/ItemDetailModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const Inventory = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialInv = inventoryService.getInventorySync({
    page: 1,
    pageSize: 10,
    category: searchParams.get('category') || '',
    availability: searchParams.get('status') || '',
    sortBy: 'lot_number',
    sortAsc: true
  });

  // Query & Table State
  const [items, setItems] = useState(initialInv.data);
  const [total, setTotal] = useState(initialInv.total);
  const [totalPages, setTotalPages] = useState(initialInv.totalPages);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [metal, setMetal] = useState('All');
  const [availability, setAvailability] = useState(searchParams.get('status') || 'All');
  const [sortBy, setSortBy] = useState('lot_number');
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(() => initialInv.data.length === 0);

  // Categories list
  const [categories, setCategories] = useState(() => categoryService.getCategoriesSync?.() || []);

  // Drawer & Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await inventoryService.getInventory({
        page,
        pageSize,
        search,
        category: category !== 'All' ? category : '',
        metal: metal !== 'All' ? metal : '',
        stockStatus: '',
        storefrontStatus: availability !== 'All' ? availability : '',
        sortBy,
        sortAsc
      });
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      toast.error('Failed to load inventory lots.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, category, metal, availability, sortBy, sortAsc, toast]);

  useEffect(() => {
    fetchItems(items.length === 0);
  }, [fetchItems]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(columnKey);
      setSortAsc(true);
    }
  };

  // CRUD Handlers
  const handleAddNew = () => {
    setSelectedItem(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleDeletePrompt = (item) => {
    setSelectedItem(item);
    setIsConfirmOpen(true);
  };

  const handleSaveItem = async (formData) => {
    setIsSaving(true);
    try {
      if (drawerMode === 'edit' && selectedItem) {
        const updated = await inventoryService.updateItem(selectedItem.id, formData);
        setItems(prev => prev.map(item => item.id === updated.id ? updated : item));
        toast.success(`Item #${updated.lot_number} "${updated.title}" updated!`);
      } else {
        const created = await inventoryService.createItem(formData);
        setItems(prev => [created, ...prev]);
        setTotal(prev => prev + 1);
        toast.success(`Product Item #${created.lot_number} "${created.title}" added!`);
      }
      setIsDrawerOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error('Error saving product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      await inventoryService.deleteItem(selectedItem.id);
      setItems(prev => prev.filter(i => i.id !== selectedItem.id));
      setTotal(prev => Math.max(0, prev - 1));
      toast.success(`Item #${selectedItem.lot_number} deleted from inventory.`);
      setIsConfirmOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportCatalogCSV = () => {
    const headers = 'Item #,Product Name,Category,Metal Type,Grade,Price,Inventory,Status\n';
    const rows = items.map(i => {
      const base = Number(i.price) || 0;
      return `"${i.lot_number}","${i.title.replace(/"/g, '""')}","${i.category}","${i.metal}","${i.grade || ''}",${base},${i.inventory || 1},"${i.storefront_status || i.status}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `highlander-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory exported to CSV');
  };

  // Table columns matching BeautyOasis reference & Highlander luxury design
  const columns = [
    {
      header: 'PRODUCT NAME',
      accessor: 'title',
      className: 'min-w-[260px]',
      render: (row) => (
        <div className="flex items-center gap-3 py-0.5">
          <div 
            onClick={() => handleView(row)}
            className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0 shadow-xs cursor-pointer hover:border-[#C9A23A] hover:shadow-sm transition-all group/img"
            title={`View details for ${row.title}`}
          >
            <img
              src={row.featured_image || '/assets/items/lot1_morgan_gold_gem.jpg'}
              alt={row.title}
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.src = '/assets/items/lot1_morgan_gold_gem.jpg';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span 
              className="font-semibold text-slate-900 text-sm hover:text-[#C9A23A] cursor-pointer block truncate leading-snug font-sans transition-colors"
              onClick={() => handleView(row)}
              title={row.title}
            >
              {row.title}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5 truncate font-sans font-normal">
              {row.grade ? `${row.grade} • ` : ''}{row.metal || 'Gold'}{row.purity ? ` (${row.purity})` : ''}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'CATEGORY',
      accessor: 'category',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-sm font-medium text-slate-700 font-sans">
          {row.category || '—'}
        </span>
      )
    },
    {
      header: 'ITEM CODE',
      accessor: 'sku',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-medium tracking-wide">
          {row.sku || `HGS-LOT-${row.lot_number}`}
        </span>
      )
    },
    {
      header: 'PRICE',
      accessor: 'price',
      className: 'whitespace-nowrap',
      render: (row) => {
        const base = Number(row.price) || 0;
        return (
          <span className="font-semibold text-slate-900 text-sm whitespace-nowrap font-sans">
            ${base.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      header: 'INVENTORY STOCK',
      accessor: 'inventory',
      className: 'whitespace-nowrap',
      render: (row) => {
        const qty = row.inventory ?? row.stock_quantity ?? 1;
        return (
          <span className="text-sm text-slate-700 whitespace-nowrap font-sans font-medium">
            {qty} {qty === 1 ? 'unit' : 'units'}
          </span>
        );
      }
    },
    {
      header: 'STATUS',
      accessor: 'storefront_status',
      className: 'whitespace-nowrap',
      render: (row) => {
        const qty = row.inventory ?? row.stock_quantity ?? 1;
        const isInStock = qty > 0 && (row.storefront_status || row.status) !== 'Sold';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
            isInStock 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isInStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {isInStock ? 'In Stock' : 'Sold Out'}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-[#111827] tracking-tight">
            Product Catalog
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Manage collectible coins, precious metals, inventory, pricing, and storefront listings.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/categories')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] text-[#111827] text-xs font-semibold hover:bg-[#F5F8FC] transition-colors shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#D6AD45]" />
            Manage Categories
          </button>

          <button
            onClick={exportCatalogCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] text-[#111827] text-xs font-semibold hover:bg-[#F5F8FC] transition-colors shadow-2xs hidden md:inline-flex cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            Export CSV
          </button>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D6AD45] hover:bg-[#BF952E] text-[#111827] text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#111827]" />
            Add Catalog Item
          </button>
        </div>
      </div>

      {/* Dynamic Data Table */}
      <DataTable
        columns={columns}
        data={items}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSort={handleSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products by title, category, item code..."
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        editLabel="Edit Product"
        emptyTitle="No products found"
        emptyDescription="Try adjusting your category or stock status filters."
        filterComponent={
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.name, label: c.name }))
              ]}
            />

            {/* Stock Status Filter */}
            <Select
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: 'All Stock Status' },
                { value: 'Active', label: 'In Stock' },
                { value: 'Sold', label: 'Sold Out' },
                { value: 'Draft', label: 'Draft' }
              ]}
            />
          </div>
        }
      />

      {/* Slide-over Drawer for Add/Edit Product */}
      <CatalogItemFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveItem}
        mode={drawerMode}
        item={selectedItem}
        categories={categories}
        isLoading={isSaving}
      />

      {/* Client-Side Storefront Product Dossier Modal */}
      <ItemDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onEdit={(itemToEdit) => {
          setIsDetailOpen(false);
          handleEdit(itemToEdit);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Item"
        message={`Are you sure you want to permanently delete Item #${selectedItem?.lot_number}: "${selectedItem?.title}" from the inventory?`}
        confirmText="Delete Product"
        isLoading={isSaving}
      />
    </div>
  );
};
