import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import RoomTypesSection from '../components/home/RoomTypesSection';
import HotelServices from '../components/home/HotelServices';
import FeedbackSection from '../components/home/FeedbackSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <RoomTypesSection />
        <HotelServices />
        <FeedbackSection />
      </main>
      <Footer />
    </div>
  );
}
