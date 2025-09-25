import { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  Edit2,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle
} from 'lucide-react';
import { salaryService } from '../../services/salaryService';
import { useToast } from '../../contexts/ToastContext';

const SalaryPage = () => {
  const { showSuccess, showError } = useToast();
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [salaryStats, setSalaryStats] = useState({
    totalPayroll: 0,
    averageSalary: 0,
    highestSalary: 0,
    lowestSalary: 0,
    totalEmployees: 0,
    paidCount: 0,
    pendingCount: 0
  });

  useEffect(() => {
    fetchSalaryRecords();
  }, [filterMonth, filterYear]);

  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;

      const response = await salaryService.getAllSalaries(params);
      const salaries = response.data || [];

      // Process salary records with employee information
      const processedSalaries = salaries.map(salary => ({
        ...salary,
        employeeName: salary.employee?.firstName + ' ' + salary.employee?.lastName,
        employeeId: salary.employee?.employeeId,
        department: salary.employee?.department,
        basicSalary: salary.basicSalary,
        netSalary: salary.netPayableSalary,
        status: salary.status,
        month: salary.month,
        year: salary.year,
        createdAt: salary.createdAt,
        preparedBy: salary.preparedBy
      }));

      setSalaryRecords(processedSalaries);
      calculateSalaryStats(processedSalaries);
    } catch (error) {
      console.error('Error fetching salary records:', error);
      showError('Failed to load salary records');
      setSalaryRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalaryStats = (salaryData) => {
    if (!salaryData || salaryData.length === 0) {
      setSalaryStats({
        totalPayroll: 0,
        averageSalary: 0,
        highestSalary: 0,
        lowestSalary: 0,
        totalEmployees: 0,
        paidCount: 0,
        pendingCount: 0
      });
      return;
    }

    const netSalaries = salaryData.map(sal => sal.netSalary || 0).filter(sal => sal > 0);
    const total = netSalaries.reduce((sum, sal) => sum + sal, 0);
    const paidCount = salaryData.filter(sal => sal.status === 'paid').length;
    const pendingCount = salaryData.filter(sal => sal.status === 'draft' || sal.status === 'approved').length;

    setSalaryStats({
      totalPayroll: total,
      averageSalary: netSalaries.length > 0 ? total / netSalaries.length : 0,
      highestSalary: netSalaries.length > 0 ? Math.max(...netSalaries) : 0,
      lowestSalary: netSalaries.length > 0 ? Math.min(...netSalaries) : 0,
      totalEmployees: salaryData.length,
      paidCount: paidCount,
      pendingCount: pendingCount
    });
  };

  const filteredSalaries = salaryRecords.filter(salary => {
    const matchesSearch =
      salary.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !filterDepartment || salary.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(salaryRecords.map(sal => sal.department).filter(Boolean))];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleUpdateSalary = async (employeeId, newSalary) => {
    try {
      const response = await employeeService.updateEmployee(employeeId, { salary: newSalary });
      if (response.success) {
        showSuccess('Salary updated successfully');
        fetchEmployeesWithSalaries();
        setShowEditModal(false);
      } else {
        showError(response.message || 'Failed to update salary');
      }
    } catch (error) {
      console.error('Error updating salary:', error);
      showError('Failed to update salary');
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Month', 'Year', 'Basic Salary', 'Net Salary', 'Status'];
    const csvData = filteredSalaries.map(sal => [
      sal.employeeId,
      sal.employeeName,
      sal.department,
      sal.month,
      sal.year,
      sal.basicSalary || 0,
      sal.netSalary || 0,
      sal.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
        <p className="text-gray-600 mt-2">Manage and view all employee salaries</p>
      </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(salaryStats.totalPayroll)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(salaryStats.averageSalary)}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(salaryStats.highestSalary)}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lowest Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(salaryStats.lowestSalary)}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 rotate-180" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {salaryStats.totalEmployees}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Salary Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading salary data...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Salary
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                              {employee.firstName?.[0]}{employee.lastName?.[0]}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {employee.department || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(employee.salary)}
                        </div>
                        <div className="text-xs text-gray-500">Per Month</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.joiningDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(employee)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(employee)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Salary Modal */}
        {showEditModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Edit Salary Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <p className="text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedEmployee.employeeId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <p className="text-gray-900">{selectedEmployee.department || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Salary
                  </label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedEmployee.salary)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Salary
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={selectedEmployee.salary}
                    id="new-salary-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const newSalary = document.getElementById('new-salary-input').value;
                    handleUpdateSalary(selectedEmployee._id, newSalary);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Salary
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SalaryPage;