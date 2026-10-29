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
    const subject = encodeURIComponent(`RE: Highlander Gold & Silver Inquiry - ${inquiry.lot_title || 'Precious Metals'}`);
    const body = encodeURIComponent(replyText || `Hello ${inquiry.inquirer_name},\n\nThank you for contacting Highlander Gold & Silver.\n\nBest regards,\nAlexander MacLeod\nHighlander Gold & Silver\nBigfork, MT | (406) 407-0281`);
    window.open(`mailto:${inquiry.email}?subject=${subject}&body=${body}`);
    handleStatusChange('Replied');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Storefront Acquisition Inquiry"
      subtitle={`Inquiry #${inquiry.id} • ${new Date(inquiry.created_at).toLocaleDateString()}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {inquiry.inquiry_type}
            </span>
            <StatusBadge status={selectedStatus} />
          </div>

          <h3 className="text-base font-bold text-slate-900 font-sans">
            {inquiry.lot_number ? `Lot #${inquiry.lot_number}: ${inquiry.lot_title}` : (inquiry.lot_title || 'General Ingestion Request')}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gold" />
              <a href={`mailto:${inquiry.email}`} className="hover:underline font-medium">
                {inquiry.email}
              </a>
            </div>
            {inquiry.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gold" />
                <a href={`tel:${inquiry.phone}`} className="hover:underline font-medium">
                  {inquiry.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Client Message */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-sans mb-1.5">
            Client Message from Website
          </label>
          <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed">
            "{inquiry.message}"
          </div>
        </div>

        {/* Status Selector */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Update Workflow Status
          </label>
          <div className="grid grid-cols-4 gap-2">
            {INQUIRY_STATUSES.map(st => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusChange(st)}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                  selectedStatus === st
                    ? 'bg-aubergine text-white border-aubergine font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Email Response Draft */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Quick Email Dispatch
          </label>
          <textarea
            rows="3"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Draft reply to ${inquiry.inquirer_name}... (opens your mail client with prefilled details)`}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-aubergine-muted focus:outline-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSendReply}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-aubergine hover:bg-aubergine-light rounded-lg transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-gold" />
            Launch Mail Reply
          </button>
        </div>
      </div>
    </Modal>
  );
};

