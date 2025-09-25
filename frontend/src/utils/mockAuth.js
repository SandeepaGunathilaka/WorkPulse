// Temporary mock authentication for testing
export const mockLogin = (role = 'hr') => {
  const mockUsers = {
    admin: {
      id: '1',
      employeeId: 'ADMIN001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@hospital.lk',
      role: 'admin',
      department: 'Administration'
    },
    hr: {
      id: '2',
      employeeId: 'HR001',
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@hospital.lk',
      role: 'hr',
      department: 'HR'
    },
    manager: {
      id: '3',
      employeeId: 'MGR001',
      firstName: 'Department',
      lastName: 'Manager',
      email: 'manager@hospital.lk',
      role: 'manager',
      department: 'Emergency'
    },
    employee: {
      id: '4',
      employeeId: 'EMP001',
      firstName: 'Regular',
      lastName: 'Employee',
      email: 'employee@hospital.lk',
      role: 'employee',
      department: 'Cardiology'
    }
  };

  const user = mockUsers[role];
  const token = `mock-token-${Date.now()}`;

  // Store in localStorage
  console.log('🎭 Mock login for role:', role, 'with user:', user);
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  console.log('💾 Stored in localStorage - token:', token.substring(0, 20) + '...', 'user:', user);

  // Trigger custom storage event for same-tab detection
  window.dispatchEvent(new Event('localStorage-changed'));
  console.log('📡 Dispatched localStorage-changed event');

  return { user, token };
};

export const mockLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};