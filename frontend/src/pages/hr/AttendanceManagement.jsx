import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  TrendingUp,
  UserCheck,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';

const AttendanceManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('daily');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredAttendanceData, setFilteredAttendanceData] = useState([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper functions for date calculations
  const getDateRange = (mode, period) => {
    const date = new Date(period);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    switch (mode) {
      case 'daily':
        const startOfDay = new Date(year, month, day);
        const endOfDay = new Date(year, month, day, 23, 59, 59);
        return { start: startOfDay, end: endOfDay };
      
      case 'weekly':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(day - date.getDay()); // Start from Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59);
        return { start: startOfWeek, end: endOfWeek };
      
      case 'monthly':
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
        return { start: startOfMonth, end: endOfMonth };
      
      default:
        return { start: date, end: date };
    }
  };

  const formatPeriodDisplay = (mode, period) => {
    const date = new Date(period);
    
    switch (mode) {
      case 'daily':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      
      case 'monthly':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      
      default:
        return date.toLocaleDateString();
    }
  };

  const navigatePeriod = (direction) => {
    const newPeriod = new Date(currentPeriod);
    
    switch (viewMode) {
      case 'daily':
        newPeriod.setDate(newPeriod.getDate() + direction);
        break;
      case 'weekly':
        newPeriod.setDate(newPeriod.getDate() + (direction * 7));
        break;
      case 'monthly':
        newPeriod.setMonth(newPeriod.getMonth() + direction);
        break;
    }
    
    setCurrentPeriod(newPeriod);
  };

  const filterAttendanceByPeriod = (data, mode, period) => {
    const { start, end } = getDateRange(mode, period);
    
    return data.filter(record => {
      // Get the record date - handle different possible date formats
      let recordDate;
      if (record.date) {
        // If date is already a Date object or ISO string
        recordDate = new Date(record.date);
      } else if (record.createdAt) {
        recordDate = new Date(record.createdAt);
      } else {
        // Fallback to current date
        recordDate = new Date();
      }
      
      // For all modes, normalize dates to start of day for comparison
      const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
      const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      // Check if record date falls within the range
      return recordDateOnly >= startDateOnly && recordDateOnly <= endDateOnly;
    });
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        const res = await api.get('/attendance', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            limit: 1000 // Get more records for better filtering
          }
        });
        
        
        if (res.data.success) {
          // Transform the data to match our component structure
          const transformedData = res.data.data.map(record => ({
            id: record.id,
            employeeId: record.employeeId,
            name: record.name,
            department: record.department,
            clockIn: record.clockIn,
            clockOut: record.clockOut,
            workingHours: record.workingHours.replace('h', ''),
            overtime: record.overtime.replace('h', ''),
            status: record.status,
            date: new Date(record.date).toISOString().split('T')[0]
          }));
          setAttendanceData(transformedData);
          setError(null);
          
          // Set current period to the most recent date in the data
          if (transformedData.length > 0) {
            const dates = transformedData.map(record => new Date(record.date));
            const mostRecentDate = new Date(Math.max(...dates));
            setCurrentPeriod(mostRecentDate);
          }
        } else {
          setError('Failed to fetch attendance data');
          setAttendanceData([]);
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError(err.response?.data?.message || 'Failed to fetch attendance data');
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  // Filter attendance data based on current view mode and period
  useEffect(() => {
    const filtered = filterAttendanceByPeriod(attendanceData, viewMode, currentPeriod);
    setFilteredAttendanceData(filtered);
  }, [attendanceData, viewMode, currentPeriod]);

  // Calculate dynamic stats based on filtered data
  const attendanceStats = {
    totalEmployees: filteredAttendanceData.length,
    present: filteredAttendanceData.filter(record => record.status === 'present').length,
    absent: filteredAttendanceData.filter(record => record.status === 'absent').length,
    late: filteredAttendanceData.filter(record => record.status === 'late').length,
    attendanceRate: filteredAttendanceData.length > 0 
      ? ((filteredAttendanceData.filter(record => record.status === 'present').length / filteredAttendanceData.length) * 100).toFixed(1)
      : 0
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = filteredAttendanceData.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

//PDF
// Professional Corporate PDF Download Function
const downloadDetailedPDF = async () => {
  if (filteredData.length === 0) {
    alert('No data to export');
    return;
  }

  try {
    setGeneratingPDF(true);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Professional light color palette
    const colors = {
      primary: [96, 165, 250],       // Light Blue
      primaryLight: [147, 197, 253],  // Very Light Blue
      accent: [94, 234, 212],        // Light Teal
      text: [31, 41, 55],            // Dark Gray
      textLight: [107, 114, 128],    // Medium Gray
      border: [209, 213, 219],       // Light Gray Border
      bgLight: [249, 250, 251],      // Very Light Gray
      bgCard: [255, 255, 255],       // White
      success: [134, 239, 172],      // Light Green
      warning: [253, 186, 116],      // Light Orange
      danger: [252, 165, 165],       // Light Red
    };

    let yPos = 40;

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

    // === PROFESSIONAL HEADER ===
    // Light background for header area
    doc.setFillColor(...colors.bgLight);
    doc.rect(0, 0, pageWidth, 140, 'F');

    // Top accent line - light blue
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 8, 'F');

    // Add logo
    const logoDataUrl = await loadImageAsDataURL('/Logo.png');
    if (logoDataUrl) {
      const logoWidth = 140;
      const logoHeight = 60;
      doc.addImage(logoDataUrl, 'PNG', 40, yPos + 10, logoWidth, logoHeight);
    } else {
      // Logo placeholder
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(2);
      doc.rect(40, yPos + 10, 140, 60);
    }

    // Hospital Information - Right aligned
    doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Colombo General Hospital', pageWidth - 40, yPos + 25, { align: 'right' });
    
    doc.setTextColor(...colors.textLight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('123 Hospital Street, Colombo 07, Sri Lanka', pageWidth - 40, yPos + 45, { align: 'right' });
    doc.text('Tel: +94 11 123 4567', pageWidth - 40, yPos + 62, { align: 'right' });
    doc.text('Email: info@cgh.lk', pageWidth - 40, yPos + 79, { align: 'right' });

    // Colored divider line between header and content
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(2);
    doc.line(40, 140, pageWidth - 40, 140);

    yPos = 170;

    // === DOCUMENT TITLE SECTION ===
    // White background without border
    doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ATTENDANCE REPORT', pageWidth / 2, yPos + 22, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...colors.textLight);
    const currentDate = new Date();
    doc.text(
      currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      pageWidth / 2,
      yPos + 40,
      { align: 'center' }
    );

    yPos += 70;

    // === REPORT METADATA ===
    const metadata = [
      { label: 'Report Period:', value: `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} - ${formatPeriodDisplay(viewMode, currentPeriod)}` },
      { label: 'Generated:', value: `${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}` },
      { label: 'Total Records:', value: `${filteredData.length} employees` }
    ];

    doc.setFillColor(...colors.bgCard);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.roundedRect(40, yPos, pageWidth - 80, 60, 3, 3, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    metadata.forEach((item, index) => {
      const xStart = 55 + (index * ((pageWidth - 80) / 3));
      doc.setTextColor(...colors.textLight);
      doc.text(item.label, xStart, yPos + 22);
      doc.setTextColor(...colors.text);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, xStart, yPos + 42);
      doc.setFont('helvetica', 'normal');
    });

    yPos += 85;

    // === EXECUTIVE SUMMARY ===
    // Section header with background
    doc.setFillColor(...colors.primary);
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.rect(40, yPos - 10, pageWidth - 80, 35, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));
    
    doc.setFontSize(16);
    doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 40, yPos + 8);
    
    // Half underline (only under "Executive")
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(3);
    const textWidth = doc.getTextWidth('Executive');
    doc.line(40, yPos + 15, 40 + textWidth, yPos + 15);
    
    yPos += 45;

    // === STATISTICS CARDS - ENHANCED LAYOUT ===
    const stats = [
      { label: 'Total Employees', value: attendanceStats.totalEmployees, color: colors.primary, icon: '👥' },
      { label: 'Present Today', value: attendanceStats.present, color: colors.success, icon: '✓' },
      { label: 'Absent', value: attendanceStats.absent, color: colors.danger, icon: '✗' },
      { label: 'Late Arrivals', value: attendanceStats.late, color: colors.warning, icon: '⏰' },
    ];

    stats.forEach((stat, index) => {
      const x = 40 + (index * 130);
      
      // Card shadow for depth
      doc.setFillColor(0, 0, 0);
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.roundedRect(x + 3, yPos + 3, 120, 90, 4, 4, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
      
      // Card background with gradient effect
      doc.setFillColor(...colors.bgCard);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.8);
      doc.roundedRect(x, yPos, 120, 90, 4, 4, 'FD');
      
      // Top colored accent bar - horizontal
      doc.setFillColor(...stat.color);
      doc.rect(x, yPos, 120, 5, 'F');
      
      // Bottom left colored accent
      doc.setFillColor(...stat.color);
      doc.setGState(new doc.GState({ opacity: 0.15 }));
      doc.triangle(x, yPos + 90, x + 30, yPos + 90, x, yPos + 60, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
      
      // Icon background circle - positioned at top
      doc.setFillColor(...stat.color);
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.circle(x + 60, yPos + 28, 22, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
      
      // Value - positioned inside the circle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(...stat.color);
      doc.text(stat.value.toString(), x + 60, yPos + 35, { align: 'center' });
      
      // Label with better spacing - positioned below circle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...colors.textLight);
      doc.text(stat.label, x + 60, yPos + 78, { align: 'center' });
    });

    yPos += 110;

    // === ATTENDANCE RATE HIGHLIGHT ===
    // Full colored background for the entire box
    doc.setFillColor(...colors.primary);
    doc.setGState(new doc.GState({ opacity: 0.15 }));
    doc.roundedRect(40, yPos, pageWidth - 80, 45, 3, 3, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));
    
    // Border
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(2);
    doc.roundedRect(40, yPos, pageWidth - 80, 45, 3, 3, 'S');
    
    doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Overall Attendance Rate:', 60, yPos + 28);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...colors.primary);
    doc.text(`${attendanceStats.attendanceRate}%`, pageWidth - 120, yPos + 30, { align: 'right' });

    yPos += 70;

    // === DETAILED RECORDS ===
    doc.setFontSize(16);
    doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Attendance Records', 40, yPos);
    
    // Half underline (only under "Detailed Attendance")
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(3);
    const detailedTextWidth = doc.getTextWidth('Detailed Attendance');
    doc.line(40, yPos + 7, 40 + detailedTextWidth, yPos + 7);
    
    yPos += 30;

    // === PROFESSIONAL TABLE ===
    const headers = ['Employee Name', 'Department', 'Clock In', 'Clock Out', 'Hours', 'Status'];
    const columnWidths = [130, 100, 75, 75, 55, 70];
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
    const startX = 40;

    // Table header
    doc.setFillColor(...colors.text);
    doc.rect(startX, yPos, tableWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    let xPos = startX;
    headers.forEach((header, index) => {
      doc.text(header, xPos + 8, yPos + 20);
      xPos += columnWidths[index];
    });

    yPos += 30;

    // === TABLE ROWS ===
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    filteredData.forEach((record, index) => {
      // Page break
      if (yPos > pageHeight - 80) {
        doc.addPage();
        
        // Continuation header
        doc.setFillColor(...colors.bgLight);
        doc.rect(0, 0, pageWidth, 60, 'F');
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 8, 'F');
        
        doc.setTextColor(...colors.text);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Attendance Report (Continued)', 40, 35);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.textLight);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 40, 35, { align: 'right' });

        yPos = 75;

        // Re-add table header
        doc.setFillColor(...colors.text);
        doc.rect(startX, yPos, tableWidth, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        
        xPos = startX;
        headers.forEach((header, idx) => {
          doc.text(header, xPos + 8, yPos + 20);
          xPos += columnWidths[idx];
        });

        yPos += 30;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }

      // Row background - subtle alternating
      if (index % 2 === 0) {
        doc.setFillColor(...colors.bgLight);
        doc.rect(startX, yPos, tableWidth, 28, 'F');
      }

      // Row border
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.line(startX, yPos + 28, startX + tableWidth, yPos + 28);

      xPos = startX;
      doc.setTextColor(...colors.text);

      const rowData = [
        record.name.length > 22 ? record.name.substring(0, 22) + '...' : record.name,
        record.department.length > 16 ? record.department.substring(0, 16) + '...' : record.department,
        record.clockIn,
        record.clockOut,
        record.workingHours,
        record.status.charAt(0).toUpperCase() + record.status.slice(1),
      ];

      rowData.forEach((cell, cellIndex) => {
        // Status badge styling
        if (cellIndex === 5) {
          const statusColors = {
            'Present': colors.success,
            'Absent': colors.danger,
            'Late': colors.warning
          };
          
          const statusColor = statusColors[cell] || colors.textLight;
          
          // Status badge background
          doc.setFillColor(...statusColor);
          const textWidth = doc.getTextWidth(cell);
          doc.roundedRect(xPos + 8, yPos + 8, textWidth + 12, 15, 3, 3, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text(cell, xPos + 14, yPos + 18);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
        } else {
          doc.setTextColor(...colors.text);
          doc.text(cell, xPos + 8, yPos + 18);
        }
        xPos += columnWidths[cellIndex];
      });

      yPos += 28;
    });

    // === PROFESSIONAL FOOTER ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer separator
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(40, pageHeight - 40, pageWidth - 40, pageHeight - 40);

      doc.setFontSize(8);
      doc.setTextColor(...colors.textLight);
      doc.setFont('helvetica', 'normal');
      
      // Left: Page number
      doc.text(`Page ${i} of ${pageCount}`, 40, pageHeight - 25);
      
      // Center: Confidential notice
      doc.text('CONFIDENTIAL DOCUMENT - For Internal Use Only', pageWidth / 2, pageHeight - 25, { align: 'center' });
      
      // Right: System name
      doc.text('WorkPulse Attendance System', pageWidth - 40, pageHeight - 25, { align: 'right' });
      
      // Bottom: Copyright
      doc.setFontSize(7);
      doc.text(`© ${new Date().getFullYear()} Colombo General Hospital. All rights reserved.`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    }

    // Save with professional filename
    const timestamp = currentDate.toISOString().split('T')[0];
    const filename = `CGH_Attendance_Report_${viewMode}_${timestamp}.pdf`;
    doc.save(filename);

  } catch (err) {
    console.error('Error generating PDF:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    alert(`Failed to generate PDF: ${err.message}`);
  } finally {
    setGeneratingPDF(false);
    setIsExportDropdownOpen(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Attendance Management
                </h1>
                <p className="text-gray-600 mt-2">Monitor and manage employee attendance records</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Period Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigatePeriod(-1)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={`Previous ${viewMode}`}
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg min-w-[200px] text-center">
                    <div className="text-sm font-medium text-blue-800">
                      {formatPeriodDisplay(viewMode, currentPeriod)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigatePeriod(1)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={`Next ${viewMode}`}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  <button
                    onClick={() => setCurrentPeriod(new Date())}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Go to current period"
                  >
                    Today
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['daily', 'weekly', 'monthly'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === mode
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Export Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    disabled={generatingPDF}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {generatingPDF ? 'Generating...' : 'Export'}
                  </button>
                  
                  {isExportDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={downloadDetailedPDF}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="font-medium text-gray-900">Download PDF</div>
                          <div className="text-xs text-gray-500">Detailed report</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-700 font-semibold">Loading attendance data...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{attendanceStats.totalEmployees}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Present</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{attendanceStats.present}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Absent</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{attendanceStats.absent}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Late</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{attendanceStats.late}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{attendanceStats.attendanceRate}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, employee ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Attendance - {formatPeriodDisplay(viewMode, currentPeriod)}
              </h2>
              <div className="text-sm text-gray-600">
                Showing {filteredData.length} records
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Working Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overtime
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
                {filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {record.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.name}</div>
                          <div className="text-sm text-gray-500">{record.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockIn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockOut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.workingHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.overtime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records Found</h3>
              <p className="text-gray-600">No attendance records match your current filters.</p>
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {isExportDropdownOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsExportDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default AttendanceManagement;