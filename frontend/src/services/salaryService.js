import api from './api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // Generate PDF payslip (modern template with logo)
  generatePayslipPDF: async (salaryData) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 40;

      // Load logo from public folder
      const loadImageAsDataURL = (src) => {
        return new Promise((resolve, reject) => {
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

      // Helper function to draw bordered table rows (matching the image style)
      const drawBorderedRow = (startY, data, heights = [20], isHeader = false, fillColor = null) => {
        const rowHeight = Math.max(...heights);
        const startX = 30;
        const tableWidth = pageWidth - 60;

        // Set font
        if (isHeader) {
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
        } else {
          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
        }

        // Fill background if specified
        if (fillColor) {
          doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
          doc.rect(startX, startY, tableWidth, rowHeight, 'F');
        }

        // Draw borders
        doc.setDrawColor(0);
        doc.rect(startX, startY, tableWidth, rowHeight);

        // Draw vertical separators and add text
        let currentX = startX;
        data.forEach((cell, index) => {
          const cellWidth = cell.width || (tableWidth / data.length);
          
          // Draw vertical separator (except for last cell)
          if (index < data.length - 1) {
            doc.line(currentX + cellWidth, startY, currentX + cellWidth, startY + rowHeight);
          }

          // Add text
          if (cell.text) {
            const textY = startY + (rowHeight / 2) + 2.5;
            if (cell.align === 'center') {
              doc.text(cell.text, currentX + (cellWidth / 2), textY, { align: 'center' });
            } else if (cell.align === 'right') {
              doc.text(cell.text, currentX + cellWidth - 8, textY, { align: 'right' });
            } else {
              doc.text(cell.text, currentX + 8, textY);
            }
          }

          currentX += cellWidth;
        });

        return startY + rowHeight;
      };

      // Helper function to draw two-column section with label/value structure
      const drawTwoColumnSection = (startY, leftData, rightData, sectionHeight = 20) => {
        const startX = 30;
        const sectionWidth = (pageWidth - 60) / 2;
        const leftX = startX;
        const rightX = startX + sectionWidth;
        const maxRows = Math.max(leftData.length, rightData.length);
        
        // Set font
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        // Draw all rows
        for (let i = 0; i < maxRows; i++) {
          const leftRow = leftData[i];
          const rightRow = rightData[i];
          const rowY = startY + (i * sectionHeight);
          const rowHeight = sectionHeight;
          
          // Draw borders for both columns
          doc.setDrawColor(0);
          doc.rect(leftX, rowY, sectionWidth, rowHeight);
          doc.rect(rightX, rowY, sectionWidth, rowHeight);
          
          // Draw left column content (label and value)
          if (leftRow && (leftRow.label || leftRow.value)) {
            if (leftRow.isBold) {
              doc.setFont(undefined, 'bold');
            }
            
            const textY = rowY + (rowHeight / 2) + 2.5;
            
            // Draw label
            if (leftRow.label) {
              doc.text(leftRow.label, leftX + 8, textY);
            }
            
            // Draw value (right-aligned)
            if (leftRow.value) {
              doc.text(leftRow.value, leftX + sectionWidth - 8, textY, { align: 'right' });
            }
            
            if (leftRow.isBold) {
              doc.setFont(undefined, 'normal');
            }
          }
          
          // Draw right column content (label and value)
          if (rightRow && (rightRow.label || rightRow.value)) {
            if (rightRow.isBold) {
              doc.setFont(undefined, 'bold');
            }
            
            const textY = rowY + (rowHeight / 2) + 2.5;
            
            // Draw label
            if (rightRow.label) {
              doc.text(rightRow.label, rightX + 8, textY);
            }
            
            // Draw value (right-aligned)
            if (rightRow.value) {
              doc.text(rightRow.value, rightX + sectionWidth - 8, textY, { align: 'right' });
            }
            
            if (rightRow.isBold) {
              doc.setFont(undefined, 'normal');
            }
          }
        }
        
        // Draw vertical separator between columns
        doc.setDrawColor(0);
        doc.line(rightX, startY, rightX, startY + (maxRows * sectionHeight));
        
        return startY + (maxRows * sectionHeight);
      };

      // Format currency
      const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

      // Convert number to words
      const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const thousands = ['', 'Thousand', 'Million', 'Billion'];

        if (num === 0) return 'Zero';

        const convertHundreds = (n) => {
          let result = '';
          if (n > 99) {
            result += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
          }
          if (n > 19) {
            result += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
          } else if (n > 9) {
            result += teens[n - 10] + ' ';
            return result;
          }
          if (n > 0) {
            result += ones[n] + ' ';
          }
          return result;
        };

        let result = '';
        let thousandIndex = 0;

        while (num > 0) {
          if (num % 1000 !== 0) {
            result = convertHundreds(num % 1000) + thousands[thousandIndex] + ' ' + result;
          }
          num = Math.floor(num / 1000);
          thousandIndex++;
        }

        return result.trim();
      };

      // Company Header with Logo
      const logoDataUrl = await loadImageAsDataURL('/Logo.png');
      if (logoDataUrl) {
        const logoWidth = 130; // increase length only
        const logoHeight = 55; // keep height consistent for a slim header
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
      yPos += 22;

      // Title and period badge
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Salary Slip', 30, yPos);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const periodText = `${salaryData.month} ${salaryData.year}`;
      const badgeWidth = doc.getTextWidth(periodText) + 20;
      const badgeX = pageWidth - 30 - badgeWidth;
      const badgeY = yPos - 14;
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(badgeX, badgeY, badgeWidth, 24, 6, 6, 'F');
      doc.setTextColor(55, 65, 81);
      doc.text(periodText, badgeX + badgeWidth / 2, badgeY + 16, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 22;

      // Employee Information Section
      const colWidth = (pageWidth - 60) / 4;
      yPos = drawBorderedRow(yPos, [
        { text: 'Employee Information', width: pageWidth - 60, align: 'center' }
      ], [22], true, [200, 230, 200]); // Light green background

      yPos = drawBorderedRow(yPos, [
        { text: 'UID:', width: colWidth },
        { text: salaryData.employeeInfo?.employeeId || 'N/A', width: colWidth },
        { text: 'Designation:', width: colWidth },
        { text: salaryData.employeeInfo?.designation || 'N/A', width: colWidth }
      ], [20]);

      yPos = drawBorderedRow(yPos, [
        { text: 'Name:', width: colWidth },
        { text: salaryData.employeeInfo?.name || 'N/A', width: colWidth },
        { text: 'EPF No:', width: colWidth },
        { text: salaryData.employeeInfo?.epfNo || 'N/A', width: colWidth }
      ], [20]);

      // Employee Attendance & Salary Transferred To Section
      yPos = drawBorderedRow(yPos, [
        { text: 'Employee Attendance', width: colWidth * 2, align: 'center' },
        { text: 'Salary Transferred To', width: colWidth * 2, align: 'center' }
      ], [16], true, [200, 230, 200]);

      yPos = drawBorderedRow(yPos, [
        { text: 'Working Days:', width: colWidth },
        { text: (salaryData.attendance?.workingDays || 0).toString(), width: colWidth },
        { text: 'Bank Name:', width: colWidth },
        { text: salaryData.employeeInfo?.bankName || 'N/A', width: colWidth }
      ], [20]);

      yPos = drawBorderedRow(yPos, [
        { text: 'Overtime Hours:', width: colWidth },
        { text: (salaryData.attendance?.overtimeHours || 0).toString(), width: colWidth },
        { text: 'Account No:', width: colWidth },
        { text: salaryData.employeeInfo?.accountNo || 'N/A', width: colWidth }
      ], [20]);

      yPos = drawBorderedRow(yPos, [
        { text: 'Leave Allowed:', width: colWidth },
        { text: (salaryData.attendance?.leaveAllowed || 3).toString(), width: colWidth },
        { text: 'Branch Name:', width: colWidth },
        { text: salaryData.employeeInfo?.branchName || 'Main Branch', width: colWidth }
      ], [20]);

      yPos = drawBorderedRow(yPos, [
        { text: 'No Pay Leave:', width: colWidth },
        { text: (salaryData.attendance?.noPayLeave || 0).toString(), width: colWidth },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [20]);

      yPos = drawBorderedRow(yPos, [
        { text: 'Leave Taken:', width: colWidth },
        { text: (salaryData.attendance?.leaveTaken || 0).toString(), width: colWidth },
        { text: '', width: colWidth },
        { text: '', width: colWidth }
      ], [20]);

      // Salary Calculations Section Header
      yPos = drawBorderedRow(yPos, [
        { text: 'Salary Calculations', width: pageWidth - 60, align: 'center' }
      ], [16], true, [200, 230, 200]);

      // Prepare data for two-column layout
      const allowances = salaryData.allowances || {};
      const additionalPerks = salaryData.additionalPerks || {};
      const totalAllowances = (allowances.costOfLiving || 0) + (allowances.food || 0) + (allowances.conveyance || 0) + (allowances.medical || 0);
      const grossSalary = (salaryData.basicSalary || 0) + totalAllowances;
      const epfEmployee = Math.round((salaryData.basicSalary || 0) * 0.08);
      const totalDeductions = (salaryData.deductions?.noPayDaysDeduction || 0) + (salaryData.deductions?.salaryAdvance || 0) + epfEmployee + (salaryData.deductions?.apit || 0);
      const salaryBeforeDeduction = grossSalary + (additionalPerks.overtime || 0) + (additionalPerks.reimbursements || 0) + (additionalPerks.bonus || 0);
      const netPayableSalary = salaryBeforeDeduction - totalDeductions;

      // Left column (Earnings/Income) - Each row has both label and value
      const leftColumnData = [
        { label: 'Basic Salary', value: formatLKR(salaryData.basicSalary || 0), isBold: false },
        { label: '', value: '', isBold: false }, // Empty row for spacing between Basic Salary and Allowances
        { label: 'Allowances:', value: '', isBold: true },
        { label: 'Cost of Living Allowance', value: formatLKR(allowances.costOfLiving || 0), isBold: false },
        { label: 'Food Allowance', value: formatLKR(allowances.food || 0), isBold: false },
        { label: 'Conveyance Allowance', value: formatLKR(allowances.conveyance || 0), isBold: false },
        { label: 'Medical Allowance', value: formatLKR(allowances.medical || 0), isBold: false },
        { label: 'Total Allowances', value: formatLKR(totalAllowances), isBold: true },
        { label: 'Gross Salary', value: formatLKR(grossSalary), isBold: true },
        { label: 'Additional Perks:', value: '', isBold: true },
        { label: 'Overtime', value: formatLKR(additionalPerks.overtime || 0), isBold: false },
        { label: 'Reimbursements', value: formatLKR(additionalPerks.reimbursements || 0), isBold: false },
        { label: 'Bonus', value: formatLKR(additionalPerks.bonus || 0), isBold: false },
        { label: 'Salary Before Deduction', value: formatLKR(salaryBeforeDeduction), isBold: true }
      ];

      // Right column (Deductions and Employer Contributions) - Each row has both label and value
      const rightColumnData = [
        { label: 'Deductions', value: '', isBold: true },
        { label: 'No Pay Days Deductions', value: formatLKR(salaryData.deductions?.noPayDaysDeduction || 0), isBold: false },
        { label: 'Salary Advance', value: formatLKR(salaryData.deductions?.salaryAdvance || 0), isBold: false },
        { label: 'EPF Employee Contribution (8%)', value: formatLKR(epfEmployee), isBold: false },
        { label: 'APIT', value: formatLKR(salaryData.deductions?.apit || 0), isBold: false },
        { label: 'Total Deductions', value: formatLKR(totalDeductions), isBold: true },
        { label: '', value: '', isBold: false }, // Empty row for spacing
        { label: 'EPF Employer Contribution (12%)', value: formatLKR(Math.round((salaryData.basicSalary || 0) * 0.12)), isBold: false },
        { label: 'ETF Employer Contribution (3%)', value: formatLKR(Math.round((salaryData.basicSalary || 0) * 0.03)), isBold: false },
        { label: '', value: '', isBold: false }, // Empty row for spacing
        { label: '', value: '', isBold: false }, // Empty row for spacing
        { label: '', value: '', isBold: false }, // Empty row for spacing
        { label: '', value: '', isBold: false }, // Empty row to align Net Payable Salary with Salary Before Deduction
        { label: 'Net Payable Salary', value: formatLKR(netPayableSalary), isBold: true }  // Net salary aligned with Salary Before Deduction
      ];

      // Draw two-column section (includes Net Payable Salary aligned with Salary Before Deduction)
      yPos = drawTwoColumnSection(yPos, leftColumnData, rightColumnData, 20);

      // Amount in Words - Full width section with proper formatting
      yPos += 15; // Add spacing before amount in words
      const amountInWordsLabel = 'Amount in Words:';
      const amountInWordsValue = `LKR ${numberToWords(Math.floor(netPayableSalary))} Only`;
      
      // Draw amount in words section with border
      const wordsBoxX = 30;
      const wordsBoxW = pageWidth - 60;
      const wordsBoxH = 30;
      
      doc.setDrawColor(0);
      doc.rect(wordsBoxX, yPos, wordsBoxW, wordsBoxH);
      
      // Add label and value on the same line with proper spacing
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(amountInWordsLabel, wordsBoxX + 10, yPos + 18);
      
      doc.setFont(undefined, 'normal');
      const labelWidth = doc.getTextWidth(amountInWordsLabel);
      doc.text(amountInWordsValue, wordsBoxX + 10 + labelWidth + 10, yPos + 18);
      
      yPos += wordsBoxH + 25; // Add spacing after amount in words

      // Signatures - Separated from salary calculations
      yPos += 20; // Additional spacing to separate from amount in words
      
      yPos = drawBorderedRow(yPos, [
        { text: 'Prepared By:', width: colWidth },
        { text: '', width: colWidth },
        { text: 'Approved By:', width: colWidth },
        { text: '', width: colWidth }
      ], [25]);

      yPos = drawBorderedRow(yPos, [
        { text: 'Accountant', width: colWidth * 2, align: 'center' },
        { text: 'HR Manager', width: colWidth * 2, align: 'center' }
      ], [20]);

      // Footer note
      const footerY = pageHeight - 30;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text('This is a computer-generated document. No signature is required.', pageWidth / 2, footerY, { align: 'center' });

      // Save the PDF
      const fileName = `Payslip_${salaryData.employeeInfo?.name?.replace(/\s+/g, '_') || 'Employee'}_${salaryData.month}_${salaryData.year}.pdf`;
      doc.save(fileName);

      return { success: true, fileName };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw { message: 'Failed to generate payslip PDF' };
    }
  },

  // Generate Salary Management Report PDF
  generateSalaryManagementPDF: async (salaryData, filters) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 40;

      // Load logo
      const loadImageAsDataURL = (src) => {
        return new Promise((resolve) => {
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
      };

      const formatLKR = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

      // === HEADER ===
      const logoDataUrl = await loadImageAsDataURL('/Logo.png');
      if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', 30, yPos - 10, 130, 55);

      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Colombo General Hospital', pageWidth - 30, yPos + 10, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('123 Hospital Street, Colombo 07', pageWidth - 30, yPos + 28, { align: 'right' });
      doc.text('Tel: +94 11 123 4567 | Email: info@cgh.lk', pageWidth - 30, yPos + 44, { align: 'right' });
      yPos += 75;

      // Divider
      doc.setDrawColor(59, 130, 246);
      doc.setFillColor(59, 130, 246);
      doc.rect(30, yPos, pageWidth - 60, 3, 'F');
      yPos += 25;

      // Report Title and Period
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Salary Management', 30, yPos);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const periodText = `${filters.month || 'All months'} ${filters.year}`;
      const badgeWidth = doc.getTextWidth(periodText) + 20;
      const badgeX = pageWidth - 30 - badgeWidth;
      const badgeY = yPos - 14;
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(badgeX, badgeY, badgeWidth, 24, 6, 6, 'F');
      doc.setTextColor(55, 65, 81);
      doc.text(periodText, badgeX + badgeWidth / 2, badgeY + 16, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 40;

      // Salary Records Table
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Employee Salary Records', pageWidth / 2, yPos, { align: 'center' });
      doc.setDrawColor(147, 197, 253);
      doc.line(pageWidth / 2 - 80, yPos + 5, pageWidth / 2 + 80, yPos + 5);
      yPos += 20;

      const tableData = salaryData.map(salary => [
        salary.employeeId || 'N/A',
        salary.employeeName || 'N/A',
        salary.department || 'N/A',
        `${salary.month || 'N/A'} ${salary.year || 'N/A'}`,
        formatLKR(salary.basicSalary || 0),
        formatLKR(salary.netPayableSalary || 0),
        salary.status || 'N/A',
        salary.preparedByName || 'N/A'
      ]);

      autoTable(doc, {
        head: [['Employee ID', 'Name', 'Department', 'Period', 'Basic Salary', 'Net Salary', 'Status', 'Prepared By']],
        body: tableData,
        startY: yPos,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 6,
          halign: 'center',
          valign: 'middle',
          lineColor: [209, 213, 219],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [147, 197, 253],
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 8,
          lineColor: [147, 197, 253],
          lineWidth: 0.8,
        },
        bodyStyles: { textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 30, right: 30 },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 60 }, // Employee ID
          1: { cellWidth: 80 }, // Name
          2: { cellWidth: 60 }, // Department
          3: { cellWidth: 60 }, // Period
          4: { cellWidth: 70 }, // Basic Salary
          5: { cellWidth: 70 }, // Net Salary
          6: { cellWidth: 50 }, // Status
          7: { cellWidth: 70 }, // Prepared By
        }
      });

      yPos = doc.lastAutoTable.finalY + 30;

      // Calculate summary statistics
      const totalPayroll = salaryData.reduce((sum, salary) => sum + (salary.netPayableSalary || 0), 0);
      const totalRecords = salaryData.length;
      const averageSalary = totalRecords > 0 ? totalPayroll / totalRecords : 0;
      const paidCount = salaryData.filter(sal => sal.status === 'paid').length;
      const pendingCount = salaryData.filter(sal => sal.status === 'draft' || sal.status === 'approved').length;
      const minSalary = salaryData.length > 0 ? Math.min(...salaryData.map(sal => sal.netPayableSalary || 0)) : 0;
      const maxSalary = salaryData.length > 0 ? Math.max(...salaryData.map(sal => sal.netPayableSalary || 0)) : 0;

      // Summary Box
      const summaryBoxHeight = 100;
      const summaryBoxY = yPos - 10;

      doc.setFillColor(247, 249, 252);
      doc.roundedRect(42, summaryBoxY + 2, pageWidth - 84, summaryBoxHeight, 10, 10, 'F');
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(40, summaryBoxY, pageWidth - 80, summaryBoxHeight, 10, 10, 'S');

      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Summary Statistics', pageWidth / 2, yPos + 12, { align: 'center' });
      yPos += 25;

      const leftX = 70;
      const rightX = pageWidth / 2 + 30;
      let lineY = yPos + 5;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(55, 65, 81);

      // Left column
      doc.circle(leftX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Total Payroll: ${formatLKR(totalPayroll)}`, leftX, lineY);
      lineY += 16;

      doc.circle(leftX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Average Salary: ${formatLKR(Math.round(averageSalary))}`, leftX, lineY);
      lineY += 16;

      doc.circle(leftX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Total Records: ${totalRecords}`, leftX, lineY);

      // Right column
      lineY = yPos + 5;
      doc.circle(rightX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Paid: ${paidCount} | Pending: ${pendingCount}`, rightX, lineY);
      lineY += 16;

      doc.circle(rightX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Salary Range: ${formatLKR(minSalary)} - ${formatLKR(maxSalary)}`, rightX, lineY);

      yPos = summaryBoxY + summaryBoxHeight + 30;

      // Timestamp
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Report generated on: ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        pageWidth / 2,
        yPos,
        { align: 'center' }
      );

      // Footer
      doc.setDrawColor(229, 231, 235);
      doc.line(40, pageHeight - 50, pageWidth - 40, pageHeight - 50);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        'This is a computer-generated report. WorkPulse Hospital Management System.',
        pageWidth / 2,
        pageHeight - 30,
        { align: 'center' }
      );

      const fileName = `Salary_Management_Report_${filters.month || 'all'}_${filters.year}.pdf`;
      doc.save(fileName);
      return { success: true, fileName };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw { message: 'Failed to generate salary management report PDF' };
    }
  }
};