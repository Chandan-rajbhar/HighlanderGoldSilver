import React, { useState, useEffect, useCallback } from 'react';
import { 
  Tag, 
  Plus, 
  Percent, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Edit3, 
  Trash2, 
  Power
} from 'lucide-react';
import { couponService } from '../services/couponService';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { KpiCard } from '../components/ui/KpiCard';
import { CouponFormDrawer } from '../components/forms/CouponFormDrawer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const Coupons = () => {
  const { toast } = useToast();

  const [coupons, setCoupons] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    avgDiscount: 0
  });

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer & Dialog state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, stats] = await Promise.all([
        couponService.getCoupons({
          page,
          pageSize,
          search,
          status: status !== 'All' ? status : '',
          sortBy,
          sortAsc
        }),
        couponService.getCouponMetrics()
      ]);

      setCoupons(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setMetrics(stats);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      toast.error('Failed to load coupons.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, status, sortBy, sortAsc, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(columnKey);
      setSortAsc(true);
    }
  };

  const handleAddNew = () => {
    setSelectedCoupon(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleEdit = (cpn) => {
    setSelectedCoupon(cpn);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleDeletePrompt = (cpn) => {
    setSelectedCoupon(cpn);
    setIsConfirmOpen(true);
  };

  const handleToggleStatus = async (cpn) => {
    const nextStatus = cpn.status === 'Active' ? 'Disabled' : 'Active';
    try {
      const updated = await couponService.updateCoupon(cpn.id, { status: nextStatus });
      setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success(`Coupon ${cpn.code} is now ${nextStatus}!`);
    } catch (err) {
      console.error('Error toggling coupon:', err);
      toast.error('Failed to update status.');
    }
  };

  const handleSaveCoupon = async (formData) => {
    setIsSaving(true);
    try {
      if (drawerMode === 'edit' && selectedCoupon) {
        const updated = await couponService.updateCoupon(selectedCoupon.id, formData);
        setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success(`Coupon ${updated.code} updated!`);
      } else {
        const created = await couponService.createCoupon(formData);
        setCoupons(prev => [created, ...prev]);
        setTotal(prev => prev + 1);
        toast.success(`Coupon ${created.code} created!`);
      }
      setIsDrawerOpen(false);
      setSelectedCoupon(null);
    } catch (err) {
      console.error('Error saving coupon:', err);
      toast.error('Failed to save coupon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCoupon) return;
    setIsSaving(true);
    try {
      await couponService.deleteCoupon(selectedCoupon.id);
      setCoupons(prev => prev.filter(c => c.id !== selectedCoupon.id));
      setTotal(prev => Math.max(0, prev - 1));
      toast.success(`Coupon ${selectedCoupon.code} deleted.`);
      setIsConfirmOpen(false);
      setSelectedCoupon(null);
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Failed to delete coupon.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: 'Coupon Code',
      accessor: 'code',
      className: 'font-mono font-bold text-slate-900',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            {row.code}
          </span>
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium block">
          {row.description || '—'}
        </span>
      )
    },
    {
      header: 'Discount',
      accessor: 'discount_value',
      className: 'font-mono',
      render: (row) => (
        <span className="font-bold text-aubergine text-xs">
          {row.discount_type === 'Percentage' ? `${row.discount_value}% OFF` : `$${row.discount_value} OFF`}
        </span>
      )
    },
    {
      header: 'Min. Order',
      accessor: 'minimum_order_amount',
      className: 'font-mono text-right',
      render: (row) => (
        <span className="text-slate-600 text-xs">
          ${Number(row.minimum_order_amount || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Redemptions',
      accessor: 'redemptions_count',
      className: 'font-mono text-center',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800">
          {row.redemptions_count || 0} / {row.usage_limit || '∞'}
        </span>
      )
    },
    {
      header: 'Validity Period',
      accessor: 'expiry_date',
      className: 'font-mono text-xs text-slate-500 whitespace-nowrap',
      render: (row) => (
        <span>{row.start_date || 'N/A'} → {row.expiry_date || 'Open'}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          row.status === 'Active' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Coupons & Discounts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure promotional buyer discounts, volume credits, and collector incentives.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aubergine hover:bg-aubergine-light text-white text-xs font-bold font-serif uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold" />
          Add Coupon
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Coupons"
          value={metrics.totalCoupons}
          subtitle="All promotional campaigns"
          icon={Tag}
        />

        <KpiCard
          title="Active Promotions"
          value={metrics.activeCoupons}
          subtitle="Redeemable on storefront"
          icon={CheckCircle2}
          badgeText="Active"
        />

        <KpiCard
          title="Total Redemptions"
          value={metrics.totalRedemptions}
          subtitle="Orders with buyer credit"
          icon={Flame}
          trend="+14% this month"
          trendPositive={true}
        />

        <KpiCard
          title="Average Discount"
          value={`${metrics.avgDiscount}%`}
          subtitle="Campaign benchmark"
          icon={Percent}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={coupons}
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
        searchPlaceholder="Search coupon code or description..."
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        editLabel="Edit Coupon"
        emptyTitle="No coupons created"
        emptyDescription="Create promotional discount codes for your precious metals storefront."
        filterComponent={
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
            <option value="Expired">Expired</option>
          </select>
        }
      />

      {/* Slide-over Drawer */}
      <CouponFormDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveCoupon}
        mode={drawerMode}
        coupon={selectedCoupon}
        isLoading={isSaving}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon "${selectedCoupon?.code}"? Clients will no longer be able to apply this code.`}
        confirmText="Delete Coupon"
        isLoading={isSaving}
      />
    </div>
  );
};

