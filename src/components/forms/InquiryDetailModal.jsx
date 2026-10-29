import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { Mail, Phone, Calendar, Send, Check } from 'lucide-react';

const INQUIRY_STATUSES = ['New', 'In Progress', 'Replied', 'Closed'];

export const InquiryDetailModal = ({
  isOpen,
  onClose,
  inquiry,
  onUpdateStatus
}) => {
  if (!inquiry) return null;

  const [selectedStatus, setSelectedStatus] = useState(inquiry.status || 'New');
  const [replyText, setReplyText] = useState('');

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    onUpdateStatus(inquiry.id, status);
  };

  const handleSendReply = () => {
    const subject = encodeURIComponent(`RE: Highlander Gold & Silver Inquiry - ${inquiry.lot_title || 'General Inquiry'}`);
    const body = encodeURIComponent(replyText || `Hello ${inquiry.inquirer_name},\n\nThank you for reaching out to Highlander Gold & Silver.\n\nBest regards,\nAlexander MacLeod\nHighlander Gold & Silver\nBigfork, MT | (406) 407-0281`);
    window.open(`mailto:${inquiry.email}?subject=${subject}&body=${body}`);
    handleStatusChange('Replied');
  };

  const displayTitle = inquiry.lot_title || 'General Customer Question';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Inquiry"
      subtitle={`Inquiry #${inquiry.id} • ${new Date(inquiry.created_at).toLocaleDateString()}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="p-4 rounded-xl bg-[#F8FAFD] border border-[#E2EEF8] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#155A96]">
              {inquiry.inquiry_type || 'General Message'}
            </span>
            <StatusBadge status={selectedStatus} />
          </div>

          <div>
            {inquiry.lot_number && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white text-slate-700 border border-slate-200 mr-2 mb-1">
                Item #{inquiry.lot_number}
              </span>
            )}
            <h3 className="text-base font-bold text-[#0B2D52] font-serif inline">
              {displayTitle}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1 border-t border-[#E2EEF8]/80">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#D6AD43]" />
              <a href={`mailto:${inquiry.email}`} className="hover:underline font-medium text-slate-800">
                {inquiry.email}
              </a>
            </div>
            {inquiry.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#D6AD43]" />
                <a href={`tel:${inquiry.phone}`} className="hover:underline font-medium text-slate-800">
                  {inquiry.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Customer Message */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Customer Message
          </label>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed shadow-2xs">
            {inquiry.message}
          </div>
        </div>

        {/* Status Selector */}
        <div className="pt-1">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Status
          </label>
          <div className="grid grid-cols-4 gap-2">
            {INQUIRY_STATUSES.map(st => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusChange(st)}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-[#0B2D52] text-white border-[#0B2D52] font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Email Response Draft */}
        <div className="pt-1">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Quick Email Reply
          </label>
          <textarea
            rows="3"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Draft reply to ${inquiry.inquirer_name}... (opens your email client with prefilled details)`}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#155A96]/20 focus:border-[#155A96] focus:outline-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSendReply}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B2D52] hover:bg-[#155A96] rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#F5D061]" />
            Send Email Reply
          </button>
        </div>
      </div>
    </Modal>
  );
};

