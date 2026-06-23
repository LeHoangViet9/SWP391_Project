import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Search, Reply, Send, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import Toast from './shared/Toast';

const MOCK_FEEDBACK = [
  {
    id: 1,
    customerName: 'Nguyễn Văn A',
    roomType: 'Deluxe Suite',
    rating: 5,
    comment: 'Phòng cực kỳ sạch sẽ, view hướng biển siêu đẹp. Nhân viên phục vụ rất nhiệt tình chu đáo. Sẽ quay lại lần sau!',
    createdAt: '2026-06-20T10:30:00Z',
    reply: 'Cảm ơn ông Nguyễn Văn A đã dành thời gian đánh giá dịch vụ của HMS Luxury. Rất hân hạnh được phục vụ ông trong tương lai!'
  },
  {
    id: 2,
    customerName: 'Trần Thị B',
    roomType: 'Executive Room',
    rating: 4,
    comment: 'Không gian sang trọng, dịch vụ tốt. Tuy nhiên đồ ăn sáng buffet cần phong phú thêm một chút.',
    createdAt: '2026-06-18T14:15:00Z',
    reply: null
  },
  {
    id: 3,
    customerName: 'John Doe',
    roomType: 'Presidential Suite',
    rating: 5,
    comment: 'Exceptional service! The Presidential Suite exceeded our expectations. Truly a 5-star luxury experience.',
    createdAt: '2026-06-15T08:00:00Z',
    reply: 'Thank you Mr. John Doe! We are thrilled to hear you had an exceptional stay. Hope to welcome you back soon.'
  },
  {
    id: 4,
    customerName: 'Phạm Minh C',
    roomType: 'Superior Twin',
    rating: 3,
    comment: 'Phòng ốc tạm ổn, nhưng máy lạnh ở phòng hơi ồn về đêm. Hy vọng khách sạn bảo trì lại thiết bị sớm.',
    createdAt: '2026-06-12T16:45:00Z',
    reply: null
  },
  {
    id: 5,
    customerName: 'Lê Hoàng D',
    roomType: 'Standard Room',
    rating: 2,
    comment: 'Thủ tục check-in hơi lâu mặc dù tôi đã đặt trước. Phòng cũng hơi nhỏ so với ảnh chụp trên web.',
    createdAt: '2026-06-10T11:20:00Z',
    reply: null
  }
];

export default function FeedbackManager() {
  const { hasAnyPermission } = useAuth();
  const { locale } = useLocale();
  const isVi = locale === 'vi';

  const canReply = hasAnyPermission(['FEEDBACK_UPDATE']);
  const canDelete = hasAnyPermission(['FEEDBACK_DELETE']);

  const [feedbacks, setFeedbacks] = useState(() => {
    const saved = localStorage.getItem('hms_feedbacks');
    return saved ? JSON.parse(saved) : MOCK_FEEDBACK;
  });

  const [filterRating, setFilterRating] = useState(0);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    localStorage.setItem('hms_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const handleOpenReply = (item) => {
    setReplyTarget(item);
    setReplyText(item.reply || '');
  };

  const handleSaveReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setFeedbacks(prev => prev.map(f => {
      if (f.id === replyTarget.id) {
        return { ...f, reply: replyText.trim() };
      }
      return f;
    }));

    notify(isVi ? 'Đã phản hồi đánh giá thành công!' : 'Feedback replied successfully!');
    setReplyTarget(null);
    setReplyText('');
  };

  const handleDeleteFeedback = (id) => {
    if (!window.confirm(isVi ? 'Bạn có chắc chắn muốn xóa phản hồi này?' : 'Are you sure you want to delete this feedback?')) return;
    setFeedbacks(prev => prev.filter(f => f.id !== id));
    notify(isVi ? 'Đã xóa đánh giá!' : 'Feedback deleted!');
  };

  // Metrics
  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1) : '0.0';
  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: feedbacks.filter(f => f.rating === stars).length
  }));

  // Filtering logic
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchRating = filterRating === 0 || f.rating === filterRating;
    const matchSearch = !search.trim() || 
      f.customerName.toLowerCase().includes(search.toLowerCase()) ||
      f.comment.toLowerCase().includes(search.toLowerCase()) ||
      (f.roomType && f.roomType.toLowerCase().includes(search.toLowerCase()));
    return matchRating && matchSearch;
  });

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
              />
            ))}
          </div>
          <span className="text-xs text-white/40 mt-3">
            {isVi ? `Dựa trên ${feedbacks.length} lượt đánh giá` : `Based on ${feedbacks.length} reviews`}
          </span>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-[#112240] border border-white/[0.08] p-5 rounded-2xl md:col-span-2 space-y-2.5">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-1">
            {isVi ? 'Phân Phối Điểm Đánh Giá' : 'Rating Distribution'}
          </span>
          {ratingCounts.map(({ stars, count }) => {
            const pct = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
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
      <div className="flex flex-col sm:flex-row justify-between gap-3 bg-[#112240] p-4 rounded-2xl border border-white/[0.08]">
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

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterRating(0)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterRating === 0
                ? 'bg-[#bfa15f]/15 border-[#bfa15f] text-[#bfa15f]'
                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            {isVi ? 'Tất cả' : 'All'}
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
              {stars} <Star size={11} fill={filterRating === stars ? '#bfa15f' : 'none'} />
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-[#112240] border border-white/[0.08] p-12 text-center rounded-2xl">
            <MessageSquare className="mx-auto text-white/20 mb-3" size={36} />
            <p className="text-sm text-white/40">
              {isVi ? 'Không tìm thấy đánh giá nào phù hợp.' : 'No matching feedback found.'}
            </p>
          </div>
        ) : (
          filteredFeedbacks.map((item) => (
            <div key={item.id} className="bg-[#112240] border border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-lg hover:border-white/15 transition-all">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/[0.05] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{item.customerName}</h4>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {item.roomType} &bull; {new Date(item.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}
                  </p>
                </div>
                <div className="flex gap-0.5 text-[#bfa15f]">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= item.rating ? '#bfa15f' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
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
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                  {isVi ? 'Nội dung phản hồi' : 'Response Message'}
                </label>
                <textarea
                  required
                  rows={4}
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
                  className="flex items-center gap-1.5 px-5 py-2 text-sm btn-gold rounded-xl font-semibold shadow"
                >
                  <Send size={14} />
                  {isVi ? 'Gửi phản hồi' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
