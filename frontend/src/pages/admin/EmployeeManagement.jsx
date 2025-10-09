import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Download,
  Upload,
  Settings,
  MoreVertical,
  ChevronDown,
  Key,
  Shield
} from 'lucide-react';
import PermissionGate from '../../components/common/PermissionGate';
import employeeService from '../../services/employeeService';
import { useToast } from '../../contexts/ToastContext';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import ExportModal from '../../components/common/ExportModal';
import pdfExportService from '../../services/pdfExportService';

const AdminEmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('employee'); // Default to show only employees
  const [filterStatus, setFilterStatus] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { showSuccess, showError } = useToast();

  // Mock departments - in real app, fetch from API
  const departments = [
    'Emergency', 'Cardiology', 'Pediatrics', 'Orthopedics',
    'Neurology', 'Radiology', 'Laboratory', 'Administration', 'IT'
  ];

  // Mock data for demonstration
  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, filterDepartment, filterRole, filterStatus]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Prepare query parameters
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        department: filterDepartment,
        role: filterRole,
        status: filterStatus
      };

      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await employeeService.getAllEmployees(params);

      if (response.success) {
        setEmployees(response.data);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        throw new Error(response.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      showError(error.message || 'Failed to load employees. Please try again.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };


  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    setDeleteLoading(true);
    try {
      const response = await employeeService.deleteEmployee(selectedEmployee._id);

      if (response.success) {
        showSuccess('Employee deleted successfully');
        setShowDeleteModal(false);
        setSelectedEmployee(null);
        fetchEmployees(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Failed to delete employee:', error);
      showError(error.message || 'Failed to delete employee. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedEmployee(null);
    setDeleteLoading(false);
  };

  const handleExportPDF = () => {
    setShowExportModal(true);
  };

  const handleExportAll = async (options) => {
    try {
      const fileName = await pdfExportService.exportEmployeesToPDF(employees, {}, options);
      showSuccess(`Complete employee report exported successfully as ${fileName}`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showError('Failed to export employee report. Please try again.');
    }
  };

  const handleExportFiltered = async (options) => {
    try {
      const currentFilters = {
        search: searchTerm,
        department: filterDepartment,
        role: filterRole,
        status: filterStatus
      };

      // Remove empty filters
      Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) delete currentFilters[key];
      });

      const fileName = await pdfExportService.exportEmployeesToPDF(filteredEmployees, currentFilters, options);
      showSuccess(`Filtered employee report exported successfully as ${fileName}`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showError('Failed to export employee report. Please try again.');
    }
  };

  const handleExportEmployeeDetails = async (employee) => {
    try {
      const fileName = await pdfExportService.exportEmployeeDetailsPDF(employee);
      showSuccess(`Employee details exported successfully as ${fileName}`);
    } catch (error) {
      console.error('Failed to export employee details:', error);
      showError('Failed to export employee details. Please try again.');
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      let response;
      if (employee.isActive) {
        // Deactivate employee
        response = await employeeService.deactivateEmployee(employee._id);
        if (response.success) {
          showSuccess('Employee deactivated successfully. They cannot log in until reactivated.');
        }
      } else {
        // Activate employee
        response = await employeeService.activateEmployee(employee._id);
        if (response.success) {
          showSuccess('Employee activated successfully. They can now log in to the system.');
        }
      }

      if (response.success) {
        fetchEmployees();
      } else {
        throw new Error(response.message || 'Failed to update employee status');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      showError(error.message || 'Failed to update employee status. Please try again.');
    }
  };

  const handleSetPassword = (employee) => {
    setSelectedEmployee(employee);
    setShowPasswordModal(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !filterDepartment || employee.department === filterDepartment;
    const matchesRole = !filterRole || employee.role === filterRole;
    const matchesStatus = !filterStatus || employee.employmentStatus === filterStatus;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Employee Management</h1>
          <p className="text-gray-600">Manage employee login access, passwords, and permissions</p>
        </div>
        <div className="flex gap-3">
          <PermissionGate module="reports" action="export">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </PermissionGate>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
            <p className="text-sm text-purple-700">
              <span className="font-medium">Note:</span> Employee registration is done by HR. Admin manages login access, passwords & permissions. Deactivated employees cannot log in until reactivated.
            </p>
          </div>
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
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="employee">Employee</option>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
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
            <option value="on-leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Login Enabled</p>
              <p className="text-2xl font-bold text-green-600">
                {employees.filter(emp => emp.isActive).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Login Disabled</p>
              <p className="text-2xl font-bold text-red-600">
                {employees.filter(emp => !emp.isActive).length}
              </p>
            </div>
            <UserX className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
            </div>
            <Filter className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">Loading employees...</p>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{employee.employeeId}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.department}</div>
                      <div className="text-sm text-gray-500">{employee.designation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        employee.role === 'hr' ? 'bg-blue-100 text-blue-800' :
                        employee.role === 'manager' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive ? 'Active' : 'Deactivated'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.employmentStatus === 'active' ? 'bg-blue-100 text-blue-800' :
                          employee.employmentStatus === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          employee.employmentStatus === 'on-leave' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.employmentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(employee.joiningDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <PermissionGate module="reports" action="export">
                          <button
                            onClick={() => handleExportEmployeeDetails(employee)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Export Employee Details PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </PermissionGate>

                        <PermissionGate module="employees" action="password">
                          <div className="relative">
                            <button
                              onClick={() => handleSetPassword(employee)}
                              className={`p-1 rounded ${
                                employee.passwordSet === false
                                  ? 'text-red-600 hover:text-red-900 animate-pulse'
                                  : 'text-purple-600 hover:text-purple-900'
                              }`}
                              title={employee.passwordSet === false ? "Password Required! Click to set password" : "Set/Reset Password"}
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            {employee.passwordSet === false && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                        </PermissionGate>

                        <PermissionGate module="employees" action="update">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionGate>

                        <PermissionGate module="employees" action="deactivate">
                          <button
                            onClick={() => handleToggleStatus(employee)}
                            className={`p-1 rounded ${
                              employee.isActive
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={employee.isActive ? 'Deactivate Employee (Prevent Login)' : 'Activate Employee (Allow Login)'}
                          >
                            {employee.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </PermissionGate>

                        <PermissionGate module="employees" action="delete">
                          <button
                            onClick={() => handleDeleteEmployee(employee)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <AdminEditEmployeeModal
          employee={selectedEmployee}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchEmployees();
          }}
          departments={departments}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDeleteEmployee}
        title="Delete Employee"
        message="Are you sure you want to permanently delete this employee? This action will remove all their data from the system."
        confirmText="Delete Employee"
        cancelText="Cancel"
        loading={deleteLoading}
        employeeName={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}
        employeeId={selectedEmployee?.employeeId}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportAll={handleExportAll}
        onExportFiltered={handleExportFiltered}
        totalEmployees={employees.length}
        filteredEmployees={filteredEmployees.length}
        currentFilters={{
          search: searchTerm,
          department: filterDepartment,
          role: filterRole,
          status: filterStatus
        }}
      />

      {/* Password Setting Modal */}
      {showPasswordModal && selectedEmployee && (
        <PasswordSetModal
          employee={selectedEmployee}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
            showSuccess('Password updated successfully');
          }}
        />
      )}
    </div>
  );
};


// Admin Edit Employee Modal
const AdminEditEmployeeModal = ({ employee, onClose, onSuccess, departments }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    email: employee.email || '',
    phoneNumber: employee.phoneNumber || '',
    department: employee.department || '',
    designation: employee.designation || '',
    role: employee.role || 'employee',
    employmentStatus: employee.employmentStatus || 'active'
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();


    const nameRegex = /^[a-zA-Z\s]+$/;
    const emailRegex = /^[a-zA-Z0-9@._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (formData.firstName && !nameRegex.test(formData.firstName)) {
      showError('First name can only contain letters and spaces');
      return;
    }
    if (formData.lastName && !nameRegex.test(formData.lastName)) {
      showError('Last name can only contain letters and spaces');
      return;
    }
    if (formData.email && !emailRegex.test(formData.email)) {
      showError('Email must contain only letters, numbers, @ symbol, dots, and hyphens');
      return;
    }
    setLoading(true);

    try {
      const response = await employeeService.updateEmployee(employee._id, formData);

      if (response.success) {
        showSuccess('Employee updated successfully');
        onSuccess();
      } else {
        throw new Error(response.message || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
      showError(error.message || 'Failed to update employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === 'firstName' || name === 'lastName') {
    // Only allow letters and spaces
    const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  } else if (name === 'email') {
    let newValue = value.toLowerCase(); // convert to lowercase
    newValue = newValue.replace(/[^a-z0-9@._-]/g, ''); // only letters, numbers, @, ., _, -

    // Only allow one @
    const atIndex = newValue.indexOf('@');
    if (atIndex !== -1) {
      const beforeAt = newValue.slice(0, atIndex).slice(0, 64); // limit local part to 64
      const afterAt = newValue.slice(atIndex + 1).replace(/@/g, ''); // remove extra @
      newValue = beforeAt + '@' + afterAt;
    }

    // Limit total length to 254
    if (newValue.length > 254) {
      newValue = newValue.slice(0, 254);
    }

    setFormData(prev => ({
      ...prev,
      email: newValue
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Admin: Edit Employee</h2>
              <p className="text-sm text-gray-600">{employee.employeeId}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">Letters and spaces only</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">Letters and spaces only</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500">Letters, numbers, @ symbol, dots, and hyphens only</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
            <select
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on-leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Password Setting Modal
const PasswordSetModal = ({ employee, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Call API to set/reset password
      const response = await employeeService.setPassword(employee._id, formData.newPassword);

      if (response.success) {
        onSuccess();
      } else {
        throw new Error(response.message || 'Failed to set password');
      }
    } catch (error) {
      console.error('Failed to set password:', error);
      showError(error.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Set/Reset Password</h2>
              <p className="text-sm text-gray-600">{employee.firstName} {employee.lastName}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Confirm new password"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              This will set a new password for the employee's login account.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEmployeeManagement;