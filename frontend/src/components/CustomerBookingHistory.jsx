import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, RefreshCw, Star, MessageSquare, Trash2, Edit3 } from 'lucide-react';
import DataTable from './shared/DataTable';
import { useLocale } from '../context/LocaleContext';
import { getMyBookingHistory } from '../services/bookingService';
import { createFeedback, getMyFeedbacks, updateMyFeedback, deleteMyFeedback } from '../services/feedbackService';
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
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  PENDING_CHECK_IN: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-emerald-100 text-emerald-700',
  CHECKED_OUT: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
};



export default function CustomerBookingHistory() {
  const { locale, t } = useLocale();
  const isVi = locale === 'vi';
  const [items, setItems] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  // Feedback states
  const [reviewTarget, setReviewTarget] = useState(null);
  const [editFeedbackTarget, setEditFeedbackTarget] = useState(null);
  const [viewReplyTarget, setViewReplyTarget] = useState(null);
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
      const [bookingsRes, feedbacksRes] = await Promise.all([
        getMyBookingHistory({ page: nextPage, size: 10 }, locale),
        getMyFeedbacks(locale).catch(err => {
          console.error("Error loading customer feedbacks:", err);
          return { data: [] };
        })
      ]);
      setItems(bookingsRes?.data?.content ?? []);
      setTotalPages(bookingsRes?.data?.totalPages ?? 1);
      setFeedbacks(feedbacksRes?.data ?? []);
    } catch (err) {
      setError(err.message || t('bookingHistory.loadError'));
      setItems([]);
      setTotalPages(1);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [page, locale, t]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const handleOpenReviewModal = (booking) => {
    setReviewTarget(booking);
    setEditFeedbackTarget(null);
    setRating(5);
    setCategory('Room');
    setComment('');
  };

  const handleOpenEditModal = (fb, booking) => {
    setReviewTarget(booking);
    setEditFeedbackTarget(fb);
    setRating(fb.rating);
    setCategory(fb.category);
    setComment(fb.comment);
  };

  const handleCloseModal = () => {
    setReviewTarget(null);
    setEditFeedbackTarget(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingReview(true);
    try {
      if (editFeedbackTarget) {
        await updateMyFeedback(editFeedbackTarget.id, {
          bookingId: editFeedbackTarget.bookingId || reviewTarget.id,
          rating,
          category,
          comment: comment.trim(),
        }, locale);
        notify(isVi ? 'Đánh giá đã được cập nhật thành công!' : 'Feedback updated successfully!');
      } else {
        await createFeedback({
          bookingId: reviewTarget.id,
          rating,
          category,
          comment: comment.trim(),
        }, locale);
        notify(isVi ? 'Đánh giá đã được gửi thành công!' : 'Feedback submitted successfully!');
      }
      handleCloseModal();
      fetchData(page);
    } catch (err) {
      notify(err.message || (isVi ? 'Không thể lưu đánh giá' : 'Failed to save feedback'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    const confirmed = window.confirm(
      isVi 
        ? "Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác." 
        : "Are you sure you want to delete this feedback? This action cannot be undone."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteMyFeedback(feedbackId, locale);
      notify(isVi ? 'Xóa đánh giá thành công!' : 'Feedback deleted successfully!');
      fetchData(page);
    } catch (err) {
      notify(err.message || (isVi ? 'Không thể xóa đánh giá' : 'Failed to delete feedback'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFromView = (fb) => {
    const booking = items.find(item => item.id === fb.bookingId);
    if (booking) {
      handleOpenEditModal(fb, booking);
      setViewReplyTarget(null);
    }
  };

  const handleDeleteFromView = async (fbId) => {
    await handleDeleteFeedback(fbId);
    setViewReplyTarget(null);
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
    isVi ? 'Đánh giá / Hành động' : 'Feedback / Action',
  ];

  const rows = items.map((item) => {
    const status = item.bookingStatus || item.status || 'PENDING_PAYMENT';
    const fb = feedbacks.find(f => f.bookingId === item.id);
    const showReviewBtn = status === 'CHECKED_OUT' && !fb;
    const hasFeedback = status === 'CHECKED_OUT' && !!fb;
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
          <div className="flex flex-col gap-2">
            {showReviewBtn && (
              <button
                onClick={() => handleOpenReviewModal(item)}
                className="relative inline-flex items-center justify-center rounded bg-gradient-to-r from-[#bfa15f] to-[#d4b97f] hover:from-[#a3854a] hover:to-[#bfa15f] text-white px-3 py-1.5 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 animate-pulse hover:animate-none w-fit"
              >
                {isVi ? 'Đánh giá' : 'Review'}
              </button>
            )}
            {hasFeedback && (
              <button
                type="button"
                onClick={() => setViewReplyTarget(fb)}
                className="group flex flex-col gap-1.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-[#bfa15f] hover:bg-[#bfa15f]/5 text-left transition-all duration-300 w-full max-w-[200px] shadow-sm hover:shadow"
                title={isVi ? "Xem chi tiết đánh giá hoặc phản hồi" : "View review details or response"}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        fill={i < fb.rating ? '#f59e0b' : 'none'}
                        className={i < fb.rating ? 'text-amber-500' : 'text-slate-200'}
                      />
                    ))}
                  </div>

                </div>
                
                <p className="text-[10px] text-slate-500 group-hover:text-slate-700 italic truncate w-full mt-0.5">
                  "{fb.comment}"
                </p>
                
                <span className="text-[9px] text-[#bfa15f] font-bold group-hover:text-[#a3854a] flex items-center gap-0.5 mt-0.5 transition-colors">
                  {isVi ? 'Xem chi tiết →' : 'View details →'}
                </span>
              </button>
            )}
            {!showReviewBtn && !hasFeedback && <span className="text-slate-400">—</span>}
          </div>
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

      {/* Create / Edit Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={20} className="text-[#bfa15f]" />
              {editFeedbackTarget
                ? (isVi ? `Chỉnh sửa đánh giá #${editFeedbackTarget.id}` : `Edit Review #${editFeedbackTarget.id}`)
                : (isVi ? `Đánh giá phòng nghỉ #${reviewTarget.id}` : `Review Booking #${reviewTarget.id}`)}
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
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm border border-stone-200 rounded-lg text-slate-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || comment.length > 255}
                  className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded-lg font-semibold shadow transition-colors disabled:opacity-50"
                >
                  {submittingReview 
                    ? (isVi ? 'Đang lưu...' : 'Saving...') 
                    : (editFeedbackTarget ? (isVi ? 'Cập nhật' : 'Update') : (isVi ? 'Gửi đánh giá' : 'Submit'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified View & Manage Feedback Modal */}
      {viewReplyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setViewReplyTarget(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-stone-100 flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100 bg-stone-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare size={18} className="text-[#bfa15f]" />
                {isVi ? 'Chi tiết đánh giá đơn phòng' : 'Review Details'}
              </h3>
              <button 
                type="button" 
                onClick={() => setViewReplyTarget(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-stone-200 hover:text-slate-600 transition-all text-xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Feedback Summary Card */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-[#bfa15f]/10 text-[#bfa15f] border border-[#bfa15f]/20">
                      {isVi ? `Mục: ${t(`feedback.category.${viewReplyTarget.category}`) || viewReplyTarget.category}` : `Category: ${viewReplyTarget.category}`}
                    </span>

                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {formatDateTime(viewReplyTarget.createdAt, locale)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        fill={i < viewReplyTarget.rating ? '#f59e0b' : 'none'}
                        className={i < viewReplyTarget.rating ? 'text-amber-500' : 'text-slate-200'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-700">({viewReplyTarget.rating}.0 / 5.0)</span>
                </div>

                <div className="h-px bg-stone-200 my-1" />
                
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {isVi ? 'Ý kiến của bạn' : 'Your Comment'}
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium leading-relaxed italic">
                    "{viewReplyTarget.comment}"
                  </p>
                </div>
              </div>

              {/* Management Reply */}
              {viewReplyTarget.reply ? (
                <div className="bg-[#bfa15f]/5 p-5 rounded-xl border border-[#bfa15f]/25 space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[#a3854a] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#bfa15f]" />
                      {isVi ? 'Phản hồi từ Ban quản lý' : 'Management Response'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDateTime(viewReplyTarget.replyAt, locale)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {viewReplyTarget.reply}
                  </p>
                </div>
              ) : (
                <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200/60 border-dashed text-center">
                  <p className="text-xs text-slate-400 italic">
                    {isVi ? 'Đánh giá đang chờ được duyệt và phản hồi từ Ban quản lý.' : 'Review is waiting for management approval and response.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              {/* Delete button (Always available) */}
              <button
                type="button"
                onClick={() => handleDeleteFromView(viewReplyTarget.id)}
                className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-bold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
              >
                <Trash2 size={14} />
                <span>{isVi ? 'Xóa đánh giá' : 'Delete Review'}</span>
              </button>

              <div className="flex items-center gap-2">
                {!viewReplyTarget.reply && (
                  <button
                    type="button"
                    onClick={() => handleEditFromView(viewReplyTarget)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                  >
                    <Edit3 size={14} />
                    <span>{isVi ? 'Chỉnh sửa' : 'Edit'}</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setViewReplyTarget(null)}
                  className="px-4 py-2 text-xs font-bold border border-stone-300 rounded-lg text-slate-600 hover:bg-stone-150 transition-colors"
                >
                  {isVi ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
