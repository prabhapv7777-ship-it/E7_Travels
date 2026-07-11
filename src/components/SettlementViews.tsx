/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  ChevronRight,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { Vehicle, Owner, Driver, CompanyPayment, Expense } from '../types';
import { formatDate, formatMonth, toInputDateFormat } from '../lib/dateUtils';

const getCycleDisplay = (cycle: string) => {
  if (!cycle) return '-';
  if (cycle.length === 10) {
    return formatDate(cycle);
  } else if (cycle.length === 4) {
    return `${cycle} (Full Year)`;
  } else {
    return formatMonth(cycle);
  }
};

interface SettlementViewsProps {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  payments: CompanyPayment[];
  expenses: Expense[];
  activeSubView: 'Monthly Settlement' | 'Owner Statement' | 'Driver Statement' | 'Invoice' | 'Payment Voucher';
  customLogo?: string | null;
}

export default function SettlementViews({
  vehicles,
  owners,
  drivers,
  payments,
  expenses,
  activeSubView,
  customLogo,
}: SettlementViewsProps) {
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.registrationNumber || '');
  const [selectedOwner, setSelectedOwner] = useState(owners[0]?.id || '');
  const [selectedDriver, setSelectedDriver] = useState(drivers[0]?.id || '');
  const [selectedCompany, setSelectedCompany] = useState(vehicles[0]?.company || '');
  const [invoiceTerms, setInvoiceTerms] = useState('Due in 30 days');
  const [printNotice, setPrintNotice] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    if (!printAreaRef.current) {
      window.print();
      return;
    }

    // Get the HTML content inside our printable area
    const innerHTML = printAreaRef.current.innerHTML;
    const documentTitle = `${activeSubView} - ${selectedMonth}`;

    // Compile full document with Tailwind, Inter, Space Grotesk, JetBrains Mono
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${documentTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ["Inter", "sans-serif"],
            display: ["Space Grotesk", "sans-serif"],
            mono: ["JetBrains Mono", "monospace"],
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #ffffff;
      color: #1e293b;
      margin: 0;
      padding: 1.5rem;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: ${activeSubView === 'Monthly Settlement' ? 'A4 landscape' : 'A4 portrait'};
      margin: 8mm;
    }
    @media print {
      body {
        padding: 0 !important;
        margin: 0 !important;
        background-color: #ffffff !important;
      }
      .no-print {
        display: none !important;
      }
      .overflow-x-auto {
        overflow: visible !important;
        width: 100% !important;
      }
      /* Reset massive margins/paddings on print */
      .p-12, .p-8, .p-6 {
        padding: 2mm !important;
      }
      .space-y-8 {
        margin-top: 2mm !important;
        margin-bottom: 2mm !important;
      }
      .my-4 {
        margin-top: 0 !important;
        margin-bottom: 0 !important;
      }
      .pt-16 {
        padding-top: 8mm !important;
      }
      /* Scale tables to fit page exactly */
      table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
      }
      th, td {
        font-size: ${activeSubView === 'Monthly Settlement' ? '7pt' : '8.5pt'} !important;
        padding: ${activeSubView === 'Monthly Settlement' ? '3px 2px' : '4px 6px'} !important;
        word-wrap: break-word !important;
        white-space: normal !important;
      }
      ${activeSubView === 'Monthly Settlement' ? `
      th:nth-child(1), td:nth-child(1) { width: 10% !important; }
      th:nth-child(2), td:nth-child(2) { width: 12% !important; }
      th:nth-child(3), td:nth-child(3) { width: 9% !important; }
      th:nth-child(4), td:nth-child(4) { width: 8% !important; }
      th:nth-child(5), td:nth-child(5) { width: 7% !important; }
      th:nth-child(6), td:nth-child(6) { width: 7% !important; }
      th:nth-child(7), td:nth-child(7) { width: 8% !important; }
      th:nth-child(8), td:nth-child(8) { width: 10% !important; }
      th:nth-child(9), td:nth-child(9) { width: 7% !important; }
      th:nth-child(10), td:nth-child(10) { width: 10% !important; }
      th:nth-child(11), td:nth-child(11) { width: 12% !important; }
      ` : ''}
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }
    }
  </style>
</head>
<body class="p-6 bg-white text-slate-800 print:p-0 print:m-0">
  <div class="${activeSubView === 'Monthly Settlement' ? 'w-full max-w-none' : 'max-w-4xl'} mx-auto border border-slate-100 p-6 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0">
    ${innerHTML}
  </div>
  
  <div class="max-w-4xl mx-auto mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center no-print shadow-xs">
    <div>
      <h4 class="text-sm font-bold text-slate-800">Print Preview Mode</h4>
      <p class="text-xs text-slate-500">Document generated from your live fleet dashboard.</p>
    </div>
    <div class="flex gap-2">
      <button onclick="window.print()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer">
        Print Now (Ctrl+P)
      </button>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 600);
    };
  </script>
</body>
</html>`;

    // Try opening a new tab
    let printWindow: Window | null = null;
    try {
      printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(fullHtml);
        printWindow.document.close();
      } else {
        throw new Error('Popup blocked');
      }
    } catch (err) {
      console.warn('Could not open print in a new tab due to sandboxing or popup blocker, falling back to direct download.', err);
      // Fallback: Trigger a direct download of the print HTML file!
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeSubView.replace(/\s+/g, '_')}_${selectedMonth}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show an elegant visual alert/notification explaining the fallback
      setPrintNotice(true);
      setTimeout(() => setPrintNotice(false), 12000);
    }
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

  // ================= 1. MONTHLY SETTLEMENT CALCULATIONS =================
  const getMonthlySettlementData = () => {
    // Computes aggregate summaries of all vehicles for selectedMonth (can be YYYY-MM-DD, YYYY-MM, or YYYY)
    const isYearSelected = selectedMonth.length === 4;
    const isDateSelected = selectedMonth.length === 10;
    return vehicles.map((v) => {
      // Gross Company Payment
      const billing = payments
        .filter((p) => {
          if (p.vehicleNumber !== v.registrationNumber) return false;
          if (isDateSelected) {
            return toInputDateFormat(p.paymentDate) === selectedMonth;
          } else if (isYearSelected) {
            return p.month.startsWith(selectedMonth);
          } else {
            return p.month === selectedMonth;
          }
        })
        .reduce((sum, p) => sum + p.amountReceived, 0);

      // Category deductions
      const vehicleExpenses = expenses.filter((e) => {
        if (e.vehicleNumber !== v.registrationNumber) return false;
        if (isDateSelected) {
          return toInputDateFormat(e.date) === selectedMonth;
        } else if (isYearSelected) {
          return e.month.startsWith(selectedMonth);
        } else {
          return e.month === selectedMonth;
        }
      });

      const cng = vehicleExpenses.filter((e) => e.expenseType === 'CNG').reduce((sum, e) => sum + e.amount, 0);
      const fuel = vehicleExpenses.filter((e) => e.expenseType === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
      const emi = vehicleExpenses.filter((e) => e.expenseType === 'EMI').reduce((sum, e) => sum + e.amount, 0);
      const fastag = vehicleExpenses.filter((e) => e.expenseType === 'FASTag').reduce((sum, e) => sum + e.amount, 0);
      const advance = vehicleExpenses.filter((e) => e.expenseType === 'Advance' || e.expenseType === 'Driver Advance').reduce((sum, e) => sum + e.amount, 0);
      const repair = vehicleExpenses.filter((e) => e.expenseType === 'Repair').reduce((sum, e) => sum + e.amount, 0);
      const service = vehicleExpenses.filter((e) => e.expenseType === 'Service').reduce((sum, e) => sum + e.amount, 0);
      const penalty = vehicleExpenses.filter((e) => e.expenseType === 'Penalty').reduce((sum, e) => sum + e.amount, 0);
      
      const other = vehicleExpenses
        .filter((e) => !['CNG', 'Fuel', 'EMI', 'FASTag', 'Advance', 'Driver Advance', 'Repair', 'Service', 'Penalty'].includes(e.expenseType))
        .reduce((sum, e) => sum + e.amount, 0);

      const totalDeductions = cng + fuel + emi + fastag + advance + repair + service + penalty + other;
      const netPayable = Math.max(0, billing - totalDeductions);

      return {
        vehicle: v.registrationNumber,
        driver: v.driverName,
        owner: v.ownerName,
        billing,
        cng,
        fuel,
        emi,
        fastag,
        advance,
        repair,
        service,
        penalty,
        other,
        totalDeductions,
        netPayable,
      };
    });
  };

  // ================= 2. OWNER STATEMENT CALCULATIONS =================
  const getOwnerStatementData = () => {
    const owner = owners.find((o) => o.id === selectedOwner);
    if (!owner) return null;

    const ownerVehicles = vehicles.filter((v) => v.ownerId === selectedOwner);
    const vehicleRegs = ownerVehicles.map((v) => v.registrationNumber);

    const isYearSelected = selectedMonth.length === 4;
    const isDateSelected = selectedMonth.length === 10;

    const ownerBilling = payments
      .filter((p) => {
        if (!vehicleRegs.includes(p.vehicleNumber)) return false;
        if (isDateSelected) {
          return toInputDateFormat(p.paymentDate) === selectedMonth;
        } else if (isYearSelected) {
          return p.month.startsWith(selectedMonth);
        } else {
          return p.month === selectedMonth;
        }
      })
      .reduce((sum, p) => sum + p.amountReceived, 0);

    const ownerExpenses = expenses.filter((e) => {
      if (!vehicleRegs.includes(e.vehicleNumber)) return false;
      if (isDateSelected) {
        return toInputDateFormat(e.date) === selectedMonth;
      } else if (isYearSelected) {
        return e.month.startsWith(selectedMonth);
      } else {
        return e.month === selectedMonth;
      }
    });

    const cng = ownerExpenses.filter((e) => e.expenseType === 'CNG').reduce((sum, e) => sum + e.amount, 0);
    const emi = ownerExpenses.filter((e) => e.expenseType === 'EMI').reduce((sum, e) => sum + e.amount, 0);
    const fastag = ownerExpenses.filter((e) => e.expenseType === 'FASTag').reduce((sum, e) => sum + e.amount, 0);
    const advance = ownerExpenses.filter((e) => e.expenseType === 'Advance' || e.expenseType === 'Driver Advance').reduce((sum, e) => sum + e.amount, 0);
    const repair = ownerExpenses.filter((e) => e.expenseType === 'Repair').reduce((sum, e) => sum + e.amount, 0);
    const service = ownerExpenses.filter((e) => e.expenseType === 'Service').reduce((sum, e) => sum + e.amount, 0);
    const penalty = ownerExpenses.filter((e) => e.expenseType === 'Penalty').reduce((sum, e) => sum + e.amount, 0);

    const totalDeductions = cng + emi + fastag + advance + repair + service + penalty;
    const netPayable = Math.max(0, ownerBilling - totalDeductions);

    return {
      owner,
      vehicles: ownerVehicles,
      billing: ownerBilling,
      deductions: { cng, emi, fastag, advance, repair, service, penalty },
      totalDeductions,
      netPayable,
    };
  };

  // ================= 3. DRIVER STATEMENT CALCULATIONS =================
  const getDriverStatementData = () => {
    const driver = drivers.find((d) => d.id === selectedDriver);
    if (!driver) return null;

    const driverVehicle = vehicles.find((v) => v.driverId === selectedDriver);
    const regNum = driverVehicle ? driverVehicle.registrationNumber : '';

    const isYearSelected = selectedMonth.length === 4;
    const isDateSelected = selectedMonth.length === 10;

    const driverExpenses = expenses.filter((e) => {
      const matchVeh = regNum ? e.vehicleNumber === regNum : true;
      if (!matchVeh) return false;
      if (!selectedMonth) return true;
      if (isDateSelected) {
        return toInputDateFormat(e.date) === selectedMonth;
      } else if (isYearSelected) {
        return e.month.startsWith(selectedMonth);
      } else {
        return e.month === selectedMonth;
      }
    });

    const baseSalary = driverExpenses.filter((e) => e.expenseType === 'Driver Salary').reduce((sum, e) => sum + e.amount, 0) || driver.salary;
    const incentive = driverExpenses.filter((e) => e.expenseType === 'Advance' && e.remarks.toLowerCase().includes('incentive')).reduce((sum, e) => sum + e.amount, 0) || 3000;
    const advance = driverExpenses.filter((e) => e.expenseType === 'Driver Advance').reduce((sum, e) => sum + e.amount, 0);
    const penalty = driverExpenses.filter((e) => e.expenseType === 'Penalty').reduce((sum, e) => sum + e.amount, 0);

    const netSalary = baseSalary + incentive - advance - penalty;

    return {
      driver,
      vehicle: driverVehicle,
      baseSalary,
      incentive,
      advance,
      penalty,
      netSalary,
    };
  };

  // ================= 4. INVOICE GENERATION DATA =================
  const getInvoiceData = () => {
    const matchingVehicles = vehicles.filter((v) => v.company === selectedCompany);
    const vehicleRegs = matchingVehicles.map((v) => v.registrationNumber);

    const isYearSelected = selectedMonth.length === 4;
    const isDateSelected = selectedMonth.length === 10;

    const matchingPayments = payments.filter((p) => {
      if (!vehicleRegs.includes(p.vehicleNumber)) return false;
      if (isDateSelected) {
        return toInputDateFormat(p.paymentDate) === selectedMonth;
      } else if (isYearSelected) {
        return p.month.startsWith(selectedMonth);
      } else {
        return p.month === selectedMonth;
      }
    });

    const subtotal = matchingPayments.reduce((sum, p) => sum + p.amountReceived, 0);
    const tax = subtotal * 0.05; // 5% Service Tax / GST
    const total = subtotal + tax;

    return {
      companyName: selectedCompany,
      vehiclesCount: matchingVehicles.length,
      items: matchingPayments,
      subtotal,
      tax,
      total,
      invoiceNum: `E7-INV-${selectedMonth.replace(/-/g, '')}-${selectedCompany.substring(0, 3).toUpperCase()}`,
    };
  };

  const settlementList = getMonthlySettlementData();
  const ownerStmt = getOwnerStatementData();
  const driverStmt = getDriverStatementData();
  const invoice = getInvoiceData();

  // Aggregate stats
  const totalBilling = settlementList.reduce((sum, v) => sum + v.billing, 0);
  const totalDeductions = settlementList.reduce((sum, v) => sum + v.totalDeductions, 0);
  const totalNetPayable = settlementList.reduce((sum, v) => sum + v.netPayable, 0);

  return (
    <div className="space-y-6">
      {/* Dynamic page orientation style for direct browser printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${activeSubView === 'Monthly Settlement' ? 'A4 landscape' : 'A4 portrait'};
            margin: 8mm;
          }
          /* Hide all elements on the page except the printable section */
          body > * {
            display: none !important;
          }
          #root, #root > * {
            display: block !important;
          }
          /* Hide sidebar, header, tabs */
          aside, header, .no-print, button, select, label {
            display: none !important;
          }
          /* Make container expand fully and remove custom styling */
          .print-area-wrapper {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          /* Reset massive margins/paddings on print */
          .p-12, .p-8, .p-6 {
            padding: 2mm !important;
          }
          .space-y-8 {
            margin-top: 2mm !important;
            margin-bottom: 2mm !important;
          }
          .my-4 {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          .pt-16 {
            padding-top: 8mm !important;
          }
          /* Force small fonts and clean padding on tables */
          table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          th, td {
            font-size: ${activeSubView === 'Monthly Settlement' ? '7pt' : '8.5pt'} !important;
            padding: ${activeSubView === 'Monthly Settlement' ? '3px 2px' : '4px 6px'} !important;
            word-wrap: break-word !important;
            white-space: normal !important;
          }
          ${activeSubView === 'Monthly Settlement' ? `
          th:nth-child(1), td:nth-child(1) { width: 10% !important; }
          th:nth-child(2), td:nth-child(2) { width: 12% !important; }
          th:nth-child(3), td:nth-child(3) { width: 9% !important; }
          th:nth-child(4), td:nth-child(4) { width: 8% !important; }
          th:nth-child(5), td:nth-child(5) { width: 7% !important; }
          th:nth-child(6), td:nth-child(6) { width: 7% !important; }
          th:nth-child(7), td:nth-child(7) { width: 8% !important; }
          th:nth-child(8), td:nth-child(8) { width: 10% !important; }
          th:nth-child(9), td:nth-child(9) { width: 7% !important; }
          th:nth-child(10), td:nth-child(10) { width: 10% !important; }
          th:nth-child(11), td:nth-child(11) { width: 12% !important; }
          ` : ''}
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      `}} />
      {printNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-start gap-3 shadow-xs print:hidden animate-in fade-in duration-300">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
            <Printer className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Browser Sandbox Restricted Print</h4>
            <p className="text-xs mt-1 text-amber-800 leading-relaxed font-medium">
              Because browsers restrict direct printing from inside iframe previews, we have generated and downloaded a **print-optimized offline HTML document** for you.
            </p>
            <p className="text-3xs mt-1.5 text-amber-600 font-bold">
              💡 To print, simply click the downloaded file in your browser. It will open in a new tab and automatically open your system print dialog!
            </p>
          </div>
          <button
            onClick={() => setPrintNotice(false)}
            className="text-2xs font-extrabold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Filters Area */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reconciliation Cycle</label>
          <select
            id="settle-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold"
          >
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

        {activeSubView === 'Owner Statement' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Owner Partner</label>
            <select
              id="settle-owner-select"
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold"
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeSubView === 'Driver Statement' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Driver Partner</label>
            <select
              id="settle-driver-select"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold"
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeSubView === 'Invoice' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Corporate Client</label>
            <select
              id="settle-company-select"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-bold"
            >
              {distinctCompanies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-end justify-end md:col-span-1">
          <button
            id="print-trigger-btn"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print Document
          </button>
        </div>
      </div>

      {/* Main printable content block */}
      <div ref={printAreaRef} className="print-area-wrapper bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        
        {/* ================= 1. MONTHLY SETTLEMENT REGISTER ================= */}
        {activeSubView === 'Monthly Settlement' && (
          <div>
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                {customLogo ? (
                  <img src={customLogo} alt="Logo" className="w-10 h-10 object-contain shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-800 font-black text-sm shrink-0">E7</div>
                )}
                <div>
                  <h2 className="text-md font-bold text-slate-800">Monthly Settlement Summary</h2>
                  <p className="text-xs text-slate-500">Cycle: {getCycleDisplay(selectedMonth)} | Consolidated fleet payouts for E7 Travels Chennai</p>
                </div>
              </div>

              {/* Aggregations */}
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Gross Billing</span>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(totalBilling)}</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Consolidated Deduct</span>
                  <p className="text-sm font-bold text-rose-500">{formatCurrency(totalDeductions)}</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <span className="text-3xs font-semibold text-slate-500 uppercase">Total Net Payable</span>
                  <p className="text-sm font-extrabold text-blue-700">{formatCurrency(totalNetPayable)}</p>
                </div>
              </div>
            </div>

            {/* Reconciliation table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-3xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Owner Name</th>
                    <th className="py-3 px-4 text-right">Billing Amount</th>
                    <th className="py-3 px-4 text-right">CNG / Fuel</th>
                    <th className="py-3 px-4 text-right">EMI Cost</th>
                    <th className="py-3 px-4 text-right">FASTag</th>
                    <th className="py-3 px-4 text-right">Advances</th>
                    <th className="py-3 px-4 text-right">Service / Repairs</th>
                    <th className="py-3 px-4 text-right">Penalties</th>
                    <th className="py-3 px-4 text-right font-bold">Total Deduct</th>
                    <th className="py-3 px-4 text-right font-black">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-2xs font-semibold text-slate-700">
                  {settlementList.map((row) => (
                    <tr key={row.vehicle} className="hover:bg-slate-50/20">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{row.vehicle}</td>
                      <td className="py-2.5 px-4 text-slate-600 truncate max-w-[110px]">{row.owner}</td>
                      <td className="py-2.5 px-4 text-right text-emerald-600">{formatCurrency(row.billing)}</td>
                      <td className="py-2.5 px-4 text-right text-rose-500">{formatCurrency(row.cng + row.fuel)}</td>
                      <td className="py-2.5 px-4 text-right text-rose-500">{formatCurrency(row.emi)}</td>
                      <td className="py-2.5 px-4 text-right text-rose-500">{formatCurrency(row.fastag)}</td>
                      <td className="py-2.5 px-4 text-right text-rose-500">{formatCurrency(row.advance)}</td>
                      <td className="py-2.5 px-4 text-right text-rose-500">{formatCurrency(row.repair + row.service)}</td>
                      <td className="py-2.5 px-4 text-right text-rose-500">{formatCurrency(row.penalty)}</td>
                      <td className="py-2.5 px-4 text-right text-rose-600 font-bold">{formatCurrency(row.totalDeductions)}</td>
                      <td className="py-2.5 px-4 text-right text-blue-700 font-extrabold">{formatCurrency(row.netPayable)}</td>
                    </tr>
                  ))}

                  {/* Consolidated Summary */}
                  <tr className="bg-slate-100 font-bold text-xs text-slate-800">
                    <td colSpan={2} className="py-3.5 px-4">CONSOLIDATED RECONCILIATION SUMMARY</td>
                    <td className="py-3.5 px-4 text-right text-emerald-700">{formatCurrency(totalBilling)}</td>
                    <td colSpan={6} className="py-3.5 px-4 text-right text-rose-600">Consolidated Deductions: {formatCurrency(totalDeductions)}</td>
                    <td colSpan={2} className="py-3.5 px-4 text-right text-blue-800 font-black">{formatCurrency(totalNetPayable)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 2. OWNER A4 PRINT STATEMENT ================= */}
        {activeSubView === 'Owner Statement' && ownerStmt && (
          <div className="p-12 space-y-8 max-w-4xl mx-auto border border-slate-100 my-4 shadow-sm print:shadow-none print:border-none print:p-0">
            {/* Logo / Title Area */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-6">
              <div className="flex items-center gap-4">
                {customLogo ? (
                  <img src={customLogo} alt="Logo" className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center text-blue-800 font-black text-xl shrink-0">E7</div>
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-blue-800 uppercase">E7 Travels Chennai</h1>
                  <p className="text-xs text-slate-500 font-medium">Corporate Transport Logistics Operators</p>
                  <p className="text-3xs text-slate-400 font-mono">Siruseri SEZ, Navalur, Chennai - 603103</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Owner Payout Voucher</span>
                <span className="text-sm font-extrabold text-slate-800 block">Cycle: {getCycleDisplay(selectedMonth)}</span>
              </div>
            </div>

            {/* Owner Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-3xs font-semibold text-slate-400 uppercase">Settlement Payee:</span>
                <h3 className="text-md font-extrabold text-slate-800">{ownerStmt.owner.name}</h3>
                <p className="text-xs text-slate-600">ID: {ownerStmt.owner.id} | Phone: {ownerStmt.owner.phone}</p>
                <p className="text-3xs text-slate-500 max-w-[300px]">{ownerStmt.owner.address}</p>
              </div>
              <div className="md:text-right space-y-1">
                <span className="text-3xs font-semibold text-slate-400 uppercase">Bank Transfer Details:</span>
                <p className="text-xs font-bold text-slate-700">{ownerStmt.owner.bankName || 'N/A'}</p>
                <p className="text-xs text-slate-600 font-mono">A/C: {ownerStmt.owner.accountNumber || 'N/A'}</p>
                <p className="text-xs text-slate-600 font-mono">IFSC: {ownerStmt.owner.ifsc || 'N/A'}</p>
                {ownerStmt.owner.upiId && <p className="text-xs text-slate-500 font-mono">UPI ID: {ownerStmt.owner.upiId}</p>}
              </div>
            </div>

            {/* Financial Ledger Reconcile */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5">Statement Reconciliations</h4>
              <div className="space-y-2 text-xs font-medium text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Contract Fleet Earnings:</span>
                  <span className="text-emerald-700 font-bold">+{formatCurrency(ownerStmt.billing)}</span>
                </div>
                <div className="border-t border-slate-100 my-2 pt-2 space-y-1.5 text-slate-600 pl-4">
                  <div className="flex justify-between">
                    <span>CNG Fuel Deductions:</span>
                    <span>-{formatCurrency(ownerStmt.deductions.cng)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto Loan EMI Deductions:</span>
                    <span>-{formatCurrency(ownerStmt.deductions.emi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FASTag toll transactions:</span>
                    <span>-{formatCurrency(ownerStmt.deductions.fastag)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trip/Fuel advances given:</span>
                    <span>-{formatCurrency(ownerStmt.deductions.advance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service & routine periodic checks:</span>
                    <span>-{formatCurrency(ownerStmt.deductions.service + ownerStmt.deductions.repair)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Penalties/Fine allocations:</span>
                    <span>-{formatCurrency(ownerStmt.deductions.penalty)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-rose-500 font-semibold pl-4">
                  <span>Total Statement Deductions:</span>
                  <span>-{formatCurrency(ownerStmt.totalDeductions)}</span>
                </div>

                <div className="border-t-2 border-slate-300 pt-3 flex justify-between text-sm font-black text-slate-900 bg-slate-50 p-3 rounded">
                  <span>NET PAYABLE POSITION:</span>
                  <span className="text-blue-800">{formatCurrency(ownerStmt.netPayable)}</span>
                </div>
              </div>
            </div>

            {/* Footer / Signature Area */}
            <div className="grid grid-cols-2 pt-16 gap-6 text-center text-xs font-semibold text-slate-500">
              <div className="space-y-10">
                <div className="border-b border-slate-300 w-44 mx-auto"></div>
                <p>Owner's Signature / Acceptance</p>
              </div>
              <div className="space-y-10">
                <div className="border-b border-slate-300 w-44 mx-auto"></div>
                <p>E7 Travels Authorized Representative</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. DRIVER A4 PRINT STATEMENT ================= */}
        {activeSubView === 'Driver Statement' && driverStmt && (
          <div className="p-12 space-y-8 max-w-4xl mx-auto border border-slate-100 my-4 shadow-sm print:shadow-none print:border-none print:p-0">
            {/* Logo / Title */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-6">
              <div className="flex items-center gap-4">
                {customLogo ? (
                  <img src={customLogo} alt="Logo" className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center text-blue-800 font-black text-xl shrink-0">E7</div>
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-blue-800 uppercase">E7 Travels Chennai</h1>
                  <p className="text-xs text-slate-500 font-medium">Driver Payroll Slip</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Salary Period</span>
                <span className="text-sm font-extrabold text-slate-800 block">{getCycleDisplay(selectedMonth)}</span>
              </div>
            </div>

            {/* Driver Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-3xs font-semibold text-slate-400 uppercase">Driver Associate:</span>
                <h3 className="text-md font-bold text-slate-800">{driverStmt.driver.name}</h3>
                <p className="text-xs text-slate-600">ID: {driverStmt.driver.id} | Phone: {driverStmt.driver.phone}</p>
                <p className="text-xs text-slate-500 font-mono">Licence: {driverStmt.driver.licenceNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-3xs font-semibold text-slate-400 uppercase">Operational Assignment:</span>
                <p className="text-xs font-bold text-slate-700">Vehicle: {driverStmt.vehicle ? driverStmt.vehicle.registrationNumber : 'Spare'}</p>
                <p className="text-xs text-slate-600">Model: {driverStmt.vehicle ? `${driverStmt.vehicle.manufacturer} ${driverStmt.vehicle.model}` : '-'}</p>
              </div>
            </div>

            {/* Payroll Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5">Salary Component Reconcile</h4>
              <div className="space-y-2 text-xs font-medium text-slate-700">
                <div className="flex justify-between">
                  <span>Base Fixed Salary:</span>
                  <span>{formatCurrency(driverStmt.baseSalary)}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Trip / Route Incentives & Allowances:</span>
                  <span>+{formatCurrency(driverStmt.incentive)}</span>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>Salary Advance Deductions:</span>
                  <span>-{formatCurrency(driverStmt.advance)}</span>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>Traffic Penalties / Challans Charged:</span>
                  <span>-{formatCurrency(driverStmt.penalty)}</span>
                </div>

                <div className="border-t-2 border-slate-300 pt-3 flex justify-between text-sm font-black text-slate-900 bg-slate-50 p-3 rounded">
                  <span>NET DISBURSABLE SALARY:</span>
                  <span className="text-emerald-700">{formatCurrency(driverStmt.netSalary)}</span>
                </div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="grid grid-cols-2 pt-16 gap-6 text-center text-xs font-semibold text-slate-500">
              <div className="space-y-10">
                <div className="border-b border-slate-300 w-44 mx-auto"></div>
                <p>Driver Partner Signature</p>
              </div>
              <div className="space-y-10">
                <div className="border-b border-slate-300 w-44 mx-auto"></div>
                <p>Payroll Disbursing Manager</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. CORPORATE INVOICE GENERATOR ================= */}
        {activeSubView === 'Invoice' && (
          <div className="p-12 space-y-8 max-w-4xl mx-auto border border-slate-100 my-4 shadow-sm print:shadow-none print:border-none print:p-0">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-6">
              <div className="flex items-center gap-4">
                {customLogo ? (
                  <img src={customLogo} alt="Logo" className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center text-blue-800 font-black text-xl shrink-0">E7</div>
                )}
                <div>
                  <h1 className="text-2xl font-black text-blue-800 uppercase">E7 Travels</h1>
                  <p className="text-xs text-slate-500 font-semibold">Corporate Employee Transportation Services</p>
                  <p className="text-3xs text-slate-400 font-mono">ELCOT SEZ, Sholinganallur, OMR, Chennai</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-slate-800 block">Commercial Billing Invoice</span>
                <span className="text-xs text-slate-500 block">Invoice #: {invoice.invoiceNum}</span>
                <span className="text-xs text-slate-500 block">Billing Month: {getCycleDisplay(selectedMonth)}</span>
              </div>
            </div>

            {/* Billing Addresses */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-3xs font-semibold text-slate-400 uppercase block mb-1">Billed To:</span>
                <h4 className="font-extrabold text-slate-800">{invoice.companyName}</h4>
                <p className="text-slate-600 mt-1 font-medium">Chennai Corporate Hub, Special Economic Zone</p>
              </div>
              <div className="text-right">
                <span className="text-3xs font-semibold text-slate-400 uppercase block mb-1">Invoice Logistics:</span>
                <p className="text-slate-700 font-medium">Payment Terms: 30 Working Days</p>
                <p className="text-slate-700 font-medium">Taxes: 5% service tax applied</p>
              </div>
            </div>

            {/* Bill Line Items */}
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50 font-bold">
                  <th className="py-2.5 px-4">Line Item / Fleet Deployment</th>
                  <th className="py-2.5 px-4">Payment Date</th>
                  <th className="py-2.5 px-4 text-right">Standard Billing Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/20">
                    <td className="py-3 px-4">
                      Vehicle Transit Support - Plate: <span className="font-mono font-bold text-slate-800">{it.vehicleNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(it.paymentDate)}</td>
                    <td className="py-3 px-4 text-right text-slate-800">{formatCurrency(it.amountReceived)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Subtotals & Totals */}
            <div className="border-t border-slate-200 pt-4 flex flex-col items-end gap-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between w-64">
                <span>Fleet Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-500">
                <span>GST Service Tax (5%):</span>
                <span>+{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between w-64 border-t-2 border-slate-300 pt-2 text-sm font-black text-slate-900 bg-blue-50/50 p-2 rounded">
                <span>CONSOLIDATED TOTAL DUE:</span>
                <span className="text-blue-800">{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            {/* Final Signatures */}
            <div className="grid grid-cols-2 pt-16 gap-6 text-center text-xs font-semibold text-slate-500">
              <div className="space-y-10">
                <div className="border-b border-slate-300 w-44 mx-auto"></div>
                <p>Client Acceptance / Corporate Stamp</p>
              </div>
              <div className="space-y-10">
                <div className="border-b border-slate-300 w-44 mx-auto"></div>
                <p>Accounts Manager - E7 Travels</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. PAYMENT VOUCHER GENERATOR ================= */}
        {activeSubView === 'Payment Voucher' && (
          <div className="p-12 space-y-8 max-w-4xl mx-auto border border-slate-100 my-4 shadow-sm print:shadow-none print:border-none print:p-0">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-6">
              <div className="flex items-center gap-4">
                {customLogo ? (
                  <img src={customLogo} alt="Logo" className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center text-blue-800 font-black text-xl shrink-0">E7</div>
                )}
                <div>
                  <h1 className="text-2xl font-black text-blue-800 uppercase">E7 Travels</h1>
                  <p className="text-xs text-slate-500 font-semibold">Consolidated Cash/Bank Voucher</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Voucher #: E7-VOU-0726-02</span>
                <span className="text-xs text-slate-500 block">Date: {formatDate('2026-07-08')}</span>
              </div>
            </div>

            {/* Voucher Body details */}
            <div className="space-y-6 text-xs text-slate-700 font-semibold">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-lg border border-slate-150">
                <p><span className="text-slate-400 block mb-0.5">Debit Account Head:</span> Fleet Payout Settlement</p>
                <p><span className="text-slate-400 block mb-0.5">Credit Mode:</span> Bank NEFT / IMPS Transfer</p>
                <p><span className="text-slate-400 block mb-0.5">Payee Partner:</span> {owners.find((o) => o.id === selectedOwner)?.name || 'Direct Associate'}</p>
                <p><span className="text-slate-400 block mb-0.5">Reconciliation Cycle:</span> {getCycleDisplay(selectedMonth)}</p>
              </div>

              <div>
                <span className="text-3xs font-semibold text-slate-400 uppercase">Payment Description Narrative</span>
                <p className="text-xs text-slate-800 mt-1 font-medium bg-white p-3 border border-slate-200 rounded leading-relaxed">
                  Consolidated payment settlement processed for operational vehicle support in {getCycleDisplay(selectedMonth)}, net of all fueling, tolls, EMI loan allocations, advance withdrawals, and maintenance expenses logged against the payee's fleet deployment.
                </p>
              </div>

              <div className="flex justify-between items-center border-2 border-slate-200 bg-slate-50 p-4 rounded text-sm font-black text-slate-900">
                <span>NET PAYMENT DISBURSED AMOUNT:</span>
                <span className="text-blue-800 text-md">{formatCurrency(ownerStmt ? ownerStmt.netPayable : 0)}</span>
              </div>
            </div>

            {/* Final Signatures */}
            <div className="grid grid-cols-2 pt-16 gap-6 text-center text-xs font-semibold text-slate-500">
              <div className="space-y-10">
                <div className="border-b border-slate-300 w-44 mx-auto"></div>
                <p>Receiver Signature / Bank Stamp</p>
              </div>
              <div className="space-y-10">
                <div className="border-b border-slate-300 w-44 mx-auto"></div>
                <p>Accounts Disbursing Manager</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
