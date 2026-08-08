import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export tabular data to an Excel file (.xlsx)
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const cleanRows = rows.map((row) =>
    row.map((val) => (val === null || val === undefined ? '' : String(val)))
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...cleanRows]);

  // Set column widths based on maximum string length
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = String(h).length;
    cleanRows.forEach((r) => {
      const cellVal = String(r[colIdx] || '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
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
  orientation: 'portrait' | 'landscape' = 'landscape'
) {
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 30, 32);

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
    45
  );

  const cleanRows = rows.map((row) =>
    row.map((val) => (val === null || val === undefined ? '-' : String(val)))
  );

  autoTable(doc, {
    startY: 55,
    head: [headers],
    body: cleanRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 3.5,
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
    margin: { top: 55, left: 25, right: 25, bottom: 25 },
  });

  doc.save(`${filename}.pdf`);
}
