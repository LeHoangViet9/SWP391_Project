import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LocaleProvider } from './context/LocaleContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import HousekeeperDashboard from './pages/HousekeeperDashboard';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import UserManagementPage from './pages/auth/UserManagementPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import EquipmentListPage from './pages/equipment/EquipmentListPage';
import EquipmentFormPage from './pages/equipment/EquipmentFormPage';
import CustomerListPage from './pages/customer/CustomerListPage';
import CustomerFormPage from './pages/customer/CustomerFormPage';
import BookingTodayPage from './pages/booking/BookingTodayPage';
import BookingListPage from './pages/booking/BookingListPage';
import BookingFormPage from './pages/booking/BookingFormPage';

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE'];
const CUSTOMER_ROLES = ['ADMIN', 'MANAGER', 'RECEPTIONIST'];
const BOOKING_VIEW_ROLES = ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER'];
const BOOKING_MANAGE_ROLES = ['ADMIN', 'MANAGER', 'RECEPTIONIST'];
const EQUIPMENT_VIEW_ROLES = STAFF_ROLES;
const EQUIPMENT_EDIT_ROLES = ['ADMIN', 'MANAGER', 'MAINTENANCE'];

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              <Route
                path="/booking"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/receptionist/dashboard" element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}><ReceptionistDashboard /></ProtectedRoute>} />
              <Route path="/housekeeper/dashboard" element={<ProtectedRoute allowedRoles={['HOUSEKEEPER', 'ADMIN']}><HousekeeperDashboard /></ProtectedRoute>} />
              <Route path="/maintenance/dashboard" element={<ProtectedRoute allowedRoles={['MAINTENANCE', 'ADMIN']}><MaintenanceDashboard /></ProtectedRoute>} />

              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={STAFF_ROLES}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StaffDashboardPage />} />

                <Route
                  path="customers"
                  element={
                    <ProtectedRoute allowedRoles={CUSTOMER_ROLES}>
                      <CustomerListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="customers/create"
                  element={
                    <ProtectedRoute allowedRoles={CUSTOMER_ROLES}>
                      <CustomerFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="customers/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={CUSTOMER_ROLES}>
                      <CustomerFormPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="equipments"
                  element={
                    <ProtectedRoute allowedRoles={EQUIPMENT_VIEW_ROLES}>
                      <EquipmentListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="equipments/create"
                  element={
                    <ProtectedRoute allowedRoles={EQUIPMENT_EDIT_ROLES}>
                      <EquipmentFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="equipments/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={EQUIPMENT_EDIT_ROLES}>
                      <EquipmentFormPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="bookings/today"
                  element={
                    <ProtectedRoute allowedRoles={BOOKING_VIEW_ROLES}>
                      <BookingTodayPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="bookings"
                  element={
                    <ProtectedRoute allowedRoles={BOOKING_VIEW_ROLES}>
                      <BookingListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="bookings/create"
                  element={
                    <ProtectedRoute allowedRoles={BOOKING_MANAGE_ROLES}>
                      <BookingFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="bookings/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={BOOKING_MANAGE_ROLES}>
                      <BookingFormPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="profile/change-password" element={<ChangePasswordPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
