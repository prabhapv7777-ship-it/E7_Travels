import React, { useState } from 'react';
import { Enquiry, Site } from '../types';
import {
  PhoneCall,
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  CheckCircle,
  Calendar,
  XCircle,
  MapPin,
  User,
  FileText,
  Car,
  Tag,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';

interface EnquiryViewsProps {
  enquiries: Enquiry[];
  sites: Site[];
  onUpdateEnquiries: (newEnquiries: Enquiry[]) => void;
}

export default function EnquiryViews({
  enquiries,
  sites,
  onUpdateEnquiries,
}: EnquiryViewsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Interested' | 'Site Offered' | 'Closed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<Enquiry>>({
    vehicleNumber: '',
    vehicleType: 'Sedan',
    vehicleModelYear: '',
    vehicleColor: '',
    ownerNamePhone: '',
    reference: '',
    driverName: '',
    driverAge: '',
    driverPhone: '',
    driverArea: '',
    driverBatchExp: '',
    alreadyRunningCompany: '',
    sitePreference1: '',
    sitePreference2: '',
    enquiryDate: new Date().toISOString().substring(0, 10),
    status: 'New',
    remarks: '',
  });

  const handleOpenAdd = () => {
    setFormState({
      vehicleNumber: '',
      vehicleType: 'Sedan',
      vehicleModelYear: '',
      vehicleColor: '',
      ownerNamePhone: '',
      reference: 'Direct Call',
      driverName: '',
      driverAge: '',
      driverPhone: '',
      driverArea: '',
      driverBatchExp: '',
      alreadyRunningCompany: '',
      sitePreference1: sites.length > 0 ? sites[0].name : 'Open Preference',
      sitePreference2: sites.length > 1 ? sites[1].name : 'Open Preference',
      enquiryDate: new Date().toISOString().substring(0, 10),
      status: 'New',
      remarks: '',
    });
    setEditingId(null);
    setIsAdding(true);
    setFormError(null);
  };

  const handleOpenEdit = (enq: Enquiry) => {
    setFormState({ ...enq });
    setEditingId(enq.id);
    setIsAdding(false);
    setFormError(null);
  };

  const handleCloseForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.vehicleNumber?.trim()) {
      setFormError('Vehicle registration/temporary number is required.');
      return;
    }
    if (!formState.ownerNamePhone?.trim()) {
      setFormError('Owner Name & Phone details are required.');
      return;
    }
    if (!formState.driverName?.trim()) {
      setFormError('Driver Name is required.');
      return;
    }

    if (editingId) {
      // Update existing
      const updated = enquiries.map((item) =>
        item.id === editingId ? { ...(formState as Enquiry) } : item
      );
      onUpdateEnquiries(updated);
    } else {
      // Add new
      const nextNum = enquiries.length + 1;
      const formattedNum = String(nextNum).padStart(3, '0');
      const newId = `ENQ${formattedNum}`;
      
      const newEnq: Enquiry = {
        ...(formState as Enquiry),
        id: newId,
        enquiryDate: formState.enquiryDate || new Date().toISOString().substring(0, 10),
        status: formState.status || 'New',
      };
      onUpdateEnquiries([newEnq, ...enquiries]);
    }

    handleCloseForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`Are you sure you want to delete enquiry ${id}?`)) {
      const updated = enquiries.filter((item) => item.id !== id);
      onUpdateEnquiries(updated);
    }
  };

  // Filter & Search Logic
  const filtered = enquiries.filter((item) => {
    const matchesSearch =
      (item.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehicleType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehicleModelYear || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehicleColor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ownerNamePhone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.driverName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.driverPhone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.driverArea || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.alreadyRunningCompany || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sitePreference1 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sitePreference2 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === 'New').length;
  const interestedCount = enquiries.filter((e) => e.status === 'Interested').length;
  const siteOfferedCount = enquiries.filter((e) => e.status === 'Site Offered').length;
  const closedCount = enquiries.filter((e) => e.status === 'Closed').length;

  return (
    <div className="space-y-6">
      
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-3xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-indigo-600" /> Enquiry Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture telephone inquiries, driver details, currently running company, and preferred site preferences.
          </p>
        </div>
        <button
          id="btn-add-enquiry-top"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xs transition-all flex items-center gap-2 shadow-xs self-start md:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Call / Enquiry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          id="kpi-card-total-calls"
          onClick={() => setStatusFilter('all')}
          className={`p-4 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-indigo-400 ${
            statusFilter === 'all' ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Calls</p>
            <p className="text-lg font-bold text-slate-800 mt-1">{totalCount}</p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <PhoneCall className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-new-leads"
          onClick={() => setStatusFilter('New')}
          className={`p-4 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-amber-400 ${
            statusFilter === 'New' ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">New Leads</p>
            <p className="text-lg font-bold text-amber-600 mt-1">{newCount}</p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Tag className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-interested"
          onClick={() => setStatusFilter('Interested')}
          className={`p-4 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-blue-400 ${
            statusFilter === 'Interested' ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Interested</p>
            <p className="text-lg font-bold text-blue-600 mt-1">{interestedCount}</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <User className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-site-offered"
          onClick={() => setStatusFilter('Site Offered')}
          className={`p-4 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-emerald-400 ${
            statusFilter === 'Site Offered' ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Site Offered</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">{siteOfferedCount}</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Building className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-closed"
          onClick={() => setStatusFilter('Closed')}
          className={`p-4 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-slate-400 col-span-2 lg:col-span-1 ${
            statusFilter === 'Closed' ? 'ring-2 ring-slate-500 border-slate-500 bg-slate-50' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Closed</p>
            <p className="text-lg font-bold text-slate-500 mt-1">{closedCount}</p>
          </div>
          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
            <CheckCircle className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Adding & Editing Form Panel */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {editingId ? `Modify Enquiry Record: ${editingId}` : 'Log New Telephone Enquiry Spec Sheet'}
              </h3>
            </div>
            <button
              onClick={handleCloseForm}
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-all"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {formError && (
            <div className="mx-6 mt-4 p-3 bg-rose-50 text-rose-700 text-xs border border-rose-200 rounded-lg flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* 1. VEHICLE DETAILS SEGMENT */}
            <div className="space-y-4">
              <h4 className="text-2xs font-extrabold text-amber-600 uppercase tracking-widest border-b border-amber-100 pb-1.5">
                Vehicle Specifications Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Registration/Temporary Number *</label>
                  <input
                    id="enq-form-vehicleNumber"
                    type="text"
                    required
                    placeholder="e.g. TN-07-BY-1234 or TEMP-5541"
                    value={formState.vehicleNumber || ''}
                    onChange={(e) => setFormState({ ...formState, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Vehicle Type</label>
                  <select
                    id="enq-form-vehicleType"
                    value={formState.vehicleType || 'Sedan'}
                    onChange={(e) => setFormState({ ...formState, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Bus">Bus</option>
                    <option value="Tempo Traveler">Tempo Traveler</option>
                    <option value="Other">Other Mini Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Model & Year of Manufacture</label>
                  <input
                    id="enq-form-vehicleModelYear"
                    type="text"
                    placeholder="e.g. Toyota Innova Crysta (2024)"
                    value={formState.vehicleModelYear || ''}
                    onChange={(e) => setFormState({ ...formState, vehicleModelYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Vehicle Color</label>
                  <input
                    id="enq-form-vehicleColor"
                    type="text"
                    placeholder="e.g. Silver Metallic / Pearl White"
                    value={formState.vehicleColor || ''}
                    onChange={(e) => setFormState({ ...formState, vehicleColor: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Name & Phone *</label>
                  <input
                    id="enq-form-ownerNamePhone"
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar (9841234560)"
                    value={formState.ownerNamePhone || ''}
                    onChange={(e) => setFormState({ ...formState, ownerNamePhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Reference / Call Source</label>
                  <input
                    id="enq-form-reference"
                    type="text"
                    placeholder="e.g. Direct Calling / Supervisor Selvam"
                    value={formState.reference || ''}
                    onChange={(e) => setFormState({ ...formState, reference: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. DRIVER DETAILS SEGMENT */}
            <div className="space-y-4">
              <h4 className="text-2xs font-extrabold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-1.5">
                Driver Credentials Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Name *</label>
                  <input
                    id="enq-form-driverName"
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={formState.driverName || ''}
                    onChange={(e) => setFormState({ ...formState, driverName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Age</label>
                  <input
                    id="enq-form-driverAge"
                    type="text"
                    placeholder="e.g. 38"
                    value={formState.driverAge || ''}
                    onChange={(e) => setFormState({ ...formState, driverAge: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Phone No</label>
                  <input
                    id="enq-form-driverPhone"
                    type="text"
                    placeholder="e.g. 9840998877"
                    value={formState.driverPhone || ''}
                    onChange={(e) => setFormState({ ...formState, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Area / Location</label>
                  <input
                    id="enq-form-driverArea"
                    type="text"
                    placeholder="e.g. Adyar / Velachery"
                    value={formState.driverArea || ''}
                    onChange={(e) => setFormState({ ...formState, driverArea: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Badge Expiry (Batch Exp)</label>
                  <input
                    id="enq-form-driverBatchExp"
                    type="date"
                    value={formState.driverBatchExp || ''}
                    onChange={(e) => setFormState({ ...formState, driverBatchExp: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. BUSINESS PREFERENCE & STATUS SEGMENT */}
            <div className="space-y-4">
              <h4 className="text-2xs font-extrabold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1.5">
                Current Deployment & Site Preference Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Already Running Company</label>
                  <input
                    id="enq-form-alreadyRunning"
                    type="text"
                    placeholder="e.g. TCS / Cognizant / None"
                    value={formState.alreadyRunningCompany || ''}
                    onChange={(e) => setFormState({ ...formState, alreadyRunningCompany: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Site Preference 1 (Primary)</label>
                  <select
                    id="enq-form-sitePref1"
                    value={formState.sitePreference1 || ''}
                    onChange={(e) => setFormState({ ...formState, sitePreference1: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Open Preference">Open Preference / Any Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Site Preference 2 (Backup)</label>
                  <select
                    id="enq-form-sitePref2"
                    value={formState.sitePreference2 || ''}
                    onChange={(e) => setFormState({ ...formState, sitePreference2: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="Open Preference">Open Preference / Any Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Call Status</label>
                  <select
                    id="enq-form-status"
                    value={formState.status || 'New'}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="New">New</option>
                    <option value="Interested">Interested</option>
                    <option value="Site Offered">Site Offered</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. DATE AND REMARKS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Enquiry Call Date</label>
                <input
                  id="enq-form-date"
                  type="date"
                  value={formState.enquiryDate || ''}
                  onChange={(e) => setFormState({ ...formState, enquiryDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">General Remarks & Follow Up Logs</label>
                <input
                  id="enq-form-remarks"
                  type="text"
                  placeholder="e.g. Owner demands high rate per KM. Needs badge verification."
                  value={formState.remarks || ''}
                  onChange={(e) => setFormState({ ...formState, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                id="enq-form-btn-cancel"
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all bg-white"
              >
                Cancel
              </button>
              <button
                id="enq-form-btn-save"
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-all"
              >
                {editingId ? 'Update Log' : 'Save Enquiry Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Spreadsheet List Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden">
        
        {/* Card Header with Excel style filters */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="enq-search"
              type="text"
              placeholder="Search registration, owner, driver, or site preferences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
            {(['all', 'New', 'Interested', 'Site Offered', 'Closed'] as const).map((st) => (
              <button
                id={`status-filter-${st}`}
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-3xs font-extrabold uppercase tracking-wider rounded-lg border transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-3xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'all' ? 'All Call Leads' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Outer container for scrollable spreadsheet table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <PhoneCall className="h-10 w-10 mx-auto text-slate-300 stroke-1" />
              <div>
                <p className="text-xs font-bold text-slate-600">No Enquiry Records Found</p>
                <p className="text-4xs uppercase tracking-wider text-slate-400 mt-1">Try resetting your status filters or search term</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
              <thead>
                {/* PRIMARY COLOR GROUP HEADERS */}
                <tr className="border-b border-slate-200 font-extrabold uppercase tracking-wider text-3xs">
                  {/* ENQ001 Header Column */}
                  <th rowSpan={2} className="py-3 px-3 text-center align-middle bg-purple-100 text-purple-900 border-r border-b border-purple-200 font-black font-mono w-[110px]">
                    ENQUIRY ID
                  </th>

                  {/* VEHICLE DETAILS Group Header (Yellow hue from picture) */}
                  <th colSpan={6} className="py-2 px-4 text-center bg-amber-100 text-amber-950 border-r border-b border-amber-200 font-black text-2xs uppercase tracking-widest">
                    VECHILE DETAILS
                  </th>

                  {/* DRIVER DETAILS Group Header (Green hue from picture) */}
                  <th colSpan={5} className="py-2 px-4 text-center bg-emerald-100/90 text-emerald-950 border-r border-b border-emerald-200 font-black text-2xs uppercase tracking-widest">
                    DRIVER DETAILS
                  </th>

                  {/* ALREADY RUNNING COMPANY (Orange/Peach hue from picture) */}
                  <th rowSpan={2} className="py-3 px-3 text-center align-middle bg-orange-100 text-orange-950 border-r border-b border-orange-200 font-black leading-tight w-[160px]">
                    ALREADY RUNNING COMPANY
                  </th>

                  {/* SITE PREFERENCE 1 (Orange/Peach hue from picture) */}
                  <th rowSpan={2} className="py-3 px-3 text-center align-middle bg-amber-50 text-amber-950 border-r border-b border-amber-200 font-black leading-tight w-[150px]">
                    SITE PREFERENCE 1
                  </th>

                  {/* SITE PREFERENCE 2 (Pink/Red hue from picture) */}
                  <th rowSpan={2} className="py-3 px-3 text-center align-middle bg-rose-100 text-rose-950 border-r border-b border-rose-200 font-black leading-tight w-[150px]">
                    SITE PREFERENCE 2
                  </th>

                  {/* STATUS & ACTIONS */}
                  <th rowSpan={2} className="py-3 px-4 text-center align-middle bg-slate-100 text-slate-700 border-r border-b border-slate-200 font-extrabold w-[110px]">
                    STATUS
                  </th>
                  <th rowSpan={2} className="py-3 px-4 text-center align-middle bg-slate-100 text-slate-700 border-b border-slate-200 font-extrabold w-[100px]">
                    ACTIONS
                  </th>
                </tr>

                {/* SECONDARY DETAILED SUB-HEADERS */}
                <tr className="bg-slate-50 border-b border-slate-200 font-black text-4xs uppercase tracking-wider text-slate-500">
                  {/* Vehicle Sub-columns */}
                  <th className="py-2 px-3 border-r border-slate-200 bg-amber-50/50">NUMBER</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-amber-50/50">TYPE</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-amber-50/50">MODEL/YEAR</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-amber-50/50">COLOR</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-amber-50/50">OWNER NAME/PHONE</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-amber-50/50">REFERENCE</th>

                  {/* Driver Sub-columns */}
                  <th className="py-2 px-3 border-r border-slate-200 bg-emerald-50/30">NAME</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-emerald-50/30">AGE</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-emerald-50/30">PHONE NO</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-emerald-50/30">AREA</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-emerald-50/30">BATCH EXP</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((enq) => {
                  let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (enq.status === 'Interested') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (enq.status === 'Site Offered') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (enq.status === 'Closed') badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';

                  return (
                    <tr
                      id={`enq-row-${enq.id}`}
                      key={enq.id}
                      className="hover:bg-slate-50/60 transition-colors align-middle text-2xs"
                    >
                      {/* ID (Purple background theme column) */}
                      <td className="py-3 px-3 font-mono font-black text-center border-r border-purple-100/50 bg-purple-50/20 text-purple-800">
                        {enq.id}
                        <div className="text-[9px] text-slate-400 font-normal mt-0.5">{enq.enquiryDate}</div>
                      </td>

                      {/* Vehicle Sub-columns */}
                      <td className="py-3 px-3 border-r border-slate-100 font-bold text-slate-800">
                        {enq.vehicleNumber}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100">
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-100">
                          {enq.vehicleType}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100 text-slate-600">
                        {enq.vehicleModelYear || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100 text-slate-600">
                        {enq.vehicleColor || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100 font-medium text-slate-700">
                        {enq.ownerNamePhone}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100 text-slate-500 italic text-[11px]">
                        {enq.reference || <span className="text-slate-300">-</span>}
                      </td>

                      {/* Driver Sub-columns */}
                      <td className="py-3 px-3 border-r border-slate-100 font-bold text-emerald-800 bg-emerald-50/10">
                        {enq.driverName}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100 text-slate-600 text-center bg-emerald-50/10">
                        {enq.driverAge || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100 text-slate-700 font-mono bg-emerald-50/10">
                        {enq.driverPhone || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100 text-slate-600 bg-emerald-50/10">
                        {enq.driverArea || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-100 font-mono text-slate-500 bg-emerald-50/10 whitespace-nowrap">
                        {enq.driverBatchExp ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {enq.driverBatchExp}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* ALREADY RUNNING COMPANY */}
                      <td className="py-3 px-3 border-r border-slate-100 bg-orange-50/10 font-medium text-orange-950">
                        {enq.alreadyRunningCompany || (
                          <span className="text-slate-300 italic">None / Tour Operator</span>
                        )}
                      </td>

                      {/* SITE PREFERENCE 1 */}
                      <td className="py-3 px-3 border-r border-slate-100 bg-amber-50/10 font-bold text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-500" />
                          {enq.sitePreference1 || <span className="text-slate-300 italic font-normal">Open</span>}
                        </div>
                      </td>

                      {/* SITE PREFERENCE 2 */}
                      <td className="py-3 px-3 border-r border-slate-100 bg-rose-50/10 font-bold text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-rose-400" />
                          {enq.sitePreference2 || <span className="text-slate-300 italic font-normal">Open</span>}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-4 border-r border-slate-100 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full border ${badgeColor}`}>
                          {enq.status}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            id={`enq-btn-edit-${enq.id}`}
                            onClick={() => handleOpenEdit(enq)}
                            className="p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`enq-btn-delete-${enq.id}`}
                            onClick={() => handleDelete(enq.id)}
                            className="p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Excel style Table Legend / Helper */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-3xs text-slate-400 font-extrabold uppercase tracking-widest gap-2">
          <span>* Columns required for initial enquiry logging validation.</span>
          <span>Showing {filtered.length} of {enquiries.length} logged telephone enquiries</span>
        </div>
      </div>
    </div>
  );
}
