/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  DollarSign,
  Fuel,
  Wrench,
  X,
  CreditCard,
} from 'lucide-react';
import { Expense, ExpenseType, EXPENSE_TYPES, Vehicle } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  vehicles: Vehicle[];
  onUpdateExpenses: (expenses: Expense[]) => void;
}

export default function ExpensesView({
  expenses,
  vehicles,
  onUpdateExpenses,
}: ExpensesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().substring(0, 10),
    month: '2026-10',
    vehicleNumber: vehicles[0]?.registrationNumber || '',
    expenseType: 'CNG',
    amount: 2500,
    remarks: 'Routine operating cost',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalExpenseSum = expenses.reduce((s, e) => s + e.amount, 0);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        e.vehicleNumber.toLowerCase().includes(q) ||
        e.expenseType.toLowerCase().includes(q) ||
        (e.remarks && e.remarks.toLowerCase().includes(q));

      const matchCat = categoryFilter === 'All' || e.expenseType === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, searchQuery, categoryFilter]);

  const handleOpenAdd = () => {
    setFormData({
      date: new Date().toISOString().substring(0, 10),
      month: '2026-10',
      vehicleNumber: vehicles[0]?.registrationNumber || '',
      expenseType: 'CNG',
      amount: 2500,
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleNumber || !formData.amount) return;

    const newExp: Expense = {
      id: `EXP-${new Date().getTime().toString().slice(-5)}`,
      date: formData.date || new Date().toISOString().substring(0, 10),
      month: formData.date ? formData.date.substring(0, 7) : '2026-10',
      vehicleNumber: formData.vehicleNumber,
      expenseType: (formData.expenseType as ExpenseType) || 'CNG',
      amount: Number(formData.amount) || 0,
      remarks: formData.remarks || '',
    };

    onUpdateExpenses([newExp, ...expenses]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Expenses</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Fleet maintenance, fuel, driver payroll, EMI, and statutory costs ({filteredExpenses.length} entries)
          </p>
        </div>

        <button
          id="add-expense-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search expense by vehicle, category, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] font-medium cursor-pointer"
        >
          <option value="All">All Categories ({EXPENSE_TYPES.length})</option>
          {EXPENSE_TYPES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table (Page 12 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5 font-bold">Vehicle</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Description</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5">Payment Mode</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#64748B]">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-[#64748B]">{e.date}</td>
                    <td className="py-3 px-3.5 font-bold text-[#006B57]">{e.vehicleNumber}</td>
                    <td className="py-3 px-3.5 font-semibold text-[#172033]">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {e.expenseType}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#64748B]">{e.remarks || 'Fleet operational disbursement'}</td>
                    <td className="py-3 px-3.5 text-right font-black text-rose-600">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 font-medium">
                      {['CNG', 'Fuel'].includes(e.expenseType)
                        ? 'Fuel Card / UPI'
                        : e.expenseType === 'EMI'
                        ? 'Bank Auto-Debit'
                        : 'Company Account'}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => alert(`Expense Voucher:\nID: ${e.id}\nVehicle: ${e.vehicleNumber}\nCategory: ${e.expenseType}\nAmount: ₹${e.amount}`)}
                        className="text-xs font-bold text-[#006B57] hover:underline cursor-pointer"
                      >
                        Voucher
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
              <h3 className="text-base font-bold text-[#172033]">Log Fleet Operating Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Expense Date *
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
                        {v.registrationNumber} ({v.driverName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Expense Category *
                  </label>
                  <select
                    value={formData.expenseType}
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-semibold"
                  >
                    {EXPENSE_TYPES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount || 0}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-black text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Description / Vendor Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shell petrol bunk fuel filling receipt #4102"
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
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
