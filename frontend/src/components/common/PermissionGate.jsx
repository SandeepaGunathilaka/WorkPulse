import { useRole } from '../../contexts/RoleContext';

const PermissionGate = ({
  children,
  module,
  action,
  roles = [],
  fallback = null,
  showFallback = true
}) => {
  const { hasPermission, getUserRole } = useRole();

  // Check role-based access
  if (roles.length > 0) {
    const userRole = getUserRole();
    if (!userRole || !roles.includes(userRole)) {
      return showFallback ? fallback : null;
    }
  }

  // Check permission-based access
  if (module && action) {
    if (!hasPermission(module, action)) {
      return showFallback ? fallback : null;
    }
  }

  return children;
};

export default PermissionGate;