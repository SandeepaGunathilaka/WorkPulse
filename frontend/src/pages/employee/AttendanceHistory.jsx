import { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Search,
  FileText,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../contexts/ToastContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AttendanceHistory = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [summary, setSummary] = useState({
    totalDays: 0,
    totalHours: 0,
    presentDays: 0,
    lateDays: 0
  });
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { showToast } = useToast() || {};

  const fetchAttendanceHistory = async (page = 1) => {
    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const params = {
        page,
        limit: 10,
        startDate,
        endDate,
        ...(filters.status !== 'all' && { status: filters.status })
      };

      const response = await attendanceService.getMyAttendance(params);

      if (response.success) {
        setAttendanceHistory(response.data || []);
        setPagination(response.pagination || { current: 1, pages: 1, total: 0 });
        setSummary(response.summary || { totalDays: 0, totalHours: 0, presentDays: 0, lateDays: 0 });
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      if (showToast) {
        showToast('Failed to fetch attendance history', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [currentDate, filters.status]);

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

  const getStatusBadge = (status) => {
    const badges = {
      present: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg',
      late: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg',
      absent: 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg',
      'half-day': 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg',
      holiday: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg',
      'on-leave': 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-lg'
    };
    return badges[status] || 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-lg';
  };

  const getStatusEmoji = (status) => {
    const emojis = {
      present: '✅',
      late: '⏰',
      absent: '❌',
      'half-day': '🕐',
      holiday: '🎉',
      'on-leave': '🏖️'
    };
    return emojis[status] || '📊';
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch {
      return '-';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0 || isNaN(minutes)) return '0h 0.00';

    // Convert to number if it's a string
    let numValue = typeof minutes === 'string' ? parseFloat(minutes) : minutes;

    // If still not a valid number, return default
    if (isNaN(numValue)) return '0h 0.00';

    // Always assume the value is in minutes
    const totalMinutes = numValue;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    // Return hours and minutes with 2 decimal places for minutes
    return `${hours}h ${mins.toFixed(2)}`;
  };

  const calculateWorkDuration = (checkIn, checkOut) => {
    if (!checkIn?.time || !checkOut?.time) return '-';
    try {
      const start = new Date(checkIn.time);
      const end = new Date(checkOut.time);
      const diffMs = end - start;
      const minutes = Math.floor(diffMs / (1000 * 60));
      return formatDuration(minutes);
    } catch {
      return '-';
    }
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const filteredHistory = attendanceHistory.filter(record =>
    filters.search === '' ||
    format(parseISO(record.date), 'dd/MM/yyyy').includes(filters.search) ||
    record.status.toLowerCase().includes(filters.search.toLowerCase())
  );

  // Export Functions
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      console.log('🚀 Starting PDF export...');
      console.log('📊 Data to export:', {
        historyCount: filteredHistory.length,
        summary,
        currentDate: format(currentDate, 'yyyy-MM')
      });

      // Check if we have data
      if (!filteredHistory || filteredHistory.length === 0) {
        if (showToast) {
          showToast('No attendance data to export. Please select a month with attendance records.', 'warning');
        }
        return;
      }

      const doc = new jsPDF();

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // blue-600
      doc.text('WorkPulse - Attendance Report', 14, 22);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${format(currentDate, 'MMMM yyyy')}`, 14, 32);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 40);

      // Add summary section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics:', 14, 55);

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Working Days: ${summary.totalDays || 0}`, 14, 65);
      doc.text(`Present Days: ${summary.presentDays || 0}`, 14, 73);
      doc.text(`Late Days: ${summary.lateDays || 0}`, 110, 65);
      doc.text(`Total Hours: ${formatDuration(summary.totalHours) || '0h 0m'}`, 110, 73);

      // Prepare table data with better error handling
      const tableData = filteredHistory.map(record => {
        try {
          return [
            record.date ? format(parseISO(record.date), 'dd/MM/yyyy') : 'N/A',
            record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ') : 'Unknown',
            formatTime(record.checkIn?.time) || '-',
            formatTime(record.checkOut?.time) || (record.checkOut?.time ? 'Working...' : '-'),
            record.workHours ? formatDuration(record.workHours) : calculateWorkDuration(record.checkIn, record.checkOut),
            `${record.breaks?.length || 0} breaks`,
            record.checkIn?.location?.latitude ? 'Tracked' : 'No location'
          ];
        } catch (err) {
          console.error('Error processing record:', record, err);
          return ['Error', 'Error', 'Error', 'Error', 'Error', 'Error', 'Error'];
        }
      });

      console.log('📋 Table data prepared:', tableData.length, 'rows');

      // Add table with better configuration
      autoTable(doc, {
        head: [['Date', 'Status', 'Check In', 'Check Out', 'Duration', 'Breaks', 'Location']],
        body: tableData,
        startY: 85,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 25, halign: 'center' }
        },
        margin: { top: 85, left: 14, right: 14 },
        tableWidth: 'auto'
      });

      // Generate filename
      const filename = `attendance-report-${format(currentDate, 'yyyy-MM')}.pdf`;
      console.log('💾 Saving PDF as:', filename);

      // Save the PDF
      doc.save(filename);

      console.log('✅ PDF export completed successfully!');
      if (showToast) {
        showToast('📄 PDF report exported successfully!', 'success');
      }
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Summary sheet data
      const summaryData = [
        ['Attendance Summary Report'],
        [''],
        ['Period:', format(currentDate, 'MMMM yyyy')],
        ['Generated on:', format(new Date(), 'dd/MM/yyyy HH:mm')],
        [''],
        ['Summary Statistics:'],
        ['Total Days', summary.totalDays],
        ['Present Days', summary.presentDays],
        ['Late Days', summary.lateDays],
        ['Total Hours', formatDuration(summary.totalHours)],
        ['']
      ];

      // Attendance data
      const attendanceData = [
        ['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Work Duration', 'Breaks', 'Location'],
        ...filteredHistory.map(record => [
          format(parseISO(record.date), 'dd/MM/yyyy'),
          format(parseISO(record.date), 'EEEE'),
          record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' '),
          formatTime(record.checkIn?.time),
          formatTime(record.checkOut?.time) || 'Working...',
          record.workHours ? formatDuration(record.workHours) : calculateWorkDuration(record.checkIn, record.checkOut),
          (record.breaks?.length || 0) + ' breaks',
          record.checkIn?.location?.latitude ? 'Tracked' : 'No location'
        ])
      ];

      // Create summary worksheet
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Create attendance worksheet
      const attendanceWorksheet = XLSX.utils.aoa_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(workbook, attendanceWorksheet, 'Attendance Records');

      // Style the worksheets (basic styling)
      const range = XLSX.utils.decode_range(summaryWorksheet['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!summaryWorksheet[cellAddress]) continue;

          if (R === 0) { // Header row
            summaryWorksheet[cellAddress].s = {
              font: { bold: true, sz: 16 },
              fill: { fgColor: { rgb: "3B82F6" } }
            };
          }
        }
      }

      // Save the Excel file
      XLSX.writeFile(workbook, `attendance-report-${format(currentDate, 'yyyy-MM')}.xlsx`);

      if (showToast) {
        showToast('Excel report exported successfully!', 'success');
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      if (showToast) {
        showToast('Failed to export Excel report', 'error');
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
        <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-2xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                📊 Attendance History
              </h1>
              <p className="text-blue-100 text-lg">Track your attendance records and work hours with detailed insights</p>
            </div>
            <div className="mt-6 sm:mt-0 flex space-x-3">
              <div className="relative export-dropdown-container">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={isExporting || filteredHistory.length === 0}
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
                      Export Data
                      <ChevronDown className="h-4 w-4 ml-2 group-hover:animate-pulse" />
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
                        <FileText className="h-4 w-4 mr-3 text-red-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="font-medium">Export as PDF</div>
                          <div className="text-xs text-gray-500 group-hover:text-red-600">Professional report format</div>
                        </div>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={exportToExcel}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-3 text-green-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="font-medium">Export as Excel</div>
                          <div className="text-xs text-gray-500 group-hover:text-green-600">Spreadsheet with multiple sheets</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Days Card */}
          <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Total Days</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{summary.totalDays}</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>

          {/* Total Hours Card */}
          <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Total Hours</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatDuration(summary.totalHours)}</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>

          {/* Present Days Card */}
          <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Present Days</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{summary.presentDays}</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>

          {/* Late Days Card */}
          <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700">Late Days</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{summary.lateDays}</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
        </div>

        {/* Enhanced Filters and Date Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Beautiful Date Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={previousMonth}
                className="group p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <ChevronLeft className="h-5 w-5 group-hover:animate-pulse" />
              </button>
              <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-6 py-3 shadow-inner">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  📅 {format(currentDate, 'MMMM yyyy')}
                </h3>
              </div>
              <button
                onClick={nextMonth}
                className="group p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <ChevronRight className="h-5 w-5 group-hover:animate-pulse" />
              </button>
            </div>

            {/* Enhanced Filters */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Beautiful Search Box */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="🔍 Search records..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-12 pr-4 py-3 bg-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* Beautiful Status Filter */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative flex items-center space-x-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-lg">
                  <Filter className="h-5 w-5 text-emerald-600" />
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="bg-transparent border-0 focus:ring-0 focus:outline-none font-medium text-gray-700"
                  >
                    <option value="all">🎯 All Status</option>
                    <option value="present">✅ Present</option>
                    <option value="late">⏰ Late</option>
                    <option value="absent">❌ Absent</option>
                    <option value="half-day">🕐 Half Day</option>
                    <option value="on-leave">🏖️ On Leave</option>
                    <option value="holiday">🎉 Holiday</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Attendance Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-purple-50">
                    📅 Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    📊 Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    🕐 Check In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    🕕 Check Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ⏱️ Work Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ☕ Breaks
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    📍 Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
                        </div>
                        <p className="text-gray-600 font-medium">✨ Loading attendance records...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-700">📋 No records found</p>
                          <p className="text-gray-500">No attendance records found for this period</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((record, index) => (
                    <tr
                      key={record._id}
                      className={`group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {format(parseISO(record.date), 'dd MMM yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(parseISO(record.date), 'EEEE')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-2 text-xs font-bold rounded-full transition-all duration-300 hover:scale-110 ${getStatusBadge(record.status)}`}>
                          <span className="mr-1">{getStatusEmoji(record.status)}</span>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                          🟢 {formatTime(record.checkIn?.time)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkOut?.time ? (
                          <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                            🔴 {formatTime(record.checkOut?.time)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">⏳ Working...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
                          ⏱️ {record.workHours ? formatDuration(record.workHours) : calculateWorkDuration(record.checkIn, record.checkOut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                          ☕ {record.breaks?.length || 0} breaks
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkIn?.location?.latitude ? (
                          <div className="flex items-center">
                            <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>📍 Tracked</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">➖ No location</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchAttendanceHistory(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchAttendanceHistory(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.current}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span> ({pagination.total} total records)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => fetchAttendanceHistory(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => fetchAttendanceHistory(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default AttendanceHistory;