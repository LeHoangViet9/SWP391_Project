import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LocaleProvider } from './context/LocaleContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import BookingPage from './pages/BookingPage';
import InvoicePage from './pages/InvoicePage';
import DashboardRouter from './pages/DashboardRouter';

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OtpVerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Customer Booking Route — mọi role đã đăng nhập */}
            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              }
            />

            {/* Invoice Route — authenticated users */}
            <Route
              path="/invoice/batch"
              element={
                <ProtectedRoute>
                  <InvoicePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice/:bookingId"
              element={
                <ProtectedRoute>
                  <InvoicePage />
                </ProtectedRoute>
              }
            />

            {/* ═══ UNIFIED DASHBOARD — replaces all role-specific dashboards ═══ */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* ═══ BACKWARD COMPATIBILITY — redirect old role-specific paths ═══ */}
            <Route path="/admin/dashboard"        element={<Navigate to="/dashboard" replace />} />
            <Route path="/manager/dashboard"      element={<Navigate to="/dashboard" replace />} />
            <Route path="/receptionist/dashboard"  element={<Navigate to="/dashboard" replace />} />
            <Route path="/housekeeper/dashboard"   element={<Navigate to="/dashboard" replace />} />
            <Route path="/maintenance/dashboard"   element={<Navigate to="/dashboard" replace />} />
            <Route path="/customer/dashboard"      element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LocaleProvider>
  );
}
