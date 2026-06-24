import { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import RoomTypesSection from '../components/home/RoomTypesSection';
import HotelServices from '../components/home/HotelServices';

export default function HomePage() {
  const [searchParams, setSearchParams] = useState({
    checkIn: '',
    checkOut: '',
    guests: 0,
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
      </main>
      <Footer />
    </div>
  );
}
