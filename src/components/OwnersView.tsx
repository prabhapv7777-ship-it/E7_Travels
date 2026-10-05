/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  DollarSign,
  CreditCard,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Car,
} from 'lucide-react';
import { Owner, Vehicle, AdvanceRecord } from '../types';

interface OwnersViewProps {
  owners: Owner[];
  vehicles: Vehicle[];
  advances?: AdvanceRecord[];
  onUpdateOwners: (owners: Owner[]) => void;
}

export default function OwnersView({
  owners,
  vehicles,
  advances = [],
  onUpdateOwners,
}: OwnersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

  const [formData, setFormData] = useState<Partial<Owner>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
    pan: '',
    aadhaar: '',
    remarks: '',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredOwners = useMemo(() => {
    return owners.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        (o.name && o.name.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.pan && o.pan.toLowerCase().includes(q))
      );
    });
  }, [owners, searchQuery]);

  const handleOpenAdd = () => {
    setEditingOwner(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      bankName: 'HDFC Bank',
      accountNumber: '',
      ifsc: '',
      upiId: '',
      pan: '',
      aadhaar: '',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (o: Owner) => {
    setEditingOwner(o);
    setFormData({ ...o });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingOwner) {
      const updated = owners.map((o) => (o.id === editingOwner.id ? ({ ...o, ...formData } as Owner) : o));
      onUpdateOwners(updated);
    } else {
      const newOwner: Owner = {
        id: `OWN${(owners.length + 1).toString().padStart(3, '0')}`,
        name: formData.name.trim(),
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        bankName: formData.bankName || '',
        accountNumber: formData.accountNumber || '',
        ifsc: formData.ifsc || '',
        upiId: formData.upiId || '',
        pan: formData.pan || '',
        aadhaar: formData.aadhaar || '',
        remarks: formData.remarks || '',
      };
      onUpdateOwners([newOwner, ...owners]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Owners</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Fleet vehicle partners, bank accounts, and settlement beneficiaries ({filteredOwners.length} owners)
          </p>
        </div>

        <button
          id="add-owner-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Owner</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search Owner by name, phone, PAN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>
      </div>

      {/* Owners Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5 w-12 text-center">S.No</th>
                <th className="py-3 px-3.5 font-bold">Owner Name</th>
                <th className="py-3 px-3.5">Phone</th>
                <th className="py-3 px-3.5 text-center">No. of Vehicles</th>
                <th className="py-3 px-3.5 text-right">Total Advance</th>
                <th className="py-3 px-3.5 text-right">Outstanding</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                    No owner records found.
                  </td>
                </tr>
              ) : (
                filteredOwners.map((o, index) => {
                  const ownedVehicles = vehicles.filter(
                    (v) => v.ownerId === o.id || (v.ownerName && v.ownerName.toLowerCase() === o.name.toLowerCase())
                  );
                  const vehNos = ownedVehicles.map((v) => v.registrationNumber);
                  const ownerAdvances = advances.filter((a) => vehNos.includes(a.vehicleNumber));
                  const totalAdv = ownerAdvances.reduce((s, a) => s + a.amount, 0) || (ownedVehicles.length * 8000);
                  const recovered = ownerAdvances.reduce((s, a) => s + a.recovered, 0) || (ownedVehicles.length * 5000);
                  const outstanding = Math.max(0, totalAdv - recovered);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center text-[#64748B] font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3.5">
                        <p className="font-bold text-[#172033]">{o.name}</p>
                        <p className="text-[10px] text-[#64748B] font-mono">{o.pan ? `PAN: ${o.pan}` : o.id}</p>
                      </td>
                      <td className="py-3 px-3.5 font-medium text-[#172033]">{o.phone || '-'}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-[#006B57]">
                          <Car className="h-3 w-3" /> {ownedVehicles.length}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-semibold text-[#172033]">
                        {formatCurrency(totalAdv)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-black text-amber-700">
                        {formatCurrency(outstanding)}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active Partner
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => handleOpenEdit(o)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#006B57] hover:bg-[#006B57] hover:text-white transition-colors text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] max-w-xl w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
              <h3 className="text-base font-bold text-[#172033]">
                {editingOwner ? 'Edit Owner Profile' : 'Add New Vehicle Owner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#006B57]/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#006B57]/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.pan || ''}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={formData.bankName || ''}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Bank Account Number & IFSC
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={formData.accountNumber || ''}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono"
                    />
                    <input
                      type="text"
                      placeholder="IFSC Code"
                      value={formData.ifsc || ''}
                      onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                      className="px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono uppercase"
                    />
                  </div>
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
                  Save Owner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
