import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { heroSlides } from '../../data/mockData';
import BookingBar from './BookingBar';

export default function HeroSection() {
  const { locale, t } = useLocale();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + heroSlides.length) % heroSlides.length);
  const next = () => setCurrent((c) => (c + 1) % heroSlides.length);

  const slide = heroSlides[current];
  const slideTitle = locale === 'vi' ? slide.titleVi : slide.titleEn;

  return (
    <section id="home" className="relative">
      {/* Carousel */}
      <div className="relative h-[55vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
        {heroSlides.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={s.imageUrl}
              alt={locale === 'vi' ? s.titleVi : s.titleEn}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
          </div>
        ))}

        {/* Overlay Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <p className="section-subtitle text-white/90 mb-3">{t('hero.subtitle')}</p>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-2xl leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-xl mb-2">{t('hero.description')}</p>
            <p className="text-[#cda152] font-medium text-lg">{slideTitle}</p>
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-[#bfa15f]/80 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-[#bfa15f]/80 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-32 md:bottom-40 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === current ? 'bg-[#bfa15f] w-8' : 'bg-white/50'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Booking Bar — overlapping banner bottom */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 -mt-16 md:-mt-20 lg:-mt-24 pb-8">
        <BookingBar />
      </div>
    </section>
  );
}
