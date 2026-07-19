import React from 'react';
import ReactPaginate from 'react-paginate';
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
        <ReactPaginate
          pageCount={totalPages}
          forcePage={page}
          onPageChange={({ selected }) => onPageChange(selected)}
          marginPagesDisplayed={1}
          pageRangeDisplayed={3}
          previousLabel={<ChevronLeft size={16} />}
          nextLabel={<ChevronRight size={16} />}
          breakLabel="…"
          containerClassName="flex items-center justify-center mt-4 gap-1 text-sm select-none"
          pageClassName=""
          pageLinkClassName="min-w-[32px] h-8 px-2 flex items-center justify-center border border-stone-200 rounded font-medium text-slate-600 hover:bg-stone-100 transition-colors"
          activeClassName=""
          activeLinkClassName="!bg-[#bfa15f] !border-[#bfa15f] !text-white shadow-sm"
          previousClassName=""
          previousLinkClassName="p-1.5 border border-stone-200 rounded hover:bg-stone-100 disabled:opacity-40 transition-colors flex items-center"
          nextClassName=""
          nextLinkClassName="p-1.5 border border-stone-200 rounded hover:bg-stone-100 disabled:opacity-40 transition-colors flex items-center"
          breakClassName=""
          breakLinkClassName="px-2 py-1 text-slate-400"
          disabledLinkClassName="opacity-40 cursor-not-allowed pointer-events-none"
        />
      )}
    </div>
  );
}
