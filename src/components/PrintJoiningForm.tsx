import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Enquiry } from '../types';
import { Printer, X, Download, FileText } from 'lucide-react';

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
  onClose: () => void;
}

export default function PrintJoiningForm({ enquiry, onClose }: PrintJoiningFormProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

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
    alreadyRunningCompany: enquiry?.alreadyRunningCompany || '',
    sitePreference1: enquiry?.sitePreference1 || '',
    sitePreference2: enquiry?.sitePreference2 || '',
    enquiryDate: enquiry?.enquiryDate || new Date().toISOString().split('T')[0],
    remarks: enquiry?.remarks || '',
    
    // New fields
    inductionType: enquiry?.inductionType || 'OwnerAttach',
    ownerId: enquiry?.ownerId || '',
    ownerName: enquiry?.ownerName || '',
    ownerMobile: enquiry?.ownerMobile || '',
    mfdYear: enquiry?.mfdYear || '',
    fuelType: enquiry?.fuelType || 'Diesel',
    rcExpiry: enquiry?.rcExpiry || '',
    insuranceExpiry: enquiry?.insuranceExpiry || '',
    permitExpiry: enquiry?.permitExpiry || '',
    fcExpiry: enquiry?.fcExpiry || '',
    driverAltPhone: enquiry?.driverAltPhone || '',
    driverEmail: enquiry?.driverEmail || '',
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
    sitePreference3: enquiry?.sitePreference3 || '',
    sitePreference4: enquiry?.sitePreference4 || '',
  });

  // Automatically parse fields like Owner Name & Phone if they are passed as a single string
  useEffect(() => {
    if (enquiry) {
      const stateUpdate: Partial<Enquiry> = {};
      
      // Parse owner name/phone e.g. "VIGNESH-7358742132" or "RAGHAVAN-8825756609"
      if (enquiry.ownerNamePhone && !enquiry.ownerName) {
        const parts = enquiry.ownerNamePhone.split(/[-–—/]/);
        if (parts.length > 0) stateUpdate.ownerName = parts[0].trim();
        if (parts.length > 1) stateUpdate.ownerMobile = parts[1].trim();
      }

      // Pre-fill model year and type
      if (enquiry.vehicleModelYear && !enquiry.mfdYear) {
        stateUpdate.mfdYear = enquiry.vehicleModelYear;
      }
      
      if (Object.keys(stateUpdate).length > 0) {
        setFormData(prev => ({ ...prev, ...stateUpdate }));
      }
    }
  }, [enquiry]);

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

  // Safe logo image retrieval
  const customLogo = localStorage.getItem('e7_custom_logo') || null;

  return createPortal(
    <div className="print-modal-root fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-6 md:p-10 print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Helpful banner for users printing inside the iframe environment */}
      {isInIframe && (
        <div className="w-full max-w-[850px] bg-amber-500 text-slate-950 p-3.5 text-xs font-extrabold rounded-lg mb-2 flex items-center justify-between border-2 border-amber-600 print:hidden shadow-md">
          <div className="flex items-center gap-2 text-left">
            <span className="text-sm shrink-0">💡</span>
            <span>
              Running inside Preview Panel? Please click <strong className="underline text-amber-950 font-black">"Open in New Tab"</strong> at the top-right corner of your screen to print perfectly. Browser security blocks print dialogs inside iframe previews.
            </span>
          </div>
        </div>
      )}

      {printError && (
        <div className="w-full max-w-[1150px] bg-rose-500 text-white p-3.5 text-xs font-extrabold rounded-lg mb-2 flex items-center justify-between border-2 border-rose-600 print:hidden shadow-md">
          <div className="flex items-center gap-2 text-left">
            <span className="text-sm shrink-0">⚠️</span>
            <span>
              Print blocked by browser security. Please click the "Open in New Tab" button in the top-right corner of the browser preview and print from there!
            </span>
          </div>
        </div>
      )}

      {/* Interactive Controls Bar - Hidden on print */}
      <div className="w-full max-w-[1150px] bg-slate-800 text-white rounded-t-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-lg">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide uppercase">Print Vehicle Joining Form</h2>
            <p className="text-4xs text-slate-400 uppercase tracking-widest mt-0.5">
              {enquiry ? `Populated Form [ID: ${enquiry.id}]` : 'Blank Induction Application Template'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Form
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
            {isInIframe && (
              <span className="text-[9px] text-amber-400 font-extrabold tracking-tight">
                ⚠️ Is print blank? Click "Open in New Tab" at the top-right corner of your screen first.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor & Preview Side-by-Side (or stacked on mobile) - Editor Hidden on Print */}
      <div className="w-full max-w-[1150px] bg-slate-100 flex flex-col md:flex-row shadow-2xl overflow-visible print:shadow-none print:bg-white print:block rounded-b-xl border border-slate-200">
        
        {/* On-the-fly Fine-Tuning Panel (Left side in desktop, hidden on print) */}
        <div className="w-full md:w-72 bg-white border-r border-slate-200 p-5 shrink-0 overflow-y-auto max-h-[1100px] print:hidden">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <FileText className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Quick Fine-Tuning</h3>
          </div>
          
          <div className="space-y-4 text-left">
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
                  <label className="block text-[9px] text-slate-500">Fuel Type</label>
                  <input
                    type="text"
                    value={formData.fuelType || ''}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                    placeholder="Diesel / CNG / Petrol"
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
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Assigned Sites</span>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] text-slate-500">Site 1</label>
                  <input
                    type="text"
                    value={formData.sitePreference1 || ''}
                    onChange={(e) => setFormData({ ...formData, sitePreference1: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Site 2</label>
                  <input
                    type="text"
                    value={formData.sitePreference2 || ''}
                    onChange={(e) => setFormData({ ...formData, sitePreference2: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Site 3</label>
                  <input
                    type="text"
                    value={formData.sitePreference3 || ''}
                    onChange={(e) => setFormData({ ...formData, sitePreference3: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500">Site 4</label>
                  <input
                    type="text"
                    value={formData.sitePreference4 || ''}
                    onChange={(e) => setFormData({ ...formData, sitePreference4: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Paper A4 Layout Workspace */}
        <div className="flex-1 bg-slate-200/80 p-3 sm:p-6 overflow-x-auto min-w-0 flex justify-center items-start print:p-0 print:bg-transparent print:block print:overflow-visible w-full">
          <div 
            ref={printAreaRef}
            className="print-sheet w-full bg-white p-4 sm:p-8 font-sans text-slate-900 border border-slate-200 shadow-xl rounded relative print:p-0 print:m-0 print:w-full print:shadow-none print:border-none print:rounded-none overflow-visible transition-all duration-300"
            style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
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
              /* Hide entire root dashboard app, leaving only the Portal-rendered modal */
              #root, body > div:not(.print-modal-root) {
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
              /* Position print sheet with comfortable A4 margins so content never touches paper edges */
              @page {
                size: A4 portrait;
                margin: 0.5cm 0.5cm 0.5cm 0.5cm !important;
              }
              html, body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-size: 8.5px !important;
                line-height: 1.15 !important;
                height: auto !important;
                overflow: visible !important;
                width: 100% !important;
                max-width: 100% !important;
                border: none !important;
                box-shadow: none !important;
              }
              /* Override the screen-specific 297mm min-height during print */
              .print-sheet {
                min-height: auto !important;
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
                overflow: visible !important;
                box-sizing: border-box !important;
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
                overflow: visible !important;
                box-sizing: border-box !important;
                transform: none !important;
                zoom: 1 !important;
              }
              .print-container *, .print-sheet * {
                box-sizing: border-box !important;
                max-width: 100% !important;
              }
              /* Reduce space-y spacing on print */
              .print-container.space-y-2, .print-container.space-y-2\.5 {
                gap: 0.15rem !important;
              }
              .print-container.space-y-2 > :not([hidden]) ~ :not([hidden]),
              .print-container.space-y-2\.5 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.15rem !important;
              }
              .print-container .space-y-1\.5 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.1rem !important;
              }
              .print-container .space-y-1 > :not([hidden]) ~ :not([hidden]) {
                margin-top: 0.08rem !important;
              }
              /* Drastically reduce padding of table cells / grids for high density single-page fit */
              .print-container .p-2 {
                padding: 2px 4px !important;
              }
              .print-container .p-3 {
                padding: 3px 5px !important;
              }
              .print-container .bg-slate-100 {
                padding-top: 2px !important;
                padding-bottom: 2px !important;
                padding-left: 6px !important;
                padding-right: 6px !important;
              }
              /* Row min-height overrides */
              .print-container .min-h-\[30px\],
              .print-container .min-h-\[22px\],
              .print-container .min-h-\[24px\] {
                min-height: 18px !important;
              }
              /* Title and text sizes */
              .print-container h1 {
                font-size: 1.2rem !important;
              }
              .print-container h2 {
                font-size: 0.95rem !important;
              }
              .print-container h3 {
                font-size: 0.72rem !important;
                padding-top: 1px !important;
                padding-bottom: 1px !important;
              }
              .print-container p {
                font-size: 8px !important;
                line-height: 1.15 !important;
              }
              .print-container span {
                font-size: 8.2px !important;
              }
              .print-container .text-3xl {
                font-size: 1.2rem !important;
              }
              .print-container .text-xl {
                font-size: 0.95rem !important;
              }
              .print-container .text-xs {
                font-size: 8.2px !important;
              }
              .print-container .text-\[10px\] {
                font-size: 7.8px !important;
              }
              .print-container .text-\[11px\] {
                font-size: 8.5px !important;
              }
              .print-container .text-\[10.5px\] {
                font-size: 8.2px !important;
              }
              .print-container .text-\[9.5px\] {
                font-size: 7.8px !important;
              }
              .print-container .shrink-0 {
                font-size: 7.8px !important;
              }
              /* Reduce lines under empty fields */
              .print-container span.border-b {
                display: inline-flex !important;
                align-items: flex-end !important;
                padding-bottom: 1px !important;
                font-size: 8.2px !important;
                min-height: 12px !important;
                line-height: 1.05 !important;
                box-sizing: border-box !important;
              }
              /* Header resizing */
              .print-container img, .print-container .h-10, .print-container .h-16 {
                height: 1.8rem !important;
                width: 1.8rem !important;
              }
              .print-container .pb-3, .print-container .pb-2 {
                padding-bottom: 0.2rem !important;
              }
              /* Signatures block shrink */
              .print-container .pt-12, .print-container .pt-6, .print-container .pt-5 {
                padding-top: 1.2rem !important;
              }
              .print-container .pb-2 {
                padding-bottom: 2px !important;
              }
              .print-container .w-\[280px\] {
                width: 200px !important;
              }
              /* Document list checklist spacing */
              .print-container .rounded-lg {
                padding: 4px 6px !important;
                border-radius: 3px !important;
              }
              /* Hide all interactive print elements */
              .print\\:hidden, [print\\:hidden] {
                display: none !important;
                visibility: hidden !important;
              }
              /* Explicitly restore checkbox inputs on print bypassing the global input hide */
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
            
            {/* Header branding */}
            <div className="flex flex-col items-center border-b-2 border-slate-200 pb-1.5">
              <div className="flex flex-col items-center text-center">
                {customLogo ? (
                  <img 
                    src={customLogo} 
                    alt="E7 Travels" 
                    className="h-10 w-10 object-contain mb-1" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-black text-lg border-2 border-slate-950 shadow-xs shrink-0 mb-1">
                    E7
                  </div>
                )}
                <h1 className="font-serif font-black tracking-widest text-amber-600 uppercase leading-none" style={{ fontSize: '18px' }}>
                  E7 TRAVELS
                </h1>
              </div>

              <div className="w-full flex justify-between items-center text-xs mt-1.5 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500 uppercase">DATE:</span>
                  <span className="font-bold px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-center min-w-[90px] inline-block font-mono text-[11px]">
                    {formatDateToDDMMYYYY(formData.enquiryDate) || '\u00A0'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500 uppercase">APPLICATION NO:</span>
                  <span className="font-black px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-xs min-w-[90px] text-center inline-block">
                    {formData.id || '\u00A0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-0.5">
              <h2 className="text-base sm:text-lg font-extrabold text-[rgb(0,200,83)] tracking-wider uppercase">VEHICLE JOINING APPLICATION FORM</h2>
            </div>

            {/* SECTION 1: INDUCTION CATEGORY & DETAILS */}
            <div className="space-y-1">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-0.5 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,200,83)] text-[11px] uppercase tracking-wider">
                  1. INDUCTION CATEGORY & DETAILS
                </h3>
              </div>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Induction Type:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center gap-3">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={formData.inductionType === 'OwnerAttach'} 
                           readOnly 
                           className="h-3 w-3 rounded border-slate-300 text-amber-500 focus:ring-0" 
                        />
                        <span className="text-[9.5px] font-bold text-slate-800">OwnerAttach</span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={formData.inductionType === 'DriverAttach'} 
                           readOnly 
                           className="h-3 w-3 rounded border-slate-300 text-amber-500 focus:ring-0" 
                        />
                        <span className="text-[9.5px] font-bold text-slate-800">DriverAttach</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex bg-white min-h-[22px]"></div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Owner ID:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.ownerId || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Owner Name:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900 truncate">
                        {formData.ownerName || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Owner Mobile:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.ownerMobile || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Reference:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900 italic">
                        {formData.reference || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: VEHICLE DETAILS */}
            <div className="space-y-1">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-0.5 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,200,83)] text-[11px] uppercase tracking-wider">
                  2. VEHICLE DETAILS
                </h3>
              </div>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Vehicle Reg. No:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-black border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.vehicleNumber || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Make / Model:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.vehicleType || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Year of Mfd:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.mfdYear || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Fuel Type:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.fuelType || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      RC Expiry Date:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.rcExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Insurance Expiry:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.insuranceExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Permit Type/Expiry:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.permitExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Fitness Cert Expiry:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.fcExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: DRIVER & CONTACT DETAILS */}
            <div className="space-y-1">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-0.5 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,200,83)] text-[11px] uppercase tracking-wider">
                  3. DRIVER & CONTACT DETAILS
                </h3>
              </div>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Driver Full Name:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.driverName || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Mobile Number:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.driverPhone || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Alt. Mobile No:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.driverAltPhone || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Email ID:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.driverEmail || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Aadhaar Number:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.driverAadhaar || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      DL Number:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900 uppercase">
                        {formData.driverDlNumber || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      DL Validity Date:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formatDateToDDMMYYYY(formData.driverDlExpiry) || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-start font-bold text-slate-600 text-[9.5px] shrink-0 mt-0.5">
                      Permanent Address:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900 leading-tight">
                        {formData.driverAddress || formData.driverArea || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: GPS & BANK ACCOUNT DETAILS */}
            <div className="space-y-1">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-0.5 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,200,83)] text-[11px] uppercase tracking-wider">
                  4. GPS & BANK ACCOUNT DETAILS
                </h3>
              </div>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      GPS Device Vendor:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.gpsVendor || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      GPS IMEI Number:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.gpsImei || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Bank Name:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.bankName || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Account Holder:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.bankAccountHolder || formData.ownerName || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Account Number:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.bankAccountNumber || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-32 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      IFSC Code:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-mono font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900 uppercase">
                        {formData.bankIfsc || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: VEHICLE INDUCTED FOR SITES */}
            <div className="space-y-1">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-0.5 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,200,83)] text-[11px] uppercase tracking-wider">
                  5. VEHICLE INDUCTED FOR SITES (OPERATIONAL LOCATIONS)
                </h3>
              </div>
              <p className="text-[9.5px] italic text-slate-500 ml-1">
                Please specify up to 4 operational sites/clients this vehicle is assigned to:
              </p>
              <div className="border border-slate-300 rounded-2xs overflow-hidden divide-y divide-slate-300 bg-white text-xs">
                {/* Row 1 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-20 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Site 1:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.sitePreference1 || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-20 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Site 2:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.sitePreference2 || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-20 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Site 3:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.sitePreference3 || '\u00A0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex divide-x divide-slate-300 min-h-[22px]">
                    <div className="w-20 bg-slate-50 px-2 py-0.5 flex items-center font-bold text-slate-600 text-[9.5px] shrink-0">
                      Site 4:
                    </div>
                    <div className="flex-1 bg-white px-2 py-0.5 flex items-center">
                      <span className="font-bold border-b border-slate-300 flex-1 px-1 min-h-[14px] text-left text-[10.5px] text-slate-900">
                        {formData.sitePreference4 || '\u00A0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: DECLARATION & AUTHORIZATION */}
            <div className="space-y-1 pt-0.5">
              <div className="bg-slate-100 border-l-[4px] border-red-600 px-2.5 py-0.5 flex justify-between items-center">
                <h3 className="font-black text-[rgb(0,200,83)] text-[11px] uppercase tracking-wider">
                  6. DECLARATION & AUTHORIZATION
                </h3>
              </div>
              <p className="text-[9.5px] leading-tight text-slate-700 text-justify font-medium">
                I here by declare that the details furnished above are true and correct to the best of my knowledge and belief. I undertake to intimate E7 TOURS & TRAVELS immediately incase of any change in the statutory vehicle documents, driver deployment, bank accounts, or contact details.
              </p>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-5 pb-1">
                <div className="text-center w-[220px]">
                  <div className="border-t border-dotted border-slate-400 pt-1 text-[9.5px] font-bold text-slate-600 uppercase">
                    Owner / Driver Signature
                  </div>
                </div>
                <div className="text-center w-[220px]">
                  <div className="border-t border-dotted border-slate-400 pt-1 text-[9.5px] font-bold text-slate-600 uppercase">
                    Authorized Signatory (E7 TRAVELS)
                  </div>
                </div>
              </div>
            </div>

            {/* Required Documents Checklist Footer box */}
            <div className="bg-amber-50/20 border border-amber-300/60 p-2 px-2.5 rounded-md text-[8.5px] leading-tight text-amber-900/90 font-medium">
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
