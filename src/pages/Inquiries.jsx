import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquareQuote, Mail, Phone, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { DataTable } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { InquiryDetailModal } from '../components/forms/InquiryDetailModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const Inquiries = () => {
  const { toast } = useToast();

  const [inquiries, setInquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await inquiryService.getInquiries({
        page,
        pageSize,
        search,
        status: status !== 'All' ? status : '',
        sortBy,
        sortAsc
      });
      setInquiries(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      toast.error('Failed to load inquiries.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, status, sortBy, sortAsc, toast]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(columnKey);
      setSortAsc(true);
    }
  };

  const handleView = (inq) => {
    setSelectedInquiry(inq);
    setIsDetailOpen(true);
  };

  const handleDeletePrompt = (inq) => {
    setSelectedInquiry(inq);
    setIsConfirmOpen(true);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updated = await inquiryService.updateInquiryStatus(id, newStatus);
      setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
      toast.success(`Inquiry status marked as ${newStatus}!`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update inquiry status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInquiry) return;
    setIsSaving(true);
    try {
      await inquiryService.deleteInquiry(selectedInquiry.id);
      setInquiries(prev => prev.filter(i => i.id !== selectedInquiry.id));
      setTotal(prev => Math.max(0, prev - 1));
      toast.success('Inquiry record deleted.');
      setIsConfirmOpen(false);
      setSelectedInquiry(null);
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      toast.error('Failed to delete inquiry.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'created_at',
      className: 'whitespace-nowrap text-xs text-slate-500 font-mono',
      render: (row) => (
        <span>{new Date(row.created_at).toLocaleDateString()}</span>
      )
    },
    {
      header: 'Inquirer',
      accessor: 'inquirer_name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 text-sm block">{row.inquirer_name}</span>
          <span className="text-[11px] text-slate-500 font-mono">{row.email}</span>
        </div>
      )
    },
    {
      header: 'Lot / Topic',
      accessor: 'lot_title',
      className: 'min-w-[220px]',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800 text-xs font-sans">
            {row.lot_number ? `Lot #${row.lot_number}: ` : ''}{row.lot_title}
          </span>
          <span className="text-[11px] text-slate-400">
            {row.inquiry_type}
          </span>
        </div>
      )
    },
    {
      header: 'Message Preview',
      accessor: 'message',
      className: 'max-w-[300px]',
      render: (row) => (
        <p className="text-xs text-slate-600 truncate">
          "{row.message}"
        </p>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900">
          Acquisition Inquiries & Buybacks
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Incoming client inquiries from the storefront contact form and private view requests.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={inquiries}
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
        searchPlaceholder="Search inquirer name, email, or lot title..."
        isLoading={isLoading}
        onView={handleView}
        onDelete={handleDeletePrompt}
        emptyTitle="No inquiries received"
        emptyDescription="When visitors submit questions or wire acquisition requests on highlander-gold-silver.vercel.app, they will appear here."
        filterComponent={
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'New', label: 'New' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Replied', label: 'Replied' },
              { value: 'Closed', label: 'Closed' }
            ]}
          />
        }
      />

      <InquiryDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedInquiry(null);
        }}
        inquiry={selectedInquiry}
        onUpdateStatus={handleUpdateStatus}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedInquiry(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Inquiry"
        message="Are you sure you want to delete this client inquiry? This record will be permanently removed."
        confirmText="Delete Inquiry"
        isLoading={isSaving}
      />
    </div>
  );
};

