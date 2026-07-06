import { useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import BookingBar from '../components/home/BookingBar';
import RoomTypesSection from '../components/home/RoomTypesSection';
import { useLocale } from '../context/LocaleContext';

export default function RoomsPage() {
  const { locale } = useLocale();
  const [searchParams] = useSearchParams();

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guestFilter = Number(searchParams.get('guests') || '0');

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />
      
      {/* Premium Hero Banner */}
      <section className="relative bg-neutral-900 py-16 sm:py-24 text-white overflow-hidden">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/90 via-neutral-900/95 to-stone-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 text-center z-10">
          <span className="text-xs uppercase tracking-widest text-[#bfa15f] font-semibold mb-3 block">
            {locale === 'vi' ? 'Lựa chọn hoàn hảo' : 'The Perfect Stay'}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {locale === 'vi' ? 'Tìm Kiếm Phòng Trống' : 'Search Available Rooms'}
          </h1>
          <p className="text-stone-300 max-w-2xl mx-auto text-sm sm:text-base">
            {locale === 'vi' 
              ? 'Khám phá không gian nghỉ dưỡng sang trọng và đẳng cấp, được thiết kế tinh tế cho sự thoải mái tối đa của bạn.' 
              : 'Explore our luxury accommodations, meticulously designed for your ultimate comfort and relaxation.'}
          </p>
        </div>
      </section>

      {/* Interactive Search Bar Section */}
      <section className="relative z-20 -mt-10 sm:-mt-12 px-4 max-w-7xl mx-auto w-full">
        <BookingBar />
      </section>

      {/* Search Results / Room Types Showcase */}
      <main className="flex-1 pb-16">
        <RoomTypesSection
          guestFilter={guestFilter}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      </main>

      <Footer />
    </div>
  );
}
