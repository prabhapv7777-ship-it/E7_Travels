/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FileText,
  Filter,
  BarChart2,
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
} from 'lucide-react';
import { Vehicle, Expense, CompanyPayment } from '../types';
import { formatDate, formatMonth, toInputDateFormat } from '../lib/dateUtils';

interface ReportsProps {
  vehicles: Vehicle[];
  expenses: Expense[];
  payments: CompanyPayment[];
}

export default function Reports({ vehicles, expenses, payments }: ReportsProps) {
  const [groupBy, setGroupBy] = useState<'vehicleNumber' | 'company' | 'expenseType' | 'month'>('company');
  const [selectedMonth, setSelectedMonth] = useState('');

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

  // Pivot Engine: computes consolidated revenue, CNG, EMI, other costs, and total deductions
  const getPivotData = () => {
    const summaryMap: {
      [key: string]: {
        name: string;
        billing: number;
        cng: number;
        emi: number;
        other: number;
        deductions: number;
        net: number;
      };
    } = {};

    const isYearSelected = selectedMonth.length === 4;
    const isDateSelected = selectedMonth.length === 10;

    // Grouping keys mapping
    // Payments (Revenue)
    payments.forEach((p) => {
      if (selectedMonth) {
        if (isDateSelected) {
          if (toInputDateFormat(p.paymentDate) !== selectedMonth) return;
        } else if (isYearSelected) {
          if (!p.month.startsWith(selectedMonth)) return;
        } else {
          if (p.month !== selectedMonth) return;
        }
      }

      let key = '';
      if (groupBy === 'company') key = p.company;
      else if (groupBy === 'vehicleNumber') key = p.vehicleNumber;
      else if (groupBy === 'month') key = p.month;
      else if (groupBy === 'expenseType') key = 'Operating Income';

      if (!key) return;

      if (!summaryMap[key]) {
        summaryMap[key] = { name: key, billing: 0, cng: 0, emi: 0, other: 0, deductions: 0, net: 0 };
      }
      summaryMap[key].billing += p.amountReceived;
    });

    // Expenses (Deductions)
    expenses.forEach((e) => {
      if (selectedMonth) {
        if (isDateSelected) {
          if (toInputDateFormat(e.date) !== selectedMonth) return;
        } else if (isYearSelected) {
          if (!e.month.startsWith(selectedMonth)) return;
        } else {
          if (e.month !== selectedMonth) return;
        }
      }

      let key = '';
      if (groupBy === 'company') {
        const vehicle = vehicles.find((v) => v.registrationNumber === e.vehicleNumber);
        key = vehicle ? vehicle.company : 'Unassigned';
      } else if (groupBy === 'vehicleNumber') {
        key = e.vehicleNumber;
      } else if (groupBy === 'month') {
        key = e.month;
      } else if (groupBy === 'expenseType') {
        key = e.expenseType;
      }

      if (!key) return;

      if (!summaryMap[key]) {
        summaryMap[key] = { name: key, billing: 0, cng: 0, emi: 0, other: 0, deductions: 0, net: 0 };
      }

      if (e.expenseType === 'CNG') {
        summaryMap[key].cng += e.amount;
      } else if (e.expenseType === 'EMI') {
        summaryMap[key].emi += e.amount;
      } else {
        summaryMap[key].other += e.amount;
      }
      summaryMap[key].deductions += e.amount;
    });

    // Compute Net
    const rows = Object.values(summaryMap).map((row) => {
      return {
        ...row,
        net: row.billing - row.deductions,
      };
    });

    return rows;
  };

  const reportData = getPivotData();

  // Grand totals
  const grandBilling = reportData.reduce((sum, r) => sum + r.billing, 0);
  const grandCng = reportData.reduce((sum, r) => sum + r.cng, 0);
  const grandEmi = reportData.reduce((sum, r) => sum + r.emi, 0);
  const grandOther = reportData.reduce((sum, r) => sum + r.other, 0);
  const grandDeductions = reportData.reduce((sum, r) => sum + r.deductions, 0);
  const grandNet = reportData.reduce((sum, r) => sum + r.net, 0);

  // Recharts Chart Series mapping
  const chartData = reportData.map((r) => ({
    name: groupBy === 'month' ? formatMonth(r.name) : r.name.split(' ')[0], // short label
    Billing: r.billing,
    Deductions: r.deductions,
    Net: r.net,
  })).slice(0, 10); // cap at top 10

  return (
    <div className="space-y-6">
      {/* Search and filter control bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Pivot Group selectors */}
          <div className="space-y-1">
            <span className="block text-3xs font-semibold text-slate-500 uppercase">Pivot Rows Grouping</span>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              {(['company', 'vehicleNumber', 'expenseType', 'month'] as const).map((g) => (
                <button
                  id={`pivot-group-btn-${g}`}
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-all ${
                    groupBy === g ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {g === 'vehicleNumber' ? 'Vehicle' : g === 'expenseType' ? 'Expense' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Month Filter */}
          <div className="space-y-1">
            <span className="block text-3xs font-semibold text-slate-500 uppercase">Settlement Filter</span>
            <select
              id="report-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800"
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
        </div>

        <div>
          <span className="text-3xs text-slate-400 font-mono"> चेन्नई-01 / E7-Travels Analytics Core</span>
        </div>
      </div>

      {/* Dynamic Summary Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Financial Pivot Analysis</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
              <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip formatter={(val) => formatCurrency(val as number)} />
              <Legend />
              <Bar dataKey="Billing" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Deductions" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pivot React Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
          <FileText className="text-slate-400 h-4 w-4" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dynamic Pivot Worksheet</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/50 text-3xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-6">Pivot Row Headings</th>
                <th className="py-3 px-6 text-right">Gross Contract Billing (₹)</th>
                <th className="py-3 px-6 text-right">CNG Deductions (₹)</th>
                <th className="py-3 px-6 text-right">EMI Deductions (₹)</th>
                <th className="py-3 px-6 text-right">Other Deductions (₹)</th>
                <th className="py-3 px-6 text-right font-bold">Total Deductions (₹)</th>
                <th className="py-3 px-6 text-right font-black">Net Cash Position (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {reportData.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/20 font-medium">
                  <td className="py-3 px-6 font-bold text-slate-800">
                    {groupBy === 'month' ? formatMonth(r.name) : r.name}
                  </td>
                  <td className="py-3 px-6 text-right text-emerald-600">{formatCurrency(r.billing)}</td>
                  <td className="py-3 px-6 text-right text-rose-500">{formatCurrency(r.cng)}</td>
                  <td className="py-3 px-6 text-right text-rose-500">{formatCurrency(r.emi)}</td>
                  <td className="py-3 px-6 text-right text-rose-500">{formatCurrency(r.other)}</td>
                  <td className="py-3 px-6 text-right text-rose-600 font-bold">{formatCurrency(r.deductions)}</td>
                  <td className={`py-3 px-6 text-right font-extrabold ${r.net >= 0 ? 'text-blue-800' : 'text-rose-800'}`}>
                    {formatCurrency(r.net)}
                  </td>
                </tr>
              ))}

              {/* Grand totals */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-3.5 px-6 font-black text-slate-900">GRAND TOTALS</td>
                <td className="py-3.5 px-6 text-right text-emerald-700">{formatCurrency(grandBilling)}</td>
                <td className="py-3.5 px-6 text-right text-rose-600">{formatCurrency(grandCng)}</td>
                <td className="py-3.5 px-6 text-right text-rose-600">{formatCurrency(grandEmi)}</td>
                <td className="py-3.5 px-6 text-right text-rose-600">{formatCurrency(grandOther)}</td>
                <td className="py-3.5 px-6 text-right text-rose-700 font-bold">{formatCurrency(grandDeductions)}</td>
                <td className="py-3.5 px-6 text-right text-blue-900 font-black">{formatCurrency(grandNet)}</td>
              </tr>
            </tbody>
          </table>
          {reportData.length === 0 && (
            <p className="text-center py-8 text-slate-400">No operations records found for this subset.</p>
          )}
        </div>
      </div>
    </div>
  );
}
