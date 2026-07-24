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
  FileCheck,
  CheckCircle2,
  Radio,
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
import PrintVehicleReport from './PrintVehicleReport';
import PrintLetterpadSubmissionSlip from './PrintLetterpadSubmissionSlip';
import { getVendorBadge, VENDOR_SITE_MAP } from './Settings';

interface MasterViewsProps {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  companies: Company[];
  sites: Site[];
  activeSubView: 'Vehicle Master' | 'Owner Master' | 'Driver Master' | 'Company Master' | 'Site Master' | 'Vendor Register';
  vehicleFilter?: 'all' | 'running' | 'idle' | 'new' | 'doc_pending' | 'doc_submitted' | 'gps_hold';
  onSetVehicleFilter?: (filter: 'all' | 'running' | 'idle' | 'new' | 'doc_pending' | 'doc_submitted' | 'gps_hold') => void;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; name: string } | null>(null);
  const [printEnquiry, setPrintEnquiry] = useState<Enquiry | null | undefined>(undefined);
  const [showPrintVehicleReport, setShowPrintVehicleReport] = useState(false);
  const [selectedVendorForFleet, setSelectedVendorForFleet] = useState<string | null>(null);
  const [vendorModalSearch, setVendorModalSearch] = useState('');
  
  // Office Document Submission & Letterpad Modal States
  const [docModalVehicle, setDocModalVehicle] = useState<Vehicle | null>(null);
  const [docModalForm, setDocModalForm] = useState({
    officeDocSubmitted: false,
    officeDocSubmitDate: new Date().toISOString().substring(0, 10),
    officeDocVendorCompany: '',
    officeDocLetterpadRef: '',
    officeDocRemarks: '',
    officeDocChecklist: {
      rc: true,
      insurance: true,
      permit: true,
      pollution: true,
      aadhaarCard: true,
      policeVerification: true,
      drivingLicense: true,
      medicalCertificate: true,
    },
  });
  const [showPrintLetterpadModal, setShowPrintLetterpadModal] = useState<Vehicle | null>(null);

  // GPS Device Removal & Payment Release Modal States
  const [gpsModalVehicle, setGpsModalVehicle] = useState<Vehicle | null>(null);
  const [gpsModalForm, setGpsModalForm] = useState({
    gpsVendor: '',
    gpsImei: '',
    gpsReturned: false,
    gpsReturnDate: new Date().toISOString().substring(0, 10),
    gpsReturnedBy: 'Office Admin',
    gpsReturnRemarks: '',
  });
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

    if (v.status === 'Inactive') {
      const hasGps = !!(v.gpsVendor || v.gpsImei || v.gpsFittingDate);
      if (hasGps && !v.gpsReturned) {
        return { label: '🚨 Payment Held (GPS Pending Return)', color: 'bg-rose-100 text-rose-900 border-rose-400 font-extrabold animate-pulse' };
      }
      if (hasGps && v.gpsReturned) {
        return { label: 'Inactive (GPS Returned)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' };
      }
      return { label: 'Inactive', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
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
      officeDocSubmitted: vehicleForm.officeDocSubmitted || false,
      officeDocSubmitDate: vehicleForm.officeDocSubmitDate || '',
      officeDocVendorCompany: vehicleForm.officeDocVendorCompany || vehicleForm.company || '',
      officeDocLetterpadRef: vehicleForm.officeDocLetterpadRef || '',
      officeDocRemarks: vehicleForm.officeDocRemarks || '',
      officeDocChecklist: vehicleForm.officeDocChecklist,
      gpsVendor: vehicleForm.gpsVendor || '',
      gpsImei: vehicleForm.gpsImei || '',
      gpsFittingDate: vehicleForm.gpsFittingDate || '',
      gpsReturned: vehicleForm.status === 'Inactive' ? (vehicleForm.gpsReturned ?? false) : (vehicleForm.gpsReturned ?? true),
      gpsReturnDate: vehicleForm.gpsReturnDate || '',
      gpsReturnRemarks: vehicleForm.gpsReturnRemarks || '',
      gpsReturnedBy: vehicleForm.gpsReturnedBy || '',
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

    const siteName = (companyForm.companySite || companyForm.name || '').trim();
    if (!siteName) {
      setFormError('Company Site Name is mandatory.');
      return;
    }

    const companyRecord: Company = {
      name: siteName,
      vendorName: (companyForm.vendorName || 'ECO').trim(),
      companySite: siteName,
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

    const siteName = siteForm.name?.trim();
    if (!siteName) {
      setFormError('Site Hub Name is mandatory.');
      return;
    }

    const assignedCompany = siteForm.companyName || companies[0]?.name || 'Direct';

    const siteRecord: Site = {
      id: siteForm.id || `S${(sites.length + 1).toString().padStart(2, '0')}`,
      name: siteName,
      companyName: assignedCompany,
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
    if (vehicleFilter === 'doc_pending') {
      return !v.officeDocSubmitted;
    }
    if (vehicleFilter === 'doc_submitted') {
      return !!v.officeDocSubmitted;
    }
    if (vehicleFilter === 'gps_hold') {
      return v.status === 'Inactive' && (!!v.gpsVendor || !!v.gpsImei || !!v.gpsFittingDate) && !v.gpsReturned;
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
      (c.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.companySite || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Vendor Register Calculation Logic
  const PRESET_VENDORS = ['FIESTA', 'ECO', 'FOURWAY', 'ROVER FLEET', 'R6 MARS', 'ATHENA', 'SELECT CABS'];
  const customVendorsList = companies
    .map((c) => {
      let raw = (c.vendorName || 'ECO').trim().toUpperCase();
      if (raw === 'ATHEA' || raw === 'ATHENA TRAVELS') raw = 'ATHENA';
      if (raw === 'ROVER' || raw === 'REFEX') raw = 'ROVER FLEET';
      return raw;
    })
    .filter(Boolean);
  const allVendorsList = Array.from(new Set([...PRESET_VENDORS, ...customVendorsList])).sort();

  // Create a map of company site / name to vendor name
  const companyToVendorMap = new Map<string, string>();
  companies.forEach((c) => {
    let vName = (c.vendorName || 'ECO').trim().toUpperCase();
    if (vName === 'ATHEA' || vName === 'ATHENA TRAVELS') vName = 'ATHENA';
    if (vName === 'ROVER' || vName === 'REFEX') vName = 'ROVER FLEET';
    if (c.name) companyToVendorMap.set(c.name.trim().toLowerCase(), vName);
    if (c.companySite) companyToVendorMap.set(c.companySite.trim().toLowerCase(), vName);
  });

  // Map predefined VENDOR_SITE_MAP
  Object.entries(VENDOR_SITE_MAP).forEach(([vendor, siteList]) => {
    siteList.forEach((s) => {
      if (!companyToVendorMap.has(s.toLowerCase())) {
        companyToVendorMap.set(s.toLowerCase(), vendor.toUpperCase());
      }
    });
  });

  const allMasterClients = Array.from(
    new Set([
      ...companies.map((c) => (c.name || c.companySite || '').trim().toUpperCase()).filter(Boolean),
      'WALMART', 'CTS', 'OPTUM', 'OMEGA', 'TCS', 'COMCAST', 'CGI', 'MED EXPERT', 'BARCLAYS', 'EXL', 'WORKDAY', 'REFEX', 'RR DONNELLEY', 'STATE STREET', 'AMAZON'
    ])
  ).sort();

  // Calculate stats for each vendor
  const vendorCalculations = allVendorsList.map((vendorName) => {
    const vendorUpper = vendorName.toUpperCase();

    // Associated companies in master
    const vendorCompanies = companies.filter((c) => {
      const vName = (c.vendorName || 'ECO').trim().toUpperCase();
      if (vName === vendorUpper) return true;
      const mappedSites = VENDOR_SITE_MAP[vendorUpper] || [];
      return (
        mappedSites.includes(c.name.toUpperCase()) ||
        (c.companySite && mappedSites.includes(c.companySite.toUpperCase()))
      );
    });

    const vendorCompanyNamesSet = new Set([
      ...vendorCompanies.map((c) => c.name.toLowerCase()),
      ...vendorCompanies.map((c) => (c.companySite || '').toLowerCase()).filter(Boolean),
      ...(VENDOR_SITE_MAP[vendorUpper] || []).map((s) => s.toLowerCase()),
    ]);

    // Find attached vehicles
    const attachedVehicles = vehicles.filter((v) => {
      const vComp = (v.company || '').trim().toLowerCase();
      const vSite = (v.site || '').trim().toLowerCase();
      const vComp2 = (v.company2 || '').trim().toLowerCase();
      const vSite2 = (v.site2 || '').trim().toLowerCase();

      // Check if mapped in companyToVendorMap
      const mappedV =
        companyToVendorMap.get(vComp) ||
        companyToVendorMap.get(vSite) ||
        companyToVendorMap.get(vComp2) ||
        companyToVendorMap.get(vSite2);

      if (mappedV === vendorUpper) return true;

      // Direct site name match
      if (
        vendorCompanyNamesSet.has(vComp) ||
        vendorCompanyNamesSet.has(vSite) ||
        vendorCompanyNamesSet.has(vComp2) ||
        vendorCompanyNamesSet.has(vSite2)
      ) {
        return true;
      }

      // Direct text inclusion check
      if (
        (vComp && vComp.includes(vendorName.toLowerCase())) ||
        (vSite && vSite.includes(vendorName.toLowerCase()))
      ) {
        return true;
      }

      return false;
    });

    const runningVehicles = attachedVehicles.filter((v) => v.status !== 'Inactive');
    const idleVehicles = attachedVehicles.filter((v) => v.status === 'Inactive');

    // Vehicle types breakdown for running vehicles
    const runningVehicleTypes: Record<string, number> = {};
    runningVehicles.forEach((v) => {
      const t = v.vehicleType || 'Other';
      runningVehicleTypes[t] = (runningVehicleTypes[t] || 0) + 1;
    });

    const clientSitesList = Array.from(
      new Set([
        ...vendorCompanies.map((c) => c.companySite || c.name),
        ...(VENDOR_SITE_MAP[vendorUpper] || []),
      ])
    ).filter(Boolean);

    return {
      vendorName,
      companies: vendorCompanies,
      clientSites: clientSitesList,
      attachedVehicles,
      runningVehicles,
      idleVehicles,
      runningCount: runningVehicles.length,
      idleCount: idleVehicles.length,
      totalCount: attachedVehicles.length,
      runningVehicleTypes,
      utilizationRate:
        attachedVehicles.length > 0
          ? Math.round((runningVehicles.length / attachedVehicles.length) * 100)
          : 0,
    };
  });

  // Keep ONLY available vendors (those with active master companies or attached vehicles)
  const availableVendorCalculations = vendorCalculations.filter(
    (v) => v.companies.length > 0 || v.attachedVehicles.length > 0
  );

  const filteredVendors = availableVendorCalculations.filter((v) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      v.vendorName.toLowerCase().includes(q) ||
      v.clientSites.some((s) => s.toLowerCase().includes(q)) ||
      v.runningVehicles.some(
        (veh) =>
          veh.registrationNumber.toLowerCase().includes(q) ||
          veh.driverName.toLowerCase().includes(q) ||
          veh.ownerName.toLowerCase().includes(q)
      )
    );
  });

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
            {activeSubView === 'Vendor Register' && <Building className="text-amber-600" />}
            {activeSubView === 'Vendor Register' ? 'Vendor Register' : `${activeSubView} Register`}
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
            <>
              <button
                id="btn-print-blank-vehicle-master"
                onClick={() => setPrintEnquiry(null)}
                className="px-4 py-2 text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                title="Print blank vehicle joining form"
              >
                <Printer className="h-4 w-4 text-slate-500" /> Print Blank Form
              </button>
              <button
                id="btn-print-vehicle-report-master"
                onClick={() => setShowPrintVehicleReport(true)}
                className="px-4 py-2 text-sm font-semibold bg-blue-50 hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                title="Print vehicle register report with active filters"
              >
                <Printer className="h-4 w-4 text-blue-600" /> Print Report
              </button>
            </>
          )}
          <button
            id="add-record-btn"
            onClick={() => {
              setIsAdding(true);
              setFormError(null);
            }}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> {activeSubView === 'Site Master' ? 'Add Campus Site / Hub' : 'Add Record'}
          </button>
        </div>
      </div>

      {/* Vehicle Filter Tabs Bar */}
      {activeSubView === 'Vehicle Master' && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider mr-2">Filter Fleet:</span>
          {(['all', 'running', 'doc_pending', 'doc_submitted', 'gps_hold', 'idle', 'new'] as const).map((f) => {
            const label = f === 'all' 
              ? 'Total Vehicles' 
              : f === 'running' 
                ? 'Running Vehicles' 
                : f === 'doc_pending'
                  ? '📄 Office Doc Pending'
                  : f === 'doc_submitted'
                    ? '✅ Office Doc Submitted'
                    : f === 'gps_hold'
                      ? '🚨 GPS Payment Hold'
                      : f === 'idle' 
                        ? 'Inactive Vehicles' 
                        : 'New (This Month)';
            const count = f === 'all' 
              ? vehicles.length 
              : f === 'running' 
                ? vehicles.filter(v => v.status === 'Active').length 
                : f === 'doc_pending'
                  ? vehicles.filter(v => !v.officeDocSubmitted).length
                  : f === 'doc_submitted'
                    ? vehicles.filter(v => !!v.officeDocSubmitted).length
                    : f === 'gps_hold'
                      ? vehicles.filter(v => v.status === 'Inactive' && (!!v.gpsVendor || !!v.gpsImei || !!v.gpsFittingDate) && !v.gpsReturned).length
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
                    ? f === 'doc_pending' || f === 'gps_hold'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-3xs'
                      : f === 'doc_submitted'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xs'
                        : 'bg-blue-600 border-blue-600 text-white shadow-3xs'
                    : f === 'gps_hold' && count > 0
                      ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 font-bold animate-pulse'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {label}
                <span className={`px-1.5 py-0.5 rounded-full text-3xs font-bold ${
                  isActive 
                    ? 'bg-black/20 text-white' 
                    : f === 'doc_pending' && count > 0 
                      ? 'bg-rose-100 text-rose-700'
                      : f === 'doc_submitted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
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
                  {owners.map((o, index) => (
                    <option key={`${o.id}-${index}`} value={o.id}>
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
                  {drivers.map((d, index) => (
                    <option key={`${d.id}-${index}`} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Client</label>
                <select
                  id="field-company"
                  value={vehicleForm.company || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, company: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="">-- Choose Corporate Client --</option>
                  {allMasterClients.map((clientName) => {
                    const matched = companies.find((c) => c.name === clientName || c.companySite === clientName);
                    const vendor = matched?.vendorName || companyToVendorMap.get(clientName.toLowerCase());
                    return (
                      <option key={clientName} value={clientName}>
                        {clientName} {vendor ? `(Vendor: ${vendor})` : ''}
                      </option>
                    );
                  })}
                  {vehicleForm.company && !allMasterClients.includes(vehicleForm.company.toUpperCase()) && (
                    <option value={vehicleForm.company}>{vehicleForm.company} (Custom Client)</option>
                  )}
                </select>
                <div className="mt-1 flex flex-wrap gap-1">
                  {allMasterClients.slice(0, 7).map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => setVehicleForm({ ...vehicleForm, company: cName })}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                        vehicleForm.company === cName
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cName}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Client 2 (Optional)</label>
                <select
                  id="field-company2"
                  value={vehicleForm.company2 || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, company2: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="">-- Choose Second Corporate Client --</option>
                  {allMasterClients.map((clientName) => {
                    const matched = companies.find((c) => c.name === clientName || c.companySite === clientName);
                    const vendor = matched?.vendorName || companyToVendorMap.get(clientName.toLowerCase());
                    return (
                      <option key={clientName} value={clientName}>
                        {clientName} {vendor ? `(Vendor: ${vendor})` : ''}
                      </option>
                    );
                  })}
                  {vehicleForm.company2 && !allMasterClients.includes(vehicleForm.company2.toUpperCase()) && (
                    <option value={vehicleForm.company2}>{vehicleForm.company2} (Custom Client)</option>
                  )}
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

              {/* GPS DEVICE CONFIGURATION & REMOVAL TRACKING */}
              <div className="md:col-span-3 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-indigo-600" />
                    GPS Tracking Hardware Details
                  </span>
                  {vehicleForm.gpsVendor && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                      GPS Installed ({vehicleForm.gpsVendor})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">GPS Vendor / Provider</label>
                    <input
                      id="field-gpsVendor"
                      type="text"
                      placeholder="e.g. Autoplant GPS, Fiesta GPS, Fleetx"
                      value={vehicleForm.gpsVendor || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, gpsVendor: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">GPS Device IMEI No.</label>
                    <input
                      id="field-gpsImei"
                      type="text"
                      placeholder="15-digit IMEI number"
                      value={vehicleForm.gpsImei || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, gpsImei: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">GPS Fitting Date</label>
                    <input
                      id="field-gpsFittingDate"
                      type="date"
                      value={vehicleForm.gpsFittingDate || ''}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, gpsFittingDate: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                {/* INACTIVE VEHICLE GPS REMOVAL PROTOCOL */}
                {vehicleForm.status === 'Inactive' && (
                  <div className={`p-3 rounded-lg border text-xs space-y-2.5 transition-all ${
                    !vehicleForm.gpsReturned && (vehicleForm.gpsVendor || vehicleForm.gpsImei)
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${!vehicleForm.gpsReturned ? 'text-rose-600 animate-bounce' : 'text-emerald-600'}`} />
                      <div className="flex-1">
                        <p className="font-extrabold uppercase tracking-wide text-2xs">
                          {!vehicleForm.gpsReturned ? '🚨 Payment Held - GPS Device Removal & Return Required' : '✅ GPS Device Returned & Payment Unblocked'}
                        </p>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          {!vehicleForm.gpsReturned
                            ? 'Vehicle is set to Inactive. As per company rules, the installed GPS unit must be removed and returned to the office. Payments will remain ON HOLD until GPS return is recorded.'
                            : 'GPS device removal has been verified and recorded. Vehicle payments can proceed as per policy.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                      <label className="sm:col-span-3 flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={!!vehicleForm.gpsReturned}
                          onChange={(e) => setVehicleForm({
                            ...vehicleForm,
                            gpsReturned: e.target.checked,
                            gpsReturnDate: e.target.checked ? (vehicleForm.gpsReturnDate || new Date().toISOString().substring(0, 10)) : ''
                          })}
                          className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <span className="font-bold text-slate-800 text-2xs uppercase">
                          Confirm: GPS Hardware Unit Removed and Handed Over to Office
                        </span>
                      </label>

                      {vehicleForm.gpsReturned && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">GPS Return Date</label>
                            <input
                              type="date"
                              value={vehicleForm.gpsReturnDate || ''}
                              onChange={(e) => setVehicleForm({ ...vehicleForm, gpsReturnDate: e.target.value })}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Received / Handled By</label>
                            <input
                              type="text"
                              placeholder="e.g. Office Admin / Garage Manager"
                              value={vehicleForm.gpsReturnedBy || ''}
                              onChange={(e) => setVehicleForm({ ...vehicleForm, gpsReturnedBy: e.target.value })}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Return Remarks</label>
                            <input
                              type="text"
                              placeholder="e.g. Handed over device at Navalur office"
                              value={vehicleForm.gpsReturnRemarks || ''}
                              onChange={(e) => setVehicleForm({ ...vehicleForm, gpsReturnRemarks: e.target.value })}
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
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
          {(activeSubView === 'Company Master' || activeSubView === 'Site Master' || activeSubView === 'Vendor Register') && (
            <form onSubmit={handleSaveCompany} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vendor Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor Name *</label>
                <input
                  id="field-company-vendorName"
                  type="text"
                  placeholder="e.g. ECO, ATHENA, FIESTA, ROVER FLEET"
                  value={companyForm.vendorName || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, vendorName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {['ATHENA', 'ECO', 'FIESTA', 'FOURWAY', 'R6 MARS', 'ROVER FLEET', 'SELECT CABS'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCompanyForm({ ...companyForm, vendorName: v })}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        (companyForm.vendorName || '').toUpperCase() === v
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Site */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Site *</label>
                <input
                  id="field-company-site"
                  type="text"
                  placeholder="e.g. Comcast - SEZ Campus"
                  value={companyForm.companySite || companyForm.name || ''}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      companySite: e.target.value,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-800"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Specify Corporate Client & Operating Site Campus</p>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Billing Cycle *</label>
                <select
                  id="field-company-billingCycle"
                  value={companyForm.billingCycle || 'Monthly'}
                  onChange={(e) => setCompanyForm({ ...companyForm, billingCycle: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="15 Days">15 Days</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Person</label>
                <input
                  id="field-company-contactPerson"
                  type="text"
                  placeholder="Name of Coordinator / Manager"
                  value={companyForm.contactPerson || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  id="field-company-phone"
                  type="text"
                  placeholder="Contact Phone Number"
                  value={companyForm.phone || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  id="field-company-email"
                  type="email"
                  placeholder="Corporate Email"
                  value={companyForm.email || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Vendor Address */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor Address</label>
                <textarea
                  id="field-company-address"
                  placeholder="Office / Vendor Address"
                  value={companyForm.address || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={2}
                />
              </div>

              <div className="md:col-span-3 flex items-center gap-2">
                <button
                  id="btn-save-company"
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingId ? 'Update Company Master' : 'Save Company Master'}
                </button>
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
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
                <th className="py-3.5 px-4 text-center">Office Doc (Letterpad)</th>
                <th className="py-3.5 px-4 text-center">Status Flag</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredVehicles.map((v, index) => {
                const badge = getVehicleExpiryStatus(v);
                return (
                  <tr key={`${v.id}-${index}`} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">{v.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{v.registrationNumber}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {v.manufacturer} {v.model}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{v.vehicleType}</td>
                    <td className="py-3 px-4 text-xs font-mono">{v.fuelType}</td>
                    <td className="py-3 px-4 text-slate-700">{v.driverName}</td>
                    <td className="py-3 px-4 text-slate-700">{v.ownerName}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-[180px]">
                      <div className="font-bold text-slate-900 flex flex-col gap-0.5" title={v.site ? `Site: ${v.site}` : undefined}>
                        <span>{v.company || <span className="text-slate-300 italic font-normal">Unassigned</span>}</span>
                        {v.company && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {(() => {
                              const vendorName = companyToVendorMap.get(v.company.trim().toLowerCase()) || companies.find((c) => c.name === v.company || c.companySite === v.company)?.vendorName;
                              return vendorName ? (
                                <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tight">
                                  Vendor: {vendorName}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Unlisted
                                </span>
                              );
                            })()}
                          </div>
                        )}
                        {v.site && <span className="text-[10px] text-slate-400 font-normal">@{v.site}</span>}
                      </div>
                      {v.company2 && (
                        <div className="mt-1 pt-1 border-t border-dashed border-slate-200 text-[10px]" title={v.site2 ? `Site 2: ${v.site2}` : undefined}>
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
                      {v.officeDocSubmitted ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDocModalVehicle(v);
                              setDocModalForm({
                                officeDocSubmitted: true,
                                officeDocSubmitDate: v.officeDocSubmitDate || new Date().toISOString().substring(0, 10),
                                officeDocVendorCompany: v.officeDocVendorCompany || v.company || '',
                                officeDocLetterpadRef: v.officeDocLetterpadRef || '',
                                officeDocRemarks: v.officeDocRemarks || '',
                                officeDocChecklist: {
                                  rc: v.officeDocChecklist?.rc ?? true,
                                  insurance: v.officeDocChecklist?.insurance ?? true,
                                  permit: v.officeDocChecklist?.permit ?? true,
                                  pollution: v.officeDocChecklist?.pollution ?? true,
                                  aadhaarCard: v.officeDocChecklist?.aadhaarCard ?? true,
                                  policeVerification: v.officeDocChecklist?.policeVerification ?? true,
                                  drivingLicense: v.officeDocChecklist?.drivingLicense ?? true,
                                  medicalCertificate: v.officeDocChecklist?.medicalCertificate ?? true,
                                },
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors cursor-pointer shadow-3xs"
                            title={`Submitted to ${v.officeDocVendorCompany || v.company || 'Office'} on ${v.officeDocSubmitDate || 'N/A'}`}
                          >
                            <FileCheck className="h-3 w-3 text-emerald-600" />
                            <span>Submitted</span>
                          </button>
                          {v.officeDocLetterpadRef && (
                            <span className="text-[9px] font-mono font-bold text-slate-500">
                              {v.officeDocLetterpadRef}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDocModalVehicle(v);
                              setDocModalForm({
                                officeDocSubmitted: false,
                                officeDocSubmitDate: new Date().toISOString().substring(0, 10),
                                officeDocVendorCompany: v.officeDocVendorCompany || v.company || 'Fiesta',
                                officeDocLetterpadRef: `LP-${(v.company || 'OFFICE').replace(/[^A-Z]/gi, '').slice(0, 6).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                                officeDocRemarks: 'Document package and letterpad pending for vendor office submission.',
                                officeDocChecklist: {
                                  rc: v.officeDocChecklist?.rc ?? true,
                                  insurance: v.officeDocChecklist?.insurance ?? true,
                                  permit: v.officeDocChecklist?.permit ?? true,
                                  pollution: v.officeDocChecklist?.pollution ?? true,
                                  aadhaarCard: v.officeDocChecklist?.aadhaarCard ?? true,
                                  policeVerification: v.officeDocChecklist?.policeVerification ?? true,
                                  drivingLicense: v.officeDocChecklist?.drivingLicense ?? true,
                                  medicalCertificate: v.officeDocChecklist?.medicalCertificate ?? true,
                                },
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-full transition-colors cursor-pointer animate-pulse shadow-3xs"
                            title="Click to record Office Document Submission"
                          >
                            <AlertTriangle className="h-3 w-3 text-rose-600" />
                            <span>Doc Pending</span>
                          </button>
                          <span className="text-[9px] text-slate-400">Letterpad Req</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (v.status === 'Inactive' && (v.gpsVendor || v.gpsImei || v.gpsFittingDate)) {
                              setGpsModalVehicle(v);
                              setGpsModalForm({
                                gpsVendor: v.gpsVendor || '',
                                gpsImei: v.gpsImei || '',
                                gpsReturned: !!v.gpsReturned,
                                gpsReturnDate: v.gpsReturnDate || new Date().toISOString().substring(0, 10),
                                gpsReturnedBy: v.gpsReturnedBy || 'Office Admin',
                                gpsReturnRemarks: v.gpsReturnRemarks || '',
                              });
                            }
                          }}
                          className={`inline-flex items-center justify-center px-3 py-1 text-2xs font-bold rounded-full border ${badge.color} leading-none align-middle ${
                            v.status === 'Inactive' && (v.gpsVendor || v.gpsImei || v.gpsFittingDate) ? 'cursor-pointer hover:scale-105 transition-transform shadow-3xs' : ''
                          }`}
                          title={v.status === 'Inactive' && (v.gpsVendor || v.gpsImei || v.gpsFittingDate) ? 'Click to manage GPS Device Return & Payment Release' : undefined}
                        >
                          {badge.label}
                        </button>
                        
                        {(v.gpsVendor || v.gpsImei) && (
                          <span className={`text-[9px] font-mono flex items-center gap-0.5 ${
                            v.status === 'Inactive' && !v.gpsReturned ? 'text-rose-600 font-extrabold' : 'text-slate-500'
                          }`}>
                            <Radio className="h-2.5 w-2.5 text-indigo-500 inline shrink-0" />
                            {v.gpsVendor || 'GPS'} {v.status === 'Inactive' ? (v.gpsReturned ? '(Returned)' : '🚨 HELD') : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`btn-letterpad-slip-${v.id}`}
                          onClick={() => setShowPrintLetterpadModal(v)}
                          className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                          title="Print Vendor Office Letterpad Submission Slip"
                        >
                          <FileCheck className="h-4 w-4" />
                        </button>
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
              {filteredOwners.map((o, index) => {
                const linkedVehicles = vehicles.filter((v) => v.ownerId === o.id);
                const carNo = linkedVehicles.length > 0 ? linkedVehicles.map(v => v.registrationNumber).join(', ') : 'Unassigned';
                return (
                  <tr key={`${o.id}-${index}`} className="hover:bg-slate-50/50">
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
              {filteredDrivers.map((d, index) => {
                const linkedVehicles = vehicles.filter((v) => v.driverId === d.id);
                const carNo = linkedVehicles.length > 0 ? linkedVehicles.map(v => v.registrationNumber).join(', ') : 'Unassigned';
                return (
                  <tr key={`${d.id}-${index}`} className="hover:bg-slate-50/50">
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
                        className={`inline-flex items-center justify-center px-3 py-1 text-2xs font-bold rounded-full border ${
                          d.status === 'Active'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        } leading-none align-middle`}
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
        {(activeSubView === 'Company Master' || activeSubView === 'Site Master') && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Vendor Name</th>
                <th className="py-3.5 px-4">Company Site</th>
                <th className="py-3.5 px-4">Billing Cycle</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Vendor Address</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCompanies.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">{getVendorBadge(c.vendorName || 'ECO')}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{c.companySite || c.name}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {c.billingCycle || c.paymentTerms || 'Monthly'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{c.contactPerson || '-'}</td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-xs">{c.phone || '-'}</td>
                  <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={c.address}>
                    {c.address || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        id={`btn-comments-company-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() =>
                          setActiveCommentTarget({
                            id: c.name,
                            name: c.companySite || c.name,
                            type: 'Company',
                            comments: c.comments || [],
                          })
                        }
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
                          setCompanyForm({
                            ...c,
                            vendorName: c.vendorName || 'ECO',
                            companySite: c.companySite || c.name,
                          });
                          setIsAdding(true);
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                        title="Edit Company record"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        id={`btn-delete-company-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => handleDeleteRecord(c.name, c.companySite || c.name)}
                        className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                        title="Delete Company record"
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
                    No company master records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* VENDOR REGISTER VIEW */}
        {activeSubView === 'Vendor Register' && (
          <div className="p-6 space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Total Registered Vendors */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-xs border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Vendors</span>
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                    <Building className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-black tracking-tight">{availableVendorCalculations.length}</div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle className="h-3 w-3 text-emerald-400" /> Active Vendor Network
                </div>
              </div>

              {/* KPI 2: Total Active Running Vehicles */}
              <div className="bg-emerald-50 text-emerald-950 p-4 rounded-xl shadow-xs border border-emerald-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Running Vehicles</span>
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Car className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-900 tracking-tight">
                  {availableVendorCalculations.reduce((acc, v) => acc + v.runningCount, 0)}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  Active in Vendors ({vehicles.length > 0 ? Math.round((availableVendorCalculations.reduce((acc, v) => acc + v.runningCount, 0) / vehicles.length) * 100) : 0}% Fleet Utilization)
                </div>
              </div>

              {/* KPI 3: Total Idle Vehicles */}
              <div className="bg-amber-50 text-amber-950 p-4 rounded-xl shadow-xs border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Idle / Standby Vehicles</span>
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-900 tracking-tight">
                  {availableVendorCalculations.reduce((acc, v) => acc + v.idleCount, 0)}
                </div>
                <div className="text-[10px] text-amber-700 font-bold mt-1">
                  Inactive / Standby Vehicles
                </div>
              </div>

              {/* KPI 4: Top Vendor Fleet */}
              <div className="bg-blue-50 text-blue-950 p-4 rounded-xl shadow-xs border border-blue-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Top Fleet Vendor</span>
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Briefcase className="h-5 w-5" />
                  </div>
                </div>
                {(() => {
                  const top = [...availableVendorCalculations].sort((a, b) => b.runningCount - a.runningCount)[0];
                  return (
                    <div>
                      <div className="text-base font-black text-blue-900 tracking-tight truncate flex items-center gap-1.5">
                        {top ? getVendorBadge(top.vendorName) : 'N/A'}
                      </div>
                      <div className="text-[10px] text-blue-700 font-bold mt-1">
                        {top ? `${top.runningCount} Active Running Vehicles` : 'No data'}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Vendor Summary Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                    <Building className="h-4 w-4 text-amber-600" /> Vendor Fleet & Running Vehicles Calculations Register
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Calculated vehicle count per vendor including active running fleet and site distributions
                  </p>
                </div>
                <span className="text-2xs font-extrabold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-3xs">
                  {filteredVendors.length} Vendors Listed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/90 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Vendor Name</th>
                      <th className="py-3.5 px-4">Operating Sites & Corporate Clients</th>
                      <th className="py-3.5 px-4 text-center">Total Attached</th>
                      <th className="py-3.5 px-4 text-center bg-emerald-100/80 text-emerald-950 border-x border-emerald-200">
                        RUNNING VEHICLES
                      </th>
                      <th className="py-3.5 px-4 text-center">IDLE VEHICLES</th>
                      <th className="py-3.5 px-4">Running Vehicle Types</th>
                      <th className="py-3.5 px-4 text-center">Fleet Utilization</th>
                      <th className="py-3.5 px-4 text-center">Running Fleet Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredVendors.map((v) => (
                      <tr key={v.vendorName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {getVendorBadge(v.vendorName)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {v.clientSites.length > 0 ? (
                              v.clientSites.map((site) => (
                                <span key={site} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {site}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">General Fleet</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800 text-sm">
                          {v.totalCount}
                        </td>
                        <td className="py-3 px-4 text-center bg-emerald-50/40 border-x border-emerald-100">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-3xs">
                            <Car className="h-3.5 w-3.5" />
                            {v.runningCount} RUNNING
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${v.idleCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500'}`}>
                            {v.idleCount} Idle
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(v.runningVehicleTypes).length > 0 ? (
                              Object.entries(v.runningVehicleTypes).map(([type, count]) => (
                                <span key={type} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {type}: {count}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[10px]">None</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${v.utilizationRate}%` }} />
                            </div>
                            <span className="font-extrabold text-slate-700 text-[10px]">{v.utilizationRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            id={`btn-view-running-${v.vendorName.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => {
                              setSelectedVendorForFleet(v.vendorName);
                              setVendorModalSearch('');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-3xs transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                          >
                            <Car className="h-3.5 w-3.5" /> View Running Vehicles ({v.runningCount})
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredVendors.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          <p className="font-bold text-slate-600 text-sm">No vendor records match your search criteria.</p>
                          <p className="text-xs text-slate-400 mt-1">Try entering a vendor name or client site in the search box.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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

      {selectedVendorForFleet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getVendorBadge(selectedVendorForFleet)}
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    <Car className="h-5 w-5 text-emerald-400" />
                    Running Vehicles List — Vendor: {selectedVendorForFleet}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    List of active running vehicles operating under {selectedVendorForFleet}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVendorForFleet(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter vehicle reg, driver, owner..."
                  value={vendorModalSearch}
                  onChange={(e) => setVendorModalSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full font-medium"
                />
              </div>

              {(() => {
                const selectedVendorData = availableVendorCalculations.find((v) => v.vendorName === selectedVendorForFleet);
                const runningFleet = selectedVendorData ? selectedVendorData.runningVehicles : [];
                return (
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" /> Total Running: {runningFleet.length} Vehicles
                    </span>
                    <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg">
                      Total Attached: {selectedVendorData?.totalCount || 0} Vehicles
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Modal Table Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const selectedVendorData = availableVendorCalculations.find((v) => v.vendorName === selectedVendorForFleet);
                if (!selectedVendorData) return null;

                const runningList = selectedVendorData.runningVehicles.filter((v) =>
                  v.registrationNumber.toLowerCase().includes(vendorModalSearch.toLowerCase()) ||
                  v.driverName.toLowerCase().includes(vendorModalSearch.toLowerCase()) ||
                  v.ownerName.toLowerCase().includes(vendorModalSearch.toLowerCase()) ||
                  (v.company || '').toLowerCase().includes(vendorModalSearch.toLowerCase()) ||
                  (v.site || '').toLowerCase().includes(vendorModalSearch.toLowerCase())
                );

                return (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                          <th className="py-2.5 px-3">S.No</th>
                          <th className="py-2.5 px-3">Vehicle Reg No</th>
                          <th className="py-2.5 px-3">Model & Type</th>
                          <th className="py-2.5 px-3">Assigned Site / Company</th>
                          <th className="py-2.5 px-3">Owner Name & Mobile</th>
                          <th className="py-2.5 px-3">Crew Driver Name & Phone</th>
                          <th className="py-2.5 px-3">Joining Date</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-xs">
                        {runningList.map((veh, idx) => {
                          const owner = owners.find((o) => o.id === veh.ownerId);
                          const driver = drivers.find((d) => d.id === veh.driverId);
                          return (
                            <tr key={veh.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-slate-400 text-[10px]">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-black text-slate-900 tracking-tight font-mono text-xs">
                                {veh.registrationNumber}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800 block">{veh.model || veh.vehicleType}</span>
                                <span className="text-[10px] text-slate-500 font-semibold">{veh.vehicleType} &bull; {veh.fuelType}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px] block max-w-max">
                                  {veh.company || veh.site || 'General Fleet'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800 block">{veh.ownerName || owner?.name || 'Unassigned'}</span>
                                <span className="text-[10px] font-mono text-slate-500 block">{owner?.phone || '-'}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800 block">{veh.driverName || driver?.name || 'Unassigned'}</span>
                                <span className="text-[10px] font-mono text-slate-500 block">{driver?.phone || '-'}</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-medium">{formatDate(veh.joiningDate)}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                                  Running
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {runningList.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                              No running vehicles found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVendorForFleet(null)}
                className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer shadow-3xs"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICE DOCUMENT & LETTERPAD SUBMISSION MANAGER MODAL */}
      {docModalVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide uppercase">
                    Office Document & Letterpad Tracking
                  </h3>
                  <p className="text-2xs text-slate-400 font-mono">
                    {docModalVehicle.registrationNumber} &bull; {docModalVehicle.manufacturer} {docModalVehicle.model}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDocModalVehicle(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updatedVehicles = vehicles.map((v) => {
                  if (v.id === docModalVehicle.id) {
                    return {
                      ...v,
                      officeDocSubmitted: docModalForm.officeDocSubmitted,
                      officeDocSubmitDate: docModalForm.officeDocSubmitDate,
                      officeDocVendorCompany: docModalForm.officeDocVendorCompany || v.company,
                      officeDocLetterpadRef: docModalForm.officeDocLetterpadRef,
                      officeDocRemarks: docModalForm.officeDocRemarks,
                      officeDocChecklist: docModalForm.officeDocChecklist,
                    };
                  }
                  return v;
                });
                onUpdateVehicles(updatedVehicles);
                setDocModalVehicle(null);
              }}
              className="p-6 space-y-4"
            >
              {/* Submission Toggle */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    Office Document Submission Status
                  </span>
                  <span className="text-2xs text-slate-600">
                    Has vehicle document package been submitted on letterpad to vendor company?
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={docModalForm.officeDocSubmitted}
                    onChange={(e) =>
                      setDocModalForm({ ...docModalForm, officeDocSubmitted: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Vendor Company Name */}
              <div>
                <label className="block text-2xs font-extrabold text-slate-700 uppercase mb-1">
                  Target Vendor / Client Company Name (e.g. Fiesta, Eco Mobility, TCS)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fiesta / Eco Mobility"
                  value={docModalForm.officeDocVendorCompany}
                  onChange={(e) =>
                    setDocModalForm({ ...docModalForm, officeDocVendorCompany: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-slate-800"
                />
              </div>

              {/* Letterpad Ref & Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-extrabold text-slate-700 uppercase mb-1">
                    Company Letterpad Ref / Memo No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LP-FIESTA-2026-001"
                    value={docModalForm.officeDocLetterpadRef}
                    onChange={(e) =>
                      setDocModalForm({ ...docModalForm, officeDocLetterpadRef: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold text-indigo-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-extrabold text-slate-700 uppercase mb-1">
                    Office Submission Date
                  </label>
                  <input
                    type="date"
                    value={docModalForm.officeDocSubmitDate}
                    onChange={(e) =>
                      setDocModalForm({ ...docModalForm, officeDocSubmitDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                  />
                </div>
              </div>

              {/* Document Checklist Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-2xs font-black text-slate-800 uppercase tracking-wider">
                  Checklist of Enclosed Documents (Letterpad Submission Package)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'rc', label: 'RC (Registration Certificate)' },
                    { key: 'insurance', label: 'INSURANCE' },
                    { key: 'permit', label: 'PERMIT' },
                    { key: 'pollution', label: 'POLLUTION' },
                    { key: 'aadhaarCard', label: 'AADHAAR CARD' },
                    { key: 'policeVerification', label: 'POLICE VERIFICATION' },
                    { key: 'drivingLicense', label: 'DRIVING LICENSE' },
                    { key: 'medicalCertificate', label: 'MEDICAL CERTIFICATE' },
                  ].map((doc) => (
                    <label key={doc.key} className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-indigo-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={(docModalForm.officeDocChecklist as any)[doc.key] ?? true}
                        onChange={(e) => setDocModalForm({
                          ...docModalForm,
                          officeDocChecklist: {
                            ...docModalForm.officeDocChecklist,
                            [doc.key]: e.target.checked
                          }
                        })}
                        className="h-3.5 w-3.5 text-indigo-600 rounded cursor-pointer"
                      />
                      <span className="text-2xs font-bold text-slate-800 uppercase">{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-2xs font-extrabold text-slate-700 uppercase mb-1">
                  Submission Notes / Office Acknowledgement
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Documents submitted with official letterpad signed by Fiesta transport head."
                  value={docModalForm.officeDocRemarks}
                  onChange={(e) =>
                    setDocModalForm({ ...docModalForm, officeDocRemarks: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintLetterpadModal({
                      ...docModalVehicle,
                      officeDocSubmitted: docModalForm.officeDocSubmitted,
                      officeDocSubmitDate: docModalForm.officeDocSubmitDate,
                      officeDocVendorCompany: docModalForm.officeDocVendorCompany || docModalVehicle.company,
                      officeDocLetterpadRef: docModalForm.officeDocLetterpadRef,
                      officeDocRemarks: docModalForm.officeDocRemarks,
                      officeDocChecklist: docModalForm.officeDocChecklist,
                    });
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs"
                >
                  <Printer className="h-4 w-4 text-indigo-600" />
                  Print Letterpad Slip
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDocModalVehicle(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Save Status
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS DEVICE REMOVAL & PAYMENT RELEASE MANAGER MODAL */}
      {gpsModalVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className={`px-6 py-4 flex items-center justify-between border-b text-white ${
              !gpsModalForm.gpsReturned ? 'bg-rose-900 border-rose-800' : 'bg-emerald-900 border-emerald-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  !gpsModalForm.gpsReturned ? 'bg-rose-800/80 text-rose-200 border-rose-700' : 'bg-emerald-800/80 text-emerald-200 border-emerald-700'
                }`}>
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide uppercase flex items-center gap-1.5">
                    {!gpsModalForm.gpsReturned ? '🚨 GPS Device Return & Payment Hold Manager' : '✅ GPS Device Return Verified'}
                  </h3>
                  <p className="text-2xs opacity-80 font-mono">
                    {gpsModalVehicle.registrationNumber} &bull; Owner: {gpsModalVehicle.ownerName} &bull; Status: {gpsModalVehicle.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGpsModalVehicle(null)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-black/20 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const updatedVehicles = vehicles.map((v) => {
                  if (v.id === gpsModalVehicle.id) {
                    return {
                      ...v,
                      gpsVendor: gpsModalForm.gpsVendor || v.gpsVendor,
                      gpsImei: gpsModalForm.gpsImei || v.gpsImei,
                      gpsReturned: gpsModalForm.gpsReturned,
                      gpsReturnDate: gpsModalForm.gpsReturned ? gpsModalForm.gpsReturnDate : '',
                      gpsReturnedBy: gpsModalForm.gpsReturnedBy,
                      gpsReturnRemarks: gpsModalForm.gpsReturnRemarks,
                    };
                  }
                  return v;
                });
                onUpdateVehicles(updatedVehicles);
                setGpsModalVehicle(null);
              }}
              className="p-6 space-y-4"
            >
              {/* Rule Banner */}
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                !gpsModalForm.gpsReturned
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2 font-extrabold uppercase text-2xs">
                  <AlertTriangle className={`h-4 w-4 shrink-0 ${!gpsModalForm.gpsReturned ? 'text-rose-600 animate-bounce' : 'text-emerald-600'}`} />
                  <span>Company Rule: GPS Return on Vehicle Deactivation</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  "If any vehicle goes to Inactive state and has an installed GPS unit, the GPS device MUST be removed and returned to the office. Until GPS device return is recorded, vehicle payment payout processing remains ON HOLD."
                </p>
              </div>

              {/* Hardware Info Summary */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Installed GPS Vendor</span>
                  <span className="font-bold text-slate-900">{gpsModalForm.gpsVendor || gpsModalVehicle.gpsVendor || 'Autoplant GPS'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Device IMEI Number</span>
                  <span className="font-mono font-bold text-slate-900">{gpsModalForm.gpsImei || gpsModalVehicle.gpsImei || 'N/A'}</span>
                </div>
              </div>

              {/* Toggle Return Checkbox */}
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                gpsModalForm.gpsReturned ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="checkbox"
                  checked={gpsModalForm.gpsReturned}
                  onChange={(e) => setGpsModalForm({
                    ...gpsModalForm,
                    gpsReturned: e.target.checked,
                    gpsReturnDate: e.target.checked ? (gpsModalForm.gpsReturnDate || new Date().toISOString().substring(0, 10)) : '',
                  })}
                  className="h-5 w-5 text-emerald-600 rounded cursor-pointer mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-xs font-black text-slate-900 block uppercase">
                    GPS Device Hardware Removed & Handed Over to Office
                  </span>
                  <span className="text-2xs text-slate-600">
                    Checking this box certifies that the physical GPS device has been removed from {gpsModalVehicle.registrationNumber} and returned to the company office/vendor. Payment processing will be RELEASED.
                  </span>
                </div>
              </label>

              {/* Return Form Details */}
              {gpsModalForm.gpsReturned && (
                <div className="space-y-3 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-left animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Return Received Date *</label>
                      <input
                        type="date"
                        required
                        value={gpsModalForm.gpsReturnDate}
                        onChange={(e) => setGpsModalForm({ ...gpsModalForm, gpsReturnDate: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Handled / Received By *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Admin / Office Manager"
                        value={gpsModalForm.gpsReturnedBy}
                        onChange={(e) => setGpsModalForm({ ...gpsModalForm, gpsReturnedBy: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Return Remarks / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. GPS unit inspected and placed in office hardware store box #2."
                      value={gpsModalForm.gpsReturnRemarks}
                      onChange={(e) => setGpsModalForm({ ...gpsModalForm, gpsReturnRemarks: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGpsModalVehicle(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                    gpsModalForm.gpsReturned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  {gpsModalForm.gpsReturned ? 'Release Payment Hold & Save' : 'Save (Keep Payment Held)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT LETTERPAD SUBMISSION SLIP MODAL */}
      {showPrintLetterpadModal && (
        <PrintLetterpadSubmissionSlip
          vehicle={showPrintLetterpadModal}
          onClose={() => setShowPrintLetterpadModal(null)}
        />
      )}

      {showPrintVehicleReport && (
        <PrintVehicleReport
          vehicles={vehicles}
          onClose={() => setShowPrintVehicleReport(false)}
          initialFilter={vehicleFilter}
        />
      )}
    </div>
  );
}
