import React, { useState, useEffect } from 'react';
import {
  Users, BarChart3, TrendingUp, Calendar, Download, Filter,
  FileText, PieChart, Activity, Clock, Building2, UserCheck,
  AlertCircle, Eye, Search, MapPin, User, Briefcase
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import { useToast } from '../../contexts/ToastContext';

const EmployeeReports = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    departmentBreakdown: [],
    positionBreakdown: [],
    ageDistribution: [],
    tenureDistribution: [],
    monthlyTrends: []
  });
  const [filters, setFilters] = useState({
    reportType: 'overview',
    dateRange: 'this-month',
    department: '',
    status: 'all'
  });
  const [employees, setEmployees] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch employees data
      const employeesRes = await employeeService.getAllEmployees({ limit: 1000 });
      const employeesData = employeesRes.data || [];
      setEmployees(employeesData);

      // Calculate report data
      calculateReportData(employeesData);
    } catch (error) {
      showError('Failed to fetch employee data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for consistent data access
  const getEmployeeStatus = (emp) => {
    const status = emp.status || emp.employmentStatus || emp.workInfo?.status ||
                  emp.employmentDetails?.status || 'active';
    return status.toLowerCase();
  };

  const getEmployeeDepartment = (emp) => {
    return emp.department || emp.workInfo?.department || emp.employmentDetails?.department || 'Other';
  };

  const getEmployeePosition = (emp) => {
    return emp.designation || emp.position || emp.jobTitle || emp.workInfo?.designation ||
           emp.workInfo?.position || emp.employmentDetails?.designation || 'Other';
  };

  const getEmployeeName = (emp) => {
    return emp.name || emp.fullName || emp.firstName || emp.personalInfo?.name ||
           emp.personalInfo?.fullName || emp.personalInfo?.firstName ||
           (emp.personalInfo?.firstName && emp.personalInfo?.lastName ?
            `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : '') ||
           'Unknown Employee';
  };

  const calculateReportData = (employees) => {
    // Basic stats
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => getEmployeeStatus(emp) === 'active').length;
    const inactiveEmployees = totalEmployees - activeEmployees;

    // Department breakdown
    const departmentData = {};
    employees.forEach(emp => {
      const dept = getEmployeeDepartment(emp);
      if (!departmentData[dept]) {
        departmentData[dept] = { count: 0, active: 0, inactive: 0 };
      }
      departmentData[dept].count++;
      if (getEmployeeStatus(emp) === 'active') {
        departmentData[dept].active++;
      } else {
        departmentData[dept].inactive++;
      }
    });

    const departmentBreakdown = Object.entries(departmentData).map(([dept, data]) => ({
      department: dept,
      employees: data.count,
      active: data.active,
      inactive: data.inactive,
      percentage: totalEmployees > 0 ? ((data.count / totalEmployees) * 100).toFixed(1) : 0
    }));

    // Position breakdown
    const positionData = {};
    employees.forEach(emp => {
      const position = getEmployeePosition(emp);
      if (!positionData[position]) {
        positionData[position] = 0;
      }
      positionData[position]++;
    });

    const positionBreakdown = Object.entries(positionData).map(([position, count]) => ({
      position,
      count,
      percentage: totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : 0
    })).sort((a, b) => b.count - a.count);

    // Age distribution
    const ageRanges = [
      { range: '18-25', min: 18, max: 25, count: 0 },
      { range: '26-35', min: 26, max: 35, count: 0 },
      { range: '36-45', min: 36, max: 45, count: 0 },
      { range: '46-55', min: 46, max: 55, count: 0 },
      { range: '55+', min: 55, max: 100, count: 0 }
    ];

    employees.forEach(emp => {
      // Get date of birth from various possible fields
      const dateOfBirth = emp.dateOfBirth || emp.dob || emp.personalInfo?.dateOfBirth || emp.personalInfo?.dob;
      if (dateOfBirth) {
        const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
        ageRanges.forEach(range => {
          if (age >= range.min && age <= range.max) {
            range.count++;
          }
        });
      }
    });

    // Tenure distribution
    const tenureRanges = [
      { range: '0-1 year', min: 0, max: 1, count: 0 },
      { range: '1-3 years', min: 1, max: 3, count: 0 },
      { range: '3-5 years', min: 3, max: 5, count: 0 },
      { range: '5-10 years', min: 5, max: 10, count: 0 },
      { range: '10+ years', min: 10, max: 100, count: 0 }
    ];

    employees.forEach(emp => {
      // Get join date from various possible fields
      const joinDate = emp.dateOfJoining || emp.joinDate || emp.startDate ||
                      emp.workInfo?.dateOfJoining || emp.employmentDetails?.dateOfJoining ||
                      emp.createdAt;
      if (joinDate) {
        const tenure = (new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24 * 365);
        tenureRanges.forEach(range => {
          if (tenure >= range.min && (range.max === 100 ? tenure >= range.min : tenure < range.max)) {
            range.count++;
          }
        });
      }
    });

    setReportData({
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      departmentBreakdown,
      positionBreakdown,
      ageDistribution: ageRanges,
      tenureDistribution: tenureRanges,
      monthlyTrends: [] // This would come from backend analytics
    });
  };

  const handleExportReport = () => {
    // Generate CSV data
    const csvData = [
      ['Department', 'Total Employees', 'Active', 'Inactive', 'Percentage'],
      ...reportData.departmentBreakdown.map(dept => [
        dept.department,
        dept.employees,
        dept.active,
        dept.inactive,
        dept.percentage + '%'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    showSuccess('Report exported successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Professional Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Geometric patterns for professional look */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-employees" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e40af" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-employees)" />
          </svg>
        </div>

        {/* Floating elements with corporate colors */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-slate-400/8 to-blue-500/8 rounded-full blur-2xl animate-float-slow"></div>

        {/* Corporate accent lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-200/30 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-200/30 to-transparent"></div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
      `}</style>

      {/* Professional Header Section */}
      <div className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/30 relative z-10">
        <div className="px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="relative">
                {/* Professional icon container */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 ring-4 ring-blue-100">
                  <Users className="w-12 h-12 text-white" />
                </div>
                {/* Status indicator */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              </div>
              <div className="space-y-1">
                {/* Professional title */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    Employee Reports & Analytics
                  </h1>
                  <div className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Dashboard</span>
                  </div>
                </div>
                <p className="text-gray-600 text-lg font-medium leading-relaxed">
                  Comprehensive workforce analytics and employee insights
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium">Real-time Data</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Updated {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Professional action buttons */}
            <div className="flex items-center gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-2">
                <button
                  onClick={handleExportReport}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-3 font-semibold"
                >
                  <Download className="w-5 h-5" />
                  Export Report
                </button>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-2">
                <button className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-3 font-semibold">
                  <Eye className="w-5 h-5" />
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* Professional Filters Section */}
          <div className="mt-12">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/30 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-md">
                    <Filter className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Report Filters</h3>
                    <p className="text-gray-600 text-sm">Configure your analytics parameters</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-emerald-700 font-semibold">Auto-refresh</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Report Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Report Type</label>
                  <div className="relative">
                    <select
                      value={filters.reportType}
                      onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer font-medium text-gray-800 shadow-sm hover:shadow-md"
                    >
                      <option value="overview">Overview Report</option>
                      <option value="departments">Department Analysis</option>
                      <option value="demographics">Demographics</option>
                      <option value="performance">Performance</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1 rounded-md">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Date Range Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Date Range</label>
                  <div className="relative">
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer font-medium text-gray-800 shadow-sm hover:shadow-md"
                    >
                      <option value="this-month">This Month</option>
                      <option value="last-month">Last Month</option>
                      <option value="this-quarter">This Quarter</option>
                      <option value="this-year">This Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1 rounded-md">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Department Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Department</label>
                  <div className="relative">
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer font-medium text-gray-800 shadow-sm hover:shadow-md"
                    >
                      <option value="">All Departments</option>
                      {reportData.departmentBreakdown.map(dept => (
                        <option key={dept.department} value={dept.department}>{dept.department}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1 rounded-md">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Status</label>
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer font-medium text-gray-800 shadow-sm hover:shadow-md"
                    >
                      <option value="all">All Employees</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1 rounded-md">
                      <UserCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="px-8 py-8 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl animate-pulse"></div>
              </div>
              <p className="text-gray-700 font-bold text-xl">Generating reports...</p>
              <p className="text-gray-500 text-sm mt-2">Please wait while we analyze your data</p>
            </div>
          </div>
        ) : (
          <>
            {/* Professional Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {/* Total Employees Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Employees</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {reportData.totalEmployees}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Registered employees
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors duration-300">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 font-medium">All departments</span>
                  </div>
                </div>
              </div>

              {/* Active Employees Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Active Employees</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {reportData.activeEmployees}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Currently working
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl group-hover:bg-emerald-100 transition-colors duration-300">
                    <UserCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-600 font-medium">
                      {reportData.totalEmployees > 0 ? ((reportData.activeEmployees / reportData.totalEmployees) * 100).toFixed(1) : 0}% active rate
                    </span>
                  </div>
                </div>
              </div>

              {/* Inactive Employees Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Inactive Employees</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {reportData.inactiveEmployees}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Not currently active
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl group-hover:bg-orange-100 transition-colors duration-300">
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600 font-medium">
                      {reportData.totalEmployees > 0 ? ((reportData.inactiveEmployees / reportData.totalEmployees) * 100).toFixed(1) : 0}% inactive
                    </span>
                  </div>
                </div>
              </div>

              {/* Department Count Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Departments</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {reportData.departmentBreakdown.length}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Active departments
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl group-hover:bg-purple-100 transition-colors duration-300">
                    <Building2 className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm text-indigo-600 font-medium">Across hospital</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Department Distribution Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="bg-blue-600 p-3 rounded-xl mr-4 shadow-md">
                    <PieChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Department Distribution</h3>
                    <p className="text-gray-600 text-sm">Employee distribution by department</p>
                  </div>
                </div>

                {/* Enhanced Pie Chart */}
                <div className="flex flex-col items-center">
                  {reportData.departmentBreakdown.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-56 w-56 mb-6">
                      <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
                        <PieChart className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">No data available</p>
                    </div>
                  ) : (
                    <div className="relative w-56 h-56 mb-6">
                      <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 120 120" style={{filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'}}>
                        {(() => {
                          const totalEmployees = reportData.departmentBreakdown.reduce((sum, dept) => sum + dept.employees, 0);
                          if (totalEmployees === 0) return null;

                          let cumulativeAngle = 0;
                          const radius = 18;
                          const circumference = 2 * Math.PI * radius;
                          const colors = [
                            '#3B82F6',  // blue-500
                            '#10B981',  // emerald-500
                            '#8B5CF6',  // violet-500
                            '#F59E0B',  // amber-500
                            '#EF4444',  // red-500
                            '#6366F1',  // indigo-500
                            '#EC4899',  // pink-500
                            '#F97316'   // orange-500
                          ];

                          return reportData.departmentBreakdown.map((dept, index) => {
                            if (dept.employees === 0) return null;

                            const percentage = (dept.employees / totalEmployees);
                            const strokeLength = percentage * circumference;
                            const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
                            const strokeDashoffset = -cumulativeAngle * circumference;

                            cumulativeAngle += percentage;

                            return (
                              <g key={dept.department}>
                                <circle
                                  cx="60"
                                  cy="60"
                                  r={radius}
                                  fill="transparent"
                                  stroke={colors[index % colors.length]}
                                  strokeWidth="8"
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                  className="transition-all duration-500 hover:stroke-[10] cursor-pointer"
                                  style={{
                                    filter: `drop-shadow(0 0 8px ${colors[index % colors.length]}40)`,
                                  }}
                                />
                              </g>
                            );
                          }).filter(Boolean);
                        })()}

                        {/* Enhanced inner circle with gradient */}
                        <defs>
                          <radialGradient id="centerGradientEmp" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#f8fafc" />
                          </radialGradient>
                        </defs>
                        <circle
                          cx="60"
                          cy="60"
                          r="10"
                          fill="url(#centerGradientEmp)"
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}}
                        />
                      </svg>

                      {/* Enhanced Center Text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg border border-gray-200">
                          <div className="text-2xl font-bold text-gray-900">
                            {reportData.departmentBreakdown.length}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">Depts</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Legend */}
                  <div className="w-full space-y-3">
                    {reportData.departmentBreakdown.map((dept, index) => {
                      const colors = [
                        '#3B82F6',  // blue-500
                        '#10B981',  // emerald-500
                        '#8B5CF6',  // violet-500
                        '#F59E0B',  // amber-500
                        '#EF4444',  // red-500
                        '#6366F1',  // indigo-500
                        '#EC4899',  // pink-500
                        '#F97316'   // orange-500
                      ];
                      const totalEmployees = reportData.departmentBreakdown.reduce((sum, d) => sum + d.employees, 0);
                      const percentage = totalEmployees > 0 ? ((dept.employees / totalEmployees) * 100).toFixed(1) : '0.0';

                      return (
                        <div key={dept.department} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-3 shadow-lg group-hover:scale-110 transition-transform duration-200"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{dept.department}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{percentage}%</div>
                            <div className="text-xs text-gray-500">{dept.employees} employees</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Position Breakdown */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="bg-emerald-600 p-3 rounded-xl mr-4 shadow-md">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Position Breakdown</h3>
                    <p className="text-gray-600 text-sm">Employee distribution by position</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {reportData.positionBreakdown.slice(0, 8).map((position, index) => (
                    <div key={position.position} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{position.position}</h4>
                        <span className="text-sm text-gray-500">{position.count} employees</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${position.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{position.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="bg-purple-600 p-3 rounded-xl mr-4 shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Age Distribution</h3>
                    <p className="text-gray-600 text-sm">Employee distribution by age groups</p>
                  </div>
                </div>

                {/* Age Distribution Bars */}
                <div className="space-y-4">
                  {reportData.ageDistribution.map((range, index) => {
                    const colors = [
                      'bg-blue-500',
                      'bg-emerald-500',
                      'bg-purple-500',
                      'bg-amber-500',
                      'bg-red-500'
                    ];
                    const maxCount = Math.max(...reportData.ageDistribution.map(r => r.count));
                    const percentage = maxCount > 0 ? ((range.count / maxCount) * 100) : 0;

                    return (
                      <div key={range.range} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-[80px]">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                          <span className="text-sm font-semibold text-gray-700">{range.range}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-1 mx-4">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 ${colors[index % colors.length]} rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <div className="text-sm font-bold text-gray-900">{range.count}</div>
                          <div className="text-xs text-gray-500">employees</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Employee Records */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 lg:col-span-3 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="bg-indigo-600 p-3 rounded-xl mr-4 shadow-md">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Recent Employee Records</h3>
                      <p className="text-gray-600 text-sm">Latest employee registrations and updates</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-200">
                    <span className="text-sm font-bold text-indigo-700">{employees.length} total records</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Join Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employees.slice(0, 10).map((employee) => {
                        // Helper function to get employee name from various possible fields
                        const getEmployeeName = (emp) => {
                          return emp.name || emp.fullName || emp.firstName || emp.personalInfo?.name ||
                                 emp.personalInfo?.fullName || emp.personalInfo?.firstName ||
                                 (emp.personalInfo?.firstName && emp.personalInfo?.lastName ?
                                  `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : '') ||
                                 'Unknown Employee';
                        };

                        // Helper function to get employee ID
                        const getEmployeeId = (emp) => {
                          return emp.employeeId || emp.empId || emp.id || emp._id || 'N/A';
                        };

                        // Helper function to get department
                        const getDepartment = (emp) => {
                          return emp.department || emp.workInfo?.department || emp.employmentDetails?.department || 'Not Assigned';
                        };

                        // Helper function to get position/designation
                        const getPosition = (emp) => {
                          return emp.designation || emp.position || emp.jobTitle || emp.workInfo?.designation ||
                                 emp.workInfo?.position || emp.employmentDetails?.designation || 'Not Specified';
                        };

                        // Helper function to get status
                        const getStatus = (emp) => {
                          const status = emp.status || emp.employmentStatus || emp.workInfo?.status ||
                                        emp.employmentDetails?.status || 'active';
                          return status.toLowerCase();
                        };

                        // Helper function to get join date
                        const getJoinDate = (emp) => {
                          const joinDate = emp.dateOfJoining || emp.joinDate || emp.startDate ||
                                          emp.workInfo?.dateOfJoining || emp.employmentDetails?.dateOfJoining ||
                                          emp.createdAt;
                          return joinDate ? new Date(joinDate).toLocaleDateString() : 'N/A';
                        };

                        return (
                          <tr key={employee._id || employee.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {getEmployeeName(employee)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {getEmployeeId(employee)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {getDepartment(employee)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {getPosition(employee)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                getStatus(employee) === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : getStatus(employee) === 'inactive'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {getStatus(employee) || 'active'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {getJoinDate(employee)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {employees.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No employee records found</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeReports;