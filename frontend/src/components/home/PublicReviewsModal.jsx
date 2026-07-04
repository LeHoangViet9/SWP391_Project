import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Search, X, Quote } from 'lucide-react';
import { searchPublicFeedbacks, getPublicFeedbackStats } from '../../services/feedbackService';

export default function PublicReviewsModal({ isOpen, onClose, locale }) {
  const isVi = locale === 'vi';

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    averageRating: 0.0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        searchPublicFeedbacks({
          keyword: search.trim() || undefined,
          rating: filterRating > 0 ? filterRating : undefined,
          category: filterCategory || undefined,
          page,
          size: 6
        }, locale),
        getPublicFeedbackStats({
          keyword: search.trim() || undefined,
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
      console.error('Failed to load feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filterRating, filterCategory, page, locale]);

  useEffect(() => {
    if (isOpen) {
      setPage(0);
    }
  }, [search, filterRating, filterCategory, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchFeedbacks();
    }
  }, [fetchFeedbacks, isOpen]);

  if (!isOpen) return null;

  const avgRating = (stats.averageRating || 0.0).toFixed(1);
  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: stats.ratingDistribution?.[stars] || 0
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative bg-[#faf9f6] border border-stone-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200/80 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#bfa15f]/10 rounded-xl text-[#bfa15f]">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-800">
                {isVi ? 'Đánh Giá từ Khách Hàng' : 'Guest Reviews & Ratings'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isVi ? 'Xem ý kiến thực tế của khách hàng đã lưu trú' : 'Real reviews and suggestions from our guests'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Summary Stats Grid (Light Theme adaptation of Manager's stats) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Avg Rating Card */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isVi ? 'Điểm đánh giá trung bình' : 'Average Score'}
              </span>
              <span className="text-5xl font-extrabold text-[#bfa15f] leading-none mb-3">
                {avgRating}
              </span>
              <div className="flex gap-1 text-[#bfa15f]">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={18}
                    fill={star <= Math.round(parseFloat(avgRating)) ? '#bfa15f' : 'none'}
                    strokeWidth={2}
                    className={star <= Math.round(parseFloat(avgRating)) ? 'text-[#bfa15f]' : 'text-stone-300'}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400 mt-3 font-medium">
                {isVi ? `Dựa trên ${stats.totalReviews} đánh giá` : `Based on ${stats.totalReviews} reviews`}
              </span>
            </div>

            {/* Distribution chart */}
            <div className="bg-white border border-stone-200/80 p-6 rounded-2xl md:col-span-2 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isVi ? 'Tỷ lệ phân bố sao' : 'Rating Breakdown'}
              </span>
              {ratingCounts.map(({ stars, count }) => {
                const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                    <span className="w-8 font-semibold flex items-center justify-end gap-1">
                      {stars} <Star size={12} fill="#bfa15f" className="text-[#bfa15f]" />
                    </span>
                    <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#bfa15f] to-[#d4b97f] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-slate-400 text-xs">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtering Toolbar */}
          <div className="flex flex-col lg:flex-row justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={isVi ? 'Tìm theo tên, nội dung...' : 'Search by guest, comment...'}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:border-[#bfa15f] outline-none text-slate-800 placeholder-slate-400 transition-all"
                />
              </div>

              {/* Category */}
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-slate-700 focus:border-[#bfa15f] outline-none transition-all cursor-pointer"
              >
                <option value="">{isVi ? 'Tất cả danh mục' : 'All Categories'}</option>
                <option value="Room">{isVi ? 'Phòng nghỉ' : 'Room'}</option>
                <option value="Service">{isVi ? 'Dịch vụ' : 'Service'}</option>
                <option value="Cleanliness">{isVi ? 'Sạch sẽ' : 'Cleanliness'}</option>
                <option value="Staff">{isVi ? 'Nhân viên' : 'Staff'}</option>
              </select>
            </div>

            {/* Stars Selector */}
            <div className="flex gap-1.5 flex-wrap items-center">
              <button
                onClick={() => setFilterRating(0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  filterRating === 0
                    ? 'bg-[#bfa15f]/15 border-[#bfa15f] text-[#bfa15f]'
                    : 'bg-stone-50 border-stone-200 text-slate-600 hover:border-stone-300'
                }`}
              >
                {isVi ? 'Tất cả sao' : 'All Stars'}
              </button>
              {[5, 4, 3, 2, 1].map(stars => (
                <button
                  key={stars}
                  onClick={() => setFilterRating(stars)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filterRating === stars
                      ? 'bg-[#bfa15f]/15 border-[#bfa15f] text-[#bfa15f]'
                      : 'bg-stone-50 border-stone-200 text-slate-600 hover:border-stone-300'
                  }`}
                >
                  {stars} <Star size={11} fill={filterRating === stars ? '#bfa15f' : 'none'} className={filterRating === stars ? 'text-[#bfa15f]' : 'text-slate-400'} />
                </button>
              ))}
            </div>
          </div>

          {/* Feedbacks Explorer */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white border border-stone-200 p-12 text-center rounded-2xl shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bfa15f] mx-auto" />
                <span className="text-sm text-slate-400 block mt-3">
                  {isVi ? 'Đang tải đánh giá...' : 'Loading reviews...'}
                </span>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="bg-white border border-stone-200 p-12 text-center rounded-2xl shadow-sm">
                <MessageSquare className="mx-auto text-stone-300 mb-3" size={36} />
                <p className="text-sm text-slate-500">
                  {isVi ? 'Không tìm thấy đánh giá nào.' : 'No reviews found.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbacks.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors"
                  >
                    <div>
                      {/* Name & Stars */}
                      <div className="flex justify-between items-start gap-2 border-b border-stone-100 pb-3 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {item.customerName || item.customerFullName}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.roomTypeName} &bull; {new Date(item.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={12}
                                fill={star <= item.rating ? '#f59e0b' : 'none'}
                                className={star <= item.rating ? 'text-amber-500' : 'text-slate-200'}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#bfa15f]/10 text-[#bfa15f] border border-[#bfa15f]/25">
                            {isVi ? {
                              'Room': 'Phòng nghỉ',
                              'Service': 'Dịch vụ',
                              'Cleanliness': 'Sạch sẽ',
                              'Staff': 'Nhân viên'
                            }[item.category] || item.category : item.category}
                          </span>
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="relative my-3">
                        <Quote size={20} className="text-stone-100 absolute -top-1 -left-1 rotate-180 opacity-60" />
                        <p className="text-xs text-slate-600 leading-relaxed italic relative z-10 pl-3">
                          "{item.comment}"
                        </p>
                      </div>
                    </div>

                    {/* Hotel response */}
                    {item.reply && (
                      <div className="mt-3 pt-3 border-t border-stone-100 bg-[#faf9f6] p-3 rounded-xl border border-stone-200/40">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MessageSquare size={12} className="text-[#bfa15f]" />
                          <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                            {isVi ? 'Phản hồi từ HMS' : 'Response from HMS'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          {item.reply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer/Pagination */}
        <div className="p-6 border-t border-stone-200/80 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            {isVi ? `Trang ${page + 1} / ${totalPages}` : `Page ${page + 1} of ${totalPages}`}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0 || loading}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-slate-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isVi ? 'Trực tiếp trước' : 'Previous'}
            </button>
            <button
              disabled={page === totalPages - 1 || loading}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-slate-600 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isVi ? 'Sau' : 'Next'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
