import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, totalElements, onPageChange }) {
  if (totalPages <= 1 && totalElements <= 0) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-stone-200 bg-stone-50">
      <p className="text-sm text-slate-500">
        Tổng <span className="font-semibold text-slate-700">{totalElements}</span> bản ghi
        {totalPages > 0 && (
          <>
            {' '}
            · Trang <span className="font-semibold text-slate-700">{page}</span> / {totalPages}
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 rounded border border-stone-300 bg-white text-slate-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[36px] h-9 px-2 rounded text-sm font-medium transition-colors ${
              p === page
                ? 'bg-[#bfa15f] text-white'
                : 'border border-stone-300 bg-white text-slate-600 hover:bg-stone-100'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-2 rounded border border-stone-300 bg-white text-slate-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
