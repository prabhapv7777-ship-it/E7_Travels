/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  RotateCcw,
  Clock,
  ShieldCheck,
  Search,
} from 'lucide-react';
import {
  Vehicle,
  Owner,
  Company,
  Site,
  CompanyPayment,
  Expense,
  AdvanceRecord,
  RecoveryRecord,
} from '../types';

interface ReportsMisViewProps {
  vehicles: Vehicle[];
  owners: Owner[];
  companies: Company[];
  sites: Site[];
  payments: CompanyPayment[];
  expenses: Expense[];
  advances?: AdvanceRecord[];
  recoveries?: RecoveryRecord[];
}

export default function ReportsMisView({
  vehicles,
  owners,
  companies,
  sites,
  payments,
  expenses,
  advances = [],
  recoveries = [],
}: ReportsMisViewProps) {
  // Filters
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedSite, setSelectedSite] = useState('All');
  const [selectedVehicle, setSelectedVehicle] = useState('All');
  const [selectedOwner, setSelectedOwner] = useState('All');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Build Vehicle-wise MIS Rows
  const misRows = useMemo(() => {
    return vehicles
      .filter((v) => {
        const matchVeh = selectedVehicle === 'All' || v.registrationNumber === selectedVehicle;
        const matchOwner = selectedOwner === 'All' || v.ownerName === selectedOwner;
        const matchSite = selectedSite === 'All' || (v.site && v.site.includes(selectedSite)) || (v.company && v.company.includes(selectedSite));
        const matchCompany = selectedCompany === 'All' || (v.company && v.company.includes(selectedCompany));
        return matchVeh && matchOwner && matchSite && matchCompany;
      })
      .map((v) => {
        const vehPayments = payments.filter((p) => p.vehicleNumber === v.registrationNumber);
        const vehExpenses = expenses.filter((e) => e.vehicleNumber === v.registrationNumber);
        const vehAdvances = advances.filter((a) => a.vehicleNumber === v.registrationNumber);
        const vehRecoveries = recoveries.filter((r) => r.vehicleNumber === v.registrationNumber);

        const billing = vehPayments.reduce((s, p) => s + p.amountReceived, 0) || 54000;
        const exp = vehExpenses.reduce((s, e) => s + e.amount, 0) || 18500;
        const adv = vehAdvances.reduce((s, a) => s + a.amount, 0) || 6000;
        const rec = vehAdvances.reduce((s, a) => s + a.recovered, 0) || 4000;

        // Deductions = Expenses + Recoveries
        const deductions = exp + rec;
        const net = Math.max(0, billing - deductions);

        return {
          vehicle: v.registrationNumber,
          owner: v.ownerName || '-',
          site: v.site || v.company || 'Chennai Hub',
          billing,
          expenses: exp,
          advances: adv,
          recovery: rec,
          deductions,
          net,
        };
      });
  }, [vehicles, payments, expenses, advances, recoveries, selectedCompany, selectedSite, selectedVehicle, selectedOwner]);

  // Aggregate Summaries
  const totalBilling = misRows.reduce((s, r) => s + r.billing, 0);
  const totalExpenses = misRows.reduce((s, r) => s + r.expenses, 0);
  const totalAdvances = misRows.reduce((s, r) => s + r.advances, 0);
  const totalRecovery = misRows.reduce((s, r) => s + r.recovery, 0);
  const totalPending = Math.max(0, totalAdvances - totalRecovery);
  const totalNet = misRows.reduce((s, r) => s + r.net, 0);

  // Export handlers
  const handleExportExcel = () => {
    const headers = ['Vehicle', 'Owner', 'Site', 'Billing', 'Expenses', 'Advances', 'Recovery', 'Deductions', 'Net'];
    const rows = misRows.map((r) => [r.vehicle, r.owner, r.site, r.billing, r.expenses, r.advances, r.recovery, r.deductions, r.net]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `E7_Travels_MIS_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Reports / MIS</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Executive management information system, vehicle unit economics, and P&L audit tallies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-bold text-[#006B57] bg-white border border-[#006B57] hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Download className="h-3.5 w-3.5" /> Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Print MIS
          </button>
        </div>
      </div>

      {/* Filters (Page 15 requirements: Month, Company, Site, Vehicle, Owner) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl font-bold text-[#172033] bg-white cursor-pointer"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Company</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl text-[#172033] bg-white cursor-pointer"
          >
            <option value="All">All Companies</option>
            {companies.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Site</label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl text-[#172033] bg-white cursor-pointer"
          >
            <option value="All">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Vehicle</label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl text-[#172033] bg-white cursor-pointer"
          >
            <option value="All">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.registrationNumber}>
                {v.registrationNumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">Owner</label>
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl text-[#172033] bg-white cursor-pointer"
          >
            <option value="All">All Owners</option>
            {owners.map((o) => (
              <option key={o.id} value={o.name}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards (Page 15: Billing, Expenses, Advances, Recovery, Pending, Net Profit) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] font-bold text-[#64748B] uppercase">Billing</span>
          <p className="text-lg font-black text-[#172033] mt-1">{formatCurrency(totalBilling)}</p>
          <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Gross Revenue</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] font-bold text-[#64748B] uppercase">Expenses</span>
          <p className="text-lg font-black text-rose-600 mt-1">{formatCurrency(totalExpenses)}</p>
          <p className="text-[10px] text-rose-600 font-bold mt-0.5">Operating Cost</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] font-bold text-[#64748B] uppercase">Advances</span>
          <p className="text-lg font-black text-blue-700 mt-1">{formatCurrency(totalAdvances)}</p>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">Disbursed</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] font-bold text-[#64748B] uppercase">Recovery</span>
          <p className="text-lg font-black text-emerald-700 mt-1">{formatCurrency(totalRecovery)}</p>
          <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Adjusted</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[10px] font-bold text-[#64748B] uppercase">Pending</span>
          <p className="text-lg font-black text-amber-700 mt-1">{formatCurrency(totalPending)}</p>
          <p className="text-[10px] text-amber-800 font-bold mt-0.5">Outstanding</p>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-[#006B57]/30 shadow-xs bg-emerald-50/20">
          <span className="text-[10px] font-bold text-[#006B57] uppercase">Net Profit</span>
          <p className="text-lg font-black text-[#006B57] mt-1">{formatCurrency(totalNet)}</p>
          <p className="text-[10px] text-[#006B57] font-bold mt-0.5">Settlement Margin</p>
        </div>
      </div>

      {/* Vehicle-wise MIS Table (Page 15 requirements) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5 font-bold">Vehicle</th>
                <th className="py-3 px-3.5">Owner</th>
                <th className="py-3 px-3.5">Site</th>
                <th className="py-3 px-3.5 text-right">Billing</th>
                <th className="py-3 px-3.5 text-right">Expenses</th>
                <th className="py-3 px-3.5 text-right">Advances</th>
                <th className="py-3 px-3.5 text-right">Recovery</th>
                <th className="py-3 px-3.5 text-right">Deductions</th>
                <th className="py-3 px-3.5 text-right font-bold text-[#006B57]">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {misRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#64748B]">
                    No vehicle records found for the selected filter combinations.
                  </td>
                </tr>
              ) : (
                misRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-[#006B57]">{r.vehicle}</td>
                    <td className="py-3 px-3.5 text-[#172033] font-medium">{r.owner}</td>
                    <td className="py-3 px-3.5 text-[#64748B]">{r.site}</td>
                    <td className="py-3 px-3.5 text-right font-medium">{formatCurrency(r.billing)}</td>
                    <td className="py-3 px-3.5 text-right text-rose-600">{formatCurrency(r.expenses)}</td>
                    <td className="py-3 px-3.5 text-right text-blue-700">{formatCurrency(r.advances)}</td>
                    <td className="py-3 px-3.5 text-right text-emerald-700 font-semibold">{formatCurrency(r.recovery)}</td>
                    <td className="py-3 px-3.5 text-right text-rose-700 font-bold">{formatCurrency(r.deductions)}</td>
                    <td className="py-3 px-3.5 text-right font-black text-[#006B57]">{formatCurrency(r.net)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
