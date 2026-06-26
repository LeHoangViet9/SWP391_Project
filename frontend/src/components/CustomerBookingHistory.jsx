import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, RefreshCw, Star, MessageSquare } from 'lucide-react';
import DataTable from './shared/DataTable';
import { useLocale } from '../context/LocaleContext';
import { getMyBookingHistory } from '../services/bookingService';
import { createFeedback } from '../services/feedbackService';
import Toast from './shared/Toast';

function formatDateTime(value, locale) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatMoney(value, locale) {
  if (value == null) return '-';
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-emerald-100 text-emerald-700',
  CHECKED_OUT: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
};

export default function CustomerBookingHistory() {
  const { locale, t } = useLocale();
  const isVi = locale === 'vi';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  // Feedback states
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Room');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchData = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyBookingHistory({ page: nextPage, size: 10 }, locale);
      setItems(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (err) {
      setError(err.message || t('bookingHistory.loadError'));
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, locale, t]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const handleOpenReviewModal = (booking) => {
    setReviewTarget(booking);
    setRating(5);
    setCategory('Room');
    setComment('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingReview(true);
    try {
      await createFeedback({
        bookingId: reviewTarget.id,
        rating,
        category,
        comment: comment.trim(),
      }, locale);
      notify(isVi ? 'Đánh giá đã được gửi thành công!' : 'Feedback submitted successfully!');
      setReviewTarget(null);
      fetchData(page);
    } catch (err) {
      notify(err.message || (isVi ? 'Không thể gửi đánh giá' : 'Failed to submit feedback'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const columns = [
    t('bookingHistory.columns.id'),
    t('bookingHistory.columns.roomType'),
    t('bookingHistory.columns.quantity'),
    t('bookingHistory.columns.checkIn'),
    t('bookingHistory.columns.checkOut'),
    t('bookingHistory.columns.status'),
    t('bookingHistory.columns.totalPrice'),
    t('bookingHistory.columns.createdAt'),
    isVi ? 'Đánh giá' : 'Action',
  ];

  const rows = items.map((item) => {
    const status = item.bookingStatus || item.status || 'PENDING';
    const showReviewBtn = status === 'CHECKED_OUT' && !item.hasFeedback;
    const hasFeedback = status === 'CHECKED_OUT' && item.hasFeedback;

    return (
      <tr key={item.id} className="hover:bg-stone-50">
        <td className="px-4 py-3 font-mono text-xs font-bold">#{item.id}</td>
        <td className="px-4 py-3 text-sm font-semibold text-slate-800">{item.roomTypeName || '-'}</td>
        <td className="px-4 py-3 text-center text-sm">{item.quantity ?? '-'}</td>
        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(item.checkInDate, locale)}</td>
        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(item.checkOutDate, locale)}</td>
        <td className="px-4 py-3">
          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[status] || 'bg-stone-100 text-stone-600'}`}>
            {t(`booking.status.${status}`)}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-bold text-[#bfa15f]">{formatMoney(item.totalPrice, locale)}</td>
        <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(item.createdAt, locale)}</td>
        <td className="px-4 py-3">
          {showReviewBtn && (
            <button
              onClick={() => handleOpenReviewModal(item)}
              className="relative inline-flex items-center justify-center rounded bg-gradient-to-r from-[#bfa15f] to-[#d4b97f] hover:from-[#a3854a] hover:to-[#bfa15f] text-white px-3 py-1.5 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 animate-pulse hover:animate-none"
            >
              {isVi ? 'Đánh giá' : 'Review'}
            </button>
          )}
          {hasFeedback && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Star size={12} fill="#059669" className="text-emerald-600" />
              {isVi ? 'Đã đánh giá' : 'Reviewed'}
            </span>
          )}
          {!showReviewBtn && !hasFeedback && <span className="text-slate-400">—</span>}
        </td>
      </tr>
    );
  });

  return (
    <div className="space-y-4">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <CalendarDays size={18} className="text-[#bfa15f]" />
            {t('bookingHistory.title')}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t('bookingHistory.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/#room-types"
            className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow transition-colors"
          >
            {locale === 'vi' ? 'Đặt phòng mới' : 'Book New Room'}
          </Link>
          <button
            type="button"
            onClick={() => fetchData(page)}
            className="inline-flex items-center justify-center gap-2 rounded border border-stone-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-[#bfa15f] hover:text-[#bfa15f]"
          >
            <RefreshCw size={15} />
            {t('bookingHistory.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyText={t('bookingHistory.emptyText')}
      />

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setReviewTarget(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={20} className="text-[#bfa15f]" />
              {isVi ? `Đánh giá phòng nghỉ #${reviewTarget.id}` : `Review Booking #${reviewTarget.id}`}
            </h3>

            <p className="text-xs text-slate-500">
              {isVi ? `Loại phòng: ${reviewTarget.roomTypeName}` : `Room Type: ${reviewTarget.roomTypeName}`}
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  {isVi ? 'Số sao đánh giá' : 'Rating Star'}
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-2xl transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        fill={star <= rating ? '#bfa15f' : 'none'}
                        className={star <= rating ? 'text-[#bfa15f]' : 'text-slate-300'}
                        strokeWidth={2}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  {isVi ? 'Phân loại đánh giá' : 'Review Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:border-[#bfa15f] focus:bg-white outline-none text-slate-800 transition-all"
                >
                  <option value="Room">{isVi ? 'Phòng nghỉ' : 'Room'}</option>
                  <option value="Service">{isVi ? 'Dịch vụ' : 'Service'}</option>
                  <option value="Cleanliness">{isVi ? 'Sạch sẽ' : 'Cleanliness'}</option>
                  <option value="Staff">{isVi ? 'Nhân viên' : 'Staff'}</option>
                </select>
              </div>

              {/* Comment Textarea */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {isVi ? 'Bình luận' : 'Comment'}
                  </label>
                  <span className={`text-[10px] ${comment.length > 255 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                    {comment.length}/255
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={255}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isVi ? 'Nhập nhận xét của bạn về chất lượng dịch vụ (tối đa 255 ký tự)...' : 'Write your review here (max 255 chars)...'}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:border-[#bfa15f] focus:bg-white outline-none text-slate-800 transition-all resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => setReviewTarget(null)}
                  className="px-4 py-2 text-sm border border-stone-200 rounded-lg text-slate-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || comment.length > 255}
                  className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded-lg font-semibold shadow transition-colors disabled:opacity-50"
                >
                  {submittingReview ? (isVi ? 'Đang gửi...' : 'Submitting...') : (isVi ? 'Gửi đánh giá' : 'Submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
