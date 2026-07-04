import { useEffect, useState } from 'react';
import { Star, Award, ShieldCheck, Heart } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { getPublicFeedbackStats } from '../../services/feedbackService';

const DEFAULT_STATS = {
  averageRating: 0,
  totalReviews: 0,
  ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
};

export default function FeedbackSection() {
  const { locale, t } = useLocale();
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const isVi = locale === 'vi';

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await getPublicFeedbackStats({}, locale);
        if (res?.data) {
          setStats(res.data);
        }
      } catch (error) {
        console.warn('Failed to fetch public feedback stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [locale]);

  const { averageRating, totalReviews, ratingDistribution } = stats;

  // Calculate percentages safely
  const getPercentage = (ratingKey) => {
    const count = ratingDistribution[ratingKey] || 0;
    if (totalReviews <= 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  // Determine feedback label based on rating
  const getRatingLabel = (rating) => {
    if (totalReviews === 0) return isVi ? 'Chưa có đánh giá' : 'No reviews yet';
    if (rating >= 4.5) return isVi ? 'Tuyệt vời' : 'Excellent';
    if (rating >= 4.0) return isVi ? 'Rất tốt' : 'Very Good';
    if (rating >= 3.0) return isVi ? 'Trung bình' : 'Good';
    return isVi ? 'Cần cải thiện' : 'Needs Improvement';
  };

  return (
    <section id="reviews" className="py-16 md:py-24 bg-gradient-to-b from-[#faf9f6] to-[#f4f2ec]">
      <div className="max-w-4xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="section-subtitle mb-2">{t('homeFeedback.subtitle')}</p>
          <h2 className="section-title text-slate-800">{t('homeFeedback.title')}</h2>
          <div className="w-20 h-0.5 bg-[#bfa15f] mx-auto mt-4" />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bfa15f]" />
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-stone-200/60 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
              
              {/* Left Column: Big Average Rating Score */}
              <div className="col-span-1 md:col-span-5 text-center flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-200/80 pb-8 md:pb-0 md:pr-8">
                <span className="text-xs uppercase tracking-widest text-[#bfa15f] font-bold mb-3">
                  {isVi ? 'Độ hài lòng chung' : 'Overall Guest Rating'}
                </span>
                
                {/* Big Score Display */}
                <div className="relative mb-2">
                  <div className="text-7xl md:text-8xl font-serif font-semibold text-slate-800 leading-none">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm font-semibold text-slate-400 mt-2">
                    / 5.0
                  </div>
                </div>

                {/* Stars Display */}
                <div className="flex text-amber-500 gap-1 my-3">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const ratingValue = i + 1;
                    const isFilled = ratingValue <= Math.floor(averageRating);
                    const isHalf = !isFilled && ratingValue - 0.5 <= averageRating;
                    return (
                      <Star
                        key={i}
                        size={22}
                        fill={isFilled ? '#f59e0b' : isHalf ? 'url(#halfGrad)' : 'none'}
                        className="text-amber-500"
                      />
                    );
                  })}
                  {/* SVG Gradient Definition for half filled star */}
                  <svg className="w-0 h-0 absolute">
                    <defs>
                      <linearGradient id="halfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Rating Descriptive Label & Total Counts */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-2">
                  <Award size={13} />
                  {getRatingLabel(averageRating)}
                </span>

                <p className="text-xs text-slate-400 mt-1">
                  {isVi ? `Dựa trên ${totalReviews} lượt đánh giá thực tế` : `Based on ${totalReviews} verified guest reviews`}
                </p>
              </div>

              {/* Right Column: Rating Distribution Breakdown */}
              <div className="col-span-1 md:col-span-7 space-y-3.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const pct = getPercentage(stars);
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      {/* Star Count Label */}
                      <span className="w-10 text-xs font-semibold text-slate-500 flex items-center justify-end gap-1">
                        {stars} <Star size={11} className="text-amber-500 shrink-0 fill-amber-500" />
                      </span>
                      
                      {/* Progress Bar Container */}
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#bfa15f] to-[#d8b975] rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      
                      {/* Percentage & Count */}
                      <span className="w-12 text-xs text-right font-medium text-slate-400">
                        {pct}%
                      </span>
                    </div>
                  );
                })}

                {/* Trust Badges Footer */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-150/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#bfa15f]" />
                    <span className="text-[10px] md:text-xs font-medium text-slate-500">
                      {isVi ? '100% Đánh giá thật' : '100% Verified Guests'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Heart size={16} className="text-[#bfa15f]" />
                    <span className="text-[10px] md:text-xs font-medium text-slate-500">
                      {isVi ? 'Môi trường thân thiện' : 'Hospitality Standard'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </section>
  );
}
