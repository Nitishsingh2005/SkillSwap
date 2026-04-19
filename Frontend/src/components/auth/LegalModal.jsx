import React from 'react';
import { X } from 'lucide-react';

const LegalModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-surface-2 rounded-xl shadow-2xl border border-border w-full max-w-2xl max-h-[85vh] flex flex-col my-auto animate-in fade-in zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id="modal-title" className="text-2xl font-bold text-ink tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink hover:bg-surface border-border p-2 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-ink-muted leading-relaxed text-sm space-y-4 flex-1">
          {content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-600 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 text-white px-8 py-2.5 rounded-lg transition-colors font-semibold shadow-lg hover:shadow-cyan-500/25"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
