import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquareQuote,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  MoreVertical,
  Check,
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

// Custom row actions menu with smart dropup and 1-click status pills (Zero scrolling required)
const InquiryActionMenu = ({
  inquiry,
  rowIdx = 0,
  totalRows = 1,
  onView,
  onEdit,
  onReply,
  onUpdateStatus,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Auto-detect placement: if near the bottom or table is short, open upwards
  const isDropup = totalRows <= 3 || rowIdx >= Math.max(0, totalRows - 2);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectStatus = (newStatus) => {
    onUpdateStatus(newStatus);
    setIsOpen(false);
  };

  const statusConfig = {
    'New': { label: 'New', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    'In Progress': { label: 'In Progress', dot: 'bg-amber-500', text: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
    'Replied': { label: 'Replied', dot: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
    'Closed': { label: 'Closed', dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' }
  };

  const currentSt = statusConfig[inquiry.status] || statusConfig['New'];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 text-[#64748B] hover:text-[#111827] hover:bg-[#F5F8FC] rounded-lg transition-colors border border-transparent hover:border-[#DCE5F0] cursor-pointer"
        aria-label="Actions menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 ${
            isDropup ? 'bottom-full mb-1.5 origin-bottom-right' : 'top-full mt-1.5 origin-top-right'
          } w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 text-left font-sans`}
        >
          {/* Top Status Pill Preview */}
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${currentSt.bg} ${currentSt.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentSt.dot}`} />
              {currentSt.label}
            </span>
          </div>

          {/* View Details */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onView();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-left cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-500 shrink-0" />
            <span>View Details</span>
          </button>

          {/* Edit Inquiry */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-left cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Edit Inquiry</span>
          </button>

          {/* Reply / Chat */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onReply();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-left cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Reply / Chat</span>
          </button>

          <div className="border-t border-slate-100 my-1" />

          {/* CHANGE STATUS Header */}
          <div className="px-3 pt-1 pb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Change Status</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">1-click</span>
          </div>

          {/* Professional 2x2 Status Selector Grid (Zero scrolling required!) */}
          <div className="px-2.5 pb-1 grid grid-cols-2 gap-1.5">
            {[
              { id: 'New', label: 'New', dot: 'bg-emerald-500', active: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30' },
              { id: 'In Progress', label: 'In Progress', dot: 'bg-amber-500', active: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/30' },
              { id: 'Replied', label: 'Replied', dot: 'bg-sky-500', active: 'bg-sky-50 text-sky-800 border-sky-300 ring-1 ring-sky-400/30' },
              { id: 'Closed', label: 'Closed', dot: 'bg-slate-400', active: 'bg-slate-100 text-slate-800 border-slate-300 ring-1 ring-slate-400/30' },
            ].map(st => {
              const isSelected = inquiry.status === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleSelectStatus(st.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? `${st.active} shadow-2xs font-bold`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                    <span className="truncate">{st.label}</span>
                  </span>
                  {isSelected && <Check className="w-3 h-3 shrink-0 text-emerald-600" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 my-1" />

          {/* Delete */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
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

  // Modals / Slider
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

  // Professional column width proportions:
  // TICKET ID (14%) | SENDER NAME (18%) | EMAIL (20%) | CONTACT NO. (15%) | SUBJECT & INQUIRY (20%) | STATUS (11%) | ACTIONS (2%)
  const columns = [
    {
      header: 'Ticket ID',
      accessor: 'id',
      sortable: true,
      className: 'w-[14%] min-w-[130px] px-5 py-4',
      render: (row) => (
        <span
          onClick={() => handleView(row)}
          className="font-mono text-xs font-bold text-[#0B2D52] hover:text-[#155A96] cursor-pointer transition-colors bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/80 inline-block"
        >
          #{row.id}
        </span>
      )
    },
    {
      header: 'Sender Name',
      accessor: 'inquirer_name',
      sortable: true,
      className: 'w-[18%] min-w-[180px] px-5 py-4',
      render: (row) => {
        const initials = getInitials(row.inquirer_name);
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E2EEF8] text-[#155A96] flex items-center justify-center text-xs font-bold shrink-0 border border-[#C5DCF0]">
              {initials}
            </div>
            <span
              onClick={() => handleView(row)}
              className="font-semibold text-slate-900 text-xs sm:text-sm block truncate hover:text-[#155A96] transition-colors cursor-pointer"
            >
              {row.inquirer_name}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
      className: 'w-[20%] min-w-[190px] px-5 py-4',
      render: (row) => (
        <a
          href={`mailto:${row.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-slate-600 hover:text-[#155A96] hover:underline block truncate max-w-[200px]"
          title={row.email}
        >
          {row.email}
        </a>
      )
    },
    {
      header: 'Contact No.',
      accessor: 'phone',
      sortable: false,
      className: 'w-[15%] min-w-[140px] px-5 py-4',
      render: (row) => row.phone ? (
        <a
          href={`tel:${row.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-medium text-slate-700 hover:text-[#155A96] hover:underline font-mono"
        >
          {row.phone}
        </a>
      ) : (
        <span className="text-xs text-slate-400 font-mono">—</span>
      )
    },
    {
      header: 'Subject & Inquiry',
      accessor: 'lot_title',
      sortable: false,
      className: 'w-[20%] min-w-[210px] px-5 py-4',
      render: (row) => {
        const subject = cleanSubject(row.lot_title, row.lot_number);

        return (
          <span
            onClick={() => handleView(row)}
            className="font-medium text-slate-800 text-xs sm:text-sm truncate block max-w-sm hover:text-[#155A96] cursor-pointer transition-colors py-0.5"
            title={subject}
          >
            {subject}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      className: 'w-[11%] min-w-[110px] px-5 py-4',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      className: 'w-[2%] min-w-[50px] text-right px-5 py-4',
      render: (row, _val, rowIdx, totalRows) => (
        <InquiryActionMenu
          inquiry={row}
          rowIdx={rowIdx}
          totalRows={totalRows}
          onView={() => handleView(row)}
          onEdit={() => handleView(row)}
          onReply={() => handleView(row)}
          onUpdateStatus={(newStatus) => handleUpdateStatus(row.id, newStatus)}
          onDelete={() => handleDeletePrompt(row)}
        />
      )
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

      {/* Main Table with Professional Fixed Proportions */}
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
        onRowClick={handleView}
        tableClassName="table-fixed min-w-[960px]"
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

      {/* Right-Side Slider Drawer for Inquiry Details & Reply */}
      <InquiryDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedInquiry(null);
        }}
        inquiry={selectedInquiry}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeletePrompt}
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
