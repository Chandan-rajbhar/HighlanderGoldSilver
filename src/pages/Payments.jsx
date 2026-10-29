import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Download,
  X,
  User,
  Calendar,
  Hash,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { DataTable } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { KpiCard } from '../components/ui/KpiCard';
import { useToast } from '../context/ToastContext';

export const Payments = () => {
  const { toast } = useToast();

  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCollected: 0,
    successfulCount: 0,
    pendingCount: 0,
    refundedTotal: 0
  });

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Transaction for Detail Slide-Over Drawer
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, stats] = await Promise.all([
        paymentService.getPayments({
          page,
          pageSize,
          search,
          paymentStatus: paymentStatus !== 'All' ? paymentStatus : '',
          paymentMethod: paymentMethod !== 'All' ? paymentMethod : '',
          sortBy,
          sortAsc
        }),
        paymentService.getPaymentMetrics()
      ]);

      setPayments(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setMetrics(stats);
    } catch (err) {
      console.error('Error fetching payments:', err);
      toast.error('Failed to load transaction records.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, paymentStatus, paymentMethod, sortBy, sortAsc, toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(columnKey);
      setSortAsc(true);
    }
  };

  const handleView = (txn) => {
    setSelectedTxn(txn);
  };

  const exportCSV = () => {
    const headers = 'Transaction ID,Order ID,Customer,Email,Amount,Method,Status,Date\n';
    const rows = payments.map(p => 
      `"${p.transaction_id}","${p.order_id}","${p.customer_name}","${p.customer_email}",${p.amount},"${p.payment_method}","${p.payment_status}","${p.created_at}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hgs-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions exported to CSV');
  };

  const handleStatusChange = async (txn, newStatus) => {
    try {
      await paymentService.updatePaymentStatus(txn.id || txn.transaction_id, newStatus);
      toast.success(`Transaction ${txn.transaction_id} marked as ${newStatus}`);
      if (selectedTxn && (selectedTxn.id === txn.id || selectedTxn.transaction_id === txn.transaction_id)) {
        setSelectedTxn(prev => ({ ...prev, payment_status: newStatus }));
      }
      fetchPayments();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update payment status');
    }
  };

  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'transaction_id',
      className: 'font-mono font-bold text-slate-900',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {row.transaction_id}
        </span>
      )
    },
    {
      header: 'Order Reference',
      accessor: 'order_id',
      className: 'font-mono text-slate-700 text-xs',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
          {row.order_id}
        </span>
      )
    },
    {
      header: 'Customer Name',
      accessor: 'customer_name',
      render: (row) => (
        <span className="font-bold text-slate-900 text-sm font-sans" title={row.customer_email}>
          {row.customer_name}
        </span>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      className: 'font-mono text-left',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono text-sm">
          ${Number(row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'payment_status',
      render: (row) => <StatusBadge status={row.payment_status} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900">
            Payments & Transactions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit bank wire deposits, PayPal settlements, gateway receipts, and refund ledgers.
          </p>
        </div>

        
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Collected Revenue"
          value={metrics.totalCollected}
          isCurrency={true}
          subtitle="Processed settlements"
          icon={DollarSign}
          trend="+100%"
          trendPositive={true}
        />

        <KpiCard
          title="Successful Payments"
          value={metrics.successfulCount}
          subtitle="Completed transactions"
          icon={CheckCircle2}
          badgeText="Verified"
        />

        <KpiCard
          title="Pending Payments"
          value={metrics.pendingCount}
          subtitle="Awaiting wire clearance"
          icon={Clock}
          badgeText={metrics.pendingCount > 0 ? 'Pending' : 'Clear'}
        />

        <KpiCard
          title="Refunded Amount"
          value={metrics.refundedTotal}
          isCurrency={true}
          subtitle="0 recorded chargebacks"
          icon={RotateCcw}
          badgeText="$0.00"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={payments}
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
        searchPlaceholder="Search by transaction ID, order #, or customer..."
        isLoading={isLoading}
        onRowClick={handleView}
        onView={handleView}
        onChangeStatus={handleStatusChange}
        statusOptions={['Completed', 'Pending', 'Refunded']}
        statusField="payment_status"
        emptyTitle="No transactions recorded"
        emptyDescription="Settlements and gateway payments will automatically register here."
        filterComponent={
          <div className="flex items-center gap-2">
            <Select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Refunded', label: 'Refunded' }
              ]}
            />

            <Select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: 'All Methods' },
                { value: 'Bank Wire', label: 'Bank Wire' },
                { value: 'PayPal', label: 'PayPal' },
                { value: 'Vault Pickup', label: 'Vault Pickup' }
              ]}
            />
          </div>
        }
      />

      {/* Transaction Slide-Over Drawer from Right */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedTxn(null)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 bg-[#071A35] text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30">
                      {selectedTxn.transaction_id}
                    </span>
                    <span className="text-xs text-slate-300">
                      Settlement Dossier
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-sans text-white mt-1">
                    Payment Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Amount Banner with Status Selector */}
                <div className="p-5 rounded-2xl bg-[#F5F8FC] border border-[#DCE5F0] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Amount</span>
                    <span className="text-2xl font-bold font-mono text-[#071A35]">
                      ${Number(selectedTxn.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <StatusBadge status={selectedTxn.payment_status} />
                </div>

                {/* Key Settlement Information */}
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                  <div className="px-4 py-3 bg-slate-50/70">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Transaction Summary
                    </span>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      Order Reference
                    </span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {selectedTxn.order_id}
                    </span>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Payment Method
                    </span>
                    <span className="font-semibold text-slate-900 px-2.5 py-0.5 rounded-md bg-slate-100 text-xs">
                      {selectedTxn.payment_method || 'Bank Wire'}
                    </span>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Date & Time
                    </span>
                    <span className="font-mono text-slate-800 font-medium">
                      {new Date(selectedTxn.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Gateway Reference</span>
                    <span className="font-mono text-slate-600">
                      {selectedTxn.gateway_reference || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Customer Details Card */}
                <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <User className="w-4 h-4 text-slate-400" />
                    Customer Details
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-sans">
                      {selectedTxn.customer_name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedTxn.customer_email}
                    </p>
                  </div>
                </div>



              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="px-5 py-2.5 bg-[#071A35] hover:bg-[#0B2548] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Close Record
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
