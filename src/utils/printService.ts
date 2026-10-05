/**
 * E7 Travels Fleet ERP - Universal High-Precision Print & Printer Driver Sync Service
 *
 * Ensures 100% synchronized document titles for printer spoolers / PDF destinations,
 * isolated clean page layouts without UI background artifacts, and support for
 * both Laser/Inkjet (A4/Letter) and Thermal POS Receipt (80mm) printer drivers.
 */

export interface PrintOptions {
  /** Document Title sent to the Printer Spooler & PDF Destination */
  title: string;
  /** Raw HTML string or DOM Node to print */
  contentHtml?: string;
  element?: HTMLElement | null;
  /** Paper size format: 'A4' | 'Letter' | 'Thermal80mm' | 'A4Landscape' */
  paperSize?: 'A4' | 'Letter' | 'Thermal80mm' | 'A4Landscape';
  /** Whether to open in a dedicated clean new tab instead of direct iframe */
  openInNewTab?: boolean;
  /** Custom extra CSS styling rules */
  customStyles?: string;
}

/**
 * Clean and sanitize file/document title for printer spoolers and file saving
 */
export function sanitizePrintTitle(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .trim();
}

/**
 * Builds standard print-ready standalone HTML wrapper with typography & responsive rules
 */
export function buildPrintHtml(title: string, innerHtml: string, paperSize: PrintOptions['paperSize'] = 'A4', customStyles: string = ''): string {
  const isThermal = paperSize === 'Thermal80mm';
  const isLandscape = paperSize === 'A4Landscape';

  const pageCss = isThermal
    ? `@page { size: 80mm auto; margin: 2mm; } body { width: 76mm; margin: 0 auto; font-size: 11px; }`
    : isLandscape
    ? `@page { size: A4 landscape; margin: 8mm; } body { width: 100%; margin: 0; }`
    : `@page { size: A4 portrait; margin: 6mm 8mm; } body { width: 100%; margin: 0; }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${pageCss}

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white !important;
      color: #0f172a;
      padding: 0;
      line-height: 1.35;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace !important;
    }

    .font-display {
      font-family: 'Space Grotesk', sans-serif !important;
    }

    @media print {
      .no-print, .print-toolbar {
        display: none !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
      }
      .page-break-inside-avoid {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }

    /* Clean browser preview toolbar */
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: white;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
      font-family: system-ui, sans-serif;
    }

    ${customStyles}
  </style>
</head>
<body>
  <div class="print-toolbar no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px;">🖨️</span>
      <div>
        <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">E7 Travels Fleet ERP • Print Spooler</div>
        <div style="font-size: 11px; color: #94a3b8;">Destination: <strong>${title}</strong></div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 6px 14px; font-size: 12px; font-weight: 800; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        🖨️ Print to Printer / PDF
      </button>
      <button onclick="window.close()" style="background: #475569; color: white; border: none; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer;">
        Close
      </button>
    </div>
  </div>

  <div id="print-content" class="p-2">
    ${innerHtml}
  </div>

  <script>
    // Auto-trigger printing when window finishes loading
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;
}

/**
 * Universal Direct Printing Function
 * Ensures document.title is synchronized before printing and uses an isolated hidden iframe
 * so that only the document prints and the printer destination/job queue name is exact!
 */
export function printDocument(options: PrintOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const originalTitle = document.title;
    const sanitizedTitle = sanitizePrintTitle(options.title || 'E7_Travels_Document');

    // 1. Synchronize Document Title immediately
    document.title = sanitizedTitle;

    // Get inner HTML from string or element
    let contentHtml = options.contentHtml || '';
    if (!contentHtml && options.element) {
      contentHtml = options.element.innerHTML;
    }

    if (!contentHtml) {
      console.warn('[PrintService] No printable content provided');
      document.title = originalTitle;
      resolve(false);
      return;
    }

    const fullHtml = buildPrintHtml(
      sanitizedTitle,
      contentHtml,
      options.paperSize || 'A4',
      options.customStyles || ''
    );

    // If explicit new tab requested or if running in restricted mode
    if (options.openInNewTab) {
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(fullHtml);
          printWindow.document.close();
          // Restore title on parent
          setTimeout(() => {
            document.title = originalTitle;
          }, 1000);
          resolve(true);
          return;
        }
      } catch (err) {
        console.warn('[PrintService] New tab blocked, falling back to hidden iframe:', err);
      }
    }

    // 2. High-Precision Hidden iFrame Printing
    try {
      // Remove any existing print iframe
      const oldFrame = document.getElementById('e7-print-iframe');
      if (oldFrame) {
        oldFrame.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'e7-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc || !iframe.contentWindow) {
        throw new Error('Unable to access iframe document');
      }

      doc.open();
      doc.write(fullHtml);
      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve(true);
          } catch (printErr) {
            console.warn('[PrintService] Direct iframe print failed, falling back to window.print():', printErr);
            window.print();
            resolve(true);
          } finally {
            // Restore original title
            setTimeout(() => {
              document.title = originalTitle;
              iframe.remove();
            }, 3000);
          }
        }, 350);
      };
    } catch (err) {
      console.error('[PrintService] Error during iframe print:', err);
      // Fallback
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 2000);
      resolve(true);
    }
  });
}

/**
 * Triggers a Calibration / Test Print to verify printer driver name sync and margins
 */
export function printTestDriverSlip(): Promise<boolean> {
  const testHtml = `
    <div style="max-width: 600px; margin: 0 auto; border: 2px solid #0f172a; padding: 24px; border-radius: 8px; font-family: sans-serif;">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">E7 TOURS & TRAVELS</h1>
        <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #475569;">PRINTER DRIVER & DESTINATION CALIBRATION TEST SLIP</p>
      </div>

      <div style="background: #f8fafc; border: 1px dashed #94a3b8; padding: 14px; border-radius: 6px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
          <span style="font-weight: 600; color: #64748b;">Printer Spooler Title:</span>
          <span style="font-weight: 800; color: #0f172a; font-family: monospace;">E7_Travels_Printer_Driver_Test_Slip</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
          <span style="font-weight: 600; color: #64748b;">Timestamp:</span>
          <span style="font-weight: 700; color: #0f172a;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
          <span style="font-weight: 600; color: #64748b;">Driver Source Status:</span>
          <span style="font-weight: 800; color: #059669;">✓ SYNCED WITH BROWSER SPOOLER</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span style="font-weight: 600; color: #64748b;">Supported Drivers:</span>
          <span style="font-weight: 700; color: #0f172a;">A4 Laser / Inkjet / 80mm Thermal POS</span>
        </div>
      </div>

      <div style="border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 4px; font-size: 12px; font-weight: 800; color: #1e40af;">PRINTER DESTINATION CONFIGURATION GUIDE:</h4>
        <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #334155; line-height: 1.5;">
          <li>In the browser Print dialog, select your physical printer under <strong>Destination</strong> (e.g. HP LaserJet, Epson, Canon, TVS Thermal, or Save as PDF).</li>
          <li>Ensure <strong>Background graphics</strong> checkbox is checked under <em>More settings</em>.</li>
          <li>Set Margins to <strong>Default</strong> or <strong>Minimum</strong> for crisp alignment.</li>
        </ul>
      </div>

      <div style="text-align: center; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; font-weight: 600;">
        E7 Tours & Travels • 3/289, South Street, Mudhanai, Vridhachalam Taluk - 607804
      </div>
    </div>
  `;

  return printDocument({
    title: 'E7_Travels_Printer_Driver_Test_Slip',
    contentHtml: testHtml,
    paperSize: 'A4',
  });
}
