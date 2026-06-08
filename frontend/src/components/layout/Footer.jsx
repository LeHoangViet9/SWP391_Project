import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Award } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { footerBranches } from '../../data/mockData';

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About */}
          <div>
            <h3 className="text-white font-display text-xl font-semibold mb-4">
              HMS <span className="text-[#bfa15f]">Luxury</span>
            </h3>
            <p className="text-sm leading-relaxed mb-4">{t('footer.aboutText')}</p>
            <div className="flex items-center gap-2 text-[#bfa15f]">
              <Award size={18} />
              <span className="text-sm font-medium">{t('footer.certifications')}: 5★ ASEAN</span>
            </div>
          </div>

          {/* Branches */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-sm mb-4">
              {t('footer.branches')}
            </h4>
            <ul className="space-y-3">
              {footerBranches.map((b) => (
                <li key={b.city} className="text-sm">
                  <p className="text-white font-medium">{b.city}</p>
                  <p className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} className="text-[#bfa15f] shrink-0" />
                    {b.address}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone size={12} className="text-[#bfa15f] shrink-0" />
                    {b.phone}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-sm mb-4">
              {t('footer.policies')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-[#bfa15f] transition-colors">
                  {t('footer.policyBooking')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#bfa15f] transition-colors">
                  {t('footer.policyPrivacy')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#bfa15f] transition-colors">
                  {t('footer.policyCancel')}
                </a>
              </li>
            </ul>

            <h4 className="text-white font-semibold uppercase tracking-wider text-sm mt-6 mb-4">
              {t('footer.contact')}
            </h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-[#bfa15f]" />
                1900 1838
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-[#bfa15f]" />
                contact@hms-luxury.vn
              </p>
            </div>
          </div>

          {/* Map & Social */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-sm mb-4">
              {t('footer.followUs')}
            </h4>
            <div className="flex gap-3 mb-6">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 border border-stone-700 rounded flex items-center justify-center hover:border-[#bfa15f] hover:text-[#bfa15f] transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="bg-stone-800 border border-stone-700 rounded h-40 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={24} className="text-[#bfa15f] mx-auto mb-2" />
                <p className="text-xs text-stone-500">Google Maps Embed</p>
                <p className="text-xs">136 Lê Thánh Tôn, Q.1, TP.HCM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p>{t('footer.copyright')}</p>
          <p>SSL Secured Booking · PCI DSS Compliant</p>
        </div>
      </div>
    </footer>
  );
}
