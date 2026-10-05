/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle,
  CreditCard,
  Clock,
  DollarSign,
  X,
  FileCheck,
} from 'lucide-react';
import { RecoveryRecord, AdvanceRecord, Vehicle } from '../types';

interface RecoveriesViewProps {
  recoveries: RecoveryRecord[];
  advances: AdvanceRecord[];
  vehicles: Vehicle[];
  onUpdateRecoveries: (recoveries: RecoveryRecord[]) => void;
  onUpdateAdvances: (advances: AdvanceRecord[]) => void;
}

export default function RecoveriesView({
  recoveries,
  advances,
  vehicles,
  onUpdateRecoveries,
  onUpdateAdvances,
}: RecoveriesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Available advances with pending balance
  const pendingAdvances = useMemo(() => {
    return advances.filter((a) => a.balance > 0);
  }, [advances]);

  const [formData, setFormData] = useState<{
    date: string;
    advanceId: string;
    vehicleNumber: string;
    amount: number;
    recoveryMonth: string;
    remarks: string;
  }>({
    date: new Date().toISOString().substring(0, 10),
    advanceId: pendingAdvances[0]?.id || '',
    vehicleNumber: pendingAdvances[0]?.vehicleNumber || vehicles[0]?.registrationNumber || '',
    amount: pendingAdvances[0]?.balance || 3000,
    recoveryMonth: '2026-10',
    remarks: 'Adjusted in monthly settlement',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalRecoverable = advances.reduce((s, a) => s + a.recoverable, 0);
  const totalRecovered = advances.reduce((s, a) => s + a.recovered, 0);
  const outstanding = Math.max(0, totalRecoverable - totalRecovered);

  const filteredRecoveries = useMemo(() => {
    return recoveries.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.advanceId.toLowerCase().includes(q) ||
        r.recoveryMonth.includes(q)
      );
    });
  }, [recoveries, searchQuery]);

  const handleOpenAdd = () => {
    const firstPending = pendingAdvances[0];
    setFormData({
      date: new Date().toISOString().substring(0, 10),
      advanceId: firstPending?.id || '',
      vehicleNumber: firstPending?.vehicleNumber || vehicles[0]?.registrationNumber || '',
      amount: firstPending?.balance || 2000,
      recoveryMonth: '2026-10',
      remarks: 'Settlement deduction',
    });
    setIsModalOpen(true);
  };

  const handleAdvanceSelect = (advId: string) => {
    const adv = advances.find((a) => a.id === advId);
    if (adv) {
      setFormData({
        ...formData,
        advanceId: advId,
        vehicleNumber: adv.vehicleNumber,
        amount: adv.balance,
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.advanceId || !formData.amount || formData.amount <= 0) return;

    const targetAdv = advances.find((a) => a.id === formData.advanceId);
    if (!targetAdv) return;

    const recoveryAmount = Math.min(formData.amount, targetAdv.balance);
    const newAdvBalance = Math.max(0, targetAdv.balance - recoveryAmount);
    const newAdvRecovered = targetAdv.recovered + recoveryAmount;

    // Update Advance record in parent state
    const updatedAdvances = advances.map((a) => {
      if (a.id === targetAdv.id) {
        return {
          ...a,
          recovered: newAdvRecovered,
          balance: newAdvBalance,
          status: (newAdvBalance === 0 ? 'Fully Recovered' : 'Partially Recovered') as any,
        };
      }
      return a;
    });

    // Create unique Recovery Record
    const newRec: RecoveryRecord = {
      id: `REC-${new Date().getTime().toString().slice(-4)}`,
      date: formData.date || new Date().toISOString().substring(0, 10),
      vehicleNumber: targetAdv.vehicleNumber,
      advanceId: targetAdv.id,
      amount: recoveryAmount,
      recoveryMonth: formData.recoveryMonth || '2026-10',
      balance: newAdvBalance,
      status: 'Applied',
      remarks: formData.remarks || '',
    };

    onUpdateAdvances(updatedAdvances);
    onUpdateRecoveries([newRec, ...recoveries]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Recoveries</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Deduction adjustments against company payments and owner settlement ledgers
          </p>
        </div>

        <button
          id="add-recovery-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Recovery</span>
        </button>
      </div>

      {/* Top Summary Cards (Page 11 requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-blue-50 text-[#2563EB]">
              <DollarSign className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-blue-700">Contract Total</span>
          </div>
          <p className="text-2xl font-black text-[#172033]">{formatCurrency(totalRecoverable)}</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Recoverable</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-[#16A34A]">
              <RotateCcw className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-[#16A34A]">Successfully Adjusted</span>
          </div>
          <p className="text-2xl font-black text-[#16A34A]">{formatCurrency(totalRecovered)}</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Recovered</p>
        </div>

        <div className="bg-white p-5 rounded-xl border-2 border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-800">Due</span>
          </div>
          <p className="text-2xl font-black text-amber-900">{formatCurrency(outstanding)}</p>
          <p className="text-xs font-bold text-amber-800 mt-0.5">Outstanding</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search recovery ID, vehicle, advance ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>
      </div>

      {/* Table (Page 11 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5 font-bold">Recovery ID</th>
                <th className="py-3 px-3.5">Vehicle</th>
                <th className="py-3 px-3.5">Advance ID</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5">Recovery Month</th>
                <th className="py-3 px-3.5 text-right">Advance Balance</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredRecoveries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#64748B]">
                    No recovery records found.
                  </td>
                </tr>
              ) : (
                filteredRecoveries.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-[#64748B]">{r.date}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#006B57]">{r.id}</td>
                    <td className="py-3 px-3.5 font-bold text-[#172033]">{r.vehicleNumber}</td>
                    <td className="py-3 px-3.5 font-mono font-medium text-slate-700">{r.advanceId}</td>
                    <td className="py-3 px-3.5 text-right font-black text-emerald-700">{formatCurrency(r.amount)}</td>
                    <td className="py-3 px-3.5 font-bold text-[#006B57]">{r.recoveryMonth}</td>
                    <td className="py-3 px-3.5 text-right font-mono text-amber-800 font-bold">{formatCurrency(r.balance)}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => alert(`Recovery Receipt:\nID: ${r.id}\nAdvance: ${r.advanceId}\nVehicle: ${r.vehicleNumber}\nAmount: ₹${r.amount}\nMonth: ${r.recoveryMonth}`)}
                        className="text-xs font-bold text-[#006B57] hover:underline cursor-pointer"
                      >
                        Receipt
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
              <h3 className="text-base font-bold text-[#172033]">Record Advance Recovery</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Select Pending Advance to Recover *
                </label>
                {pendingAdvances.length === 0 ? (
                  <p className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold">
                    No pending advances with an outstanding balance.
                  </p>
                ) : (
                  <select
                    value={formData.advanceId}
                    onChange={(e) => handleAdvanceSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  >
                    {pendingAdvances.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.id} • {a.vehicleNumber} • {a.type} (Pending: ₹{a.balance})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Recovery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Recovery Month *
                  </label>
                  <select
                    value={formData.recoveryMonth}
                    onChange={(e) => setFormData({ ...formData, recoveryMonth: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  >
                    <option value="2026-10">October 2026</option>
                    <option value="2026-09">September 2026</option>
                    <option value="2026-08">August 2026</option>
                    <option value="2026-07">July 2026</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Recovery Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-black text-[#006B57]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Adjustment Remarks
                </label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="e.g. Deducted from client week 1 payment"
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
                  disabled={pendingAdvances.length === 0}
                  className="px-5 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  Apply Recovery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
