/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Car,
  Filter,
  DollarSign,
  TrendingUp,
  X,
  Gauge,
} from 'lucide-react';
import { DailyRunningEntry, Vehicle, Driver } from '../types';

interface DailyRunningViewProps {
  dailyRunning: DailyRunningEntry[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onUpdateDailyRunning: (entries: DailyRunningEntry[]) => void;
}

export default function DailyRunningView({
  dailyRunning,
  vehicles,
  drivers,
  onUpdateDailyRunning,
}: DailyRunningViewProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<DailyRunningEntry>>({
    date: new Date().toISOString().substring(0, 10),
    vehicleNumber: vehicles[0]?.registrationNumber || '',
    driverName: vehicles[0]?.driverName || drivers[0]?.name || '',
    openingKm: 45000,
    closingKm: 45150,
    totalKm: 150,
    trips: 4,
    amount: 3200,
    remarks: '',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredEntries = useMemo(() => {
    return dailyRunning.filter((entry) => {
      const matchMonth = !selectedMonth || entry.date.startsWith(selectedMonth);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        entry.vehicleNumber.toLowerCase().includes(q) ||
        entry.driverName.toLowerCase().includes(q) ||
        (entry.remarks && entry.remarks.toLowerCase().includes(q));

      return matchMonth && matchSearch;
    });
  }, [dailyRunning, selectedMonth, searchQuery]);

  const totalKmSum = filteredEntries.reduce((s, e) => s + e.totalKm, 0);
  const totalTripsSum = filteredEntries.reduce((s, e) => s + e.trips, 0);
  const totalAmountSum = filteredEntries.reduce((s, e) => s + e.amount, 0);

  const handleOpenAdd = () => {
    const v = vehicles[0];
    setFormData({
      date: new Date().toISOString().substring(0, 10),
      vehicleNumber: v?.registrationNumber || '',
      driverName: v?.driverName || '',
      openingKm: 50000,
      closingKm: 50140,
      totalKm: 140,
      trips: 4,
      amount: 3200,
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleVehicleChange = (vNo: string) => {
    const v = vehicles.find((item) => item.registrationNumber === vNo);
    setFormData({
      ...formData,
      vehicleNumber: vNo,
      driverName: v?.driverName || formData.driverName,
    });
  };

  const handleKmChange = (openKm: number, closeKm: number) => {
    const diff = Math.max(0, closeKm - openKm);
    setFormData({
      ...formData,
      openingKm: openKm,
      closingKm: closeKm,
      totalKm: diff,
      amount: Math.round(diff * 22),
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleNumber) return;

    const newEntry: DailyRunningEntry = {
      id: `RUN-${new Date().getTime()}`,
      date: formData.date || new Date().toISOString().substring(0, 10),
      vehicleNumber: formData.vehicleNumber,
      driverName: formData.driverName || '',
      openingKm: Number(formData.openingKm) || 0,
      closingKm: Number(formData.closingKm) || 0,
      totalKm: Number(formData.totalKm) || 0,
      trips: Number(formData.trips) || 1,
      amount: Number(formData.amount) || 0,
      remarks: formData.remarks || '',
    };

    onUpdateDailyRunning([newEntry, ...dailyRunning]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Daily Running</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Duty slips, odometer readings, client KM runs, and trip billing tallies
          </p>
        </div>

        <button
          id="add-running-entry-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Running Entry</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-[#006B57]">
              <Gauge className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-[#006B57]">KM Meter</span>
          </div>
          <p className="text-2xl font-black text-[#172033]">{totalKmSum.toLocaleString('en-IN')} KM</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Mileage Logged</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Car className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-blue-700">Duties</span>
          </div>
          <p className="text-2xl font-black text-[#172033]">{totalTripsSum} Trips</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Trips Executed</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <DollarSign className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-800">Billing Value</span>
          </div>
          <p className="text-2xl font-black text-[#006B57]">{formatCurrency(totalAmountSum)}</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Running Revenue</p>
        </div>
      </div>

      {/* Filters: Month & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search vehicle number, driver name, route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] font-bold cursor-pointer"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="">All Dates</option>
          </select>
        </div>
      </div>

      {/* Table (Page 9 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5 font-bold">Vehicle</th>
                <th className="py-3 px-3.5">Driver</th>
                <th className="py-3 px-3.5 text-right">Opening KM</th>
                <th className="py-3 px-3.5 text-right">Closing KM</th>
                <th className="py-3 px-3.5 text-right">Total KM</th>
                <th className="py-3 px-3.5 text-center">Trips</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#64748B]">
                    No daily running entries recorded for this period.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-[#64748B]">{e.date}</td>
                    <td className="py-3 px-3.5 font-bold text-[#006B57]">{e.vehicleNumber}</td>
                    <td className="py-3 px-3.5 text-[#172033] font-medium">{e.driverName}</td>
                    <td className="py-3 px-3.5 text-right font-mono text-[#64748B]">{e.openingKm}</td>
                    <td className="py-3 px-3.5 text-right font-mono text-[#64748B]">{e.closingKm}</td>
                    <td className="py-3 px-3.5 text-right font-black text-[#006B57]">{e.totalKm} KM</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {e.trips}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-[#172033]">{formatCurrency(e.amount)}</td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => alert(`Duty Slip Notes:\n${e.remarks || 'Standard duty'}\nKM: ${e.totalKm} KM`)}
                        className="text-xs font-bold text-[#006B57] hover:underline cursor-pointer"
                      >
                        Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-base font-bold text-[#172033]">Add Daily Running Duty Slip</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Vehicle *
                  </label>
                  <select
                    value={formData.vehicleNumber}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.registrationNumber}>
                        {v.registrationNumber} ({v.driverName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={formData.driverName || ''}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Opening KM
                  </label>
                  <input
                    type="number"
                    value={formData.openingKm || 0}
                    onChange={(e) => handleKmChange(Number(e.target.value), Number(formData.closingKm || 0))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Closing KM
                  </label>
                  <input
                    type="number"
                    value={formData.closingKm || 0}
                    onChange={(e) => handleKmChange(Number(formData.openingKm || 0), Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Total KM
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.totalKm || 0}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl bg-slate-50 font-black text-[#006B57]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Number of Trips
                  </label>
                  <input
                    type="number"
                    value={formData.trips || 1}
                    onChange={(e) => setFormData({ ...formData, trips: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Billing Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.amount || 0}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-black text-[#006B57]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
