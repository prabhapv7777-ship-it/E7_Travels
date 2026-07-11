/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Company, Site } from '../types';

interface SettingsProps {
  companies: Company[];
  sites: Site[];
  spreadsheetId: string | null;
  onUpdateCompanies: (c: Company[]) => void;
  onUpdateSites: (s: Site[]) => void;
  onForceSync: () => void;
  customLogo: string | null;
  onUpdateLogo: (logo: string | null) => void;
}

export default function Settings({
  companies,
  sites,
  spreadsheetId,
  onUpdateCompanies,
  onUpdateSites,
  onForceSync,
  customLogo,
  onUpdateLogo,
}: SettingsProps) {
  const [newCompName, setNewCompName] = useState('');
  const [newCompTerms, setNewCompTerms] = useState('Net 30');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; type: 'company' | 'site'; title: string } | null>(null);

  const [taxRate, setTaxRate] = useState(5);
  const [commissionRate, setCommissionRate] = useState(15);

  const [originalLogo, setOriginalLogo] = useState<string | null>(() => {
    return localStorage.getItem('e7_original_logo') || null;
  });
  const [bgThreshold, setBgThreshold] = useState(240);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOriginalLogo(base64);
      localStorage.setItem('e7_original_logo', base64);
      applyBackgroundRemoval(base64, bgThreshold);
    };
    reader.readAsDataURL(file);
  };

  const applyBackgroundRemoval = (base64Str: string, threshold: number) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
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
    };
    img.onerror = () => {
      onUpdateLogo(base64Str);
    };
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName) return;

    const exists = companies.some((c) => c.name.toLowerCase() === newCompName.toLowerCase());
    if (exists) {
      alert('Company name must be unique!');
      return;
    }

    const newCompany: Company = {
      name: newCompName,
      billingCycle: 'Monthly',
      paymentTerms: newCompTerms,
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
    };

    onUpdateCompanies([...companies, newCompany]);
    setNewCompName('');
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
    if (!newSiteName) return;

    const exists = sites.some((s) => s.name.toLowerCase() === newSiteName.toLowerCase());
    if (exists) {
      alert('Site name must be unique!');
      return;
    }

    const newSite: Site = {
      id: `SITE-${Date.now()}`,
      name: newSiteName,
      companyName: companies[0]?.name || 'Direct',
      location: newSiteLocation || 'Chennai SEZ',
      contactPerson: '',
      phone: '',
      remarks: '',
    };

    onUpdateSites([...sites, newSite]);
    setNewSiteName('');
    setNewSiteLocation('');
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
      {/* Cloud Integration Details */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
          <Cloud className="text-blue-600 h-5 w-5" /> Google Sheets Database Mappings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col justify-between">
            <div>
              <span className="text-3xs font-semibold text-slate-400 uppercase">Synchronisation Mode</span>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <CheckCircle className="text-emerald-500 h-4 w-4" /> Live Google Sheets Database
              </p>
              <p className="text-3xs text-slate-500 mt-2">
                All changes made on vehicles, owners, drivers, billing payments, and operational deductions are saved
                directly to the designated spreadsheet.
              </p>
            </div>
            {spreadsheetId && (
              <p className="text-3xs text-slate-400 font-mono mt-3 truncate">
                Spreadsheet ID: {spreadsheetId}
              </p>
            )}
          </div>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col justify-between">
            <div>
              <span className="text-3xs font-semibold text-slate-400 uppercase">Conflict Reconciliation</span>
              <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <Database className="text-blue-500 h-4 w-4" /> Dual-Mode State engine
              </p>
              <p className="text-3xs text-slate-500 mt-2">
                In case of offline operation or network drops, data is automatically stored in standard client state and pushes to
                Google Drive as soon as connectivity resumes.
              </p>
            </div>
            <button
              id="sync-settings-btn"
              onClick={onForceSync}
              className="mt-4 px-3 py-1 text-2xs font-semibold bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-md shadow-3xs flex items-center justify-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Force Remote Synchronization
            </button>
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
                <label className="relative flex flex-col items-center justify-center w-full h-10 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg cursor-pointer bg-white transition-all hover:bg-blue-50/10">
                  <span className="text-2xs font-extrabold text-blue-600 uppercase tracking-wider">Choose Image File...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building className="text-slate-400 h-4 w-4" /> Client Corporate Registry
          </h3>

          <form onSubmit={handleAddCompany} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input
              id="set-comp-name"
              type="text"
              placeholder="Client Name"
              value={newCompName}
              onChange={(e) => setNewCompName(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white md:col-span-2"
            />
            <button
              id="set-comp-submit"
              type="submit"
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center justify-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Client
            </button>
          </form>

          {/* Table */}
          <div className="overflow-hidden border border-slate-150 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600 text-3xs uppercase">
                  <th className="py-2.5 px-4">Client Name</th>
                  <th className="py-2.5 px-4">Billing Terms</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {companies.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50/20">
                    <td className="py-2 px-4">{c.name}</td>
                    <td className="py-2 px-4 text-slate-500 font-mono">{c.paymentTerms}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        id={`btn-del-setcomp-${c.name}`}
                        onClick={() => handleDeleteCompany(c.name)}
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

        {/* Site Master */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin className="text-slate-400 h-4 w-4" /> Operational Site Hub Registry
          </h3>

          <form onSubmit={handleAddSite} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input
              id="set-site-name"
              type="text"
              placeholder="Site Hub Name"
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
            <button
              id="set-site-submit"
              type="submit"
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center justify-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Hub
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
    </div>
  );
}
