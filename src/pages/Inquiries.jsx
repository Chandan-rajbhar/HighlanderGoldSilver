import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquareQuote,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Eye,
  Tag,
  Sparkles,
  Inbox
} from 'lucide-react';
import { inquiryService } from '../services/inquiryService';
import { DataTable } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { InquiryDetailModal } from '../components/forms/InquiryDetailModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

// De-jargon and clean up numismatic grading/technical terms
const cleanSubject = (rawTitle, lotNumber) => {
  if (!rawTitle) return 'General Inquiry';

  let title = rawTitle.trim();

  // Replace institutional liquidation jargon
  if (title.toUpperCase().includes('PRECIOUS METALS LIQUIDATION') || title.toUpperCase().includes('BUYBACK')) {
    return 'Precious Metals & Bullion Buyback';
  }

  // Remove "LOT #151: " or similar if already in title
  title = title.replace(/^LOT\s*#?\d+:\s*/i, '');

  // Remove technical numismatic grading abbreviations (MS-65 PL, AU-58, etc.)
  title = title.replace(/\b(MS|PR|PF|AU|XF|VF)-\d+(\s*PL)?\b/gi, '');

  // Clean trademark or verbose catalog strings
  title = title.replace(/™|®/g, '');
  title = title.replace(/George T\. Morgan Proposed \$100 Gold Union/i, '1876 Morgan $100 Gold Union');

  // Strip excessive whitespace
  title = title.replace(/\s+/g, ' ').trim();

  // If uppercase, convert to Title Case
  if (title === title.toUpperCase() && title.length > 3) {
    title = title.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  return title;
};

// Translate technical auction terms to intuitive human categories
const getInquiryCategory = (type) => {
  switch (type) {
    case 'Lot Acquisition':
      return {
        label: 'Purchase Request',
        style: 'bg-[#F4F9FD] text-[#155A96] border-[#D8EBFA]'
      };
    case 'Condition / Provenance':
      return {
        label: 'Item Details',
        style: 'bg-[#F1F5F9] text-slate-700 border-slate-200'
      };
    case 'Sell / Appraisal':
      return {
        label: 'Sell / Valuation',
        style: 'bg-[#FEF9EE] text-[#9A731C] border-[#FDE5A9]'
      };
    default:
      return {
        label: type || 'General Question',
        style: 'bg-slate-50 text-slate-600 border-slate-200'
      };
  }
};

// Extract initials for customer avatar
const getInitials = (name) => {
  if (!name) return 'CU';
  const clean = name.replace(/^(Col\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Clean formatted date and relative time
const formatInquiryDate = (dateString) => {
  if (!dateString) return { date: 'Recent', relative: '' };
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { date: 'Recent', relative: '' };

  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const now = new Date();
  const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let relative = '';
  if (diffHours < 24) {
    relative = diffHours <= 1 ? 'Just now' : `${diffHours}h ago`;
  } else if (diffDays === 1) {
    relative = 'Yesterday';
  } else if (diffDays < 7) {
    relative = `${diffDays}d ago`;
  }

  return { date, relative };
};

export const Inquiries = () => {
  const { toast } = useToast();

  const initialInqs = inquiryService.getInquiriesSync?.({
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortAsc: false
  }) || { data: [], total: 0, totalPages: 1 };

  const [inquiries, setInquiries] = useState(initialInqs.data);
  const [total, setTotal] = useState(initialInqs.total);
  const [totalPages, setTotalPages] = useState(initialInqs.totalPages);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(() => initialInqs.data.length === 0);

  // Status statistics for top KPI cards
  const [stats, setStats] = useState(() => {
    const raw = initialInqs.data || [];
    return {
      total: initialInqs.total || raw.length,
      newCount: raw.filter(i => i.status === 'New').length,
      inProgressCount: raw.filter(i => i.status === 'In Progress').length,
      repliedCount: raw.filter(i => i.status === 'Replied').length
    };
  });

  // Modals
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const s = await inquiryService.getInquiryStats();
      setStats(s);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

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
      if (res && res.data) {
        setInquiries(res.data);
        setTotal(res.total ?? res.data.length);
        setTotalPages(res.totalPages || 1);
      }
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
      fetchStats();
      toast.success(`Inquiry marked as ${newStatus}!`);
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
      fetchStats();
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
      className: 'whitespace-nowrap w-32',
      render: (row) => {
        const { date, relative } = formatInquiryDate(row.created_at);
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800">{date}</span>
            {relative && <span className="text-[11px] text-[#8C9BAE] font-medium">{relative}</span>}
          </div>
        );
      }
    },
    {
      header: 'Customer',
      accessor: 'inquirer_name',
      className: 'min-w-[200px]',
      render: (row) => {
        const initials = getInitials(row.inquirer_name);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E2EEF8] text-[#155A96] flex items-center justify-center text-xs font-bold shrink-0 border border-[#C5DCF0]">
              {initials}
            </div>
            <div className="min-w-0">
              <span
                onClick={() => handleView(row)}
                className="font-semibold text-slate-900 text-xs sm:text-sm block truncate hover:text-[#155A96] transition-colors cursor-pointer"
              >
                {row.inquirer_name}
              </span>
              <a
                href={`mailto:${row.email}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-slate-500 hover:text-[#155A96] hover:underline block truncate max-w-[180px]"
                title={row.email}
              >
                {row.email}
              </a>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Subject',
      accessor: 'lot_title',
      className: 'min-w-[210px] max-w-[280px]',
      render: (row) => {
        const subject = cleanSubject(row.lot_title, row.lot_number);
        const category = getInquiryCategory(row.inquiry_type);

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {row.lot_number && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F1F5F9] text-slate-600 border border-slate-200">
                  Item #{row.lot_number}
                </span>
              )}
              <span
                onClick={() => handleView(row)}
                className="font-medium text-slate-800 text-xs truncate max-w-[210px] hover:text-[#155A96] cursor-pointer transition-colors"
                title={subject}
              >
                {subject}
              </span>
            </div>
            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-medium border ${category.style}`}>
              {category.label}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Message',
      accessor: 'message',
      className: 'min-w-[220px] max-w-[340px]',
      render: (row) => (
        <div
          onClick={() => handleView(row)}
          className="flex items-start gap-2 cursor-pointer group py-0.5"
          title={row.message}
        >
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#155A96] shrink-0 mt-0.5 transition-colors" />
          <p className="text-xs text-slate-600 line-clamp-1 group-hover:text-slate-900 transition-colors font-sans">
            {row.message}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      className: 'whitespace-nowrap',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0B2D52]">
          Customer Inquiries
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Manage customer messages, product inquiries, and buyback requests.
        </p>
      </div>

      {/* Top Status KPI Summary Cards with Interactive Filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* All Inquiries */}
        <div
          onClick={() => { setStatus('All'); setPage(1); }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-sm ${status === 'All'
              ? 'border-[#155A96] ring-2 ring-[#155A96]/15 bg-[#F8FAFD]'
              : 'border-[#E2EEF8] hover:border-[#CBD5E1]'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              All Inquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F4F9FD] text-[#155A96] border border-[#D8EBFA] flex items-center justify-center">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-[#0B2D52] mt-2">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Total client submissions
          </span>
        </div>

        {/* New Messages */}
        <div
          onClick={() => { setStatus('New'); setPage(1); }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-sm ${status === 'New'
              ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20'
              : 'border-[#E2EEF8] hover:border-[#CBD5E1]'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              New Messages
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-emerald-700 mt-2">
            {stats.newCount}
          </p>
          <span className="text-[11px] text-emerald-600/90 mt-0.5 block font-medium">
            Requires initial review
          </span>
        </div>

        {/* In Progress */}
        <div
          onClick={() => { setStatus('In Progress'); setPage(1); }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-sm ${status === 'In Progress'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
              : 'border-[#E2EEF8] hover:border-[#CBD5E1]'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-amber-800 mt-2">
            {stats.inProgressCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Active conversations
          </span>
        </div>

        {/* Replied */}
        <div
          onClick={() => { setStatus('Replied'); setPage(1); }}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-sm ${status === 'Replied'
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20'
              : 'border-[#E2EEF8] hover:border-[#CBD5E1]'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              Replied
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-[#0B2D52] mt-2">
            {stats.repliedCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Responses sent
          </span>
        </div>
      </div>

      {/* Main Table */}
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
        searchPlaceholder="Search customer, email, or subject..."
        isLoading={isLoading}
        onView={handleView}
        onDelete={handleDeletePrompt}
        emptyTitle="No customer inquiries found"
        emptyDescription="When visitors submit questions or buyback requests from the storefront, they will appear here."
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
            className="w-40 text-xs font-medium"
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
        message="Are you sure you want to delete this customer inquiry? This record will be permanently removed."
        confirmText="Delete Inquiry"
        isLoading={isSaving}
      />
    </div>
  );
};

