/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  DollarSign,
  User,
  Bell,
  FileText,
  Upload,
  ShieldCheck,
  Save,
  CheckCircle,
  Database,
  RefreshCw,
  Car,
} from 'lucide-react';
import { FinancialSettings, Vehicle, Company, Site } from '../types';

interface SettingsViewProps {
  financialSettings: FinancialSettings;
  vehicles: Vehicle[];
  companies: Company[];
  sites: Site[];
  onUpdateFinancialSettings: (settings: FinancialSettings) => void;
  onExportBackupJSON?: () => void;
  onImportBackupJSON?: (importedData: any) => Promise<void> | void;
}

export default function SettingsView({
  financialSettings,
  vehicles,
  companies,
  sites,
  onUpdateFinancialSettings,
  onExportBackupJSON,
  onImportBackupJSON,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<
    'Financial Settings' | 'Company Settings' | 'User Settings' | 'Notification Settings' | 'Invoice Settings' | 'Data Import' | 'Backup & Security'
  >('Financial Settings');

  // Financial Settings State
  const [settings, setSettings] = useState<FinancialSettings>({ ...financialSettings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Per-vehicle fixed deduction state
  const [vehicleDeductions, setVehicleDeductions] = useState<Record<string, number>>(
    financialSettings.vehicleFixedDeductions || {}
  );

  const handleSaveFinancials = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: FinancialSettings = {
      ...settings,
      vehicleFixedDeductions: vehicleDeductions,
    };
    onUpdateFinancialSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleVehicleDeductionChange = (vNo: string, amount: number) => {
    setVehicleDeductions({
      ...vehicleDeductions,
      [vNo]: amount,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">System Settings</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure financial business rules, corporate parameters, per-vehicle deduction policies, and database security
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <CheckCircle className="h-4 w-4 text-[#006B57]" /> Changes Saved Successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar for Settings */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-3 space-y-1">
          {(
            [
              { id: 'Financial Settings', label: 'Financial Settings', icon: DollarSign },
              { id: 'Company Settings', label: 'Company Settings', icon: Building2 },
              { id: 'User Settings', label: 'User Settings', icon: User },
              { id: 'Notification Settings', label: 'Notification Settings', icon: Bell },
              { id: 'Invoice Settings', label: 'Invoice Settings', icon: FileText },
              { id: 'Data Import', label: 'Data Import', icon: Upload },
              { id: 'Backup & Security', label: 'Backup & Security', icon: ShieldCheck },
            ] as const
          ).map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSection === sec.id
                    ? 'bg-[#006B57] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100 hover:text-[#172033]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-6">
          {/* SECTION 1: FINANCIAL SETTINGS */}
          {activeSection === 'Financial Settings' && (
            <form onSubmit={handleSaveFinancials} className="space-y-6">
              <div className="border-b border-[#E2E8F0] pb-3">
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  Corporate Financial Rules & Commissions
                </h3>
                <p className="text-2xs text-[#64748B] mt-0.5">
                  Configure default percentages, administrative retainers, and statutory deduction policies
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    CNG Profit Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={settings.cngProfitPercent}
                    onChange={(e) => setSettings({ ...settings, cngProfitPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold text-[#172033]"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1">E7 Travels profit margin applied to fuel advances</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    E7 Travels Fixed Platform Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.e7TravelsCharge}
                    onChange={(e) => setSettings({ ...settings, e7TravelsCharge: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold text-[#172033]"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1">Standard monthly administrative retainer per vehicle</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Service Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.serviceCommissionPercent}
                    onChange={(e) => setSettings({ ...settings, serviceCommissionPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Default GST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultGstPercent}
                    onChange={(e) => setSettings({ ...settings, defaultGstPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Default TDS Withholding (%)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultTdsPercent}
                    onChange={(e) => setSettings({ ...settings, defaultTdsPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold text-[#172033]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Default Monthly Fixed Deduction (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.fixedDeductionDefault}
                    onChange={(e) => setSettings({ ...settings, fixedDeductionDefault: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold text-[#172033]"
                  />
                </div>
              </div>

              {/* Per-Vehicle Fixed Deduction Configuration (Critical Requirement) */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="h-4 w-4 text-[#006B57]" /> Per-Vehicle Custom Fixed Deductions
                    </h4>
                    <p className="text-2xs text-[#64748B]">
                      Override the default fixed deduction for vehicles with custom contractual agreements
                    </p>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0]">
                  {vehicles.map((v) => {
                    const currentDeduction =
                      vehicleDeductions[v.registrationNumber] !== undefined
                        ? vehicleDeductions[v.registrationNumber]
                        : settings.fixedDeductionDefault;

                    return (
                      <div key={v.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-bold text-[#006B57]">{v.registrationNumber}</p>
                          <p className="text-[10px] text-[#64748B]">
                            {v.model} • Owner: {v.ownerName || 'Direct'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={currentDeduction}
                            onChange={(e) => handleVehicleDeductionChange(v.registrationNumber, Number(e.target.value))}
                            className="w-28 px-2.5 py-1 text-xs font-bold border border-[#E2E8F0] rounded-lg text-right font-mono"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#D4A72C] hover:bg-[#C09420] text-[#172033] font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Save Financial Policies
                </button>
              </div>
            </form>
          )}

          {/* SECTION 2: COMPANY SETTINGS */}
          {activeSection === 'Company Settings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider border-b border-[#E2E8F0] pb-3">
                E7 Travels Corporate Identity
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Company Trade Name</label>
                  <input type="text" readOnly value="E7 TRAVELS FLEET ERP" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Operational Hub</label>
                  <input type="text" readOnly value="Chennai Central Command Hub" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-bold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">GST Identification Number</label>
                  <input type="text" readOnly value="33AAACE7000F1Z2" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Administrative Email</label>
                  <input type="text" readOnly value="admin@e7travels.com" className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: USER SETTINGS */}
          {activeSection === 'User Settings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider border-b border-[#E2E8F0] pb-3">
                Administrator Profile & Access
              </h3>
              <p className="text-xs text-[#64748B]">
                Active Administrator: <strong className="text-[#172033]">admin@e7travels.com</strong> (Role: Super Admin). Full read/write access to financial settlements, vehicle masters, and cloud databases.
              </p>
            </div>
          )}

          {/* SECTION 4: NOTIFICATIONS */}
          {activeSection === 'Notification Settings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider border-b border-[#E2E8F0] pb-3">
                Fleet Alert Reminders
              </h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-[#006B57] rounded" />
                  <span>Alert 30 days prior to Insurance, Fitness (FC), or Permit expiry</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-[#006B57] rounded" />
                  <span>Notify when Driver Badge or Licence reaches 45 days compliance limit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-[#006B57] rounded" />
                  <span>Send pending recovery warning when outstanding advance exceeds ₹10,000</span>
                </label>
              </div>
            </div>
          )}

          {/* SECTION 5: INVOICE SETTINGS */}
          {activeSection === 'Invoice Settings' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider border-b border-[#E2E8F0] pb-3">
                Tax Invoice Prefix & Format
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Invoice Number Prefix</label>
                  <input type="text" readOnly value="E7/2026-27/" className="w-full px-3 py-2 border rounded-xl bg-slate-50 font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] mb-1">Default Payment Terms</label>
                  <input type="text" readOnly value="Net 30 Days" className="w-full px-3 py-2 border rounded-xl bg-slate-50" />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: DATA IMPORT */}
          {activeSection === 'Data Import' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider border-b border-[#E2E8F0] pb-3">
                Bulk CSV & Excel Data Migration
              </h3>
              <p className="text-xs text-[#64748B]">
                Upload CSV sheets to import bulk vehicles, owners, drivers, and previous trip log sheets into your E7 Travels database.
              </p>
              <div className="p-8 border-2 border-dashed border-[#E2E8F0] rounded-xl text-center">
                <Upload className="h-8 w-8 text-[#006B57] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#172033]">Drop CSV Files Here or Click to Browse</p>
                <p className="text-[10px] text-[#64748B] mt-1">Supports Vehicles, Owners, Drivers, and Historical Advances</p>
              </div>
            </div>
          )}

          {/* SECTION 7: BACKUP & SECURITY */}
          {activeSection === 'Backup & Security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider border-b border-[#E2E8F0] pb-3">
                Database Backup & Security
              </h3>
              <p className="text-xs text-[#64748B]">
                Your application state is automatically replicated across Firebase Firestore Cloud and local offline storage.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onExportBackupJSON}
                  className="px-4 py-2 bg-[#006B57] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#004D40] cursor-pointer flex items-center gap-1.5"
                >
                  <Database className="h-4 w-4" /> Download JSON Backup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
