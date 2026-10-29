import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  ShoppingBag, 
  SlidersHorizontal,
  Copy,
  Eye, 
  Edit3, 
  Trash2,
  Printer,
  Ban
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { inventoryService } from '../services/inventoryService';
import { DataTable } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { OrderFormModal } from '../components/forms/OrderFormModal';
import { OrderDetailDrawer } from '../components/forms/OrderDetailDrawer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const Orders = () => {
  const { toast } = useToast();

  const initialOrders = orderService.getOrdersSync?.({
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortAsc: false
  }) || { data: [], total: 0, totalPages: 1 };

  const [orders, setOrders] = useState(initialOrders.data);
  const [total, setTotal] = useState(initialOrders.total);
  const [totalPages, setTotalPages] = useState(initialOrders.totalPages);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [orderStatus, setOrderStatus] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(() => initialOrders.data.length === 0);

  // Available inventory items for modal
  const [inventoryItems, setInventoryItems] = useState([]);

  // Drawers and Modals
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    inventoryService.getInventory({ pageSize: 50 }).then(res => setInventoryItems(res.data)).catch(console.error);
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getOrders({
        page,
        pageSize,
        search,
        paymentStatus: paymentStatus !== 'All' ? paymentStatus : '',
        fulfillmentStatus: orderStatus !== 'All' ? orderStatus : '',
        sortBy,
        sortAsc
      });
      if (res && res.data && res.data.length > 0) {
        setOrders(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, paymentStatus, orderStatus, sortBy, sortAsc, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(columnKey);
      setSortAsc(true);
    }
  };

  const handleAddNew = () => {
    setSelectedOrder(null);
    setIsFormOpen(true);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setIsDetailDrawerOpen(true);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  const handleDeletePrompt = (order) => {
    setSelectedOrder(order);
    setIsConfirmOpen(true);
  };

  const handleUpdateStatus = async (orderOrId, newStatus) => {
    const orderId = typeof orderOrId === 'object' ? (orderOrId.id || orderOrId.order_id || orderOrId.order_number) : orderOrId;
    const orderNum = typeof orderOrId === 'object' ? (orderOrId.order_number || orderOrId.order_id || orderId) : orderId;
    try {
      const updated = await orderService.updateOrder(orderId, { 
        order_status: newStatus,
        fulfillment_status: newStatus
      });
      setOrders(prev => prev.map(o => (o.id === updated.id || o.order_id === orderId || o.order_number === orderId) ? { ...o, ...updated, fulfillment_status: newStatus, order_status: newStatus } : o));
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.order_id === orderId || selectedOrder.order_number === orderId)) {
        setSelectedOrder(prev => ({ ...prev, ...updated, fulfillment_status: newStatus, order_status: newStatus }));
      }
      toast.success(`Order #${orderNum} marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update status.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    await handleUpdateStatus({ id: orderId }, 'Cancelled');
  };

  const handleSaveOrder = async (formData) => {
    setIsSaving(true);
    try {
      if (selectedOrder) {
        const updated = await orderService.updateOrder(selectedOrder.id, formData);
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        toast.success(`Order #${updated.order_number} updated!`);
      } else {
        const created = await orderService.createOrder(formData);
        setOrders(prev => [created, ...prev]);
        setTotal(prev => prev + 1);
        toast.success(`Order #${created.order_number} recorded!`);
      }
      setIsFormOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error saving order:', err);
      toast.error('Failed to save order.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      await orderService.deleteOrder(selectedOrder.id);
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      setTotal(prev => Math.max(0, prev - 1));
      toast.success(`Order #${selectedOrder.order_number} deleted.`);
      setIsConfirmOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error('Failed to delete order.');
    } finally {
      setIsSaving(false);
    }
  };

  // Columns layout matching user reference
  const columns = [
    {
      header: 'ORDER ID',
      accessor: 'order_number',
      className: 'font-mono text-slate-900',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono">
          <span 
            className="font-mono text-xs font-bold text-slate-900 hover:text-[#C9A23A] transition-colors cursor-pointer"
            onClick={() => handleView(row)}
          >
            #{row.order_number || row.order_id}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard?.writeText(row.order_number || row.order_id);
              toast.success('Order ID copied');
            }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
            title="Copy ID"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      )
    },
    {
      header: 'CLIENT / PATIENT',
      accessor: 'customer_name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block font-sans">{row.customer_name}</span>
          <span className="text-[11px] text-slate-500 font-mono">{row.customer_email}</span>
        </div>
      )
    },
    {
      header: 'PURCHASED ITEMS',
      accessor: 'items',
      className: 'min-w-[200px]',
      render: (row) => {
        const items = row.items || [];
        if (items.length === 0) return <span className="text-slate-400 text-xs">1x Rare Coin Specimen</span>;
        const first = items[0];
        const firstTitle = first.title || first.name || `Lot #${first.lot_number || 1}`;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-800 truncate max-w-[220px]">
              {first.quantity || 1}x {firstTitle}
            </span>
            {items.length > 1 && (
              <span className="text-[10px] text-[#C9A23A] font-semibold font-mono mt-0.5">
                +{items.length - 1} additional item(s)
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'TOTAL AMOUNT',
      accessor: 'total_settlement',
      className: 'font-mono text-left',
      render: (row) => (
        <span className="font-bold text-emerald-600 font-mono text-sm">
          ${Number(row.total_settlement || row.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'PAYMENT STATUS',
      accessor: 'payment_status',
      render: (row) => <StatusBadge status={row.payment_status} />
    },
    {
      header: 'ORDER STATUS',
      accessor: 'fulfillment_status',
      render: (row) => <StatusBadge status={row.fulfillment_status || row.order_status || 'Processing'} />
    },
    {
      header: 'DATE',
      accessor: 'created_at',
      className: 'text-xs text-slate-600 font-mono whitespace-nowrap',
      render: (row) => <span>{new Date(row.created_at).toISOString().split('T')[0]}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900">
            Orders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fulfill online customer orders, review line items, and manage customer shipments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => toast.info('Order status pipeline: Processing → Shipped → Delivered')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Manage Statuses
          </button>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071A35] hover:bg-[#0B2548] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C9A23A]" />
            Add Order
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
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
        searchPlaceholder="Search by order ID, client name, tracking number..."
        isLoading={isLoading}
        onRowClick={handleView}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        viewLabel="View Order Details"
        editLabel="Edit Order"
        deleteLabel="Delete Order"
        emptyTitle="No orders found"
        emptyDescription="Customer orders and wire transactions will appear here."
        filterComponent={
          <div className="flex items-center gap-2">
            <Select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: 'All Order Status' },
                { value: 'Processing', label: 'Processing' },
                { value: 'Shipped', label: 'Shipped' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Cancelled', label: 'Cancelled' }
              ]}
            />

            <Select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: 'All Payment Status' },
                { value: 'Settled', label: 'Settled' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Refunded', label: 'Refunded' }
              ]}
            />
          </div>
        }
      />

      {/* Right-Side Slide-Over Drawer for Order Details */}
      <OrderDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        onCancelOrder={handleCancelOrder}
      />

      {/* Order Create / Edit Modal */}
      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedOrder(null);
        }}
        onSave={handleSaveOrder}
        initialData={selectedOrder}
        availableItems={inventoryItems}
        isLoading={isSaving}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Order Record"
        message={`Are you sure you want to delete Order #${selectedOrder?.order_number || selectedOrder?.order_id}?`}
        confirmText="Delete Order"
        isLoading={isSaving}
      />
    </div>
  );
};
