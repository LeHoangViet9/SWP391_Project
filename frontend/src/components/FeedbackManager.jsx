import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Search, Reply, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import Toast from './shared/Toast';
import { searchFeedbacks, replyFeedback, deleteFeedback, getFeedbackStats } from '../services/feedbackService';

export default function FeedbackManager() {
  const { hasAnyPermission } = useAuth();
  const { locale } = useLocale();
  const isVi = locale === 'vi';

  const canReply = hasAnyPermission(['FEEDBACK_UPDATE']);
  const canDelete = hasAnyPermission(['FEEDBACK_DELETE']);

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [stats, setStats] = useState({
    averageRating: 0.0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        searchFeedbacks({
          keyword: search.trim() || undefined,
          rating: filterRating > 0 ? filterRating : undefined,
          status: filterStatus || undefined,
          category: filterCategory || undefined,
          page,
          size: 10
        }, locale),
        getFeedbackStats({
          keyword: search.trim() || undefined,
          status: filterStatus || undefined,
          category: filterCategory || undefined
        }, locale).catch(err => {
          console.error('Failed to fetch stats:', err);
          return null;
        })
      ]);
      setFeedbacks(listRes?.data?.content || []);
      setTotalPages(listRes?.data?.totalPages || 1);
      if (statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      notify(err.message || (isVi ? 'Không thể tải danh sách đánh giá' : 'Failed to load feedbacks'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterRating, filterStatus, filterCategory, page, locale, isVi]);

  useEffect(() => {
    setPage(0);
  }, [search, filterRating, filterStatus, filterCategory]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleOpenReply = (item) => {
    setReplyTarget(item);
    setReplyText(item.reply || '');
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await replyFeedback(replyTarget.id, { reply: replyText.trim() }, locale);
      notify(isVi ? 'Đã phản hồi đánh giá thành công!' : 'Feedback replied successfully!');
      setReplyTarget(null);
      setReplyText('');
      fetchFeedbacks();
    } catch (err) {
      notify(err.message || (isVi ? 'Không thể gửi phản hồi' : 'Failed to send reply'), 'error');
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleOpenDelete = (item) => {
    setDeleteTarget(item);
  };

  const confirmDeleteFeedback = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFeedback(deleteTarget.id, locale);
      notify(isVi ? 'Đã xóa đánh giá thành công!' : 'Feedback deleted successfully!');
      setDeleteTarget(null);
      fetchFeedbacks();
    } catch (err) {
      notify(err.message || (isVi ? 'Không thể xóa đánh giá' : 'Failed to delete feedback'), 'error');
    }
  };

  // Metrics (computed dynamically from backend across whole dataset matching active filters)
  const avgRating = (stats.averageRating || 0.0).toFixed(1);
  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: stats.ratingDistribution?.[stars] || 0
  }));

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-[#bfa15f]" size={22} />
            {isVi ? 'Đánh giá & Ý kiến Khách hàng' : 'Customer Feedback & Reviews'}
          </h2>
          <p className="text-xs text-white/50 mt-1">
            {isVi ? 'Xem và phản hồi đánh giá chất lượng dịch vụ từ khách lưu trú.' : 'View and reply to service quality ratings from staying guests.'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avg Card */}
        <div className="bg-[#112240] border border-white/[0.08] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">
            {isVi ? 'Điểm Đánh Giá Trung Bình' : 'Average Rating'}
          </span>
          <span className="text-5xl font-extrabold text-[#bfa15f] leading-none mb-2">{avgRating}</span>
          <div className="flex gap-1 text-[#bfa15f]">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={18}
                fill={star <= Math.round(parseFloat(avgRating)) ? '#bfa15f' : 'none'}
                strokeWidth={2}
                className={star <= Math.round(parseFloat(avgRating)) ? 'text-[#bfa15f]' : 'text-white/20'}
              />
            ))}
          </div>
          <span className="text-xs text-white/40 mt-3">
            {isVi
              ? `Dựa trên ${stats.totalReviews} lượt đánh giá`
              : `Based on ${stats.totalReviews} reviews`}
          </span>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-[#112240] border border-white/[0.08] p-5 rounded-2xl md:col-span-2 space-y-2.5">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-1">
            {isVi ? 'Phân Phối Điểm Đánh Giá' : 'Rating Distribution'}
          </span>
          {ratingCounts.map(({ stars, count }) => {
            const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-sm text-white/70">
                <span className="w-8 font-semibold flex items-center justify-end gap-1">
                  {stars} <Star size={12} fill="#bfa15f" className="text-[#bfa15f]" />
                </span>
                <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#bfa15f] to-[#d4b97f] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-white/45 text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 bg-[#112240] p-4 rounded-2xl border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isVi ? 'Tìm theo tên khách, phòng, nội dung...' : 'Search by guest name, room, comment...'}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:border-[#bfa15f] outline-none text-white placeholder-white/30 transition-all"
            />
          </div>



          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white focus:border-[#bfa15f] outline-none transition-all cursor-pointer"
          >
            <option value="" className="bg-[#112240] text-white">{isVi ? 'Tất cả danh mục' : 'All Categories'}</option>
            <option value="Room" className="bg-[#112240] text-white">{isVi ? 'Phòng nghỉ' : 'Room'}</option>
            <option value="Service" className="bg-[#112240] text-white">{isVi ? 'Dịch vụ' : 'Service'}</option>
            <option value="Cleanliness" className="bg-[#112240] text-white">{isVi ? 'Sạch sẽ' : 'Cleanliness'}</option>
            <option value="Staff" className="bg-[#112240] text-white">{isVi ? 'Nhân viên' : 'Staff'}</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white focus:border-[#bfa15f] outline-none transition-all cursor-pointer"
          >
            <option value="" className="bg-[#112240] text-white">{isVi ? 'Tất cả trạng thái' : 'All statuses'}</option>
            <option value="PENDING" className="bg-[#112240] text-white">{isVi ? 'Chờ xử lý' : 'Pending'}</option>
            <option value="REVIEWED" className="bg-[#112240] text-white">{isVi ? 'Đã phản hồi' : 'Reviewed'}</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setFilterRating(0)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterRating === 0
                ? 'bg-[#bfa15f]/15 border-[#bfa15f] text-[#bfa15f]'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            {isVi ? 'Tất cả sao' : 'All Stars'}
          </button>
          {[5, 4, 3, 2, 1].map(stars => (
            <button
              key={stars}
              onClick={() => setFilterRating(stars)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filterRating === stars
                  ? 'bg-[#bfa15f]/15 border-[#bfa15f] text-[#bfa15f]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              {stars} <Star size={11} fill={filterRating === stars ? '#bfa15f' : 'none'} className={filterRating === stars ? 'text-[#bfa15f]' : 'text-white/40'} />
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-[#112240] border border-white/[0.08] p-12 text-center rounded-2xl">
            <span className="text-sm text-white/40">{isVi ? 'Đang tải đánh giá...' : 'Loading feedbacks...'}</span>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-[#112240] border border-white/[0.08] p-12 text-center rounded-2xl">
            <MessageSquare className="mx-auto text-white/20 mb-3" size={36} />
            <p className="text-sm text-white/40">
              {isVi ? 'Không tìm thấy đánh giá nào phù hợp.' : 'No matching feedback found.'}
            </p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div key={item.id} className="bg-[#112240] border border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-lg hover:border-white/15 transition-all">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/[0.05] pb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white">{item.customerName}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                      {isVi ? {
                        'Room': 'Phòng nghỉ',
                        'Service': 'Dịch vụ',
                        'Cleanliness': 'Sạch sẽ',
                        'Staff': 'Nhân viên'
                      }[item.category] || item.category : item.category}
                    </span>

                  </div>
                  <p className="text-[11px] text-white/40 mt-1">
                    {item.roomTypeName} &bull; {new Date(item.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-0.5 text-[#bfa15f]">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= item.rating ? '#bfa15f' : 'none'}
                        strokeWidth={2}
                        className={star <= item.rating ? 'text-[#bfa15f]' : 'text-white/20'}
                      />
                    ))}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleOpenDelete(item)}
                      className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                      title={isVi ? 'Xóa đánh giá' : 'Delete Feedback'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-sm text-white/80 leading-relaxed italic">
                "{item.comment}"
              </p>

              {/* Management Response */}
              {item.reply ? (
                <div className="bg-white/5 border-l-2 border-[#bfa15f] p-4 rounded-r-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#bfa15f] flex items-center gap-1">
                      <Reply size={12} className="scale-x-[-1]" />
                      {isVi ? 'Phản hồi từ Khách sạn' : 'Management Response'}
                    </span>
                    {canReply && (
                      <button
                        onClick={() => handleOpenReply(item)}
                        className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-wider"
                      >
                        {isVi ? 'Chỉnh sửa' : 'Edit'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{item.reply}</p>
                </div>
              ) : (
                canReply && (
                  <button
                    onClick={() => handleOpenReply(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bfa15f]/30 hover:border-[#bfa15f] text-xs font-semibold text-[#bfa15f] hover:bg-[#bfa15f]/5 transition-all"
                  >
                    <Reply size={12} className="scale-x-[-1]" />
                    {isVi ? 'Gửi phản hồi' : 'Write Response'}
                  </button>
                )
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#112240] p-4 rounded-2xl border border-white/[0.08] mt-4">
          <span className="text-xs text-white/40">
            {isVi ? `Trang ${page + 1} / ${totalPages}` : `Page ${page + 1} of ${totalPages}`}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isVi ? 'Trước' : 'Previous'}
            </button>
            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isVi ? 'Sau' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReplyTarget(null)} />
          <div className="relative bg-[#112240] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Reply size={18} className="scale-x-[-1] text-[#bfa15f]" />
              {isVi ? `Phản hồi khách hàng ${replyTarget.customerName}` : `Reply to ${replyTarget.customerName}`}
            </h3>

            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-white/60 italic leading-relaxed">
              "{replyTarget.comment}"
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
                    {isVi ? 'Nội dung phản hồi' : 'Response Message'}
                  </label>
                  <span className={`text-[10px] ${replyText.length > 1000 ? 'text-red-500 font-bold' : 'text-white/40'}`}>
                    {replyText.length}/1000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={isVi ? 'Nhập lời cảm ơn hoặc giải đáp thắc mắc...' : 'Type your reply message...'}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm bg-white/5 focus:border-[#bfa15f] outline-none text-white transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="px-4 py-2 text-sm border border-white/10 rounded-xl text-white/70 hover:bg-white/5"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={replyText.length > 1000}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm btn-gold rounded-xl font-semibold shadow disabled:opacity-50"
                >
                  <Send size={14} />
                  {isVi ? 'Gửi phản hồi' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Feedback Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-[#112240] border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isVi ? 'Xác nhận xóa đánh giá' : 'Confirm Delete Feedback'}
                </h3>
                <p className="text-xs text-white/50">
                  {isVi ? 'Hành động này không thể hoàn tác' : 'This action cannot be undone'}
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-1">
              <p className="text-xs font-semibold text-white/80">
                {isVi ? `Đánh giá từ: ${deleteTarget.customerName}` : `Review by: ${deleteTarget.customerName}`}
              </p>
              <p className="text-xs text-white/60 italic line-clamp-2">
                "{deleteTarget.comment}"
              </p>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              {isVi
                ? 'Đánh giá này sẽ được lưu trữ ẩn (xóa mềm) và không còn hiển thị với người dùng trên hệ thống.'
                : 'This feedback will be archived (soft deleted) and hidden from active views.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs border border-white/10 rounded-xl text-white/70 hover:bg-white/5 font-semibold transition-all"
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteFeedback}
                className="flex items-center gap-1.5 px-5 py-2 text-xs bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 transition-all"
              >
                <Trash2 size={14} />
                {isVi ? 'Xóa đánh giá' : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
