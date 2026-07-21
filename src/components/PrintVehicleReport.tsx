import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Vehicle } from '../types';
import { Printer, X, Filter, Check } from 'lucide-react';

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

interface PrintVehicleReportProps {
  vehicles: Vehicle[];
  onClose: () => void;
  initialFilter?: 'all' | 'running' | 'idle' | 'new';
}

export default function PrintVehicleReport({
  vehicles,
  onClose,
  initialFilter = 'all'
}: PrintVehicleReportProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'running' | 'idle' | 'new'>(initialFilter);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [fuelFilter, setFuelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'reg-asc' | 'reg-desc' | 'date-newest' | 'date-oldest'>('reg-asc');

  // Column Toggle States
  const [columns, setColumns] = useState({
    regNo: true,
    details: true,
    owner: true,
    driver: true,
    assignment: true,
    status: true,
    expiries: true,
    joiningEmi: true,
    remarks: true,
  });

  // Print Layout Customizations
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [emptyRemarksForNotes, setEmptyRemarksForNotes] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'auto' | '7px' | '8px' | '9px' | '10px' | '11px' | '12px'>('auto');

  // Compute font size based on active columns and orientation
  const getActualFontSize = (): string => {
    if (fontSize !== 'auto') return fontSize;
    const activeCount = Object.values(columns).filter(Boolean).length;
    const isPortrait = orientation === 'portrait';
    
    if (isPortrait) {
      if (activeCount >= 8) return '6.5px';
      if (activeCount >= 6) return '7.5px';
      if (activeCount >= 4) return '9px';
      return '10px';
    } else {
      if (activeCount >= 8) return '7px';
      if (activeCount >= 6) return '8.5px';
      if (activeCount >= 4) return '10px';
      return '11px';
    }
  };

  // Unique Vehicle Types & Fuels in the dataset
  const vehicleTypes = Array.from(new Set(vehicles.map((v) => v.vehicleType).filter(Boolean)));
  const fuelTypes = Array.from(new Set(vehicles.map((v) => v.fuelType).filter(Boolean)));

  // Filter & Sort
  const filteredVehicles = vehicles
    .filter((v) => {
      // 1. Vehicle filter types (Total, Running, Idle, New)
      if (filterType === 'running' && v.status !== 'Active') return false;
      if (filterType === 'idle' && v.status === 'Active') return false;
      if (filterType === 'new') {
        const currentMonth = '2026-07'; // Match matching logic in MasterViews.tsx
        if (!v.joiningDate || !v.joiningDate.startsWith(currentMonth)) return false;
      }

      // 2. Additional filters
      if (vehicleTypeFilter !== 'all' && v.vehicleType !== vehicleTypeFilter) return false;
      if (fuelFilter !== 'all' && v.fuelType !== fuelFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (v.registrationNumber || '').toLowerCase().includes(query) ||
          (v.model || '').toLowerCase().includes(query) ||
          (v.manufacturer || '').toLowerCase().includes(query) ||
          (v.ownerName || '').toLowerCase().includes(query) ||
          (v.driverName || '').toLowerCase().includes(query) ||
          (v.company || '').toLowerCase().includes(query) ||
          (v.site || '').toLowerCase().includes(query) ||
          (v.remarks || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'reg-asc') return a.registrationNumber.localeCompare(b.registrationNumber);
      if (sortBy === 'reg-desc') return b.registrationNumber.localeCompare(a.registrationNumber);
      
      const dateA = a.joiningDate || '';
      const dateB = b.joiningDate || '';
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
      
      {/* Helpful banner for iframe preview environment */}
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

      {/* Interactive Controls Bar */}
      <div className="w-full max-w-6xl bg-slate-800 text-white rounded-t-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 text-white rounded-lg">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide uppercase">Print Vehicle Master Report</h2>
            <p className="text-4xs text-slate-400 uppercase tracking-widest mt-0.5">
              Filters & Customizable Layout Options
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer"
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

      {/* Editor & Preview Split */}
      <div className="w-full max-w-6xl bg-slate-100 flex flex-col md:flex-row shadow-2xl overflow-visible print:shadow-none print:bg-white print:block rounded-b-xl border border-slate-200">
        
        {/* Left Filters Panel */}
        <div className="w-full md:w-80 bg-white border-r border-slate-200 p-5 shrink-0 overflow-y-auto max-h-[1100px] print:hidden">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Filter className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Report Controls</h3>
          </div>
          
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fleet Filter</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Total Vehicles (All)</option>
                <option value="running">Running Vehicles (Active)</option>
                <option value="idle">Inactive Vehicles</option>
                <option value="new">New Vehicles (This Month)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Keywords</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Reg No, Owner, Driver, Site..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vehicle Category</label>
              <select
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fuel Type</label>
              <select
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Fuels</option>
                {fuelTypes.map((fuel) => (
                  <option key={fuel} value={fuel}>{fuel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="reg-asc">Reg No (A to Z)</option>
                <option value="reg-desc">Reg No (Z to A)</option>
                <option value="date-newest">Joining Date (Newest)</option>
                <option value="date-oldest">Joining Date (Oldest)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Column Visibility</span>
              <div className="space-y-2 text-xs">
                {Object.entries(columns).map(([col, val]) => {
                  let labelText = col;
                  if (col === 'regNo') labelText = 'Registration Number';
                  if (col === 'details') labelText = 'Vehicle Specs';
                  if (col === 'owner') labelText = 'Owner Name';
                  if (col === 'driver') labelText = 'Driver Name';
                  if (col === 'assignment') labelText = 'Company & Site';
                  if (col === 'status') labelText = 'Status';
                  if (col === 'expiries') labelText = 'Insurance & Permits';
                  if (col === 'joiningEmi') labelText = 'Joining & EMI info';
                  if (col === 'remarks') labelText = 'Remarks / Notes';

                  return (
                    <label key={col} className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={() => setColumns({ ...columns, [col]: !val })}
                        className="h-3.5 w-3.5 rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-700">{labelText}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Page & Layout</span>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Page Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`px-3 py-1.5 rounded text-xs font-black border transition-all ${
                      orientation === 'portrait'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📄 Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`px-3 py-1.5 rounded text-xs font-black border transition-all ${
                      orientation === 'landscape'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📋 Landscape
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Print Font Size</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-700"
                >
                  <option value="auto">Auto-Fit</option>
                  <option value="7px">Extra Small (7px)</option>
                  <option value="8px">Small (8px)</option>
                  <option value="9px">Medium-Small (9px)</option>
                  <option value="10px">Regular (10px)</option>
                  <option value="11px">Medium-Large (11px)</option>
                  <option value="12px">Large (12px)</option>
                </select>
              </div>

              <div>
                <label className="flex items-start gap-2 cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={emptyRemarksForNotes}
                    onChange={() => setEmptyRemarksForNotes(!emptyRemarksForNotes)}
                    className="h-3.5 w-3.5 rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer mt-0.5"
                  />
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-700">Empty Remarks Space</span>
                    <span className="block text-[9px] text-slate-400 leading-normal">
                      Prints empty dotted rows in remarks column to write hand-written updates.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Paper Sheet */}
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
          {/* Print CSS overrides */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              #root, body > div:not(.print-modal-root) {
                display: none !important;
              }
              
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
                table-layout: fixed !important;
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

          {/* Paper layout */}
          <div 
            className="print-container space-y-6 text-left text-xs leading-relaxed"
            style={{ fontSize: getActualFontSize() }}
          >
            {/* Header */}
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
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-lg border border-blue-700 shrink-0">
                    E7
                  </div>
                )}
                <div>
                  <h1 className="font-sans font-black tracking-wider text-blue-600 uppercase leading-none text-lg">
                    E7 TRAVELS
                  </h1>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Master Register Fleet Report</p>
                </div>
              </div>

              <div className="text-right">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Vehicle Master Report</h2>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Generated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
              </div>
            </div>

            {/* Filter tags bar */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-wide">
              <span>Applied Filters:</span>
              <span>Filter: <span className="text-blue-600 font-black">{filterType === 'all' ? 'Total Vehicles' : filterType === 'running' ? 'Running Vehicles' : filterType === 'idle' ? 'Inactive Vehicles' : 'New Vehicles'}</span></span>
              <span>Vehicle Specs: <span className="text-indigo-600">{vehicleTypeFilter}</span></span>
              <span>Fuel: <span className="text-amber-700">{fuelFilter}</span></span>
              {searchQuery && <span>Search Query: <span className="text-rose-700">"{searchQuery}"</span></span>}
              <span className="ml-auto font-black text-slate-900">Total Records: <span className="text-blue-600">{filteredVehicles.length}</span></span>
            </div>

            {/* Main Table */}
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left text-2xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-extrabold uppercase text-[9px] text-slate-700 tracking-wider">
                    {columns.regNo && <th className="py-2 px-2.5 border-r border-slate-300 w-[12%] text-center">Reg Number</th>}
                    {columns.details && <th className="py-2 px-2.5 border-r border-slate-300 w-[16%]">Model / Specs</th>}
                    {columns.owner && <th className="py-2 px-2.5 border-r border-slate-300 w-[14%]">Owner</th>}
                    {columns.driver && <th className="py-2 px-2.5 border-r border-slate-300 w-[14%]">Driver</th>}
                    {columns.assignment && <th className="py-2 px-2.5 border-r border-slate-300 w-[16%]">Site & Company</th>}
                    {columns.status && <th className="py-2 px-2 border-r border-slate-300 w-[8%] text-center">Status</th>}
                    {columns.joiningEmi && <th className="py-2 px-2.5 border-r border-slate-300 w-[13%]">Joining / EMI</th>}
                    {columns.expiries && <th className="py-2 px-2.5 border-r border-slate-300 w-[13%]">Expiries</th>}
                    {columns.remarks && <th className="py-2 px-2.5 w-[14%]">Remarks</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-bold uppercase italic tracking-wider">
                        No vehicle records matched the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => {
                      const isActive = v.status === 'Active';
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/50 align-top">
                          {columns.regNo && (
                            <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-center">
                              <div className="inline-block px-1.5 py-0.5 border border-slate-850 bg-slate-50 font-black text-[1.05em] uppercase rounded text-slate-950 tracking-wider">
                                {v.registrationNumber}
                              </div>
                              <div className="text-[0.75em] text-slate-400 font-bold uppercase mt-1">ID: {v.id}</div>
                            </td>
                          )}

                          {columns.details && (
                            <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                              <div className="font-bold text-slate-900">{v.manufacturer} {v.model}</div>
                              <div className="text-slate-500 text-[0.9em] mt-0.5 space-y-0.5">
                                <div><span className="font-bold">Type:</span> {v.vehicleType}</div>
                                <div><span className="font-bold">Year:</span> {v.year} • <span className="font-bold text-slate-700">{v.fuelType}</span></div>
                                <div><span className="font-bold">Trans:</span> {v.transmission}</div>
                              </div>
                            </td>
                          )}

                          {columns.owner && (
                            <td className="py-2 px-2.5 border-r border-slate-200">
                              <div className="font-bold text-slate-850">{v.ownerName || '-'}</div>
                              <div className="text-slate-400 font-mono text-[0.8em] mt-0.5">ID: {v.ownerId || '-'}</div>
                            </td>
                          )}

                          {columns.driver && (
                            <td className="py-2 px-2.5 border-r border-slate-200">
                              <div className="font-bold text-slate-850">{v.driverName || '-'}</div>
                              <div className="text-slate-400 font-mono text-[0.8em] mt-0.5">ID: {v.driverId || '-'}</div>
                            </td>
                          )}

                          {columns.assignment && (
                            <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                              <div className="font-bold text-slate-900 uppercase text-[0.9em]">{v.company || 'Not Assigned'}</div>
                              <div className="text-slate-500 font-semibold text-[0.85em]">{v.site || 'Open Site'}</div>
                              {(v.company2 || v.site2) && (
                                <div className="mt-1 pt-1 border-t border-dashed border-slate-150 text-[0.8em] text-slate-500">
                                  {v.company2 && <div>Alt Co: {v.company2}</div>}
                                  {v.site2 && <div>Alt Site: {v.site2}</div>}
                                </div>
                              )}
                            </td>
                          )}

                          {columns.status && (
                            <td className="py-2 px-2 border-r border-slate-200 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[0.85em] font-black uppercase rounded-md border ${
                                isActive ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-amber-700 border-amber-200 bg-amber-50'
                              }`}>
                                {v.status}
                              </span>
                            </td>
                          )}

                          {columns.joiningEmi && (
                            <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700">
                              <div className="space-y-0.5">
                                <div><span className="font-bold text-slate-400">Join:</span> {formatDateToDDMMYYYY(v.joiningDate)}</div>
                                {v.emiAmount > 0 ? (
                                  <>
                                    <div className="font-bold text-slate-900">EMI: ₹{v.emiAmount.toLocaleString('en-IN')}</div>
                                    <div className="text-rose-600 text-[0.85em]"><span className="font-bold text-slate-400">Due:</span> {formatDateToDDMMYYYY(v.emiDueDate)}</div>
                                  </>
                                ) : (
                                  <div className="text-slate-400 italic">No EMI</div>
                                )}
                              </div>
                            </td>
                          )}

                          {columns.expiries && (
                            <td className="py-2 px-2.5 border-r border-slate-200 text-[0.9em] space-y-0.5 text-slate-600">
                              {v.insuranceExpiry && <div><span className="font-bold text-slate-400">Ins:</span> {formatDateToDDMMYYYY(v.insuranceExpiry)}</div>}
                              {v.permitExpiry && <div><span className="font-bold text-slate-400">Pmt:</span> {formatDateToDDMMYYYY(v.permitExpiry)}</div>}
                              {v.fcExpiry && <div><span className="font-bold text-slate-400">FC:</span> {formatDateToDDMMYYYY(v.fcExpiry)}</div>}
                              {v.pollutionExpiry && <div><span className="font-bold text-slate-400">Pol:</span> {formatDateToDDMMYYYY(v.pollutionExpiry)}</div>}
                            </td>
                          )}

                          {columns.remarks && (
                            <td className="py-2 px-2.5 text-[0.9em] text-slate-650 leading-tight">
                              {emptyRemarksForNotes ? (
                                <div className="flex flex-col gap-2 py-1 select-none">
                                  <div className="border-b border-dotted border-slate-300 h-3"></div>
                                  <div className="border-b border-dotted border-slate-300 h-3"></div>
                                  <div className="border-b border-dotted border-slate-300 h-3"></div>
                                </div>
                              ) : (
                                v.remarks || <span className="text-slate-400 italic">-</span>
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

            {/* Statistics Row */}
            <div className="grid grid-cols-5 gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
              <div className="text-center border-r border-slate-200 py-1 last:border-r-0">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Total Filtered</span>
                <span className="text-sm font-bold text-slate-800">{filteredVehicles.length}</span>
              </div>
              <div className="text-center border-r border-slate-200 py-1 last:border-r-0">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Active (Running)</span>
                <span className="text-sm font-bold text-emerald-600">{filteredVehicles.filter(v => v.status === 'Active').length}</span>
              </div>
              <div className="text-center border-r border-slate-200 py-1 last:border-r-0">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Inactive Vehicles</span>
                <span className="text-sm font-bold text-amber-600">{filteredVehicles.filter(v => v.status !== 'Active').length}</span>
              </div>
              <div className="text-center border-r border-slate-200 py-1 last:border-r-0">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">New (Month)</span>
                <span className="text-sm font-bold text-indigo-600">
                  {filteredVehicles.filter(v => v.joiningDate && v.joiningDate.startsWith('2026-07')).length}
                </span>
              </div>
              <div className="text-center py-1">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">Avg Year</span>
                <span className="text-sm font-bold text-slate-800">
                  {filteredVehicles.length > 0 
                    ? Math.round(filteredVehicles.reduce((acc, curr) => acc + (curr.year || 0), 0) / filteredVehicles.length) 
                    : '-'}
                </span>
              </div>
            </div>

            {/* Print Footer */}
            <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
              <span>E7 Travels Fleet Operations Management System</span>
              <span>Signature of Supervisor: ________________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
