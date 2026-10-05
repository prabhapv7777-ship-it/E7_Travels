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
  ShieldCheck,
  AlertTriangle,
  Clock,
  Edit,
  Car,
  X,
} from 'lucide-react';
import { Driver, Vehicle } from '../types';

interface DriversViewProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  onUpdateDrivers: (drivers: Driver[]) => void;
}

export default function DriversView({
  drivers,
  vehicles,
  onUpdateDrivers,
}: DriversViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [formData, setFormData] = useState<Partial<Driver>>({
    name: '',
    phone: '',
    altPhone: '',
    licenceNumber: '',
    licenceExpiry: '2028-06-30',
    badgeNumber: '',
    badgeExpiry: '2027-12-31',
    salary: 22000,
    status: 'Active',
    address: 'Chennai',
  });

  const getComplianceStatus = (d: Driver) => {
    const today = new Date('2026-10-05');
    if (!d.licenceExpiry) return { label: 'Valid', color: 'bg-emerald-100 text-emerald-800' };

    const lExp = new Date(d.licenceExpiry);
    const diffDays = Math.ceil((lExp.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { label: 'Expired', color: 'bg-rose-100 text-rose-800 font-black' };
    if (diffDays <= 45) return { label: 'Expiring', color: 'bg-amber-100 text-amber-800 font-bold' };
    return { label: 'Valid', color: 'bg-emerald-100 text-emerald-800 font-semibold' };
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.phone && d.phone.includes(q)) ||
        (d.licenceNumber && d.licenceNumber.toLowerCase().includes(q));

      const comp = getComplianceStatus(d);
      const matchStatus =
        statusFilter === 'All' ||
        d.status === statusFilter ||
        comp.label.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      altPhone: '',
      licenceNumber: '',
      licenceExpiry: '2028-06-30',
      badgeNumber: '',
      badgeExpiry: '2027-12-31',
      salary: 22000,
      status: 'Active',
      address: 'Chennai',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setFormData({ ...d });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingDriver) {
      const updated = drivers.map((d) => (d.id === editingDriver.id ? ({ ...d, ...formData } as Driver) : d));
      onUpdateDrivers(updated);
    } else {
      const newDriver: Driver = {
        id: `DRV${(drivers.length + 1).toString().padStart(3, '0')}`,
        name: formData.name.trim(),
        phone: formData.phone || '',
        altPhone: formData.altPhone || '',
        address: formData.address || 'Chennai',
        badgeNumber: formData.badgeNumber || '',
        badgeExpiry: formData.badgeExpiry || '2027-12-31',
        licenceNumber: formData.licenceNumber || '',
        licenceExpiry: formData.licenceExpiry || '2028-06-30',
        aadhaar: '',
        pan: '',
        emergencyContact: '',
        salary: Number(formData.salary) || 22000,
        joiningDate: new Date().toISOString().substring(0, 10),
        status: (formData.status as any) || 'Active',
      };
      onUpdateDrivers([newDriver, ...drivers]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Drivers</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Fleet chauffeurs, transport badge records, and RTO licence compliance ({filteredDrivers.length} drivers)
          </p>
        </div>

        <button
          id="add-driver-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Driver</span>
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
            placeholder="Search Driver by name, mobile, DL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 text-xs border border-[#E2E8F0] rounded-xl bg-white text-[#172033] cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Valid">Valid Licence</option>
          <option value="Expiring">Expiring Soon</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* Drivers Table (Page 6 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5 w-12 text-center">S.No</th>
                <th className="py-3 px-3.5 font-bold">Driver Name</th>
                <th className="py-3 px-3.5">Phone</th>
                <th className="py-3 px-3.5">Vehicle</th>
                <th className="py-3 px-3.5">Site</th>
                <th className="py-3 px-3.5">Licence Expiry</th>
                <th className="py-3 px-3.5">Badge Expiry</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#64748B]">
                    No driver records found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((d, index) => {
                  const assignedVehicle = vehicles.find(
                    (v) => v.driverId === d.id || (v.driverName && v.driverName.toLowerCase() === d.name.toLowerCase())
                  );
                  const compliance = getComplianceStatus(d);

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center text-[#64748B] font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3.5">
                        <p className="font-bold text-[#172033]">{d.name}</p>
                        <p className="text-[10px] text-[#64748B] font-mono">{d.licenceNumber || d.id}</p>
                      </td>
                      <td className="py-3 px-3.5 font-medium text-[#172033]">{d.phone || '-'}</td>
                      <td className="py-3 px-3.5">
                        {assignedVehicle ? (
                          <span className="font-bold text-[#006B57]">{assignedVehicle.registrationNumber}</span>
                        ) : (
                          <span className="text-[#64748B]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-[#64748B]">
                        {assignedVehicle?.site || assignedVehicle?.company || 'Chennai Hub'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[#172033] font-medium">
                        {d.licenceExpiry || '2028-06-30'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-[#64748B]">
                        {d.badgeExpiry || '2027-12-31'}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 w-fit">
                            Active
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] w-fit ${compliance.color}`}>
                            {compliance.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          onClick={() => handleOpenEdit(d)}
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
                {editingDriver ? 'Edit Driver Record' : 'Add New Driver'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Driver Full Name *
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
                    Mobile Number *
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
                    Licence Number
                  </label>
                  <input
                    type="text"
                    placeholder="TN01 20180004567"
                    value={formData.licenceNumber || ''}
                    onChange={(e) => setFormData({ ...formData, licenceNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Licence Expiry
                  </label>
                  <input
                    type="date"
                    value={formData.licenceExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, licenceExpiry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Transport Badge Number
                  </label>
                  <input
                    type="text"
                    placeholder="BDG-78219"
                    value={formData.badgeNumber || ''}
                    onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.salary || 22000}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-bold"
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
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
