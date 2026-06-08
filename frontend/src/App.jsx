import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from './context/LocaleContext';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingPage from './pages/BookingPage';

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/booking" element={<BookingPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LocaleProvider>
  );
}
