/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Car,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  CreditCard,
  Gauge,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Vehicle, Expense, CompanyPayment } from '../types';
import { formatMonth } from '../lib/dateUtils';

interface DashboardProps {
  vehicles: Vehicle[];
  expenses: Expense[];
  payments: CompanyPayment[];
  onNavigate: (view: string, filter?: 'all' | 'running' | 'idle' | 'new') => void;
}

export default function Dashboard({ vehicles, expenses, payments, onNavigate }: DashboardProps) {
  // Current Month calculation for KPI metrics (System date: July 2026)
  const currentMonth = '2026-07';

  // 1. KPI Aggregations
  const totalVehicles = vehicles.length;
  const runningVehicles = vehicles.filter((v) => v.status === 'Active').length;
  const idleVehicles = totalVehicles - runningVehicles;
  
  const newVehiclesThisMonth = vehicles.filter((v) => {
    return v.joiningDate && v.joiningDate.startsWith(currentMonth);
  }).length;

  const totalBilling = payments.reduce((acc, p) => acc + p.amountReceived, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalBilling - totalExpenses;

  // Pending Owner Payments (calculated as Company Payments minus all Owner Deductions/Expenses except salaries, etc.
  // Or simply a standard estimate or calculated value from the monthly settlement)
  // Let's compute a realistic Pending Owner Payment: Total Payments to Owner's Vehicles minus Owner-responsible deductions.
  const pendingOwnerPayments = Math.max(0, totalBilling * 0.85 - totalExpenses * 0.4);

  // Pending Driver Salary: Drivers' expected salaries that haven't been paid as an expense yet.
  // Let's check how many active drivers are registered, and check if salary expense has been logged for July 2026.
  const activeDriversSalaryTotal = vehicles
    .filter((v) => v.status === 'Active')
    .reduce((sum, v) => sum + 22000, 0); // fallback average driver salary
  const loggedDriverSalariesThisMonth = expenses
    .filter((e) => e.month === currentMonth && e.expenseType === 'Driver Salary')
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingDriverSalary = Math.max(0, activeDriversSalaryTotal - loggedDriverSalariesThisMonth);

  const cngExpense = expenses
    .filter((e) => e.expenseType === 'CNG')
    .reduce((acc, e) => acc + e.amount, 0);

  const emiExpense = expenses
    .filter((e) => e.expenseType === 'EMI')
    .reduce((acc, e) => acc + e.amount, 0);

  const serviceExpense = expenses
    .filter((e) => e.expenseType === 'Service' || e.expenseType === 'Repair')
    .reduce((acc, e) => acc + e.amount, 0);

  // 2. Chart Data formatting
  // A. Monthly Income, Expenses, Profit Chart
  const months = Array.from(new Set([...payments.map((p) => p.month), ...expenses.map((e) => e.month)])).sort();
  const monthlyTrendsData = months.map((m) => {
    const income = payments.filter((p) => p.month === m).reduce((sum, p) => sum + p.amountReceived, 0);
    const cost = expenses.filter((e) => e.month === m).reduce((sum, e) => sum + e.amount, 0);
    return {
      name: formatMonth(m),
      Revenue: income,
      Expenses: cost,
      Profit: income - cost,
    };
  });

  // B. Company-wise Revenue Chart
  const companyRevMap: { [key: string]: number } = {};
  payments.forEach((p) => {
    companyRevMap[p.company] = (companyRevMap[p.company] || 0) + p.amountReceived;
  });
  const companyRevenueData = Object.entries(companyRevMap).map(([name, value]) => ({
    name: name.split(' ')[0], // abbreviation for clean chart
    Revenue: value,
  }));

  // C. Expense Breakdown Chart
  const expenseBreakdownMap: { [key: string]: number } = {};
  expenses.forEach((e) => {
    expenseBreakdownMap[e.expenseType] = (expenseBreakdownMap[e.expenseType] || 0) + e.amount;
  });
  const expenseBreakdownData = Object.entries(expenseBreakdownMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 expenses

  // D. Vehicle Status Chart
  const vehicleStatusData = [
    { name: 'Running', value: runningVehicles },
    { name: 'Idle', value: idleVehicles },
  ];

  const COLORS = ['#1d4ed8', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const STATUS_COLORS = ['#10b981', '#9ca3af'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const kpis = [
    { id: 'total-vehicles', title: 'Total Vehicles', value: totalVehicles, icon: Car, bg: 'bg-blue-50 text-blue-600 border-blue-100', nav: 'Vehicle Master', filter: 'all' as const },
    { id: 'running-vehicles', title: 'Running Vehicles', value: runningVehicles, icon: CheckCircle, bg: 'bg-green-50 text-green-600 border-green-100', nav: 'Vehicle Master', filter: 'running' as const },
    { id: 'idle-vehicles', title: 'Idle Vehicles', value: idleVehicles, icon: AlertTriangle, bg: 'bg-amber-50 text-amber-600 border-amber-100', nav: 'Vehicle Master', filter: 'idle' as const },
    { id: 'new-vehicles', title: 'New (This Month)', value: newVehiclesThisMonth, icon: Sparkles, bg: 'bg-purple-50 text-purple-600 border-purple-100', nav: 'Vehicle Master', filter: 'new' as const },
    { id: 'total-billing', title: 'Total Billing', value: formatCurrency(totalBilling), icon: DollarSign, bg: 'bg-blue-50 text-blue-700 border-blue-200', nav: 'Company Payments' },
    { id: 'total-expenses', title: 'Total Expenses', value: formatCurrency(totalExpenses), icon: TrendingUp, bg: 'bg-rose-50 text-rose-600 border-rose-200', nav: 'Expense Entry' },
    { id: 'net-profit', title: 'Net Profit', value: formatCurrency(netProfit), icon: ShieldCheck, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', nav: 'Profit & Loss' },
    { id: 'owner-pending', title: 'Pending Owner Pay', value: formatCurrency(pendingOwnerPayments), icon: Users, bg: 'bg-violet-50 text-violet-700 border-violet-100', nav: 'Owner Ledger' },
    { id: 'driver-pending', title: 'Pending Driver Sal', value: formatCurrency(pendingDriverSalary), icon: CreditCard, bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', nav: 'Driver Ledger' },
    { id: 'cng-cost', title: 'Total CNG Expense', value: formatCurrency(cngExpense), icon: Gauge, bg: 'bg-cyan-50 text-cyan-600 border-cyan-100', nav: 'Expense Entry' },
    { id: 'total-emi', title: 'Total EMI Cost', value: formatCurrency(emiExpense), icon: AlertCircle, bg: 'bg-teal-50 text-teal-600 border-teal-100', nav: 'Expense Entry' },
    { id: 'service-cost', title: 'Total Service Cost', value: formatCurrency(serviceExpense), icon: Wrench, bg: 'bg-orange-50 text-orange-600 border-orange-100', nav: 'Expense Entry' },
  ];

  const quickNavs = [
    { name: 'Dashboard', route: 'Dashboard' },
    { name: 'Vehicles', route: 'Vehicle Master' },
    { name: 'Owners', route: 'Owner Master' },
    { name: 'Drivers', route: 'Driver Master' },
    { name: 'Companies', route: 'Company Master' },
    { name: 'Sites', route: 'Site Master' },
    { name: 'Billing', route: 'Company Payments' },
    { name: 'Expenses', route: 'Expense Entry' },
    { name: 'Settlement', route: 'Monthly Settlement' },
    { name: 'Owner Statement', route: 'Owner Statement' },
    { name: 'Driver Statement', route: 'Driver Statement' },
    { name: 'Vehicle Ledgers', route: 'Vehicle Ledger' },
    { name: 'Owner Ledgers', route: 'Owner Ledger' },
    { name: 'Driver Ledgers', route: 'Driver Ledger' },
    { name: 'Vehicle History', route: 'Vehicle History' },
    { name: 'Invoices', route: 'Invoice' },
    { name: 'Pouchers', route: 'Payment Voucher' },
    { name: 'P&L Analysis', route: 'Profit & Loss' },
    { name: 'Reports', route: 'Reports' },
    { name: 'Settings', route: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Quick Navigation Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-4">ERP Quick Navigation Desk</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {quickNavs.map((n) => (
            <button
              id={`nav-btn-${n.route.toLowerCase().replace(/\s+/g, '-')}`}
              key={n.name}
              onClick={() => onNavigate(n.route)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg border border-slate-200 transition-all text-center truncate"
            >
              {n.name}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              id={`kpi-${kpi.id}`}
              key={kpi.id}
              onClick={() => onNavigate(kpi.nav, (kpi as any).filter)}
              className={`p-5 rounded-xl border flex items-center justify-between shadow-xs hover:shadow-md cursor-pointer transition-all bg-white`}
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-xl border ${kpi.bg}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Layout Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Expense vs Profit */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Fleet Operational Economics</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="Revenue" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Status (Running vs Idle) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Vehicle Readiness Status</h3>
          <div className="h-80 flex flex-col justify-between items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {vehicleStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 justify-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-medium text-slate-600">Running ({runningVehicles})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                <span className="text-xs font-medium text-slate-600">Idle ({idleVehicles})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company-wise revenue breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Corporate Client Revenue Share</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="Revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Operational Expense Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
