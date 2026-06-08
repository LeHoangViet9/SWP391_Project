import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Bảo vệ route theo đăng nhập và (tuỳ chọn) danh sách role.
 * - Chưa đăng nhập → /login?redirect=...
 * - Sai quyền → /unauthorized
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const role = user?.roleName;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  }

  return children;
}
