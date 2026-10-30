import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquareQuote,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Eye,
  Trash2,
  RefreshCw,
  MoreVertical,
  Check,
  Tag,
  Sparkles,
  Inbox,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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

/**
 * Enterprise Portal Action Menu
 * Renders into document.body to prevent table overflow clipping and z-index issues.
 * Calculates dynamic positioning based on viewport space.
 */
const InquiryActionMenu = ({
  inquiry,
  onView,
  onReply,
  onUpdateStatus,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, isUpward: false });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 236;
    const menuHeight = 252;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Open upward if space below is limited and space above is greater
    const isUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    let top = isUpward ? rect.top - 6 : rect.bottom + 6;
    // Align right edge of menu to right edge of trigger button
    let left = rect.right - menuWidth;

    // Viewport boundaries clamp
    if (left < 12) left = 12;
    if (left + menuWidth > viewportWidth - 12) {
      left = viewportWidth - menuWidth - 12;
    }

    setCoords({ top, left, isUpward });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      calculatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      calculatePosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
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
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
          isOpen 
            ? 'bg-[#155A96]/10 text-[#155A96] border-[#155A96]/30' 
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent hover:border-slate-200'
        }`}
        aria-label="Actions menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Render via React Portal to prevent container clipping */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop layer */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          {/* Floating Dropdown Panel */}
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.isUpward ? 'auto' : `${coords.top}px`,
              bottom: coords.isUpward ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: '236px',
              zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150 text-left font-sans select-none"
          >
            {/* Top Status Pill Preview */}
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Inquiry
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${currentSt.bg} ${currentSt.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentSt.dot}`} />
                {currentSt.label}
              </span>
            </div>

            {/* View Inquiry */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onView();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-left cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-500 shrink-0" />
              <span>View Inquiry</span>
            </button>

            {/* Reply to Customer */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onReply();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-800 hover:bg-slate-50 transition-colors font-medium text-left cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#155A96] shrink-0" />
              <span>Reply to Customer</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            {/* CHANGE STATUS Header */}
            <div className="px-3.5 pt-1 pb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-slate-400" />
                <span>Change Status</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">1-click</span>
            </div>

            {/* 1-Click Status Grid (Zero scrolling needed) */}
            <div className="px-3 pb-1.5 grid grid-cols-2 gap-1.5">
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
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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

            {/* Delete Inquiry (Visually separated subtle red) */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Delete Inquiry</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </>
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

  // Slider Drawer & Confirm Dialog
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

  // Enterprise Layout strictly adhering to specification:
  // Ticket ID: 12% | Sender Name: 15% | Email: 19% | Contact Number: 13% | Subject & Inquiry: 25% | Status: 10% | Actions: 6%
  // Sum = 100% (No horizontal scrollbar, perfect enterprise alignment)
  const columns = [
    {
      header: 'Ticket ID',
      accessor: 'id',
      sortable: true,
      className: 'w-[12%] px-4 py-3.5',
      render: (row) => (
        <span
          onClick={() => handleView(row)}
          className="font-mono text-xs font-bold text-[#0B2D52] hover:text-[#155A96] cursor-pointer transition-colors bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/80 inline-block truncate max-w-full"
          title={`Ticket #${row.id}`}
        >
          #{row.id}
        </span>
      )
    },
    {
      header: 'Sender Name',
      accessor: 'inquirer_name',
      sortable: true,
      className: 'w-[15%] px-4 py-3.5',
      render: (row) => {
        const initials = getInitials(row.inquirer_name);
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#E2EEF8] text-[#155A96] flex items-center justify-center text-xs font-bold shrink-0 border border-[#C5DCF0]">
              {initials}
            </div>
            <span
              onClick={() => handleView(row)}
              className="font-semibold text-slate-900 text-xs sm:text-sm truncate hover:text-[#155A96] transition-colors cursor-pointer"
              title={row.inquirer_name}
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
      className: 'w-[19%] px-4 py-3.5',
      render: (row) => (
        <a
          href={`mailto:${row.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-slate-600 hover:text-[#155A96] hover:underline truncate block"
          title={row.email}
        >
          {row.email}
        </a>
      )
    },
    {
      header: 'Contact Number',
      accessor: 'phone',
      sortable: false,
      className: 'w-[13%] px-4 py-3.5',
      render: (row) => row.phone ? (
        <a
          href={`tel:${row.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-medium text-slate-700 hover:text-[#155A96] hover:underline font-mono truncate block"
          title={row.phone}
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
      className: 'w-[25%] px-4 py-3.5',
      render: (row) => {
        const subject = cleanSubject(row.lot_title, row.lot_number);

        return (
          <span
            onClick={() => handleView(row)}
            className="font-medium text-slate-800 text-xs sm:text-sm truncate block hover:text-[#155A96] cursor-pointer transition-colors"
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
      className: 'w-[10%] px-4 py-3.5',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      className: 'w-[6%] text-right px-4 py-3.5',
      render: (row) => (
        <div className="flex items-center justify-end">
          <InquiryActionMenu
            inquiry={row}
            onView={() => handleView(row)}
            onReply={() => handleView(row)}
            onUpdateStatus={(newStatus) => handleUpdateStatus(row.id, newStatus)}
            onDelete={() => handleDeletePrompt(row)}
          />
        </div>
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

      {/* Main Table with Exact Suggested Proportions (100% Fit, No Scrollbar) */}
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
        tableClassName="w-full table-fixed"
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
