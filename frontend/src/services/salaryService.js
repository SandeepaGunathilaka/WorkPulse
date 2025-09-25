import api from './api';
import { jsPDF } from 'jspdf';

export const salaryService = {
  // Calculate salary for employee and month
  calculateSalary: async (employeeId, month, year) => {
    try {
      const response = await api.post('/salaries/calculate', {
        employeeId,
        month,
        year
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to calculate salary' };
    }
  },

  // Create/Save salary record
  createSalary: async (salaryData) => {
    try {
      const response = await api.post('/salaries', salaryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create salary record' };
    }
  },

  // Get all salary records (HR/Admin)
  getAllSalaries: async (params = {}) => {
    try {
      const response = await api.get('/salaries', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch salary records' };
    }
  },

  // Get employee's salary history
  getMySalaries: async (params = {}) => {
    try {
      const response = await api.get('/salaries/my-salaries', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch salary history' };
    }
  },

  // Get salary by ID
  getSalaryById: async (id) => {
    try {
      const response = await api.get(`/salaries/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch salary record' };
    }
  },

  // Update salary record
  updateSalary: async (id, salaryData) => {
    try {
      const response = await api.put(`/salaries/${id}`, salaryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update salary record' };
    }
  },

  // Delete salary record
  deleteSalary: async (id) => {
    try {
      const response = await api.delete(`/salaries/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete salary record' };
    }
  },

  // Approve salary record
  approveSalary: async (id) => {
    try {
      const response = await api.put(`/salaries/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve salary record' };
    }
  },

  // Generate PDF payslip
  generatePayslipPDF: async (salaryData) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPos = 20;

      // Helper function to draw table rows
      const drawTableRow = (startY, data, heights = [8], isHeader = false, borderStyle = 'full') => {
        const rowHeight = Math.max(...heights);
        const startX = 15;
        const tableWidth = pageWidth - 30;

        // Set font for header or normal row
        if (isHeader) {
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
        } else {
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
        }

        // Draw borders and fill cells
        let currentX = startX;
        data.forEach((cell, index) => {
          const cellWidth = cell.width || (tableWidth / data.length);

          // Draw cell border
          if (borderStyle === 'full' || borderStyle === 'horizontal') {
            doc.rect(currentX, startY, cellWidth, rowHeight);
          }

          // Add text
          if (cell.text) {
            const textY = startY + (rowHeight / 2) + 2;
            if (cell.align === 'center') {
              doc.text(cell.text, currentX + (cellWidth / 2), textY, { align: 'center' });
            } else if (cell.align === 'right') {
              doc.text(cell.text, currentX + cellWidth - 5, textY, { align: 'right' });
            } else {
              doc.text(cell.text, currentX + 3, textY);
            }
          }

          currentX += cellWidth;
        });

        return startY + rowHeight;
      };

      // Company Header
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Colombo General Hospital', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('123 Hospital Street, Colombo 07', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

     

      // Salary Slip Header with Month
      yPos = drawTableRow(yPos, [
        { text: 'Salary Slip For the month of', width: (pageWidth - 30) * 0.7 },
        { text: `${salaryData.month}-${salaryData.year}`, width: (pageWidth - 30) * 0.3, align: 'center' }
      ], [8], true);

      // Employee Information Header
      yPos = drawTableRow(yPos, [
        { text: 'Employee Information', width: pageWidth - 30, align: 'center' }
      ], [8], true);

      // Employee Details
      const colWidth = (pageWidth - 30) / 4;
      yPos = drawTableRow(yPos, [
        { text: 'UID:', width: colWidth },
        { text: salaryData.employeeInfo?.employeeId || 'N/A', width: colWidth },
        { text: 'Designation:', width: colWidth },
        { text: salaryData.employeeInfo?.designation || 'N/A', width: colWidth }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Name:', width: colWidth },
        { text: salaryData.employeeInfo?.name || 'N/A', width: colWidth },
        { text: 'EPF No:', width: colWidth },
        { text: salaryData.employeeInfo?.epfNo || 'N/A', width: colWidth }
      ], [8]);

      // Employee Attendance and Salary Transfer Headers
      yPos = drawTableRow(yPos, [
        { text: 'Employee Attendance', width: colWidth * 2, align: 'center' },
        { text: 'Salary Transferred To', width: colWidth * 2, align: 'center' }
      ], [8], true);

      // Attendance and Bank Details
      yPos = drawTableRow(yPos, [
        { text: 'Working Days:', width: colWidth },
        { text: (salaryData.attendance?.workingDays || 0).toString(), width: colWidth },
        { text: 'Bank Name:', width: colWidth },
        { text: salaryData.employeeInfo?.bankName || 'N/A', width: colWidth }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Overtime Hours:', width: colWidth },
        { text: (salaryData.attendance?.overtimeHours || 0).toString(), width: colWidth },
        { text: 'Account No:', width: colWidth },
        { text: salaryData.employeeInfo?.accountNo || 'N/A', width: colWidth }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Leave Allowed:', width: colWidth },
        { text: (salaryData.attendance?.leaveAllowed || 3).toString(), width: colWidth },
        { text: 'Branch Name:', width: colWidth },
        { text: salaryData.employeeInfo?.branchName || 'Main Branch', width: colWidth }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'No Pay Leave:', width: colWidth },
        { text: (salaryData.attendance?.noPayLeave || 0).toString(), width: colWidth },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Leave Taken:', width: colWidth },
        { text: (salaryData.attendance?.leaveTaken || 0).toString(), width: colWidth },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [8]);

      // Salary Calculations Header
      yPos = drawTableRow(yPos, [
        { text: 'Salary Calculations', width: colWidth * 2, align: 'center' },
        { text: 'Deductions', width: colWidth * 2, align: 'center' }
      ], [8], true);

      // Basic Salary and Deductions
      yPos = drawTableRow(yPos, [
        { text: 'Basic Salary', width: colWidth },
        { text: `LKR ${(salaryData.basicSalary || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: 'No Pay Days Deductions', width: colWidth },
        { text: `LKR ${(salaryData.deductions?.noPayDaysDeduction || 0).toLocaleString()}`, width: colWidth, align: 'right' }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: '', width: colWidth },
        { text: '', width: colWidth },
        { text: 'Salary Advance', width: colWidth },
        { text: `LKR ${(salaryData.deductions?.salaryAdvance || 0).toLocaleString()}`, width: colWidth, align: 'right' }
      ], [8]);

      // Allowances Header
      yPos = drawTableRow(yPos, [
        { text: 'Allowances:', width: colWidth },
        { text: '', width: colWidth },
        { text: 'EPF Employee Contribution', width: colWidth },
        { text: `8%`, width: colWidth / 2, align: 'center' },
        { text: `LKR ${Math.round((salaryData.basicSalary || 0) * 0.08).toLocaleString()}`, width: colWidth / 2, align: 'right' }
      ], [8]);

      // Individual Allowances
      const allowances = salaryData.allowances || {};
      yPos = drawTableRow(yPos, [
        { text: 'Cost of Living Allowance', width: colWidth },
        { text: `LKR ${(allowances.costOfLiving || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: 'APIT', width: colWidth },
        { text: `LKR ${(salaryData.deductions?.apit || 0).toLocaleString()}`, width: colWidth, align: 'right' }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Food Allowance', width: colWidth },
        { text: `LKR ${(allowances.food || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Conveyance Allowance', width: colWidth },
        { text: `LKR ${(allowances.conveyance || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: 'Total Deductions', width: colWidth },
        { text: `LKR ${(salaryData.deductions?.total || 0).toLocaleString()}`, width: colWidth, align: 'right' }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Medical Allowance', width: colWidth },
        { text: `LKR ${(allowances.medical || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Total Allowances', width: colWidth },
        { text: `LKR ${(allowances.total || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Gross Salary', width: colWidth },
        { text: `LKR ${(salaryData.grossSalary || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [8]);

      // Additional Perks and EPF Contributions
      yPos = drawTableRow(yPos, [
        { text: 'Additional Perks:', width: colWidth },
        { text: '', width: colWidth },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [8]);

      const additionalPerks = salaryData.additionalPerks || {};
      yPos = drawTableRow(yPos, [
        { text: 'Overtime', width: colWidth },
        { text: `LKR ${(additionalPerks.overtime || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: 'EPF Employer Contribution', width: colWidth },
        { text: `12%`, width: colWidth / 2, align: 'center' },
        { text: `LKR ${Math.round((salaryData.basicSalary || 0) * 0.12).toLocaleString()}`, width: colWidth / 2, align: 'right' }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Reimbursements', width: colWidth },
        { text: `LKR ${(additionalPerks.reimbursements || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: 'ETF Employer Contribution', width: colWidth },
        { text: `3%`, width: colWidth / 2, align: 'center' },
        { text: `LKR ${Math.round((salaryData.basicSalary || 0) * 0.03).toLocaleString()}`, width: colWidth / 2, align: 'right' }
      ], [8]);

      yPos = drawTableRow(yPos, [
        { text: 'Bonus', width: colWidth },
        { text: `LKR ${(additionalPerks.bonus || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [8]);

      // Final Calculation
      yPos = drawTableRow(yPos, [
        { text: 'Salary Before Deduction', width: colWidth },
        { text: `LKR ${(salaryData.salaryBeforeDeduction || salaryData.grossSalary || 0).toLocaleString()}`, width: colWidth, align: 'right' },
        { text: 'Net Payable Salary', width: colWidth },
        { text: `LKR ${(salaryData.netPayableSalary || 0).toLocaleString()}`, width: colWidth, align: 'right' }
      ], [8]);

      // Amount in Words
      yPos = drawTableRow(yPos, [
        { text: 'Amount in Words:', width: colWidth },
        { text: salaryData.amountInWords || `LKR ${(salaryData.netPayableSalary || 0).toLocaleString()} Only`, width: colWidth * 3 }
      ], [8]);

      yPos += 10;

      // Signatures
      yPos = drawTableRow(yPos, [
        { text: 'Prepared By:', width: colWidth },
        { text: '', width: colWidth },
        { text: 'Approved By:', width: colWidth },
        { text: '', width: colWidth }
      ], [20]);

      yPos = drawTableRow(yPos, [
        { text: 'Accountant', width: colWidth * 2, align: 'center' },
        { text: 'HR Manager', width: colWidth * 2, align: 'center' }
      ], [8]);

      // Save the PDF
      const fileName = `Payslip_${salaryData.employeeInfo?.name?.replace(/\s+/g, '_') || 'Employee'}_${salaryData.month}_${salaryData.year}.pdf`;
      doc.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw { message: 'Failed to generate payslip PDF' };
    }
  }
};