import { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import RoomTypesSection from '../components/home/RoomTypesSection';
import HotelServices from '../components/home/HotelServices';
import FeedbackSection from '../components/home/FeedbackSection';

const today = () => new Date().toISOString().split('T')[0];
const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

export default function HomePage() {
  const [searchParams, setSearchParams] = useState({
    checkIn: today(),
    checkOut: tomorrow(),
    guests: 2,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection onSearchGuests={setSearchParams} />
        <RoomTypesSection
          guestFilter={searchParams.guests}
          checkIn={searchParams.checkIn}
          checkOut={searchParams.checkOut}
        />
        <HotelServices />
        <FeedbackSection />
      </main>
      <Footer />
    </div>
  );
}
