import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Enquiry, Site } from '../types';
import { Printer, X, Filter, Check, FileText } from 'lucide-react';

function formatDateToDDMMYYYY(dateStr: string | undefined | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const cleanStr = dateStr.trim();
  const yyyymmddRegex = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/;
  const match = cleanStr.match(yyyymmddRegex);
  if (match) {
    const [_, year, month, day] = match;
    const paddedDay = day.padStart(2, '0');
    const paddedMonth = month.padStart(2, '0');
    return `${paddedDay}-${paddedMonth}-${year}`;
  }
  return cleanStr;
}

interface PrintEnquiryReportProps {
  enquiries: Enquiry[];
  sites: Site[];
  onClose: () => void;
  initialStatusFilter?: string;
}

export default function PrintEnquiryReport({
  enquiries,
  sites,
  onClose,
  initialStatusFilter = 'all'
}: PrintEnquiryReportProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'id-asc' | 'id-desc' | 'date-newest' | 'date-oldest'>('date-newest');

  // Column Toggle States
  const [columns, setColumns] = useState({
    id: true,
    date: true,
    vehicleDetails: true,
    ownerDetails: true,
    driverDetails: true,
    preferences: true,
    status: true,
    remarks: true,
  });

  // Print Layout Customizations
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [emptyRemarksForNotes, setEmptyRemarksForNotes] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'auto' | '7px' | '8px' | '9px' | '10px' | '11px' | '12px'>('auto');

  // Automatically compute font size if "auto" is chosen based on number of columns selected & page orientation
  const getActualFontSize = (): string => {
    if (fontSize !== 'auto') return fontSize;
    const activeCount = Object.values(columns).filter(Boolean).length;
    const isPortrait = orientation === 'portrait';
    
    if (isPortrait) {
      if (activeCount >= 7) return '6.5px';
      if (activeCount >= 5) return '7.5px';
      if (activeCount >= 4) return '9px';
      return '10.5px';
    } else {
      if (activeCount >= 8) return '7px';
      if (activeCount >= 6) return '8.5px';
      if (activeCount >= 4) return '10px';
      return '11.5px';
    }
  };

  // Unique Vehicle Types in the data
  const vehicleTypes = Array.from(
    new Set(enquiries.map((e) => e.vehicleType).filter(Boolean))
  );

  // Apply Filtering & Sorting
  const filteredEnquiries = enquiries
    .filter((e) => {
      // Status
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      
      // Vehicle Type
      if (vehicleTypeFilter !== 'all' && e.vehicleType !== vehicleTypeFilter) return false;

      // Site Preference
      if (siteFilter !== 'all') {
        const matchesPref = 
          e.sitePreference1 === siteFilter || 
          e.sitePreference2 === siteFilter ||
          e.sitePreference3 === siteFilter ||
          e.sitePreference4 === siteFilter;
        if (!matchesPref) return false;
      }

      // Date Range
      if (startDate && e.enquiryDate && e.enquiryDate < startDate) return false;
      if (endDate && e.enquiryDate && e.enquiryDate > endDate) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (e.id || '').toLowerCase().includes(query) ||
          (e.vehicleNumber || '').toLowerCase().includes(query) ||
          (e.driverName || '').toLowerCase().includes(query) ||
          (e.ownerNamePhone || '').toLowerCase().includes(query) ||
          (e.alreadyRunningCompany || '').toLowerCase().includes(query) ||
          (e.remarks || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'id-asc') return a.id.localeCompare(b.id);
      if (sortBy === 'id-desc') return b.id.localeCompare(a.id);
      
      const dateA = a.enquiryDate || '';
      const dateB = b.enquiryDate || '';
      if (sortBy === 'date-newest') return dateB.localeCompare(dateA);
      if (sortBy === 'date-oldest') return dateA.localeCompare(dateB);
      return 0;
    });

  const [isInIframe, setIsInIframe] = useState(false);
  const [printError, setPrintError] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  useEffect(() => {
    document.body.classList.add('print-active');
    return () => {
      document.body.classList.remove('print-active');
    };
  }, []);

  const handlePrint = () => {
    try {
      setPrintError(false);
      window.focus();
      window.print();
    } catch (err) {
      console.error('Print failed:', err);
      setPrintError(true);
    }
  };

  const customLogo = localStorage.getItem('e7_custom_logo') || null;

  return createPortal(
    <div className="print-modal-root fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6 md:p-10 print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Helpful banner for users printing inside the iframe environment */}
      {isInIframe && (
        <div className="w-full max-w-6xl bg-amber-500 text-slate-950 p-3.5 text-xs font-extrabold rounded-lg mb-2 flex items-center justify-between border-2 border-amber-600 print:hidden shadow-md">
          <div className="flex items-center gap-2 text-left">
            <span className="text-sm shrink-0">💡</span>
            <span>
              Running inside Preview Panel? Please click <strong className="underline text-amber-950 font-black">"Open in New Tab"</strong> at the top-right corner of your screen to print perfectly. Browser security blocks print dialogs inside iframe previews.
            </span>
          </div>
        </div>
      )}

      {printError && (
        <div className="w-full max-w-6xl bg-rose-500 text-white p-3.5 text-xs font-extrabold rounded-lg mb-2 flex items-center justify-between border-2 border-rose-600 print:hidden shadow-md">
          <div className="flex items-center gap-2 text-left">
            <span className="text-sm shrink-0">⚠️</span>
            <span>
              Print blocked by browser security. Please click the "Open in New Tab" button in the top-right corner of the browser preview and print from there!
            </span>
          </div>
        </div>
      )}

      {/* Interactive Controls Bar - Hidden on print */}
      <div className="w-full max-w-6xl bg-slate-800 text-white rounded-t-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide uppercase">Print Enquiry Desk Report</h2>
            <p className="text-4xs text-slate-400 uppercase tracking-widest mt-0.5">
              Custom Filter & Design Layout Options
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>

      {/* Editor & Preview Side-by-Side (or stacked on mobile) - Editor Hidden on Print */}
      <div className="w-full max-w-6xl bg-slate-100 flex flex-col md:flex-row shadow-2xl overflow-visible print:shadow-none print:bg-white print:block rounded-b-xl border border-slate-200">
        
        {/* Filter Selection Panel (Left side in desktop, hidden on print) */}
        <div className="w-full md:w-80 bg-white border-r border-slate-200 p-5 shrink-0 overflow-y-auto max-h-[1100px] print:hidden">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Filter className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Configure Print Filters</h3>
          </div>
          
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Keywords</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="Reg No, Driver, Remarks..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Call Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Call Leads</option>
                <option value="New">New</option>
                <option value="Interested">Interested</option>
                <option value="Site Offered">Site Offered</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle Type</label>
              <select
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Vehicle Types</option>
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Site Preference</label>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Sites</option>
                <option value="Open Preference">Open Preference</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">From</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">To</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="date-newest">Date (Newest First)</option>
                <option value="date-oldest">Date (Oldest First)</option>
                <option value="id-asc">Enquiry ID (A-Z)</option>
                <option value="id-desc">Enquiry ID (Z-A)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Column Toggle Visibility</span>
              <div className="space-y-2 text-xs">
                {Object.entries(columns).map(([col, val]) => {
                  let labelText = col;
                  if (col === 'id') labelText = 'Enquiry ID';
                  if (col === 'date') labelText = 'Call Date';
                  if (col === 'vehicleDetails') labelText = 'Vehicle Details';
                  if (col === 'ownerDetails') labelText = 'Owner Details (Full)';
                  if (col === 'driverDetails') labelText = 'Driver Details (Full)';
                  if (col === 'preferences') labelText = 'Preferences & Bank';
                  if (col === 'status') labelText = 'Status';
                  if (col === 'remarks') labelText = 'Remarks / Notes';

                  return (
                    <label key={col} className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={() => setColumns({ ...columns, [col]: !val })}
                        className="h-3.5 w-3.5 rounded text-indigo-600 border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-700 capitalize">{labelText}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Page & Print Layout</span>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Page Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="orientation-portrait"
                    onClick={() => setOrientation('portrait')}
                    className={`px-3 py-1.5 rounded text-xs font-black border transition-all ${
                      orientation === 'portrait'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📄 Portrait Mode
                  </button>
                  <button
                    type="button"
                    id="orientation-landscape"
                    onClick={() => setOrientation('landscape')}
                    className={`px-3 py-1.5 rounded text-xs font-black border transition-all ${
                      orientation === 'landscape'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📋 Landscape Mode
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal italic">
                  Changes the print output layout structure.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Print Font Size</label>
                <select
                  id="print-font-size-select"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                >
                  <option value="auto">Auto-Fit (Recommended)</option>
                  <option value="7px">Extra Small (7px)</option>
                  <option value="8px">Small (8px)</option>
                  <option value="9px">Medium-Small (9px)</option>
                  <option value="10px">Regular (10px)</option>
                  <option value="11px">Medium-Large (11px)</option>
                  <option value="12px">Large (12px)</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal italic">
                  Automatically fits font size as you toggle active columns on/off.
                </p>
              </div>

              <div>
                <label className="flex items-start gap-2 cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    id="empty-remarks-notes"
                    checked={emptyRemarksForNotes}
                    onChange={() => setEmptyRemarksForNotes(!emptyRemarksForNotes)}
                    className="h-3.5 w-3.5 rounded text-indigo-600 border-slate-300 focus:ring-0 cursor-pointer mt-0.5"
                  />
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-700">Empty Remarks Column</span>
                    <span className="block text-[9px] text-slate-400 leading-normal">
                      Hides remarks text & prints empty spaces so you can write hand-written notes.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Paper Layout Sheet */}
        <div 
          ref={printAreaRef}
          className="print-sheet flex-1 bg-white p-6 sm:p-10 font-sans text-slate-900 border border-slate-200 shadow-lg mx-auto rounded relative print:p-0 print:m-0 print:w-full print:shadow-none overflow-x-auto transition-all duration-300"
          style={{ 
            width: '100%',
            maxWidth: orientation === 'landscape' ? '297mm' : '210mm',
            minHeight: orientation === 'landscape' ? '210mm' : '297mm',
            boxSizing: 'border-box' 
          }}
        >
          {/* Print specific CSS override injected directly */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide standard root layout and non-print dialog elements */
              #root, body > div:not(.print-modal-root) {
                display: none !important;
              }
              
              /* Force the print modal portal to expand to full width and act as a standard block */
              .print-modal-root {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                display: block !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
              }

              /* Unconstrain and remove max-width limit on the direct nested wrapper of the portal */
              .print-modal-root > div {
                display: block !important;
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
              }

              @page {
                size: A4 ${orientation};
                margin: 0.6cm 0.8cm 0.6cm 0.8cm !important;
              }

              html, body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-size: ${getActualFontSize()} !important;
                line-height: 1.25 !important;
                overflow: visible !important;
                width: 100% !important;
                height: auto !important;
              }

              .print-sheet {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                min-height: auto !important;
                height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                background: white !important;
                border: none !important;
                box-shadow: none !important;
                overflow: visible !important;
              }

              .print-container {
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
              }

              .print-container table {
                width: 100% !important;
                max-width: 100% !important;
                font-size: ${getActualFontSize()} !important;
                border-collapse: collapse !important;
                table-layout: fixed !important; /* Force columns to respect table limits */
              }

              .print-container th, .print-container td {
                word-wrap: break-word !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                white-space: normal !important;
                padding: 5px 6px !important;
              }

              .print-container th {
                font-size: calc(${getActualFontSize()} + 0.5px) !important;
                background-color: #f1f5f9 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .print-container td {
                font-size: ${getActualFontSize()} !important;
              }

              .print\\:hidden, [print\\:hidden] {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}} />

          {/* Also inject print styles into screen preview wrapper so user can see auto-scaling */}
          <div 
            className="print-container space-y-6 text-left text-xs leading-relaxed"
            style={{ fontSize: getActualFontSize() }}
          >
            
            {/* Header Branding */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                {customLogo ? (
                  <img 
                    src={customLogo} 
                    alt="E7 Travels" 
                    className="h-12 w-12 object-contain" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-black text-lg border border-slate-950 shrink-0">
                    E7
                  </div>
                )}
                <div>
                  <h1 className="font-serif font-black tracking-wider text-amber-600 uppercase leading-none" style={{ fontSize: '18px' }}>
                    E7 TRAVELS
                  </h1>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Chennai Fleet Hub & Operator</p>
                </div>
              </div>

              <div className="text-right">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Enquiry Desk Report</h2>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Generated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
            </div>

            {/* Applied Filters Info Bar */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-wide">
              <span>Applied Filters:</span>
              <span>Status: <span className="text-indigo-600">{statusFilter}</span></span>
              <span>Vehicle Type: <span className="text-amber-700">{vehicleTypeFilter}</span></span>
              <span>Site Preference: <span className="text-emerald-700">{siteFilter}</span></span>
              {startDate && <span>From: <span className="text-slate-800">{formatDateToDDMMYYYY(startDate)}</span></span>}
              {endDate && <span>To: <span className="text-slate-800">{formatDateToDDMMYYYY(endDate)}</span></span>}
              {searchQuery && <span>Search: <span className="text-rose-700">"{searchQuery}"</span></span>}
              <span className="ml-auto">Records: <span className="text-indigo-600">{filteredEnquiries.length}</span></span>
            </div>

            {/* Results Table */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left text-2xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-extrabold uppercase text-[10px] text-slate-700 tracking-wider">
                    {columns.id && <th className="py-2.5 px-2 border-r border-slate-300 w-[6%] text-center">ID</th>}
                    {columns.date && <th className="py-2.5 px-2 border-r border-slate-300 w-[9%] text-center">Date</th>}
                    {columns.vehicleDetails && <th className="py-2.5 px-3 border-r border-slate-300 w-[19%]">Vehicle Details</th>}
                    {columns.ownerDetails && <th className="py-2.5 px-3 border-r border-slate-300 w-[15%]">Owner Details (Full)</th>}
                    {columns.driverDetails && <th className="py-2.5 px-3 border-r border-slate-300 w-[19%]">Driver Details (Full)</th>}
                    {columns.preferences && <th className="py-2.5 px-3 border-r border-slate-300 w-[15%]">Preferences & Bank</th>}
                    {columns.status && <th className="py-2.5 px-2 border-r border-slate-300 w-[8%] text-center">Status</th>}
                    {columns.remarks && <th className="py-2.5 px-2 w-[11%]">Remarks / Notes</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEnquiries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-bold uppercase italic tracking-wider">
                        No enquiry records found matching the specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEnquiries.map((enq) => {
                      let statusBadge = '';
                      if (enq.status === 'New') statusBadge = 'text-amber-600 border-amber-200 bg-amber-50';
                      if (enq.status === 'Interested') statusBadge = 'text-blue-600 border-blue-200 bg-blue-50';
                      if (enq.status === 'Site Offered') statusBadge = 'text-emerald-600 border-emerald-200 bg-emerald-50';
                      if (enq.status === 'Closed') statusBadge = 'text-slate-500 border-slate-200 bg-slate-50';

                      return (
                        <tr key={enq.id} className="hover:bg-slate-50/50 align-top">
                          {columns.id && (
                            <td className="py-2 px-2 border-r border-slate-200 font-mono font-bold text-slate-700 text-center">
                              {enq.id}
                            </td>
                          )}
                          {columns.date && (
                            <td className="py-2 px-2 border-r border-slate-200 text-center font-mono text-slate-600">
                              {formatDateToDDMMYYYY(enq.enquiryDate)}
                            </td>
                          )}
                          
                          {/* Vehicle Details */}
                          {columns.vehicleDetails && (
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-700 leading-normal text-[0.95em]">
                              {/* Registration Number License Plate style */}
                              <div className="inline-block px-1.5 py-0.5 border border-slate-800 bg-slate-50 font-mono font-black text-[1em] uppercase tracking-wider rounded mb-1 text-slate-900">
                                {enq.vehicleNumber}
                              </div>
                              <div className="space-y-0.5">
                                <div><span className="font-extrabold text-slate-500">Model/Year:</span> <span className="font-bold text-slate-900">{enq.vehicleType}</span> • {enq.vehicleModelYear || '-'}{enq.vehicleColor ? ` (${enq.vehicleColor})` : ''}</div>
                                {enq.fuelType && <div><span className="font-extrabold text-slate-500">Fuel:</span> <span className="font-bold">{enq.fuelType}</span></div>}
                                
                                {/* Fallback if dedicated Owner Details column is hidden */}
                                {!columns.ownerDetails && (
                                  <div><span className="font-extrabold text-slate-500">Owner:</span> <span className="font-bold text-slate-850">{enq.ownerNamePhone}</span></div>
                                )}
                                
                                {enq.reference && <div><span className="font-extrabold text-slate-500">Reference:</span> {enq.reference}</div>}
                                
                                {/* Document Expiry Dates */}
                                {(enq.rcExpiry || enq.insuranceExpiry || enq.permitExpiry || enq.fcExpiry) && (
                                  <div className="mt-1 pt-1 border-t border-dashed border-slate-200 text-[0.85em] text-slate-600 grid grid-cols-2 gap-x-2">
                                    {enq.rcExpiry && <div><span className="font-bold text-slate-400">RC Exp:</span> {formatDateToDDMMYYYY(enq.rcExpiry)}</div>}
                                    {enq.insuranceExpiry && <div><span className="font-bold text-slate-400">Ins Exp:</span> {formatDateToDDMMYYYY(enq.insuranceExpiry)}</div>}
                                    {enq.permitExpiry && <div><span className="font-bold text-slate-400">Permit Exp:</span> {formatDateToDDMMYYYY(enq.permitExpiry)}</div>}
                                    {enq.fcExpiry && <div><span className="font-bold text-slate-400">FC Exp:</span> {formatDateToDDMMYYYY(enq.fcExpiry)}</div>}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Owner Details (Full) */}
                          {columns.ownerDetails && (
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-700 leading-normal text-[0.95em]">
                              <div className="font-black text-slate-900 text-[1.05em] mb-1">
                                {enq.ownerName || enq.ownerNamePhone?.split('-')[0]?.trim() || 'N/A'}
                              </div>
                              <div className="space-y-0.5 text-slate-650">
                                <div><span className="font-extrabold text-slate-500">Phone:</span> <span className="font-mono font-bold text-indigo-700">{enq.ownerMobile || enq.ownerNamePhone?.split('-')[1]?.trim() || '-'}</span></div>
                                {enq.ownerId && <div><span className="font-extrabold text-slate-500">Owner ID:</span> <span className="font-mono text-[0.85em] text-indigo-600 bg-slate-100 px-1 py-0.5 rounded">{enq.ownerId}</span></div>}
                                {enq.inductionType && (
                                  <div>
                                    <span className="font-extrabold text-slate-500">Type:</span>{' '}
                                    <span className="text-emerald-700 font-bold uppercase text-[0.85em]">
                                      {enq.inductionType === 'OwnerAttach' ? 'Owner Attached' : 'Driver Attached'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Driver Details (Full) */}
                          {columns.driverDetails && (
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-700 leading-normal text-[0.95em]">
                              <div className="font-black text-slate-900 text-[1.05em] mb-1">
                                {enq.driverName} {enq.driverAge ? <span className="text-[0.9em] font-bold text-slate-500">(Age: {enq.driverAge})</span> : ''}
                              </div>
                              <div className="space-y-0.5">
                                <div><span className="font-extrabold text-slate-500">Phone:</span> <span className="font-mono font-bold text-indigo-700">{enq.driverPhone || '-'}</span>{enq.driverAltPhone ? <span className="font-mono text-slate-500 text-[0.85em]"> / {enq.driverAltPhone}</span> : ''}</div>
                                {enq.driverEmail && <div><span className="font-extrabold text-slate-500">Email:</span> <span className="font-mono">{enq.driverEmail}</span></div>}
                                <div><span className="font-extrabold text-slate-500">Area:</span> <span className="font-bold">{enq.driverArea || '-'}</span></div>
                                <div><span className="font-extrabold text-slate-500">Batch Exp:</span> <span className="font-semibold text-amber-700">{enq.driverBatchExp || '-'}</span></div>
                                
                                {/* Extra driver fields */}
                                {enq.driverAadhaar && <div><span className="font-extrabold text-slate-500">Aadhaar:</span> <span className="font-mono text-slate-600">{enq.driverAadhaar}</span></div>}
                                {enq.driverDlNumber && (
                                  <div>
                                    <span className="font-extrabold text-slate-500">DL:</span> <span className="font-mono text-slate-800 font-bold">{enq.driverDlNumber}</span>
                                    {enq.driverDlExpiry && <span className="text-slate-500 text-[0.85em]"> (Exp: {formatDateToDDMMYYYY(enq.driverDlExpiry)})</span>}
                                  </div>
                                )}
                                {enq.driverAddress && <div className="text-[0.85em] italic text-slate-500 mt-0.5 leading-tight"><span className="font-extrabold text-slate-400 not-italic">Address:</span> {enq.driverAddress}</div>}
                              </div>
                            </td>
                          )}

                          {/* Preferences & Bank details */}
                          {columns.preferences && (
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-700 leading-normal text-[0.9em]">
                              {enq.alreadyRunningCompany && (
                                <div className="mb-1 px-1 py-0.5 bg-orange-50 text-orange-800 border border-orange-150 rounded font-extrabold text-[0.85em] inline-block uppercase">
                                  🏢 Running: {enq.alreadyRunningCompany}
                                </div>
                              )}
                              
                              {/* Site Preferences */}
                              <div className="space-y-0.5 mb-1.5 text-slate-650">
                                <div><span className="font-bold text-slate-500">Preference 1:</span> <span className="font-extrabold text-emerald-700">{enq.sitePreference1 || 'Open Preference'}</span></div>
                                {enq.sitePreference2 && enq.sitePreference2 !== 'Open Preference' && <div><span className="font-bold text-slate-400">Preference 2:</span> {enq.sitePreference2}</div>}
                                {enq.sitePreference3 && enq.sitePreference3 !== 'Open Preference' && <div><span className="font-bold text-slate-400">Preference 3:</span> {enq.sitePreference3}</div>}
                                {enq.sitePreference4 && enq.sitePreference4 !== 'Open Preference' && <div><span className="font-bold text-slate-400">Preference 4:</span> {enq.sitePreference4}</div>}
                              </div>

                              {/* GPS Details */}
                              {(enq.gpsVendor || enq.gpsImei) && (
                                <div className="mb-1.5 text-[0.85em] bg-slate-50 p-1 rounded border border-slate-150">
                                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[0.75em]">GPS Hardware:</span>
                                  {enq.gpsVendor && <div>Vendor: <span className="font-bold text-slate-700">{enq.gpsVendor}</span></div>}
                                  {enq.gpsImei && <div>IMEI: <span className="font-mono text-slate-600">{enq.gpsImei}</span></div>}
                                </div>
                              )}

                              {/* Bank Details */}
                              {(enq.bankName || enq.bankAccountNumber) && (
                                <div className="text-[0.85em] bg-indigo-50/50 p-1 rounded border border-indigo-100">
                                  <span className="font-bold text-indigo-700 block uppercase tracking-wider text-[0.75em]">Bank Account:</span>
                                  {enq.bankName && <div><span className="text-slate-500">Bank:</span> <span className="font-bold">{enq.bankName}</span></div>}
                                  {enq.bankAccountHolder && <div><span className="text-slate-500">Holder:</span> {enq.bankAccountHolder}</div>}
                                  {enq.bankAccountNumber && <div><span className="text-slate-500">A/C:</span> <span className="font-mono font-bold text-slate-800">{enq.bankAccountNumber}</span></div>}
                                  {enq.bankIfsc && <div><span className="text-slate-500">IFSC:</span> <span className="font-mono text-slate-600 font-bold">{enq.bankIfsc}</span></div>}
                                </div>
                              )}
                            </td>
                          )}

                          {/* Status */}
                          {columns.status && (
                            <td className="py-2 px-2 border-r border-slate-200 text-center whitespace-nowrap">
                              <span className={`px-2 py-1 text-[0.85em] font-black uppercase rounded-md border ${statusBadge} shadow-3xs`}>
                                {enq.status}
                              </span>
                            </td>
                          )}

                          {/* Remarks / Comments */}
                          {columns.remarks && (
                            <td className="py-2 px-3 text-slate-650 text-[0.9em] leading-tight max-w-[180px] min-w-[140px] align-middle">
                              {emptyRemarksForNotes ? (
                                /* Ruled lines / dotted lines for hand-written notes after printing */
                                <div className="w-full flex flex-col justify-center gap-2.5 py-1 select-none">
                                  <div className="border-b border-dotted border-slate-300 w-full h-4"></div>
                                  <div className="border-b border-dotted border-slate-300 w-full h-4"></div>
                                  <div className="border-b border-dotted border-slate-300 w-full h-4"></div>
                                </div>
                              ) : (
                                <>
                                  {enq.remarks ? (
                                    <div className="italic font-medium text-slate-700">"{enq.remarks}"</div>
                                  ) : (
                                    <span className="text-slate-400 italic">-</span>
                                  )}
                                  
                                  {/* Display interactive comments as well! */}
                                  {enq.comments && enq.comments.length > 0 && (
                                    <div className="mt-1.5 space-y-1 pt-1.5 border-t border-slate-100">
                                      <span className="text-[0.75em] font-bold text-slate-400 uppercase tracking-widest block">Follow-up Notes:</span>
                                      {enq.comments.map((comment, idx) => (
                                        <div key={idx} className="text-[0.8em] leading-tight text-slate-500 border-l border-slate-300 pl-1">
                                          <span className="font-bold text-slate-600">{comment.author}:</span> {comment.text} <span className="text-[0.7em] text-slate-400 font-mono">({formatDateToDDMMYYYY(comment.date)})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Statistics Panel */}
            <div className="grid grid-cols-5 gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="text-center border-r border-slate-200 last:border-0 py-1">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Total Records</span>
                <span className="text-sm font-bold text-slate-800">{filteredEnquiries.length}</span>
              </div>
              <div className="text-center border-r border-slate-200 last:border-0 py-1">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">New</span>
                <span className="text-sm font-bold text-amber-600">{filteredEnquiries.filter(e => e.status === 'New').length}</span>
              </div>
              <div className="text-center border-r border-slate-200 last:border-0 py-1">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Interested</span>
                <span className="text-sm font-bold text-blue-600">{filteredEnquiries.filter(e => e.status === 'Interested').length}</span>
              </div>
              <div className="text-center border-r border-slate-200 last:border-0 py-1">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Site Offered</span>
                <span className="text-sm font-bold text-emerald-600">{filteredEnquiries.filter(e => e.status === 'Site Offered').length}</span>
              </div>
              <div className="text-center border-r border-slate-200 last:border-0 py-1">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Closed</span>
                <span className="text-sm font-bold text-slate-500">{filteredEnquiries.filter(e => e.status === 'Closed').length}</span>
              </div>
            </div>

            {/* Print Signatures Block */}
            <div className="pt-8 flex justify-between text-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <div className="w-56">
                <div className="border-t border-slate-300 pt-1.5">Prepared By</div>
                <div className="text-[8px] text-slate-400 font-mono mt-0.5">ERP Clerk</div>
              </div>
              <div className="w-56">
                <div className="border-t border-slate-300 pt-1.5">Verified By</div>
                <div className="text-[8px] text-slate-400 font-mono mt-0.5">Fleet Supervisor</div>
              </div>
              <div className="w-56">
                <div className="border-t border-slate-300 pt-1.5">Approved Signature</div>
                <div className="text-[8px] text-slate-400 font-mono mt-0.5">Hub Manager</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
