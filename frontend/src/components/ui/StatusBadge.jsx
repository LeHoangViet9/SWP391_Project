import { CheckCircle, XCircle, Clock, AlertTriangle, MinusCircle, LogOut } from 'lucide-react';

const STATUS_CONFIG = {
  ACTIVE: { icon: CheckCircle, className: 'badge--active' },
  CONFIRMED: { icon: CheckCircle, className: 'badge--confirmed' },
  CHECKED_IN: { icon: CheckCircle, className: 'badge--checked_in' },
  INACTIVE: { icon: XCircle, className: 'badge--inactive' },
  LOCKED: { icon: XCircle, className: 'badge--locked' },
  CANCELLED: { icon: XCircle, className: 'badge--cancelled' },
  PENDING: { icon: Clock, className: 'badge--pending' },
  MAINTENANCE: { icon: AlertTriangle, className: 'badge--maintenance' },
  BROKEN: { icon: AlertTriangle, className: 'badge--broken' },
  NO_SHOW: { icon: MinusCircle, className: 'badge--no_show' },
  CHECKED_OUT: { icon: LogOut, className: 'badge--checked_out' },
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="text-slate-400">—</span>;

  const config = STATUS_CONFIG[status] || { className: 'badge--maintenance' };
  const Icon = config.icon || MinusCircle;

  return (
    <span className={`badge ${config.className}`}>
      <Icon size={12} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}
