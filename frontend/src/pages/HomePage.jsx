import { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import RoomTypesSection from '../components/home/RoomTypesSection';
import HotelServices from '../components/home/HotelServices';
import FeedbackSection from '../components/home/FeedbackSection';

export default function HomePage() {
  const [guestCount, setGuestCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection onSearchGuests={setGuestCount} />
        <RoomTypesSection guestFilter={guestCount} />
        <HotelServices />
        <FeedbackSection />
      </main>
      <Footer />
    </div>
  );
}
