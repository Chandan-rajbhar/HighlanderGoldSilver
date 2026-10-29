import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" title="" showClose={false}>
      <div className="pt-2 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 mx-auto sm:mx-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 font-sans">{title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">Highlander Gold & Silver Administrative Verification</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          {message}
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                : 'bg-aubergine hover:bg-aubergine-light'
            }`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isDestructive ? (
              <Trash2 className="w-4 h-4" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

