import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

export interface ExcelSheetData {
  sheetName: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Export tabular data to an Excel file (.xlsx)
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  exportMultiSheetExcel(filename, [{ sheetName, headers, rows }]);
}

/**
 * Export multiple sheets to a single Excel workbook (.xlsx)
 */
export function exportMultiSheetExcel(
  filename: string,
  sheets: ExcelSheetData[]
) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const cleanRows = sheet.rows.map((row) =>
      row.map((val) => (val === null || val === undefined ? '' : String(val)))
    );

    const worksheet = XLSX.utils.aoa_to_sheet([sheet.headers, ...cleanRows]);

    // Set column widths based on maximum string length
    const colWidths = sheet.headers.map((h, colIdx) => {
      let maxLen = String(h).length;
      cleanRows.forEach((r) => {
        const cellVal = String(r[colIdx] || '');
        // handle multi-line strings
        const lines = cellVal.split('\n');
        lines.forEach(l => {
          if (l.length > maxLen) maxLen = l.length;
        });
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 55) };
    });
    worksheet['!cols'] = colWidths;

    const safeSheetName = sheet.sheetName.replace(/[\\/?*[\]:]/g, '_').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export tabular data to a styled PDF document (.pdf)
 */
export function exportToPDF(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  orientation: 'portrait' | 'landscape' = 'landscape',
  customOptions?: Partial<UserOptions>
) {
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 30, 30);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    `E7 Travels Fleet ERP  •  Generated on ${new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    30,
    43
  );

  const cleanRows = rows.map((row) =>
    row.map((val) => (val === null || val === undefined ? '-' : String(val)))
  );

  autoTable(doc, {
    startY: 52,
    head: [headers],
    body: cleanRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 3,
      textColor: [30, 41, 59], // slate-800
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { top: 52, left: 20, right: 20, bottom: 20 },
    ...customOptions,
  });

  doc.save(`${filename}.pdf`);
}

