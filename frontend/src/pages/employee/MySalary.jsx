import React, { useState, useEffect } from 'react';
import {
  Download,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  Eye,
  Filter,
  BarChart3,
  X,
  AlertCircle
} from 'lucide-react';
import { salaryService } from '../../services/salaryService';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/currencyFormatter';

const MySalary = () => {
  const { showSuccess, showError } = useToast();
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'analytics'
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    totalEarned: 0,
    avgSalary: 0,
    highestSalary: 0,
    lowestSalary: 0
  });

  // Fetch salary data
  useEffect(() => {
    fetchSalaries();
  }, [selectedYear]);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await salaryService.getMySalaries({
        year: selectedYear,
        limit: 100
      });

      setSalaries(response.data || []);
      calculateStats(response.data || []);
    } catch (error) {
      console.error('Error fetching salaries:', error);
      showError('Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salaryData) => {
    if (salaryData.length === 0) {
      setStats({ totalEarned: 0, avgSalary: 0, highestSalary: 0, lowestSalary: 0 });
      return;
    }

    const total = salaryData.reduce((sum, salary) => sum + salary.netPayableSalary, 0);
    const avg = total / salaryData.length;
    const highest = Math.max(...salaryData.map(s => s.netPayableSalary));
    const lowest = Math.min(...salaryData.map(s => s.netPayableSalary));

    setStats({
      totalEarned: total,
      avgSalary: avg,
      highestSalary: highest,
      lowestSalary: lowest
    });
  };

  const handleViewDetails = (salary) => {
    setSelectedSalary(salary);
    setShowModal(true);
  };

  const handleDownloadPayslip = async (salary) => {
    try {
      const payslipData = {
        ...salary,
        employeeInfo: salary.employeeInfo,
        attendance: salary.attendance,
        allowances: salary.allowances,
        additionalPerks: salary.additionalPerks,
        deductions: salary.deductions,
        epfContributions: salary.epfContributions,
        amountInWords: salary.amountInWords
      };

      await salaryService.generatePayslipPDF(payslipData);
      showSuccess('Payslip downloaded successfully!');
    } catch (error) {
      console.error('Error generating payslip:', error);
      showError('Failed to generate payslip');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Salary Information
                </h1>
                <p className="text-gray-600 mt-2">View your salary details, history, and download payslips</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Year Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'list'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    List View
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'analytics'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalEarned)}
                </p>
                <p className="text-sm text-blue-600 mt-1">This Year</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Average Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(Math.round(stats.avgSalary))}
                </p>
                <p className="text-sm text-green-600 mt-1">Per Month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Highest Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.highestSalary)}
                </p>
                <p className="text-sm text-purple-600 mt-1">Best Month</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Records</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {salaries.length}
                </p>
                <p className="text-sm text-orange-600 mt-1">Salary Slips</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'list' ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Salary History ({selectedYear})</h2>
            </div>

            {salaries.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Records Found</h3>
                <p className="text-gray-600">No salary records found for {selectedYear}. Please select a different year.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Basic Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salaries.map((salary) => (
                      <tr key={salary._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {salary.month} {salary.year}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(salary.basicSalary || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(salary.grossSalary || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(salary.deductions?.total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(salary.netPayableSalary || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(salary.status)}`}>
                            {salary.status?.charAt(0).toUpperCase() + salary.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(salary)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            {(salary.status === 'approved' || salary.status === 'paid') && (
                              <button
                                onClick={() => handleDownloadPayslip(salary)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              >
                                <Download className="w-4 h-4" />
                                PDF
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
        ) : (
          // Analytics View
          <div className="space-y-8">
            {/* Monthly Salary Trend Chart */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Monthly Salary Trend</h3>
                  <p className="text-gray-600 text-sm">Your salary progression over {selectedYear}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Net Salary</span>
                  <div className="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
                  <span className="text-sm text-gray-600">Gross Salary</span>
                </div>
              </div>

              {salaries.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>No salary data available for {selectedYear}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Chart Legend */}
                  <div className="flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">Gross Salary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">Net Salary</span>
                    </div>
                  </div>

                  {/* Simplified Bar Chart */}
                  <div className="space-y-4">
                    {(() => {
                      const maxSalary = Math.max(...salaries.map(s => s.grossSalary || 0));
                      const sortedSalaries = [...salaries].sort((a, b) => {
                        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                                          'July', 'August', 'September', 'October', 'November', 'December'];
                        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
                      });

                      return sortedSalaries.map((salary, index) => {
                        const grossWidth = maxSalary > 0 ? ((salary.grossSalary || 0) / maxSalary) * 100 : 0;
                        const netWidth = maxSalary > 0 ? ((salary.netPayableSalary || 0) / maxSalary) * 100 : 0;

                        return (
                          <div key={salary._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{salary.month} {salary.year}</h4>
                              <div className="text-sm text-gray-600">
                                Max: {formatCurrency(salary.grossSalary || 0)}
                              </div>
                            </div>

                            {/* Gross Salary Bar */}
                            <div className="mb-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Gross Salary</span>
                                <span className="text-sm font-semibold text-green-600">
                                  {formatCurrency(salary.grossSalary || 0)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                  style={{width: `${Math.max(grossWidth, 2)}%`}}
                                ></div>
                              </div>
                            </div>

                            {/* Net Salary Bar */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Net Salary</span>
                                <span className="text-sm font-semibold text-blue-600">
                                  {formatCurrency(salary.netPayableSalary || 0)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                  style={{width: `${Math.max(netWidth, 2)}%`}}
                                ></div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Working Days: {salary.attendance?.workingDays || 'N/A'}</span>
                                <span>OT Hours: {salary.attendance?.overtimeHours || 0}</span>
                                <span>Deductions: {formatCurrency(salary.deductions?.total || 0)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Summary Stats */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Salary Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(Math.round(salaries.reduce((sum, s) => sum + (s.grossSalary || 0), 0) / salaries.length))}
                        </div>
                        <div className="text-sm text-gray-600">Avg Gross</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(Math.round(salaries.reduce((sum, s) => sum + (s.netPayableSalary || 0), 0) / salaries.length))}
                        </div>
                        <div className="text-sm text-gray-600">Avg Net</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(Math.round(salaries.reduce((sum, s) => sum + (s.deductions?.total || 0), 0) / salaries.length))}
                        </div>
                        <div className="text-sm text-gray-600">Avg Deductions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {salaries.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Records</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Salary Breakdown Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Deductions Analysis */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-red-600 p-3 rounded-xl mr-4">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Deductions Analysis</h3>
                    <p className="text-gray-600 text-sm">Average monthly deductions</p>
                  </div>
                </div>

                {salaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No deduction data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const avgDeductions = {
                        epf: salaries.reduce((sum, s) => sum + (s.deductions?.epfEmployee?.amount || 0), 0) / salaries.length,
                        apit: salaries.reduce((sum, s) => sum + (s.deductions?.apit || 0), 0) / salaries.length,
                        advance: salaries.reduce((sum, s) => sum + (s.deductions?.salaryAdvance || 0), 0) / salaries.length,
                        total: salaries.reduce((sum, s) => sum + (s.deductions?.total || 0), 0) / salaries.length
                      };

                      const maxDeduction = Math.max(avgDeductions.epf, avgDeductions.apit, avgDeductions.advance);

                      return [
                        { name: 'EPF Employee (8%)', amount: avgDeductions.epf, color: 'bg-red-500' },
                        { name: 'APIT', amount: avgDeductions.apit, color: 'bg-orange-500' },
                        { name: 'Salary Advance', amount: avgDeductions.advance, color: 'bg-yellow-500' }
                      ].map((deduction, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{deduction.name}</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(Math.round(deduction.amount))}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${deduction.color} h-2 rounded-full transition-all duration-500`}
                              style={{width: `${maxDeduction > 0 ? (deduction.amount / maxDeduction) * 100 : 0}%`}}
                            ></div>
                          </div>
                        </div>
                      ));
                    })()}

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Average Total Deductions</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(Math.round(salaries.reduce((sum, s) => sum + (s.deductions?.total || 0), 0) / salaries.length))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Allowances Analysis */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-green-600 p-3 rounded-xl mr-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Allowances Breakdown</h3>
                    <p className="text-gray-600 text-sm">Average monthly allowances</p>
                  </div>
                </div>

                {salaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No allowance data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const avgAllowances = {
                        costOfLiving: salaries.reduce((sum, s) => sum + (s.allowances?.costOfLiving || 0), 0) / salaries.length,
                        food: salaries.reduce((sum, s) => sum + (s.allowances?.food || 0), 0) / salaries.length,
                        medical: salaries.reduce((sum, s) => sum + (s.allowances?.medical || 0), 0) / salaries.length,
                        conveyance: salaries.reduce((sum, s) => sum + (s.allowances?.conveyance || 0), 0) / salaries.length
                      };

                      const maxAllowance = Math.max(avgAllowances.costOfLiving, avgAllowances.food, avgAllowances.medical, avgAllowances.conveyance);

                      return [
                        { name: 'Cost of Living', amount: avgAllowances.costOfLiving, color: 'bg-green-500' },
                        { name: 'Food Allowance', amount: avgAllowances.food, color: 'bg-blue-500' },
                        { name: 'Medical Allowance', amount: avgAllowances.medical, color: 'bg-purple-500' },
                        { name: 'Conveyance', amount: avgAllowances.conveyance, color: 'bg-indigo-500' }
                      ].map((allowance, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{allowance.name}</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(Math.round(allowance.amount))}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${allowance.color} h-2 rounded-full transition-all duration-500`}
                              style={{width: `${maxAllowance > 0 ? (allowance.amount / maxAllowance) * 100 : 0}%`}}
                            ></div>
                          </div>
                        </div>
                      ));
                    })()}

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Average Total Allowances</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(Math.round(salaries.reduce((sum, s) => sum + (s.allowances?.total || 0), 0) / salaries.length))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Comparison Table */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-600 p-3 rounded-xl mr-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Monthly Performance Summary</h3>
                  <p className="text-gray-600 text-sm">Detailed breakdown by month</p>
                </div>
              </div>

              {salaries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No performance data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const sortedSalaries = [...salaries].sort((a, b) => {
                      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                                        'July', 'August', 'September', 'October', 'November', 'December'];
                      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
                    });

                    return sortedSalaries.map((salary, index) => (
                      <div key={salary._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{salary.month}</span>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">Working Days: </span>
                              <span className="font-medium text-gray-900">{salary.attendance?.workingDays || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">OT Hours: </span>
                              <span className="font-medium text-gray-900">{salary.attendance?.overtimeHours || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Gross</div>
                            <div className="font-semibold text-green-600">{formatCurrency(salary.grossSalary || 0)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Net</div>
                            <div className="font-bold text-blue-600">{formatCurrency(salary.netPayableSalary || 0)}</div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(salary.status)}`}>
                              {salary.status?.charAt(0).toUpperCase() + salary.status?.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Salary Detail Modal */}
        {showModal && selectedSalary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Salary Details - {selectedSalary.month} {selectedSalary.year}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Employee Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-medium">{selectedSalary.employeeInfo?.employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedSalary.employeeInfo?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Designation:</span>
                        <span className="font-medium">{selectedSalary.employeeInfo?.designation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Attendance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Working Days:</span>
                        <span className="font-medium">{selectedSalary.attendance?.workingDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overtime Hours:</span>
                        <span className="font-medium">{selectedSalary.attendance?.overtimeHours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Leave Taken:</span>
                        <span className="font-medium">{selectedSalary.attendance?.leaveTaken}</span>
                      </div>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Earnings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Basic Salary:</span>
                        <span className="font-medium">{formatCurrency(selectedSalary.basicSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost of Living:</span>
                        <span className="font-medium">{formatCurrency(selectedSalary.allowances?.costOfLiving)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Food Allowance:</span>
                        <span className="font-medium">{formatCurrency(selectedSalary.allowances?.food)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Medical Allowance:</span>
                        <span className="font-medium">{formatCurrency(selectedSalary.allowances?.medical)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Gross Salary:</span>
                        <span>{formatCurrency(selectedSalary.grossSalary)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Deductions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">EPF Employee:</span>
                        <span className="font-medium">{formatCurrency(selectedSalary.deductions?.epfEmployee?.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">APIT:</span>
                        <span className="font-medium">{formatCurrency(selectedSalary.deductions?.apit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Salary Advance:</span>
                        <span className="font-medium">{formatCurrency(selectedSalary.deductions?.salaryAdvance)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Total Deductions:</span>
                        <span>{formatCurrency(selectedSalary.deductions?.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Net Payable Salary:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedSalary.netPayableSalary)}
                    </span>
                  </div>
                  {selectedSalary.amountInWords && (
                    <p className="text-sm text-gray-600 mt-2">
                      In Words: {selectedSalary.amountInWords}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {(selectedSalary.status === 'approved' || selectedSalary.status === 'paid') && (
                    <button
                      onClick={() => {
                        handleDownloadPayslip(selectedSalary);
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Payslip
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySalary;