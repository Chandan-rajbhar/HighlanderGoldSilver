import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
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
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  RefreshCw,
  Copy,
  Tag,
  Check
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { inventoryService } from '../services/inventoryService';
import { categoryService } from '../services/categoryService';
import { resolveInventoryImageUrl } from '../services/imageUploadService';
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
  const { id: routeId } = useParams();
  const { toast } = useToast();

  // Lazy one-time fallback only when offline/unconfigured so live DB totalPages never flickers or freezes renders
  const initialSyncState = useRef(null);
  if (initialSyncState.current === null) {
    initialSyncState.current = !isSupabaseConfigured()
      ? inventoryService.getInventorySync({
          page: 1,
          pageSize: 10,
          category: searchParams.get('category') || '',
          availability: searchParams.get('status') || '',
          sortBy: 'lot_number',
          sortAsc: true
        })
      : { data: [], total: 0, totalPages: 1 };
  }

  // Query & Table State
  const [items, setItems] = useState(initialSyncState.current.data);
  const [total, setTotal] = useState(initialSyncState.current.total);
  const [totalPages, setTotalPages] = useState(initialSyncState.current.totalPages);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [metal, setMetal] = useState('All');
  const [availability, setAvailability] = useState(searchParams.get('status') || 'All');
  const [sortBy, setSortBy] = useState('lot_number');
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured() || initialSyncState.current.data.length === 0);
  const [fetchError, setFetchError] = useState(null);

  // Race-condition & cancellation protection for pagination/filter queries
  const latestRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Categories list
  const [categories, setCategories] = useState(() => categoryService.getCategoriesSync?.() || []);

  // Drawer & Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Product View Drawer State
  const [viewItem, setViewItem] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Keep categories synchronized when edited in Categories page
  useEffect(() => {
    const loadCategories = () => {
      categoryService.getCategories().then(setCategories).catch(console.error);
    };
    loadCategories();
    window.addEventListener('hgs:categories-updated', loadCategories);
    return () => window.removeEventListener('hgs:categories-updated', loadCategories);
  }, []);

  const fetchItems = useCallback(async () => {
    const reqId = ++latestRequestIdRef.current;
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (_) {}
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setFetchError(null);
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
        sortAsc,
        signal: controller.signal
      });

      // Discard stale out-of-order response
      if (reqId !== latestRequestIdRef.current) return;

      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);

      // Clamp page cleanly if out of bounds (e.g., after deleting last item on final page)
      if (res.page && res.page !== page) {
        setPage(res.page);
      }
    } catch (err) {
      if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort')) {
        return;
      }
      if (reqId !== latestRequestIdRef.current) return;
      console.error('Error fetching inventory:', err);
      setFetchError(err);
      toast.error('Failed to load inventory lots.');
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [page, pageSize, search, category, metal, availability, sortBy, sortAsc, toast]);

  useEffect(() => {
    fetchItems();
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (_) {}
      }
    };
  }, [fetchItems]);

  // Sync deep-link route param with viewItem (only when routeId is explicitly present)
  useEffect(() => {
    if (!routeId) return;
    const found = items.find(i => String(i.id) === String(routeId) || String(i.lot_number) === String(routeId));
    if (found) {
      setViewItem(found);
      setActiveImageIndex(0);
    } else {
      inventoryService.getItemById(routeId).then(item => {
        if (item) {
          setViewItem(item);
          setActiveImageIndex(0);
        }
      }).catch(console.error);
    }
  }, [routeId, items]);

  const handleSort = useCallback((columnKey) => {
    if (sortBy === columnKey) {
      setSortAsc(prev => !prev);
    } else {
      setSortBy(columnKey);
      setSortAsc(true);
    }
  }, [sortBy]);

  const handleSearchChange = useCallback((nextSearch) => {
    setSearch(prev => {
      if (prev !== nextSearch) {
        setPage(1);
      }
      return nextSearch;
    });
  }, []);

  const handlePageSizeChange = useCallback((nextSize) => {
    setPageSize(nextSize);
    setPage(1);
  }, []);

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
    setViewItem(item);
  };

  const handleBackToCatalog = () => {
    setViewItem(null);
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
        if (viewItem && (viewItem.id === updated.id || viewItem.lot_number === updated.lot_number)) {
          setViewItem(updated);
        }
        toast.success(`Item #${updated.lot_number} "${updated.title}" updated!`);
      } else {
        const created = await inventoryService.createItem(formData);
        toast.success(`Product Item #${created.lot_number} "${created.title}" added!`);
      }
      setIsDrawerOpen(false);
      setSelectedItem(null);
      await fetchItems();
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error(err?.message || 'Error saving product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      await inventoryService.deleteItem(selectedItem.id);
      toast.success(`Item #${selectedItem.lot_number} deleted from inventory.`);
      setIsConfirmOpen(false);
      if (viewItem && (viewItem.id === selectedItem.id || viewItem.lot_number === selectedItem.lot_number)) {
        setViewItem(null);
      }
      setSelectedItem(null);
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error(err?.message || 'Failed to delete item.');
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
      header: 'ITEM #',
      accessor: 'lot_number',
      className: 'font-mono text-xs font-semibold text-[#0B2B4E] whitespace-nowrap w-24',
      render: (row) => <span>#{row.lot_number || '—'}</span>
    },
    {
      header: 'PRODUCT NAME',
      accessor: 'title',
      className: 'min-w-[240px]',
      render: (row) => {
        const thumbUrl = resolveInventoryImageUrl(
          row.featured_image || (Array.isArray(row.additional_images) ? row.additional_images[0] : '') || ''
        );
        return (
          <div className="flex items-center gap-3 py-0.5">
            <div 
              className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0 shadow-xs group/img"
              title={`View details for ${row.title}`}
            >
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={row.title}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                  onLoad={(e) => {
                    e.currentTarget.style.display = '';
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Package className="w-5 h-5 text-slate-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span 
                className="font-semibold text-slate-900 text-sm hover:text-[#C9A23A] block truncate leading-snug font-sans transition-colors"
                title={row.title}
              >
                {row.title}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5 truncate font-sans font-normal">
                {row.grade ? `${row.grade} • ` : ''}{row.metal || '—'}{row.purity ? ` (${row.purity})` : ''}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'CATEGORY',
      accessor: 'category',
      className: 'text-xs text-slate-700 font-medium font-sans whitespace-nowrap',
      render: (row) => <span>{row.category || '—'}</span>
    },
    {
      header: 'ITEM CODE',
      accessor: 'sku',
      className: 'font-mono text-xs text-slate-500 whitespace-nowrap',
      render: (row) => <span>{row.sku || '—'}</span>
    },
    {
      header: 'PRICE',
      accessor: 'price',
      className: 'font-mono font-semibold text-slate-900 text-sm whitespace-nowrap',
      render: (row) => (
        <span>${Number(row.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      )
    },
    {
      header: 'INVENTORY STOCK',
      accessor: 'inventory',
      className: 'text-xs font-mono whitespace-nowrap',
      render: (row) => (
        <span className={Number(row.inventory ?? row.stock_quantity ?? 0) <= 1 ? 'text-amber-700 font-semibold' : 'text-slate-700 font-medium'}>
          {row.inventory ?? row.stock_quantity ?? 0} unit
        </span>
      )
    },
    {
      header: 'STATUS',
      accessor: 'storefront_status',
      render: (row) => (
        <StatusBadge status={row.storefront_status || row.status || 'Active'} />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900">
            Product Catalog
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-sans">
            Manage collectible coins, precious metals, inventory, pricing, and storefront listings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B2B4E] hover:bg-[#114275] text-white text-xs font-semibold font-sans shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C9A23A]" />
            Add Product
          </button>
        </div>
      </div>

      {/* Dynamic Data Table with onRowClick opening Slide-over Right Drawer */}
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
        onPageSizeChange={handlePageSizeChange}
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search products by title, item #, item code, category..."
        isLoading={isLoading}
        error={fetchError}
        onRowClick={(row) => handleView(row)}
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

      {/* Slide-over Right Drawer for Product Details (Storefront Priceview, Specs & Photos) */}
      <ItemDetailModal
        isOpen={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        item={viewItem}
        onEdit={handleEdit}
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
