import React, { useState, useEffect, useCallback } from 'react';
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
  const { id: routeId } = useParams();
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Product View Page State (Storefront Priceview Dedicated Route/Page)
  const [viewItem, setViewItem] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
    fetchItems();
  }, [fetchItems]);

  // Sync route param with viewItem
  useEffect(() => {
    if (routeId) {
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
    } else {
      setViewItem(null);
    }
  }, [routeId, items]);

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
    setViewItem(item);
    setActiveImageIndex(0);
    navigate(`/inventory/${item.id || item.lot_number}`);
  };

  const handleBackToCatalog = () => {
    setViewItem(null);
    navigate('/inventory');
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
        if (viewItem && (viewItem.id === updated.id || viewItem.lot_number === updated.lot_number)) {
          setViewItem(updated);
        }
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
      if (viewItem && (viewItem.id === selectedItem.id || viewItem.lot_number === selectedItem.lot_number)) {
        setViewItem(null);
        navigate('/inventory');
      }
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
            className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0 shadow-xs group/img"
            title={`View details for ${row.title}`}
          >
            <img
              src={row.featured_image || '/assets/items/lot1_morgan_gold_gem.jpg'}
              alt={row.title}
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/items/lot1_morgan_gold_gem.jpg';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span 
              className="font-semibold text-slate-900 text-sm hover:text-[#C9A23A] block truncate leading-snug font-sans transition-colors"
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
      className: 'text-xs text-slate-700 font-medium font-sans',
      render: (row) => <span>{row.category}</span>
    },
    {
      header: 'ITEM CODE',
      accessor: 'sku',
      className: 'font-mono text-xs text-slate-500',
      render: (row) => <span>{row.sku}</span>
    },
    {
      header: 'PRICE',
      accessor: 'price',
      className: 'font-mono font-bold text-slate-900 text-sm',
      render: (row) => (
        <span>${Number(row.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      )
    },
    {
      header: 'INVENTORY STOCK',
      accessor: 'inventory',
      className: 'text-xs font-mono',
      render: (row) => (
        <span className={Number(row.inventory || row.stock_quantity || 0) <= 1 ? 'text-amber-700 font-bold' : 'text-slate-700 font-medium'}>
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

  // ==========================================
  // RENDER: DEDICATED STOREFRONT PRICEVIEW PAGE
  // ==========================================
  const renderProductDetailPage = () => {
    if (!viewItem) return null;

    const basePrice = Number(viewItem.price) || 0;
    const settlementFee = (basePrice * 1.15).toFixed(2);

    const cleanImg = (img) => typeof img === 'string' ? img.replace(/^https?:\/\/highlander-gold(?:and|-)?silver\.vercel\.app\//i, '/') : img;

    const rawImgs = Array.isArray(viewItem.additional_images) && viewItem.additional_images.length > 0
      ? viewItem.additional_images
      : (Array.isArray(viewItem.images) && viewItem.images.length > 0 ? viewItem.images : [viewItem.featured_image || '/assets/items/lot1_morgan_gold_gem.jpg']);

    const images = rawImgs.map(cleanImg);
    const activeImage = images[activeImageIndex] || cleanImg(viewItem.featured_image) || '/assets/items/lot1_morgan_gold_gem.jpg';

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Top Navigation & Action Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToCatalog}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Product Catalog</span>
            </button>
            <div className="text-xs text-slate-400 flex items-center gap-1 font-medium truncate max-w-md">
              <span>Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span>Catalog</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-800 font-semibold truncate">{viewItem.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchItems();
                toast.success('Product details synced with armory registry');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => handleEdit(viewItem)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071A35] hover:bg-[#0B2548] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#C9A23A]" />
              <span>Edit Product</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeletePrompt(viewItem)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Main Product Showcase Card (Storefront Numismatic Dossier UI) */}
        <div className="bg-white rounded-2xl border border-[#DCE5F0] shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Left Column: Visuals & Guarantee Badge */}
            <div className="lg:col-span-5 bg-[#FAF8F5] p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E8E2D8]">
              <div className="space-y-5">
                {/* Main Square Product Photo */}
                <div className="w-full aspect-square rounded-2xl bg-white border border-[#E5DAC8] shadow-sm overflow-hidden flex items-center justify-center p-3 relative group">
                  <img
                    src={activeImage}
                    alt={viewItem.title}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/items/lot1_morgan_gold_gem.jpg';
                    }}
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#071A35]/80 text-[#E5C365] border border-[#C9A23A]/30">
                    ITEM #{viewItem.lot_number}
                  </span>
                </div>

                {/* Thumbnails Gallery: Rendered ONLY if more than 1 photo exists */}
                {images.length > 1 && (
                  <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-white transition-all cursor-pointer shadow-2xs ${
                          activeImageIndex === idx 
                            ? 'border-[#C9A23A] ring-2 ring-[#C9A23A]/30 scale-105' 
                            : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${idx + 1}`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = viewItem.featured_image || '/assets/items/lot1_morgan_gold_gem.jpg';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Spec Pills */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-sans">
                  <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D8] text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Metal Purity</span>
                    <span className="font-bold text-slate-800 font-sans mt-0.5 block">{viewItem.purity || '.999 Pure Gold'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D8] text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Certified Grade</span>
                    <span className="font-bold text-[#071A35] font-sans mt-0.5 block">{viewItem.grade || 'NGC Gem Proof'}</span>
                  </div>
                </div>
              </div>

              {/* Verified Vault Badge */}
              <div className="mt-8 p-3.5 rounded-xl bg-[#F5EFE6] border border-[#E5DAC8] text-center text-xs">
                <div className="flex items-center justify-center gap-1.5 text-slate-800 font-bold font-sans">
                  <ShieldCheck className="w-4 h-4 text-[#C9A23A]" />
                  <span>Certified &amp; Inspected by HGS</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans block mt-0.5">
                  Bigfork, Montana Armory Inventory
                </span>
              </div>
            </div>

            {/* Right Column: Exact Client-side Numismatic Dossier & Priceview */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
              
              {/* Category Breadcrumb & Title */}
              <div>
                <span className="text-xs font-bold font-sans uppercase tracking-widest text-[#B58928]">
                  ITEM #{viewItem.lot_number} • {viewItem.category?.toUpperCase() || 'GOLD'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 uppercase tracking-tight mt-1 leading-snug">
                  {viewItem.title}
                </h1>
              </div>

              {/* Price Banner Card (Storefront Price & Settlement with 15% Fee) */}
              <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EBE3D7] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                    STOREFRONT PRICE
                  </span>
                  <span className="text-2xl font-bold font-mono text-slate-900 block mt-0.5">
                    ${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500 block font-sans mt-0.5">
                    Market Range: {viewItem.estimate_range || '$4,250.00 – $5,700.00 USD'}
                  </span>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#EBE3D7] pt-3 sm:pt-0 sm:pl-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B58928] block font-sans">
                    SETTLEMENT WITH 15% FEE
                  </span>
                  <span className="text-xl font-bold font-mono text-[#B58928] block mt-0.5">
                    ${Number(settlementFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500 block font-sans mt-0.5">
                    Montana 0% Sales Tax
                  </span>
                </div>
              </div>

              {/* Specification Table */}
              <div className="rounded-xl border border-[#DCE5F0] overflow-hidden text-xs font-sans">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-[#DCE5F0]">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold uppercase text-slate-500 w-1/3 bg-[#F8FAFC]">ITEM #</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">Item #{viewItem.lot_number}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold uppercase text-slate-500 bg-[#F8FAFC]">CLASSIFICATION</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{viewItem.category} ({viewItem.metal_type || viewItem.metal || 'Gold'})</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold uppercase text-slate-500 bg-[#F8FAFC]">PURITY / METAL</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{viewItem.purity || '.999 Pure Gold'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold uppercase text-slate-500 bg-[#F8FAFC]">CERTIFIED GRADE</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{viewItem.grade || 'NGC Ultra Cameo Gem Proof'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold uppercase text-slate-500 bg-[#F8FAFC]">MINTAGE / ISSUE</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{viewItem.mintage || '999 Units Worldwide'}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold uppercase text-slate-500 bg-[#F8FAFC]">FULFILLMENT</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">In-House Insured USPS Priority Packaging</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Product Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                  Numismatic Description
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                  {viewItem.description || viewItem.lead || 'Highlander premium physical coin specimen inspected and authenticated for collector custody.'}
                </p>
              </div>

              {/* Acquisition Terms Notice */}
              <div className="p-3.5 bg-amber-50/70 border-l-4 border-[#C9A23A] rounded-r-xl text-xs space-y-0.5">
                <span className="font-bold text-amber-900 block font-sans">
                  Acquisition Terms:
                </span>
                <p className="text-amber-800/90 font-sans leading-relaxed">
                  {viewItem.payment_note || 'High-value acquisition: Direct bank wire payment preferred with HGS wire credit applied on settlement.'}
                </p>
              </div>

              {/* HGS Sold Value Guarantee Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 font-sans">
                  <ShieldCheck className="w-4 h-4 text-[#C9A23A]" />
                  <span>HGS Sold Value Guarantee:</span>
                </div>
                <p className="text-slate-600 font-sans leading-relaxed">
                  If proof is presented that any purchased piece was overpriced based on current market state, HGS refunds the difference or accepts as-sold return.
                </p>
              </div>

              {/* Storefront & Inventory Status Pill */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Storefront Status:</span>
                  <StatusBadge status={viewItem.storefront_status || viewItem.status || 'Active'} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Available Units:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {viewItem.inventory ?? viewItem.stock_quantity ?? 1} unit(s)
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    );
  };

  // ==========================================
  // RENDER: MAIN CATALOG TABLE VIEW
  // ==========================================
  const renderCatalogTableView = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900">
              Product Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage collectible coins, precious metals, inventory, pricing, and storefront listings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCatalogCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export CSV
            </button>

            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071A35] hover:bg-[#0B2548] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C9A23A]" />
              Add Product
            </button>
          </div>
        </div>

        {/* Dynamic Data Table with onRowClick opening full Storefront Priceview Page */}
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
      </div>
    );
  };

  return (
    <>
      {viewItem ? renderProductDetailPage() : renderCatalogTableView()}

      {/* Slide-over Drawer for Add/Edit Product (Always mounted so Edit Product inside Page or Table works seamlessly) */}
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
    </>
  );
};
