import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoute, getDefaultDashboardPath, isStaffRole } from '../../utils/roleAccess';

export default function RoleProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const role = user?.roleName;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (!isStaffRole(role)) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultDashboardPath(role)} replace />;
  }

  if (!canAccessRoute(role, location.pathname)) {
    return <Navigate to={getDefaultDashboardPath(role)} replace />;
  }

  return children;
}
