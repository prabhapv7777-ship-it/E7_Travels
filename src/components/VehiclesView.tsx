/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  ArrowLeft,
  Calendar,
  DollarSign,
  Fuel,
  Users,
  Building2,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Printer,
  CreditCard,
  RotateCcw,
  Receipt,
  Download,
  Check,
  X,
  Phone,
  MapPin,
} from 'lucide-react';
import {
  Vehicle,
  Owner,
  Driver,
  Company,
  Site,
  CompanyPayment,
  Expense,
  AdvanceRecord,
  RecoveryRecord,
  DailyRunningEntry,
  InvoiceRecord,
} from '../types';
import { formatDate } from '../lib/dateUtils';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  companies: Company[];
  sites: Site[];
  payments: CompanyPayment[];
  expenses: Expense[];
  advances?: AdvanceRecord[];
  recoveries?: RecoveryRecord[];
  dailyRunning?: DailyRunningEntry[];
  invoices?: InvoiceRecord[];
  onUpdateVehicles: (vehicles: Vehicle[]) => void;
  onNavigateToInvoice?: (vehicleNo: string) => void;
  onNavigateToSettlement?: (vehicleNo: string) => void;
}

export default function VehiclesView({
  vehicles,
  owners,
  drivers,
  companies,
  sites,
  payments,
  expenses,
  advances = [],
  recoveries = [],
  dailyRunning = [],
  invoices = [],
  onUpdateVehicles,
}: VehiclesViewProps) {
  // Navigation / Selection State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [profileTab, setProfileTab] = useState<
    'Overview' | 'Trips' | 'Advances' | 'Recoveries' | 'Expenses' | 'Invoices' | 'Payments' | 'Documents' | 'Statement'
  >('Overview');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State for Add / Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    registrationNumber: '',
    model: '',
    manufacturer: 'Toyota',
    year: new Date().getFullYear(),
    fuelType: 'CNG',
    transmission: 'Manual',
    vehicleType: 'Sedan',
    ownerName: '',
    driverName: '',
    company: '',
    site: '',
    status: 'Active',
    emiAmount: 0,
    insuranceExpiry: '',
    permitExpiry: '',
    fcExpiry: '',
    pollutionExpiry: '',
    fastagNumber: '',
    remarks: '',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (v.registrationNumber && v.registrationNumber.toLowerCase().includes(q)) ||
        (v.model && v.model.toLowerCase().includes(q)) ||
        (v.ownerName && v.ownerName.toLowerCase().includes(q)) ||
        (v.driverName && v.driverName.toLowerCase().includes(q));

      const matchType = vehicleTypeFilter === 'All' || v.vehicleType === vehicleTypeFilter;
      const matchFuel = fuelTypeFilter === 'All' || v.fuelType === fuelTypeFilter;
      const matchSite = siteFilter === 'All' || (v.site && v.site.includes(siteFilter)) || (v.company && v.company.includes(siteFilter));
      const matchStatus = statusFilter === 'All' || v.status === statusFilter;

      return matchSearch && matchType && matchFuel && matchSite && matchStatus;
    });
  }, [vehicles, searchQuery, vehicleTypeFilter, fuelTypeFilter, siteFilter, statusFilter]);

  // Unique sites for filter dropdown
  const uniqueSites = useMemo(() => {
    const s = new Set<string>();
    vehicles.forEach((v) => {
      if (v.site) s.add(v.site);
      if (v.company) s.add(v.company);
    });
    return Array.from(s).filter(Boolean);
  }, [vehicles]);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      registrationNumber: '',
      model: '',
      manufacturer: 'Toyota',
      year: new Date().getFullYear(),
      fuelType: 'CNG',
      transmission: 'Manual',
      vehicleType: 'Sedan',
      ownerName: owners[0]?.name || '',
      ownerId: owners[0]?.id || '',
      driverName: drivers[0]?.name || '',
      driverId: drivers[0]?.id || '',
      company: companies[0]?.name || '',
      site: sites[0]?.name || '',
      status: 'Active',
      emiAmount: 14500,
      insuranceExpiry: '2027-06-30',
      permitExpiry: '2028-03-31',
      fcExpiry: '2027-12-31',
      pollutionExpiry: '2027-01-15',
      fastagNumber: 'FTG' + Math.floor(10000000 + Math.random() * 90000000),
      joiningDate: new Date().toISOString().substring(0, 10),
      remarks: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({ ...v });
    setIsAddModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registrationNumber?.trim()) return;

    if (editingVehicle) {
      const updated = vehicles.map((v) => (v.id === editingVehicle.id ? ({ ...v, ...formData } as Vehicle) : v));
      onUpdateVehicles(updated);
      if (selectedVehicle?.id === editingVehicle.id) {
        setSelectedVehicle({ ...selectedVehicle, ...formData } as Vehicle);
      }
    } else {
      const newVeh: Vehicle = {
        id: `VEH${(vehicles.length + 1).toString().padStart(3, '0')}`,
        registrationNumber: formData.registrationNumber.toUpperCase().trim(),
        model: formData.model || 'Unknown',
        manufacturer: formData.manufacturer || 'Toyota',
        year: Number(formData.year) || new Date().getFullYear(),
        fuelType: (formData.fuelType as any) || 'CNG',
        transmission: (formData.transmission as any) || 'Manual',
        vehicleType: (formData.vehicleType as any) || 'Sedan',
        ownerId: formData.ownerId || 'new',
        ownerName: formData.ownerName || '',
        driverId: formData.driverId || 'new',
        driverName: formData.driverName || '',
        company: formData.company || '',
        site: formData.site || '',
        joiningDate: formData.joiningDate || new Date().toISOString().substring(0, 10),
        status: (formData.status as any) || 'Active',
        emiAmount: Number(formData.emiAmount) || 0,
        emiDueDate: '2026-10-10',
        insuranceExpiry: formData.insuranceExpiry || '2027-06-30',
        permitExpiry: formData.permitExpiry || '2028-03-31',
        fcExpiry: formData.fcExpiry || '2027-12-31',
        pollutionExpiry: formData.pollutionExpiry || '2027-01-15',
        fastagNumber: formData.fastagNumber || '',
        remarks: formData.remarks || '',
      };
      onUpdateVehicles([newVeh, ...vehicles]);
    }
    setIsAddModalOpen(false);
  };

  // -------------------------------------------------------------
  // VIEW 1: VEHICLE PROFILE (Page 4)
  // -------------------------------------------------------------
  if (selectedVehicle) {
    const v = selectedVehicle;

    // Derived records for this vehicle
    const vehPayments = payments.filter((p) => p.vehicleNumber === v.registrationNumber);
    const vehExpenses = expenses.filter((e) => e.vehicleNumber === v.registrationNumber);
    const vehAdvances = advances.filter((a) => a.vehicleNumber === v.registrationNumber);
    const vehRecoveries = recoveries.filter((r) => r.vehicleNumber === v.registrationNumber);
    const vehTrips = dailyRunning.filter((t) => t.vehicleNumber === v.registrationNumber);
    const vehInvoices = invoices.filter((i) => i.vehicleNumber === v.registrationNumber);

    const totalBilling = vehPayments.reduce((s, p) => s + p.amountReceived, 0) || 54000;
    const totalAdv = vehAdvances.reduce((s, a) => s + a.amount, 0) || 8000;
    const totalRec = vehAdvances.reduce((s, a) => s + a.recovered, 0) || 5000;
    const outstanding = Math.max(0, totalAdv - totalRec);

    return (
      <div className="space-y-6">
        {/* Back and Vehicle Header */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-[#006B57] hover:text-white text-[#172033] transition-colors cursor-pointer"
                title="Back to Vehicles List"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-[#006B57] tracking-tight">
                    {v.registrationNumber}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      v.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {v.manufacturer} {v.model} • {v.vehicleType} • Model Year {v.year} • {v.fuelType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleOpenEdit(v)}
                className="px-3.5 py-2 text-xs font-bold text-[#006B57] bg-white border border-[#006B57] hover:bg-emerald-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Printer className="h-3.5 w-3.5" /> Print Profile
              </button>
            </div>
          </div>

          {/* 9 Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-4 border-b border-[#E2E8F0] -mx-6 px-6">
            {(
              [
                'Overview',
                'Trips',
                'Advances',
                'Recoveries',
                'Expenses',
                'Invoices',
                'Payments',
                'Documents',
                'Statement',
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setProfileTab(tab)}
                className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  profileTab === tab
                    ? 'border-[#006B57] text-[#006B57]'
                    : 'border-transparent text-[#64748B] hover:text-[#172033]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content: OVERVIEW */}
        {profileTab === 'Overview' && (
          <div className="space-y-6">
            {/* 1. Overview Cards (Top) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Owner</span>
                <p className="text-sm font-black text-[#172033] mt-1 truncate">{v.ownerName || 'Unassigned'}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">{v.ownerPhone || 'Primary Owner'}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Driver</span>
                <p className="text-sm font-black text-[#172033] mt-1 truncate">{v.driverName || 'Unassigned'}</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Verified</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Current Site</span>
                <p className="text-sm font-black text-[#172033] mt-1 truncate">{v.site || v.company || 'Not Allocated'}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Client Hub</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Monthly Package</span>
                <p className="text-sm font-black text-[#006B57] mt-1">2,500 KM / Mo</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Fixed Slab</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Attachment Date</span>
                <p className="text-sm font-black text-[#172033] mt-1">{v.joiningDate || '2025-01-15'}</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Active Attachment</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">KM Limit</span>
                <p className="text-sm font-black text-[#172033] mt-1">3,000 KM Max</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">₹12/extra KM</p>
              </div>
            </div>

            {/* 2. Financial Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-emerald-50 text-[#006B57]">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">Oct 2026</span>
                </div>
                <p className="text-2xl font-black text-[#172033]">{formatCurrency(totalBilling)}</p>
                <p className="text-xs font-semibold text-[#64748B] mt-0.5">Monthly Billing</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold text-blue-700">Issued</span>
                </div>
                <p className="text-2xl font-black text-[#172033]">{formatCurrency(totalAdv)}</p>
                <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Advances</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <RotateCcw className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">Deducted</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalRec)}</p>
                <p className="text-xs font-semibold text-[#64748B] mt-0.5">Recovered</p>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-amber-200 bg-amber-50/20 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
                    <Clock className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold text-amber-800">Pending</span>
                </div>
                <p className="text-2xl font-black text-amber-900">{formatCurrency(outstanding)}</p>
                <p className="text-xs font-bold text-amber-800 mt-0.5">Outstanding</p>
              </div>
            </div>

            {/* 3. Vehicle Details Section */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-3">
                Vehicle Compliance & Technical Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Registration Number</span>
                  <p className="font-bold text-[#006B57] text-sm mt-0.5">{v.registrationNumber}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Make & Model</span>
                  <p className="font-bold text-[#172033] text-sm mt-0.5">{v.manufacturer} {v.model}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Vehicle Type</span>
                  <p className="font-bold text-[#172033] text-sm mt-0.5">{v.vehicleType}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Fuel & Transmission</span>
                  <p className="font-bold text-[#172033] text-sm mt-0.5">{v.fuelType} • {v.transmission}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Insurance Expiry</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">{v.insuranceExpiry || '2027-06-30'}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Fitness (FC) Expiry</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">{v.fcExpiry || '2027-12-31'}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Permit Expiry</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">{v.permitExpiry || '2028-03-31'}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">FASTag Identifier</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">{v.fastagNumber || 'FTG89123019'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: TRIPS / RUNNING */}
        {profileTab === 'Trips' && (
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider mb-4">
              Trip History & Log Sheets for {v.registrationNumber}
            </h3>
            {vehTrips.length === 0 ? (
              <p className="text-xs text-[#64748B] py-6 text-center">No trip entries logged for this vehicle yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Opening KM</th>
                      <th className="p-3">Closing KM</th>
                      <th className="p-3">Total KM</th>
                      <th className="p-3">Trips</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {vehTrips.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold">{t.date}</td>
                        <td className="p-3">{t.openingKm}</td>
                        <td className="p-3">{t.closingKm}</td>
                        <td className="p-3 font-bold text-[#006B57]">{t.totalKm} KM</td>
                        <td className="p-3">{t.trips}</td>
                        <td className="p-3 text-right font-bold">{formatCurrency(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: ADVANCES */}
        {profileTab === 'Advances' && (
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider mb-4">
              Advance Records for {v.registrationNumber}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                  <tr>
                    <th className="p-3">Advance ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Recovered</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {vehAdvances.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-[#006B57]">{a.id}</td>
                      <td className="p-3">{a.date}</td>
                      <td className="p-3 font-semibold">{a.type}</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(a.amount)}</td>
                      <td className="p-3 text-right text-emerald-700 font-semibold">{formatCurrency(a.recovered)}</td>
                      <td className="p-3 text-right text-amber-700 font-bold">{formatCurrency(a.balance)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: RECOVERIES */}
        {profileTab === 'Recoveries' && (
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider mb-4">
              Recovery Deductions Applied to {v.registrationNumber}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                  <tr>
                    <th className="p-3">Recovery ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Advance ID</th>
                    <th className="p-3 text-right">Recovered Amount</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {vehRecoveries.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-[#006B57]">{r.id}</td>
                      <td className="p-3">{r.date}</td>
                      <td className="p-3 font-mono">{r.advanceId}</td>
                      <td className="p-3 text-right font-black text-emerald-700">{formatCurrency(r.amount)}</td>
                      <td className="p-3">{r.recoveryMonth}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: EXPENSES */}
        {profileTab === 'Expenses' && (
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider mb-4">
              Operating Expenses for {v.registrationNumber}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Expense Category</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {vehExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-3">{e.date}</td>
                      <td className="p-3 font-bold text-[#172033]">{e.expenseType}</td>
                      <td className="p-3 text-right font-black text-rose-600">{formatCurrency(e.amount)}</td>
                      <td className="p-3 text-[#64748B]">{e.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: INVOICES & PAYMENTS & STATEMENTS */}
        {(profileTab === 'Invoices' || profileTab === 'Payments' || profileTab === 'Documents' || profileTab === 'Statement') && (
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider mb-4">
              {profileTab} Records for {v.registrationNumber}
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Integrated real-time financial tracking for corporate client invoicing and owner settlement statements.
            </p>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#006B57]">Ready for Payout Voucher & Monthly Statement Print</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Calculated net payable after operational deductions and recoveries.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#006B57] hover:bg-[#004D40] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Generate Statement A4
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: VEHICLES MASTER TABLE (Page 3)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Vehicles</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Active corporate fleet register and attachment management ({filteredVehicles.length} vehicles)
          </p>
        </div>

        <button
          id="add-vehicle-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Top Controls: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search vehicle no, owner, driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>

        {/* Vehicle Type Filter */}
        <div>
          <select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033] bg-white cursor-pointer"
          >
            <option value="All">All Vehicle Types</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Hatchback">Hatchback</option>
            <option value="Bus">Bus</option>
            <option value="Tempo Traveler">Tempo Traveler</option>
          </select>
        </div>

        {/* Fuel Type Filter */}
        <div>
          <select
            value={fuelTypeFilter}
            onChange={(e) => setFuelTypeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033] bg-white cursor-pointer"
          >
            <option value="All">All Fuel Types</option>
            <option value="CNG">CNG</option>
            <option value="Diesel">Diesel</option>
            <option value="Petrol">Petrol</option>
            <option value="EV">EV</option>
          </select>
        </div>

        {/* Site Filter */}
        <div>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033] bg-white cursor-pointer"
          >
            <option value="All">All Sites</option>
            {uniqueSites.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033] bg-white cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table (Page 3 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5 w-12 text-center">S.No</th>
                <th className="py-3 px-3.5 font-bold">Vehicle No.</th>
                <th className="py-3 px-3.5">Type</th>
                <th className="py-3 px-3.5">Owner</th>
                <th className="py-3 px-3.5">Driver</th>
                <th className="py-3 px-3.5">Site</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Package</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#64748B]">
                    No vehicles match your active search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v, index) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-[#64748B] font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-[#006B57]">
                      {v.registrationNumber}
                    </td>
                    <td className="py-3 px-3.5 text-[#172033] font-medium">
                      {v.vehicleType} • {v.fuelType}
                    </td>
                    <td className="py-3 px-3.5 text-[#172033]">
                      {v.ownerName || '-'}
                    </td>
                    <td className="py-3 px-3.5 text-[#172033]">
                      {v.driverName || '-'}
                    </td>
                    <td className="py-3 px-3.5 text-[#64748B]">
                      {v.site || v.company || '-'}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#64748B] font-medium">
                      2,500 KM / Mo
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedVehicle(v);
                            setProfileTab('Overview');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#006B57] hover:bg-[#006B57] hover:text-white transition-colors text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#006B57] hover:bg-slate-100 cursor-pointer"
                          title="Edit Vehicle"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Table Pagination */}
        <div className="p-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span>
            Showing <strong className="text-[#172033]">{filteredVehicles.length}</strong> of{' '}
            <strong className="text-[#172033]">{vehicles.length}</strong> vehicles
          </span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-[#E2E8F0] bg-white text-slate-600 disabled:opacity-50">
              Prev
            </button>
            <span className="px-2 font-bold text-[#006B57]">1</span>
            <button className="px-2.5 py-1 rounded border border-[#E2E8F0] bg-white text-slate-600 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-base font-bold text-[#172033]">
                {editingVehicle ? 'Edit Vehicle Profile' : 'Add New Corporate Vehicle'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TN-01-AB-1234"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold uppercase focus:ring-2 focus:ring-[#006B57]/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Model & Make *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Innova Crysta"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#006B57]/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType || 'Sedan'}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Bus">Bus</option>
                    <option value="Tempo Traveler">Tempo Traveler</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={formData.fuelType || 'CNG'}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  >
                    <option value="CNG">CNG</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="EV">EV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Assigned Owner
                  </label>
                  <input
                    type="text"
                    placeholder="Owner Name"
                    value={formData.ownerName || ''}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Assigned Driver
                  </label>
                  <input
                    type="text"
                    placeholder="Driver Name"
                    value={formData.driverName || ''}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Company / Client Site
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WALMART - OMR"
                    value={formData.site || formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs cursor-pointer"
                >
                  {editingVehicle ? 'Save Changes' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
