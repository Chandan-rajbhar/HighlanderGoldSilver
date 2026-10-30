import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Send, 
  Check, 
  Clock, 
  MessageSquare, 
  User, 
  Tag, 
  Trash2, 
  Copy, 
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

const INQUIRY_STATUSES = ['New', 'In Progress', 'Replied', 'Closed'];

export const InquiryDetailModal = ({
  isOpen,
  onClose,
  inquiry,
  onUpdateStatus,
  onDelete
}) => {
  if (!isOpen || !inquiry) return null;

  const [selectedStatus, setSelectedStatus] = useState(inquiry.status || 'New');
  const [replyText, setReplyText] = useState('');
  const [adminNotes, setAdminNotes] = useState(inquiry.admin_notes || '');
  const [copiedField, setCopiedField] = useState(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (inquiry) {
      setSelectedStatus(inquiry.status || 'New');
      setAdminNotes(inquiry.admin_notes || '');
      setReplyText(`Hello ${inquiry.inquirer_name || 'Customer'},\n\nThank you for reaching out to Highlander Gold & Silver regarding ${inquiry.lot_title || 'our catalog'}.\n\n\n\nBest regards,\nAlexander MacLeod\nHighlander Gold & Silver\nBigfork, Montana | (406) 407-0281`);
      setNotesSaved(false);
    }
  }, [inquiry]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    if (onUpdateStatus) {
      onUpdateStatus(inquiry.id, status);
    }
  };

  const handleSendReply = () => {
    const subject = encodeURIComponent(`RE: Highlander Gold & Silver Inquiry - ${inquiry.lot_title || 'General Inquiry'}`);
    const body = encodeURIComponent(replyText);
    window.open(`mailto:${inquiry.email}?subject=${subject}&body=${body}`);
    handleStatusChange('Replied');
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      // If service supports updating notes
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const displayTitle = inquiry.lot_title || 'General Customer Question';
  const createdDate = inquiry.created_at ? new Date(inquiry.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }) : 'Recently';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Dark backdrop overlay */}
      <div 
        className="fixed inset-0 bg-[#0B2348]/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        {/* Right side slide-over panel */}
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
          
          {/* Header */}
          <div 
            className="px-6 py-5 text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0"
            style={{ background: 'linear-gradient(135deg, #0B2B4E 0%, #114275 100%)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#C9A23A] font-bold px-2 py-0.5 rounded bg-[#C9A23A]/15 border border-[#C9A23A]/30">
                  #{inquiry.id}
                </span>
                <span className="text-xs text-slate-300">
                  {createdDate}
                </span>
              </div>
              <h2 className="text-lg font-bold font-sans tracking-wide text-white mt-1">
                Customer Inquiry Dossier
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Review message, client contact information, and dispatch reply.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            
            {/* Status & Quick Action Bar */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Inquiry Status
                </span>
                <StatusBadge status={selectedStatus} />
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {INQUIRY_STATUSES.map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      selectedStatus === st
                        ? 'bg-[#0B2D52] text-white border-[#0B2D52] font-semibold shadow-xs ring-2 ring-[#0B2D52]/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Sender / Customer Info Card */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#155A96]" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Sender Information
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Client Record
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Sender Name</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {inquiry.inquirer_name || 'Anonymous Visitor'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Inquiry Type</span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F4F9FD] text-[#155A96] border border-[#D8EBFA]">
                    {inquiry.inquiry_type || 'General'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Email Address</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <a 
                      href={`mailto:${inquiry.email}`} 
                      className="font-medium text-[#155A96] hover:underline truncate"
                    >
                      {inquiry.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(inquiry.email, 'email')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Contact Number</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {inquiry.phone ? (
                      <>
                        <a 
                          href={`tel:${inquiry.phone}`} 
                          className="font-medium text-slate-800 hover:text-[#155A96] hover:underline"
                        >
                          {inquiry.phone}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(inquiry.phone, 'phone')}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                          title="Copy phone"
                        >
                          {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-400 font-medium">Not provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Subject & Item Reference */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Tag className="w-4 h-4 text-[#C9A23A]" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Subject & Item Reference
                </span>
              </div>

              <div className="pt-1 flex items-start gap-2 flex-wrap">
                {inquiry.lot_number && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[#F1F5F9] text-slate-700 border border-slate-200 shrink-0">
                    Item #{inquiry.lot_number}
                  </span>
                )}
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {displayTitle}
                </h4>
              </div>
            </div>

            {/* Full Customer Message Card */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#155A96]" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Customer Message
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(inquiry.message, 'message')}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {copiedField === 'message' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap selection:bg-[#C9A23A]/20">
                {inquiry.message || 'No message content provided.'}
              </div>
            </div>

            {/* Quick Email Response Draft */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Reply / Client Communication
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Pre-drafted template
                </span>
              </div>

              <textarea
                rows="5"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Draft reply to ${inquiry.inquirer_name}...`}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-sans focus:ring-2 focus:ring-[#155A96]/20 focus:border-[#155A96] focus:outline-none transition-all leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Clicking will open your email client with pre-filled subject and recipient.
                </span>
                <button
                  type="button"
                  onClick={handleSendReply}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#155A96] rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-[#F5D061]" />
                  <span>Send Email Reply</span>
                </button>
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Internal Staff Notes
                  </span>
                </div>
                {notesSaved && (
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Notes recorded
                  </span>
                )}
              </div>

              <textarea
                rows="2"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes visible only to administrators (e.g. called customer on Friday, follow up on Tuesday)..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#155A96]/20 focus:border-[#155A96] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(inquiry);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Inquiry</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close Slider
              </button>

              <button
                type="button"
                onClick={handleSendReply}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#155A96] rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-[#F5D061]" />
                <span>Reply to Client</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
