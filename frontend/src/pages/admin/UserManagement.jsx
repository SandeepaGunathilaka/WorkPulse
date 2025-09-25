import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  UserX,
  UserCheck,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for demonstration
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Mock API call
      setTimeout(() => {
        const mockUsers = [
          {
            _id: '1',
            employeeId: 'EMP20240001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@hospital.lk',
            phoneNumber: '+94771234567',
            department: 'Cardiology',
            designation: 'Senior Doctor',
            role: 'employee',
            employmentStatus: 'active',
            isActive: true,
            lastLogin: '2024-01-15T10:30:00Z',
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            _id: '2',
            employeeId: 'EMP20240002',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@hospital.lk',
            phoneNumber: '+94771234568',
            department: 'Emergency',
            designation: 'Head Nurse',
            role: 'manager',
            employmentStatus: 'active',
            isActive: true,
            lastLogin: '2024-01-14T15:45:00Z',
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            _id: '3',
            employeeId: 'EMP20240003',
            firstName: 'Mike',
            lastName: 'Johnson',
            email: 'mike.johnson@hospital.lk',
            phoneNumber: '+94771234569',
            department: 'HR',
            designation: 'HR Manager',
            role: 'hr',
            employmentStatus: 'active',
            isActive: false,
            lastLogin: '2024-01-10T09:15:00Z',
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            _id: '4',
            employeeId: 'ADMIN001',
            firstName: 'Sarah',
            lastName: 'Wilson',
            email: 'admin@hospital.lk',
            phoneNumber: '+94771234570',
            department: 'IT',
            designation: 'System Administrator',
            role: 'admin',
            employmentStatus: 'active',
            isActive: true,
            lastLogin: '2024-01-15T16:20:00Z',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ];
        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (user.isActive) {
      // Show deactivation modal for more detailed process
      setSelectedUser(user);
      setShowDeactivationModal(true);
    } else {
      // Simple activation
      const confirmMessage = `Are you sure you want to activate ${user.firstName} ${user.lastName}? They will regain system access.`;

      if (window.confirm(confirmMessage)) {
        try {
          console.log('Activating user:', user._id);

          setUsers(prevUsers =>
            prevUsers.map(u =>
              u._id === user._id
                ? {
                    ...u,
                    isActive: true,
                    employmentStatus: 'active',
                    reactivatedAt: new Date().toISOString(),
                    deactivationReason: null
                  }
                : u
            )
          );

          alert(`${user.firstName} ${user.lastName} has been successfully activated.`);
        } catch (error) {
          console.error('Failed to activate user:', error);
          alert('Failed to activate user. Please try again.');
        }
      }
    }
  };

  const handleDeactivateUser = async (reason) => {
    if (!selectedUser || !reason.trim()) {
      alert('Please provide a reason for deactivation.');
      return;
    }

    try {
      console.log('Deactivating user:', selectedUser._id, 'Reason:', reason);

      setUsers(prevUsers =>
        prevUsers.map(u =>
          u._id === selectedUser._id
            ? {
                ...u,
                isActive: false,
                employmentStatus: 'inactive',
                deactivatedAt: new Date().toISOString(),
                deactivationReason: reason,
                deactivatedBy: 'Current Admin' // In real app, use actual admin info
              }
            : u
        )
      );

      setShowDeactivationModal(false);
      setDeactivationReason('');
      setSelectedUser(null);

      alert(`${selectedUser.firstName} ${selectedUser.lastName} has been deactivated successfully.`);
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      alert('Failed to deactivate user. Please try again.');
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        // API call to update role
        console.log('Updating role:', userId, newRole);

        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u._id === userId
              ? { ...u, role: newRole }
              : u
          )
        );
      } catch (error) {
        console.error('Failed to update role:', error);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'hr': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">Admin Access Required</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(user => user.isActive).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold text-red-600">
                {users.filter(user => !user.isActive).length}
              </p>
            </div>
            <UserX className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Users</p>
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(user => user.role === 'admin').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">Loading users...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.employeeId}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 ${getRoleColor(user.role)}`}
                        disabled={user.role === 'admin'}
                      >
                        <option value="employee">Employee</option>
                        <option value="hr">HR</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isActive)}`}>
                        {user.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-orange-600 hover:text-orange-900 p-1 rounded"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {/* Toggle Status Button */}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`p-1 rounded ${
                              user.isActive
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}

                        {/* More Actions */}
                        <div className="relative">
                          <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <PasswordResetModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Deactivation Modal */}
      {showDeactivationModal && selectedUser && (
        <DeactivationModal
          user={selectedUser}
          onClose={() => {
            setShowDeactivationModal(false);
            setSelectedUser(null);
            setDeactivationReason('');
          }}
          onConfirm={handleDeactivateUser}
          reason={deactivationReason}
          setReason={setDeactivationReason}
        />
      )}
    </div>
  );
};

// Password Reset Modal Component
const PasswordResetModal = ({ user, onClose, onSuccess }) => {
  const [resetType, setResetType] = useState('manual'); // 'manual' or 'temp'
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const generateTempPassword = async () => {
    setLoading(true);
    try {
      // API call to generate temp password
      const generatedPassword = Math.random().toString(36).slice(-12);
      setTempPassword(generatedPassword);
      console.log('Generated temp password for:', user._id);
      setLoading(false);
    } catch (error) {
      console.error('Failed to generate temp password:', error);
      setLoading(false);
    }
  };

  const handleManualReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // API call to reset password
      console.log('Resetting password for:', user._id, 'New password:', newPassword);
      setTimeout(() => {
        onSuccess();
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to reset password:', error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
              <p className="text-sm text-gray-600">{user.firstName} {user.lastName} ({user.employeeId})</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Reset Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Reset Method</label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={resetType === 'manual'}
                  onChange={(e) => setResetType(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Set custom password</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="temp"
                  checked={resetType === 'temp'}
                  onChange={(e) => setResetType(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Generate temporary password</span>
              </label>
            </div>
          </div>

          {/* Manual Password Form */}
          {resetType === 'manual' && (
            <form onSubmit={handleManualReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Show passwords</span>
              </label>
            </form>
          )}

          {/* Temporary Password Generation */}
          {resetType === 'temp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPassword}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Click generate to create temporary password"
                  />
                  <button
                    type="button"
                    onClick={generateTempPassword}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {tempPassword && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Important:</p>
                        <p>Share this temporary password securely with the user. They should change it on first login.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          {resetType === 'manual' ? (
            <button
              onClick={handleManualReset}
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          ) : (
            <button
              onClick={onSuccess}
              disabled={!tempPassword}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              Confirm Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Deactivation Modal Component
const DeactivationModal = ({ user, onClose, onConfirm, reason, setReason }) => {
  const [loading, setLoading] = useState(false);

  const deactivationReasons = [
    'Voluntary Resignation',
    'Termination for Cause',
    'End of Contract',
    'Medical Leave',
    'Performance Issues',
    'Disciplinary Action',
    'Redundancy',
    'Administrative Decision',
    'Other'
  ];

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Please select or enter a reason for deactivation.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Deactivate User Account</h2>
              <p className="text-sm text-gray-600">{user.firstName} {user.lastName} ({user.employeeId})</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Warning: This action will:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Immediately revoke system access</li>
                    <li>Lock the user account</li>
                    <li>Prevent future logins</li>
                    <li>Require admin intervention to reactivate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Deactivation *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason...</option>
                {deactivationReasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {reason === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify:
                </label>
                <textarea
                  value={reason === 'Other' ? '' : reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter specific reason for deactivation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> This action will be logged and can be reviewed in the audit trail.
                The user can be reactivated later by an administrator if needed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Deactivating...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Deactivate User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;