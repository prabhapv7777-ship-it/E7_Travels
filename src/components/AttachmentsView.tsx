/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Car,
  Calendar,
  CheckCircle,
  X,
  Edit,
} from 'lucide-react';
import { AttachmentRecord, Vehicle, Owner, Driver } from '../types';

interface AttachmentsViewProps {
  attachments: AttachmentRecord[];
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  onUpdateAttachments: (attachments: AttachmentRecord[]) => void;
}

export default function AttachmentsView({
  attachments,
  vehicles,
  owners,
  drivers,
  onUpdateAttachments,
}: AttachmentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<AttachmentRecord>>({
    vehicleNumber: vehicles[0]?.registrationNumber || '',
    ownerName: vehicles[0]?.ownerName || '',
    driverName: vehicles[0]?.driverName || '',
    site: vehicles[0]?.site || 'WALMART - OMR',
    attachDate: new Date().toISOString().substring(0, 10),
    packageType: 'Monthly Fixed (2500 KM)',
    kmLimit: 2500,
    status: 'Active',
    remarks: '',
  });

  const filteredAttachments = useMemo(() => {
    return attachments.filter((att) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        att.vehicleNumber.toLowerCase().includes(q) ||
        att.ownerName.toLowerCase().includes(q) ||
        att.driverName.toLowerCase().includes(q) ||
        att.site.toLowerCase().includes(q)
      );
    });
  }, [attachments, searchQuery]);

  const handleOpenAdd = () => {
    const v = vehicles[0];
    setFormData({
      vehicleNumber: v?.registrationNumber || '',
      ownerName: v?.ownerName || '',
      driverName: v?.driverName || '',
      site: v?.site || 'WALMART - OMR',
      attachDate: new Date().toISOString().substring(0, 10),
      packageType: 'Monthly Fixed (2500 KM)',
      kmLimit: 2500,
      status: 'Active',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleVehicleChange = (vNo: string) => {
    const found = vehicles.find((v) => v.registrationNumber === vNo);
    setFormData({
      ...formData,
      vehicleNumber: vNo,
      ownerName: found?.ownerName || formData.ownerName,
      driverName: found?.driverName || formData.driverName,
      site: found?.site || found?.company || formData.site,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleNumber) return;

    const newAtt: AttachmentRecord = {
      id: `ATT-${(attachments.length + 1).toString().padStart(3, '0')}`,
      vehicleNumber: formData.vehicleNumber,
      ownerName: formData.ownerName || '',
      driverName: formData.driverName || '',
      site: formData.site || 'Chennai Hub',
      attachDate: formData.attachDate || new Date().toISOString().substring(0, 10),
      packageType: formData.packageType || 'Monthly Fixed (2500 KM)',
      kmLimit: Number(formData.kmLimit) || 2500,
      status: (formData.status as any) || 'Active',
      remarks: formData.remarks || '',
    };

    onUpdateAttachments([newAtt, ...attachments]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Attachments</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Vehicle operational contracts, package terms, and client allocations ({filteredAttachments.length} attachments)
          </p>
        </div>

        <button
          id="add-attachment-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Attachment</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search Attachment by vehicle, owner, driver, site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>
      </div>

      {/* Attachments Table (Page 8 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5 font-bold">Vehicle No.</th>
                <th className="py-3 px-3.5">Owner</th>
                <th className="py-3 px-3.5">Driver</th>
                <th className="py-3 px-3.5">Site</th>
                <th className="py-3 px-3.5">Attach Date</th>
                <th className="py-3 px-3.5">Package</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredAttachments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                    No attachment records found.
                  </td>
                </tr>
              ) : (
                filteredAttachments.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-[#006B57]">
                      {att.vehicleNumber}
                    </td>
                    <td className="py-3 px-3.5 text-[#172033] font-medium">{att.ownerName}</td>
                    <td className="py-3 px-3.5 text-[#172033]">{att.driverName}</td>
                    <td className="py-3 px-3.5 text-[#64748B] font-medium">{att.site}</td>
                    <td className="py-3 px-3.5 font-mono text-[#64748B]">{att.attachDate}</td>
                    <td className="py-3 px-3.5 text-[#172033]">{att.packageType}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => alert(`Attachment Details:\nVehicle: ${att.vehicleNumber}\nPackage: ${att.packageType}\nKM Limit: ${att.kmLimit} KM\nAttached On: ${att.attachDate}`)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#006B57] hover:bg-[#006B57] hover:text-white transition-colors text-xs font-bold cursor-pointer"
                      >
                        View Slip
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
              <h3 className="text-base font-bold text-[#172033]">Add Vehicle Attachment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Select Vehicle *
                </label>
                <select
                  value={formData.vehicleNumber}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#006B57]/30 font-bold"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.model}) - {v.ownerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={formData.driverName || ''}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Assigned Site *
                </label>
                <input
                  type="text"
                  required
                  value={formData.site || ''}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Attachment Date
                  </label>
                  <input
                    type="date"
                    value={formData.attachDate || ''}
                    onChange={(e) => setFormData({ ...formData, attachDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                    Package Slab
                  </label>
                  <select
                    value={formData.packageType}
                    onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl"
                  >
                    <option value="Monthly Fixed (2500 KM)">Monthly Fixed (2500 KM)</option>
                    <option value="Package 3000 KM">Package 3000 KM</option>
                    <option value="Flat Day Package">Flat Day Package</option>
                  </select>
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
                  Save Attachment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
