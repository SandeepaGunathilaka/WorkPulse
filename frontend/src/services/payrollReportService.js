import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const payrollReportService = {
  // Generate Payroll Distribution Report PDF
  generatePayrollDistributionPDF: async (reportData, filters) => {
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
      doc.text('Payroll Distribution Report', 30, yPos);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const periodText = `${filters.month} ${filters.year}`;
      const badgeWidth = doc.getTextWidth(periodText) + 20;
      const badgeX = pageWidth - 30 - badgeWidth;
      const badgeY = yPos - 14;
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(badgeX, badgeY, badgeWidth, 24, 6, 6, 'F');
      doc.setTextColor(55, 65, 81);
      doc.text(periodText, badgeX + badgeWidth / 2, badgeY + 16, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 40;

      const tableWidth = 500;
      const tableX = (pageWidth - tableWidth) / 2;

      // === Department Breakdown ===
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Department Breakdown', pageWidth / 2, yPos, { align: 'center' });
      doc.setDrawColor(147, 197, 253);
      doc.line(pageWidth / 2 - 60, yPos + 5, pageWidth / 2 + 60, yPos + 5);
      yPos += 20;

      const departmentData =
        reportData.departmentBreakdown?.map((dept) => [
          dept.department || 'N/A',
          dept.employeeCount || 0,
          formatLKR(dept.totalSalary || 0),
          formatLKR(dept.averageSalary || 0)
        ]) || [];

      autoTable(doc, {
        head: [['Department', 'Employee Count', 'Total Salary', 'Average Salary']],
        body: departmentData,
        startY: yPos,
        theme: 'grid',
        tableWidth,
        styles: {
          fontSize: 9,
          cellPadding: 8,
          halign: 'center',
          valign: 'middle',
          lineColor: [209, 213, 219], // Light gray border
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [147, 197, 253], // Blue header
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 10,
          lineColor: [147, 197, 253], // Keep themed header border
          lineWidth: 0.8,
        },
        bodyStyles: { textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: tableX, right: tableX },
      });

      yPos = doc.lastAutoTable.finalY + 40;

      // === Salary Range Distribution ===
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Salary Range Distribution', pageWidth / 2, yPos, { align: 'center' });
      doc.setDrawColor(134, 239, 172);
      doc.line(pageWidth / 2 - 70, yPos + 5, pageWidth / 2 + 70, yPos + 5);
      yPos += 20;

      const salaryRangeData =
        reportData.salaryDistribution?.map((range) => [
          range.range || 'N/A',
          range.count || 0,
          `${((range.count / (reportData.totalEmployees || 1)) * 100).toFixed(1)}%`
        ]) || [];

      autoTable(doc, {
        head: [['Salary Range', 'Employee Count', 'Percentage']],
        body: salaryRangeData,
        startY: yPos,
        theme: 'grid',
        tableWidth,
        styles: {
          fontSize: 9,
          cellPadding: 8,
          halign: 'center',
          valign: 'middle',
          lineColor: [209, 213, 219], // Light gray border
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [134, 239, 172], // Green header
          textColor: [30, 41, 59],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 10,
          lineColor: [134, 239, 172], // Keep themed header border
          lineWidth: 0.8,
        },
        bodyStyles: { textColor: [55, 65, 81] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: tableX, right: tableX },
      });

      yPos = doc.lastAutoTable.finalY + 50;

      // === Report Summary ===
      const summaryBoxHeight = 120;
      const summaryBoxY = yPos - 10;

      doc.setFillColor(247, 249, 252);
      doc.roundedRect(42, summaryBoxY + 2, pageWidth - 84, summaryBoxHeight, 10, 10, 'F');
      doc.setDrawColor(209, 213, 219); // Light gray outline
      doc.roundedRect(40, summaryBoxY, pageWidth - 80, summaryBoxHeight, 10, 10, 'S');

      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('Report Summary', pageWidth / 2, yPos + 12, { align: 'center' });
      yPos += 25;

      const leftX = 70;
      const rightX = pageWidth / 2 + 30;
      let lineY = yPos + 5;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(55, 65, 81);

      // Left column
      doc.circle(leftX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Total payroll for ${filters.month} ${filters.year}: ${formatLKR(reportData.totalPayroll || 0)}`, leftX, lineY);
      lineY += 16;

      doc.circle(leftX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Average salary per employee: ${formatLKR(reportData.averageSalary || 0)}`, leftX, lineY);

      // Right column
      lineY = yPos + 5;
      doc.circle(rightX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Total deductions: ${formatLKR(reportData.totalDeductions || 0)}`, rightX, lineY);
      lineY += 16;

      doc.circle(rightX - 5, lineY - 2.5, 1.3, 'F');
      doc.text(`Department with highest payroll: ${reportData.departmentBreakdown?.[0]?.department || 'N/A'}`, rightX, lineY);

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
        summaryBoxY + summaryBoxHeight - 10,
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

      const fileName = `Payroll_Distribution_Report_${filters.month}_${filters.year}.pdf`;
      doc.save(fileName);
      return { success: true, fileName };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw { message: 'Failed to generate payroll distribution report PDF' };
    }
  },
};

export default payrollReportService;
