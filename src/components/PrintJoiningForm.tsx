import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Enquiry, Owner, Vehicle, Driver, Company, Site } from '../types';
import { Printer, X, Download, FileText, ExternalLink, Upload, Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import { renderCommonSiteOptions, cleanSiteValue } from '../lib/siteOptions';
import { printDocument, sanitizePrintTitle } from '../utils/printService';
import { parseEmergencyDetails, KNOWN_RELATIONS } from '../lib/emergencyUtils';

function formatDateToDDMMYYYY(dateStr: string | undefined | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const cleanStr = dateStr.trim();

  // Regex to find YYYY-MM-DD patterns anywhere in the string
  // It matches a 4-digit year, followed by - or /, followed by 1-2 digit month, followed by - or / and 1-2 digit day
  const yyyymmddRegex = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/g;

  if (yyyymmddRegex.test(cleanStr)) {
    return cleanStr.replace(yyyymmddRegex, (match, year, month, day) => {
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      return `${paddedDay}-${paddedMonth}-${year}`;
    });
  }

  return cleanStr;
}

interface PrintJoiningFormProps {
  enquiry: Enquiry | null; // Pass null for a blank form!
  owners?: Owner[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  companies?: Company[];
  sites?: Site[];
  customLogo?: string | null;
  onClose: () => void;
}

export default function PrintJoiningForm({
  enquiry,
  owners = [],
  vehicles = [],
  drivers = [],
  companies = [],
  sites = [],
  customLogo: customLogoProp,
  onClose,
}: PrintJoiningFormProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Helper to process uploaded photo from computer
  const handlePhotoFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, photoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Editable local state for fine-tuning before printing
  const [formData, setFormData] = useState<Partial<Enquiry>>({
    id: enquiry?.id || '',
    vehicleNumber: enquiry?.vehicleNumber || '',
    vehicleType: enquiry?.vehicleType || '',
    vehicleModelYear: enquiry?.vehicleModelYear || '',
    vehicleColor: enquiry?.vehicleColor || '',
    ownerNamePhone: enquiry?.ownerNamePhone || '',
    reference: enquiry?.reference || '',
    driverName: enquiry?.driverName || '',
    driverAge: enquiry?.driverAge || '',
    driverPhone: enquiry?.driverPhone || '',
    driverArea: enquiry?.driverArea || '',
    driverBatchExp: enquiry?.driverBatchExp || '',
    alreadyRunningCompany: cleanSiteValue(enquiry?.alreadyRunningCompany),
    sitePreference1: cleanSiteValue(enquiry?.sitePreference1),
    sitePreference2: cleanSiteValue(enquiry?.sitePreference2),
    enquiryDate: enquiry?.enquiryDate || new Date().toISOString().split('T')[0],
    remarks: enquiry?.remarks || '',
    
    // New fields
    inductionType: enquiry?.inductionType || 'OwnerAttach',
    ownerId: enquiry?.ownerId || '',
    ownerName: enquiry?.ownerName || '',
    ownerMobile: enquiry?.ownerMobile || '',
    ownerAddress: enquiry?.ownerAddress || '',
    mfdYear: enquiry?.mfdYear || '',
    registrationDate: enquiry?.registrationDate || '',
    fuelType: enquiry?.fuelType || 'Diesel',
    rcExpiry: enquiry?.rcExpiry || '',
    insuranceExpiry: enquiry?.insuranceExpiry || '',
    permitExpiry: enquiry?.permitExpiry || '',
    fcExpiry: enquiry?.fcExpiry || '',
    driverAltPhone: enquiry?.driverAltPhone || '',
    driverEmail: enquiry?.driverEmail || '',
    driverEmergencyContactName: enquiry?.driverEmergencyContactName || '',
    driverEmergencyContactNumber: enquiry?.driverEmergencyContactNumber || '',
    driverEmergencyRelation: enquiry?.driverEmergencyRelation || '',
    driverAadhaar: enquiry?.driverAadhaar || '',
    driverDlNumber: enquiry?.driverDlNumber || '',
    driverDlExpiry: enquiry?.driverDlExpiry || '',
    driverAddress: enquiry?.driverAddress || '',
    gpsVendor: enquiry?.gpsVendor || '',
    gpsImei: enquiry?.gpsImei || '',
    bankName: enquiry?.bankName || '',
    bankAccountHolder: enquiry?.bankAccountHolder || '',
    bankAccountNumber: enquiry?.bankAccountNumber || '',
    bankIfsc: enquiry?.bankIfsc || '',
    sitePreference3: cleanSiteValue(enquiry?.sitePreference3),
    sitePreference4: cleanSiteValue(enquiry?.sitePreference4),
    photoUrl: enquiry?.photoUrl || '',
  });

  // Automatically parse fields like Owner Name, Phone, Address & Site Assignment from Master Register
  useEffect(() => {
    if (enquiry) {
      const stateUpdate: Partial<Enquiry> = {};
      
      // Match vehicle from Master Register
      const matchedVeh = vehicles.find((v) =>
        (enquiry.vehicleNumber && v.registrationNumber &&
          v.registrationNumber.replace(/\s+/g, '').toUpperCase() === enquiry.vehicleNumber.replace(/\s+/g, '').toUpperCase()) ||
        (enquiry.id && v.id === enquiry.id)
      );

      // Match owner from Owner Data & Master Register
      const matchedOwner = owners.find((o) =>
        (enquiry.ownerId && o.id === enquiry.ownerId) ||
        (matchedVeh?.ownerId && o.id === matchedVeh.ownerId) ||
        (enquiry.ownerName && o.name && o.name.trim().toLowerCase() === enquiry.ownerName.trim().toLowerCase()) ||
        (matchedVeh?.ownerName && o.name && o.name.trim().toLowerCase() === matchedVeh.ownerName.trim().toLowerCase())
      );

      // Recognize owner details from Owner Data & Master Register
      const recognizedOwnerAddress = matchedOwner?.address || enquiry.ownerAddress || matchedVeh?.ownerAddress || '';
      const recognizedOwnerName = matchedOwner?.name || enquiry.ownerName || matchedVeh?.ownerName || '';
      const recognizedOwnerMobile = matchedOwner?.phone || enquiry.ownerMobile || matchedVeh?.ownerPhone || '';
      const recognizedOwnerId = matchedOwner?.id || enquiry.ownerId || matchedVeh?.ownerId || '';

      if (recognizedOwnerAddress) stateUpdate.ownerAddress = recognizedOwnerAddress;
      if (recognizedOwnerName) stateUpdate.ownerName = recognizedOwnerName;
      if (recognizedOwnerMobile) stateUpdate.ownerMobile = recognizedOwnerMobile;
      if (recognizedOwnerId) stateUpdate.ownerId = recognizedOwnerId;

      if (matchedOwner) {
        if (!enquiry.bankName && matchedOwner.bankName) stateUpdate.bankName = matchedOwner.bankName;
        if (!enquiry.bankAccountHolder && (matchedOwner.name || recognizedOwnerName)) {
          stateUpdate.bankAccountHolder = matchedOwner.name || recognizedOwnerName;
        }
        if (!enquiry.bankAccountNumber && matchedOwner.accountNumber) stateUpdate.bankAccountNumber = matchedOwner.accountNumber;
        if (!enquiry.bankIfsc && matchedOwner.ifsc) stateUpdate.bankIfsc = matchedOwner.ifsc;
      }

      // Match driver from Driver Master if available
      const matchedDriver = drivers.find((d) =>
        (matchedVeh?.driverId && d.id === matchedVeh.driverId) ||
        (enquiry.driverName && d.name && d.name.trim().toLowerCase() === enquiry.driverName.trim().toLowerCase()) ||
        (matchedVeh?.driverName && d.name && d.name.trim().toLowerCase() === matchedVeh.driverName.trim().toLowerCase()) ||
        (enquiry.driverPhone && d.phone && d.phone.replace(/\D/g, '') === enquiry.driverPhone.replace(/\D/g, ''))
      );

      if (matchedDriver) {
        if (!enquiry.driverName) stateUpdate.driverName = matchedDriver.name;
        if (!enquiry.driverPhone && matchedDriver.phone) stateUpdate.driverPhone = matchedDriver.phone;
        if (!enquiry.driverAddress && matchedDriver.address) stateUpdate.driverAddress = matchedDriver.address;
        if (!enquiry.driverAadhaar && matchedDriver.aadhaar) stateUpdate.driverAadhaar = matchedDriver.aadhaar;
        if (!enquiry.driverDlNumber && matchedDriver.licenceNumber) stateUpdate.driverDlNumber = matchedDriver.licenceNumber;
        if (!enquiry.driverDlExpiry && matchedDriver.licenceExpiry) stateUpdate.driverDlExpiry = matchedDriver.licenceExpiry;
        if (!enquiry.driverEmail && (matchedDriver.email || matchedOwner?.email)) {
          stateUpdate.driverEmail = matchedDriver.email || matchedOwner?.email || '';
        }
        if (!enquiry.driverAltPhone && (matchedDriver.altPhone || (recognizedOwnerMobile !== matchedDriver.phone ? recognizedOwnerMobile : ''))) {
          stateUpdate.driverAltPhone = matchedDriver.altPhone || (recognizedOwnerMobile !== matchedDriver.phone ? recognizedOwnerMobile : '');
        }

        // Emergency Contact Details Parsing
        const parsed = parseEmergencyDetails(
          matchedDriver.emergencyContact,
          enquiry.driverEmergencyContactName || matchedDriver.emergencyContactName,
          enquiry.driverEmergencyRelation || matchedDriver.emergencyContactRelation,
          enquiry.driverEmergencyContactNumber || matchedDriver.emergencyContactNumber
        );

        if (parsed.name) stateUpdate.driverEmergencyContactName = parsed.name;
        if (parsed.relation) stateUpdate.driverEmergencyRelation = parsed.relation;
        if (parsed.number) stateUpdate.driverEmergencyContactNumber = parsed.number;
      } else if (enquiry.driverEmergencyContactName || enquiry.driverEmergencyContactNumber) {
        // Sanitize existing emergency contact
        const parsed = parseEmergencyDetails(
          '',
          enquiry.driverEmergencyContactName,
          enquiry.driverEmergencyRelation,
          enquiry.driverEmergencyContactNumber
        );
        stateUpdate.driverEmergencyContactName = parsed.name;
        stateUpdate.driverEmergencyRelation = parsed.relation;
        stateUpdate.driverEmergencyContactNumber = parsed.number;
      }

      // 1. Vehicle Details
      if (matchedVeh) {
        if (!enquiry.vehicleType && (matchedVeh.manufacturer || matchedVeh.model)) {
          stateUpdate.vehicleType = `${matchedVeh.manufacturer || ''} ${matchedVeh.model || ''}`.trim();
        }
        if (!enquiry.mfdYear && (matchedVeh.year || matchedVeh.mfdYear)) {
          stateUpdate.mfdYear = String(matchedVeh.year || matchedVeh.mfdYear || '');
        }
        if (!enquiry.fuelType && matchedVeh.fuelType) {
          stateUpdate.fuelType = matchedVeh.fuelType;
        }
        if (!enquiry.rcExpiry && (matchedVeh.rcExpiry || matchedVeh.registrationDate)) {
          stateUpdate.rcExpiry = matchedVeh.rcExpiry || matchedVeh.registrationDate;
        }
        if (!enquiry.registrationDate && (matchedVeh.registrationDate || matchedVeh.rcExpiry)) {
          stateUpdate.registrationDate = matchedVeh.registrationDate || matchedVeh.rcExpiry;
        }
        if (!enquiry.insuranceExpiry && matchedVeh.insuranceExpiry) {
          stateUpdate.insuranceExpiry = matchedVeh.insuranceExpiry;
        }
        if (!enquiry.permitExpiry && matchedVeh.permitExpiry) {
          stateUpdate.permitExpiry = matchedVeh.permitExpiry;
        }
        if (!enquiry.fcExpiry && matchedVeh.fcExpiry) {
          stateUpdate.fcExpiry = matchedVeh.fcExpiry;
        }
        if (!enquiry.gpsVendor && matchedVeh.gpsVendor) {
          stateUpdate.gpsVendor = matchedVeh.gpsVendor;
        }
        if (!enquiry.gpsImei && matchedVeh.gpsImei) {
          stateUpdate.gpsImei = matchedVeh.gpsImei;
        }
        if (!enquiry.reference && matchedVeh.remarks) {
          stateUpdate.reference = matchedVeh.remarks;
        }
      }

      // Recognize assigned site and site preferences from Master Register or Enquiry
      const assignedSite = cleanSiteValue(matchedVeh?.company || matchedVeh?.sitePreference1 || enquiry.inductionCompany || enquiry.alreadyRunningCompany || enquiry.sitePreference1);
      const sitePref2 = cleanSiteValue(matchedVeh?.company2 || matchedVeh?.sitePreference2 || enquiry.sitePreference2);
      const sitePref3 = cleanSiteValue(matchedVeh?.site || matchedVeh?.sitePreference3 || enquiry.sitePreference3);
      const sitePref4 = cleanSiteValue(matchedVeh?.site2 || matchedVeh?.sitePreference4 || enquiry.sitePreference4);

      stateUpdate.sitePreference1 = assignedSite;
      stateUpdate.sitePreference2 = sitePref2;
      stateUpdate.sitePreference3 = sitePref3;
      stateUpdate.sitePreference4 = sitePref4;

      // Determine induction type
      const isOwnerDriver = Boolean(
        matchedVeh?.driverType === 'Owner-cum-Driver' ||
        (recognizedOwnerName && (stateUpdate.driverName || enquiry.driverName) &&
         recognizedOwnerName.trim().toLowerCase() === (stateUpdate.driverName || enquiry.driverName || '').trim().toLowerCase())
      );
      if (!enquiry.inductionType) {
        stateUpdate.inductionType = isOwnerDriver ? 'OwnerAttach' : (matchedVeh?.driverType === 'Company' ? 'DriverAttach' : 'OwnerAttach');
      }

      // Parse owner name/phone e.g. "VIGNESH-7358742132" or "RAGHAVAN-8825756609"
      if (enquiry.ownerNamePhone && !stateUpdate.ownerName && !enquiry.ownerName) {
        const parts = enquiry.ownerNamePhone.split(/[-–—/]/);
        if (parts.length > 0) stateUpdate.ownerName = parts[0].trim();
        if (parts.length > 1) stateUpdate.ownerMobile = parts[1].trim();
      }

      // Pre-fill model year, type, and registration date
      if (enquiry.vehicleModelYear && !enquiry.mfdYear) {
        stateUpdate.mfdYear = enquiry.vehicleModelYear;
      }
      if (matchedVeh?.registrationDate && !enquiry.registrationDate) {
        stateUpdate.registrationDate = matchedVeh.registrationDate;
      }
      
      if (Object.keys(stateUpdate).length > 0) {
        setFormData(prev => ({ ...prev, ...stateUpdate }));
      }
    }
  }, [enquiry, owners, vehicles, drivers]);

  const [printError, setPrintError] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'preview'>('preview');
  const [zoomScale, setZoomScale] = useState<number>(100);

  useEffect(() => {
    document.body.classList.add('print-active');
    return () => {
      document.body.classList.remove('print-active');
    };
  }, []);

  const generateStandaloneHtml = (contentHtml: string, forNewTab: boolean = false) => {
    // Collect all active document stylesheets to guarantee 100% exact rendering
    let parentStyles = '';
    try {
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        parentStyles += el.outerHTML + '\n';
      });
    } catch (e) {
      console.warn('Could not extract parent styles:', e);
    }

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vehicle Joining Form - ${formData.vehicleNumber || formData.id || 'E7 Travels'}</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    
    <!-- Parent App Stylesheets & Injected Rules -->
    ${parentStyles}

    <style>
      *, *::before, *::after {
        box-sizing: border-box;
      }
      body {
        font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        -webkit-font-smoothing: antialiased;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .font-serif {
        font-family: 'Playfair Display', Georgia, serif !important;
      }
      .font-mono {
        font-family: 'JetBrains Mono', ui-monospace, monospace !important;
      }

      /* Logo sizing & crisp high-visibility display across prints */
      .print-brand-logo-container {
        height: 138px !important;
        min-height: 138px !important;
        max-height: 145px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
      }
      .print-brand-logo-img {
        height: 138px !important;
        max-height: 138px !important;
        max-width: 190px !important;
        width: auto !important;
        object-fit: contain !important;
        display: block !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .vehicle-joining-title {
        white-space: nowrap !important;
        letter-spacing: 0.04em !important;
        display: inline-block !important;
      }
      
      @page {
        size: A4 portrait;
        margin: 4mm 6mm 4mm 6mm;
      }
      
      @media print {
        .no-print, .print-toolbar {
          display: none !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          width: 100% !important;
          height: auto !important;
        }
        .print-sheet {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-height: auto !important;
          max-height: 288mm !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          transform: none !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          overflow: hidden !important;
        }
      }
      
      @media screen {
        body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          background: #0f172a;
        }
        .print-toolbar {
          width: 100%;
          max-width: 210mm;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1e293b;
          color: white;
          padding: 12px 18px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        }
        .print-sheet {
          width: 210mm;
          min-height: 297mm;
          max-width: 210mm;
          background: #ffffff;
          padding: 20px 24px;
          border-radius: 4px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          box-sizing: border-box;
        }
      }

      /* Baseline alignment for form input blank underlines */
      .print-sheet span.border-b {
        display: inline-flex !important;
        align-items: flex-end !important;
        padding-bottom: 1px !important;
        box-sizing: border-box !important;
      }
      .print-sheet span.border-b.text-center {
        justify-content: center !important;
      }
      .print-sheet span.border-b.text-right {
        justify-content: flex-end !important;
      }

      /* Native styled checkboxes */
      input[type="checkbox"] {
        accent-color: #0f172a;
        display: inline-block !important;
        vertical-align: middle !important;
      }
    </style>
  </head>
  <body>
    ${forNewTab ? `
    <div class="no-print print-toolbar">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:20px;">📄</span>
        <div>
          <div style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Vehicle Joining Form • Print Ready</div>
          <div style="font-size:11px; color:#94a3b8;">${formData.vehicleNumber ? 'Vehicle: ' + formData.vehicleNumber : 'Single-Page A4 Sheet'} • E7 TRAVELS</div>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button onclick="window.print()" style="background:#10b981; color:white; border:none; padding:8px 18px; font-size:12px; font-weight:800; border-radius:6px; cursor:pointer; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
          🖨️ Print Form Now
        </button>
        <button onclick="window.close()" style="background:#334155; color:#cbd5e1; border:none; padding:8px 14px; font-size:12px; font-weight:700; border-radius:6px; cursor:pointer;">
          Close Tab
        </button>
      </div>
    </div>
    ` : ''}

    <div class="print-sheet">
      ${contentHtml}
    </div>

    <script>
      window.addEventListener('load', function() {
        setTimeout(function() {
          window.focus();
          ${forNewTab ? 'window.print();' : 'window.print();'}
        }, 300);
      });
    </script>
  </body>
</html>`;
  };

  const handlePrint = async () => {
    setPrintError(false);
    const docTitle = `E7_Travels_Vehicle_Joining_Form_${formData.vehicleNumber ? formData.vehicleNumber.replace(/[^A-Za-z0-9]/g, '_') : 'Draft'}`;

    try {
      if (printAreaRef.current) {
        await printDocument({
          title: docTitle,
          element: printAreaRef.current,
          paperSize: 'A4',
          openInNewTab: false,
        });
      } else {
        window.focus();
        window.print();
      }
    } catch (err) {
      console.warn('Direct printDocument failed, opening new print tab:', err);
      handleOpenPrintWindow();
    }
  };

  const handleOpenPrintWindow = () => {
    if (!printAreaRef.current) return;
    const docTitle = `E7_Travels_Vehicle_Joining_Form_${formData.vehicleNumber ? formData.vehicleNumber.replace(/[^A-Za-z0-9]/g, '_') : 'Draft'}`;
    printDocument({
      title: docTitle,
      element: printAreaRef.current,
      paperSize: 'A4',
      openInNewTab: true,
    });
  };

  // Safe logo image retrieval from prop, e7_custom_logo, or e7_original_logo
  const customLogo = (customLogoProp !== undefined && customLogoProp !== null && customLogoProp !== '')
    ? customLogoProp
    : (localStorage.getItem('e7_custom_logo') || localStorage.getItem('e7_original_logo') || null);

  return createPortal(
    <div className="print-modal-root fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      
      {printError && (
        <div className="w-full max-w-[1150px] bg-rose-500 text-white p-3.5 text-xs font-extrabold rounded-lg mb-2 flex items-center justify-between border-2 border-rose-600 print:hidden shadow-md">
          <div className="flex items-center gap-2 text-left">
            <span className="text-sm shrink-0">⚠️</span>
            <span>
              Could not open print dialog directly in this view. You can review the exact A4 Print Preview below or use browser Print.
            </span>
          </div>
          <button 
            onClick={() => setPrintError(false)}
            className="text-white hover:text-rose-100 text-xs font-black uppercase ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Controls Bar - Hidden on print */}
      <div className="w-full max-w-[1150px] bg-slate-900 text-white rounded-t-xl p-3 sm:p-4 flex flex-wrap gap-3 items-center justify-between shadow-xl print:hidden border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 text-slate-950 rounded-lg">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wide uppercase">Print Vehicle Joining Form</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                1-Page A4 Sheet
              </span>
            </div>
            <p className="text-4xs text-slate-400 uppercase tracking-widest mt-0.5">
              {enquiry ? `Application ID: ${enquiry.id} • ${formData.vehicleNumber || 'No Reg Number'}` : 'Blank Joining Form'}
            </p>
          </div>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Mode Switcher */}
          <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📄 Full Preview</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Edit & Preview</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs text-slate-300">
            <button
              onClick={() => setZoomScale(prev => Math.max(50, prev - 10))}
              className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <span className="text-[11px] font-mono px-1 min-w-[40px] text-center font-bold text-emerald-400">
              {zoomScale}%
            </span>
            <button
              onClick={() => setZoomScale(prev => Math.min(130, prev + 10))}
              className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setZoomScale(100)}
              className="text-[10px] px-2 py-1 hover:bg-slate-700 rounded text-slate-400 font-semibold"
              title="Reset to 100%"
            >
              100%
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all shadow-md cursor-pointer"
              title="Trigger Print"
            >
              <Printer className="h-4 w-4" />
              Print Form
            </button>
            <button
              onClick={handleOpenPrintWindow}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-lg transition-all border border-slate-700 cursor-pointer"
              title="Open Printable View in New Window"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Print in New Tab</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all border border-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Preview Side-by-Side (or stacked on mobile) - Editor Hidden on Print */}
      <div className="w-full max-w-[1150px] bg-slate-100 flex flex-col md:flex-row shadow-2xl overflow-visible print:shadow-none print:bg-white print:block rounded-b-xl border border-slate-200">
        
        {/* On-the-fly Fine-Tuning Panel (Shown only when viewMode is 'split', hidden on print) */}
        {viewMode === 'split' && (
          <div className="w-full md:w-72 bg-white border-r border-slate-200 p-5 shrink-0 overflow-y-auto max-h-[1100px] print:hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Quick Fine-Tuning</h3>
              </div>
              <button
                onClick={() => setViewMode('preview')}
                className="text-[10px] text-slate-500 hover:text-emerald-600 font-bold underline"
              >
                Hide Panel
              </button>
            </div>
            
            <div className="space-y-4 text-left">
            {/* Passport Photo Upload & Controls */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  Passport Photo (Driver / Owner)
                </label>
                {formData.photoUrl && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                    Photo Added
                  </span>
                )}
              </div>

              {formData.photoUrl ? (
                <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-md">
                  <div className="w-12 h-14 bg-slate-100 border border-slate-300 rounded overflow-hidden shrink-0">
                    <img
                      src={formData.photoUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                      className="w-full py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer mb-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo from Computer</span>
                  </button>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePhotoFile(file);
                    }}
                    className={`border-2 border-dashed ${isDraggingPhoto ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 bg-white'} rounded-md p-2 text-center cursor-pointer transition-all`}
                  >
                    <Camera className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-[10px] font-semibold text-slate-600 leading-tight">
                      Click or drop photo here
                    </p>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <label className="block text-[9px] text-slate-500 font-medium mb-1">Or paste photo URL:</label>
                    <input
                      type="text"
                      value={formData.photoUrl || ''}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded bg-white"
                      placeholder="https://... (optional)"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Application No</label>
              <input
                type="text"
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-slate-50"
                placeholder="e.g. ENQ043"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Induction Type</label>
              <select
                value={formData.inductionType || 'OwnerAttach'}
                onChange={(e) => setFormData({ ...formData, inductionType: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded"
              >
                <option value="OwnerAttach">Owner Attach</option>
                <option value="DriverAttach">Driver Attach</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner ID</label>
              <input
                type="text"
                value={formData.ownerId || ''}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded"
                placeholder="e.g. OWN082"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner Name</label>
              <input
                type="text"
                value={formData.ownerName || ''}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner Mobile</label>
              <input
                type="text"
                value={formData.ownerMobile || ''}
                onChange={(e) => setFormData({ ...formData, ownerMobile: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner Address</label>
              <textarea
                rows={2}
                value={formData.ownerAddress || ''}
                onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded"
                placeholder="Owner permanent address"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reference / Lead</label>
              <input
                type="text"
                value={formData.reference || ''}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Vehicle Specs</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] text-slate-500">Reg. Number</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Make / Model</label>
                  <input
                    type="text"
                    value={formData.vehicleType || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Mfd Year</label>
                  <input
                    type="text"
                    value={formData.mfdYear || ''}
                    onChange={(e) => setFormData({ ...formData, mfdYear: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 font-semibold text-blue-700">RC Registration Date</label>
                  <input
                    type="date"
                    value={formData.registrationDate || ''}
                    onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-blue-200 bg-blue-50/20 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Fuel Type</label>
                  <input
                    type="text"
                    value={formData.fuelType || ''}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                    placeholder="Diesel / CNG / Petrol / EV"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">RC Expiry</label>
                  <input
                    type="date"
                    value={formData.rcExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, rcExpiry: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Insurance Expiry</label>
                  <input
                    type="date"
                    value={formData.insuranceExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Permit Expiry</label>
                  <input
                    type="text"
                    value={formData.permitExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, permitExpiry: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                    placeholder="Type & Date"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">FC Expiry</label>
                  <input
                    type="date"
                    value={formData.fcExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, fcExpiry: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Driver Details</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] text-slate-500">Full Name</label>
                  <input
                    type="text"
                    value={formData.driverName || ''}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Mobile No</label>
                  <input
                    type="text"
                    value={formData.driverPhone || ''}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Alt Phone</label>
                  <input
                    type="text"
                    value={formData.driverAltPhone || ''}
                    onChange={(e) => setFormData({ ...formData, driverAltPhone: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Email ID</label>
                  <input
                    type="text"
                    value={formData.driverEmail || ''}
                    onChange={(e) => setFormData({ ...formData, driverEmail: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Emergency Person Name</label>
                  <input
                    type="text"
                    value={formData.driverEmergencyContactName || ''}
                    onChange={(e) => setFormData({ ...formData, driverEmergencyContactName: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                    placeholder="e.g. Ramesh Kumar / Priya"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Emergency Relationship</label>
                  <select
                    value={formData.driverEmergencyRelation || ''}
                    onChange={(e) => setFormData({ ...formData, driverEmergencyRelation: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-medium"
                  >
                    <option value="">-- Select Relation --</option>
                    {KNOWN_RELATIONS.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Emergency Number</label>
                  <input
                    type="text"
                    value={formData.driverEmergencyContactNumber || ''}
                    onChange={(e) => setFormData({ ...formData, driverEmergencyContactNumber: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                    placeholder="e.g. 9840998877"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Aadhaar No</label>
                  <input
                    type="text"
                    value={formData.driverAadhaar || ''}
                    onChange={(e) => setFormData({ ...formData, driverAadhaar: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">DL Number</label>
                  <input
                    type="text"
                    value={formData.driverDlNumber || ''}
                    onChange={(e) => setFormData({ ...formData, driverDlNumber: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">DL Validity</label>
                  <input
                    type="date"
                    value={formData.driverDlExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, driverDlExpiry: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Address</label>
                  <input
                    type="text"
                    value={formData.driverAddress || ''}
                    onChange={(e) => setFormData({ ...formData, driverAddress: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">GPS & Bank Details</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] text-slate-500">GPS Vendor</label>
                  <input
                    type="text"
                    value={formData.gpsVendor || ''}
                    onChange={(e) => setFormData({ ...formData, gpsVendor: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">IMEI Number</label>
                  <input
                    type="text"
                    value={formData.gpsImei || ''}
                    onChange={(e) => setFormData({ ...formData, gpsImei: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Ac Holder</label>
                  <input
                    type="text"
                    value={formData.bankAccountHolder || ''}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Ac Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankIfsc || ''}
                    onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Vehicles Inducted for Sites</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Assigned Site:</label>
                  <select
                    value={cleanSiteValue(formData.sitePreference1)}
                    onChange={(e) => setFormData({ ...formData, sitePreference1: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-medium"
                  >
                    {renderCommonSiteOptions(
                      companies,
                      sites,
                      cleanSiteValue(formData.sitePreference1),
                      false,
                      '-- Choose Assigned Site --'
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Site Preference 2:</label>
                  <select
                    value={cleanSiteValue(formData.sitePreference2)}
                    onChange={(e) => setFormData({ ...formData, sitePreference2: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-medium"
                  >
                    {renderCommonSiteOptions(
                      companies,
                      sites,
                      cleanSiteValue(formData.sitePreference2),
                      false,
                      '-- None / Empty --'
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Site Preference 3:</label>
                  <select
                    value={cleanSiteValue(formData.sitePreference3)}
                    onChange={(e) => setFormData({ ...formData, sitePreference3: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-medium"
                  >
                    {renderCommonSiteOptions(
                      companies,
                      sites,
                      cleanSiteValue(formData.sitePreference3),
                      false,
                      '-- None / Empty --'
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Site Preference 4:</label>
                  <select
                    value={cleanSiteValue(formData.sitePreference4)}
                    onChange={(e) => setFormData({ ...formData, sitePreference4: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-medium"
                  >
                    {renderCommonSiteOptions(
                      companies,
                      sites,
                      cleanSiteValue(formData.sitePreference4),
                      false,
                      '-- None / Empty --'
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Printable Paper A4 Layout Workspace */}
        <div className="flex-1 bg-slate-200/90 p-3 sm:p-6 overflow-x-auto min-w-0 flex justify-center items-start print:p-0 print:bg-transparent print:block print:overflow-visible w-full">
          <div 
            ref={printAreaRef}
            className="print-sheet w-full bg-white p-4 sm:p-8 font-sans text-slate-900 border border-slate-300 shadow-2xl rounded-sm relative print:p-0 print:m-0 print:w-full print:shadow-none print:border-none print:rounded-none overflow-visible transition-all duration-200"
            style={{ 
              width: '100%', 
              maxWidth: '210mm', 
              minHeight: '297mm', 
              boxSizing: 'border-box',
              transform: zoomScale !== 100 ? `scale(${zoomScale / 100})` : undefined,
              transformOrigin: 'top center'
            }}
          >
          {/* Print specific CSS override injected directly */}
          <style dangerouslySetInnerHTML={{ __html: `
            /* Fix vertical baseline alignment for underlined form fields on both screen and print */
            .print-sheet span.border-b {
              display: inline-flex !important;
              align-items: flex-end !important;
              padding-bottom: 1px !important;
              box-sizing: border-box !important;
            }
            .print-sheet span.border-b.text-center {
              justify-content: center !important;
            }
            .print-sheet span.border-b.text-right {
              justify-content: flex-end !important;
            }

            @media print {
              /* Hide root dashboard app leaving portal modal */
              #root {
                display: none !important;
              }
              .print-modal-root {
                position: static !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
              }
              /* Position print sheet with precise A4 margins to guarantee single page fit */
              @page {
                size: A4 portrait;
                margin: 4mm 6mm 4mm 6mm !important;
              }
              html, body {
                background: white !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                height: auto !important;
                overflow: visible !important;
                width: 100% !important;
                max-width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important;
              }
              *, .print-sheet, .print-container, .print-container * {
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
              }
              .print-container .font-serif {
                font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
              }
              /* Override the screen-specific min-height during print for single page fit */
              .print-sheet {
                min-height: auto !important;
                max-height: 288mm !important;
                height: auto !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                background: white !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              .print-container {
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
                transform: none !important;
                zoom: 1 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              /* Section spacing and padding on print matching on-screen density */
              .print-container .space-y-1 {
                margin-bottom: 0.15rem !important;
              }
              .print-container .bg-slate-100 {
                background-color: #f1f5f9 !important;
                padding-top: 2px !important;
                padding-bottom: 2px !important;
                padding-left: 6px !important;
                padding-right: 6px !important;
              }
              .print-container .bg-slate-50 {
                background-color: #f8fafc !important;
              }
              /* Underlined fields baseline positioning */
              .print-container span.border-b {
                display: inline-flex !important;
                align-items: flex-end !important;
                padding-bottom: 1px !important;
                box-sizing: border-box !important;
              }
              .print-container img {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Hide all interactive print elements */
              .print\\:hidden, [print\\:hidden] {
                display: none !important;
                visibility: hidden !important;
              }
              /* Explicitly restore checkbox inputs on print */
              input[type="checkbox"], .print-container input[type="checkbox"] {
                display: inline-block !important;
                visibility: visible !important;
                opacity: 1 !important;
                -webkit-appearance: checkbox !important;
                appearance: checkbox !important;
                width: 11px !important;
                height: 11px !important;
                margin: 0 !important;
                padding: 0 !important;
                vertical-align: middle !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}} />

          <div 
            className="print-container space-y-2 text-left text-xs leading-relaxed"
            style={{
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          >
            
            {/* Header branding & Passport Photo Column */}
            <div className="border-b-2 border-slate-900 pb-1 mb-1.5 font-sans">
              <div className="flex items-stretch justify-between gap-2">
                
                {/* Left: Brand Logo (Large, High Visibility) & Date Block */}
                <div className="w-48 shrink-0 flex flex-col items-start justify-between">
                  {/* High Visibility Logo above Date space */}
                  <div className="w-full print-brand-logo-container flex items-center justify-start mb-0.5" style={{ height: '138px', minHeight: '138px' }}>
                    {customLogo ? (
                      <img 
                        src={customLogo} 
                        alt="E7 Travels" 
                        style={{
                          height: '138px',
                          maxHeight: '138px',
                          maxWidth: '190px',
                          width: 'auto',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                        className="print-brand-logo-img drop-shadow-sm" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div 
                        className="rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex flex-col items-center justify-center text-slate-950 font-black border-2 border-slate-950 shadow-md"
                        style={{ width: '115px', height: '115px' }}
                      >
                        <span className="text-5xl font-black leading-none tracking-tight">E7</span>
                        <span className="text-[10px] font-extrabold tracking-widest uppercase mt-1 text-slate-900">TRAVELS</span>
                      </div>
                    )}
                  </div>

                  {/* Date Box directly below the Logo */}
                  <div className="flex items-center gap-1.5 pb-0.5 whitespace-nowrap">
                    <span className="font-bold text-slate-700 uppercase text-[9.5px]">DATE:</span>
                    <span className="font-bold px-2 py-0.5 bg-slate-100 border border-slate-400 rounded text-center min-w-[90px] inline-block tabular-nums text-[10.5px] text-slate-900">
                      {formatDateToDDMMYYYY(formData.enquiryDate) || '\u00A0'}
                    </span>
                  </div>
                </div>

                {/* Center: Brand Name & Title */}
                <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center px-2 py-1">
                  <h1 className="font-serif font-black tracking-widest text-amber-600 uppercase leading-none whitespace-nowrap" style={{ fontSize: '28px' }}>
                    E7 TRAVELS
                  </h1>
                  <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mt-1.5 mb-1 whitespace-nowrap">
                    FLEET OPERATIONS & LOGISTICS
                  </p>
                  <h2 
                    className="vehicle-joining-title text-[12.5px] sm:text-[13.5px] font-black text-[rgb(0,180,75)] tracking-wide uppercase border-t border-b border-slate-300 py-1 px-3 mt-1 inline-block whitespace-nowrap"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    VEHICLE JOINING APPLICATION FORM
                  </h2>
                </div>

                {/* Right: PASSPORT SIZE PHOTO COLUMN & APPLICATION NO */}
                <div className="w-48 shrink-0 flex flex-col items-end justify-between">
                  {/* Hidden file input for uploading from computer */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePhotoFile(file);
                        e.target.value = '';
                      }
                    }}
                  />

                  {/* Passport Size Photo Space for Driver or Owner */}
                  <div 
                    className={`border-2 border-dashed ${isDraggingPhoto ? 'border-blue-500 bg-blue-50/80 scale-[1.02]' : 'border-slate-400 bg-slate-50/90'} rounded flex flex-col items-center justify-center text-center p-0.5 text-slate-600 mb-0.5 relative group overflow-hidden transition-all select-none cursor-pointer`}
                    style={{ width: '100px', height: '135px', minHeight: '135px' }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePhotoFile(file);
                    }}
                    title={formData.photoUrl ? "Click to change passport photo" : "Click or drag & drop to upload passport photo from computer"}
                  >
                    {formData.photoUrl ? (
                      <>
                        <img
                          src={formData.photoUrl}
                          alt="Passport Photo"
                          className="w-full h-full object-cover rounded-xs block"
                          style={{ width: '100%', height: '100%' }}
                        />
                        {/* On-screen hover overlay for instant change or delete (no-print) */}
                        <div className="no-print absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 text-white z-10">
                          <Camera className="w-4 h-4 text-white drop-shadow" />
                          <span className="text-[7.5px] font-bold uppercase tracking-tight text-center">Change Photo</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, photoUrl: '' }));
                            }}
                            className="mt-0.5 px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[7.5px] font-bold flex items-center gap-0.5 shadow cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-1 flex flex-col items-center justify-center h-full w-full">
                        <span className="text-[8px] font-black tracking-tight leading-none text-slate-700 uppercase">
                          AFFIX RECENT
                        </span>
                        <span className="text-[8.5px] font-black tracking-tight leading-tight text-slate-900 uppercase my-1">
                          PASSPORT SIZE PHOTO
                        </span>
                        <span className="text-[7px] font-bold text-slate-500 uppercase leading-none">
                          (DRIVER / OWNER)
                        </span>

                        {/* Interactive upload trigger button for on-screen view (no-print) */}
                        <div className="no-print mt-1.5 flex flex-col items-center justify-center bg-blue-50 border border-blue-200 text-blue-700 rounded px-1 py-0.5 w-full hover:bg-blue-100 transition-colors shadow-2xs">
                          <Upload className="w-3 h-3 mb-0.5" />
                          <span className="text-[6.5px] font-bold uppercase leading-none">Upload Photo</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Application No placed below the photo box */}
                  <div className="flex items-center gap-1.5 pb-0.5 whitespace-nowrap">
                    <span className="font-bold text-slate-700 uppercase text-[9.5px]">APPLICATION NO:</span>
                    <span className="font-black px-1.5 py-0.5 bg-slate-100 border border-slate-400 rounded tracking-wider text-[10.5px] min-w-[76px] text-center inline-block text-slate-900">
                      {formData.id || '\u00A0'}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 1: INDUCTION CATEGORY & DETAILS */}
            <div className="space-y-1 font-sans">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-1 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,180,75)] text-[10.5px] uppercase tracking-wider">
                  1. INDUCTION CATEGORY & DETAILS
                </h3>
              </div>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Induction Type:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center gap-4">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={formData.inductionType === 'OwnerAttach'} 
                           readOnly 
                           className="h-3.5 w-3.5 rounded border-slate-400 text-amber-500 focus:ring-0" 
                        />
                        <span className="text-[10px] font-bold text-slate-900">OwnerAttach</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={formData.inductionType === 'DriverAttach'} 
                           readOnly 
                           className="h-3.5 w-3.5 rounded border-slate-400 text-amber-500 focus:ring-0" 
                        />
                        <span className="text-[10px] font-bold text-slate-900">DriverAttach</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex bg-white min-h-[24px]"></div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Owner ID:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.ownerId || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Owner Name:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900 truncate">
                        {formData.ownerName || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Owner Mobile:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.ownerMobile || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Reference:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900 italic">
                        {formData.reference || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 divide-y divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Owner Address:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900 leading-tight">
                        {formData.ownerAddress || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: VEHICLE DETAILS */}
            <div className="space-y-1 font-sans">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-1 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,180,75)] text-[10.5px] uppercase tracking-wider">
                  2. VEHICLE DETAILS
                </h3>
              </div>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Vehicle Reg. No:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-black tracking-wider border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[11px] text-slate-900">
                        {formData.vehicleNumber || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Make / Model:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.vehicleType || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Year of Mfd:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.mfdYear || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Fuel Type:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.fuelType || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      RC Registration Date:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.registrationDate || formData.rcExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Insurance Expiry:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.insuranceExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Permit Type/Expiry:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.permitExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Fitness Cert Expiry:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.fcExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: DRIVER & CONTACT DETAILS */}
            <div className="space-y-1 font-sans">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-1 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,180,75)] text-[10.5px] uppercase tracking-wider">
                  3. DRIVER & CONTACT DETAILS
                </h3>
              </div>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Driver Full Name:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.driverName || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Mobile Number:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.driverPhone || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Alt. Mobile No:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.driverAltPhone || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Email ID:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.driverEmail || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3 - Driver Emergency Contact Details */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Emergency Person Name:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.driverEmergencyContactName ? (
                          <>
                            {formData.driverEmergencyContactName}
                            {formData.driverEmergencyRelation && (
                              <span className="text-slate-600 font-semibold text-[9.5px] ml-1.5">
                                ({formData.driverEmergencyRelation})
                              </span>
                            )}
                          </>
                        ) : formData.driverEmergencyRelation ? (
                          <span className="text-slate-600 font-medium text-[9.5px] italic">
                            ({formData.driverEmergencyRelation})
                          </span>
                        ) : (
                          '\u00A0'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Emergency Number:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.driverEmergencyContactNumber || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Aadhaar Number:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.driverAadhaar || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      DL Number:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900 uppercase">
                        {formData.driverDlNumber || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      DL Validity Date:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.driverDlExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-start font-bold text-slate-700 text-[9.5px] shrink-0 mt-0.5">
                      Permanent Address:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900 leading-tight">
                        {formData.driverAddress || formData.driverArea || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: GPS & BANK ACCOUNT DETAILS */}
            <div className="space-y-1 font-sans">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-1 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,180,75)] text-[10.5px] uppercase tracking-wider">
                  4. GPS & BANK ACCOUNT DETAILS
                </h3>
              </div>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      GPS Device Vendor:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.gpsVendor || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      GPS IMEI Number:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.gpsImei || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Bank Name:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.bankName || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Account Holder:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.bankAccountHolder || formData.ownerName || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Account Number:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold tabular-nums border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {formData.bankAccountNumber || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      IFSC Code:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900 uppercase">
                        {formData.bankIfsc || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: VEHICLE INDUCTED FOR SITES */}
            <div className="space-y-1">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-1 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,180,75)] text-[10.5px] uppercase tracking-wider">
                  5. VEHICLE INDUCTED FOR SITES (OPERATIONAL LOCATIONS)
                </h3>
              </div>
              <p className="text-[9.5px] italic text-slate-500 ml-1">
                Operational site/client assigned from Master Register:
              </p>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Assigned Site:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {cleanSiteValue(formData.sitePreference1) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Site Preference 2:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {cleanSiteValue(formData.sitePreference2) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Site Preference 3:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {cleanSiteValue(formData.sitePreference3) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[24px]">
                    <div className="w-32 bg-slate-50 px-2.5 py-1 flex items-center font-bold text-slate-700 text-[9.5px] shrink-0">
                      Site Preference 4:
                    </div>
                    <div className="flex-1 bg-white px-2.5 py-1 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[16px] text-left text-[10.5px] text-slate-900">
                        {cleanSiteValue(formData.sitePreference4) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: DECLARATION & AUTHORIZATION */}
            <div className="space-y-1.5 pt-0.5">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-1 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,180,75)] text-[10.5px] uppercase tracking-wider">
                  6. DECLARATION & AUTHORIZATION
                </h3>
              </div>
              <p className="text-[9.5px] leading-relaxed text-slate-700 text-justify font-medium">
                I hereby declare that the details furnished above are true and correct to the best of my knowledge and belief. I undertake to intimate E7 TRAVELS immediately in case of any change in the statutory vehicle documents, driver deployment, bank accounts, or contact details.
              </p>

              {/* Signatures */}
              <div className="flex justify-between items-start pt-6 pb-0.5">
                <div className="text-center w-[260px] flex flex-col items-center">
                  <div className="w-full border-t border-dotted border-slate-500"></div>
                  <div className="pt-1 text-[9.5px] font-bold text-slate-700 uppercase tracking-wide">
                    Owner / Driver Signature
                  </div>
                </div>
                <div className="text-center w-[260px] flex flex-col items-center">
                  <div className="w-full border-t border-dotted border-slate-500"></div>
                  <div className="pt-1 text-[9.5px] font-bold text-slate-700 uppercase tracking-wide">
                    Authorized Signatory (E7 TRAVELS)
                  </div>
                </div>
              </div>
            </div>

            {/* Required Documents Checklist Footer box */}
            <div className="bg-amber-50/40 border border-amber-300 p-1.5 px-2.5 rounded-md text-[8.5px] leading-snug text-amber-950 font-medium mt-0.5">
              <strong className="text-amber-900 uppercase">Required Documents Checklist:</strong> Please attach clear photocopies of RC, Insurance, Permit, Fitness Certificate, Driver DL, Aadhaar Card, PAN Card, Police Verification Certificate, and a Cancelled Cheque/Bank Passbook along with this form.
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>,
    document.body
  );
}
