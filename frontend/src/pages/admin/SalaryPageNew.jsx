import { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Download,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  Users,
  Filter
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
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [salaryStats, setSalaryStats] = useState({
    totalPayroll: 0,
    averageSalary: 0,
    highestSalary: 0,
    lowestSalary: 0,
    totalRecords: 0,
    paidCount: 0,
    pendingCount: 0
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Get current month and year
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-based (0 = January)
  const currentMonthName = months[currentMonthIndex];

  // Generate years array - current year and previous years only (no future years)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).sort((a, b) => b - a);

  // Get available months (current month and previous months only)
  const getAvailableMonths = () => {
    // If selected year is current year, only show up to current month
    if (filterYear === currentYear) {
      return months.slice(0, currentMonthIndex + 1).map((month, index) => ({
        name: month,
        value: month,
        index: index + 1
      }));
    }

    // If selected year is previous year, show all months
    if (filterYear < currentYear) {
      return months.map((month, index) => ({
        name: month,
        value: month,
        index: index + 1
      }));
    }

    // If somehow future year is selected, show no months
    return [];
  };

  // Handle year change - reset month if it's not available for the selected year
  const handleYearChange = (newYear) => {
    let newMonth = filterMonth;

    // If changing to current year and selected month is in the future, reset to empty
    if (newYear === currentYear) {
      const availableMonths = getAvailableMonths();
      const currentMonthName = months[currentMonthIndex];
      
      // If current filter month is not available in the new year, reset it
      if (filterMonth && !availableMonths.some(month => month.value === filterMonth)) {
        newMonth = '';
      }
    }

    setFilterYear(newYear);
    setFilterMonth(newMonth);
  };

  // Handle month change with validation
  const handleMonthChange = (newMonth) => {
    if (!newMonth) {
      setFilterMonth('');
      return;
    }

    // If selected year is current year, validate that month is not in the future
    if (filterYear === currentYear) {
      const selectedMonthIndex = months.indexOf(newMonth);
      if (selectedMonthIndex <= currentMonthIndex) {
        setFilterMonth(newMonth);
      }
    } else if (filterYear < currentYear) {
      // For previous years, all months are allowed
      setFilterMonth(newMonth);
    }
  };

  // Initialize with current month and year as default filters
  useEffect(() => {
    setFilterMonth(currentMonthName);
    setFilterYear(currentYear);
  }, []);

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
        employeeName: salary.employee ? `${salary.employee.firstName} ${salary.employee.lastName}` : 'Unknown',
        employeeId: salary.employee?.employeeId || 'N/A',
        department: salary.employee?.department || 'N/A',
        preparedByName: salary.preparedBy ? `${salary.preparedBy.firstName} ${salary.preparedBy.lastName}` : 'System'
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
        totalRecords: 0,
        paidCount: 0,
        pendingCount: 0
      });
      return;
    }

    const netSalaries = salaryData.map(sal => sal.netPayableSalary || 0).filter(sal => sal > 0);
    const total = netSalaries.reduce((sum, sal) => sum + sal, 0);
    const paidCount = salaryData.filter(sal => sal.status === 'paid').length;
    const pendingCount = salaryData.filter(sal => sal.status === 'draft' || sal.status === 'approved').length;

    setSalaryStats({
      totalPayroll: total,
      averageSalary: netSalaries.length > 0 ? total / netSalaries.length : 0,
      highestSalary: netSalaries.length > 0 ? Math.max(...netSalaries) : 0,
      lowestSalary: netSalaries.length > 0 ? Math.min(...netSalaries) : 0,
      totalRecords: salaryData.length,
      paidCount: paidCount,
      pendingCount: pendingCount
    });
  };

  const filteredSalaries = salaryRecords.filter(salary => {
    const matchesSearch =
      salary.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !filterDepartment || salary.department === filterDepartment;
    const matchesStatus = !filterStatus || salary.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(salaryRecords.map(sal => sal.department).filter(Boolean))];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Paid
        </span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Approved
        </span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" /> Draft
        </span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          {status}
        </span>;
    }
  };

  const handleViewDetails = (salary) => {
    setSelectedSalary(salary);
    setShowDetailModal(true);
  };

  const handleGeneratePayslip = async (salary) => {
    try {
      await salaryService.generatePayslipPDF(salary);
      showSuccess('Payslip generated successfully');
    } catch (error) {
      console.error('Error generating payslip:', error);
      showError(error.message || 'Failed to generate payslip');
    }
  };

  const handleApproveSalary = async (salaryId) => {
    try {
      const response = await salaryService.approveSalary(salaryId);
      showSuccess('Salary approved successfully');
      fetchSalaryRecords();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error approving salary:', error);
      showError(error.message || 'Failed to approve salary');
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Month', 'Year', 'Basic Salary', 'Net Salary', 'Status', 'Prepared By'];
    const csvData = filteredSalaries.map(sal => [
      sal.employeeId,
      sal.employeeName,
      sal.department,
      sal.month,
      sal.year,
      sal.basicSalary || 0,
      sal.netPayableSalary || 0,
      sal.status,
      sal.preparedByName
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-report-${filterMonth || 'all'}-${filterYear}.csv`;
    a.click();
  };

  const exportToPDF = async () => {
    try {
      await salaryService.generateSalaryManagementPDF(filteredSalaries, {
        month: filterMonth,
        year: filterYear
      });
      showSuccess('Salary management PDF report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError(error.message || 'Failed to export salary management PDF report');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
        <p className="text-gray-600 mt-2">View and manage salary records prepared by HR</p>
      </div>

      {/* Current filter info */}
      <div className="mt-2 mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
        <span>Showing data up to: {filterMonth || 'All months'} {filterYear}</span>
        {filterYear === currentYear && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            Current Year
          </span>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(salaryStats.totalPayroll)}
              </p>
              <p className="text-xs text-gray-500 mt-1">For {filterMonth || 'all months'} {filterYear}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {salaryStats.totalRecords}
              </p>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-green-600">{salaryStats.paidCount} Paid</span>
                <span className="text-xs text-yellow-600">{salaryStats.pendingCount} Pending</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
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
              <p className="text-xs text-gray-500 mt-1">Per employee</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Salary Range</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(salaryStats.lowestSalary)}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(salaryStats.highestSalary)}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Month Filter with future months disabled */}
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
            <option value="">All Months</option>
            {getAvailableMonths().map(month => (
              <option key={month.value} value={month.value}>
                {month.name}
              </option>
            ))}
          </select>

          {/* Year Filter with future years disabled */}
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year} {year === currentYear ? '(Current)' : ''}
              </option>
            ))}
          </select>

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

          <select
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>

          <button
            onClick={exportToPDF}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Salary Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading salary records...</p>
          </div>
        ) : filteredSalaries.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No salary records found</p>
            <p className="text-gray-500 text-sm mt-2">Salary records created by HR will appear here</p>
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
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basic Salary
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prepared By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSalaries.map((salary) => (
                  <tr key={salary._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {salary.employeeName.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {salary.employeeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {salary.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {salary.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{salary.month}</div>
                      <div className="text-sm text-gray-500">{salary.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(salary.basicSalary)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(salary.netPayableSalary)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(salary.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary.preparedByName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(salary)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleGeneratePayslip(salary)}
                          className="text-green-600 hover:text-green-900"
                          title="Generate Payslip"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        {salary.status === 'draft' && (
                          <button
                            onClick={() => handleApproveSalary(salary._id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Approve Salary"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salary Details Modal */}
      {showDetailModal && selectedSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Salary Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Employee Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedSalary.employeeName}</p>
                  <p><span className="font-medium">Employee ID:</span> {selectedSalary.employeeId}</p>
                  <p><span className="font-medium">Department:</span> {selectedSalary.department}</p>
                  <p><span className="font-medium">Period:</span> {selectedSalary.month} {selectedSalary.year}</p>
                  <p><span className="font-medium">Status:</span> {getStatusBadge(selectedSalary.status)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Salary Breakdown</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Basic Salary:</span> {formatCurrency(selectedSalary.basicSalary)}</p>
                  <p><span className="font-medium">Gross Salary:</span> {formatCurrency(selectedSalary.grossSalary)}</p>
                  <p><span className="font-medium">Total Deductions:</span> {formatCurrency(selectedSalary.deductions?.total || 0)}</p>
                  <p className="text-lg font-bold text-green-600">
                    <span>Net Salary:</span> {formatCurrency(selectedSalary.netPayableSalary)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Attendance</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Working Days:</span> {selectedSalary.attendance?.workingDays || 0}</p>
                  <p><span className="font-medium">Overtime Hours:</span> {selectedSalary.attendance?.overtimeHours || 0}</p>
                  <p><span className="font-medium">Leave Taken:</span> {selectedSalary.attendance?.leaveTaken || 0}</p>
                  <p><span className="font-medium">No Pay Leave:</span> {selectedSalary.attendance?.noPayLeave || 0}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Allowances</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Cost of Living:</span> {formatCurrency(selectedSalary.allowances?.costOfLiving || 0)}</p>
                  <p><span className="font-medium">Food:</span> {formatCurrency(selectedSalary.allowances?.food || 0)}</p>
                  <p><span className="font-medium">Conveyance:</span> {formatCurrency(selectedSalary.allowances?.conveyance || 0)}</p>
                  <p><span className="font-medium">Medical:</span> {formatCurrency(selectedSalary.allowances?.medical || 0)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
              <button
                onClick={() => handleGeneratePayslip(selectedSalary)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Payslip
              </button>
              {selectedSalary.status === 'draft' && (
                <button
                  onClick={() => handleApproveSalary(selectedSalary._id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Salary
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;