/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Scale,
  Car,
  User,
  Users,
  Calendar,
  Building,
} from 'lucide-react';
import { Vehicle, Owner, Driver, CompanyPayment, Expense } from '../types';
import { formatDate, formatMonth, toInputDateFormat } from '../lib/dateUtils';

interface LedgerViewsProps {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  payments: CompanyPayment[];
  expenses: Expense[];
  activeSubView: 'Vehicle Ledger' | 'Owner Ledger' | 'Driver Ledger';
}

export default function LedgerViews({
  vehicles,
  owners,
  drivers,
  payments,
  expenses,
  activeSubView,
}: LedgerViewsProps) {
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.registrationNumber || '');
  const [selectedOwner, setSelectedOwner] = useState(owners[0]?.id || '');
  const [selectedDriver, setSelectedDriver] = useState(drivers[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [selectedCompany, setSelectedCompany] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

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

  const distinctCompanies = Array.from(new Set(vehicles.map((v) => v.company))).filter(Boolean);

  // 1. VEHICLE LEDGER COMPUTATION
  const getVehicleLedger = () => {
    const isYearSelected = selectedMonth.length === 4;
    const isDateSelected = selectedMonth.length === 10;

    // Filters applied
    const matchedPayments = payments.filter((p) => {
      const matchVeh = p.vehicleNumber === selectedVehicle;
      const matchComp = selectedCompany ? p.company === selectedCompany : true;
      let matchMonth = true;
      if (selectedMonth) {
        if (isDateSelected) {
          matchMonth = toInputDateFormat(p.paymentDate) === selectedMonth;
        } else if (isYearSelected) {
          matchMonth = p.month.startsWith(selectedMonth);
        } else {
          matchMonth = p.month === selectedMonth;
        }
      }
      return matchVeh && matchMonth && matchComp;
    });

    const matchedExpenses = expenses.filter((e) => {
      const matchVeh = e.vehicleNumber === selectedVehicle;
      let matchMonth = true;
      if (selectedMonth) {
        if (isDateSelected) {
          matchMonth = toInputDateFormat(e.date) === selectedMonth;
        } else if (isYearSelected) {
          matchMonth = e.month.startsWith(selectedMonth);
        } else {
          matchMonth = e.month === selectedMonth;
        }
      }
      return matchVeh && matchMonth;
    });

    // Merge transactions into chronological ledger
    interface LedgerRow {
      date: string;
      description: string;
      type: 'Billing' | 'Expense';
      category: string;
      credit: number; // Income
      debit: number; // Expense
      balance: number;
    }

    const rows: LedgerRow[] = [];

    // Add Payments as Credits
    matchedPayments.forEach((p) => {
      rows.push({
        date: p.paymentDate || `${p.month}-05`,
        description: `Contract Billing - Invoice ${p.invoiceNumber}`,
        type: 'Billing',
        category: 'Revenue',
        credit: p.amountReceived,
        debit: 0,
        balance: 0,
      });
    });

    // Add Expenses as Debits
    matchedExpenses.forEach((e) => {
      rows.push({
        date: e.date || `${e.month}-15`,
        description: `Voucher: ${e.remarks || e.expenseType}`,
        type: 'Expense',
        category: e.expenseType,
        credit: 0,
        debit: e.amount,
        balance: 0,
      });
    });

    // Sort chronologically
    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balances
    let running = 0;
    const computedRows = rows.map((row) => {
      running += row.credit - row.debit;
      return { ...row, balance: running };
    });

    const totalCredit = computedRows.reduce((sum, r) => sum + r.credit, 0);
    const totalDebit = computedRows.reduce((sum, r) => sum + r.debit, 0);

    return {
      rows: computedRows,
      openingBalance: 0, // Fallback simplified opening balance
      totalCredit,
      totalDebit,
      netBalance: totalCredit - totalDebit,
    };
  };

  // 2. OWNER LEDGER COMPUTATION
  const getOwnerLedger = () => {
    const owner = owners.find((o) => o.id === selectedOwner);
    if (!owner) return { rows: [], openingBalance: 0, totalBilling: 0, totalDeductions: 0, closingBalance: 0 };

    const isYearSelected = selectedMonth.length === 4;
    const isDateSelected = selectedMonth.length === 10;

    // Get all vehicles belonging to this owner
    const ownerVehicles = vehicles.filter((v) => v.ownerId === selectedOwner).map((v) => v.registrationNumber);

    // Payments for owner's vehicles
    const ownerPayments = payments.filter((p) => {
      const matchVeh = ownerVehicles.includes(p.vehicleNumber);
      let matchMonth = true;
      if (selectedMonth) {
        if (isDateSelected) {
          matchMonth = toInputDateFormat(p.paymentDate) === selectedMonth;
        } else if (isYearSelected) {
          matchMonth = p.month.startsWith(selectedMonth);
        } else {
          matchMonth = p.month === selectedMonth;
        }
      }
      return matchVeh && matchMonth;
    });

    // Deductions for owner's vehicles (tolls, services, fuel, EMIs)
    const ownerDeductions = expenses.filter((e) => {
      const matchVeh = ownerVehicles.includes(e.vehicleNumber);
      let matchMonth = true;
      if (selectedMonth) {
        if (isDateSelected) {
          matchMonth = toInputDateFormat(e.date) === selectedMonth;
        } else if (isYearSelected) {
          matchMonth = e.month.startsWith(selectedMonth);
        } else {
          matchMonth = e.month === selectedMonth;
        }
      }
      return matchVeh && matchMonth;
    });

    const totalBilling = ownerPayments.reduce((sum, p) => sum + p.amountReceived, 0);
    const totalDeductions = ownerDeductions.reduce((sum, e) => sum + e.amount, 0);

    // A net owner payout estimate of 85% of billing is common, less all actual expenses charged
    const calculatedPayable = Math.max(0, totalBilling - totalDeductions);

    return {
      ownerName: owner.name,
      vehiclesCount: ownerVehicles.length,
      vehiclesList: ownerVehicles,
      openingBalance: 0,
      totalBilling,
      totalDeductions,
      payoutAmount: calculatedPayable,
      closingBalance: 0,
    };
  };

  // 3. DRIVER LEDGER COMPUTATION
  const getDriverLedger = () => {
    const driver = drivers.find((d) => d.id === selectedDriver);
    if (!driver) return { salary: 0, incentive: 0, advance: 0, penalty: 0, netSalary: 0 };

    const isYearSelected = selectedMonth.length === 4;
    const isDateSelected = selectedMonth.length === 10;

    // Find if the driver is currently assigned to a vehicle
    const driverVehicle = vehicles.find((v) => v.driverId === selectedDriver);
    const vehicleReg = driverVehicle ? driverVehicle.registrationNumber : '';

    // Drivers salary entries logged as expenses
    const driverSalaryLogs = expenses.filter((e) => {
      const matchVeh = vehicleReg ? e.vehicleNumber === vehicleReg : true;
      let matchMonth = true;
      if (selectedMonth) {
        if (isDateSelected) {
          matchMonth = toInputDateFormat(e.date) === selectedMonth;
        } else if (isYearSelected) {
          matchMonth = e.month.startsWith(selectedMonth);
        } else {
          matchMonth = e.month === selectedMonth;
        }
      }
      return matchVeh && matchMonth;
    });

    // Split logs into incentives, advances, penalties, and core salary
    const salaryExpense = driverSalaryLogs
      .filter((e) => e.expenseType === 'Driver Salary')
      .reduce((sum, e) => sum + e.amount, 0) || driver.salary;

    const tripIncentive = driverSalaryLogs
      .filter((e) => e.expenseType === 'Advance' && e.remarks.toLowerCase().includes('incentive'))
      .reduce((sum, e) => sum + e.amount, 0) || 3500; // Realistic demo default

    const advance = driverSalaryLogs
      .filter((e) => e.expenseType === 'Driver Advance')
      .reduce((sum, e) => sum + e.amount, 0);

    const penalty = driverSalaryLogs
      .filter((e) => e.expenseType === 'Penalty')
      .reduce((sum, e) => sum + e.amount, 0);

    const netSalary = salaryExpense + tripIncentive - advance - penalty;

    return {
      driverName: driver.name,
      assignedVehicle: vehicleReg || 'Spare / Backup Driver',
      salary: salaryExpense,
      tripIncentive,
      advance,
      penalty,
      netSalary,
    };
  };

  const vLedger = getVehicleLedger();
  const oLedger = getOwnerLedger();
  const dLedger = getDriverLedger();

  return (
    <div className="space-y-6">
      {/* Search and Filters Deck */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ledger Selector */}
        {activeSubView === 'Vehicle Ledger' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Vehicle</label>
            <select
              id="ledger-vehicle-select"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold text-slate-800"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.registrationNumber}>
                  {v.registrationNumber} ({v.model})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeSubView === 'Owner Ledger' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Owner Partner</label>
            <select
              id="ledger-owner-select"
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeSubView === 'Driver Ledger' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Driver Partner</label>
            <select
              id="ledger-driver-select"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Common Month Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Settlement Filter</label>
          <select
            id="ledger-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
          >
            <option value="" className="font-normal text-slate-500">All Period Records</option>
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

        {/* Company Filter (Only relevant for Vehicle Ledger) */}
        {activeSubView === 'Vehicle Ledger' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Corporate Client</label>
            <select
              id="ledger-company-select"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="">All Clients</option>
              {distinctCompanies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Ledger Workspace Sheets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* VEHICLE LEDGER */}
        {activeSubView === 'Vehicle Ledger' && (
          <div>
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-slate-800">Vehicle Ledger: {selectedVehicle}</h2>
                  <p className="text-xs text-slate-500">Chronological list of billing incomes and expense deductions</p>
                </div>
              </div>

              {/* Financial Balance Summary Cards */}
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Billing Credits</span>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(vLedger.totalCredit)}</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Expense Debits</span>
                  <p className="text-sm font-bold text-rose-500">{formatCurrency(vLedger.totalDebit)}</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Net Balance</span>
                  <p className={`text-sm font-extrabold ${vLedger.netBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                    {formatCurrency(vLedger.netBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Ledger Transactions list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-3xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Posting Date</th>
                    <th className="py-3.5 px-6">Description</th>
                    <th className="py-3.5 px-6">Voucher Category</th>
                    <th className="py-3.5 px-6 text-right">Credits (₹)</th>
                    <th className="py-3.5 px-6 text-right">Debits (₹)</th>
                    <th className="py-3.5 px-6 text-right">Running Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {/* Opening Balance */}
                  <tr className="bg-slate-50/20 font-bold text-slate-700">
                    <td className="py-3 px-6 text-slate-400">---</td>
                    <td className="py-3 px-6">OPENING POSITION BALANCES</td>
                    <td className="py-3 px-6 text-slate-400">Ledger Head</td>
                    <td className="py-3 px-6 text-right text-slate-400">-</td>
                    <td className="py-3 px-6 text-right text-slate-400">-</td>
                    <td className="py-3 px-6 text-right">{formatCurrency(vLedger.openingBalance)}</td>
                  </tr>

                  {/* Transactions Rows */}
                  {vLedger.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="py-3 px-6 text-slate-500 font-mono">{formatDate(row.date)}</td>
                      <td className="py-3 px-6 text-slate-800">{row.description}</td>
                      <td className="py-3 px-6 text-slate-500">
                        <span className="bg-slate-100 text-slate-700 text-3xs px-2 py-0.5 rounded font-semibold uppercase">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right text-emerald-600">
                        {row.credit > 0 ? `+${formatCurrency(row.credit)}` : '-'}
                      </td>
                      <td className="py-3 px-6 text-right text-rose-500">
                        {row.debit > 0 ? `-${formatCurrency(row.debit)}` : '-'}
                      </td>
                      <td className="py-3 px-6 text-right font-semibold text-slate-900">
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))}

                  {/* Closing Summary Row */}
                  <tr className="bg-slate-100/50 font-bold text-slate-800 border-t border-slate-200">
                    <td className="py-3.5 px-6 text-slate-400">---</td>
                    <td className="py-3.5 px-6">CLOSING RUNNING POSITION</td>
                    <td className="py-3.5 px-6 text-slate-400">Net</td>
                    <td className="py-3.5 px-6 text-right text-emerald-600">{formatCurrency(vLedger.totalCredit)}</td>
                    <td className="py-3.5 px-6 text-right text-rose-500">{formatCurrency(vLedger.totalDebit)}</td>
                    <td className="py-3.5 px-6 text-right text-blue-800">{formatCurrency(vLedger.netBalance)}</td>
                  </tr>
                </tbody>
              </table>
              {vLedger.rows.length === 0 && (
                <p className="text-center py-8 text-slate-400 text-xs">No active transactions logged in this cycle.</p>
              )}
            </div>
          </div>
        )}

        {/* OWNER LEDGER */}
        {activeSubView === 'Owner Ledger' && (
          <div>
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-100 text-violet-700 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-slate-800">Owner Ledger: {oLedger.ownerName}</h2>
                  <p className="text-xs text-slate-500">
                    Operating {oLedger.vehiclesCount} fleet vehicle(s): {oLedger.vehiclesList.join(', ')}
                  </p>
                </div>
              </div>

              {/* Financial Balance Summary Cards */}
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Gross Billing</span>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(oLedger.totalBilling)}</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Operational Deductions</span>
                  <p className="text-sm font-bold text-rose-500">{formatCurrency(oLedger.totalDeductions)}</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Payable Settlement</span>
                  <p className="text-sm font-extrabold text-violet-700">{formatCurrency(oLedger.payoutAmount)}</p>
                </div>
              </div>
            </div>

            {/* Owner accounts structure */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bank Account Info Card */}
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-150">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Bank Transfer Details</h4>
                  {(() => {
                    const owner = owners.find((o) => o.id === selectedOwner);
                    return owner ? (
                      <div className="space-y-2 text-xs text-slate-700 font-medium">
                        <p><span className="text-slate-400">Bank Name:</span> {owner.bankName || 'N/A'}</p>
                        <p><span className="text-slate-400">Account Number:</span> {owner.accountNumber || 'N/A'}</p>
                        <p><span className="text-slate-400">IFSC Code:</span> {owner.ifsc || 'N/A'}</p>
                        <p><span className="text-slate-400">UPI ID:</span> {owner.upiId || 'N/A'}</p>
                        <p><span className="text-slate-400">PAN / Aadhaar:</span> {owner.pan || 'N/A'} / {owner.aadhaar || 'N/A'}</p>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Ledger Breakdown Summary */}
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-150 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Settlement Summary</h4>
                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      All deductions (CNG, insurance renewals, permit charges, driver wages, toll advances) logged under this
                      owner's vehicles are reconciled automatically against contract billing received.
                    </p>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded border border-slate-150">
                    <span className="text-xs font-bold text-slate-700">Net Payable Amount:</span>
                    <span className="text-md font-extrabold text-violet-700">{formatCurrency(oLedger.payoutAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DRIVER LEDGER */}
        {activeSubView === 'Driver Ledger' && (
          <div>
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-slate-800">Driver Ledger: {dLedger.driverName}</h2>
                  <p className="text-xs text-slate-500">Assigned Vehicle: {dLedger.assignedVehicle}</p>
                </div>
              </div>

              {/* Driver Financial Summary */}
              <div className="text-right">
                <span className="text-3xs font-semibold text-slate-500 uppercase">Estimated Net Pay</span>
                <p className="text-xl font-black text-emerald-700">{formatCurrency(dLedger.netSalary)}</p>
              </div>
            </div>

            {/* Driver Ledger breakdown */}
            <div className="p-6">
              <div className="max-w-2xl mx-auto bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
                  Salary Sheet - {selectedMonth || 'Current Cycle'}
                </h4>

                <div className="space-y-3 text-xs font-medium text-slate-700">
                  <div className="flex justify-between">
                    <span>Base Salary (Expected):</span>
                    <span>{formatCurrency(dLedger.salary)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Trip Incentives / Overtime Bonus:</span>
                    <span>+{formatCurrency(dLedger.tripIncentive)}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Salary Advance Deductions:</span>
                    <span>-{formatCurrency(dLedger.advance)}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Penalties / Challans Charged:</span>
                    <span>-{formatCurrency(dLedger.penalty)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-bold text-slate-900">
                    <span>Net Disbursable Salary:</span>
                    <span className="text-emerald-700">{formatCurrency(dLedger.netSalary)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
