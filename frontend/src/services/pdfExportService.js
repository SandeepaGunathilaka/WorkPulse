import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const pdfExportService = {
  exportEmployeesToPDF: async (employees, filters = {}, options = { includeStats: true, includeDetails: true }) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 40;

    // Load logo from public folder
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

    // === PROFESSIONAL HEADER ===
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

    // Report Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Employee Management Report', 30, yPos);
    yPos += 30;

    // Report Details
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${currentDate}`, 30, yPos);
    doc.text(`Total Employees: ${employees.length}`, pageWidth - 30, yPos, { align: 'right' });
    yPos += 20;

    // Filter Information
    if (Object.keys(filters).length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Applied Filters:', 30, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(75, 85, 99);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          const filterLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          doc.text(`${filterLabel}: ${value}`, 30, yPos);
          yPos += 12;
        }
      });
      yPos += 10;
    }

    // Statistics Section
    if (options.includeStats) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Summary Statistics', 30, yPos);
      yPos += 20;

      // Calculate statistics
      const activeEmployees = employees.filter(emp => emp.employmentStatus === 'active').length;
      const inactiveEmployees = employees.filter(emp => emp.employmentStatus === 'inactive').length;
      const departments = [...new Set(employees.map(emp => emp.department))].length;

      // Create statistics table
      const statsData = [
        ['Total Employees', employees.length.toString()],
        ['Active Employees', activeEmployees.toString()],
        ['Inactive Employees', inactiveEmployees.toString()],
        ['Departments', departments.toString()]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Count']],
        body: statsData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [17, 24, 39]
        },
        margin: { left: 30, right: 30 },
        styles: { fontSize: 10 }
      });

      yPos = doc.lastAutoTable.finalY + 20;
    }

    // Employee Table
    if (options.includeDetails && employees.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Employee Details', 30, yPos);
      yPos += 20;

      // Prepare table data
      const tableData = employees.map(employee => [
        employee.employeeId || 'N/A',
        `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        employee.email || 'N/A',
        employee.department || 'N/A',
        employee.designation || 'N/A',
        employee.role || 'N/A',
        employee.employmentStatus || 'N/A',
        employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Name', 'Email', 'Department', 'Designation', 'Role', 'Status', 'Joining Date']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [17, 24, 39],
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 60 }, // ID
          1: { cellWidth: 80 }, // Name
          2: { cellWidth: 100 }, // Email
          3: { cellWidth: 70 }, // Department
          4: { cellWidth: 80 }, // Designation
          5: { cellWidth: 50 }, // Role
          6: { cellWidth: 50 }, // Status
          7: { cellWidth: 60 }  // Joining Date
        },
        margin: { left: 30, right: 30 },
        didDrawPage: function (data) {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);

          // Footer text
          doc.text(
            'Colombo General Hospital - Employee Management System - Confidential',
            pageWidth / 2,
            pageHeight - 20,
            { align: 'center' }
          );

          // Page number
          doc.text(
            `Page ${pageNumber} of ${pageCount}`,
            pageWidth - 30,
            pageHeight - 20,
            { align: 'right' }
          );
        }
      });
    }

    // Save the PDF
    const fileName = `CGH_Employee_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return fileName;
  },

  exportEmployeeDetailsPDF: async (employee) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 40;
  
    // Load logo from public folder
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
  
    const logoDataUrl = await loadImageAsDataURL('/Logo.png');
    if (logoDataUrl) {
      const logoWidth = 130;
      const logoHeight = 55;
      doc.addImage(logoDataUrl, 'PNG', 30, yPos - 10, logoWidth, logoHeight);
    }
  
    // Header text
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
  
    // Report Title
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39);
    doc.text('Employee Details Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 25;
  
    // Basic Info Table
    const basicInfoData = [
      ['Employee Name', `${employee.firstName} ${employee.lastName}`],
      ['Employee ID', employee.employeeId],
      ['Email', employee.email],
      ['Phone', employee.phoneNumber],
      ['Date of Birth', employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'N/A'],
      ['Gender', employee.gender || 'N/A']
    ];
  
    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: basicInfoData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 30, right: 30 }
    });
  
    yPos = doc.lastAutoTable.finalY + 15;
  
    // Employment Info Table
    const employmentData = [
      ['Department', employee.department || 'N/A'],
      ['Designation', employee.designation || 'N/A'],
      ['Role', employee.role || 'N/A'],
      ['Employment Status', employee.employmentStatus || 'N/A'],
      ['Joining Date', employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A']
    ];
  
    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: employmentData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 30, right: 30 }
    });
  
    yPos = doc.lastAutoTable.finalY + 15;
  
    // Address Info Table (if available)
    if (employee.address) {
      const addressData = [
        ['Street', employee.address.street || 'N/A'],
        ['City', employee.address.city || 'N/A'],
        ['State', employee.address.state || 'N/A'],
        ['Zip Code', employee.address.zipCode || 'N/A'],
        ['Country', employee.address.country || 'N/A']
      ];
  
      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: addressData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 30, right: 30 }
      });
  
      yPos = doc.lastAutoTable.finalY + 15;
    }
  
    // Emergency Contact Table (if available)
    if (employee.emergencyContact) {
      const emergencyData = [
        ['Name', employee.emergencyContact.name || 'N/A'],
        ['Relationship', employee.emergencyContact.relationship || 'N/A'],
        ['Phone', employee.emergencyContact.phoneNumber || 'N/A']
      ];
  
      autoTable(doc, {
        startY: yPos,
        head: [['Field', 'Value']],
        body: emergencyData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 30, right: 30 }
      });
  
      yPos = doc.lastAutoTable.finalY + 15;
    }
  
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - WorkPulse Hospital Management System`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  
    const fileName = `Employee_${employee.employeeId}_Details_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    return fileName;
  },

  exportLeaveReportToPDF: async (leaveRequests, filters = {}, options = { includeStats: true }) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 40;

    // Load logo from public folder
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

    // === PROFESSIONAL HEADER ===
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

    // Report Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Leave Management Report', 30, yPos);
    yPos += 30;

    // Report Details
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${currentDate}`, 30, yPos);
    doc.text(`Total Leave Requests: ${leaveRequests.length}`, pageWidth - 30, yPos, { align: 'right' });
    yPos += 20;

    // Filter Information
    if (Object.keys(filters).length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Applied Filters:', 30, yPos);
      yPos += 15;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(75, 85, 99);

      if (filters.status) {
        doc.text(`• Status: ${filters.status}`, 30, yPos);
        yPos += 12;
      }
      if (filters.type) {
        doc.text(`• Leave Type: ${filters.type}`, 30, yPos);
        yPos += 12;
      }
      if (filters.department) {
        doc.text(`• Department: ${filters.department}`, 30, yPos);
        yPos += 12;
      }
      if (filters.dateRange) {
        doc.text(`• Date Range: ${filters.dateRange}`, 30, yPos);
        yPos += 12;
      }

      yPos += 10;
    }

    // Statistics Section (only if enabled)
    if (options.includeStats) {
      const stats = {
        total: leaveRequests.length,
        pending: leaveRequests.filter(leave => leave.status === 'pending').length,
        approved: leaveRequests.filter(leave => leave.status === 'approved').length,
        rejected: leaveRequests.filter(leave => leave.status === 'rejected').length,
        byType: {}
      };

      // Count by leave type
      leaveRequests.forEach(leave => {
        stats.byType[leave.type] = (stats.byType[leave.type] || 0) + 1;
      });

      // Statistics Section Title
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Summary Statistics', 30, yPos);
      yPos += 20;

      // Statistics Table
      const statsData = [
        ['Total Requests', stats.total.toString()],
        ['Pending', stats.pending.toString()],
        ['Approved', stats.approved.toString()],
        ['Rejected', stats.rejected.toString()]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Count']],
        body: statsData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          textColor: [17, 24, 39],
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: 'bold' },
          1: { cellWidth: 80, halign: 'center' }
        },
        margin: { left: 30, right: 30 },
        styles: {
          fontSize: 9,
          cellPadding: 6
        }
      });

      yPos = doc.lastAutoTable.finalY + 20;

      // Leave Type Breakdown
      if (Object.keys(stats.byType).length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Leave Type Breakdown', 30, yPos);
        yPos += 20;

        const typeData = Object.entries(stats.byType).map(([type, count]) => [
          type.charAt(0).toUpperCase() + type.slice(1),
          count.toString()
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Leave Type', 'Count']],
          body: typeData,
          theme: 'grid',
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
          },
          bodyStyles: {
            textColor: [17, 24, 39],
            fontSize: 9
          },
          columnStyles: {
            0: { cellWidth: 120, fontStyle: 'bold' },
            1: { cellWidth: 80, halign: 'center' }
          },
          margin: { left: 30, right: 30 },
          styles: {
            fontSize: 9,
            cellPadding: 6
          }
        });

        yPos = doc.lastAutoTable.finalY + 20;
      }
    }

    // Leave Requests Table
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Leave Requests Details', 30, yPos);
    yPos += 20;

    // Prepare table data
    const tableData = leaveRequests.map(leave => [
      `${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.trim() || 'N/A',
      leave.employee?.department || leave.department || 'General',
      leave.type ? leave.type.charAt(0).toUpperCase() + leave.type.slice(1) : 'N/A',
      leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'N/A',
      leave.endDate ? new Date(leave.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'N/A',
      leave.totalDays || 0,
      leave.status ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1) : 'N/A',
      leave.appliedDate ? new Date(leave.appliedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
      }) : 'N/A',
      leave.reason || 'No reason provided'
    ]);

    // Generate table
    autoTable(doc, {
      startY: yPos,
      head: [['Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied Date', 'Reason']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        textColor: [17, 24, 39],
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 80 }, // Employee Name
        1: { cellWidth: 60 }, // Department
        2: { cellWidth: 50 }, // Leave Type
        3: { cellWidth: 60 }, // Start Date
        4: { cellWidth: 60 }, // End Date
        5: { cellWidth: 30 }, // Days
        6: { cellWidth: 50 }, // Status
        7: { cellWidth: 60 }, // Applied Date
        8: { cellWidth: 80 }  // Reason
      },
      margin: { left: 30, right: 30 },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: 'linebreak'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: function (data) {
        // Professional Footer
        const pageCount = doc.internal.getNumberOfPages();
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

        // Footer divider
        doc.setDrawColor(59, 130, 246);
        doc.setFillColor(59, 130, 246);
        doc.rect(30, pageHeight - 40, pageWidth - 60, 1, 'F');

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);

        // Confidentiality notice
        doc.text(
          'This document contains confidential information. Unauthorized distribution is prohibited.',
          pageWidth / 2,
          pageHeight - 25,
          { align: 'center' }
        );

        // Page number
        doc.text(
          `Page ${pageNumber} of ${pageCount}`,
          pageWidth - 30,
          pageHeight - 10,
          { align: 'right' }
        );

        // Generation timestamp
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          30,
          pageHeight - 10
        );
      }
    });

    // Save the PDF
    const fileName = `Leave_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return fileName;
  }
};

export default pdfExportService;