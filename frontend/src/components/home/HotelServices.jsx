import { ArrowRight } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { hotelServices } from '../../data/mockData';

export default function HotelServices() {
  const { t } = useLocale();

  return (
    <section id="amenities" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-2">{t('services.subtitle')}</p>
          <h2 className="section-title">{t('services.title')}</h2>
          <div className="w-20 h-0.5 bg-[#bfa15f] mx-auto mt-4" />
        </div>

        <div className="space-y-8 md:space-y-12">
          {hotelServices.map((service) => {
            const title = t(`services.${service.key}.title`);
            const desc = t(`services.${service.key}.desc`);

            return (
              <div
                key={service.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-0 border border-stone-200 shadow-lg overflow-hidden ${
                  service.reverse ? 'lg:[direction:rtl]' : ''
                }`}
              >
                <div className="relative h-64 lg:h-80 overflow-hidden lg:[direction:ltr]">
                  <img
                    src={service.imageUrl}
                    alt={title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                </div>

                <div className="flex flex-col justify-center p-8 md:p-12 bg-stone-50 lg:[direction:ltr]">
                  <h3 className="font-display text-2xl md:text-3xl font-semibold text-slate-800 mb-4">
                    {title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">{desc}</p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-[#bfa15f] font-semibold uppercase text-sm tracking-wider hover:gap-3 transition-all"
                  >
                    {t('rooms.viewDetail')}
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
