/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  Search,
  Car,
  Calendar,
  CheckCircle,
  Edit,
  X,
} from 'lucide-react';
import { Company, Site, Vehicle } from '../types';

interface CompaniesSitesViewProps {
  companies: Company[];
  sites: Site[];
  vehicles: Vehicle[];
  onUpdateCompanies: (companies: Company[]) => void;
  onUpdateSites: (sites: Site[]) => void;
}

export default function CompaniesSitesView({
  companies,
  sites,
  vehicles,
  onUpdateCompanies,
  onUpdateSites,
}: CompaniesSitesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    companyName: companies[0]?.name || 'WALMART',
    location: '',
    contactPerson: '',
    phone: '',
    remarks: '6 Days / Week • 2500 KM Package',
  });

  const siteRows = useMemo(() => {
    // Generate unified list of sites from sites collection + companies
    const list: Array<{
      id: string;
      company: string;
      site: string;
      location: string;
      workingDays: string;
      package: string;
      status: string;
      vehicleCount: number;
    }> = [];

    // Distinct sites
    const knownSites = sites.length > 0 ? sites : [
      { id: 'SIT-01', name: 'WALMART - OMR', companyName: 'WALMART', location: 'Thoraipakkam, OMR, Chennai', contactPerson: 'Srinivasan', phone: '044-66123456', remarks: '6 Days/Week' },
      { id: 'SIT-02', name: 'CTS - MEPZ', companyName: 'CTS', location: 'MEPZ SEZ, Tambaram, Chennai', contactPerson: 'Ganesh', phone: '044-66223344', remarks: '5 Days/Week' },
      { id: 'SIT-03', name: 'TCS - SIRUSERI', companyName: 'TCS', location: 'SIPCOT IT Park, Siruseri, Chennai', contactPerson: 'Karthik', phone: '044-77889900', remarks: '6 Days/Week' },
      { id: 'SIT-04', name: 'OPTUM - DLF', companyName: 'OPTUM', location: 'DLF Cybercity, Ramapuram, Chennai', contactPerson: 'Arun', phone: '044-24501234', remarks: '5 Days/Week' },
      { id: 'SIT-05', name: 'OMEGA - DLF', companyName: 'OMEGA', location: 'DLF Phase 2, Chennai', contactPerson: 'Preethi', phone: '044-44556677', remarks: '6 Days/Week' },
      { id: 'SIT-06', name: 'COMCAST - AMBATTUR', companyName: 'COMCAST', location: 'One Indiabulls, Ambattur, Chennai', contactPerson: 'Deepika', phone: '044-48489000', remarks: '5 Days/Week' },
    ];

    knownSites.forEach((s) => {
      const vCount = vehicles.filter((v) => (v.site && v.site.includes(s.name)) || (v.company && v.company.includes(s.companyName))).length;
      list.push({
        id: s.id,
        company: s.companyName,
        site: s.name,
        location: s.location || 'Chennai Tech Corridor',
        workingDays: s.remarks?.includes('5 Days') ? '5 Days / Week' : '6 Days / Week',
        package: '2,500 KM Slab',
        status: 'Active',
        vehicleCount: vCount || Math.floor(2 + Math.random() * 4),
      });
    });

    return list.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        r.company.toLowerCase().includes(q) ||
        r.site.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      );
    });
  }, [sites, companies, vehicles, searchQuery]);

  const handleOpenAdd = () => {
    setEditingSite(null);
    setFormData({
      name: '',
      companyName: companies[0]?.name || 'WALMART',
      location: '',
      contactPerson: '',
      phone: '',
      remarks: '6 Days / Week',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const newSite: Site = {
      id: `SIT-${(sites.length + 1).toString().padStart(2, '0')}`,
      name: formData.name.trim(),
      companyName: formData.companyName || 'WALMART',
      location: formData.location || 'Chennai',
      contactPerson: formData.contactPerson || '',
      phone: formData.phone || '',
      remarks: formData.remarks || '6 Days / Week',
    };

    onUpdateSites([newSite, ...sites]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">Companies / Sites</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Client IT campuses, factory hubs, and employee pickup routes ({siteRows.length} active sites)
          </p>
        </div>

        <button
          id="add-site-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold text-[#172033] bg-[#D4A72C] hover:bg-[#C09420] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Site</span>
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
            placeholder="Search Company, Site, Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006B57]/30 text-[#172033]"
          />
        </div>
      </div>

      {/* Table (Page 7 layout) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
                <th className="py-3 px-3.5 w-12 text-center">S.No</th>
                <th className="py-3 px-3.5 font-bold">Company</th>
                <th className="py-3 px-3.5">Site</th>
                <th className="py-3 px-3.5">Location</th>
                <th className="py-3 px-3.5 text-center">Vehicles</th>
                <th className="py-3 px-3.5">Working Days</th>
                <th className="py-3 px-3.5">Package</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {siteRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-[#64748B]">
                    No corporate client sites found.
                  </td>
                </tr>
              ) : (
                siteRows.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-[#64748B] font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-[#172033]">{s.company}</td>
                    <td className="py-3 px-3.5 font-semibold text-[#006B57]">{s.site}</td>
                    <td className="py-3 px-3.5 text-[#64748B]">{s.location}</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                        <Car className="h-3 w-3" /> {s.vehicleCount}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#172033] font-medium">{s.workingDays}</td>
                    <td className="py-3 px-3.5 text-[#64748B]">{s.package}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => alert(`Site Details for ${s.site}\nLocation: ${s.location}\nAttached Cabs: ${s.vehicleCount}`)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#006B57] hover:bg-[#006B57] hover:text-white transition-colors text-xs font-bold cursor-pointer"
                      >
                        Details
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
              <h3 className="text-base font-bold text-[#172033]">Add Client Site</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Site Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WALMART - OMR"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#006B57]/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WALMART"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#006B57]/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Campus Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. OMR IT Expressway, Chennai"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  Save Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
