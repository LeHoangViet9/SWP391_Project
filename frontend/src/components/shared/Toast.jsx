import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

/**
 * Toast notification component
 * @param {object} props
 * @param {'success'|'error'|'warning'} props.type
 * @param {string} props.message
 * @param {function} props.onClose
 * @param {number} [props.duration=4000]
 */
export default function Toast({ type = 'success', message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, onClose, duration]);

  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-500',
      text: 'text-emerald-800',
      Icon: CheckCircle,
      iconCls: 'text-emerald-500',
    },
    error: {
      bg: 'bg-red-50 border-red-500',
      text: 'text-red-800',
      Icon: XCircle,
      iconCls: 'text-red-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-500',
      text: 'text-amber-800',
      Icon: AlertTriangle,
      iconCls: 'text-amber-500',
    },
  };

  const s = styles[type] || styles.success;
  const { Icon } = s;

  return (
    <div className={`fixed top-4 right-4 z-[9999] max-w-sm w-full border-l-4 rounded shadow-lg p-4 flex items-start gap-3 ${s.bg} animate-slide-in`}>
      <Icon size={20} className={`shrink-0 mt-0.5 ${s.iconCls}`} />
      <p className={`text-sm font-medium flex-1 ${s.text}`}>{message}</p>
      <button onClick={onClose} className={`shrink-0 ${s.text} hover:opacity-60 transition-opacity`}>
        <X size={16} />
      </button>
    </div>
  );
}
