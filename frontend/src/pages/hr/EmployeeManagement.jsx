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
  DollarSign
} from 'lucide-react';
import PermissionGate from '../../components/common/PermissionGate';
import employeeService from '../../services/employeeService';
import { useToast } from '../../contexts/ToastContext';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import ExportModal from '../../components/common/ExportModal';
import pdfExportService from '../../services/pdfExportService';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
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

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setShowAddModal(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleManageSalary = (employee) => {
    setSelectedEmployee(employee);
    setShowSalaryModal(true);
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

  const handleExportAll = (options) => {
    try {
      const fileName = pdfExportService.exportEmployeesToPDF(employees, {}, options);
      showSuccess(`Complete employee report exported successfully as ${fileName}`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showError('Failed to export employee report. Please try again.');
    }
  };

  const handleExportFiltered = (options) => {
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

      const fileName = pdfExportService.exportEmployeesToPDF(filteredEmployees, currentFilters, options);
      showSuccess(`Filtered employee report exported successfully as ${fileName}`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showError('Failed to export employee report. Please try again.');
    }
  };

  const handleExportEmployeeDetails = (employee) => {
    try {
      const fileName = pdfExportService.exportEmployeeDetailsPDF(employee);
      showSuccess(`Employee details exported successfully as ${fileName}`);
    } catch (error) {
      console.error('Failed to export employee details:', error);
      showError('Failed to export employee details. Please try again.');
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      const newStatus = employee.employmentStatus === 'active' ? 'inactive' : 'active';
      const response = await employeeService.updateEmployee(employee._id, {
        employmentStatus: newStatus
      });

      if (response.success) {
        showSuccess(`Employee ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchEmployees();
      } else {
        throw new Error(response.message || 'Failed to update employee status');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      showError(error.message || 'Failed to update employee status. Please try again.');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage hospital staff and their information</p>
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
          <PermissionGate module="employees" action="create">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              Import
            </button>
          </PermissionGate>
          <PermissionGate module="employees" action="create">
            <button
              onClick={handleAddEmployee}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
          </PermissionGate>
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
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {employees.filter(emp => emp.employmentStatus === 'active').length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-red-600">
                {employees.filter(emp => emp.employmentStatus === 'inactive').length}
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
                  Actions
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.employmentStatus === 'active' ? 'bg-green-100 text-green-800' :
                        employee.employmentStatus === 'inactive' ? 'bg-red-100 text-red-800' :
                        employee.employmentStatus === 'on-leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.employmentStatus}
                      </span>
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

                        <PermissionGate module="employees" action="update">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionGate>

                        <PermissionGate module="employees" action="update">
                          <button
                            onClick={() => handleManageSalary(employee)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Manage Salary & EPF"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        </PermissionGate>

                        {/* HR cannot deactivate employees - only Admin can */}
                        <PermissionGate module="employees" action="deactivate">
                          <button
                            onClick={() => handleToggleStatus(employee)}
                            className={`p-1 rounded ${
                              employee.isActive
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={employee.isActive ? 'Deactivate Employee' : 'Activate Employee'}
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

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchEmployees();
          }}
          departments={departments}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <EditEmployeeModal
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

      {/* Salary Management Modal */}
      <SalaryManagementModal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        employee={selectedEmployee}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};

// Salary Management Modal Component
const SalaryManagementModal = ({ isOpen, onClose, employee, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    basicSalary: '',
    epfNo: '',
    epfJoiningDate: '',
    bankName: '',
    accountNo: '',
    branchName: '',
    branchCode: '',
    monthlyLeaveAllowance: 3,
    salaryGrade: 'Grade-1'
  });

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        basicSalary: employee.basicSalary ? formatNumberWithCommas(employee.basicSalary.toString()) : '',
        epfNo: employee.epfNo || '',
        epfJoiningDate: employee.epfJoiningDate ? new Date(employee.epfJoiningDate).toISOString().split('T')[0] : '',
        bankName: employee.bankDetails?.bankName || '',
        accountNo: employee.bankDetails?.accountNo || '',
        branchName: employee.bankDetails?.branchName || '',
        branchCode: employee.bankDetails?.branchCode || '',
        monthlyLeaveAllowance: employee.monthlyLeaveAllowance || 3,
        salaryGrade: employee.salaryGrade || 'Grade-1'
      });
    }
  }, [employee, isOpen]);

  // Format number with commas for thousands
  const formatNumberWithCommas = (value) => {
    // Remove all non-digit characters except decimal point
    const numValue = value.replace(/[^\d.]/g, '');
    
    // Split into integer and decimal parts
    const parts = numValue.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? `.${parts[1]}` : '';
    
    // Add commas to integer part
    if (integerPart) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    return integerPart + decimalPart;
  };

  // Remove commas and convert to plain number for processing
  const removeCommasFromNumber = (value) => {
    return value.replace(/,/g, '');
  };

  // Get today's date in YYYY-MM-DD format for max date restriction
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Validation functions
  const validateBasicSalary = (value) => {
    if (value === '') return true;
    const numValue = parseFloat(removeCommasFromNumber(value));
    return !isNaN(numValue) && numValue >= 0;
  };

  const validateEPFNumber = (value) => {
    // Only allow letters, numbers, and hyphens
    return /^[a-zA-Z0-9-]*$/.test(value);
  };

  const validateBankName = (value) => {
    // Only allow letters and spaces
    return /^[a-zA-Z\s]*$/.test(value);
  };

  const validateBranchName = (value) => {
    // Only allow letters and spaces
    return /^[a-zA-Z\s]*$/.test(value);
  };

  const validateAccountNumber = (value) => {
    // Only allow numbers
    return /^\d*$/.test(value);
  };

  const validateBranchCode = (value) => {
    // Only allow numbers
    return /^\d*$/.test(value);
  };

  const validateLeaveAllowance = (value) => {
    if (value === '') return true;
    const numValue = parseInt(value);
    return !isNaN(numValue) && numValue >= 0 && numValue <= 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;

    // Final validation before submission
    if (!validateBasicSalary(formData.basicSalary)) {
      showError('Please enter a valid basic salary (non-negative number)');
      return;
    }

    if (!validateLeaveAllowance(formData.monthlyLeaveAllowance)) {
      showError('Monthly leave allowance must be between 0 and 10 days');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        basicSalary: parseFloat(removeCommasFromNumber(formData.basicSalary)) || 0,
        epfNo: formData.epfNo,
        epfJoiningDate: formData.epfJoiningDate || null,
        bankDetails: {
          bankName: formData.bankName,
          accountNo: formData.accountNo,
          branchName: formData.branchName,
          branchCode: formData.branchCode
        },
        monthlyLeaveAllowance: parseInt(formData.monthlyLeaveAllowance) || 3,
        salaryGrade: formData.salaryGrade
      };

      await employeeService.updateSalary(employee._id, updateData);
      showSuccess('Employee salary details updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating salary details:', error);
      showError(error.message || 'Failed to update salary details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply validation based on field type
    let isValid = true;
    let processedValue = value;

    switch (name) {
      case 'basicSalary':
        // Format with commas as user types
        processedValue = formatNumberWithCommas(value);
        
        // Validate the numeric value (without commas)
        isValid = validateBasicSalary(processedValue);
        if (isValid && value !== '') {
          // Limit to 10 digits (excluding commas)
          const numValue = removeCommasFromNumber(processedValue);
          if (numValue.length > 10) {
            processedValue = formatNumberWithCommas(numValue.slice(0, 10));
          }
        }
        break;
        
      case 'epfNo':
        isValid = validateEPFNumber(value);
        if (isValid) {
          // Limit to 10 characters total
          processedValue = value.slice(0, 10);
        }
        break;
        
      case 'bankName':
        isValid = validateBankName(value);
        if (isValid) {
          // Limit to 15 characters total
          processedValue = value.slice(0, 15);
        }
        break;
        
      case 'branchName':
        isValid = validateBranchName(value);
        if (isValid) {
          // Limit to 15 characters total
          processedValue = value.slice(0, 15);
        }
        break;
        
      case 'accountNo':
        isValid = validateAccountNumber(value);
        if (isValid) {
          // Limit to 15 characters total
          processedValue = value.slice(0, 15);
        }
        break;
        
      case 'branchCode':
        isValid = validateBranchCode(value);
        if (isValid) {
          // Limit to 5 characters total
          processedValue = value.slice(0, 5);
        }
        break;
        
      case 'monthlyLeaveAllowance':
        isValid = validateLeaveAllowance(value);
        if (isValid && value !== '') {
          // Limit to 2 digits
          processedValue = value.slice(0, 2);
          const numValue = parseInt(processedValue);
          if (numValue > 10) {
            processedValue = '10';
          }
        }
        break;
        
      default:
        break;
    }

    if (isValid) {
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Manage Salary & EPF Details
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Employee: {employee.firstName} {employee.lastName} ({employee.employeeId})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Salary Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">💰 Salary Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basic Salary (LKR) *
                  </label>
                  <input
                    type="text" // Changed from "number" to "text" to allow comma formatting
                    name="basicSalary"
                    value={formData.basicSalary}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter basic salary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum 10 digits (commas added automatically)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Grade
                  </label>
                  <select
                    name="salaryGrade"
                    value={formData.salaryGrade}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Grade-1">Grade-1</option>
                    <option value="Grade-2">Grade-2</option>
                    <option value="Grade-3">Grade-3</option>
                    <option value="Senior">Senior</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>
            </div>

            {/* EPF Information */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">🏛️ EPF Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EPF Number
                  </label>
                  <input
                    type="text"
                    name="epfNo"
                    value={formData.epfNo}
                    onChange={handleChange}
                    maxLength="10"
                    pattern="[a-zA-Z0-9-]+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter EPF number"
                  />
                  <p className="text-xs text-gray-500 mt-1">Letters, numbers, and hyphens only (max 10 chars)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EPF Joining Date
                  </label>
                  <input
                    type="date"
                    name="epfJoiningDate"
                    value={formData.epfJoiningDate}
                    onChange={handleChange}
                    max={getTodayDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cannot select future dates</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">🏦 Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    maxLength="15"
                    pattern="[a-zA-Z\s]+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter bank name"
                  />
                  <p className="text-xs text-gray-500 mt-1">Letters only (max 15 chars)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNo"
                    value={formData.accountNo}
                    onChange={handleChange}
                    maxLength="15"
                    pattern="\d*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter account number"
                  />
                  <p className="text-xs text-gray-500 mt-1">Numbers only (max 15 digits)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleChange}
                    maxLength="15"
                    pattern="[a-zA-Z\s]+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter branch name"
                  />
                  <p className="text-xs text-gray-500 mt-1">Letters only (max 15 chars)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    name="branchCode"
                    value={formData.branchCode}
                    onChange={handleChange}
                    maxLength="5"
                    pattern="\d*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter branch code"
                  />
                  <p className="text-xs text-gray-500 mt-1">Numbers only (max 5 digits)</p>
                </div>
              </div>
            </div>

            {/* Leave Configuration */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">📅 Leave Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Leave Allowance (Days)
                </label>
                <input
                  type="number"
                  name="monthlyLeaveAllowance"
                  value={formData.monthlyLeaveAllowance}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter monthly leave allowance"
                  min="0"
                  max="10"
                  maxLength="2"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Leaves beyond this allowance will result in salary deductions (Max: 10 days)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Save Salary Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add Employee Modal Component
const AddEmployeeModal = ({ onClose, onSuccess, departments }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    employeeId: '', // Auto-generated
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    designation: '',
    dateOfBirth: '',
    gender: '',
    role: 'employee',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: ''
    }
  });

  const [loading, setLoading] = useState(false);

  // Auto-generate Employee ID when component mounts
  useEffect(() => {
    generateEmployeeId();
  }, []);

  const generateEmployeeId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    const employeeId = `EMP${year}${randomNum.toString().padStart(4, '0')}`;
    setFormData(prev => ({ ...prev, employeeId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await employeeService.createEmployee(formData);

      if (response.success) {
        showSuccess('Employee created successfully');
        onSuccess();
      } else {
        throw new Error(response.message || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      showError(error.message || 'Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Employee</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee ID Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Employee ID</label>
                <p className="text-lg font-bold text-blue-900">{formData.employeeId}</p>
                <p className="text-xs text-blue-600">Auto-generated unique identifier</p>
              </div>
              <button
                type="button"
                onClick={generateEmployeeId}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Regenerate
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="emergencyContact.phoneNumber"
                  value={formData.emergencyContact.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Employee Modal Component (similar structure to Add but with pre-filled data)
const EditEmployeeModal = ({ employee, onClose, onSuccess, departments }) => {
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
    setLoading(true);

    try {
      // API call to update employee
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Employee</h2>
          <p className="text-sm text-gray-600">{employee.employeeId}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
            <select
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeManagement;