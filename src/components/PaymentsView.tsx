/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';
import { PaymentRecord, Company, InvoiceRecord } from '../types';

interface PaymentsViewProps {
  payments: PaymentRecord[];
  companies: Company[];
  invoices: InvoiceRecord[];
  onUpdatePayments: (payments: PaymentRecord[]) => void;
}

export default function PaymentsView({
  payments,
  companies,
  invoices,
  onUpdatePayments,
}: PaymentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<PaymentRecord>>({
    date: new Date().toISOString().substring(0, 10),
    paymentId: `PAY-${1000 + payments.length + 1}`,
    invoiceNo: invoices[0]?.invoiceNumber || 'E7/2026-27/101',
    company: companies[0]?.name || 'WALMART',
    amount: 58900,
    paid: 58900,
    balance: 0,
    status: 'Paid',
    paymentMode: 'NEFT Transfer',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.paid, 0);
  const totalBalance = Math.max(0, totalAmount - totalPaid);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.paymentId.toLowerCase().includes(q) ||
        p.invoiceNo.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    setFormData({
      date: new Date().toISOString().substring(0, 10),
      paymentId: `PAY-${1000 + payments.length + 1}`,
      invoiceNo: invoices[0]?.invoiceNumber || 'E7/2026-27/101',
      company: companies[0]?.name || 'WALMART',
      amount: 58900,
      paid: 58900,
      balance: 0,
      status: 'Paid',
      paymentMode: 'NEFT Transfer',
    });
    setIsModalOpen(true);
  };

  const handleAmountChange = (total: number, paidAmt: number) => {
    const bal = Math.max(0, total - paidAmt);
    let st: 'Paid' | 'Partial' | 'Pending' = 'Paid';
    if (paidAmt === 0) st = 'Pending';
    else if (paidAmt < total) st = 'Partial';

    setFormData({
      ...formData,
      amount: total,
      paid: paidAmt,
      balance: bal,
      status: st,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paymentId) return;

    const newPay: PaymentRecord = {
      id: `PAY-${new Date().getTime()}`,
      date: formData.date || new Date().toISOString().substring(0, 10),
      paymentId: formData.paymentId,
      invoiceNo: formData.invoiceNo || 'E7/2026-27/101',
      company: formData.company || 'WALMART',
      amount: Number(formData.amount) || 0,
      paid: Number(formData.paid) || 0,
      balance: Number(formData.balance) || 0,
      status: (formData.status as any) || 'Paid',
      paymentMode: formData.paymentMode || 'NEFT Transfer',
    };

    onUpdatePayments([newPay, ...payments]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Payments</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Client billing remittance logs, bank UTR clearances, and outstanding balances
          </p>
        </div>

        <button
          id="add-payment-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Payment</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-blue-50 text-[#2563EB]">
              <DollarSign className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-blue-700">Invoiced</span>
          </div>
          <p className="text-2xl font-black text-[#172033]">{formatCurrency(totalAmount)}</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Billed</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-[#16A34A]">
              <CheckCircle className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-[#16A34A]">Cleared</span>
          </div>
          <p className="text-2xl font-black text-[#16A34A]">{formatCurrency(totalPaid)}</p>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Total Paid</p>
        </div>

        <div className="bg-white p-5 rounded-xl border-2 border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Clock className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-800">Outstanding</span>
          </div>
          <p className="text-2xl font-black text-amber-900">{formatCurrency(totalBalance)}</p>
          <p className="text-xs font-bold text-amber-800 mt-0.5">Balance Due</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search payment ID, invoice number, company..."
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
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Table (Page 14 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5 font-bold">Payment ID</th>
                <th className="py-3 px-3.5">Invoice No.</th>
                <th className="py-3 px-3.5 font-bold">Company</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5 text-right">Paid</th>
                <th className="py-3 px-3.5 text-right">Balance</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#64748B]">
                    No client payment receipts found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-[#64748B]">{p.date}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-[#006B57]">{p.paymentId}</td>
                    <td className="py-3 px-3.5 font-mono text-[#172033]">{p.invoiceNo}</td>
                    <td className="py-3 px-3.5 font-bold text-[#172033]">{p.company}</td>
                    <td className="py-3 px-3.5 text-right font-medium text-[#172033]">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-3.5 text-right text-emerald-700 font-bold">{formatCurrency(p.paid)}</td>
                    <td className="py-3 px-3.5 text-right font-black text-amber-800">{formatCurrency(p.balance)}</td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => alert(`Payment Receipt:\nID: ${p.paymentId}\nCompany: ${p.company}\nAmount: ₹${p.paid}\nMode: ${p.paymentMode}`)}
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
              <h3 className="text-base font-bold text-[#172033]">Record Client Payment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Payment Date *
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
                    Invoice Reference
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Company / Corporate Client *
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Invoice Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(Number(e.target.value), Number(formData.paid || 0))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Paid Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.paid}
                    onChange={(e) => handleAmountChange(Number(formData.amount || 0), Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-black text-[#006B57]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Balance (₹)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.balance}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold text-amber-800 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Payment Mode / UTR Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEFT UTR #HDFC0982341920"
                  value={formData.paymentMode || ''}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
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
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
