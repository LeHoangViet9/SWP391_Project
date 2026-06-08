import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {(actionLabel && actionTo) && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 btn-gold px-4 py-2.5 rounded-lg text-sm shrink-0"
        >
          <Plus size={16} />
          {actionLabel}
        </Link>
      )}
      {(actionLabel && onAction) && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 btn-gold px-4 py-2.5 rounded-lg text-sm shrink-0"
        >
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
