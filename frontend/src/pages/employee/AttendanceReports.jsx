import { useState, useEffect } from 'react';
import { format, parseISO, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Users,
  Target,
  Award,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../contexts/ToastContext';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const AttendanceReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reportType, setReportType] = useState('monthly'); // monthly, yearly, quarterly
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { showToast } = useToast() || {};

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let startDate, endDate;

      if (reportType === 'monthly') {
        startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      } else if (reportType === 'yearly') {
        startDate = format(startOfYear(currentDate), 'yyyy-MM-dd');
        endDate = format(endOfYear(currentDate), 'yyyy-MM-dd');
      }

      const params = {
        startDate,
        endDate,
        type: reportType
      };

      const response = await attendanceService.getAttendanceStats(params);

      if (response.success) {
        // Extract the overall stats and flatten for easier use
        const overallData = response.data.overall || {};
        setReportData({
          totalDays: overallData.totalRecords || 0,
          presentDays: overallData.presentCount || 0,
          absentDays: overallData.absentCount || 0,
          lateDays: overallData.lateCount || 0,
          totalHours: overallData.totalWorkHours || 0,
          averageHours: overallData.avgWorkHours || 0,
          totalOvertimeHours: overallData.totalOvertimeHours || 0,
          totalBreakTime: overallData.totalBreakTime || 0,
          daily: response.data.daily || [],
          punctuality: response.data.punctuality || []
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      if (showToast) {
        showToast('Failed to load attendance reports', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [currentDate, reportType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const previousPeriod = () => {
    if (reportType === 'monthly') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (reportType === 'yearly') {
      setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    }
  };

  const nextPeriod = () => {
    if (reportType === 'monthly') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (reportType === 'yearly') {
      setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    }
  };

  const formatDuration = (hours) => {
    if (!hours) return '0h 0m';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getPeriodText = () => {
    if (reportType === 'monthly') {
      return format(currentDate, 'MMMM yyyy');
    } else if (reportType === 'yearly') {
      return format(currentDate, 'yyyy');
    }
    return '';
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      if (!reportData) {
        if (showToast) {
          showToast('No report data to export', 'warning');
        }
        return;
      }

      const doc = new jsPDF();

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text('WorkPulse - Attendance Report', 14, 22);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${getPeriodText()}`, 14, 32);
      doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 14, 40);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 48);

      // Add summary section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics:', 14, 65);

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Working Days: ${reportData.totalDays || 0}`, 14, 75);
      doc.text(`Present Days: ${reportData.presentDays || 0}`, 14, 83);
      doc.text(`Late Days: ${reportData.lateDays || 0}`, 110, 75);
      doc.text(`Absent Days: ${reportData.absentDays || 0}`, 110, 83);
      doc.text(`Average Hours: ${formatDuration(reportData.averageHours)}`, 14, 91);
      doc.text(`Total Hours: ${formatDuration(reportData.totalHours)}`, 110, 91);

      // Attendance Rate
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Performance Metrics:', 14, 110);

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const attendanceRate = reportData.totalDays > 0 ? ((reportData.presentDays / reportData.totalDays) * 100).toFixed(1) : 0;
      const punctualityRate = reportData.presentDays > 0 ? (((reportData.presentDays - reportData.lateDays) / reportData.presentDays) * 100).toFixed(1) : 0;

      doc.text(`Attendance Rate: ${attendanceRate}%`, 14, 120);
      doc.text(`Punctuality Rate: ${punctualityRate}%`, 110, 120);

      // Save the PDF
      const filename = `attendance-report-${reportType}-${format(currentDate, 'yyyy-MM')}.pdf`;
      doc.save(filename);

      if (showToast) {
        showToast('📄 PDF report exported successfully!', 'success');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      if (showToast) {
        showToast(`Failed to export PDF: ${error.message}`, 'error');
      }
    } finally {
      setIsExporting(false);
      setShowExportDropdown(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      if (!reportData) {
        if (showToast) {
          showToast('No report data to export', 'warning');
        }
        return;
      }

      const workbook = XLSX.utils.book_new();

      // Summary sheet data
      const summaryData = [
        ['WorkPulse - Attendance Report'],
        [''],
        ['Period:', getPeriodText()],
        ['Report Type:', reportType.charAt(0).toUpperCase() + reportType.slice(1)],
        ['Generated on:', format(new Date(), 'dd/MM/yyyy HH:mm')],
        [''],
        ['Summary Statistics:'],
        ['Total Working Days', reportData.totalDays || 0],
        ['Present Days', reportData.presentDays || 0],
        ['Late Days', reportData.lateDays || 0],
        ['Absent Days', reportData.absentDays || 0],
        ['Total Hours', formatDuration(reportData.totalHours)],
        ['Average Hours', formatDuration(reportData.averageHours)],
        [''],
        ['Performance Metrics:'],
        ['Attendance Rate (%)', reportData.totalDays > 0 ? ((reportData.presentDays / reportData.totalDays) * 100).toFixed(1) : 0],
        ['Punctuality Rate (%)', reportData.presentDays > 0 ? (((reportData.presentDays - reportData.lateDays) / reportData.presentDays) * 100).toFixed(1) : 0]
      ];

      // Create summary worksheet
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Save the Excel file
      const filename = `attendance-report-${reportType}-${format(currentDate, 'yyyy-MM')}.xlsx`;
      XLSX.writeFile(workbook, filename);

      if (showToast) {
        showToast('📊 Excel report exported successfully!', 'success');
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      if (showToast) {
        showToast(`Failed to export Excel: ${error.message}`, 'error');
      }
    } finally {
      setIsExporting(false);
      setShowExportDropdown(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header with Beautiful Background */}
        <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-r from-green-600 via-blue-600 to-purple-700 shadow-2xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                📊 Attendance Reports
              </h1>
              <p className="text-blue-100 text-lg">Comprehensive attendance analytics and insights</p>
            </div>
            <div className="mt-6 sm:mt-0 flex space-x-3">
              <div className="relative export-dropdown-container">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={isExporting || !reportData}
                  className="group inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-medium text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                      Export Report
                    </>
                  )}
                </button>

                {/* Export Dropdown */}
                {showExportDropdown && !isExporting && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="py-2">
                      <button
                        onClick={exportToPDF}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 transition-all duration-200 group"
                      >
                        <PieChart className="h-4 w-4 mr-3 text-red-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="font-medium">Export as PDF</div>
                          <div className="text-xs text-gray-500 group-hover:text-red-600">Summary report</div>
                        </div>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={exportToExcel}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group"
                      >
                        <BarChart3 className="h-4 w-4 mr-3 text-green-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="font-medium">Export as Excel</div>
                          <div className="text-xs text-gray-500 group-hover:text-green-600">Detailed analytics</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Period Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={previousPeriod}
                className="group p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <ChevronLeft className="h-5 w-5 group-hover:animate-pulse" />
              </button>
              <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-6 py-3 shadow-inner">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  📅 {getPeriodText()}
                </h3>
              </div>
              <button
                onClick={nextPeriod}
                className="group p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <ChevronRight className="h-5 w-5 group-hover:animate-pulse" />
              </button>
            </div>

            {/* Report Type Filter */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative flex items-center space-x-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-lg">
                <Filter className="h-5 w-5 text-emerald-600" />
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-transparent border-0 focus:ring-0 focus:outline-none font-medium text-gray-700"
                >
                  <option value="monthly">📅 Monthly Report</option>
                  <option value="yearly">🗓️ Yearly Report</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-600 font-medium mt-4">✨ Loading report data...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Days */}
              <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Total Days</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{reportData.totalDays || 0}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>

              {/* Present Days */}
              <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Present Days</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{reportData.presentDays || 0}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>

              {/* Late Days */}
              <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Late Days</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{reportData.lateDays || 0}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>

              {/* Total Hours */}
              <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center">
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Total Hours</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{formatDuration(reportData.totalHours)}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Attendance Rate */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Award className="h-6 w-6 text-green-600 mr-2" />
                    Attendance Rate
                  </h3>
                  <div className="text-3xl font-bold text-green-600">
                    {reportData.totalDays > 0 ? ((reportData.presentDays / reportData.totalDays) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${reportData.totalDays > 0 ? ((reportData.presentDays / reportData.totalDays) * 100) : 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {reportData.presentDays || 0} out of {reportData.totalDays || 0} working days
                </p>
              </div>

              {/* Punctuality Rate */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
                    Punctuality Rate
                  </h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {reportData.presentDays > 0 ? (((reportData.presentDays - reportData.lateDays) / reportData.presentDays) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-indigo-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${reportData.presentDays > 0 ? (((reportData.presentDays - reportData.lateDays) / reportData.presentDays) * 100) : 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {(reportData.presentDays || 0) - (reportData.lateDays || 0)} on-time out of {reportData.presentDays || 0} present days
                </p>
              </div>
            </div>

            {/* Additional Statistics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <BarChart3 className="h-6 w-6 text-purple-600 mr-2" />
                Additional Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{formatDuration(reportData.averageHours)}</div>
                  <div className="text-sm text-gray-600">Average Daily Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{reportData.absentDays || 0}</div>
                  <div className="text-sm text-gray-600">Absent Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {reportData.totalDays > 0 ? (((reportData.totalDays - (reportData.absentDays || 0)) / reportData.totalDays) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Reliability Score</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-700">📊 No report data available</p>
            <p className="text-gray-500">No attendance data found for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;