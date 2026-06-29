import { useEffect, useState } from 'react';
import { Star, MessageSquare, Quote } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { getPublicFeedbacks } from '../../services/feedbackService';

const MOCK_FEEDBACKS = [
  {
    id: 'mock-1',
    customerName: 'Nguyễn Văn Hải',
    rating: 5,
    category: 'Service',
    comment: 'Dịch vụ tuyệt vời, nhân viên rất nhiệt tình và chu đáo. Tôi sẽ quay lại!',
    roomTypeName: 'Executive Suite',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reply: 'Cảm ơn bạn Hải đã đánh giá tốt về dịch vụ của chúng tôi! Rất hân hạnh được phục vụ quý khách.'
  },
  {
    id: 'mock-2',
    customerName: 'Lê Thị Bình',
    rating: 5,
    category: 'Room',
    comment: 'Phòng sạch sẽ, view đẹp hướng sông Hương thơ mộng, không gian rất yên tĩnh và sang trọng.',
    roomTypeName: 'Deluxe River View',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reply: 'Rất vui vì bạn Bình đã có một kỳ nghỉ thoải mái tại khách sạn! Chúc bạn luôn hạnh phúc.'
  },
  {
    id: 'mock-3',
    customerName: 'John Doe',
    rating: 5,
    category: 'Staff',
    comment: 'Outstanding hospitality. The receptionist was super friendly and helpful throughout our stay.',
    roomTypeName: 'Signature Suite',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    reply: 'Thank you John for your kind words! We hope to welcome you back to HMS Hotel soon.'
  }
];

export default function FeedbackSection() {
  const { locale, t } = useLocale();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const isVi = locale === 'vi';

  useEffect(() => {
    async function fetchFeedbacks() {
      try {
        const res = await getPublicFeedbacks(locale);
        let list = res?.data || [];
        if (list.length < 3) {
          list = [...list, ...MOCK_FEEDBACKS.slice(0, 3 - list.length)];
        }
        setFeedbacks(list);
      } catch (error) {
        console.warn('Failed to fetch public feedbacks, using mock data:', error);
        setFeedbacks(MOCK_FEEDBACKS);
      } finally {
        setLoading(false);
      }
    }
    fetchFeedbacks();
  }, [locale]);

  return (
    <section id="reviews" className="py-16 md:py-24 bg-gradient-to-b from-[#faf9f6] to-[#f4f2ec]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-2">{t('homeFeedback.subtitle')}</p>
          <h2 className="section-title text-slate-800">{t('homeFeedback.title')}</h2>
          <div className="w-20 h-0.5 bg-[#bfa15f] mx-auto mt-4" />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bfa15f]" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <p>{t('homeFeedback.noFeedback')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {feedbacks.slice(0, 3).map((item) => (
              <div 
                key={item.id} 
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-stone-200/60 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">
                        {item.customerName || item.customerFullName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {item.roomTypeName}
                      </p>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[#bfa15f]/10 text-[#bfa15f] border border-[#bfa15f]/25">
                      {isVi ? {
                        'Room': 'Phòng nghỉ',
                        'Service': 'Dịch vụ',
                        'Cleanliness': 'Sạch sẽ',
                        'Staff': 'Nhân viên'
                      }[item.category] || item.category : item.category}
                    </span>
                  </div>

                  {/* Stars Rating */}
                  <div className="flex text-amber-500 gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < item.rating ? '#f59e0b' : 'none'}
                        className={i < item.rating ? 'text-amber-500' : 'text-slate-200'}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <div className="relative mb-4">
                    <Quote size={24} className="text-stone-200 absolute -top-2 -left-2 rotate-180 -z-0 opacity-60" />
                    <p className="text-xs text-slate-600 leading-relaxed italic relative z-10 pl-4">
                      "{item.comment}"
                    </p>
                  </div>
                </div>

                {/* Reply from Hotel */}
                {item.reply && (
                  <div className="mt-4 pt-4 border-t border-stone-100 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare size={12} className="text-[#bfa15f]" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        {t('homeFeedback.replyFromHotel')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      "{item.reply}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
