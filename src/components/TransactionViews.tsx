/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  XCircle,
  Edit2,
  Percent,
  Receipt,
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
  activeSubView: 'Company Payments' | 'Expense Entry' | 'Weekly Settlement';
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
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
  const [editingPayment, setEditingPayment] = useState<CompanyPayment | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (isAdding) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdding]);
  const [filterMonth, setFilterMonth] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; type: 'payment' | 'expense'; title: string } | null>(null);

  // Weekly Payment Calculator States
  const [weeklyVehicle, setWeeklyVehicle] = useState('');
  const [weeklyDate, setWeeklyDate] = useState('2026-07-08');
  const [weeklyMonth, setWeeklyMonth] = useState('2026-07');
  const [weeklyInvoice, setWeeklyInvoice] = useState('');
  const [weeklyGross, setWeeklyGross] = useState<number>(0);
  const [weeklyAdminCharge, setWeeklyAdminCharge] = useState<number>(0);
  const [weeklyRemarks, setWeeklyRemarks] = useState('');
  const [weeklySuccess, setWeeklySuccess] = useState<string | null>(null);

  const handlePostWeeklyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weeklyVehicle || !weeklyGross || weeklyGross <= 0 || !weeklyInvoice) {
      alert('Please select a vehicle, enter an invoice number, and specify a valid gross payment amount.');
      return;
    }

    const matchedVehicle = vehicles.find((v) => v.registrationNumber === weeklyVehicle);
    const company = matchedVehicle ? matchedVehicle.company : 'Direct Client';

    const serviceCharge = Math.round(weeklyGross * 0.05);
    const tds = Math.round(weeklyGross * 0.01);
    const admin = Number(weeklyAdminCharge || 0);
    const netPayable = weeklyGross - serviceCharge - tds - admin;

    const txDate = weeklyDate || '2026-07-08';
    const txMonth = weeklyMonth || txDate.substring(0, 7);

    // 1. Create the Company Billing Payment
    const newPayment: CompanyPayment = {
      id: `PAY-WK-${Date.now()}`,
      month: txMonth,
      vehicleNumber: weeklyVehicle,
      company: company,
      invoiceNumber: weeklyInvoice,
      paymentDate: txDate,
      amountReceived: weeklyGross,
      remarks: `Weekly Gross Payment. Net: ${formatCurrency(netPayable)} (5% SC: ${formatCurrency(serviceCharge)}, 1% TDS: ${formatCurrency(tds)}, Admin: ${formatCurrency(admin)}). ${weeklyRemarks}`.trim(),
    };

    // 2. Create the Deductions as Expenses
    const deductions: Expense[] = [];

    if (serviceCharge > 0) {
      deductions.push({
        id: `EXP-WK-SC-${Date.now()}`,
        date: txDate,
        month: txMonth,
        vehicleNumber: weeklyVehicle,
        expenseType: 'Deduct',
        amount: serviceCharge,
        remarks: `Weekly 5% Service Charge deduction on Invoice ${weeklyInvoice} (Gross: ${formatCurrency(weeklyGross)})`,
      });
    }

    if (tds > 0) {
      deductions.push({
        id: `EXP-WK-TDS-${Date.now()}-1`,
        date: txDate,
        month: txMonth,
        vehicleNumber: weeklyVehicle,
        expenseType: 'Deduct',
        amount: tds,
        remarks: `Weekly 1% TDS deduction on Invoice ${weeklyInvoice} (Gross: ${formatCurrency(weeklyGross)})`,
      });
    }

    if (admin > 0) {
      deductions.push({
        id: `EXP-WK-ADM-${Date.now()}-2`,
        date: txDate,
        month: txMonth,
        vehicleNumber: weeklyVehicle,
        expenseType: 'Deduct',
        amount: admin,
        remarks: `Weekly Admin Charge deduction on Invoice ${weeklyInvoice}`,
      });
    }

    onUpdatePayments([newPayment, ...payments]);
    onUpdateExpenses([...deductions, ...expenses]);

    setWeeklySuccess(`Weekly payment for ${weeklyVehicle} processed successfully! Gross: ${formatCurrency(weeklyGross)}, Net: ${formatCurrency(netPayable)} logged.`);
    
    // Reset fields except vehicle & date to save entry time
    setWeeklyGross(0);
    setWeeklyAdminCharge(0);
    setWeeklyInvoice('');
    setWeeklyRemarks('');

    setTimeout(() => {
      setWeeklySuccess(null);
    }, 8000);
  };

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
    setEditingPayment(null);
    setEditingExpense(null);
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

    if (editingPayment) {
      const updatedPayment: CompanyPayment = {
        ...editingPayment,
        month: txMonth,
        vehicleNumber: payForm.vehicleNumber,
        company: matchedVehicle ? matchedVehicle.company : 'Direct Client',
        invoiceNumber: payForm.invoiceNumber,
        paymentDate: txDate,
        amountReceived: Number(payForm.amountReceived),
        remarks: payForm.remarks || '',
      };
      onUpdatePayments(
        payments.map((p) => (p.id === editingPayment.id ? updatedPayment : p))
      );
    } else {
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
    }
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

    if (editingExpense) {
      const updatedExpense: Expense = {
        ...editingExpense,
        date: txDate,
        month: txMonth,
        vehicleNumber: expForm.vehicleNumber,
        expenseType: expForm.expenseType as ExpenseType,
        amount: Number(expForm.amount),
        remarks: expForm.remarks || '',
      };
      onUpdateExpenses(
        expenses.map((ex) => (ex.id === editingExpense.id ? updatedExpense : ex))
      );
    } else {
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
    }
    resetForms();
  };

  const handleDeletePayment = (id: string, name: string) => {
    setDeleteCandidate({ id, type: 'payment', title: `Billing Voucher for ${name}` });
  };

  const handleDeleteExpense = (id: string, name: string) => {
    setDeleteCandidate({ id, type: 'expense', title: `Expense Voucher for ${name}` });
  };

  // List of distinct periods for filtering
  const distinctMonths = Array.from(
    new Set([
      ...payments.map((p) => p.month),
      ...expenses.map((e) => e.month),
      '2026-06',
      '2026-07',
    ])
  ).sort().reverse();

  const distinctYears = Array.from(
    new Set(distinctMonths.map((m) => m.substring(0, 4)))
  ).sort().reverse();

  const distinctDates = Array.from(
    new Set([
      ...payments.map((p) => toInputDateFormat(p.paymentDate)),
      ...expenses.map((e) => toInputDateFormat(e.date)),
      '2026-07-08',
    ].filter(Boolean))
  ).sort().reverse();

  // Filter & Sort Transactions
  const filteredPayments = payments.filter((p) => {
    const matchesQuery =
      p.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesMonth = true;
    if (filterMonth) {
      const isYearSelected = filterMonth.length === 4;
      const isDateSelected = filterMonth.length === 10;
      if (isDateSelected) {
        matchesMonth = toInputDateFormat(p.paymentDate) === filterMonth;
      } else if (isYearSelected) {
        matchesMonth = p.month.startsWith(filterMonth);
      } else {
        matchesMonth = p.month === filterMonth;
      }
    }
    return matchesQuery && matchesMonth;
  }).sort((a, b) => {
    const dateA = a.paymentDate || '';
    const dateB = b.paymentDate || '';
    return dateSortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
  });

  const filteredExpenses = expenses.filter((e) => {
    const matchesQuery =
      e.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.expenseType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.remarks.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesMonth = true;
    if (activeSubView !== 'Expense Entry' && filterMonth) {
      const isYearSelected = filterMonth.length === 4;
      const isDateSelected = filterMonth.length === 10;
      if (isDateSelected) {
        matchesMonth = toInputDateFormat(e.date) === filterMonth;
      } else if (isYearSelected) {
        matchesMonth = e.month.startsWith(filterMonth);
      } else {
        matchesMonth = e.month === filterMonth;
      }
    }
    return matchesQuery && matchesMonth;
  }).sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateSortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
  });

  return (
    <div className="space-y-6">
      {activeSubView !== 'Weekly Settlement' && (
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

        <div className="flex flex-wrap items-center gap-2">
            {/* Month Filter */}
            {activeSubView !== 'Expense Entry' && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  id="filter-month-select"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
                >
                  <option value="" className="font-normal text-slate-500">All Periods</option>
                  <optgroup label="Month-Wise" className="text-slate-500 font-normal">
                    {distinctMonths.map((m) => (
                      <option key={m} value={m} className="font-bold text-slate-800">
                        {formatMonth(m)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Year-Wise" className="text-slate-500 font-normal">
                    {distinctYears.map((y) => (
                      <option key={y} value={y} className="font-bold text-slate-800">
                        {y} (Full Year)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Date-Wise" className="text-slate-500 font-normal">
                    {distinctDates.map((d) => (
                      <option key={d} value={d} className="font-bold text-slate-800">
                        {formatDate(d)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Date Sort Dropdown */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600">
              <span className="text-slate-400 font-medium">Sort Date:</span>
              <select
                id="sort-date-select"
                value={dateSortOrder}
                onChange={(e) => setDateSortOrder(e.target.value as 'desc' | 'asc')}
                className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-800"
              >
                <option value="desc" className="font-bold text-slate-800">Newest First</option>
                <option value="asc" className="font-bold text-slate-800">Oldest First</option>
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
              onClick={() => {
                resetForms();
                setIsAdding(true);
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg text-white flex items-center gap-1 shadow-xs transition-colors ${
                activeSubView === 'Company Payments' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Log Entry
            </button>
          </div>
      </div>

      {/* CRUD Form */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {activeSubView === 'Company Payments' ? (
                    <>
                      {editingPayment ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                      {editingPayment ? 'Edit Billing Voucher' : 'Add Billing Voucher'}
                    </>
                  ) : (
                    <>
                      {editingExpense ? <Edit2 className="h-5 w-5 text-rose-600" /> : <Plus className="h-5 w-5 text-rose-600" />}
                      {editingExpense ? 'Edit Expense Voucher' : 'Log Expense Voucher'}
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeSubView === 'Company Payments' 
                    ? (editingPayment ? 'Update existing billing payment details below.' : 'Please fill in the required fields below to log entry.')
                    : (editingExpense ? 'Update existing expense details below.' : 'Please fill in the required fields below to log entry.')}
                </p>
              </div>
              <button
                type="button"
                onClick={resetForms}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[75vh]">
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
                      {v.registrationNumber} ({v.company ? v.company.split(' ')[0] : 'Unassigned'}{v.company2 ? ` / ${v.company2.split(' ')[0]}` : ''})
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
                  {editingPayment ? 'Update Billing Voucher' : 'Save Billing Voucher'}
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
                  {editingExpense ? 'Update Expense' : 'Log Expense'}
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
          </div>
        </div>
      )}

      {/* Table Data list */}
      <div className="overflow-x-auto scrollbar-visible">
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
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        id={`btn-edit-pay-${p.id}`}
                        onClick={() => {
                          setEditingPayment(p);
                          setPayForm({
                            month: p.month,
                            vehicleNumber: p.vehicleNumber,
                            invoiceNumber: p.invoiceNumber,
                            paymentDate: p.paymentDate,
                            amountReceived: p.amountReceived,
                            remarks: p.remarks,
                          });
                          setIsAdding(true);
                        }}
                        className="p-1 hover:bg-blue-50 text-blue-500 rounded transition-colors"
                        title="Edit Payment"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={`btn-del-pay-${p.id}`}
                        onClick={() => handleDeletePayment(p.id, `${p.vehicleNumber} (${p.month})`)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded transition-colors"
                        title="Delete Payment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
                          : e.expenseType === 'Advance' || e.expenseType === 'Driver Advance' || e.expenseType === 'Deduct'
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {e.expenseType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-600">{formatCurrency(e.amount)}</td>
                  <td className="py-2.5 px-4 text-slate-500 truncate max-w-[200px]">{e.remarks || '-'}</td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        id={`btn-edit-exp-${e.id}`}
                        onClick={() => {
                          setEditingExpense(e);
                          setExpForm({
                            date: e.date,
                            month: e.month,
                            vehicleNumber: e.vehicleNumber,
                            expenseType: e.expenseType,
                            amount: e.amount,
                            remarks: e.remarks,
                          });
                          setIsAdding(true);
                        }}
                        className="p-1 hover:bg-blue-50 text-blue-500 rounded transition-colors"
                        title="Edit Expense"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={`btn-del-exp-${e.id}`}
                        onClick={() => handleDeleteExpense(e.id, `${e.vehicleNumber} - ${e.expenseType}`)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
      </div>
      )}

      {activeSubView === 'Weekly Settlement' && (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Percent className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900">Weekly Payment Settlement Calculator</h3>
              <p className="text-xs text-slate-500">Calculate and log weekly contractor payments with automatic 5% Service Charge and 1% TDS deductions.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {weeklySuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium animate-in fade-in duration-200 text-left">
              {weeklySuccess}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Inputs */}
            <form onSubmit={handlePostWeeklyPayment} className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Vehicle *</label>
                  <select
                    id="weekly-vehicle-select"
                    required
                    value={weeklyVehicle}
                    onChange={(e) => setWeeklyVehicle(e.target.value)}
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Number *</label>
                  <input
                    id="weekly-invoice-input"
                    type="text"
                    required
                    placeholder="e.g. INV-WK-0726-01"
                    value={weeklyInvoice}
                    onChange={(e) => setWeeklyInvoice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Transaction Date *</label>
                  <input
                    id="weekly-date-input"
                    type="date"
                    required
                    value={weeklyDate}
                    onChange={(e) => {
                      const d = e.target.value;
                      setWeeklyDate(d);
                      if (d) setWeeklyMonth(d.substring(0, 7));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gross Payment (₹) *</label>
                  <input
                    id="weekly-gross-input"
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 25000"
                    value={weeklyGross || ''}
                    onChange={(e) => setWeeklyGross(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Charge (₹)</label>
                  <input
                    id="weekly-admin-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={weeklyAdminCharge || ''}
                    onChange={(e) => setWeeklyAdminCharge(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Remarks</label>
                <input
                  id="weekly-remarks-input"
                  type="text"
                  placeholder="e.g. Week 2 July Corporate shuttle services"
                  value={weeklyRemarks}
                  onChange={(e) => setWeeklyRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="pt-2 text-left">
                <button
                  id="weekly-submit-btn"
                  type="submit"
                  className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Receipt className="h-4 w-4" /> Post & Log Weekly Settlement
                </button>
              </div>
            </form>

            {/* Payslip Card Visualisation */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 p-6 rounded-xl flex flex-col justify-between h-full relative overflow-hidden">
                {/* Watermark/Accent */}
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
                  <Percent className="h-32 w-32 text-indigo-900" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Settlement Slip</p>
                      <h4 className="text-xs font-bold text-slate-800">WEEKLY STATEMENT</h4>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded uppercase">
                        {weeklyVehicle ? 'Preview Ready' : 'Awaiting Inputs'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-left text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vehicle Plate:</span>
                      <span className="font-mono font-bold text-slate-800">{weeklyVehicle || 'Not Selected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reference Invoice:</span>
                      <span className="font-mono text-slate-800">{weeklyInvoice || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Processing Date:</span>
                      <span className="text-slate-800">{formatDate(weeklyDate)}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-150 pt-3 space-y-2 text-left text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-800">
                      <span>Gross Payment Amount:</span>
                      <span className="text-blue-700">{formatCurrency(weeklyGross || 0)}</span>
                    </div>

                    <div className="space-y-1.5 pl-3 border-l-2 border-indigo-200 text-2xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Service Charge (5%):</span>
                        <span className="text-rose-600">-{formatCurrency(Math.round((weeklyGross || 0) * 0.05))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TDS Deduction (1%):</span>
                        <span className="text-rose-600">-{formatCurrency(Math.round((weeklyGross || 0) * 0.01))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fixed Admin Fee:</span>
                        <span className="text-rose-600">-{formatCurrency(weeklyAdminCharge || 0)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-slate-500 text-2xs pt-1">
                      <span>Total Auto Deductions:</span>
                      <span className="text-rose-600 font-semibold">
                        -{formatCurrency(Math.round((weeklyGross || 0) * 0.06) + (weeklyAdminCharge || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between items-center bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
                    <div className="text-left">
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Net Payable to Owner</p>
                      <p className="text-lg font-black text-indigo-900 leading-none mt-0.5">
                        {formatCurrency(
                          Math.max(
                            0,
                            (weeklyGross || 0) -
                              Math.round((weeklyGross || 0) * 0.05) -
                              Math.round((weeklyGross || 0) * 0.01) -
                              (weeklyAdminCharge || 0)
                          )
                        )}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 max-w-[120px] font-medium leading-tight">
                      Will log 1 payment and 3 deductions automatically.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Weekly Payments table */}
          {payments.filter(p => p.id.startsWith('PAY-WK-')).length > 0 && (
            <div className="mt-8 border-t border-slate-150 pt-6">
              <h4 className="text-xs font-bold text-slate-800 mb-3 text-left">Recent Weekly Settlements Logged</h4>
              <div className="overflow-x-auto scrollbar-visible rounded-lg border border-slate-150">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Vehicle Plate</th>
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3 text-right">Gross Amount</th>
                      <th className="py-2.5 px-3">Settlement Summary</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.filter(p => p.id.startsWith('PAY-WK-')).slice(0, 5).map((p) => {
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/30">
                          <td className="py-2 px-3 text-slate-500">{formatDate(p.paymentDate)}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-700">{p.vehicleNumber}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{p.invoiceNumber}</td>
                          <td className="py-2 px-3 text-right font-semibold text-blue-700">{formatCurrency(p.amountReceived)}</td>
                          <td className="py-2 px-3 text-slate-500 truncate max-w-[280px] text-[11px]" title={p.remarks}>
                            {p.remarks}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              id={`btn-del-weekly-pay-${p.id}`}
                              onClick={() => {
                                const invoiceNum = p.invoiceNumber;
                                const cleanedPayments = payments.filter(pay => pay.id !== p.id);
                                const cleanedExpenses = expenses.filter(exp => !(exp.id.startsWith('EXP-WK-') && exp.remarks.includes(invoiceNum)));
                                onUpdatePayments(cleanedPayments);
                                onUpdateExpenses(cleanedExpenses);
                              }}
                              className="p-1 hover:bg-rose-50 text-rose-500 rounded transition-colors"
                              title="Delete Settlement & Deductions"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

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
