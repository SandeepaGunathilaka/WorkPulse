import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Calendar, Download, Filter,
  Users, DollarSign, FileText, PieChart, AlertCircle,
  Clock, Building2, CreditCard, Search, Eye, User
} from 'lucide-react';
import { salaryService } from '../../services/salaryService';
import { employeeService } from '../../services/employeeService';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/currencyFormatter';

const SalaryReports = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    totalPayroll: 0,
    totalEmployees: 0,
    averageSalary: 0,
    totalDeductions: 0,
    monthlyComparison: [],
    departmentBreakdown: [],
    salaryDistribution: []
  });
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: '',
    employeeType: ''
  });
  const [employees, setEmployees] = useState([]);
  const [salaryRecords, setSalaryRecords] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years array - current year and previous years only (no future years)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).sort((a, b) => b - a);

  // Get available months (current month and previous months only)
  const getAvailableMonths = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-based (0 = January)

    // If selected year is current year, only show up to current month
    if (filters.year === currentYear) {
      return months.slice(0, currentMonth + 1).map((month, index) => ({
        name: month,
        value: index + 1
      }));
    }

    // If selected year is previous year, show all months
    if (filters.year < currentYear) {
      return months.map((month, index) => ({
        name: month,
        value: index + 1
      }));
    }

    // If somehow future year is selected, show no months
    return [];
  };

  // Handle year change - reset month if it's not available for the selected year
  const handleYearChange = (newYear) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-based for comparison with filters.month

    let newMonth = filters.month;

    // If changing to current year and selected month is in the future, reset to current month
    if (newYear === currentYear && filters.month > currentMonth) {
      newMonth = currentMonth;
    }

    setFilters({
      ...filters,
      year: newYear,
      month: newMonth
    });
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch employees and salary records
      const [employeesRes, salariesRes] = await Promise.all([
        employeeService.getAllEmployees({ limit: 1000 }),
        salaryService.getAllSalaries({
          month: months[filters.month - 1],
          year: filters.year,
          limit: 1000
        })
      ]);

      setEmployees(employeesRes.data || []);
      setSalaryRecords(salariesRes.data || []);

      // Calculate report data
      calculateReportData(salariesRes.data || [], employeesRes.data || []);
    } catch (error) {
      showError('Failed to fetch report data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map department names
  const mapDepartmentName = (salary) => {
    // Try multiple ways to get department info
    let dept = salary.employeeInfo?.department ||
               salary.employeeInfo?.designation ||
               salary.department ||
               'General';

    // Map common designations to departments
    if (dept.toLowerCase().includes('doctor') || dept.toLowerCase().includes('physician')) {
      dept = 'Medical';
    } else if (dept.toLowerCase().includes('nurse')) {
      dept = 'Nursing';
    } else if (dept.toLowerCase().includes('admin')) {
      dept = 'Administration';
    } else if (dept.toLowerCase().includes('hr')) {
      dept = 'Human Resources';
    } else if (dept.toLowerCase().includes('it') || dept.toLowerCase().includes('tech')) {
      dept = 'IT Department';
    } else if (dept.toLowerCase().includes('finance') || dept.toLowerCase().includes('account')) {
      dept = 'Finance';
    } else if (dept === 'General') {
      dept = 'General Staff';
    }

    return dept;
  };

  const calculateReportData = (salaries, employees) => {
    const totalPayroll = salaries.reduce((sum, salary) => sum + (salary.netPayableSalary || 0), 0);
    const totalEmployees = employees.length;
    const averageSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
    const totalDeductions = salaries.reduce((sum, salary) => sum + (salary.deductions?.total || 0), 0);

    // Department breakdown
    const departmentData = {};
    salaries.forEach(salary => {
      const dept = mapDepartmentName(salary);

      if (!departmentData[dept]) {
        departmentData[dept] = { count: 0, totalSalary: 0 };
      }
      departmentData[dept].count++;
      departmentData[dept].totalSalary += salary.netPayableSalary || 0;
    });

    const departmentBreakdown = Object.entries(departmentData).map(([dept, data]) => ({
      department: dept,
      employeeCount: data.count,
      totalSalary: data.totalSalary,
      averageSalary: data.totalSalary / data.count
    }));

    // Salary distribution
    const salaryRanges = [
      { range: '0-50k', min: 0, max: 50000, count: 0 },
      { range: '50k-100k', min: 50000, max: 100000, count: 0 },
      { range: '100k-150k', min: 100000, max: 150000, count: 0 },
      { range: '150k-200k', min: 150000, max: 200000, count: 0 },
      { range: '200k+', min: 200000, max: Infinity, count: 0 }
    ];

    salaries.forEach(salary => {
      const netSalary = salary.netPayableSalary || 0;
      salaryRanges.forEach(range => {
        if (netSalary >= range.min && netSalary < range.max) {
          range.count++;
        }
      });
    });

    setReportData({
      totalPayroll,
      totalEmployees,
      averageSalary,
      totalDeductions,
      departmentBreakdown,
      salaryDistribution: salaryRanges
    });
  };

  const handleExportReport = () => {
    // Generate CSV data
    const csvData = [
      ['Department', 'Employee Count', 'Total Salary', 'Average Salary'],
      ...reportData.departmentBreakdown.map(dept => [
        dept.department,
        dept.employeeCount,
        dept.totalSalary.toLocaleString(),
        dept.averageSalary.toFixed(2)
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_report_${months[filters.month - 1]}_${filters.year}.csv`;
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
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e40af" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
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
                  <BarChart3 className="w-12 h-12 text-white" />
                </div>
                {/* Status indicator */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              </div>
              <div className="space-y-1">
                {/* Professional title */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    Salary Reports & Analytics
                  </h1>
                  <div className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Dashboard</span>
                  </div>
                </div>
                <p className="text-gray-600 text-lg font-medium leading-relaxed">
                  Professional payroll management and comprehensive salary insights
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
                {/* Professional Month Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Month</label>
                  <div className="relative">
                    <select
                      value={filters.month}
                      onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer font-medium text-gray-800 shadow-sm hover:shadow-md"
                    >
                      {getAvailableMonths().map((month) => (
                        <option key={month.name} value={month.value}>{month.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1 rounded-md">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Professional Year Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Year</label>
                  <div className="relative">
                    <select
                      value={filters.year}
                      onChange={(e) => handleYearChange(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer font-medium text-gray-800 shadow-sm hover:shadow-md"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1 rounded-md">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Professional Department Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Department</label>
                  <div className="relative">
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer font-medium text-gray-800 shadow-sm hover:shadow-md"
                    >
                      <option value="">All Departments</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Surgery">Surgery</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Administration">Administration</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1 rounded-md">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Professional Employee Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Employee Type</label>
                  <div className="relative">
                    <select
                      value={filters.employeeType}
                      onChange={(e) => setFilters({ ...filters, employeeType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white appearance-none cursor-pointer font-medium text-gray-800 shadow-sm hover:shadow-md"
                    >
                      <option value="">All Employee Types</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 p-1 rounded-md">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="px-6 py-8 relative z-10">
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
              {/* Total Payroll Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Payroll</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {formatCurrency(reportData.totalPayroll)}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      {months[filters.month - 1]} {filters.year}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors duration-300">
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 font-medium">+8.2% from last month</span>
                  </div>
                </div>
              </div>

              {/* Total Employees Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Employees</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {reportData.totalEmployees}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Active employees
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl group-hover:bg-emerald-100 transition-colors duration-300">
                    <Users className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-600 font-medium">+12 new hires</span>
                  </div>
                </div>
              </div>

              {/* Average Salary Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Average Salary</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {formatCurrency(Math.round(reportData.averageSalary))}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      Per employee
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl group-hover:bg-purple-100 transition-colors duration-300">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 font-medium">+5.1% increase</span>
                  </div>
                </div>
              </div>

              {/* Total Deductions Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Deductions</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {formatCurrency(reportData.totalDeductions)}
                    </p>
                    <p className="text-gray-500 text-sm font-medium">
                      EPF, taxes, etc.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl group-hover:bg-orange-100 transition-colors duration-300">
                    <CreditCard className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600 font-medium">18.2% of gross pay</span>
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
                    <p className="text-gray-600 text-sm">Salary allocation by department</p>
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
                      <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 120 120">
                        {(() => {
                          const totalSalary = reportData.departmentBreakdown.reduce((sum, dept) => sum + dept.totalSalary, 0);
                          if (totalSalary === 0) return null;

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
                            if (dept.totalSalary === 0) return null;

                            const percentage = (dept.totalSalary / totalSalary);
                            const strokeLength = percentage * circumference;
                            const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
                            const strokeDashoffset = -cumulativeAngle * circumference;

                            cumulativeAngle += percentage;

                            return (
                              <circle
                                key={dept.department}
                                cx="60"
                                cy="60"
                                r={radius}
                                fill="transparent"
                                stroke={colors[index % colors.length]}
                                strokeWidth="8"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-500 hover:stroke-width-10 drop-shadow-lg"
                                style={{
                                  filter: `drop-shadow(0 0 8px ${colors[index % colors.length]}40)`,
                                }}
                              />
                            );
                          }).filter(Boolean);
                        })()}
                      </svg>

                      {/* Center Text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg">
                          <div className="text-2xl font-bold text-gray-800">
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
                      const totalSalary = reportData.departmentBreakdown.reduce((sum, d) => sum + d.totalSalary, 0);
                      const percentage = totalSalary > 0 ? ((dept.totalSalary / totalSalary) * 100).toFixed(1) : '0.0';

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
                            <div className="text-xs text-gray-500">{formatCurrency(dept.totalSalary)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="group bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 p-8 transform hover:scale-105 transition-all duration-300 hover:shadow-3xl">
                <div className="flex items-center mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Department Details</h3>
                    <p className="text-gray-600 text-sm font-medium mt-1">Detailed breakdown by department</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {reportData.departmentBreakdown.map((dept, index) => (
                    <div key={dept.department} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{dept.department}</h4>
                        <span className="text-sm text-gray-500">{dept.employeeCount} employees</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Salary:</span>
                          <div className="font-bold text-green-600">{formatCurrency(dept.totalSalary)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Average:</span>
                          <div className="font-bold text-blue-600">{formatCurrency(Math.round(dept.averageSalary))}</div>
                        </div>
                      </div>
                      <div className="mt-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(dept.totalSalary / Math.max(...reportData.departmentBreakdown.map(d => d.totalSalary))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salary Range Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-8">
                  <div className="bg-emerald-600 p-3 rounded-xl mr-4 shadow-md">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Salary Range Distribution</h3>
                    <p className="text-gray-600 text-sm">Employee distribution by salary range</p>
                  </div>
                </div>

                {/* Enhanced Donut Chart */}
                <div className="flex flex-col items-center">
                  <div className="relative w-52 h-52 mb-6">
                    <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 120 120" style={{filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'}}>
                      {(() => {
                        const totalEmployees = reportData.salaryDistribution.reduce((sum, range) => sum + range.count, 0);
                        if (totalEmployees === 0) return null;

                        let cumulativeAngle = 0;
                        const radius = 20;
                        const circumference = 2 * Math.PI * radius;
                        const colors = [
                          '#10B981',  // emerald-500
                          '#3B82F6',  // blue-500
                          '#8B5CF6',  // violet-500
                          '#F59E0B',  // amber-500
                          '#EF4444'   // red-500
                        ];

                        return reportData.salaryDistribution.map((range, index) => {
                          if (range.count === 0) return null;

                          const percentage = (range.count / totalEmployees);
                          const strokeLength = percentage * circumference;
                          const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
                          const strokeDashoffset = -cumulativeAngle * circumference;

                          cumulativeAngle += percentage;

                          return (
                            <g key={range.range}>
                              {/* Outer ring with gradient effect */}
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
                                className="transition-all duration-700 hover:stroke-[10] cursor-pointer"
                                style={{
                                  filter: `drop-shadow(0 2px 8px ${colors[index % colors.length]}40)`,
                                }}
                              />
                              {/* Inner glow effect */}
                              <circle
                                cx="60"
                                cy="60"
                                r={radius - 2}
                                fill="transparent"
                                stroke={colors[index % colors.length]}
                                strokeWidth="2"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                opacity="0.4"
                                className="transition-all duration-700"
                              />
                            </g>
                          );
                        }).filter(Boolean);
                      })()}

                      {/* Enhanced inner circle with gradient */}
                      <defs>
                        <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="100%" stopColor="#f8fafc" />
                        </radialGradient>
                      </defs>
                      <circle
                        cx="60"
                        cy="60"
                        r="12"
                        fill="url(#centerGradient)"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}}
                      />
                    </svg>

                    {/* Enhanced Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center bg-white/80 backdrop-blur-sm rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">
                          {reportData.totalEmployees}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Legend */}
                  <div className="w-full space-y-3">
                    {reportData.salaryDistribution.map((range, index) => {
                      const colors = [
                        '#10B981',  // emerald-500
                        '#3B82F6',  // blue-500
                        '#8B5CF6',  // violet-500
                        '#F59E0B',  // amber-500
                        '#EF4444'   // red-500
                      ];
                      const bgColors = [
                        'bg-emerald-50',
                        'bg-blue-50',
                        'bg-violet-50',
                        'bg-amber-50',
                        'bg-red-50'
                      ];
                      const totalEmployees = reportData.salaryDistribution.reduce((sum, r) => sum + r.count, 0);
                      const percentage = totalEmployees > 0 ? ((range.count / totalEmployees) * 100).toFixed(1) : '0.0';

                      return (
                        <div key={range.range} className={`flex items-center justify-between p-3 rounded-xl ${bgColors[index % bgColors.length]} hover:shadow-md transition-all duration-300 border border-gray-100 cursor-pointer group`}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full shadow-lg group-hover:scale-110 transition-transform duration-200"
                              style={{
                                backgroundColor: colors[index % colors.length],
                                boxShadow: `0 2px 8px ${colors[index % colors.length]}40`
                              }}
                            ></div>
                            <span className="text-sm font-semibold text-gray-800">LKR {range.range}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{range.count} employees</div>
                            <div className="text-xs text-gray-600 font-medium">{percentage}% of total</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Salary Records */}
              <div className="group bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 p-8 lg:col-span-3 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-3xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Recent Salary Records</h3>
                      <p className="text-gray-600 text-sm font-medium mt-1">Latest processed salary records</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-2xl border border-green-200">
                    <span className="text-sm font-bold text-green-700">{salaryRecords.length} records found</span>
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
                          Basic Salary
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Net Salary
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salaryRecords.slice(0, 10).map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-semibold text-gray-900">
                                  {record.employeeInfo?.name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {record.employeeInfo?.employeeId || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {mapDepartmentName(record)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(record.basicSalary || 0)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {formatCurrency(record.netPayableSalary || 0)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {salaryRecords.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No salary records found for the selected period</p>
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

export default SalaryReports;