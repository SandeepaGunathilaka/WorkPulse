import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../contexts/RoleContext';

const ProtectedRoute = ({ children, requiredRoles = [], requireAuth = true }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { canAccessRoute, getUserRole } = useRole();
  const location = useLocation();

  console.log('🔒 ProtectedRoute check:', {
    path: location.pathname,
    user: !!user,
    isAuthenticated,
    loading,
    requiredRoles,
    requireAuth,
    userRole: user?.role
  });

  // Skip loading check - user state is initialized immediately

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    console.log('🚫 Redirecting to login - not authenticated');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if specific roles are required
  if (requiredRoles.length > 0) {
    const userRole = getUserRole();
    if (!userRole || !requiredRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on user's role
      const redirectPath = getDefaultRouteForRole(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Check route access permissions
  if (user && !canAccessRoute(location.pathname)) {
    // Redirect to appropriate dashboard based on user's role
    const redirectPath = getDefaultRouteForRole(getUserRole());
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'hr':
      return '/hr';
    case 'manager':
      return '/manager';
    case 'employee':
      return '/employee';
    default:
      return '/login';
  }
};

export default ProtectedRoute;