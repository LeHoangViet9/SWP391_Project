const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-emerald-100 text-emerald-800',
  CHECKED_OUT: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-800',
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  OCCUPIED: 'bg-blue-100 text-blue-800',
  DIRTY: 'bg-amber-100 text-amber-800',
  MAINTENANCE: 'bg-purple-100 text-purple-800',
  INACTIVE: 'bg-slate-100 text-slate-500',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  BANNED: 'bg-red-100 text-red-700',
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  CLEANING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  BROKEN: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  if (!status) return <span className="text-slate-400">—</span>;
  const color = STATUS_COLORS[status] || 'bg-stone-100 text-slate-600';
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
