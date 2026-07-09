/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  TrendingDown,
  DollarSign,
  Calendar,
  Layers,
  Wrench,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import {
  Vehicle,
  Company,
  CompanyPayment,
  Expense,
  EXPENSE_TYPES,
  ExpenseType,
} from '../types';
import { formatDate, toInputDateFormat, formatMonth } from '../lib/dateUtils';

interface TransactionViewsProps {
  vehicles: Vehicle[];
  companies: Company[];
  payments: CompanyPayment[];
  expenses: Expense[];
  activeSubView: 'Company Payments' | 'Expense Entry';
  onUpdatePayments: (p: CompanyPayment[]) => void;
  onUpdateExpenses: (e: Expense[]) => void;
}

export default function TransactionViews({
  vehicles,
  companies,
  payments,
  expenses,
  activeSubView,
  onUpdatePayments,
  onUpdateExpenses,
}: TransactionViewsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; type: 'payment' | 'expense'; title: string } | null>(null);

  // Form States
  const [payForm, setPayForm] = useState<Partial<CompanyPayment>>({
    month: '2026-07',
    paymentDate: '2026-07-08',
  });
  const [expForm, setExpForm] = useState<Partial<Expense>>({
    date: '2026-07-08',
    month: '2026-07',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const resetForms = () => {
    setPayForm({ month: '2026-07', paymentDate: '2026-07-08' });
    setExpForm({ date: '2026-07-08', month: '2026-07' });
    setIsAdding(false);
    setFormError(null);
  };

  // Submit handlers
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!payForm.vehicleNumber || !payForm.amountReceived || !payForm.invoiceNumber) {
      setFormError('Vehicle Number, Invoice Number, and Amount Received are required fields.');
      return;
    }

    const matchedVehicle = vehicles.find((v) => v.registrationNumber === payForm.vehicleNumber);

    const txDate = payForm.paymentDate || '2026-07-08';
    const txMonth = payForm.month || txDate.substring(0, 7);

    const newPayment: CompanyPayment = {
      id: `PAY-${Date.now()}`,
      month: txMonth,
      vehicleNumber: payForm.vehicleNumber,
      company: matchedVehicle ? matchedVehicle.company : 'Direct Client',
      invoiceNumber: payForm.invoiceNumber,
      paymentDate: txDate,
      amountReceived: Number(payForm.amountReceived),
      remarks: payForm.remarks || '',
    };

    onUpdatePayments([newPayment, ...payments]);
    resetForms();
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!expForm.vehicleNumber || !expForm.amount || !expForm.expenseType) {
      setFormError('Vehicle Number, Expense Type, and Amount are required fields.');
      return;
    }

    // Capture correct month from transaction date
    const txDate = expForm.date || '2026-07-08';
    const txMonth = txDate.substring(0, 7); // YYYY-MM

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      date: txDate,
      month: txMonth,
      vehicleNumber: expForm.vehicleNumber,
      expenseType: expForm.expenseType as ExpenseType,
      amount: Number(expForm.amount),
      remarks: expForm.remarks || '',
    };

    onUpdateExpenses([newExpense, ...expenses]);
    resetForms();
  };

  const handleDeletePayment = (id: string, name: string) => {
    setDeleteCandidate({ id, type: 'payment', title: `Billing Voucher for ${name}` });
  };

  const handleDeleteExpense = (id: string, name: string) => {
    setDeleteCandidate({ id, type: 'expense', title: `Expense Voucher for ${name}` });
  };

  // List of distinct months for filtering
  const distinctMonths = Array.from(
    new Set([
      ...payments.map((p) => p.month),
      ...expenses.map((e) => e.month),
      '2026-06',
      '2026-07',
    ])
  ).sort().reverse();

  // Filter Transactions
  const filteredPayments = payments.filter((p) => {
    const matchesQuery =
      p.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = filterMonth ? p.month === filterMonth : true;
    return matchesQuery && matchesMonth;
  });

  const filteredExpenses = expenses.filter((e) => {
    const matchesQuery =
      e.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.expenseType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.remarks.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = filterMonth ? e.month === filterMonth : true;
    return matchesQuery && matchesMonth;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Tab Header Panel */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {activeSubView === 'Company Payments' ? (
              <DollarSign className="text-blue-600" />
            ) : (
              <TrendingDown className="text-rose-600" />
            )}
            {activeSubView === 'Company Payments' ? 'Company Billing Payments' : 'Expense Deductions Registry'}
          </h2>
          <p className="text-xs text-slate-500">
            {activeSubView === 'Company Payments'
              ? 'Log contract billing receipts from corporate clients'
              : 'Log fuel, maintenance, tolls, and salaries to compute vehicle ledger balances'}
          </p>
        </div>

        {!isAdding && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                id="filter-month-select"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="">All Months</option>
                {distinctMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonth(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="search-tx-input"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            <button
              id="add-tx-btn"
              onClick={() => setIsAdding(true)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg text-white flex items-center gap-1 shadow-xs transition-colors ${
                activeSubView === 'Company Payments' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Log Entry
            </button>
          </div>
        )}
      </div>

      {/* CRUD Form */}
      {isAdding && (
        <div className="p-6 border-b border-slate-200 bg-slate-50/20">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
            {activeSubView === 'Company Payments' ? 'Add Billing Voucher' : 'Log Expense Voucher'}
          </h3>

          {formError && (
            <div id="tx-form-error" className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          {/* PAYMENT INPUT FORM */}
          {activeSubView === 'Company Payments' && (
            <form onSubmit={handleSavePayment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Billing Month *</label>
                <select
                  id="pay-month-select"
                  value={payForm.month || '2026-07'}
                  onChange={(e) => setPayForm({ ...payForm, month: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {distinctMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonth(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Plate Number *</label>
                <select
                  id="pay-vehicle-select"
                  value={payForm.vehicleNumber || ''}
                  onChange={(e) => setPayForm({ ...payForm, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.company.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Number *</label>
                <input
                  id="pay-invoice-input"
                  type="text"
                  placeholder="e.g. E7-INV-0726-01"
                  value={payForm.invoiceNumber || ''}
                  onChange={(e) => setPayForm({ ...payForm, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Receipt Date</label>
                <input
                  id="pay-date-input"
                  type="date"
                  value={toInputDateFormat(payForm.paymentDate) || ''}
                  onChange={(e) => {
                    const dateVal = e.target.value;
                    const calculatedMonth = dateVal ? dateVal.substring(0, 7) : (payForm.month || '2026-07');
                    setPayForm({
                      ...payForm,
                      paymentDate: dateVal,
                      month: calculatedMonth,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount Received (₹) *</label>
                <input
                  id="pay-amount-input"
                  type="number"
                  placeholder="e.g. 68000"
                  value={payForm.amountReceived || ''}
                  onChange={(e) => setPayForm({ ...payForm, amountReceived: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Voucher Remarks</label>
                <input
                  id="pay-remarks-input"
                  type="text"
                  placeholder="e.g. Settlement for shift shuttle support"
                  value={payForm.remarks || ''}
                  onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div className="md:col-span-4 flex gap-2">
                <button
                  id="pay-submit-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
                >
                  Save Billing Voucher
                </button>
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* EXPENSE INPUT FORM */}
          {activeSubView === 'Expense Entry' && (
            <form onSubmit={handleSaveExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Transaction Date *</label>
                <input
                  id="exp-date-input"
                  type="date"
                  value={toInputDateFormat(expForm.date) || ''}
                  onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Plate Number *</label>
                <select
                  id="exp-vehicle-select"
                  value={expForm.vehicleNumber || ''}
                  onChange={(e) => setExpForm({ ...expForm, vehicleNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.driverName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Expense Deduct Type *</label>
                <select
                  id="exp-type-select"
                  value={expForm.expenseType || 'CNG'}
                  onChange={(e) => setExpForm({ ...expForm, expenseType: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {EXPENSE_TYPES.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount Paid (₹) *</label>
                <input
                  id="exp-amount-input"
                  type="number"
                  placeholder="e.g. 1500"
                  value={expForm.amount || ''}
                  onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">Voucher Remarks</label>
                <input
                  id="exp-remarks-input"
                  type="text"
                  placeholder="e.g. Fuel refills - Siruseri Campus"
                  value={expForm.remarks || ''}
                  onChange={(e) => setExpForm({ ...expForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div className="md:col-span-4 flex gap-2">
                <button
                  id="exp-submit-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
                >
                  Log Expense
                </button>
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Table Data list */}
      <div className="overflow-x-auto">
        {activeSubView === 'Company Payments' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-2xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4">Plate Number</th>
                <th className="py-3 px-4">Corporate Client</th>
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/30">
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-600">{p.month}</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{p.vehicleNumber}</td>
                  <td className="py-2.5 px-4 text-slate-700">{p.company}</td>
                  <td className="py-2.5 px-4 font-mono">{p.invoiceNumber}</td>
                  <td className="py-2.5 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-blue-700">{formatCurrency(p.amountReceived)}</td>
                  <td className="py-2.5 px-4 text-slate-500 truncate max-w-[200px]">{p.remarks || '-'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      id={`btn-del-pay-${p.id}`}
                      onClick={() => handleDeletePayment(p.id, `${p.vehicleNumber} (${p.month})`)}
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400">
                    No billing receipts logged for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-2xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">Vehicle Number</th>
                <th className="py-3 px-4">Deduct Category</th>
                <th className="py-3 px-4 text-right">Amount Deducted</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/30">
                  <td className="py-2.5 px-4 text-slate-500">{formatDate(e.date)}</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-500">{e.month}</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{e.vehicleNumber}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                        e.expenseType === 'CNG' || e.expenseType === 'Fuel'
                          ? 'bg-amber-50 text-amber-800 border border-amber-100'
                          : e.expenseType === 'EMI'
                          ? 'bg-red-50 text-red-800 border border-red-100'
                          : e.expenseType === 'Driver Salary'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {e.expenseType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-600">{formatCurrency(e.amount)}</td>
                  <td className="py-2.5 px-4 text-slate-500 truncate max-w-[200px]">{e.remarks || '-'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      id={`btn-del-exp-${e.id}`}
                      onClick={() => handleDeleteExpense(e.id, `${e.vehicleNumber} - ${e.expenseType}`)}
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    No expense entries matched search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
                This action is permanent and cannot be undone.
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
                  if (deleteCandidate.type === 'payment') {
                    onUpdatePayments(payments.filter((p) => p.id !== deleteCandidate.id));
                  } else {
                    onUpdateExpenses(expenses.filter((e) => e.id !== deleteCandidate.id));
                  }
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
