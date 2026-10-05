/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  RotateCcw,
  Clock,
  DollarSign,
  Fuel,
  AlertCircle,
  X,
  CheckCircle,
} from 'lucide-react';
import { AdvanceRecord, AdvanceType, Vehicle } from '../types';

interface AdvancesViewProps {
  advances: AdvanceRecord[];
  vehicles: Vehicle[];
  onUpdateAdvances: (advances: AdvanceRecord[]) => void;
  onNavigateToRecovery?: (advId: string) => void;
}

export default function AdvancesView({
  advances,
  vehicles,
  onUpdateAdvances,
  onNavigateToRecovery,
}: AdvancesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<AdvanceRecord>>({
    date: new Date().toISOString().substring(0, 10),
    vehicleNumber: vehicles[0]?.registrationNumber || '',
    type: 'CNG Advance',
    amount: 5000,
    cngPercent: 5,
    recoverable: 5000,
    remarks: '',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalAdvances = advances.reduce((s, a) => s + a.amount, 0);
  const totalRecovered = advances.reduce((s, a) => s + a.recovered, 0);
  const outstanding = Math.max(0, totalAdvances - totalRecovered);

  const filteredAdvances = useMemo(() => {
    return advances.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.vehicleNumber.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        (a.remarks && a.remarks.toLowerCase().includes(q));

      const matchType = typeFilter === 'All' || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [advances, searchQuery, typeFilter]);

  const handleOpenAdd = () => {
    setFormData({
      date: new Date().toISOString().substring(0, 10),
      vehicleNumber: vehicles[0]?.registrationNumber || '',
      type: 'CNG Advance',
      amount: 5000,
      cngPercent: 5,
      recoverable: 5000,
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleNumber || !formData.amount) return;

    const amt = Number(formData.amount);
    const newAdv: AdvanceRecord = {
      id: `ADV-${new Date().getTime().toString().slice(-4)}`,
      date: formData.date || new Date().toISOString().substring(0, 10),
      vehicleNumber: formData.vehicleNumber,
      type: (formData.type as AdvanceType) || 'CNG Advance',
      amount: amt,
      cngPercent: formData.type === 'CNG Advance' ? (Number(formData.cngPercent) || 5) : 0,
      recoverable: amt,
      recovered: 0,
      balance: amt,
      status: 'Pending',
      remarks: formData.remarks || '',
    };

    onUpdateAdvances([newAdv, ...advances]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Advances</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Operational cash advances, CNG card top-ups, driver salary loans, and EMI disbursements
          </p>
        </div>

        <button
          id="add-advance-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Advance</span>
        </button>
      </div>

      {/* Top Summary Cards (Page 10 requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-blue-50 text-[#2563EB]">
              <CreditCard className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-blue-700">Gross Issued</span>
          </div>
          <p className="text-2xl font-black text-[#172033]">{formatCurrency(totalAdvances)}</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Advances</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-[#16A34A]">
              <RotateCcw className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-[#16A34A]">Settled</span>
          </div>
          <p className="text-2xl font-black text-[#16A34A]">{formatCurrency(totalRecovered)}</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Recovered</p>
        </div>

        <div className="bg-white p-5 rounded-xl border-2 border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-800">Due for Deduction</span>
          </div>
          <p className="text-2xl font-black text-amber-900">{formatCurrency(outstanding)}</p>
          <p className="text-xs font-bold text-amber-800 mt-0.5">Outstanding</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search advance ID, vehicle number, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] font-medium cursor-pointer"
        >
          <option value="All">All Advance Types</option>
          <option value="CNG Advance">CNG Advance</option>
          <option value="EMI Advance">EMI Advance</option>
          <option value="Driver Advance">Driver Advance</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Table (Page 10 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5 font-bold">Advance ID</th>
                <th className="py-3 px-3.5">Vehicle</th>
                <th className="py-3 px-3.5">Type</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5 text-center">CNG %</th>
                <th className="py-3 px-3.5 text-right">Recoverable</th>
                <th className="py-3 px-3.5 text-right">Recovered</th>
                <th className="py-3 px-3.5 text-right">Balance</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-xs text-[#64748B]">
                    No advance entries found.
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-[#64748B]">{a.date}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#006B57]">{a.id}</td>
                    <td className="py-3 px-3.5 font-bold text-[#172033]">{a.vehicleNumber}</td>
                    <td className="py-3 px-3.5 font-medium">{a.type}</td>
                    <td className="py-3 px-3.5 text-right font-black text-[#172033]">{formatCurrency(a.amount)}</td>
                    <td className="py-3 px-3.5 text-center font-bold text-[#006B57]">
                      {a.type === 'CNG Advance' ? `${a.cngPercent || 5}%` : '-'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-semibold text-[#172033]">{formatCurrency(a.recoverable)}</td>
                    <td className="py-3 px-3.5 text-right text-emerald-700 font-bold">{formatCurrency(a.recovered)}</td>
                    <td className="py-3 px-3.5 text-right font-black text-amber-800">{formatCurrency(a.balance)}</td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'Fully Recovered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'Partially Recovered'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      {a.balance > 0 ? (
                        <button
                          onClick={() => onNavigateToRecovery ? onNavigateToRecovery(a.id) : null}
                          className="px-2.5 py-1 rounded-lg bg-[#D4A72C] text-[#172033] hover:bg-[#C09420] text-xs font-bold cursor-pointer"
                        >
                          Recover
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-end gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Cleared
                        </span>
                      )}
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
              <h3 className="text-base font-bold text-[#172033]">Issue Operational Advance</h3>
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
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.registrationNumber}>
                        {v.registrationNumber} ({v.ownerName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Advance Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-semibold"
                  >
                    <option value="CNG Advance">CNG Advance</option>
                    <option value="EMI Advance">EMI Advance</option>
                    <option value="Driver Advance">Driver Advance</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Advance Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount || 0}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-black text-[#006B57]"
                  />
                </div>
              </div>

              {formData.type === 'CNG Advance' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    CNG Profit Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={formData.cngPercent || 5}
                    onChange={(e) => setFormData({ ...formData, cngPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Purpose / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fuel card recharge / HDFC EMI auto-debit"
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                />
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
                  Disburse Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
