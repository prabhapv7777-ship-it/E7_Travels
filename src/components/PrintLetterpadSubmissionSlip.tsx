import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Vehicle, Enquiry } from '../types';
import { Printer, X, FileCheck, CheckCircle2, Building, Send } from 'lucide-react';

interface PrintLetterpadSubmissionSlipProps {
  vehicle: Vehicle | null;
  enquiry?: Enquiry | null;
  onClose: () => void;
}

export default function PrintLetterpadSubmissionSlip({ vehicle, enquiry, onClose }: PrintLetterpadSubmissionSlipProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const regNo = vehicle?.registrationNumber || enquiry?.vehicleNumber || 'TN-00-XX-0000';
  const vendorCompany = vehicle?.officeDocVendorCompany || vehicle?.company || enquiry?.officeDocVendorCompany || enquiry?.inductionCompany || 'FIESTA / ECO MOBILITY';
  const letterpadRef = vehicle?.officeDocLetterpadRef || enquiry?.officeDocLetterpadRef || `LP-${vendorCompany.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 6)}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const submitDate = vehicle?.officeDocSubmitDate || enquiry?.officeDocSubmitDate || new Date().toISOString().substring(0, 10);

  const [refNoInput, setRefNoInput] = useState(letterpadRef);
  const [dateInput, setDateInput] = useState(submitDate);
  const [vendorInput, setVendorInput] = useState(vendorCompany);
  const [siteInput, setSiteInput] = useState(vehicle?.site || enquiry?.sitePreference1 || 'Main Office Campus');
  const [remarksInput, setRemarksInput] = useState(vehicle?.officeDocRemarks || enquiry?.officeDocRemarks || 'All original/attested copies of vehicle and driver credentials submitted for route induction.');

  const savedChecklist = vehicle?.officeDocChecklist || enquiry?.officeDocChecklist;

  const [checklist, setChecklist] = useState({
    rc: savedChecklist?.rc ?? true,
    insurance: savedChecklist?.insurance ?? true,
    permit: savedChecklist?.permit ?? true,
    pollution: savedChecklist?.pollution ?? true,
    aadhaarCard: savedChecklist?.aadhaarCard ?? true,
    policeVerification: savedChecklist?.policeVerification ?? true,
    drivingLicense: savedChecklist?.drivingLicense ?? true,
    medicalCertificate: savedChecklist?.medicalCertificate ?? true,
  });

  const handlePrint = () => {
    window.print();
  };

  const modelName = vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : enquiry?.vehicleType || 'Vehicle';
  const driverName = vehicle?.driverName || enquiry?.driverName || 'Driver';
  const driverPhone = enquiry?.driverPhone || 'N/A';
  const driverDl = enquiry?.driverDlNumber || 'Attached';
  const ownerName = vehicle?.ownerName || enquiry?.ownerName || 'Owner';

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar (Hidden during Print) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide uppercase">
                Vendor Office Letterpad Submission Slip
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Official document submission voucher for {vendorInput} office induction
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Printer className="h-4 w-4" /> Print Letterpad Slip
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Print Preview Wrapper */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Printable Container */}
          <div ref={printAreaRef} className="print-letterpad-container bg-white text-slate-900 p-8 border border-slate-300 rounded-xl shadow-xs max-w-3xl mx-auto space-y-6">
            
            {/* Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">E7 TRAVELS & FLEET</h1>
                <p className="text-2xs font-bold text-slate-600 uppercase tracking-widest mt-0.5">Corporate Employee Transport & Fleet Logistics</p>
                <p className="text-3xs text-slate-500 font-mono mt-0.5">Chennai, Tamil Nadu • Contact: +91 98400 00000</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded">
                  OFFICE LETTERPAD MEMO
                </span>
                <p className="text-xs font-bold font-mono text-slate-800 mt-2">REF: {refNoInput}</p>
                <p className="text-2xs font-semibold text-slate-500">DATE: {dateInput}</p>
              </div>
            </div>

            {/* Recipient Vendor Header */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-3xs font-black text-slate-400 uppercase tracking-widest block mb-1">To Vendor Company</span>
                <p className="text-sm font-extrabold text-blue-900 uppercase flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-blue-600 print:hidden" /> {vendorInput}
                </p>
                <p className="text-2xs font-medium text-slate-600 mt-0.5">Campus / Site: {siteInput}</p>
              </div>
              <div>
                <span className="text-3xs font-black text-slate-400 uppercase tracking-widest block mb-1">Purpose / Subject</span>
                <p className="font-extrabold text-slate-800 uppercase">INDUCTION VEHICLE DOCUMENT SUBMISSION</p>
                <p className="text-2xs font-medium text-emerald-700 font-bold mt-0.5">STATUS: SUBMITTED WITH LETTERPAD</p>
              </div>
            </div>

            {/* Vehicle & Driver Overview Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Vehicle & Personnel Deployment Details
                </span>
                <span className="text-xs font-mono font-black text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                  {regNo}
                </span>
              </div>
              <table className="w-full text-xs text-left divide-y divide-slate-200">
                <tbody>
                  <tr className="divide-x divide-slate-200 bg-white">
                    <td className="p-2.5 font-bold text-slate-500 bg-slate-50/80 w-1/4">Registration No:</td>
                    <td className="p-2.5 font-extrabold text-slate-900 w-1/4 font-mono">{regNo}</td>
                    <td className="p-2.5 font-bold text-slate-500 bg-slate-50/80 w-1/4">Make & Model:</td>
                    <td className="p-2.5 font-extrabold text-slate-900 w-1/4">{modelName}</td>
                  </tr>
                  <tr className="divide-x divide-slate-200 bg-white">
                    <td className="p-2.5 font-bold text-slate-500 bg-slate-50/80">Assigned Driver:</td>
                    <td className="p-2.5 font-extrabold text-slate-900">{driverName}</td>
                    <td className="p-2.5 font-bold text-slate-500 bg-slate-50/80">Driver DL No:</td>
                    <td className="p-2.5 font-bold text-slate-800 font-mono">{driverDl}</td>
                  </tr>
                  <tr className="divide-x divide-slate-200 bg-white">
                    <td className="p-2.5 font-bold text-slate-500 bg-slate-50/80">Vehicle Owner:</td>
                    <td className="p-2.5 font-semibold text-slate-800">{ownerName}</td>
                    <td className="p-2.5 font-bold text-slate-500 bg-slate-50/80">Contact Phone:</td>
                    <td className="p-2.5 font-semibold text-slate-800 font-mono">{driverPhone}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Document Submission Enclosures Checklist */}
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 print:hidden" /> Submitted Document Package Checklist
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs border border-slate-300 p-3 rounded-xl bg-slate-50/50">
                {[
                  { key: 'rc', label: '1. RC (Registration Certificate)' },
                  { key: 'insurance', label: '2. INSURANCE (Commercial Policy)' },
                  { key: 'permit', label: '3. PERMIT (Contract Carriage)' },
                  { key: 'pollution', label: '4. POLLUTION (PUC / FC Certificate)' },
                  { key: 'aadhaarCard', label: '5. AADHAAR CARD (Driver/Owner)' },
                  { key: 'policeVerification', label: '6. POLICE VERIFICATION' },
                  { key: 'drivingLicense', label: '7. DRIVING LICENSE & Badge' },
                  { key: 'medicalCertificate', label: '8. MEDICAL CERTIFICATE' },
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={(checklist as any)[doc.key]}
                      onChange={(e) => setChecklist({ ...checklist, [doc.key]: e.target.checked })}
                      className="h-3.5 w-3.5 text-indigo-600 rounded cursor-pointer print:hidden"
                    />
                    <span className="font-semibold text-slate-800 text-2xs">{doc.label}</span>
                    {(checklist as any)[doc.key] ? (
                      <span className="ml-auto text-[10px] font-black text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                        SUBMITTED
                      </span>
                    ) : (
                      <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-1 rounded">
                        PENDING
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks Note */}
            <div className="border-t border-slate-200 pt-3">
              <span className="text-3xs font-black text-slate-400 uppercase tracking-widest block mb-1">
                Office Remarks / Verification Notes
              </span>
              <p className="text-2xs font-medium text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                "{remarksInput}"
              </p>
            </div>

            {/* Signatures & Stamps Block */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-xs border-t-2 border-slate-900 mt-8">
              <div className="space-y-12">
                <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Submitted By (E7 Travels Admin):</p>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-extrabold text-slate-900">Authorized Signatory</p>
                  <p className="text-3xs text-slate-500 font-mono">E7 Travels Fleet Operations</p>
                </div>
              </div>
              <div className="space-y-12 text-right">
                <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Received & Verified By ({vendorInput} Office):</p>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-extrabold text-slate-900">Office Representative Name & Signature</p>
                  <p className="text-3xs text-slate-500 font-mono">{vendorInput} Transport Desk Stamp</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
