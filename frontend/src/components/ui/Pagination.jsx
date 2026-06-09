import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange, totalElements, pageSize }) {
  if (!totalPages || totalPages <= 1) return null;

  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
      <p className="text-sm text-slate-500">
        {from}–{to} / {totalElements}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="p-2 rounded border border-stone-200 disabled:opacity-40 hover:bg-stone-50"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i)
          .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
          .map((i, idx, arr) => {
            const showEllipsis = idx > 0 && i - arr[idx - 1] > 1;
            return (
              <span key={i} className="flex items-center">
                {showEllipsis && <span className="px-2 text-slate-400">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(i)}
                  className={`min-w-[36px] h-9 rounded text-sm font-medium ${
                    i === page
                      ? 'bg-[#1a2332] text-white'
                      : 'border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {i + 1}
                </button>
              </span>
            );
          })}
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="p-2 rounded border border-stone-200 disabled:opacity-40 hover:bg-stone-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
