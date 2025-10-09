import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  MapPin,
  Filter,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAllSchedules,
  getSchedulesByDateRange,
  getScheduleStats,
  createSchedule,
  updateSchedule,
  cancelSchedule,
} from "../../services/scheduleService";
import employeeService from "../../services/employeeService";
import jsPDF from 'jspdf';
import { useToast } from '../../contexts/ToastContext';

const ShiftManagement = () => {
  const [currentView, setCurrentView] = useState("calendar"); // 'calendar' or 'list'
  const [selectedDate, setSelectedDate] = useState(new Date()); // Start with current date
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterShiftType, setFilterShiftType] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("monthly"); // 'monthly' or 'all'
  const [stats, setStats] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const { showToast } = useToast();

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startCalendar = new Date(firstDay);
    startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startCalendar);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Get schedules for a specific date
  const getSchedulesForDate = (date) => {
    const daySchedules = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.date);
      const match = scheduleDate.toDateString() === date.toDateString();

      // Debug logging for first day only to avoid spam
      if (date.getDate() === 1) {
        console.log(`📅 Checking date ${date.toDateString()}:`, {
          totalSchedules: schedules.length,
          foundSchedules: daySchedules.length,
          scheduleDate: scheduleDate.toDateString(),
          match,
        });
      }

      return match;
    });

    return daySchedules;
  };

  // Navigate calendar
  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  // Fetch data
  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
    fetchStats();
  }, [selectedDate, filterDateRange]);

  // Filter schedules based on search and filters
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      !searchTerm ||
      `${schedule.employee?.firstName} ${schedule.employee?.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      schedule.employee?.employeeId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      schedule.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      !filterDepartment || schedule.department === filterDepartment;
    const matchesShiftType =
      !filterShiftType || schedule.shift?.type === filterShiftType;

    return matchesSearch && matchesDepartment && matchesShiftType;
  });

  // Get unique departments from schedules
  const departments = [
    ...new Set(schedules.map((s) => s.department).filter(Boolean)),
  ];
  const shiftTypes = ["morning", "afternoon", "night", "custom"];

  const fetchSchedules = async () => {
    try {
      setLoading(true);

      let startDate, endDate;

      if (filterDateRange === "all") {
        // Get all schedules - use a very wide range
        startDate = new Date("2020-01-01"); // Far past
        endDate = new Date("2030-12-31"); // Far future
      } else {
        // Monthly view - current selected month only
        startDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        endDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        );
      }

      console.log("📅 Fetching schedules for date range:", {
        filterMode: filterDateRange,
        startDate: startDate.toDateString(),
        endDate: endDate.toDateString(),
        selectedMonth: selectedDate.getMonth() + 1,
        selectedYear: selectedDate.getFullYear(),
        currentlyViewingMonth: selectedDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        selectedDateDetails: {
          month: selectedDate.getMonth(), // 0-based month
          year: selectedDate.getFullYear(),
          date: selectedDate.getDate(),
        },
      });

      let response;
      if (filterDateRange === "all") {
        // For "all" mode, get all schedules without date filtering
        response = await getAllSchedules();
      } else {
        // For monthly mode, use date range filtering
        response = await getSchedulesByDateRange(startDate, endDate);
      }

      console.log("✅ Schedule API Response:", response);
      console.log("📊 Schedule data:", response.data);
      console.log("📈 Schedule count:", response.data?.length);

      // Show first few schedules for debugging with date details
      if (response.data?.length > 0) {
        console.log(
          "📋 First 3 schedules with dates:",
          response.data.slice(0, 3).map((s) => {
            const schedDate = new Date(s.date);
            return {
              employee: s.employee?.firstName + " " + s.employee?.lastName,
              dateString: schedDate.toDateString(),
              year: schedDate.getFullYear(),
              month: schedDate.getMonth(),
              day: schedDate.getDate(),
              shift: s.shift?.type,
              originalDate: s.date,
            };
          })
        );
      }

      // Check if any schedules fall within the current month view
      const schedulesInCurrentMonth =
        response.data?.filter((schedule) => {
          const scheduleDate = new Date(schedule.date);
          return (
            scheduleDate.getMonth() === selectedDate.getMonth() &&
            scheduleDate.getFullYear() === selectedDate.getFullYear()
          );
        }) || [];

      console.log(
        "📅 Schedules in current month view:",
        schedulesInCurrentMonth.length
      );

      setSchedules(response.data || []);
    } catch (error) {
      console.error("❌ Error fetching schedules:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      console.log("🔄 Fetching employees from API...");
      const response = await employeeService.getAllEmployees();
      console.log("✅ Employee API Response:", response);
      console.log("👥 Employee data:", response.data);

      // Filter only employees (not admin/hr)
      const employeeList =
        response.data?.filter((emp) => emp.role === "employee") || [];
      console.log("📋 Filtered employees:", employeeList);

      setEmployees(employeeList);
    } catch (error) {
      console.error("❌ Error fetching employees:", error);
      setEmployees([]);
    }
  };

  const fetchStats = async () => {
    try {
      const startDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      );
      const endDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0
      );

      const response = await getScheduleStats({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this shift? This action cannot be undone."
      )
    )
      return;

    try {
      await cancelSchedule(scheduleId);
      fetchSchedules();
      fetchStats();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Error deleting schedule: " + (error.message || "Unknown error"));
    }
  };

  // PDF Export Function
  const exportToPDF = async () => {
    setIsExporting(true);
    setShowExportDropdown(false);
    
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // === LIGHT COLOR PALETTE ===
      const colors = {
        primary: [147, 197, 253],       // Light Blue
        primaryDark: [96, 165, 250],    // Sky Blue
        accent: [167, 243, 208],        // Light Emerald
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
      };
  
      // === LOAD LOGO ===
      const loadImageAsDataURL = (src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            } catch (e) {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = src;
        });
      };

      // Format currency
      const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

      let yPos = 40;

      // === HEADER ===
      const logoDataUrl = await loadImageAsDataURL('/Logo.png');
      if (logoDataUrl) {
        const logoWidth = 130;
        const logoHeight = 55;
        doc.addImage(logoDataUrl, 'PNG', 30, yPos - 10, logoWidth, logoHeight);
      }

      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Colombo General Hospital', pageWidth - 30, yPos + 10, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('123 Hospital Street, Colombo 07', pageWidth - 30, yPos + 28, { align: 'right' });
      doc.text('Tel: +94 11 123 4567 | Email: info@cgh.lk', pageWidth - 30, yPos + 44, { align: 'right' });
      yPos += 75;

      // Accent divider
      doc.setDrawColor(59, 130, 246);
      doc.setFillColor(59, 130, 246);
      doc.rect(30, yPos, pageWidth - 60, 3, 'F');
      yPos += 25;

      // === TITLE SECTION ===
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...colors.text);
      doc.text('Shift Schedule Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;

      doc.setFontSize(12);
      doc.setTextColor(...colors.textLight);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 30;
  
      // === SUMMARY STATISTICS ===
      if (stats) {
        console.log('📊 PDF Export - Stats data:', stats);
        console.log('📊 PDF Export - Stats overall:', stats.overall);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(...colors.text);
        doc.text('Summary Statistics', 40, yPos);
        
        doc.setFillColor(...colors.primary);
        doc.rect(40, yPos + 6, 60, 3, 'F');
        yPos += 35;

        // Calculate stats from actual schedule data
        const totalSchedules = schedules.length;
        const morningShifts = schedules.filter(s => s.shift?.type === 'morning').length;
        const afternoonShifts = schedules.filter(s => s.shift?.type === 'afternoon').length;
        const nightShifts = schedules.filter(s => s.shift?.type === 'night').length;

        console.log('📊 PDF Export - Calculated stats:', {
          totalSchedules,
          morningShifts,
          afternoonShifts,
          nightShifts
        });

        const summaryStats = [
          { label: 'Total Schedules', value: totalSchedules, color: colors.primaryDark, bgColor: [219, 234, 254] },
          { label: 'Morning Shifts', value: morningShifts, color: [34, 197, 94], bgColor: colors.successLight },
          { label: 'Afternoon Shifts', value: afternoonShifts, color: [245, 158, 11], bgColor: colors.warningLight },
          { label: 'Night Shifts', value: nightShifts, color: [147, 51, 234], bgColor: [221, 214, 254] }
        ];
  
        const cardWidth = 125;
        const cardHeight = 85;
        const cardSpacing = 10;
  
        summaryStats.forEach((stat, i) => {
          const x = 40 + i * (cardWidth + cardSpacing);
          
          // Card shadow
          doc.setFillColor(0, 0, 0);
          doc.setGState(new doc.GState({ opacity: 0.08 }));
          doc.roundedRect(x + 2, yPos + 2, cardWidth, cardHeight, 8, 8, 'F');
          doc.setGState(new doc.GState({ opacity: 1 }));
          
          // Card background
          doc.setFillColor(...stat.bgColor);
          doc.roundedRect(x, yPos, cardWidth, cardHeight, 8, 8, 'F');
          
          // Card border
          doc.setDrawColor(...stat.color);
          doc.setLineWidth(2);
          doc.roundedRect(x, yPos, cardWidth, cardHeight, 8, 8, 'S');
          
          // Value
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(28);
          doc.setTextColor(...stat.color);
          doc.text(stat.value.toString(), x + cardWidth - 15, yPos + 45, { align: 'right' });
          
          // Label
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...colors.textLight);
          doc.text(stat.label, x + cardWidth / 2, yPos + 70, { align: 'center' });
        });
  
        yPos += cardHeight + 50;
      }
  
      // === SCHEDULE DETAILS SECTION ===
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(...colors.text);
      doc.text('Schedule Details', 40, yPos);
      doc.setFillColor(...colors.primary);
      doc.rect(40, yPos + 6, 60, 3, 'F');
      yPos += 35;
  
      // Filter schedules based on current filters
      const filteredSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        const employeeName = schedule.employee ? `${schedule.employee.firstName} ${schedule.employee.lastName}` : '';
        const matchesSearch = !searchTerm || 
          employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = !filterDepartment || schedule.department === filterDepartment;
        const matchesShiftType = !filterShiftType || schedule.shift?.type === filterShiftType;
        
        let matchesDateRange = true;
        if (filterDateRange === 'monthly') {
          matchesDateRange = scheduleDate.getMonth() === selectedDate.getMonth() && 
                           scheduleDate.getFullYear() === selectedDate.getFullYear();
        }

        return matchesSearch && matchesDepartment && matchesShiftType && matchesDateRange;
      });
  
      if (filteredSchedules.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(...colors.textLight);
        doc.text('No schedules found for the selected criteria', 40, yPos);
      } else {
        // Table headers
        const headers = ['Date', 'Employee', 'Department', 'Shift Type', 'Start', 'End', 'Status'];
        const columnWidths = [75, 95, 85, 75, 55, 55, 70];
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
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        filteredSchedules.slice(0, 50).forEach((schedule, index) => {
          if (yPos > pageHeight - 100) {
            doc.addPage();
            yPos = 80;
          }
  
          // Alternating row colors
          if (index % 2 === 0) {
            doc.setFillColor(...colors.bgLight);
            doc.rect(startX, yPos, tableWidth, 28, 'F');
          }
  
          const rowData = [
            new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            schedule.employee ? `${schedule.employee.firstName} ${schedule.employee.lastName}` : 'N/A',
            schedule.department || 'N/A',
            schedule.shift?.type || 'N/A',
            schedule.shift?.startTime || 'N/A',
            schedule.shift?.endTime || 'N/A',
            schedule.status || 'Active'
          ];
  
          xPos = startX;
          rowData.forEach((cell, cellIndex) => {
            if (cellIndex === 6) { // Status column
              const statusMap = {
                'Active': { color: [34, 197, 94], bg: colors.successLight },
                'Completed': { color: [34, 197, 94], bg: colors.successLight },
                'Cancelled': { color: [239, 68, 68], bg: colors.dangerLight },
                'Pending': { color: [245, 158, 11], bg: colors.warningLight }
              };
              const style = statusMap[cell] || { color: colors.textLight, bg: [240, 240, 240] };
              
              doc.setFillColor(...style.bg);
              doc.roundedRect(xPos + 8, yPos + 6, 52, 16, 3, 3, 'F');
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(8);
              doc.setTextColor(...style.color);
              doc.text(cell, xPos + columnWidths[cellIndex] / 2, yPos + 16, { align: 'center' });
            } else {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              doc.setTextColor(...colors.text);
              doc.text(cell, xPos + columnWidths[cellIndex] / 2, yPos + 16, { align: 'center' });
            }
            xPos += columnWidths[cellIndex];
          });
  
          // Row divider
          doc.setDrawColor(...colors.border);
          doc.setLineWidth(0.5);
          doc.line(startX, yPos + 28, startX + tableWidth, yPos + 28);
          
          yPos += 28;
        });
  
        if (filteredSchedules.length > 50) {
          yPos += 15;
          doc.setFontSize(10);
          doc.setTextColor(...colors.textLight);
          doc.setFont('helvetica', 'italic');
          doc.text(`Note: Showing first 50 of ${filteredSchedules.length} schedules`, 40, yPos);
        }
      }
  
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
        doc.text('WorkPulse Schedule System', pageWidth - 40, pageHeight - 35, { align: 'right' });
        
        // Watermark on content pages
        if (i > 0 && logoDataUrl) {
          doc.setGState(new doc.GState({ opacity: 0.03 }));
          doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 80, pageHeight / 2 - 80, 160, 160);
          doc.setGState(new doc.GState({ opacity: 1 }));
        }
      }
  
      // Save PDF
      const filename = `CGH_Shift_Schedule_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      showToast?.('📄 Schedule report exported successfully!', 'success');
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      showToast?.(`Failed to export PDF: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Shift Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Create, view, and manage employee shifts with ease
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Shifts</p>
                  <p className="text-3xl font-bold">
                    {stats.overall?.totalSchedules || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Scheduled</p>
                  <p className="text-3xl font-bold">
                    {stats.overall?.scheduledCount || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Completed</p>
                  <p className="text-3xl font-bold">
                    {stats.overall?.completedCount || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Night Shifts</p>
                  <p className="text-3xl font-bold">
                    {stats.overall?.nightShifts || 0}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Controls */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <div className="bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setCurrentView("calendar")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentView === "calendar"
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Calendar
                </button>
                <button
                  onClick={() => setCurrentView("list")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentView === "list"
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  List
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Department Filter */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Shift Type Filter */}
              <select
                value={filterShiftType}
                onChange={(e) => setFilterShiftType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Shifts</option>
                {shiftTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>

              {/* Date Range Filter */}
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gradient-to-r from-blue-50 to-purple-50 font-medium"
              >
                <option value="monthly">📅 Current Month</option>
                <option value="all">🗓️ All Schedules</option>
              </select>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={() => {
                          exportToPDF();
                        }}
                        disabled={isExporting}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {isExporting ? 'Exporting...' : 'Download PDF'}
                          </div>
                          <div className="text-xs text-gray-500">Schedule report</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Shift
                </button>
              </div>
            </div>
          </div>
        </div>

        {currentView === "calendar" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Enhanced Calendar Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {filterDateRange === "all"
                    ? "🗓️ All Schedules View"
                    : selectedDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                </h2>
                <div className="flex items-center space-x-2">
                  {filterDateRange === "monthly" && (
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-xl transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-colors font-medium"
                  >
                    Current Date
                  </button>
                  <button
                    onClick={() => {
                      console.log(
                        "🎯 Navigating to October 21, 2025 to view schedules"
                      );
                      setSelectedDate(new Date(2025, 9, 21)); // October 21 2025 - where schedules exist
                    }}
                    className="px-4 py-2 bg-white bg-opacity-30 hover:bg-opacity-40 rounded-xl transition-colors font-medium border border-white border-opacity-30"
                  >
                    📅 View Schedules
                  </button>
                  {filterDateRange === "monthly" && (
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-xl transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Show different content based on filter mode */}
              {filterDateRange === "all" ? (
                // All Schedules View - Show as cards
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  <div className="text-center text-gray-600 mb-4">
                    Displaying all {schedules.length} schedules
                  </div>
                  {schedules.map((schedule) => (
                    <div
                      key={schedule._id}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                schedule.shift?.type === "morning"
                                  ? "bg-yellow-400"
                                  : schedule.shift?.type === "afternoon"
                                  ? "bg-orange-400"
                                  : schedule.shift?.type === "night"
                                  ? "bg-purple-400"
                                  : "bg-gray-400"
                              }`}
                            ></div>
                            <h4 className="font-semibold text-gray-900">
                              {schedule.employee?.firstName}{" "}
                              {schedule.employee?.lastName}
                            </h4>
                            <span className="text-sm text-gray-500">
                              ({schedule.employee?.employeeId})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <div className="font-medium">
                                {new Date(schedule.date).toDateString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Time:</span>
                              <div className="font-medium">
                                {schedule.shift?.startTime} -{" "}
                                {schedule.shift?.endTime}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Department:</span>
                              <div className="font-medium">
                                {schedule.department}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <div
                                className={`font-medium ${
                                  schedule.status === "completed"
                                    ? "text-green-600"
                                    : "text-blue-600"
                                }`}
                              >
                                {schedule.status}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedSchedule(schedule)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Monthly Calendar View
                <div>
                  {/* Enhanced Calendar Grid */}
                  <div className="grid grid-cols-7 gap-3">
                    {/* Day Headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="p-3 text-center text-sm font-semibold text-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl"
                        >
                          {day}
                        </div>
                      )
                    )}

                    {/* Enhanced Calendar Days */}
                    {calendarDays.map((day, index) => {
                      // Use original schedules array, not filtered ones for calendar display
                      const daySchedules = schedules.filter((schedule) => {
                        const scheduleDate = new Date(schedule.date);
                        const dayDate = new Date(day);

                        // More robust date comparison
                        const scheduleYear = scheduleDate.getFullYear();
                        const scheduleMonth = scheduleDate.getMonth();
                        const scheduleDay = scheduleDate.getDate();

                        const dayYear = dayDate.getFullYear();
                        const dayMonth = dayDate.getMonth();
                        const dayOfMonth = dayDate.getDate();

                        const match =
                          scheduleYear === dayYear &&
                          scheduleMonth === dayMonth &&
                          scheduleDay === dayOfMonth;

                        // Debug logging for specific dates only to avoid spam
                        if (
                          dayOfMonth >= 20 &&
                          dayOfMonth <= 22 &&
                          scheduleDate
                        ) {
                          console.log(
                            `🔍 Date comparison for day ${dayOfMonth}:`,
                            {
                              scheduleDate: scheduleDate.toDateString(),
                              dayDate: dayDate.toDateString(),
                              match: match,
                              scheduleYear,
                              scheduleMonth,
                              scheduleDay,
                              dayYear,
                              dayMonth,
                              dayOfMonth,
                              Expected: `${scheduleDay} should equal ${dayOfMonth}`,
                            }
                          );
                        }

                        return match;
                      });
                      const isCurrentMonth =
                        day.getMonth() === selectedDate.getMonth();
                      const isToday =
                        day.toDateString() === new Date().toDateString();

                      // Debug for first few days
                      if (index < 3) {
                        console.log(
                          `📅 Day ${day.getDate()}: Found ${
                            daySchedules.length
                          } schedules`
                        );
                      }

                      return (
                        <div
                          key={index}
                          className={`min-h-[160px] max-h-[200px] p-3 rounded-2xl transition-all duration-200 ${
                            !isCurrentMonth
                              ? "bg-gray-50 text-gray-400"
                              : isToday
                              ? "bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-300 shadow-lg"
                              : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                          }`}
                        >
                          <div
                            className={`font-semibold text-sm mb-2 ${
                              isToday ? "text-blue-700" : ""
                            }`}
                          >
                            {day.getDate()}
                          </div>

                          {isCurrentMonth && (
                            <div className="space-y-1 max-h-[100px] overflow-y-auto">
                              {daySchedules.map((schedule) => (
                                <div
                                  key={schedule._id}
                                  className="group relative"
                                >
                                  <div
                                    className={`text-xs p-1.5 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                      schedule.shift?.type === "morning"
                                        ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300"
                                        : schedule.shift?.type === "afternoon"
                                        ? "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300"
                                        : schedule.shift?.type === "night"
                                        ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300"
                                        : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
                                    }`}
                                    onClick={() =>
                                      setSelectedSchedule(schedule)
                                    }
                                  >
                                    <div className="font-semibold truncate text-xs leading-tight">
                                      {schedule.employee?.firstName.charAt(0)}.
                                      {schedule.employee?.lastName}
                                    </div>
                                    <div className="truncate text-xs opacity-80 leading-tight">
                                      {schedule.shift?.startTime}-
                                      {schedule.shift?.endTime}
                                    </div>
                                  </div>

                                  {/* Enhanced Quick Actions */}
                                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSchedule(schedule);
                                        }}
                                        className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 shadow-md"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteSchedule(schedule._id);
                                        }}
                                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Show total count if more than 3 shifts */}
                              {daySchedules.length > 3 && (
                                <div className="text-xs text-blue-600 bg-blue-50 rounded-lg p-1 text-center font-medium mt-1">
                                  {daySchedules.length} shifts total
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "list" && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* List Header with Count */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Shift Schedule List
                </h3>
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-blue-600">
                    {filteredSchedules.length}
                  </span>{" "}
                  of <span className="font-semibold">{schedules.length}</span>{" "}
                  shifts
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Shift
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredSchedules.map((schedule) => (
                    <tr
                      key={schedule._id}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            {schedule.employee?.firstName?.charAt(0)}
                            {schedule.employee?.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {schedule.employee?.firstName}{" "}
                              {schedule.employee?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {schedule.employee?.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(schedule.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            schedule.shift?.type === "morning"
                              ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300"
                              : schedule.shift?.type === "afternoon"
                              ? "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300"
                              : schedule.shift?.type === "night"
                              ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
                          }`}
                        >
                          {schedule.shift?.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {schedule.shift?.startTime} -{" "}
                          {schedule.shift?.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium">
                          <MapPin className="w-3 h-3 mr-1" />
                          {schedule.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            schedule.status === "scheduled"
                              ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
                              : schedule.status === "completed"
                              ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300"
                              : schedule.status === "cancelled"
                              ? "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
                          }`}
                        >
                          {schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setSelectedSchedule(schedule)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Schedule"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule._id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || selectedSchedule) && (
          <CreateEditShiftModal
            schedule={selectedSchedule}
            employees={employees}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedSchedule(null);
            }}
            onSuccess={() => {
              fetchSchedules();
              fetchStats();
              setShowCreateModal(false);
              setSelectedSchedule(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Create/Edit Shift Modal Component
const CreateEditShiftModal = ({ schedule, employees, onClose, onSuccess }) => {
  console.log("🎯 Modal opened with employees:", employees);
  console.log("📊 Employees count:", employees?.length);

  const [formData, setFormData] = useState({
    employee: schedule?.employee?._id || "",
    date: schedule?.date
      ? new Date(schedule.date).toISOString().split("T")[0]
      : "",
    shiftType: schedule?.shift?.type || "morning",
    startTime: schedule?.shift?.startTime || "09:00",
    endTime: schedule?.shift?.endTime || "17:00",
    department: schedule?.department || "",
    breakDuration: schedule?.shift?.breakDuration || 30,
    location: {
      building: schedule?.location?.building || "",
      floor: schedule?.location?.floor || "",
      unit: schedule?.location?.unit || "",
      room: schedule?.location?.room || "",
    },
    notes: schedule?.notes || "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        employee: formData.employee,
        date: formData.date,
        shift: {
          type: formData.shiftType,
          startTime: formData.startTime,
          endTime: formData.endTime,
          breakDuration: formData.breakDuration,
        },
        department: formData.department,
        location: formData.location,
        notes: formData.notes,
      };

      if (schedule) {
        await updateSchedule(schedule._id, submitData);
      } else {
        await createSchedule(submitData);
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert(
        "Error saving schedule: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-screen overflow-y-auto m-4">
        {/* Enhanced Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {schedule ? "✏️ Edit Shift" : "➕ Create New Shift"}
          </h2>
          <p className="text-blue-100 mt-1">
            {schedule
              ? "Update shift details and schedule"
              : "Schedule a new shift for your employee"}
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Employee & Basic Info Section */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Employee & Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Employee *
                  </label>
                  <select
                    value={formData.employee}
                    onChange={(e) => {
                      const selectedEmp = employees.find(
                        (emp) => emp._id === e.target.value
                      );
                      console.log("🔄 Employee selected:", selectedEmp);
                      setFormData({
                        ...formData,
                        employee: e.target.value,
                        department: selectedEmp ? selectedEmp.department : "",
                      });
                    }}
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-3"
                    required
                  >
                    <option value="">Choose an employee...</option>
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        Loading employees...
                      </option>
                    )}
                  </select>
                  {employees.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No employees found. Please check API connection.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {employees.length} employee(s) available
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    max={
                      new Date(new Date().setDate(new Date().getDate() + 14))
                        .toISOString()
                        .split("T")[0]
                    }
                    //max={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]}
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shift Type *
                  </label>
                  <select
                    value={formData.shiftType}
                    onChange={(e) =>
                      setFormData({ ...formData, shiftType: e.target.value })
                    }
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors p-3"
                    required
                  >
                    <option value="morning">🌅 Morning Shift</option>
                    <option value="afternoon">☀️ Afternoon Shift</option>
                    <option value="night">🌙 Night Shift</option>
                    <option value="custom">⚙️ Custom Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    className="w-full rounded-xl border-gray-300 bg-gray-100 shadow-sm p-3"
                    placeholder="Department auto-filled"
                  />
                </div>
              </div>
            </div>

            {/* Time & Schedule Section */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Time & Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.breakDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        breakDuration: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors p-3"
                    placeholder="30"
                    min="0"
                    max="180"
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                Location Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Building
                  </label>
                  <input
                    type="text"
                    placeholder="Building A"
                    value={formData.location.building}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          building: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Floor
                  </label>
                  <input
                    type="text"
                    placeholder="Floor 3"
                    value={formData.location.floor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          floor: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="ICU"
                    value={formData.location.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          unit: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room
                  </label>
                  <input
                    type="text"
                    placeholder="Room 301"
                    value={formData.location.room}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          room: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors p-3"
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-purple-600" />
                Additional Notes
              </h3>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors p-3"
                placeholder="Add any special instructions or notes for this shift..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : schedule ? (
                  "✏️ Update Shift"
                ) : (
                  "➕ Create Shift"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showExportDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowExportDropdown(false)}
        />
      )}
    </div>
  );
};

export default ShiftManagement;
