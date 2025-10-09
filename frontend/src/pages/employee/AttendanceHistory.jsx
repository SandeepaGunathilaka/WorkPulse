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
  ChevronDown
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../contexts/ToastContext';
import jsPDF from 'jspdf';

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
      console.log('📊 Attendance History Response:', response);

      if (response.success) {
        setAttendanceHistory(response.data || []);
        setPagination(response.pagination || { current: 1, pages: 1, total: 0 });
        setSummary(response.summary || { totalDays: 0, totalHours: 0, presentDays: 0, lateDays: 0 });
      } else {
        console.error('❌ API Response Error:', response);
        if (showToast) {
          showToast(response.message || 'Failed to fetch attendance history', 'error');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching attendance history:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      if (showToast) {
        showToast(`Failed to fetch attendance history: ${error.message}`, 'error');
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

  //PDF Export
  const exportToPDF = async () => {
    console.log('🔄 PDF Export button clicked');
    setIsExporting(true);
  
    try {
      if (!filteredHistory || filteredHistory.length === 0) {
        const doc = new jsPDF();
        doc.text('No Attendance Data Available', 20, 20);
        doc.save(`empty-attendance-report-${format(currentDate, 'yyyy-MM')}.pdf`);
        showToast?.('No data available — test PDF generated.', 'info');
        return;
      }
  
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
  
      // === LIGHT COLOR PALETTE ===
      const colors = {
        primary: [147, 197, 253],       // Light Blue
        primaryDark: [96, 165, 250],    // Sky Blue
        accent: [167, 243, 208],        // Light Emerald
        accentLight: [209, 250, 229],   // Lighter Emerald
        text: [75, 85, 99],             // Medium Gray
        textLight: [107, 114, 128],     // Light Gray
        textLighter: [156, 163, 175],   // Lighter Gray
        border: [229, 231, 235],        // Border Gray
        borderDark: [209, 213, 219],    // Darker Border
        bgLight: [249, 250, 251],       // Off White
        bgCard: [255, 255, 255],        // Pure White
        success: [134, 239, 172],       // Light Green
        successLight: [220, 252, 231],  // Lighter Green
        warning: [253, 224, 71],        // Light Yellow
        warningLight: [254, 249, 195],  // Lighter Yellow
        danger: [252, 165, 165],        // Light Red
        dangerLight: [254, 226, 226],   // Lighter Red
        shadow: [0, 0, 0, 0.08],        // Subtle Shadow
      };
  
      // === LOAD LOGO ===
      const loadImageAsDataURL = (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(null);
          img.src = src;
        });
  
      const logoDataUrl = await loadImageAsDataURL('/Logo.png').catch(() => null);
  
      // === PROFESSIONAL HEADER ===
      // Header background with subtle gradient effect
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 110, 'F');
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 4, 'F');
  
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 40, 25, 70, 70);
      }
  
      // Organization details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...colors.text);
      doc.text('Colombo General Hospital', pageWidth - 40, 38, { align: 'right' });
  
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...colors.textLight);
      doc.text('123 Hospital Street, Colombo 07, Sri Lanka', pageWidth - 40, 56, { align: 'right' });
      doc.text('Tel: +94 11 123 4567  |  Email: info@cgh.lk', pageWidth - 40, 70, { align: 'right' });
  
      // Divider
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(1);
      doc.line(40, 110, pageWidth - 40, 110);
  
      let yPos = 150;
  
      // === EXECUTIVE SUMMARY SECTION ===
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...colors.text);
      doc.text('Executive Summary', 40, yPos);
      
      // Accent underline
      doc.setFillColor(...colors.primary);
      doc.rect(40, yPos + 6, 60, 3, 'F');
      yPos += 40;
  
      // === ENHANCED STATISTICS CARDS ===
      const stats = [
        { label: 'Total Days', value: summary.totalDays || 0, color: colors.primaryDark, bgColor: [219, 234, 254] },
        { label: 'Present', value: summary.presentDays || 0, color: [34, 197, 94], bgColor: colors.successLight },
        { label: 'Absent', value: summary.absentDays || 0, color: [239, 68, 68], bgColor: colors.dangerLight },
        { label: 'Late Arrivals', value: summary.lateDays || 0, color: [245, 158, 11], bgColor: colors.warningLight },
      ];
  
      const cardWidth = 125;
      const cardHeight = 95;
      const cardSpacing = 10;
  
      stats.forEach((s, i) => {
        const x = 40 + i * (cardWidth + cardSpacing);
        
        // Card shadow
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: 0.08 }));
        doc.roundedRect(x + 2, yPos + 2, cardWidth, cardHeight, 8, 8, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));
        
        // Card background
        doc.setFillColor(...s.bgColor);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 8, 8, 'F');
        
        // Card border
        doc.setDrawColor(...s.color);
        doc.setLineWidth(2);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 8, 8, 'S');
        
        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(...s.color);
        doc.text(String(s.value), x + cardWidth - 15, yPos + 40, { align: 'right' });
        
        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...colors.textLight);
        doc.text(s.label, x + cardWidth / 2, yPos + 75, { align: 'center' });
      });
  
      yPos += cardHeight + 50;
  
      // === ATTENDANCE RATE BANNER ===
      const attendanceRate = summary.totalDays
        ? Math.round((summary.presentDays / summary.totalDays) * 100)
        : 0;
  
      const bannerHeight = 70;
      const bannerY = yPos;
      
      // Banner background with gradient effect
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(40, bannerY, pageWidth - 80, bannerHeight, 8, 8, 'F');
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(1);
      doc.roundedRect(40, bannerY, pageWidth - 80, bannerHeight, 8, 8, 'S');
      
      // Left accent
      doc.setFillColor(...colors.primary);
      doc.roundedRect(40, bannerY, 6, bannerHeight, 8, 8, 'F');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...colors.textLight);
      doc.text('Overall Attendance Rate', 60, bannerY + 30);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      doc.setTextColor(...colors.primary);
      doc.text(`${attendanceRate}%`, 60, bannerY + 58);
  
      yPos += bannerHeight + 50;
  
      // === DETAILED RECORDS SECTION ===
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...colors.text);
      doc.text('Detailed Attendance Records', 40, yPos);
      doc.setFillColor(...colors.primary);
      doc.rect(40, yPos + 6, 60, 3, 'F');
      yPos += 35;
  
      const headers = ['Date', 'Status', 'Clock In', 'Clock Out', 'Hours', 'Breaks'];
      const columnWidths = [75, 70, 65, 65, 55, 50];
      const startX = 40;
      const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  
      // Enhanced table header
      doc.setFillColor(...colors.primaryDark);
      doc.rect(startX, yPos, tableWidth, 30, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      let xPos = startX;
      headers.forEach((h, i) => {
        doc.text(h, xPos + columnWidths[i] / 2, yPos + 19, { align: 'center' });
        xPos += columnWidths[i];
      });
  
      yPos += 30;
  
      // Table rows with enhanced styling
      filteredHistory.forEach((record, i) => {
        if (yPos > pageHeight - 100) {
          doc.addPage();
          yPos = 80;
        }
  
        // Alternating row colors
        if (i % 2 === 0) {
          doc.setFillColor(...colors.bgLight);
          doc.rect(startX, yPos, tableWidth, 28, 'F');
        }
  
        const rowData = [
          record.date ? format(parseISO(record.date), 'dd/MM/yyyy') : 'N/A',
          record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Unknown',
          formatTime(record.checkIn?.time) || '-',
          formatTime(record.checkOut?.time) || '-',
          record.workHours ? formatDuration(record.workHours) : '-',
          `${record.breaks?.length || 0}`,
        ];
  
        xPos = startX;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
  
        rowData.forEach((cell, idx) => {
          if (idx === 1) {
            // Status badge
            const statusMap = {
              Present: { color: [34, 197, 94], bg: colors.successLight },
              Absent: { color: [239, 68, 68], bg: colors.dangerLight },
              Late: { color: [245, 158, 11], bg: colors.warningLight },
            };
            const style = statusMap[cell] || { color: colors.textLight, bg: [240, 240, 240] };
            
            doc.setFillColor(...style.bg);
            doc.roundedRect(xPos + 8, yPos + 6, 52, 16, 3, 3, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...style.color);
            doc.text(cell, xPos + columnWidths[idx] / 2, yPos + 16, { align: 'center' });
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.text);
            doc.text(cell, xPos + columnWidths[idx] / 2, yPos + 16, { align: 'center' });
          }
          xPos += columnWidths[idx];
        });
  
        // Row divider
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.line(startX, yPos + 28, startX + tableWidth, yPos + 28);
        
        yPos += 28;
      });
  
      // === SIGNATURE SECTION ===
      yPos = pageHeight - 120;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...colors.textLight);
      doc.text('Authorized Signature:', 60, yPos);
      doc.setDrawColor(...colors.borderDark);
      doc.setLineWidth(1);
      doc.line(160, yPos, 280, yPos);
      
      doc.text('Date:', pageWidth - 200, yPos);
      doc.line(pageWidth - 160, yPos, pageWidth - 60, yPos);
  
      // === FOOTER ON ALL PAGES ===
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.line(40, pageHeight - 50, pageWidth - 40, pageHeight - 50);
        
        // Footer content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...colors.textLighter);
        doc.text(`Page ${i} of ${pageCount}`, 40, pageHeight - 35);
        doc.text('CONFIDENTIAL — Internal Use Only', pageWidth / 2, pageHeight - 35, { align: 'center' });
        doc.text('WorkPulse Attendance System', pageWidth - 40, pageHeight - 35, { align: 'right' });
        
        // Watermark on content pages
        if (i > 1 && logoDataUrl) {
          doc.setGState(new doc.GState({ opacity: 0.03 }));
          doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 80, pageHeight / 2 - 80, 160, 160);
          doc.setGState(new doc.GState({ opacity: 1 }));
        }
      }
  
      const filename = `CGH_Attendance_Report_${format(currentDate, 'yyyy-MM')}.pdf`;
      doc.save(filename);
      showToast?.('📄 Professional PDF exported successfully!', 'success');
    } catch (error) {
      console.error('❌ PDF Export Error:', error);
      showToast?.(`Failed to export PDF: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
      setShowExportDropdown(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header with Beautiful Background */}
        <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-2xl">
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
                  className={`group inline-flex items-center px-6 py-3 backdrop-blur-sm border rounded-xl text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    showExportDropdown 
                      ? 'bg-white/20 border-white/30 shadow-lg' 
                      : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
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
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-[9998]" 
                      onClick={() => setShowExportDropdown(false)}
                    ></div>
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden animate-in slide-in-from-top-2 duration-200 ring-1 ring-gray-100">
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
                      </div>
                    </div>
                  </>
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