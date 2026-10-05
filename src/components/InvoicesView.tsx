/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Download,
  Printer,
  X,
  CheckCircle,
  Building2,
  DollarSign,
} from 'lucide-react';
import { InvoiceRecord, Vehicle, Company } from '../types';

interface InvoicesViewProps {
  invoices: InvoiceRecord[];
  vehicles: Vehicle[];
  companies: Company[];
  onUpdateInvoices: (invoices: InvoiceRecord[]) => void;
}

export default function InvoicesView({
  invoices,
  vehicles,
  companies,
  onUpdateInvoices,
}: InvoicesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<InvoiceRecord | null>(null);

  const [formData, setFormData] = useState<Partial<InvoiceRecord>>({
    invoiceNumber: `E7/2026-27/${100 + invoices.length + 1}`,
    date: new Date().toISOString().substring(0, 10),
    company: companies[0]?.name || 'WALMART',
    vehicleNumber: vehicles[0]?.registrationNumber || '',
    billingPeriod: 'October 2026',
    amount: 60000,
    deductions: 3000,
    netAmount: 57000,
    status: 'Sent',
    paymentTerms: 'Net 30 Days',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.company.toLowerCase().includes(q) ||
        i.vehicleNumber.toLowerCase().includes(q) ||
        i.billingPeriod.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'All' || i.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    setFormData({
      invoiceNumber: `E7/2026-27/${100 + invoices.length + 1}`,
      date: new Date().toISOString().substring(0, 10),
      company: companies[0]?.name || 'WALMART',
      vehicleNumber: vehicles[0]?.registrationNumber || '',
      billingPeriod: 'October 2026',
      amount: 60000,
      deductions: 3000,
      netAmount: 57000,
      status: 'Sent',
      paymentTerms: 'Net 30 Days',
    });
    setIsModalOpen(true);
  };

  const handleAmountChange = (amt: number, ded: number) => {
    setFormData({
      ...formData,
      amount: amt,
      deductions: ded,
      netAmount: Math.max(0, amt - ded),
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber) return;

    const newInv: InvoiceRecord = {
      id: `INV-${new Date().getTime()}`,
      invoiceNumber: formData.invoiceNumber,
      date: formData.date || new Date().toISOString().substring(0, 10),
      company: formData.company || 'Direct Client',
      vehicleNumber: formData.vehicleNumber || vehicles[0]?.registrationNumber || 'Fleet',
      billingPeriod: formData.billingPeriod || 'October 2026',
      amount: Number(formData.amount) || 0,
      deductions: Number(formData.deductions) || 0,
      netAmount: Number(formData.netAmount) || 0,
      status: (formData.status as any) || 'Sent',
      paymentTerms: formData.paymentTerms || 'Net 30 Days',
    };

    onUpdateInvoices([newInv, ...invoices]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Invoices</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            GST compliant client tax invoices, monthly duty billings, and payment receivables
          </p>
        </div>

        <button
          id="create-invoice-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Invoice</span>
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
            placeholder="Search invoice number, client, vehicle, period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] font-medium cursor-pointer"
        >
          <option value="All">All Invoices</option>
          <option value="Paid">Paid</option>
          <option value="Sent">Sent / Pending</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Table (Page 13 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5 font-bold">Invoice No.</th>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Company</th>
                <th className="py-3 px-3.5">Vehicle</th>
                <th className="py-3 px-3.5">Billing Period</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5 text-right">Deductions</th>
                <th className="py-3 px-3.5 text-right">Net Amount</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-[#64748B]">
                    No client tax invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-[#006B57]">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3.5 font-mono text-[#64748B]">{inv.date}</td>
                    <td className="py-3 px-3.5 font-bold text-[#172033]">{inv.company}</td>
                    <td className="py-3 px-3.5 font-bold text-[#006B57]">{inv.vehicleNumber}</td>
                    <td className="py-3 px-3.5 text-[#172033]">{inv.billingPeriod}</td>
                    <td className="py-3 px-3.5 text-right font-medium text-[#172033]">{formatCurrency(inv.amount)}</td>
                    <td className="py-3 px-3.5 text-right text-rose-600 font-semibold">{formatCurrency(inv.deductions)}</td>
                    <td className="py-3 px-3.5 text-right font-black text-[#006B57]">{formatCurrency(inv.netAmount)}</td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Sent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#006B57] hover:bg-slate-100"
                          title="View / Print Tax Invoice"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => alert(`Invoice ${inv.invoiceNumber} PDF download initiated.`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#006B57] hover:bg-slate-100"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-base font-bold text-[#172033]">Create Corporate Client Invoice</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Client Company *
                  </label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  >
                    {companies.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Vehicle Number
                  </label>
                  <select
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.registrationNumber}>
                        {v.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Gross Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(Number(e.target.value), Number(formData.deductions || 0))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    TDS / Deductions
                  </label>
                  <input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => handleAmountChange(Number(formData.amount || 0), Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Net Payable (₹)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.netAmount}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-black text-[#006B57] bg-slate-50"
                  />
                </div>
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
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Preview Modal */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-6">
              <h3 className="text-sm font-black text-[#006B57] uppercase tracking-wider">
                Tax Invoice Preview: {selectedInvoiceForPrint.invoiceNumber}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#D4A72C] text-[#172033] font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print A4
                </button>
                <button
                  onClick={() => setSelectedInvoiceForPrint(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border border-slate-300 p-6 rounded-xl space-y-6 text-xs text-[#172033] bg-white">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-xl font-black text-[#006B57]">E7 TRAVELS</h1>
                  <p className="text-[10px] text-[#64748B] uppercase tracking-widest font-bold">Fleet & Transport Management</p>
                  <p className="text-[11px] text-slate-600 mt-1">Chennai Corporate Hub, Tamil Nadu</p>
                  <p className="text-[11px] font-mono text-slate-600">GSTIN: 33AAACE7000F1Z2</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-[#006B57]">TAX INVOICE</p>
                  <p className="font-mono font-bold mt-1">{selectedInvoiceForPrint.invoiceNumber}</p>
                  <p className="text-[#64748B]">{selectedInvoiceForPrint.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Billed To:</span>
                  <p className="font-bold text-sm mt-0.5">{selectedInvoiceForPrint.company}</p>
                  <p className="text-slate-600">IT Park Campus / Industrial Zone</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Duty Details:</span>
                  <p className="font-bold mt-0.5">Vehicle: {selectedInvoiceForPrint.vehicleNumber}</p>
                  <p className="text-slate-600">Period: {selectedInvoiceForPrint.billingPeriod}</p>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="p-2">Description of Transport Services</th>
                      <th className="p-2 text-right">Gross Amount</th>
                      <th className="p-2 text-right">TDS / Deductions</th>
                      <th className="p-2 text-right">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-medium">Monthly Employee Commute Cab Duty - {selectedInvoiceForPrint.vehicleNumber}</td>
                      <td className="p-2 text-right">{formatCurrency(selectedInvoiceForPrint.amount)}</td>
                      <td className="p-2 text-right text-rose-600">{formatCurrency(selectedInvoiceForPrint.deductions)}</td>
                      <td className="p-2 text-right font-black text-[#006B57]">{formatCurrency(selectedInvoiceForPrint.netAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-[10px] text-slate-500">Bank: HDFC Bank • A/C: 50200012345678 • IFSC: HDFC0000123</p>
                </div>
                <div className="text-right font-bold text-sm">
                  <span>Total Amount Due: </span>
                  <span className="text-base font-black text-[#006B57]">{formatCurrency(selectedInvoiceForPrint.netAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
