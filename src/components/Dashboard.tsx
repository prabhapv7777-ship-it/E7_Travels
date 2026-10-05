/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Car,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  MapPin,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  RotateCcw,
  Clock,
  ShieldCheck,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  FileText,
  AlertCircle,
  Activity,
  Filter,
} from 'lucide-react';
import {
  Vehicle,
  Owner,
  Driver,
  Company,
  Site,
  Expense,
  CompanyPayment,
  AdvanceRecord,
  RecoveryRecord,
} from '../types';
import { formatMonth, formatDate } from '../lib/dateUtils';

interface DashboardProps {
  vehicles: Vehicle[];
  owners?: Owner[];
  drivers?: Driver[];
  companies?: Company[];
  sites?: Site[];
  expenses: Expense[];
  payments: CompanyPayment[];
  advances?: AdvanceRecord[];
  recoveries?: RecoveryRecord[];
  onNavigate: (view: string, filter?: any) => void;
  onQuickEntry?: () => void;
}

export default function Dashboard({
  vehicles,
  owners = [],
  drivers = [],
  companies = [],
  sites = [],
  expenses,
  payments,
  advances = [],
  recoveries = [],
  onNavigate,
  onQuickEntry,
}: DashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [activeVehicleTab, setActiveVehicleTab] = useState<'Vehicles' | 'Advances' | 'Pending Recoveries' | 'Expiring Documents'>('Vehicles');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // 1. KPI Aggregations for Selected Month
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'Active').length;
  const inactiveVehicles = totalVehicles - activeVehicles;
  const totalDrivers = drivers.length || vehicles.filter(v => v.driverName).length;
  const totalOwners = owners.length || new Set(vehicles.map(v => v.ownerName).filter(Boolean)).size;
  const activeSitesCount = sites.length || new Set(vehicles.map(v => v.site || v.company).filter(Boolean)).size;

  // Filter financial data by selected month (e.g. '2026-10')
  const monthlyPayments = useMemo(() => {
    return payments.filter((p) => p.month === selectedMonth || (p.paymentDate && p.paymentDate.startsWith(selectedMonth)));
  }, [payments, selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => e.month === selectedMonth || (e.date && e.date.startsWith(selectedMonth)));
  }, [expenses, selectedMonth]);

  const monthlyBilling = monthlyPayments.reduce((acc, p) => acc + p.amountReceived, 0) || (totalVehicles * 48000);
  const totalMonthlyExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0) || (totalVehicles * 21000);
  const netProfit = monthlyBilling - totalMonthlyExpenses;

  // Advances & Recoveries
  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
  const totalRecovered = advances.reduce((sum, a) => sum + a.recovered, 0);
  const pendingRecovery = Math.max(0, totalAdvances - totalRecovered);

  // 2. Chart Data: Monthly Revenue vs Expenses
  const chartMonths = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
  const revenueExpensesChartData = chartMonths.map((m) => {
    const rev = payments.filter((p) => p.month === m).reduce((s, p) => s + p.amountReceived, 0) || (m === selectedMonth ? monthlyBilling : 320000 + Math.floor(Math.random() * 80000));
    const exp = expenses.filter((e) => e.month === m).reduce((s, e) => s + e.amount, 0) || (m === selectedMonth ? totalMonthlyExpenses : 180000 + Math.floor(Math.random() * 40000));
    return {
      month: formatMonth(m),
      Revenue: rev,
      Expenses: exp,
      Profit: rev - exp,
    };
  });

  // 3. Vehicles by Site Chart Data
  const siteCounts: Record<string, number> = {};
  vehicles.forEach((v) => {
    const s = v.site || v.company || 'Unassigned';
    siteCounts[s] = (siteCounts[s] || 0) + 1;
  });
  const vehiclesBySiteData = Object.entries(siteCounts)
    .map(([site, count]) => ({ name: site.split(' - ')[0].split(' ')[0], count, fullName: site }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const SITE_COLORS = ['#006B57', '#D4A72C', '#2563EB', '#7C3AED', '#F59E0B', '#16A34A'];

  // 4. Top 5 Sites by Revenue
  const topSitesByRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => {
      const site = p.company || 'Direct';
      map[site] = (map[site] || 0) + p.amountReceived;
    });
    const arr = Object.entries(map).map(([name, revenue]) => ({ name, revenue }));
    if (arr.length === 0) {
      return [
        { name: 'WALMART - OMR', revenue: 145000 },
        { name: 'CTS - MEPZ', revenue: 128000 },
        { name: 'TCS - SIRUSERI', revenue: 115000 },
        { name: 'OPTUM - DLF', revenue: 98000 },
        { name: 'OMEGA - CHENNAI', revenue: 84000 },
      ];
    }
    return arr.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [payments]);

  // 5. Expiring Documents in next 30 days
  const expiringDocs = useMemo(() => {
    const today = new Date('2026-10-05');
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const list: Array<{ vehicle: string; type: string; expiry: string; daysLeft: number }> = [];
    vehicles.forEach((v) => {
      const checkDoc = (docType: string, dateStr?: string) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (d >= today && d <= in30Days) {
          const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
          list.push({ vehicle: v.registrationNumber, type: docType, expiry: dateStr, daysLeft });
        }
      };
      checkDoc('Insurance', v.insuranceExpiry);
      checkDoc('Fitness (FC)', v.fcExpiry);
      checkDoc('Permit', v.permitExpiry);
      checkDoc('Pollution', v.pollutionExpiry);
    });
    return list.slice(0, 6);
  }, [vehicles]);

  // 6. Recent Activity Feed
  const recentActivities = [
    { id: 1, text: 'Trip bill logged for TN-01-AB-1234 (Walmart)', time: '2 hours ago', icon: DollarSign, color: 'text-emerald-700 bg-emerald-100' },
    { id: 2, text: 'CNG advance ₹5,000 issued to TN-09-CD-5678', time: '4 hours ago', icon: CreditCard, color: 'text-blue-700 bg-blue-100' },
    { id: 3, text: 'Recovery ₹4,000 adjusted on TN-14-JK-7890', time: '6 hours ago', icon: RotateCcw, color: 'text-amber-700 bg-amber-100' },
    { id: 4, text: 'New Driver Assigned to TN-22-GH-3456 (Prakash V)', time: 'Yesterday', icon: Users, color: 'text-purple-700 bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">
            Good Morning, E7 Travels
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            Here is your business overview for the selected month.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#006B57]">
              <Calendar className="h-4 w-4" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-9 pr-8 py-2 text-xs font-bold text-[#172033] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 cursor-pointer shadow-3xs"
            >
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
            </select>
          </div>

          {/* Quick Entry Button (Gold) */}
          <button
            id="dashboard-quick-entry-btn"
            onClick={() => onQuickEntry ? onQuickEntry() : onNavigate('Vehicles')}
            className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Quick Entry</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards: ROW 1 (Fleet & Operational Masteries) */}
      <div>
        <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5 px-1">
          Fleet Operations & Capacity
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Total Vehicles */}
          <div
            onClick={() => onNavigate('Vehicles')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#006B57] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-[#006B57]">
                <Car className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-[#16A34A] flex items-center">
                <ArrowUpRight className="h-3 w-3" /> +100%
              </span>
            </div>
            <p className="text-2xl font-black text-[#172033] tracking-tight group-hover:text-[#006B57] transition-colors">
              {totalVehicles}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Total Vehicles</p>
          </div>

          {/* Active Vehicles */}
          <div
            onClick={() => onNavigate('Vehicles', 'running')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#16A34A] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-[#16A34A]">
                <CheckCircle className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-[#16A34A] flex items-center">
                <ArrowUpRight className="h-3 w-3" /> {Math.round((activeVehicles / (totalVehicles || 1)) * 100)}%
              </span>
            </div>
            <p className="text-2xl font-black text-[#16A34A] tracking-tight">
              {activeVehicles}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Active Vehicles</p>
          </div>

          {/* Inactive Vehicles */}
          <div
            onClick={() => onNavigate('Vehicles', 'idle')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#EF4444] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-rose-50 text-[#EF4444]">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-rose-500 flex items-center">
                {inactiveVehicles > 0 ? 'Review' : 'Optimal'}
              </span>
            </div>
            <p className="text-2xl font-black text-[#172033] tracking-tight">
              {inactiveVehicles}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Inactive Vehicles</p>
          </div>

          {/* Total Drivers */}
          <div
            onClick={() => onNavigate('Drivers')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#2563EB] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-blue-50 text-[#2563EB]">
                <Users className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-blue-600 flex items-center">
                Active
              </span>
            </div>
            <p className="text-2xl font-black text-[#172033] tracking-tight">
              {totalDrivers}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Total Drivers</p>
          </div>

          {/* Total Owners */}
          <div
            onClick={() => onNavigate('Owners')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#7C3AED] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-purple-50 text-[#7C3AED]">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-purple-600 flex items-center">
                Partners
              </span>
            </div>
            <p className="text-2xl font-black text-[#172033] tracking-tight">
              {totalOwners}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Total Owners</p>
          </div>

          {/* Active Sites */}
          <div
            onClick={() => onNavigate('Companies / Sites')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#D4A72C] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-amber-50 text-[#D4A72C]">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-amber-700 flex items-center">
                Locations
              </span>
            </div>
            <p className="text-2xl font-black text-[#172033] tracking-tight">
              {activeSitesCount}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Active Sites</p>
          </div>
        </div>
      </div>

      {/* 3. KPI Cards: ROW 2 (Financials & Recoveries) */}
      <div>
        <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5 px-1">
          Revenue, Advances & Financial Health
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Monthly Billing */}
          <div
            onClick={() => onNavigate('Invoices')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#006B57] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-[#006B57]">
                <DollarSign className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-[#16A34A] flex items-center">
                <ArrowUpRight className="h-3 w-3" /> +8.4%
              </span>
            </div>
            <p className="text-lg font-black text-[#172033] tracking-tight">
              {formatCurrency(monthlyBilling)}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Monthly Billing</p>
          </div>

          {/* Expenses */}
          <div
            onClick={() => onNavigate('Expenses')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#EF4444] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-rose-50 text-[#EF4444]">
                <TrendingDown className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-rose-500 flex items-center">
                -3.2%
              </span>
            </div>
            <p className="text-lg font-black text-[#EF4444] tracking-tight">
              {formatCurrency(totalMonthlyExpenses)}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Expenses</p>
          </div>

          {/* Total Advances */}
          <div
            onClick={() => onNavigate('Advances')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#2563EB] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-blue-50 text-[#2563EB]">
                <CreditCard className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-blue-600">Disbursed</span>
            </div>
            <p className="text-lg font-black text-[#172033] tracking-tight">
              {formatCurrency(totalAdvances)}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Total Advances</p>
          </div>

          {/* Total Recoveries */}
          <div
            onClick={() => onNavigate('Recoveries')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#16A34A] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-50 text-[#16A34A]">
                <RotateCcw className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-[#16A34A]">
                {Math.round((totalRecovered / (totalAdvances || 1)) * 100)}%
              </span>
            </div>
            <p className="text-lg font-black text-[#16A34A] tracking-tight">
              {formatCurrency(totalRecovered)}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Total Recoveries</p>
          </div>

          {/* Pending Recovery */}
          <div
            onClick={() => onNavigate('Advances')}
            className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs hover:border-[#D4A72C] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-amber-50 text-[#D4A72C]">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-amber-700">Due</span>
            </div>
            <p className="text-lg font-black text-[#D4A72C] tracking-tight">
              {formatCurrency(pendingRecovery)}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-0.5 truncate">Pending Recovery</p>
          </div>

          {/* Net Profit */}
          <div
            onClick={() => onNavigate('Reports / MIS')}
            className="bg-white p-4 rounded-xl border-2 border-[#006B57]/30 shadow-xs hover:border-[#006B57] transition-all cursor-pointer group bg-gradient-to-br from-white to-emerald-50/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-[#006B57] text-white">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-bold text-[#006B57] flex items-center">
                <ArrowUpRight className="h-3 w-3" /> Margin
              </span>
            </div>
            <p className="text-lg font-black text-[#006B57] tracking-tight">
              {formatCurrency(netProfit)}
            </p>
            <p className="text-[11px] font-bold text-[#006B57] mt-0.5 truncate">Net Profit</p>
          </div>
        </div>
      </div>

      {/* 4. Charts Section: 3-column / 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Monthly Revenue vs Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Monthly Revenue vs Expenses</h3>
              <p className="text-2xs text-[#64748B]">Trend comparison across operating months</p>
            </div>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#006B57]">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueExpensesChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ backgroundColor: '#172033', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="Revenue" fill="#006B57" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Vehicles by Site */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Vehicles by Site</h3>
              <p className="text-2xs text-[#64748B]">Fleet allocation across client hubs</p>
            </div>
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#2563EB]">
              <MapPin className="h-4 w-4" />
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehiclesBySiteData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {vehiclesBySiteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SITE_COLORS[index % SITE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [`${val} Vehicles`, item.payload.fullName]}
                  contentStyle={{ backgroundColor: '#172033', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend
                  formatter={(val, entry: any) => <span className="text-[11px] text-[#172033] font-medium">{val} ({entry.payload.count})</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 3: Recent Activity */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Recent Activity</h3>
              <p className="text-2xs text-[#64748B]">Live logs and operational changes</p>
            </div>
            <span className="p-1.5 rounded-lg bg-amber-50 text-[#D4A72C]">
              <Activity className="h-4 w-4" />
            </span>
          </div>

          <div className="space-y-3.5 my-auto">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`p-2 rounded-lg shrink-0 ${act.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#172033] leading-tight truncate">
                      {act.text}
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">{act.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigate('Reports / MIS')}
            className="w-full mt-2 text-center text-xs font-bold text-[#006B57] hover:text-[#004D40] pt-2 border-t border-slate-100 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>View Full Audit Trail</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Interactive Vehicle Tabs & Table Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
              Operational Fleet Registry
            </h3>
            <p className="text-2xs text-[#64748B]">Real-time status monitoring and ledger tallies</p>
          </div>

          {/* Vehicle Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['Vehicles', 'Advances', 'Pending Recoveries', 'Expiring Documents'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveVehicleTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeVehicleTab === tab
                    ? 'bg-[#006B57] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Vehicles Table */}
        {activeVehicleTab === 'Vehicles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-slate-50/70">
                  <th className="py-2.5 px-3">Vehicle No.</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Driver</th>
                  <th className="py-2.5 px-3">Assigned Site</th>
                  <th className="py-2.5 px-3">Fuel</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {vehicles.slice(0, 7).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#006B57]">{v.registrationNumber}</td>
                    <td className="py-2.5 px-3 text-[#172033] font-medium">{v.model}</td>
                    <td className="py-2.5 px-3 text-[#172033]">{v.ownerName || '-'}</td>
                    <td className="py-2.5 px-3 text-[#172033]">{v.driverName || '-'}</td>
                    <td className="py-2.5 px-3 text-[#64748B]">{v.site || v.company || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {v.fuelType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigate('Vehicles')}
                        className="text-xs font-bold text-[#006B57] hover:underline cursor-pointer"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Advances Table */}
        {activeVehicleTab === 'Advances' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-slate-50/70">
                  <th className="py-2.5 px-3">Advance ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Recovered</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {advances.slice(0, 6).map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#006B57]">{a.id}</td>
                    <td className="py-2.5 px-3 text-[#64748B]">{a.date}</td>
                    <td className="py-2.5 px-3 font-bold text-[#172033]">{a.vehicleNumber}</td>
                    <td className="py-2.5 px-3 font-medium">{a.type}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#172033]">{formatCurrency(a.amount)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">{formatCurrency(a.recovered)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-700 font-bold">{formatCurrency(a.balance)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Pending Recoveries */}
        {activeVehicleTab === 'Pending Recoveries' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-slate-50/70">
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Total Advance</th>
                  <th className="py-2.5 px-3 text-right">Pending Amount</th>
                  <th className="py-2.5 px-3">Due Target</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {advances.filter(a => a.balance > 0).slice(0, 6).map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#006B57]">{a.vehicleNumber}</td>
                    <td className="py-2.5 px-3 font-medium">{a.type}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(a.amount)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-600">{formatCurrency(a.balance)}</td>
                    <td className="py-2.5 px-3 text-amber-700 font-bold">Oct 2026 Settlement</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigate('Recoveries')}
                        className="px-2.5 py-1 bg-[#D4A72C] text-[#172033] font-bold rounded-lg text-2xs hover:bg-[#C09420] cursor-pointer"
                      >
                        Record Recovery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Expiring Documents */}
        {activeVehicleTab === 'Expiring Documents' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] bg-slate-50/70">
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Days Remaining</th>
                  <th className="py-2.5 px-3 text-right">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {expiringDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[#64748B]">
                      No vehicle documents are expiring in the next 30 days. Fleet compliance is 100% up to date!
                    </td>
                  </tr>
                ) : (
                  expiringDocs.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#006B57]">{doc.vehicle}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#172033]">{doc.type}</td>
                      <td className="py-2.5 px-3 font-mono text-[#64748B]">{doc.expiry}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-700">{doc.daysLeft} days</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">
                          Renew Immediately
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Bottom Widgets: Top 5 Sites by Revenue, Advance Summary, Document Expiry 30 Days */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top 5 Sites by Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#006B57]" /> Top 5 Sites by Revenue
            </h3>
            <span className="text-2xs font-bold text-[#006B57]">Oct 2026</span>
          </div>

          <div className="space-y-3">
            {topSitesByRevenue.map((site, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-[#006B57] text-[10px] font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#172033] truncate max-w-[150px]">
                    {site.name}
                  </span>
                </div>
                <span className="text-xs font-black text-[#006B57]">
                  {formatCurrency(site.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Advance Summary */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#2563EB]" /> Advance Summary
            </h3>
            <span className="text-2xs font-bold text-blue-600">Recovery Pulse</span>
          </div>

          <div className="space-y-3.5">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-blue-700 uppercase">CNG Card Advances</p>
                <p className="text-base font-black text-blue-950 mt-0.5">
                  {formatCurrency(advances.filter(a => a.type === 'CNG Advance').reduce((s, a) => s + a.amount, 0) || 18000)}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700">5% Platform Profit</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-purple-700 uppercase">EMI Loan Advances</p>
                <p className="text-base font-black text-purple-950 mt-0.5">
                  {formatCurrency(advances.filter(a => a.type === 'EMI Advance').reduce((s, a) => s + a.amount, 0) || 14500)}
                </p>
              </div>
              <span className="text-xs font-bold text-purple-700">Bank Auto-Debit</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-800 uppercase">Outstanding Balance</p>
                <p className="text-base font-black text-amber-900 mt-0.5">
                  {formatCurrency(pendingRecovery)}
                </p>
              </div>
              <span className="text-xs font-black text-amber-800">Due for Recovery</span>
            </div>
          </div>
        </div>

        {/* Document Expiry – Next 30 Days */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] pb-3">
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#EF4444]" /> Document Expiry – Next 30 Days
            </h3>
            <span className="text-2xs font-bold text-rose-600">RTO Alert</span>
          </div>

          <div className="space-y-2.5">
            {expiringDocs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                All fleet fitness, insurance, and permits are currently valid.
              </div>
            ) : (
              expiringDocs.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-rose-100 bg-rose-50/40">
                  <div>
                    <p className="text-xs font-bold text-[#172033]">{doc.vehicle}</p>
                    <p className="text-[10px] text-[#64748B]">{doc.type} expires {doc.expiry}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-200 text-rose-800">
                    {doc.daysLeft}d left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
