import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Search, 
  Download,
  Eye,
  Filter
} from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { KpiCard } from '../components/ui/KpiCard';
import { Modal } from '../components/ui/Modal';
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

  // Selected Transaction for Detail Modal
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
      header: 'Collector / Customer',
      accessor: 'customer_name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block font-serif">{row.customer_name}</span>
          <span className="text-[11px] text-slate-500 font-mono">{row.customer_email}</span>
        </div>
      )
    },
    {
      header: 'Settlement Amount',
      accessor: 'amount',
      className: 'font-mono text-right',
      render: (row) => (
        <span className="font-bold text-aubergine font-mono text-sm">
          ${Number(row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Payment Method',
      accessor: 'payment_method',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
          {row.payment_method}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'payment_status',
      render: (row) => <StatusBadge status={row.payment_status} />
    },
    {
      header: 'Date & Time',
      accessor: 'created_at',
      className: 'text-xs text-slate-500 font-mono whitespace-nowrap',
      render: (row) => <span>{new Date(row.created_at).toLocaleString()}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Payments & Transactions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit bank wire deposits, PayPal settlements, gateway receipts, and refund ledgers.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Ledger (CSV)
        </button>
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
        searchPlaceholder="Search by transaction ID, order #, or collector..."
        isLoading={isLoading}
        onView={handleView}
        emptyTitle="No transactions recorded"
        emptyDescription="Settlements and gateway payments will automatically register here."
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>

            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
            >
              <option value="All">All Methods</option>
              <option value="Bank Wire">Bank Wire</option>
              <option value="PayPal">PayPal</option>
              <option value="Vault Pickup">Vault Pickup</option>
            </select>
          </div>
        }
      />

      {/* Transaction Dossier Modal */}
      {selectedTxn && (
        <Modal
          isOpen={Boolean(selectedTxn)}
          onClose={() => setSelectedTxn(null)}
          title={`Transaction: ${selectedTxn.transaction_id}`}
          subtitle="Highlander Settlement Gateway Record"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTxn.order_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Collector:</span>
                <span className="font-semibold text-slate-900">{selectedTxn.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Amount Settled:</span>
                <span className="font-mono font-bold text-base text-aubergine">
                  ${Number(selectedTxn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-medium text-slate-800">{selectedTxn.payment_method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gateway Ref:</span>
                <span className="font-mono text-slate-600">{selectedTxn.gateway_reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Settled On:</span>
                <span className="font-mono text-slate-600">{new Date(selectedTxn.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified and deposited into Highlander Gold & Silver escrow account.</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 bg-aubergine text-white text-xs font-semibold rounded-lg"
              >
                Close Record
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

