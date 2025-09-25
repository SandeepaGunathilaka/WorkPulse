import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Define role-based permissions
const PERMISSIONS = {
  admin: {
    employees: {
      create: true,
      read: true,
      update: true,
      delete: true,
      register: true, // Can register employees with passwords
      deactivate: true, // Can deactivate employees
      password: true // Can set/reset employee passwords
    },
    users: {
      create: true,
      read: true,
      update: true,
      delete: true,
      manageRoles: true,
      resetPasswords: true,
      deactivate: true
    },
    attendance: {
      create: true,
      read: true,
      update: true,
      delete: true,
      viewReports: true
    },
    leaves: {
      create: true,
      read: true,
      update: true,
      delete: true,
      approve: true,
      viewAll: true
    },
    payroll: {
      create: true,
      read: true,
      update: true,
      delete: true,
      process: true
    },
    reports: {
      view: true,
      generate: true,
      export: true
    },
    system: {
      settings: true,
      database: true,
      logs: true,
      backup: true
    }
  },
  hr: {
    employees: {
      create: true,
      read: true,
      update: true,
      delete: true,
      register: false, // Cannot register with passwords
      deactivate: false // Cannot deactivate employees
    },
    users: {
      create: false,
      read: true,
      update: false,
      delete: false,
      manageRoles: false,
      resetPasswords: false,
      deactivate: false
    },
    attendance: {
      create: true,
      read: true,
      update: true,
      delete: false,
      viewReports: true
    },
    leaves: {
      create: true,
      read: true,
      update: true,
      delete: false,
      approve: true,
      viewAll: true
    },
    payroll: {
      create: false,
      read: true,
      update: false,
      delete: false,
      process: false
    },
    reports: {
      view: true,
      generate: true,
      export: true
    },
    system: {
      settings: false,
      database: false,
      logs: false,
      backup: false
    }
  },
  manager: {
    employees: {
      create: false,
      read: true,
      update: false,
      delete: false,
      register: false,
      deactivate: false
    },
    users: {
      create: false,
      read: true,
      update: false,
      delete: false,
      manageRoles: false,
      resetPasswords: false,
      deactivate: false
    },
    attendance: {
      create: false,
      read: true,
      update: false,
      delete: false,
      viewReports: true
    },
    leaves: {
      create: false,
      read: true,
      update: false,
      delete: false,
      approve: true,
      viewAll: false // Only department employees
    },
    payroll: {
      create: false,
      read: false,
      update: false,
      delete: false,
      process: false
    },
    reports: {
      view: true,
      generate: false,
      export: false
    },
    system: {
      settings: false,
      database: false,
      logs: false,
      backup: false
    }
  },
  employee: {
    employees: {
      create: false,
      read: false, // Only own profile
      update: false, // Only own profile
      delete: false,
      register: false,
      deactivate: false
    },
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      manageRoles: false,
      resetPasswords: false,
      deactivate: false
    },
    attendance: {
      create: false, // Clock in/out only
      read: false, // Own attendance only
      update: false,
      delete: false,
      viewReports: false
    },
    leaves: {
      create: true, // Can request leave
      read: false, // Own leaves only
      update: false,
      delete: false,
      approve: false,
      viewAll: false
    },
    payroll: {
      create: false,
      read: false, // Own payslips only
      update: false,
      delete: false,
      process: false
    },
    reports: {
      view: false,
      generate: false,
      export: false
    },
    system: {
      settings: false,
      database: false,
      logs: false,
      backup: false
    }
  }
};

// Route access mapping
const ROUTE_ACCESS = {
  '/admin': ['admin'],
  '/admin/employees': ['admin'],
  '/admin/employees/add': ['admin'],
  '/admin/employees/register': ['admin'],
  '/admin/attendance': ['admin'],
  '/admin/leaves': ['admin'],
  '/admin/schedules': ['admin'],
  '/admin/payroll': ['admin'],
  '/admin/reports': ['admin'],
  '/admin/notifications': ['admin'],
  '/admin/users': ['admin'],
  '/admin/system': ['admin'],

  '/hr': ['hr', 'admin'],
  '/hr/employees': ['hr', 'admin'],
  '/hr/employees/add': ['hr', 'admin'],
  '/hr/attendance': ['hr', 'admin'],
  '/hr/leave': ['hr', 'admin'],
  '/hr/payroll': ['hr', 'admin'],
  '/hr/reports': ['hr', 'admin'],
  '/hr/notifications': ['hr', 'admin'],
  '/hr/settings': ['hr', 'admin'],

  '/manager': ['manager', 'admin'],
  '/manager/attendance': ['manager', 'admin'],
  '/manager/leaves': ['manager', 'admin'],
  '/manager/reports': ['manager', 'admin'],

  '/employee': ['employee', 'manager', 'hr', 'admin'],
  '/employee/attendance': ['employee', 'manager', 'hr', 'admin'],
  '/employee/leaves': ['employee', 'manager', 'hr', 'admin'],
  '/employee/profile': ['employee', 'manager', 'hr', 'admin']
};

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState({});

  useEffect(() => {
    if (user && user.role) {
      setUserPermissions(PERMISSIONS[user.role] || {});
    } else {
      setUserPermissions({});
    }
  }, [user]);

  const hasPermission = (module, action) => {
    if (!userPermissions[module]) return false;
    return userPermissions[module][action] === true;
  };

  const canAccessRoute = (path) => {
    if (!user || !user.role) return false;

    // Check exact path first
    if (ROUTE_ACCESS[path]) {
      return ROUTE_ACCESS[path].includes(user.role);
    }

    // Check parent paths for nested routes
    const pathSegments = path.split('/').filter(Boolean);
    for (let i = pathSegments.length; i > 0; i--) {
      const parentPath = '/' + pathSegments.slice(0, i).join('/');
      if (ROUTE_ACCESS[parentPath]) {
        return ROUTE_ACCESS[parentPath].includes(user.role);
      }
    }

    return false;
  };

  const getUserRole = () => {
    return user?.role || null;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isHR = () => {
    return user?.role === 'hr';
  };

  const isManager = () => {
    return user?.role === 'manager';
  };

  const isEmployee = () => {
    return user?.role === 'employee';
  };

  const getDefaultRoute = () => {
    if (!user?.role) return '/login';

    switch (user.role) {
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

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'hr':
        return 'HR Manager';
      case 'manager':
        return 'Department Manager';
      case 'employee':
        return 'Employee';
      default:
        return 'Unknown';
    }
  };

  const value = {
    userPermissions,
    hasPermission,
    canAccessRoute,
    getUserRole,
    isAdmin,
    isHR,
    isManager,
    isEmployee,
    getDefaultRoute,
    getRoleDisplayName,
    PERMISSIONS,
    ROUTE_ACCESS
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export default RoleContext;