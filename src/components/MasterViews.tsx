/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  MapPin,
  Building,
  Briefcase,
  Car,
  Printer,
  MessageSquare,
} from 'lucide-react';
import {
  Vehicle,
  Owner,
  Driver,
  Company,
  Site,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
  Enquiry,
} from '../types';
import { formatDate, toInputDateFormat } from '../lib/dateUtils';
import PrintJoiningForm from './PrintJoiningForm';

interface MasterViewsProps {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  companies: Company[];
  sites: Site[];
  activeSubView: 'Vehicle Master' | 'Owner Master' | 'Driver Master' | 'Company Master' | 'Site Master';
  vehicleFilter?: 'all' | 'running' | 'idle' | 'new';
  onSetVehicleFilter?: (filter: 'all' | 'running' | 'idle' | 'new') => void;
  onUpdateVehicles: (v: Vehicle[]) => void;
  onUpdateOwners: (o: Owner[]) => void;
  onUpdateDrivers: (d: Driver[]) => void;
  onUpdateCompanies: (c: Company[]) => void;
  onUpdateSites: (s: Site[]) => void;
}

export default function MasterViews({
  vehicles,
  owners,
  drivers,
  companies,
  sites,
  activeSubView,
  vehicleFilter = 'all',
  onSetVehicleFilter = () => {},
  onUpdateVehicles,
  onUpdateOwners,
  onUpdateDrivers,
  onUpdateCompanies,
  onUpdateSites,
}: MasterViewsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; name: string } | null>(null);
  const [printEnquiry, setPrintEnquiry] = useState<Enquiry | null | undefined>(undefined);
  const [activeCommentTarget, setActiveCommentTarget] = useState<{
    id: string;
    name: string;
    type: 'Vehicle' | 'Owner' | 'Driver' | 'Company' | 'Site';
    comments: Array<{ date: string; text: string; author: string }>;
  } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentTarget || !newCommentText.trim()) return;

    const newComment = {
      date: new Date().toISOString().substring(0, 16).replace('T', ' '),
      text: newCommentText.trim(),
      author: 'Admin User'
    };

    const updatedComments = [...(activeCommentTarget.comments || []), newComment];

    if (activeCommentTarget.type === 'Vehicle') {
      const updated = vehicles.map(v => v.id === activeCommentTarget.id ? { ...v, comments: updatedComments } : v);
      onUpdateVehicles(updated);
    } else if (activeCommentTarget.type === 'Owner') {
      const updated = owners.map(o => o.id === activeCommentTarget.id ? { ...o, comments: updatedComments } : o);
      onUpdateOwners(updated);
    } else if (activeCommentTarget.type === 'Driver') {
      const updated = drivers.map(d => d.id === activeCommentTarget.id ? { ...d, comments: updatedComments } : d);
      onUpdateDrivers(updated);
    } else if (activeCommentTarget.type === 'Company') {
      const updated = companies.map(c => c.name === activeCommentTarget.id ? { ...c, comments: updatedComments } : c);
      onUpdateCompanies(updated);
    } else if (activeCommentTarget.type === 'Site') {
      const updated = sites.map(s => s.id === activeCommentTarget.id ? { ...s, comments: updatedComments } : s);
      onUpdateSites(updated);
    }

    setActiveCommentTarget({
      ...activeCommentTarget,
      comments: updatedComments
    });
    setNewCommentText('');
  };

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingId) {
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const firstInput = formRef.current.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          if (firstInput) {
            firstInput.focus();
          }
        }
      }, 100);
    }
  }, [editingId]);

  useEffect(() => {
    if (isAdding || editingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdding, editingId]);

  // Form States
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({});
  const [ownerForm, setOwnerForm] = useState<Partial<Owner>>({});
  const [driverForm, setDriverForm] = useState<Partial<Driver>>({});
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({});
  const [siteForm, setSiteForm] = useState<Partial<Site>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 9999;
    let target: Date;
    const dmy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmy) {
      target = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    } else {
      target = new Date(dateStr);
    }
    const today = new Date('2026-07-08'); // Current system time
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper to determine vehicle row coloring / warning badges
  const getVehicleExpiryStatus = (v: Vehicle) => {
    const emiDiff = getDaysDiff(v.emiDueDate);
    const insDiff = getDaysDiff(v.insuranceExpiry);
    const perDiff = getDaysDiff(v.permitExpiry);
    const fcDiff = getDaysDiff(v.fcExpiry);

    if (v.status === 'Inactive') return { label: 'Inactive', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    if (emiDiff < 0) return { label: 'Overdue EMI', color: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' };
    if (insDiff >= 0 && insDiff <= 30) return { label: 'Insurance Expiring', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    if (perDiff >= 0 && perDiff <= 30) return { label: 'Permit Expiring', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (fcDiff >= 0 && fcDiff <= 30) return { label: 'FC Expiring', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  // Helper to map a full Vehicle record into an Enquiry structure for printing
  const mapVehicleToEnquiry = (v: Vehicle): Enquiry => {
    const o = owners.find(owner => owner.id === v.ownerId);
    const d = drivers.find(driver => driver.id === v.driverId);
    return {
      id: v.id,
      vehicleNumber: v.registrationNumber,
      vehicleType: `${v.manufacturer} ${v.model}`,
      vehicleModelYear: String(v.year),
      vehicleColor: '',
      ownerNamePhone: o ? `${o.name}-${o.phone}` : v.ownerName,
      reference: v.remarks ? v.remarks.substring(0, 40) : '',
      driverName: v.driverName,
      driverAge: '',
      driverPhone: d ? d.phone : '',
      driverArea: d ? d.address : '',
      driverBatchExp: d ? d.badgeExpiry : '',
      alreadyRunningCompany: v.company,
      sitePreference1: v.site || 'Open Preference',
      sitePreference2: 'Open Preference',
      enquiryDate: v.joiningDate,
      remarks: v.remarks,
      inductionType: 'OwnerAttach',
      ownerId: v.ownerId,
      ownerName: v.ownerName,
      ownerMobile: o ? o.phone : '',
      mfdYear: String(v.year),
      fuelType: v.fuelType,
      rcExpiry: '',
      insuranceExpiry: v.insuranceExpiry,
      permitExpiry: v.permitExpiry,
      fcExpiry: v.fcExpiry,
      driverAltPhone: '',
      driverEmail: o ? o.email : '',
      driverAadhaar: d ? d.aadhaar : '',
      driverDlNumber: d ? d.licenceNumber : '',
      driverDlExpiry: d ? d.licenceExpiry : '',
      driverAddress: d ? d.address : '',
      gpsVendor: '',
      gpsImei: '',
      bankName: o ? o.bankName : '',
      bankAccountHolder: o ? o.name : '',
      bankAccountNumber: o ? o.accountNumber : '',
      bankIfsc: o ? o.ifsc : '',
      sitePreference3: 'Open Preference',
      sitePreference4: 'Open Preference',
      status: 'New'
    };
  };

  // ----------------- CRUD Action Triggers -----------------

  const resetForms = () => {
    setVehicleForm({});
    setOwnerForm({});
    setDriverForm({});
    setCompanyForm({});
    setSiteForm({});
    setEditingId(null);
    setIsAdding(false);
    setFormError(null);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Mandatories check
    if (!vehicleForm.registrationNumber || !vehicleForm.model || !vehicleForm.ownerId || !vehicleForm.driverId) {
      setFormError('Registration Number, Model, Owner, and Driver are mandatory fields.');
      return;
    }

    // Reg Num Unique Validation
    const cleanReg = vehicleForm.registrationNumber.trim().toUpperCase();
    const isDuplicate = vehicles.some(
      (v) => v.registrationNumber.toUpperCase() === cleanReg && v.id !== vehicleForm.id
    );

    if (isDuplicate) {
      setFormError(`Vehicle Registration Number "${cleanReg}" is already registered.`);
      return;
    }

    const matchedOwner = owners.find((o) => o.id === vehicleForm.ownerId);
    const matchedDriver = drivers.find((d) => d.id === vehicleForm.driverId);

    const vehicleRecord: Vehicle = {
      id: vehicleForm.id || `VEH${(vehicles.length + 1).toString().padStart(3, '0')}`,
      registrationNumber: cleanReg,
      model: vehicleForm.model,
      manufacturer: vehicleForm.manufacturer || 'Toyota',
      year: Number(vehicleForm.year) || 2022,
      fuelType: vehicleForm.fuelType || 'Diesel',
      transmission: vehicleForm.transmission || 'Manual',
      vehicleType: vehicleForm.vehicleType || 'Sedan',
      ownerId: vehicleForm.ownerId,
      ownerName: matchedOwner ? matchedOwner.name : 'Unknown Owner',
      driverId: vehicleForm.driverId,
      driverName: matchedDriver ? matchedDriver.name : 'Unknown Driver',
      company: vehicleForm.company || '',
      site: vehicleForm.site || '',
      company2: vehicleForm.company2 || '',
      site2: vehicleForm.site2 || '',
      joiningDate: vehicleForm.joiningDate || '2026-07-08',
      status: vehicleForm.status || 'Active',
      emiAmount: Number(vehicleForm.emiAmount) || 0,
      emiDueDate: vehicleForm.emiDueDate || '',
      insuranceExpiry: vehicleForm.insuranceExpiry || '',
      permitExpiry: vehicleForm.permitExpiry || '',
      fcExpiry: vehicleForm.fcExpiry || '',
      pollutionExpiry: vehicleForm.pollutionExpiry || '',
      fastagNumber: vehicleForm.fastagNumber || '',
      remarks: vehicleForm.remarks || '',
      paymentCycle: vehicleForm.paymentCycle || 'Monthly',
    };

    if (editingId) {
      onUpdateVehicles(vehicles.map((v) => (v.id === editingId ? vehicleRecord : v)));
    } else {
      onUpdateVehicles([...vehicles, vehicleRecord]);
    }
    resetForms();
  };

  const handleSaveOwner = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!ownerForm.name || !ownerForm.phone) {
      setFormError('Owner Name and Phone Number are mandatory fields.');
      return;
    }

    const ownerRecord: Owner = {
      id: ownerForm.id || `OWN${(owners.length + 1).toString().padStart(2, '0')}`,
      name: ownerForm.name,
      phone: ownerForm.phone,
      email: ownerForm.email || '',
      address: ownerForm.address || '',
      bankName: ownerForm.bankName || '',
      accountNumber: ownerForm.accountNumber || '',
      ifsc: ownerForm.ifsc || '',
      upiId: ownerForm.upiId || '',
      pan: ownerForm.pan || '',
      aadhaar: ownerForm.aadhaar || '',
      remarks: ownerForm.remarks || '',
    };

    if (editingId) {
      onUpdateOwners(owners.map((o) => (o.id === editingId ? ownerRecord : o)));
      // Auto-update matched owner name in vehicles to prevent mismatch
      onUpdateVehicles(vehicles.map((v) => v.ownerId === editingId ? { ...v, ownerName: ownerRecord.name } : v));
    } else {
      onUpdateOwners([...owners, ownerRecord]);
    }
    resetForms();
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!driverForm.name || !driverForm.phone || !driverForm.licenceNumber) {
      setFormError('Driver Name, Phone, and Licence Number are mandatory.');
      return;
    }

    const driverRecord: Driver = {
      id: driverForm.id || `DRV${(drivers.length + 1).toString().padStart(2, '0')}`,
      name: driverForm.name,
      phone: driverForm.phone,
      address: driverForm.address || '',
      badgeNumber: driverForm.badgeNumber || '',
      badgeExpiry: driverForm.badgeExpiry || '',
      licenceNumber: driverForm.licenceNumber || '',
      licenceExpiry: driverForm.licenceExpiry || '',
      aadhaar: driverForm.aadhaar || '',
      pan: driverForm.pan || '',
      emergencyContact: driverForm.emergencyContact || '',
      salary: Number(driverForm.salary) || 0,
      joiningDate: driverForm.joiningDate || '2026-07-08',
      status: driverForm.status || 'Active',
      driverType: driverForm.driverType || 'Owner-Paid',
    };

    if (editingId) {
      onUpdateDrivers(drivers.map((d) => (d.id === editingId ? driverRecord : d)));
      // Auto-update matched driver name in vehicles to prevent mismatch
      onUpdateVehicles(vehicles.map((v) => v.driverId === editingId ? { ...v, driverName: driverRecord.name } : v));
    } else {
      onUpdateDrivers([...drivers, driverRecord]);
    }
    resetForms();
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyForm.name) {
      setFormError('Company Name is mandatory.');
      return;
    }

    const companyRecord: Company = {
      name: companyForm.name,
      billingCycle: companyForm.billingCycle || 'Monthly',
      paymentTerms: companyForm.paymentTerms || 'Net 30',
      contactPerson: companyForm.contactPerson || '',
      phone: companyForm.phone || '',
      email: companyForm.email || '',
      address: companyForm.address || '',
    };

    if (editingId) {
      onUpdateCompanies(companies.map((c) => (c.name === editingId ? companyRecord : c)));
    } else {
      onUpdateCompanies([...companies, companyRecord]);
    }
    resetForms();
  };

  const handleSaveSite = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!siteForm.name || !siteForm.companyName) {
      setFormError('Site Name and Associated Company are mandatory.');
      return;
    }

    const siteRecord: Site = {
      id: siteForm.id || `S${(sites.length + 1).toString().padStart(2, '0')}`,
      name: siteForm.name,
      companyName: siteForm.companyName,
      location: siteForm.location || '',
      contactPerson: siteForm.contactPerson || '',
      phone: siteForm.phone || '',
      remarks: siteForm.remarks || '',
    };

    if (editingId) {
      onUpdateSites(sites.map((s) => (s.id === editingId ? siteRecord : s)));
    } else {
      onUpdateSites([...sites, siteRecord]);
    }
    resetForms();
  };

  const handleDeleteRecord = (id: string, name: string) => {
    setDeleteCandidate({ id, name });
  };

  // ----------------- Filter Logic -----------------
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.company2 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.site2 || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (vehicleFilter === 'running') {
      return v.status === 'Active';
    }
    if (vehicleFilter === 'idle') {
      return v.status !== 'Active';
    }
    if (vehicleFilter === 'new') {
      const currentMonth = '2026-07';
      return v.joiningDate && v.joiningDate.startsWith(currentMonth);
    }
    return true;
  });

  const filteredOwners = owners.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Database Reconciliation Banner for Orphan Owners/Drivers */}
      {(owners.filter(o => !vehicles.some(v => v.ownerId === o.id)).length > 0 || 
        drivers.filter(d => !vehicles.some(v => v.driverId === d.id)).length > 0) && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 mt-0.5 sm:mt-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-850 uppercase tracking-wider">Unlinked Master Records Detected</h4>
              <p className="text-xs text-slate-600 mt-1">
                We found <span className="font-semibold text-amber-800">{owners.filter(o => !vehicles.some(v => v.ownerId === o.id)).length} Owner(s)</span> and <span className="font-semibold text-amber-800">{drivers.filter(d => !vehicles.some(v => v.driverId === d.id)).length} Driver(s)</span> with no active vehicles (from previously deleted vehicle records).
              </p>
            </div>
          </div>
          <button
            id="btn-reconcile-orphans"
            onClick={() => {
              const activeOwnerIds = new Set(vehicles.map((v) => v.ownerId).filter(Boolean));
              const activeDriverIds = new Set(vehicles.map((v) => v.driverId).filter(Boolean));
              onUpdateOwners(owners.filter((o) => activeOwnerIds.has(o.id)));
              onUpdateDrivers(drivers.filter((d) => activeDriverIds.has(d.id)));
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
          >
            <CheckCircle className="h-4 w-4" /> Clean Up & Sync Master Registers
          </button>
        </div>
      )}

      {/* View Header with Search and Insert button */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {activeSubView === 'Vehicle Master' && <Car className="text-blue-600" />}
            {activeSubView === 'Owner Master' && <Users className="text-blue-600" />}
            {activeSubView === 'Driver Master' && <Briefcase className="text-blue-600" />}
            {activeSubView === 'Company Master' && <Building className="text-blue-600" />}
            {activeSubView === 'Site Master' && <MapPin className="text-blue-600" />}
            {activeSubView} Register
          </h2>
          <p className="text-xs text-slate-500">Manage data, configure parameters, and review system settings</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="search-input"
              type="text"
              placeholder={`Search records...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          {activeSubView === 'Vehicle Master' && (
            <button
              id="btn-print-blank-vehicle-master"
              onClick={() => setPrintEnquiry(null)}
              className="px-4 py-2 text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
              title="Print blank vehicle joining form"
            >
              <Printer className="h-4 w-4 text-slate-500" /> Print Blank Form
            </button>
          )}
          {activeSubView === 'Vehicle Master' && vehicles.length > 0 && (
            <div className="relative flex items-center">
              {!showClearConfirm ? (
                <button
                  id="btn-clear-all-vehicles"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                  title="Remove all vehicles from register"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" /> Clear All Vehicles
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg shadow-sm">
                  <span className="text-2xs font-bold text-rose-800 px-2">Are you sure?</span>
                  <button
                    id="btn-confirm-clear-vehicles"
                    onClick={() => {
                      const ownerIdsToRemove = new Set(vehicles.map((v) => v.ownerId).filter(Boolean));
                      const driverIdsToRemove = new Set(vehicles.map((v) => v.driverId).filter(Boolean));
                      onUpdateOwners(owners.filter((o) => !ownerIdsToRemove.has(o.id)));
                      onUpdateDrivers(drivers.filter((d) => !driverIdsToRemove.has(d.id)));
                      onUpdateVehicles([]);
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-1 text-2xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors animate-pulse"
                  >
                    Yes, Delete All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 text-2xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            id="add-record-btn"
            onClick={() => {
              setIsAdding(true);
              setFormError(null);
            }}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Record
          </button>
        </div>
      </div>

      {/* Vehicle Filter Tabs Bar */}
      {activeSubView === 'Vehicle Master' && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider mr-2">Filter Fleet:</span>
          {(['all', 'running', 'idle', 'new'] as const).map((f) => {
            const label = f === 'all' ? 'Total Vehicles' : f === 'running' ? 'Running Vehicles' : f === 'idle' ? 'Idle Vehicles' : 'New (This Month)';
            const count = f === 'all' 
              ? vehicles.length 
              : f === 'running' 
                ? vehicles.filter(v => v.status === 'Active').length 
                : f === 'idle' 
                  ? vehicles.filter(v => v.status !== 'Active').length 
                  : vehicles.filter(v => v.joiningDate && v.joiningDate.startsWith('2026-07')).length;
            const isActive = vehicleFilter === f;
            return (
              <button
                id={`filter-tab-${f}`}
                key={f}
                onClick={() => onSetVehicleFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 border-blue-600 text-white shadow-3xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {label}
                <span className={`px-1.5 py-0.5 rounded-full text-3xs font-bold ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* CRUD / Insert / Editing Panels */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div ref={formRef} className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {editingId ? <Edit2 className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                  {editingId ? `Edit ${activeSubView.replace(' Master', '')} Details` : `Add New ${activeSubView.replace(' Master', '')} Record`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Please fill in the required fields below to save entry.</p>
              </div>
              <button
                type="button"
                onClick={resetForms}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div id="form-error" className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs border border-rose-200 rounded-lg flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* VEHICLE MASTER FORM */}
              {activeSubView === 'Vehicle Master' && (
            <form onSubmit={handleSaveVehicle} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Registration Number *</label>
                <input
                  id="field-registrationNumber"
                  type="text"
                  placeholder="e.g. TN-07-E7-1234"
                  value={vehicleForm.registrationNumber || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Manufacturer *</label>
                <input
                  id="field-manufacturer"
                  type="text"
                  value={vehicleForm.manufacturer || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Model *</label>
                <input
                  id="field-model"
                  type="text"
                  value={vehicleForm.model || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fuel Type</label>
                <select
                  id="field-fuelType"
                  value={vehicleForm.fuelType || 'Diesel'}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Type</label>
                <select
                  id="field-vehicleType"
                  value={vehicleForm.vehicleType || 'Sedan'}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {VEHICLE_TYPES.map((vt) => (
                    <option key={vt} value={vt}>
                      {vt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Associated Owner *</label>
                <select
                  id="field-ownerId"
                  value={vehicleForm.ownerId || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, ownerId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Owner --</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Driver *</label>
                <select
                  id="field-driverId"
                  value={vehicleForm.driverId || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company Client</label>
                <select
                  id="field-company"
                  value={vehicleForm.company || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, company: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Corporate Client --</option>
                  {companies.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company Client 2 (Optional)</label>
                <select
                  id="field-company2"
                  value={vehicleForm.company2 || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, company2: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Second Corporate Client --</option>
                  {companies.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Site</label>
                <select
                  id="field-site"
                  value={vehicleForm.site || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, site: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Site Campus --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Site 2 (Optional)</label>
                <select
                  id="field-site2"
                  value={vehicleForm.site2 || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, site2: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Second Site Campus --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">EMI Amount (₹)</label>
                <input
                  id="field-emiAmount"
                  type="number"
                  value={vehicleForm.emiAmount || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, emiAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">EMI Due Date</label>
                <input
                  id="field-emiDueDate"
                  type="date"
                  value={vehicleForm.emiDueDate || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, emiDueDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Insurance Expiry</label>
                <input
                  id="field-insuranceExpiry"
                  type="date"
                  value={vehicleForm.insuranceExpiry || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Permit Expiry</label>
                <input
                  id="field-permitExpiry"
                  type="date"
                  value={vehicleForm.permitExpiry || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, permitExpiry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">FC Expiry</label>
                <input
                  id="field-fcExpiry"
                  type="date"
                  value={vehicleForm.fcExpiry || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, fcExpiry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pollution Expiry</label>
                <input
                  id="field-pollutionExpiry"
                  type="date"
                  value={vehicleForm.pollutionExpiry || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, pollutionExpiry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">FASTag ID / Number</label>
                <input
                  id="field-fastagNumber"
                  type="text"
                  value={vehicleForm.fastagNumber || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, fastagNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Joining Date</label>
                <input
                  id="field-joiningDate"
                  type="date"
                  value={vehicleForm.joiningDate || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  id="field-status"
                  value={vehicleForm.status || 'Active'}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {VEHICLE_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Cycle</label>
                <select
                  id="field-paymentCycle"
                  value={vehicleForm.paymentCycle || 'Monthly'}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, paymentCycle: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Monthly">Monthly Payment</option>
                  <option value="Weekly">Weekly Payment</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <button
                  id="btn-save-vehicle"
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors mr-2"
                >
                  Save Vehicle
                </button>
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* OWNER MASTER FORM */}
          {activeSubView === 'Owner Master' && (
            <form onSubmit={handleSaveOwner} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Owner Name *</label>
                <input
                  id="field-owner-name"
                  type="text"
                  value={ownerForm.name || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                <input
                  id="field-owner-phone"
                  type="text"
                  value={ownerForm.phone || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  id="field-owner-email"
                  type="email"
                  value={ownerForm.email || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bank Name</label>
                <input
                  id="field-owner-bankName"
                  type="text"
                  value={ownerForm.bankName || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Account Number</label>
                <input
                  id="field-owner-accountNumber"
                  type="text"
                  value={ownerForm.accountNumber || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">IFSC Code</label>
                <input
                  id="field-owner-ifsc"
                  type="text"
                  value={ownerForm.ifsc || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, ifsc: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">UPI ID</label>
                <input
                  id="field-owner-upiId"
                  type="text"
                  value={ownerForm.upiId || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, upiId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">PAN Card</label>
                <input
                  id="field-owner-pan"
                  type="text"
                  value={ownerForm.pan || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, pan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Aadhaar Number</label>
                <input
                  id="field-owner-aadhaar"
                  type="text"
                  value={ownerForm.aadhaar || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, aadhaar: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Address</label>
                <textarea
                  id="field-owner-address"
                  value={ownerForm.address || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={2}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
                <input
                  id="field-owner-remarks"
                  type="text"
                  value={ownerForm.remarks || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Associated Car Number(s) (From Vehicle Master)</label>
                <input
                  type="text"
                  value={vehicles.filter(v => v.ownerId === ownerForm.id).map(v => v.registrationNumber).join(', ') || 'Unassigned'}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-semibold"
                />
              </div>
              <div className="md:col-span-3">
                <button
                  id="btn-save-owner"
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors mr-2"
                >
                  Save Owner Details
                </button>
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* DRIVER MASTER FORM */}
          {activeSubView === 'Driver Master' && (
            <form onSubmit={handleSaveDriver} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Driver Name *</label>
                <input
                  id="field-driver-name"
                  type="text"
                  value={driverForm.name || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                <input
                  id="field-driver-phone"
                  type="text"
                  value={driverForm.phone || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Licence Number *</label>
                <input
                  id="field-driver-licenceNumber"
                  type="text"
                  value={driverForm.licenceNumber || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, licenceNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Licence Expiry Date</label>
                <input
                  id="field-driver-licenceExpiry"
                  type="date"
                  value={driverForm.licenceExpiry || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, licenceExpiry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Syllabus Badge Number</label>
                <input
                  id="field-driver-badgeNumber"
                  type="text"
                  value={driverForm.badgeNumber || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, badgeNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Syllabus Badge Expiry</label>
                <input
                  id="field-driver-badgeExpiry"
                  type="date"
                  value={driverForm.badgeExpiry || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, badgeExpiry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Salary Base (₹)</label>
                <input
                  id="field-driver-salary"
                  type="number"
                  value={driverForm.salary || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, salary: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Driver Type *</label>
                <select
                  id="field-driver-driverType"
                  value={driverForm.driverType || 'Owner-Paid'}
                  onChange={(e) => setDriverForm({ ...driverForm, driverType: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Owner-Paid">Owner-Paid (Salary settled by Car Owner)</option>
                  <option value="Owner-cum-Driver">Owner-cum-Driver (Self-Owned Car Owner & Driver)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Aadhaar Card</label>
                <input
                  id="field-driver-aadhaar"
                  type="text"
                  value={driverForm.aadhaar || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, aadhaar: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">PAN Card</label>
                <input
                  id="field-driver-pan"
                  type="text"
                  value={driverForm.pan || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, pan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Info</label>
                <input
                  id="field-driver-emergencyContact"
                  type="text"
                  value={driverForm.emergencyContact || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Joining Date</label>
                <input
                  id="field-driver-joiningDate"
                  type="date"
                  value={driverForm.joiningDate || ''}
                  onChange={(e) => setDriverForm({ ...driverForm, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  id="field-driver-status"
                  value={driverForm.status || 'Active'}
                  onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Car Number(s) (From Vehicle Master)</label>
                <input
                  type="text"
                  value={vehicles.filter(v => v.driverId === driverForm.id).map(v => v.registrationNumber).join(', ') || 'Unassigned'}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-semibold"
                />
              </div>
              <div className="md:col-span-3">
                <button
                  id="btn-save-driver"
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors mr-2"
                >
                  Save Driver Partner
                </button>
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* COMPANY MASTER FORM */}
          {activeSubView === 'Company Master' && (
            <form onSubmit={handleSaveCompany} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company Name *</label>
                <input
                  id="field-company-name"
                  type="text"
                  value={companyForm.name || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Billing Cycle</label>
                <input
                  id="field-company-billingCycle"
                  type="text"
                  placeholder="e.g. Monthly"
                  value={companyForm.billingCycle || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, billingCycle: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Terms</label>
                <input
                  id="field-company-paymentTerms"
                  type="text"
                  placeholder="e.g. Net 30"
                  value={companyForm.paymentTerms || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contact Person</label>
                <input
                  id="field-company-contactPerson"
                  type="text"
                  value={companyForm.contactPerson || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input
                  id="field-company-phone"
                  type="text"
                  value={companyForm.phone || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  id="field-company-email"
                  type="email"
                  value={companyForm.email || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Billing Office Address</label>
                <textarea
                  id="field-company-address"
                  value={companyForm.address || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={2}
                />
              </div>
              <div className="md:col-span-3">
                <button
                  id="btn-save-company"
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors mr-2"
                >
                  Save Corporate Master
                </button>
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* SITE MASTER FORM */}
          {activeSubView === 'Site Master' && (
            <form onSubmit={handleSaveSite} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Site Name *</label>
                <input
                  id="field-site-name"
                  type="text"
                  value={siteForm.name || ''}
                  onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Corporate Client Name *</label>
                <select
                  id="field-site-companyName"
                  value={siteForm.companyName || ''}
                  onChange={(e) => setSiteForm({ ...siteForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Select Client --</option>
                  {companies.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Site Coordinator</label>
                <input
                  id="field-site-contactPerson"
                  type="text"
                  value={siteForm.contactPerson || ''}
                  onChange={(e) => setSiteForm({ ...siteForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Site Phone</label>
                <input
                  id="field-site-phone"
                  type="text"
                  value={siteForm.phone || ''}
                  onChange={(e) => setSiteForm({ ...siteForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Location Campus Address</label>
                <input
                  id="field-site-location"
                  type="text"
                  value={siteForm.location || ''}
                  onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="md:col-span-3">
                <button
                  id="btn-save-site"
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors mr-2"
                >
                  Save Campus Site
                </button>
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
            </div>
          </div>
        </div>
      )}

      {/* Registers Tabular Layout */}
      <div className="overflow-x-auto scrollbar-visible">
        {/* VEHICLE REGISTER TABLE */}
        {activeSubView === 'Vehicle Master' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Vehicle ID</th>
                <th className="py-3.5 px-4">Reg Number</th>
                <th className="py-3.5 px-4">Make / Model</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Fuel</th>
                <th className="py-3.5 px-4">Assigned Driver</th>
                <th className="py-3.5 px-4">Owner Name</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Cycle</th>
                <th className="py-3.5 px-4 text-center">Status Flag</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredVehicles.map((v) => {
                const badge = getVehicleExpiryStatus(v);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">{v.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{v.registrationNumber}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {v.manufacturer} {v.model}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{v.vehicleType}</td>
                    <td className="py-3 px-4 text-xs font-mono">{v.fuelType}</td>
                    <td className="py-3 px-4 text-slate-700">{v.driverName}</td>
                    <td className="py-3 px-4 text-slate-700">{v.ownerName}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-[160px]">
                      <div className="font-semibold text-slate-800" title={v.site ? `Site: ${v.site}` : undefined}>
                        {v.company || <span className="text-slate-300 italic">Unassigned</span>}
                        {v.site && <span className="text-[10px] text-slate-400 block font-normal">@{v.site}</span>}
                      </div>
                      {v.company2 && (
                        <div className="mt-1 pt-1 border-t border-dashed border-slate-100 text-[10px]" title={v.site2 ? `Site 2: ${v.site2}` : undefined}>
                          <span className="font-bold text-amber-600">Dual: </span>
                          <span className="font-semibold text-slate-700">{v.company2}</span>
                          {v.site2 && <span className="text-slate-400 block font-normal">@{v.site2}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.paymentCycle === 'Weekly' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {v.paymentCycle || 'Monthly'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 text-2xs font-semibold rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`btn-comments-vehicle-${v.id}`}
                          onClick={() => setActiveCommentTarget({
                            id: v.id,
                            name: `${v.registrationNumber} (${v.driverName})`,
                            type: 'Vehicle',
                            comments: v.comments || []
                          })}
                          className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer relative"
                          title="View / Add Comments"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {v.comments && v.comments.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">
                              {v.comments.length}
                            </span>
                          )}
                        </button>
                        <button
                          id={`btn-print-vehicle-${v.id}`}
                          onClick={() => setPrintEnquiry(mapVehicleToEnquiry(v))}
                          className="p-1 hover:bg-slate-100 text-emerald-600 rounded cursor-pointer"
                          title="Print Vehicle Joining Form"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-edit-vehicle-${v.id}`}
                          onClick={() => {
                            setEditingId(v.id);
                            const currentOwner = owners.find(o => o.id === v.ownerId);
                            const currentDriver = drivers.find(d => d.id === v.driverId);
                            setVehicleForm({
                              ...v,
                              ownerName: currentOwner ? currentOwner.name : v.ownerName,
                              driverName: currentDriver ? currentDriver.name : v.driverName
                            });
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-delete-vehicle-${v.id}`}
                          onClick={() => handleDeleteRecord(v.id, v.registrationNumber)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-400">
                    No vehicles found matching the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* OWNER REGISTER TABLE */}
        {activeSubView === 'Owner Master' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Owner ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Car Number</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Bank & Account</th>
                <th className="py-3.5 px-4">PAN Card</th>
                <th className="py-3.5 px-4">Aadhaar</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOwners.map((o) => {
                const linkedVehicles = vehicles.filter((v) => v.ownerId === o.id);
                const carNo = linkedVehicles.length > 0 ? linkedVehicles.map(v => v.registrationNumber).join(', ') : 'Unassigned';
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">{o.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{o.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-blue-600 font-semibold">{carNo}</td>
                    <td className="py-3 px-4 text-slate-700">{o.phone}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{o.email || '-'}</td>
                    <td className="py-3 px-4 text-xs">
                      {o.bankName ? `${o.bankName} - ${o.accountNumber}` : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{o.pan || '-'}</td>
                    <td className="py-3 px-4 font-mono text-xs">{o.aadhaar || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`btn-comments-owner-${o.id}`}
                          onClick={() => setActiveCommentTarget({
                            id: o.id,
                            name: o.name,
                            type: 'Owner',
                            comments: o.comments || []
                          })}
                          className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer relative"
                          title="View / Add Comments"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {o.comments && o.comments.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">
                              {o.comments.length}
                            </span>
                          )}
                        </button>
                        <button
                          id={`btn-edit-owner-${o.id}`}
                          onClick={() => {
                            setEditingId(o.id);
                            setOwnerForm(o);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-delete-owner-${o.id}`}
                          onClick={() => handleDeleteRecord(o.id, o.name)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOwners.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No owner partners registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* DRIVER REGISTER TABLE */}
        {activeSubView === 'Driver Master' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Driver ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Car Number</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Licence Details</th>
                <th className="py-3.5 px-4">Badge Number</th>
                <th className="py-3.5 px-4">Driver Type</th>
                <th className="py-3.5 px-4 text-right">Base Salary</th>
                <th className="py-3.5 px-4">Joining</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDrivers.map((d) => {
                const linkedVehicles = vehicles.filter((v) => v.driverId === d.id);
                const carNo = linkedVehicles.length > 0 ? linkedVehicles.map(v => v.registrationNumber).join(', ') : 'Unassigned';
                return (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">{d.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{d.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-blue-600 font-semibold">{carNo}</td>
                    <td className="py-3 px-4 text-slate-700">{d.phone}</td>
                    <td className="py-3 px-4 text-xs">
                      {d.licenceNumber} <span className="text-slate-400">({formatDate(d.licenceExpiry)})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{d.badgeNumber || '-'}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`px-2 py-0.5 text-2xs font-bold rounded border ${
                        d.driverType === 'Owner-cum-Driver'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        {d.driverType === 'Owner-cum-Driver' ? 'Owner-cum-Driver' : 'Owner-Paid'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">₹{d.salary.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{formatDate(d.joiningDate)}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-2xs font-semibold rounded-full ${
                          d.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`btn-comments-driver-${d.id}`}
                          onClick={() => setActiveCommentTarget({
                            id: d.id,
                            name: d.name,
                            type: 'Driver',
                            comments: d.comments || []
                          })}
                          className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer relative"
                          title="View / Add Comments"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {d.comments && d.comments.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">
                              {d.comments.length}
                            </span>
                          )}
                        </button>
                        <button
                          id={`btn-edit-driver-${d.id}`}
                          onClick={() => {
                            setEditingId(d.id);
                            setDriverForm(d);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-delete-driver-${d.id}`}
                          onClick={() => handleDeleteRecord(d.id, d.name)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    No active drivers registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* COMPANY REGISTER TABLE */}
        {activeSubView === 'Company Master' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Billing Cycle</th>
                <th className="py-3.5 px-4">Payment Terms</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCompanies.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                  <td className="py-3 px-4 text-slate-600">{c.billingCycle}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{c.paymentTerms}</td>
                  <td className="py-3 px-4 text-slate-700">{c.contactPerson}</td>
                  <td className="py-3 px-4 text-slate-700">{c.phone}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{c.email}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        id={`btn-comments-company-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => setActiveCommentTarget({
                          id: c.name,
                          name: c.name,
                          type: 'Company',
                          comments: c.comments || []
                        })}
                        className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer relative"
                        title="View / Add Comments"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {c.comments && c.comments.length > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">
                            {c.comments.length}
                          </span>
                        )}
                      </button>
                      <button
                        id={`btn-edit-company-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => {
                          setEditingId(c.name);
                          setCompanyForm(c);
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        id={`btn-delete-company-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => handleDeleteRecord(c.name, c.name)}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No corporate accounts registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* SITE REGISTER TABLE */}
        {activeSubView === 'Site Master' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Site ID</th>
                <th className="py-3.5 px-4">Site Campus Name</th>
                <th className="py-3.5 px-4">Associated Company</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Coordinator</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSites.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-slate-500">{s.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.name}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{s.companyName}</td>
                  <td className="py-3 px-4 text-slate-700 text-xs max-w-[200px] truncate">{s.location}</td>
                  <td className="py-3 px-4 text-slate-700">{s.contactPerson || '-'}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-xs">{s.phone || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        id={`btn-comments-site-${s.id}`}
                        onClick={() => setActiveCommentTarget({
                          id: s.id,
                          name: s.name,
                          type: 'Site',
                          comments: s.comments || []
                        })}
                        className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer relative"
                        title="View / Add Comments"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {s.comments && s.comments.length > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">
                            {s.comments.length}
                          </span>
                        )}
                      </button>
                      <button
                        id={`btn-edit-site-${s.id}`}
                        onClick={() => {
                          setEditingId(s.id);
                          setSiteForm(s);
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        id={`btn-delete-site-${s.id}`}
                        onClick={() => handleDeleteRecord(s.id, s.name)}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSites.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No operating sites registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {deleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteCandidate.name}"</span>?
                This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = deleteCandidate.id;
                  if (activeSubView === 'Vehicle Master') {
                    const vehicleToDelete = vehicles.find((v) => v.id === id);
                    if (vehicleToDelete) {
                      // Automatically delete the associated owner and driver
                      if (vehicleToDelete.ownerId) {
                        onUpdateOwners(owners.filter((o) => o.id !== vehicleToDelete.ownerId));
                      }
                      if (vehicleToDelete.driverId) {
                        onUpdateDrivers(drivers.filter((d) => d.id !== vehicleToDelete.driverId));
                      }
                    }
                    onUpdateVehicles(vehicles.filter((v) => v.id !== id));
                  } else if (activeSubView === 'Owner Master') {
                    onUpdateOwners(owners.filter((o) => o.id !== id));
                  } else if (activeSubView === 'Driver Master') {
                    onUpdateDrivers(drivers.filter((d) => d.id !== id));
                  } else if (activeSubView === 'Company Master') {
                    onUpdateCompanies(companies.filter((c) => c.name !== id));
                  } else if (activeSubView === 'Site Master') {
                    onUpdateSites(sites.filter((s) => s.id !== id));
                  }
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popover/Modal for Printing Forms from Master Register */}
      {printEnquiry !== undefined && (
        <PrintJoiningForm
          enquiry={printEnquiry}
          onClose={() => setPrintEnquiry(undefined)}
        />
      )}

      {/* Comments / Remarks Activity Log Modal */}
      {activeCommentTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-md uppercase tracking-wider mb-1 inline-block">
                  {activeCommentTarget.type} Comments
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeCommentTarget.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommentTarget(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Comments List (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {activeCommentTarget.comments && activeCommentTarget.comments.length > 0 ? (
                <div className="space-y-3">
                  {activeCommentTarget.comments.map((c, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-lg border border-slate-200/60 shadow-3xs text-left">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
                          {c.author}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <MessageSquare className="h-8 w-8 mx-auto text-slate-300 stroke-1" />
                  <div>
                    <p className="text-xs font-semibold text-slate-600">No comments posted yet</p>
                    <p className="text-4xs uppercase tracking-wider text-slate-400 mt-0.5">Be the first to leave a remark or follow-up note</p>
                  </div>
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-slate-150 bg-white">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Add Follow-up Comment / Log Remark</label>
              <div className="flex gap-2">
                <textarea
                  required
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type important update details or observations..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-all flex items-center self-end shadow-xs cursor-pointer"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
