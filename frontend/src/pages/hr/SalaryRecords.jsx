import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Eye, Edit2, Trash2,
  Check, X, FileText, Calendar, DollarSign, User,
  Building2, CreditCard, AlertCircle, TrendingUp, Clock
} from 'lucide-react';
import { salaryService } from '../../services/salaryService';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/currencyFormatter';

const SalaryRecords = () => {
  const { showSuccess, showError } = useToast();
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [showDetails, setShowDetails] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years array - current year and previous years only (no future years)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).sort((a, b) => b - a);

  // Get current month and year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-based (0 = January)

  // Get available months (current month and previous months only)
  const getAvailableMonths = () => {
    // If selected year is current year, only show up to current month
    if (filterYear === currentYear) {
      return months.slice(0, currentMonth + 1).map((month, index) => ({
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
      const currentMonthName = months[currentMonth];
      
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
      if (selectedMonthIndex <= currentMonth) {
        setFilterMonth(newMonth);
      }
    } else if (filterYear < currentYear) {
      // For previous years, all months are allowed
      setFilterMonth(newMonth);
    }
  };

  // Initialize with current month and year as default filters
  useEffect(() => {
    const currentMonthName = months[currentMonth];
    setFilterMonth(currentMonthName);
    setFilterYear(currentYear);
  }, []);

  useEffect(() => {
    fetchSalaryRecords();
  }, [currentPage, searchTerm, filterStatus, filterMonth, filterYear]);

  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        month: filterMonth || undefined,
        year: filterYear || undefined
      };

      const response = await salaryService.getAllSalaries(params);
      setSalaryRecords(response.data || []);
      setTotalPages(Math.ceil((response.total || 0) / 10));
    } catch (error) {
      console.error('Error fetching salary records:', error);
      showError('Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await salaryService.approveSalary(id);
      showSuccess('Salary record approved successfully');
      fetchSalaryRecords();
    } catch (error) {
      showError('Failed to approve salary record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      try {
        await salaryService.deleteSalary(id);
        showSuccess('Salary record deleted successfully');
        fetchSalaryRecords();
      } catch (error) {
        showError('Failed to delete salary record');
      }
    }
  };

  const handleDownloadPDF = async (record) => {
    try {
      await salaryService.generatePayslipPDF(record);
      showSuccess('PDF generated successfully');
    } catch (error) {
      showError('Failed to generate PDF');
    }
  };

  const filteredRecords = salaryRecords.filter(record => {
    const matchesSearch =
      record.employeeInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeInfo?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const SalaryDetailsModal = ({ record, onClose }) => {
    if (!record) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-6xl max-h-[95vh] overflow-y-auto border border-gray-100">
          <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Salary Details
                </h2>
                <p className="text-lg text-gray-600 font-medium mt-1">{record.employeeInfo?.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-3 rounded-full transition-all duration-200 transform hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Employee Information
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Employee ID:</strong> {record.employeeInfo?.employeeId}</div>
                <div><strong>Name:</strong> {record.employeeInfo?.name}</div>
                <div><strong>Designation:</strong> {record.employeeInfo?.designation}</div>
                <div><strong>EPF No:</strong> {record.employeeInfo?.epfNo || 'N/A'}</div>
                <div><strong>Department:</strong> {record.employeeInfo?.department}</div>
              </div>
            </div>

            {/* Salary Period */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Salary Period
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Month:</strong> {record.month}</div>
                <div><strong>Year:</strong> {record.year}</div>
                <div><strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                    {record.status || 'draft'}
                  </span>
                </div>
                <div><strong>Generated On:</strong> {new Date(record.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Attendance Details */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3">Attendance Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Working Days:</strong> {record.attendance?.workingDays || 0}</div>
                <div><strong>Leave Taken:</strong> {record.attendance?.leaveTaken || 0}</div>
                <div><strong>Overtime Hours:</strong> {record.attendance?.overtimeHours || 0}</div>
                <div><strong>No Pay Leave:</strong> {record.attendance?.noPayLeave || 0}</div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-800 mb-3 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Bank Details
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Bank Name:</strong> {record.employeeInfo?.bankName || 'N/A'}</div>
                <div><strong>Account No:</strong> {record.employeeInfo?.accountNo || 'N/A'}</div>
                <div><strong>Branch:</strong> {record.employeeInfo?.branchName || 'N/A'}</div>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Earnings
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Basic Salary:</span>
                  <span>{formatCurrency(record.basicSalary || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Allowances:</span>
                  <span>{formatCurrency(record.allowances?.total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime:</span>
                  <span>{formatCurrency(record.additionalPerks?.overtime || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bonus:</span>
                  <span>{formatCurrency(record.additionalPerks?.bonus || 0)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Gross Salary:</span>
                  <span>{formatCurrency(record.grossSalary || 0)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-3">Deductions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>EPF Employee (8%):</span>
                  <span>{formatCurrency(Math.round((record.basicSalary || 0) * 0.08))}</span>
                </div>
                <div className="flex justify-between">
                  <span>No Pay Deduction:</span>
                  <span>{formatCurrency(record.deductions?.noPayDaysDeduction || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salary Advance:</span>
                  <span>{formatCurrency(record.deductions?.salaryAdvance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>APIT:</span>
                  <span>{formatCurrency(record.deductions?.apit || 0)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Deductions:</span>
                  <span>{formatCurrency(record.deductions?.total || 0)}</span>
                </div>
              </div>
            </div>

            {/* EPF/ETF Contributions */}
            <div className="bg-yellow-50 rounded-lg p-4 lg:col-span-2">
              <h3 className="font-semibold text-yellow-800 mb-3">EPF/ETF Contributions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">EPF Employee (8%)</div>
                  <div>{formatCurrency(Math.round((record.basicSalary || 0) * 0.08))}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">EPF Employer (12%)</div>
                  <div>{formatCurrency(Math.round((record.basicSalary || 0) * 0.12))}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">ETF (3%)</div>
                  <div>{formatCurrency(Math.round((record.basicSalary || 0) * 0.03))}</div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2 text-center">
              <h3 className="font-bold text-2xl text-gray-800 mb-2">Net Payable Salary</h3>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(record.netPayableSalary || 0)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-100">
            <button
              onClick={() => handleDownloadPDF(record)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-3 font-semibold"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Section with improved design */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Salary Records
                </h1>
                <p className="text-gray-600 mt-2 text-lg">View and manage all employee salary records</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export All
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Records</p>
                  <p className="text-2xl font-bold">{salaryRecords.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Approved</p>
                  <p className="text-2xl font-bold">
                    {salaryRecords.filter(r => r.status === 'approved').length}
                  </p>
                </div>
                <Check className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Draft</p>
                  <p className="text-2xl font-bold">
                    {salaryRecords.filter(r => r.status === 'draft').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(salaryRecords.reduce((sum, r) => sum + (r.netPayableSalary || 0), 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search with enhanced design */}
      <div className="mx-6 mb-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Enhanced Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Enhanced Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Enhanced Month Filter with future months disabled */}
            <div className="relative">
              <select
                value={filterMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
              >
                <option value="">All Months</option>
                {getAvailableMonths().map(month => (
                  <option key={month.value} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Enhanced Year Filter with future years disabled */}
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year} {year === currentYear ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
          
          {/* Current filter info */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Showing data up to: {filterMonth || 'All months'} {filterYear}</span>
            {filterYear === currentYear && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Current Year
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Salary Records Table */}
      <div className="mx-6 mb-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading salary records...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Basic Salary
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Net Salary
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                              <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Salary Records Found</h3>
                            <p className="text-gray-500">Try adjusting your search filters or add new salary records.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record, index) => (
                        <tr key={record._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {record.employeeInfo?.name || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500 font-medium">
                                  ID: {record.employeeInfo?.employeeId || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{record.month} {record.year}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(record.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                              <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(record.basicSalary || 0)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-green-500 mr-2" />
                              <div className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                                {formatCurrency(record.netPayableSalary || 0)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full shadow-sm ${getStatusColor(record.status)}`}>
                              {record.status === 'approved' && <Check className="w-3 h-3 mr-1" />}
                              {record.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                              {record.status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                              {record.status || 'draft'}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowDetails(record)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200 group-hover:scale-110"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadPDF(record)}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-all duration-200 group-hover:scale-110"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-5" />
                              </button>
                              {record.status !== 'approved' && (
                                <button
                                  onClick={() => handleApprove(record._id)}
                                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-all duration-200 group-hover:scale-110"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(record._id)}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200 group-hover:scale-110"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-6 py-3 border-2 border-blue-300 text-sm font-bold rounded-xl text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-6 py-3 border-2 border-blue-300 text-sm font-bold rounded-xl text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                      <p className="text-sm text-gray-700 font-medium">
                        Showing page <span className="font-bold text-blue-600">{currentPage}</span> of{' '}
                        <span className="font-bold text-blue-600">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-6 py-3 border-2 border-blue-300 text-sm font-bold rounded-xl text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-6 py-3 border-2 border-blue-300 text-sm font-bold rounded-xl text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <SalaryDetailsModal
          record={showDetails}
          onClose={() => setShowDetails(null)}
        />
      )}
    </div>
  );
};

export default SalaryRecords;