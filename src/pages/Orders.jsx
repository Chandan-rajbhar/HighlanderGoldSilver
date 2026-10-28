import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  ShoppingBag, 
  DollarSign, 
  Download, 
  Eye, 
  Edit3, 
  Trash2,
  Printer,
  Ban
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { inventoryService } from '../services/inventoryService';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { OrderFormModal } from '../components/forms/OrderFormModal';
import { OrderDetailDrawer } from '../components/forms/OrderDetailDrawer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const Orders = () => {
  const { toast } = useToast();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [orderStatus, setOrderStatus] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const updated = await orderService.updateOrder(orderId, { 
        order_status: newStatus,
        fulfillment_status: newStatus
      });
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update status.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    await handleUpdateStatus(orderId, 'Cancelled');
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

  const exportCSV = () => {
    const headers = 'Order ID,Customer,Email,Total,Payment Method,Payment Status,Order Status,Date\n';
    const rows = orders.map(o => 
      `"${o.order_number || o.order_id}","${o.customer_name}","${o.customer_email}",${o.total_settlement || o.total_amount},"${o.payment_method}","${o.payment_status}","${o.fulfillment_status || o.order_status}","${o.created_at}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hgs-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported to CSV');
  };

  // Columns inspired by BeautyOasis Orders reference
  const columns = [
    {
      header: 'Order ID',
      accessor: 'order_number',
      className: 'font-mono font-bold text-slate-900',
      render: (row) => (
        <span 
          className="font-mono font-bold text-slate-900 text-xs hover:text-aubergine cursor-pointer"
          onClick={() => handleView(row)}
        >
          {row.order_number || row.order_id}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 text-sm block font-serif">{row.customer_name}</span>
          <span className="text-[11px] text-slate-500 font-mono">{row.customer_email}</span>
        </div>
      )
    },
    {
      header: 'Purchased Items',
      accessor: 'items',
      className: 'min-w-[180px]',
      render: (row) => {
        const items = row.items || [];
        if (items.length === 0) return <span className="text-slate-400 text-xs">Standard Lot</span>;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-800 truncate max-w-xs">
              {items[0].title || `Lot #${items[0].lot_number}`}
            </span>
            {items.length > 1 && (
              <span className="text-[10px] text-gold-dark font-medium font-mono">
                +{items.length - 1} additional item(s)
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Order Date',
      accessor: 'created_at',
      className: 'text-xs text-slate-500 font-mono whitespace-nowrap',
      render: (row) => <span>{new Date(row.created_at).toLocaleDateString()}</span>
    },
    {
      header: 'Total Amount',
      accessor: 'total_settlement',
      className: 'font-mono text-right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-aubergine font-mono text-sm block">
            ${Number(row.total_settlement || row.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">incl. 15% BP</span>
        </div>
      )
    },
    {
      header: 'Payment Status',
      accessor: 'payment_status',
      render: (row) => <StatusBadge status={row.payment_status} />
    },
    {
      header: 'Order Status',
      accessor: 'fulfillment_status',
      render: (row) => <StatusBadge status={row.fulfillment_status || row.order_status || 'Processing'} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Orders & Settlements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage collector acquisitions, wire invoices, PayPal settlements, and order dispatching.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aubergine hover:bg-aubergine-light text-white text-xs font-bold font-serif uppercase tracking-wider transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-gold" />
            Record Order
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
        searchPlaceholder="Search order ID, customer name, or email..."
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        editLabel="Edit Order"
        emptyTitle="No orders found"
        emptyDescription="Customer orders and wire transactions will appear here."
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
            >
              <option value="All">All Order Statuses</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Vault Dispatch">Vault Dispatch</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Settled">Settled</option>
              <option value="Pending Wire">Pending Wire</option>
              <option value="Refunded">Refunded</option>
            </select>
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
