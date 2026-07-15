import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

/**
 * Reusable generic table with pagination
 *
 * @param {object} props
 * @param {string[]} props.columns  — Header labels
 * @param {React.ReactNode[]} props.rows — Array of <tr> elements
 * @param {boolean} [props.loading]
 * @param {number} [props.page] — current page (0-indexed)
 * @param {number} [props.totalPages]
 * @param {function} [props.onPageChange]
 * @param {string} [props.emptyText]
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  page = 0,
  totalPages = 1,
  onPageChange,
  emptyText,
}) {
  const { t } = useLocale();
  const defaultEmptyText = emptyText || t('common.noData') || 'Không có dữ liệu.';
  const loadingText = t('common.loading') || 'Đang tải...';
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      const pageNumbers = [];
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    if (page <= 3) {
      return [0, 1, 2, 3, 4, '...', totalPages - 1];
    }
    if (page >= totalPages - 4) {
      return [0, '...', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
    }
    return [0, '...', page - 1, page, page + 1, '...', totalPages - 1];
  };
  return (
    <div>
      <div className="overflow-x-auto border border-stone-200 rounded-lg">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50 text-slate-500 uppercase text-xs tracking-wider">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-bold whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-[#bfa15f] border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-xs">{loadingText}</p>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-slate-400">
                  {defaultEmptyText}
                </td>
              </tr>
            ) : (
              rows
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-3 text-sm text-slate-600">
          <span>
            {t('common.page') || 'Trang'} <strong>{page + 1}</strong> / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="p-1.5 border rounded hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((item, index) =>
                item === '...' ? (
                    <span
                        key={`ellipsis-${index}`}
                        className="px-2"
                    >
                ...
              </span>
                ) : (
                    <button
                        key={item}
                        onClick={() => onPageChange(item)}
                        className={`px-3 py-1 border rounded transition ${
                            page === item
                                ? 'bg-[#bfa15f] border-[#bfa15f] text-white'
                                : 'hover:bg-stone-100'
                        }`}
                    >
                      {item + 1}
                    </button>
                )
            )}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-1.5 border rounded hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
