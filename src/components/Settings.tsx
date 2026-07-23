/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cloud,
  CheckCircle,
  Database,
  Building,
  MapPin,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  Award,
  Edit2,
  X,
  XCircle,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { Company, Site } from '../types';

interface SettingsProps {
  companies: Company[];
  sites: Site[];
  spreadsheetId: string | null;
  onUpdateCompanies: (c: Company[]) => void;
  onUpdateSites: (s: Site[]) => void;
  onForceSync: () => void;
  onExportToSheets?: () => void;
  customLogo: string | null;
  onUpdateLogo: (logo: string | null) => void;
  onUpdateSpreadsheetId?: (id: string | null) => void;
  lastSynced?: string | null;
}

// Resizes a raster image down to a maximum bounding box to protect localStorage quota.
// SVGs bypass resizing to preserve crisp vector curves and text.
const resizeImage = (base64Str: string, maxWidth: number, maxHeight: number, callback: (resizedBase64: string) => void) => {
  if (base64Str.startsWith('data:image/svg+xml')) {
    callback(base64Str);
    return;
  }
  const img = new Image();
  img.src = base64Str;
  img.onload = () => {
    let width = img.width;
    let height = img.height;
    if (width <= maxWidth && height <= maxHeight) {
      callback(base64Str);
      return;
    }
    if (width > height) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback(base64Str);
      return;
    }
    ctx.drawImage(img, 0, 0, width, height);
    try {
      callback(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Canvas export failed, using original base64:', err);
      callback(base64Str);
    }
  };
  img.onerror = () => {
    callback(base64Str);
  };
};

export const VENDOR_SITE_MAP: Record<string, string[]> = {
  FIESTA: ['WALMART', 'CTS', 'OPTUM', 'OMEGA', 'TCS', 'COMCAST'],
  FOURWAY: ['CTS'],
  ECO: ['CGI', 'MED EXPERT', 'BARCLAYS', 'EXL', 'WORKDAY'],
  'ROVER FLEET': ['REFEX'],
  'R6 MARS': ['RR DONNELLEY'],
  ATHENA: ['STATE STREET'],
  'SELECT CABS': ['CTS'],
};

export const getVendorBadge = (vendor: string) => {
  const v = (vendor || 'ECO').trim().toUpperCase();
  if (v === 'ECO') {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
        ECO
      </span>
    );
  }
  if (v === 'FIESTA') {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
        FIESTA
      </span>
    );
  }
  if (v === 'FOURWAY') {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
        FOURWAY
      </span>
    );
  }
  if (v === 'ROVER FLEET' || v === 'ROVER') {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
        ROVER FLEET
      </span>
    );
  }
  if (v === 'R6 MARS') {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
        R6 MARS
      </span>
    );
  }
  if (v === 'ATHENA' || v === 'ATHEA' || v === 'ATHENA TRAVELS') {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
        ATHENA
      </span>
    );
  }
  if (v === 'REFEX') {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-wider">
        REFEX
      </span>
    );
  }
  if (v === 'SELECT CABS') {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
        SELECT CABS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-2xs font-extrabold rounded-full bg-slate-50 text-slate-700 border border-slate-200 uppercase tracking-wider text-ellipsis overflow-hidden max-w-[140px]">
      {v}
    </span>
  );
};

export default function Settings({
  companies,
  sites,
  spreadsheetId,
  onUpdateCompanies,
  onUpdateSites,
  onForceSync,
  onExportToSheets,
  customLogo,
  onUpdateLogo,
  onUpdateSpreadsheetId,
  lastSynced,
}: SettingsProps) {
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [newSiteCompany, setNewSiteCompany] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; type: 'company' | 'site'; title: string } | null>(null);

  // ================= SPREADSHEET CONFIG STATE =================
  const [tempSpreadsheetInput, setTempSpreadsheetInput] = useState(spreadsheetId || '');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    setTempSpreadsheetInput(spreadsheetId || '');
  }, [spreadsheetId]);

  const handleSaveSpreadsheetId = () => {
    if (!tempSpreadsheetInput || !tempSpreadsheetInput.trim()) {
      setFeedbackMsg('Please enter a valid spreadsheet link or ID');
      setTimeout(() => setFeedbackMsg(''), 3000);
      return;
    }

    const input = tempSpreadsheetInput.trim();
    // Try to extract spreadsheet ID if it is a full Google Sheet URL
    let extractedId = input;
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = input.match(regex);
    if (match && match[1]) {
      extractedId = match[1];
    }

    if (onUpdateSpreadsheetId) {
      onUpdateSpreadsheetId(extractedId);
      setFeedbackMsg('Spreadsheet ID updated successfully!');
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  const handleResetSpreadsheetId = () => {
    if (onUpdateSpreadsheetId) {
      onUpdateSpreadsheetId(null);
      setTempSpreadsheetInput('');
      setFeedbackMsg('Spreadsheet ID cleared.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  // Client Corporate Registry Modal State
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Company | null>(null);
  const [clientForm, setClientForm] = useState<{
    vendorName: string;
    companySite: string;
    paymentTerms: string;
    customVendorName: string;
    customCompanySite: string;
    customPaymentTerms: string;
  }>({
    vendorName: 'ECO',
    companySite: 'CTS',
    paymentTerms: 'Net 30',
    customVendorName: '',
    customCompanySite: '',
    customPaymentTerms: '',
  });

  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [spellingSuccess, setSpellingSuccess] = useState<string | null>(null);
  const [isSpellingAction, setIsSpellingAction] = useState(false);

  useEffect(() => {
    if (isAddingClient || editingClient) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddingClient, editingClient]);

  const [taxRate, setTaxRate] = useState(5);
  const [commissionRate, setCommissionRate] = useState(15);

  const [originalLogo, setOriginalLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('e7_original_logo') || null;
    } catch {
      return null;
    }
  });
  const [bgThreshold, setBgThreshold] = useState(240);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      // Resize/compress raster images first to prevent localStorage quota issues
      resizeImage(base64, 400, 400, (resizedBase64) => {
        setOriginalLogo(resizedBase64);
        try {
          localStorage.setItem('e7_original_logo', resizedBase64);
        } catch (err) {
          console.error('Failed to save original logo to localStorage (quota exceeded):', err);
        }
        
        // Update the logo immediately in the UI
        onUpdateLogo(resizedBase64);
        
        // Then apply background removal asynchronously
        applyBackgroundRemoval(resizedBase64, bgThreshold);
      });
    };
    reader.readAsDataURL(file);
  };

  const applyBackgroundRemoval = (base64Str: string, threshold: number) => {
    // If it's an SVG file, bypass background removal to preserve clean vector paths
    if (base64Str.startsWith('data:image/svg+xml')) {
      onUpdateLogo(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        if (!img.width || !img.height) {
          onUpdateLogo(base64Str);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onUpdateLogo(base64Str);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If the pixel is near-white, make it transparent
          if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0; // Alpha 0
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const transparentBase64 = canvas.toDataURL('image/png');
        onUpdateLogo(transparentBase64);
      } catch (err) {
        console.error('Error applying background removal, keeping original:', err);
        onUpdateLogo(base64Str);
      }
    };
    img.onerror = () => {
      onUpdateLogo(base64Str);
    };
  };

  const handleOpenAddClient = () => {
    setClientForm({
      vendorName: 'ECO',
      companySite: 'CGI',
      paymentTerms: 'Net 30',
      customVendorName: 'ECO',
      customCompanySite: 'CGI',
      customPaymentTerms: '',
    });
    setClientFormError(null);
    setIsAddingClient(true);
  };

  const handleOpenEditClient = (c: Company) => {
    const isCustomVendor = !['ATHENA', 'ECO', 'FIESTA', 'FOURWAY', 'R6 MARS', 'ROVER FLEET', 'SELECT CABS'].includes(c.vendorName || '');
    const isCustomCompany = !['WALMART', 'CTS', 'OPTUM', 'OMEGA', 'TCS', 'COMCAST', 'CGI', 'MED EXPERT', 'BARCLAYS', 'BARCLYS', 'EXL', 'WORKDAY', 'REFEX', 'RR DONLLEY', 'RR DONNELLEY', 'STATE STREET'].includes(c.companySite || c.name);
    const isCustomTerms = !['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Monthly'].includes(c.paymentTerms);

    setClientForm({
      vendorName: isCustomVendor ? 'custom' : (c.vendorName || 'ECO'),
      companySite: isCustomCompany ? 'custom' : (c.companySite || c.name),
      paymentTerms: isCustomTerms ? 'custom' : c.paymentTerms,
      customVendorName: c.vendorName || 'ECO',
      customCompanySite: c.companySite || c.name,
      customPaymentTerms: isCustomTerms ? c.paymentTerms : '',
    });
    setClientFormError(null);
    setEditingClient(c);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalVendorName = clientForm.customVendorName.trim();
    const finalCompanySite = clientForm.customCompanySite.trim();
    const finalBillingTerms = clientForm.paymentTerms === 'custom' ? clientForm.customPaymentTerms.trim() : clientForm.paymentTerms;

    if (!finalVendorName) {
      setClientFormError('Vendor Name is required.');
      return;
    }
    if (!finalCompanySite) {
      setClientFormError('Company Site is required.');
      return;
    }
    if (!finalBillingTerms) {
      setClientFormError('Billing Terms are required.');
      return;
    }

    if (editingClient) {
      const exists = companies.some((c) => c.name.toLowerCase() === finalCompanySite.toLowerCase() && c.name.toLowerCase() !== editingClient.name.toLowerCase());
      if (exists) {
        setClientFormError('A client with this Company Site name already exists!');
        return;
      }

      const updatedCompanies = companies.map((c) => {
        if (c.name === editingClient.name) {
          return {
            ...c,
            name: finalCompanySite,
            vendorName: finalVendorName,
            companySite: finalCompanySite,
            paymentTerms: finalBillingTerms,
          };
        }
        return c;
      });

      // Track if there's any spelling/name correction
      const hasSpellingChange = editingClient.name !== finalCompanySite || editingClient.vendorName !== finalVendorName;

      onUpdateCompanies(updatedCompanies);
      
      if (isSpellingAction || hasSpellingChange) {
        setSpellingSuccess(
          `Spelling corrected successfully! Company Site has been updated to "${finalCompanySite}" and Vendor Name to "${finalVendorName}". These changes have automatically propagated across all active Vehicle records, operational Sites, and billing Payments.`
        );
        // Scroll to top of settings to let user see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setEditingClient(null);
      setIsSpellingAction(false);
    } else {
      const exists = companies.some((c) => c.name.toLowerCase() === finalCompanySite.toLowerCase());
      if (exists) {
        setClientFormError('A client with this Company Site name already exists!');
        return;
      }

      const newCompany: Company = {
        name: finalCompanySite,
        billingCycle: 'Monthly',
        paymentTerms: finalBillingTerms,
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        vendorName: finalVendorName,
        companySite: finalCompanySite,
      };

      onUpdateCompanies([...companies, newCompany]);
      setIsAddingClient(false);
    }
  };

  const handleDeleteCompany = (name: string) => {
    if (companies.length <= 1) {
      alert('You must have at least one active corporate client.');
      return;
    }
    setDeleteCandidate({ id: name, type: 'company', title: name });
  };

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newSiteName.trim();
    if (!trimmedName) {
      alert('Please enter a Site Hub Name before clicking Add Hub.');
      return;
    }

    const exists = sites.some((s) => s.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      alert(`A Site Hub with the name "${trimmedName}" already exists!`);
      return;
    }

    const assignedCompany = newSiteCompany || companies[0]?.name || 'Direct';

    const newSite: Site = {
      id: `SITE-${Date.now()}`,
      name: trimmedName,
      companyName: assignedCompany,
      location: newSiteLocation.trim() || 'Chennai SEZ',
      contactPerson: '',
      phone: '',
      remarks: '',
    };

    onUpdateSites([...sites, newSite]);
    setNewSiteName('');
    setNewSiteLocation('');
    setNewSiteCompany('');
    setSpellingSuccess(`Site Hub "${trimmedName}" added successfully.`);
  };

  const handleDeleteSite = (id: string) => {
    if (sites.length <= 1) {
      alert('You must have at least one active corporate site hub.');
      return;
    }
    const matchedSite = sites.find((s) => s.id === id);
    setDeleteCandidate({ id, type: 'site', title: matchedSite ? matchedSite.name : id });
  };

  return (
    <div className="space-y-6">
      {spellingSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-slate-800 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="text-emerald-500 h-5 w-5 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">Spelling Updated Successfully</h4>
            <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">{spellingSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setSpellingSuccess(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Cloud Integration Details */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
          <Cloud className="text-blue-600 h-5 w-5" /> Google Sheets Database Mappings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col justify-between gap-4">
            <div>
              <span className="text-3xs font-semibold text-slate-400 uppercase">Synchronisation Mode</span>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <CheckCircle className="text-emerald-500 h-4 w-4" /> Live Google Sheets Database
              </p>
              <p className="text-3xs text-slate-500 mt-2 leading-relaxed">
                All changes made on vehicles, owners, drivers, billing payments, and operational deductions are saved
                directly to the designated spreadsheet.
              </p>
            </div>
            {spreadsheetId && (
              <div className="pt-2 border-t border-slate-150">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  Open Google Sheet <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col justify-between gap-3">
            <div>
              <span className="text-3xs font-semibold text-slate-400 uppercase">Change App Spreadsheet Link</span>
              <p className="text-3xs text-slate-500 mt-1">
                Paste a Google Sheet URL or custom Spreadsheet ID to link a different database sheet.
              </p>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Paste Google Sheets link or ID..."
                value={tempSpreadsheetInput}
                onChange={(e) => setTempSpreadsheetInput(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-3xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveSpreadsheetId}
                  className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-4xs font-extrabold rounded-md shadow-3xs transition-all uppercase tracking-wider cursor-pointer"
                >
                  Connect Sheet
                </button>
                {spreadsheetId && (
                  <button
                    type="button"
                    onClick={handleResetSpreadsheetId}
                    className="px-3 py-1 border border-slate-200 text-rose-600 hover:bg-rose-50 text-4xs font-bold rounded-md transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}
              </div>
              {feedbackMsg && (
                <p className="text-[10px] font-bold text-emerald-600 animate-pulse mt-1">{feedbackMsg}</p>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col justify-between">
            <div>
              <span className="text-3xs font-semibold text-slate-400 uppercase">Google Sheets Sync Controls</span>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <Database className="text-blue-500 h-4 w-4" /> Dual-Mode Sync & Save
              </p>
              <p className="text-3xs text-slate-500 mt-2 font-medium">
                Store your current local ERP registers to your connected spreadsheet, or reload remote database records.
              </p>
              {lastSynced && (
                <p className="text-4xs font-bold text-emerald-600 mt-2 flex items-center gap-1 uppercase tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Last Synced: {lastSynced}
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                id="btn-store-local-to-sheets"
                onClick={onExportToSheets}
                className="w-full px-3 py-1.5 text-2xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-3xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Save Current Data to Google Sheet
              </button>
              <button
                id="sync-settings-btn"
                onClick={onForceSync}
                className="w-full px-3 py-1.5 text-2xs font-bold bg-white border border-slate-250 text-slate-750 hover:bg-slate-50 rounded-md shadow-3xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Overwrite Local from Sheet
              </button>
            </div>
          </div>

          {/* Standard Rates */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
            <div>
              <span className="text-3xs font-semibold text-slate-400 uppercase">Corporate Service Tax (GST)</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="tax-rate-input"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 border border-slate-250 bg-white rounded text-xs font-bold focus:outline-none"
                />
                <span className="text-xs font-semibold text-slate-600">% Service Tax rate</span>
              </div>
            </div>

            <div>
              <span className="text-3xs font-semibold text-slate-400 uppercase">Standard Brokerage Share</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="commission-rate-input"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 border border-slate-250 bg-white rounded text-xs font-bold focus:outline-none"
                />
                <span className="text-xs font-semibold text-slate-600">% Commission Share</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Identity & Logo Customizer */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
          <Award className="text-blue-600 h-5 w-5" /> Brand Identity & Custom Logo Manager
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 flex flex-col items-center justify-center border border-slate-200 rounded-lg p-5 bg-slate-50 relative min-h-[160px]">
            {customLogo ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center overflow-hidden shadow-2xs">
                  <img src={customLogo} alt="Custom Branding Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateLogo(null);
                    setOriginalLogo(null);
                    localStorage.removeItem('e7_original_logo');
                  }}
                  className="px-2.5 py-1 text-4xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-md transition-all uppercase tracking-wider cursor-pointer"
                >
                  Remove Logo
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-2">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-3xs text-slate-500 font-bold uppercase tracking-wider">Default SVG Active</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] mx-auto">Upload a PNG or JPG logo to customize the system and print headers.</p>
              </div>
            )}
          </div>

          <div className="md:col-span-8 space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-3xs font-semibold text-slate-400 uppercase">Logo Upload & Background Remover</span>
              <p className="text-xs text-slate-600 leading-normal mt-1.5 font-medium">
                Upload your official company logo. If your logo has a white or non-transparent background, we can instantly remove it to blend perfectly with the blue sidebar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <div className="relative flex flex-col items-center justify-center w-full h-10 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white transition-all hover:bg-blue-50/10">
                  <span className="text-2xs font-extrabold text-blue-600 uppercase tracking-wider">Choose Image File...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                </div>
              </div>

              {customLogo && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-3xs font-semibold text-slate-400 uppercase">
                    <span>Background Cutoff Threshold</span>
                    <span className="text-blue-600 font-bold">{bgThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="255"
                    value={bgThreshold}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBgThreshold(val);
                      if (originalLogo) {
                        applyBackgroundRemoval(originalLogo, val);
                      }
                    }}
                    className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Increase threshold to remove darker shades of off-white.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lists Masters Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Master */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Building className="text-slate-400 h-4 w-4" /> Client Corporate Registry
              </h3>
              <button
                id="btn-add-client-settings"
                type="button"
                onClick={handleOpenAddClient}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Client
              </button>
            </div>

            {/* Table */}
            <div className="overflow-hidden border border-slate-150 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600 text-3xs uppercase">
                    <th className="py-2.5 px-4">Vendor Name</th>
                    <th className="py-2.5 px-4">Company Site</th>
                    <th className="py-2.5 px-4">Billing Terms</th>
                    <th className="py-2.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {[...companies]
                    .sort((a, b) => {
                      const vA = (a.vendorName || 'ECO').toUpperCase();
                      const vB = (b.vendorName || 'ECO').toUpperCase();
                      if (vA !== vB) return vA.localeCompare(vB);
                      const sA = (a.companySite || a.name || '').toUpperCase();
                      const sB = (b.companySite || b.name || '').toUpperCase();
                      return sA.localeCompare(sB);
                    })
                    .map((c) => (
                    <tr key={c.name} className="hover:bg-slate-50/20">
                      <td className="py-2 px-4 text-slate-800">{getVendorBadge(c.vendorName || 'ECO')}</td>
                      <td className="py-2 px-4 text-slate-900 font-bold">{c.companySite || c.name}</td>
                      <td className="py-2 px-4 text-slate-500 font-mono">{c.paymentTerms}</td>
                      <td className="py-2 px-4 text-center flex items-center justify-center gap-1">
                        <button
                          type="button"
                          id={`btn-edit-setcomp-${c.name}`}
                          onClick={() => handleOpenEditClient(c)}
                          className="p-1 hover:bg-blue-50 text-blue-500 rounded cursor-pointer"
                          title="Edit Client details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`btn-del-setcomp-${c.name}`}
                          onClick={() => handleDeleteCompany(c.name)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                          title="Delete Client"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Site Master */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin className="text-slate-400 h-4 w-4" /> Operational Site Hub Registry
          </h3>

          <form onSubmit={handleAddSite} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
            <input
              id="set-site-name"
              type="text"
              placeholder="Site Hub Name *"
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
            />
            <input
              id="set-site-location"
              type="text"
              placeholder="Location/Region"
              value={newSiteLocation}
              onChange={(e) => setNewSiteLocation(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
            />
            <select
              id="set-site-company"
              value={newSiteCompany}
              onChange={(e) => setNewSiteCompany(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-700 font-medium"
            >
              <option value="">-- Client (Optional) --</option>
              {companies.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              id="set-site-submit"
              type="submit"
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Hub
            </button>
          </form>

          {/* Table */}
          <div className="overflow-hidden border border-slate-150 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600 text-3xs uppercase">
                  <th className="py-2.5 px-4">Site Hub</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {sites.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/20">
                    <td className="py-2 px-4">{s.name}</td>
                    <td className="py-2 px-4 text-slate-500 font-mono">{s.location}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        id={`btn-del-setsite-${s.id}`}
                        onClick={() => handleDeleteSite(s.id)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {deleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteCandidate.title}"</span>?
                This action is permanent and may affect active vehicle assignments and routes.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteCandidate.type === 'company') {
                    onUpdateCompanies(companies.filter((c) => c.name !== deleteCandidate.id));
                  } else {
                    onUpdateSites(sites.filter((s) => s.id !== deleteCandidate.id));
                  }
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-xs"
              >
                Delete Registry Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT CLIENT DIALOG MODAL */}
      {(isAddingClient || editingClient) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  {editingClient ? 'Edit Client Registry' : 'Add Client Registry'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Please provide client details below.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingClient(false);
                  setEditingClient(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveClient}>
              <div className="p-6 space-y-4">
                {clientFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                    {clientFormError}
                  </div>
                )}

                  {/* Vendor Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Vendor Name *</label>
                    <input
                      type="text"
                      placeholder="Type/Edit Vendor Name"
                      value={clientForm.customVendorName}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isPreset = ['ATHENA', 'ECO', 'FIESTA', 'FOURWAY', 'R6 MARS', 'ROVER FLEET', 'SELECT CABS'].includes(val);
                        setClientForm({
                          ...clientForm,
                          customVendorName: val,
                          vendorName: isPreset ? val : 'custom',
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 mb-2"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1">Predefined Presets</label>
                        <select
                          value={['ATHENA', 'ECO', 'FIESTA', 'FOURWAY', 'R6 MARS', 'ROVER FLEET', 'SELECT CABS'].includes(clientForm.customVendorName) ? clientForm.customVendorName : 'custom'}
                          onChange={(e) => {
                            const selectedVendor = e.target.value;
                            if (selectedVendor !== 'custom' && selectedVendor !== '') {
                              const predefinedSites = VENDOR_SITE_MAP[selectedVendor] || [];
                              const defaultSite = predefinedSites[0] || '';
                              setClientForm({
                                ...clientForm,
                                vendorName: selectedVendor,
                                customVendorName: selectedVendor,
                                companySite: defaultSite,
                                customCompanySite: defaultSite,
                              });
                            } else {
                              setClientForm({
                                ...clientForm,
                                vendorName: 'custom',
                              });
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-2xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 font-semibold cursor-pointer"
                        >
                          <option value="custom">-- Choose Preset --</option>
                          <option value="ATHENA">ATHENA</option>
                          <option value="ECO">ECO</option>
                          <option value="FIESTA">FIESTA</option>
                          <option value="FOURWAY">FOURWAY</option>
                          <option value="R6 MARS">R6 MARS</option>
                          <option value="ROVER FLEET">ROVER FLEET</option>
                          <option value="SELECT CABS">SELECT CABS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1">Scroll Registered</label>
                        <select
                          value={Array.from(new Set((companies || []).map((c) => c.vendorName || 'ECO').filter(Boolean))).sort().includes(clientForm.customVendorName) ? clientForm.customVendorName : ''}
                          onChange={(e) => {
                            const selectedVal = e.target.value;
                            if (selectedVal !== '') {
                              const isPreset = ['ATHENA', 'ECO', 'FIESTA', 'FOURWAY', 'R6 MARS', 'ROVER FLEET', 'SELECT CABS'].includes(selectedVal);
                              setClientForm({
                                ...clientForm,
                                customVendorName: selectedVal,
                                vendorName: isPreset ? selectedVal : 'custom',
                              });
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-2xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 font-semibold cursor-pointer"
                        >
                          <option value="">-- Scroll Registered --</option>
                          {Array.from(new Set((companies || []).map((c) => c.vendorName || 'ECO').filter(Boolean))).sort().map((vendor) => (
                            <option key={vendor} value={vendor}>
                              {vendor}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Directly type / correct the spelling above, or select from the presets or registered scrolling options to auto-fill.</p>
                  </div>

                  {/* Company Site */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Company Site *</label>
                    <input
                      type="text"
                      placeholder="Type/Edit Company Site"
                      value={clientForm.customCompanySite}
                      onChange={(e) => {
                        const val = e.target.value;
                        const predefined = VENDOR_SITE_MAP[clientForm.customVendorName] || [];
                        const isPreset = predefined.includes(val);
                        setClientForm({
                          ...clientForm,
                          customCompanySite: val,
                          companySite: isPreset ? val : 'custom',
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 mb-2"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1">Predefined Presets</label>
                        <select
                          value={(VENDOR_SITE_MAP[clientForm.customVendorName] || []).includes(clientForm.customCompanySite) ? clientForm.customCompanySite : 'custom'}
                          onChange={(e) => {
                            const selectedSite = e.target.value;
                            if (selectedSite !== 'custom' && selectedSite !== '') {
                              setClientForm({
                                ...clientForm,
                                companySite: selectedSite,
                                customCompanySite: selectedSite,
                              });
                            } else {
                              setClientForm({
                                ...clientForm,
                                companySite: 'custom',
                              });
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-2xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 font-semibold cursor-pointer"
                        >
                          <option value="custom">-- Choose Preset --</option>
                          {(VENDOR_SITE_MAP[clientForm.customVendorName] || []).map((site) => (
                            <option key={site} value={site}>
                              {site}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-medium mb-1">Scroll Registered</label>
                        <select
                          value={Array.from(new Set((companies || []).map((c) => c.companySite || c.name).filter(Boolean))).sort().includes(clientForm.customCompanySite) ? clientForm.customCompanySite : ''}
                          onChange={(e) => {
                            const selectedVal = e.target.value;
                            if (selectedVal !== '') {
                              const predefined = VENDOR_SITE_MAP[clientForm.customVendorName] || [];
                              const isPreset = predefined.includes(selectedVal);
                              setClientForm({
                                ...clientForm,
                                customCompanySite: selectedVal,
                                companySite: isPreset ? selectedVal : 'custom',
                              });
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-2xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 font-semibold cursor-pointer"
                        >
                          <option value="">-- Scroll Registered --</option>
                          {Array.from(new Set((companies || []).map((c) => c.companySite || c.name).filter(Boolean))).sort().map((site) => (
                            <option key={site} value={site}>
                              {site}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Directly type / correct the spelling above, or pick from either standard presets or active registered company sites.</p>
                  </div>

                {/* Billing/Payment Terms */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Billing Terms *</label>
                  <select
                    value={clientForm.paymentTerms}
                    onChange={(e) => setClientForm({ ...clientForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Monthly">Monthly</option>
                    <option value="custom">-- Custom Billing Terms --</option>
                  </select>

                  {clientForm.paymentTerms === 'custom' && (
                    <input
                      type="text"
                      placeholder="e.g. Net 90, COD, etc."
                      value={clientForm.customPaymentTerms}
                      onChange={(e) => setClientForm({ ...clientForm, customPaymentTerms: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingClient(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                >
                  Cancel
                </button>
                {editingClient ? (
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      onClick={() => setIsSpellingAction(true)}
                      className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Click to save and propagate spelling correction of Vendor Name/Company Site across all tables"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Update Spelling Mistake
                    </button>
                    <button
                      type="submit"
                      onClick={() => setIsSpellingAction(false)}
                      className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                    >
                      Update Details
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    Add Client
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
