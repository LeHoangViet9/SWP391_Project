import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from './context/LocaleContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import HousekeeperDashboard from './pages/HousekeeperDashboard';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import CustomerDashboard from './pages/CustomerDashboard';

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
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Customer Route — mọi role đã đăng nhập */}
            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard — ADMIN toàn quyền */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Manager Dashboard — dùng chung AdminDashboard */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Receptionist Dashboard */}
            <Route
              path="/receptionist/dashboard"
              element={
                <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />

            {/* Housekeeper Dashboard */}
            <Route
              path="/housekeeper/dashboard"
              element={
                <ProtectedRoute allowedRoles={['HOUSEKEEPER', 'ADMIN']}>
                  <HousekeeperDashboard />
                </ProtectedRoute>
              }
            />

            {/* Maintenance Dashboard */}
            <Route
              path="/maintenance/dashboard"
              element={
                <ProtectedRoute allowedRoles={['MAINTENANCE', 'ADMIN']}>
                  <MaintenanceDashboard />
                </ProtectedRoute>
              }
            />

            {/* Customer Dashboard */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LocaleProvider>
  );
}
