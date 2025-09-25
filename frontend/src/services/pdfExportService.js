import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const pdfExportService = {
  exportEmployeesToPDF: (employees, filters = {}, options = { includeStats: true, includeDetails: true }) => {
    const doc = new jsPDF();

    // Set up document properties
    doc.setProperties({
      title: 'WorkPulse Employee Report',
      subject: 'Employee Management Report',
      author: 'WorkPulse Hospital Management System',
      creator: 'WorkPulse'
    });

    // Header
    const pageWidth = doc.internal.pageSize.width;
    const logoY = 20;

    // Title Section
    doc.setFontSize(24);
    doc.setTextColor(30, 58, 138); // Blue color
    doc.text('WorkPulse', pageWidth / 2, logoY, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(75, 85, 99); // Gray color
    doc.text('Hospital Employee Management System', pageWidth / 2, logoY + 8, { align: 'center' });

    // Report Title
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39); // Dark gray
    doc.text('Employee Report', pageWidth / 2, logoY + 20, { align: 'center' });

    // Divider line
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.line(20, logoY + 25, pageWidth - 20, logoY + 25);

    // Report Details
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated on: ${currentDate}`, 20, logoY + 35);
    doc.text(`Total Employees: ${employees.length}`, pageWidth - 20, logoY + 35, { align: 'right' });

    // Filter Information
    let filterY = logoY + 45;
    if (Object.keys(filters).length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99);
      doc.text('Applied Filters:', 20, filterY);

      doc.setFontSize(10);
      filterY += 6;

      if (filters.department) {
        doc.text(`• Department: ${filters.department}`, 25, filterY);
        filterY += 5;
      }
      if (filters.role) {
        doc.text(`• Role: ${filters.role}`, 25, filterY);
        filterY += 5;
      }
      if (filters.status) {
        doc.text(`• Status: ${filters.status}`, 25, filterY);
        filterY += 5;
      }
      if (filters.search) {
        doc.text(`• Search: "${filters.search}"`, 25, filterY);
        filterY += 5;
      }

      filterY += 5;
    }

    // Statistics Section (only if enabled)
    if (options.includeStats) {
      const stats = {
        total: employees.length,
        active: employees.filter(emp => emp.employmentStatus === 'active').length,
        inactive: employees.filter(emp => emp.employmentStatus === 'inactive').length,
        onLeave: employees.filter(emp => emp.employmentStatus === 'on-leave').length,
        byRole: {}
      };

      // Count by role
      employees.forEach(emp => {
        stats.byRole[emp.role] = (stats.byRole[emp.role] || 0) + 1;
      });

      // Statistics Box
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(20, filterY, pageWidth - 40, 35, 3, 3, 'FD');

      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99);
      doc.text('Employee Statistics', 25, filterY + 8);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);

      // First row of stats
      const statsStartY = filterY + 15;
      doc.text(`Active: ${stats.active}`, 25, statsStartY);
      doc.text(`Inactive: ${stats.inactive}`, 70, statsStartY);
      doc.text(`On Leave: ${stats.onLeave}`, 115, statsStartY);

      // Second row - by role
      const rolesText = Object.entries(stats.byRole)
        .map(([role, count]) => `${role}: ${count}`)
        .join(' | ');
      doc.text(`By Role: ${rolesText}`, 25, statsStartY + 7);

      filterY += 45;
    } else {
      filterY += 10;
    }

    // Prepare table data
    const tableColumns = [
      { header: 'ID', dataKey: 'employeeId' },
      { header: 'Name', dataKey: 'name' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Department', dataKey: 'department' },
      { header: 'Role', dataKey: 'role' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Joining Date', dataKey: 'joiningDate' }
    ];

    const tableData = employees.map(employee => ({
      employeeId: employee.employeeId || 'N/A',
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      email: employee.email || 'N/A',
      department: employee.department || 'N/A',
      role: employee.role ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1) : 'N/A',
      status: employee.employmentStatus ?
        employee.employmentStatus.charAt(0).toUpperCase() + employee.employmentStatus.slice(1) : 'N/A',
      joiningDate: employee.joiningDate ?
        new Date(employee.joiningDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'N/A'
    }));

    // Generate table
    autoTable(doc, {
      columns: tableColumns,
      body: tableData,
      startY: filterY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [30, 58, 138], // Blue header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Light gray for alternate rows
      },
      columnStyles: {
        employeeId: { cellWidth: 25 },
        name: { cellWidth: 35 },
        email: { cellWidth: 40 },
        department: { cellWidth: 28 },
        role: { cellWidth: 18 },
        status: { cellWidth: 18 },
        joiningDate: { cellWidth: 30 }
      },
      margin: { left: 20, right: 20 },
      didDrawPage: function (data) {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);

        // Footer text
        doc.text(
          'WorkPulse Hospital Employee Management System - Confidential',
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );

        // Page number
        doc.text(
          `Page ${pageNumber} of ${pageCount}`,
          pageWidth - 20,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
    });

    // Save the PDF
    const fileName = `WorkPulse_Employee_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return fileName;
  },

  exportEmployeeDetailsPDF: (employee) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 58, 138);
    doc.text('WorkPulse', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(75, 85, 99);
    doc.text('Employee Details Report', pageWidth / 2, 35, { align: 'center' });

    // Divider
    doc.setDrawColor(209, 213, 219);
    doc.line(20, 40, pageWidth - 20, 40);

    // Employee Info
    let yPosition = 55;

    // Employee name and ID
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39);
    doc.text(`${employee.firstName} ${employee.lastName}`, 20, yPosition);

    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text(`Employee ID: ${employee.employeeId}`, 20, yPosition + 8);

    yPosition += 25;

    // Personal Information
    const sections = [
      {
        title: 'Personal Information',
        fields: [
          { label: 'Email', value: employee.email },
          { label: 'Phone', value: employee.phoneNumber },
          { label: 'Date of Birth', value: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A' },
          { label: 'Gender', value: employee.gender }
        ]
      },
      {
        title: 'Employment Information',
        fields: [
          { label: 'Department', value: employee.department },
          { label: 'Designation', value: employee.designation },
          { label: 'Role', value: employee.role },
          { label: 'Employment Status', value: employee.employmentStatus },
          { label: 'Joining Date', value: employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A' }
        ]
      }
    ];

    if (employee.address) {
      sections.push({
        title: 'Address Information',
        fields: [
          { label: 'Street', value: employee.address.street },
          { label: 'City', value: employee.address.city },
          { label: 'State', value: employee.address.state },
          { label: 'Zip Code', value: employee.address.zipCode },
          { label: 'Country', value: employee.address.country }
        ]
      });
    }

    if (employee.emergencyContact) {
      sections.push({
        title: 'Emergency Contact',
        fields: [
          { label: 'Name', value: employee.emergencyContact.name },
          { label: 'Relationship', value: employee.emergencyContact.relationship },
          { label: 'Phone', value: employee.emergencyContact.phoneNumber }
        ]
      });
    }

    // Render sections
    sections.forEach(section => {
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text(section.title, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);

      section.fields.forEach(field => {
        if (field.value) {
          doc.text(`${field.label}:`, 25, yPosition);
          doc.setTextColor(17, 24, 39);
          doc.text(field.value, 70, yPosition);
          doc.setTextColor(75, 85, 99);
          yPosition += 6;
        }
      });

      yPosition += 10;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })} - WorkPulse Hospital Management System`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    // Save
    const fileName = `Employee_${employee.employeeId}_Details_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return fileName;
  }
};

export default pdfExportService;