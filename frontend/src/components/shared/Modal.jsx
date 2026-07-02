import React from 'react';
import { X } from 'lucide-react';

/**
 * Generic modal overlay
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {function} props.onClose
 * @param {React.ReactNode} props.children
 * @param {string} [props.size='md']  'sm'|'md'|'lg'|'xl'
 */
export default function Modal({ open, title, onClose, children, size = 'md' }) {
  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  }[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative w-full ${sizeClass} bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-bold font-display text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}
