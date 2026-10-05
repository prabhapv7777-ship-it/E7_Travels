/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  RotateCcw,
  Eye,
  Archive,
  RefreshCw,
  Zap,
  X,
  FileSpreadsheet,
  UserCheck,
  Sparkles,
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
  DeletedVehicle,
  isGpsRequiredForVehicle,
} from '../types';
import { formatDate, toInputDateFormat } from '../lib/dateUtils';
import { generateUniqueOwnerId, generateUniqueDriverId, generateUniqueVehicleId } from '../lib/idUtils';
import PrintJoiningForm from './PrintJoiningForm';
import PrintVehicleReport from './PrintVehicleReport';
import PrintLetterpadSubmissionSlip from './PrintLetterpadSubmissionSlip';
import { getVendorBadge, VENDOR_SITE_MAP } from './Settings';
import { exportToExcel, exportMultiSheetExcel, exportToPDF } from '../lib/exportUtils';
import { renderCommonSiteOptions, getCommonSiteOptions, cleanSiteValue } from '../lib/siteOptions';
import { parseEmergencyDetails, formatCombinedEmergency, KNOWN_RELATIONS } from '../lib/emergencyUtils';

interface MasterViewsProps {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  companies: Company[];
  sites: Site[];
  activeSubView: 'Vehicle Master' | 'Owner Master' | 'Driver Master' | 'Company Master' | 'Site Master' | 'Vendor Register' | 'Deleted Vehicles';
  vehicleFilter?: 'all' | 'running' | 'idle' | 'new' | 'doc_pending' | 'doc_submitted' | 'gps_hold' | 'duplicates';
  onSetVehicleFilter?: (filter: 'all' | 'running' | 'idle' | 'new' | 'doc_pending' | 'doc_submitted' | 'gps_hold' | 'duplicates') => void;
  onUpdateVehicles: (v: Vehicle[]) => void;
  onUpdateOwners: (o: Owner[]) => void;
  onUpdateDrivers: (d: Driver[]) => void;
  onUpdateCompanies: (c: Company[]) => void;
  onUpdateSites: (s: Site[]) => void;
  deletedVehicles?: DeletedVehicle[];
  onUpdateDeletedVehicles?: (dv: DeletedVehicle[]) => void;
  onRestoreVehicle?: (dv: DeletedVehicle, target?: 'master' | 'enquiry') => void;
  customLogo?: string | null;
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
  deletedVehicles = [],
  onUpdateDeletedVehicles = () => {},
  onRestoreVehicle = () => {},
  customLogo,
}: MasterViewsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; name: string } | null>(null);
  const [printEnquiry, setPrintEnquiry] = useState<Enquiry | null | undefined>(undefined);
  const [showPrintVehicleReport, setShowPrintVehicleReport] = useState(false);
  const [selectedVendorForFleet, setSelectedVendorForFleet] = useState<string | null>(null);
  const [vendorModalTab, setVendorModalTab] = useState<'all' | 'running' | 'idle'>('running');
  const [vendorModalSearch, setVendorModalSearch] = useState('');
  
  // Deleted Vehicles view modal states
  const [viewDeletedVehicle, setViewDeletedVehicle] = useState<DeletedVehicle | null>(null);
  const [permanentDeleteCandidate, setPermanentDeleteCandidate] = useState<DeletedVehicle | null>(null);
  const [restoreCandidate, setRestoreCandidate] = useState<DeletedVehicle | null>(null);
  
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

  const getFuelTypeBadge = (fuelType?: string) => {
    const fuel = (fuelType || 'Diesel').trim().toUpperCase();
    if (fuel === 'EV' || fuel === 'ELECTRIC') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300 shadow-3xs">
          <span className="text-[11px] leading-none">⚡</span> EV
        </span>
      );
    }
    if (fuel === 'CNG') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-3xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span> CNG
        </span>
      );
    }
    if (fuel === 'PETROL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 shadow-3xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span> PETROL
        </span>
      );
    }
    // DIESEL
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-3xs">
        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span> DIESEL
      </span>
    );
  };

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
  const [vehicleEditTab, setVehicleEditTab] = useState<'all' | 'car' | 'owner' | 'driver'>('all');
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
      const hasGps = isGpsRequiredForVehicle(v);
      if (hasGps && !v.gpsReturned) {
        return { label: '🚨 Payment Held (GPS Pending Return)', color: 'bg-rose-100 text-rose-900 border-rose-400 font-extrabold animate-pulse shadow-3xs' };
      }
      if (hasGps && v.gpsReturned) {
        return { label: 'Inactive (GPS Returned)', color: 'bg-teal-100 text-teal-900 border-teal-300 font-extrabold shadow-3xs' };
      }
      return { label: 'Inactive', color: 'bg-slate-200 text-slate-800 border-slate-300 font-extrabold shadow-3xs' };
    }
    if (emiDiff < 0) return { label: 'Overdue EMI', color: 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold animate-pulse shadow-3xs' };
    if (insDiff >= 0 && insDiff <= 30) return { label: 'Insurance Expiring', color: 'bg-orange-100 text-orange-900 border-orange-300 font-extrabold shadow-3xs' };
    if (perDiff >= 0 && perDiff <= 30) return { label: 'Permit Expiring', color: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-3xs' };
    if (fcDiff >= 0 && fcDiff <= 30) return { label: 'FC Expiring', color: 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold shadow-3xs' };
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold shadow-3xs' };
  };

  // Helper to map a full Vehicle record into an Enquiry structure for printing
  const mapVehicleToEnquiry = (v: Vehicle): Enquiry => {
    const o = owners.find(owner => owner.id === v.ownerId) ||
              (v.ownerName ? owners.find(owner => owner.name.trim().toLowerCase() === v.ownerName.trim().toLowerCase()) : undefined);
    const d = drivers.find(driver => driver.id === v.driverId) ||
              (v.driverName ? drivers.find(driver => driver.name.trim().toLowerCase() === v.driverName.trim().toLowerCase()) : undefined);
    const assignedSite = cleanSiteValue(v.company || v.sitePreference1);
    const sitePref2 = cleanSiteValue(v.company2 || v.sitePreference2);
    const sitePref3 = cleanSiteValue(v.site || v.sitePreference3);
    const sitePref4 = cleanSiteValue(v.site2 || v.sitePreference4);

    const parsedEm = d ? parseEmergencyDetails(
      d.emergencyContact,
      d.emergencyContactName,
      d.emergencyContactRelation,
      d.emergencyContactNumber
    ) : { name: '', relation: '', number: '' };

    const isOwnerSameAsDriver = Boolean(
      v.driverType === 'Owner-cum-Driver' ||
      (v.ownerName && v.driverName && v.ownerName.trim().toLowerCase() === v.driverName.trim().toLowerCase()) ||
      (o && d && o.name.trim().toLowerCase() === d.name.trim().toLowerCase())
    );

    return {
      id: v.id,
      vehicleNumber: v.registrationNumber,
      vehicleType: `${v.manufacturer} ${v.model}`.trim(),
      vehicleModelYear: String(v.year || ''),
      vehicleColor: '',
      ownerNamePhone: o ? `${o.name}-${o.phone}` : (v.ownerPhone ? `${v.ownerName}-${v.ownerPhone}` : v.ownerName),
      reference: v.remarks ? v.remarks.substring(0, 40) : '',
      driverName: v.driverName,
      driverAge: '',
      driverPhone: d ? d.phone : '',
      driverArea: d ? d.address : '',
      driverBatchExp: d ? d.badgeExpiry : '',
      alreadyRunningCompany: assignedSite,
      sitePreference1: assignedSite,
      sitePreference2: sitePref2,
      sitePreference3: sitePref3,
      sitePreference4: sitePref4,
      enquiryDate: v.joiningDate,
      remarks: v.remarks,
      inductionType: isOwnerSameAsDriver ? 'OwnerAttach' : (v.driverType === 'Company' ? 'DriverAttach' : 'OwnerAttach'),
      ownerId: o ? o.id : v.ownerId,
      ownerName: o ? o.name : v.ownerName,
      ownerMobile: o ? o.phone : (v.ownerPhone || ''),
      ownerAddress: o ? o.address : (v.ownerAddress || ''),
      mfdYear: String(v.year || ''),
      registrationDate: v.registrationDate || v.rcExpiry || '',
      fuelType: v.fuelType,
      rcExpiry: v.rcExpiry || v.registrationDate || '',
      insuranceExpiry: v.insuranceExpiry,
      permitExpiry: v.permitExpiry,
      fcExpiry: v.fcExpiry,
      driverAltPhone: d?.altPhone || '',
      driverEmail: d?.email || o?.email || '',
      driverEmergencyContactName: parsedEm.name,
      driverEmergencyContactNumber: parsedEm.number,
      driverEmergencyRelation: parsedEm.relation,
      driverAadhaar: d ? d.aadhaar : '',
      driverDlNumber: d ? d.licenceNumber : '',
      driverDlExpiry: d ? d.licenceExpiry : '',
      driverAddress: d ? d.address : '',
      gpsVendor: v.gpsVendor || '',
      gpsImei: v.gpsImei || '',
      bankName: o ? o.bankName : '',
      bankAccountHolder: o ? o.name : (v.ownerName || ''),
      bankAccountNumber: o ? o.accountNumber : '',
      bankIfsc: o ? o.ifsc : '',
      status: 'New'
    };
  };

  // ----------------- CRUD Action Triggers -----------------

  const handleSetOwnerAsDriver = (enable: boolean) => {
    if (enable) {
      const oName = (ownerForm.name || vehicleForm.ownerName || '').trim();
      const oPhone = (ownerForm.phone || vehicleForm.ownerPhone || '').trim();
      const oAddress = (ownerForm.address || vehicleForm.ownerAddress || '').trim();
      const oAadhaar = (ownerForm.aadhaar || '').trim();
      const oPan = (ownerForm.pan || '').trim();
      const oEmName = (ownerForm.emergencyContactName || '').trim();
      const oEmRel = (ownerForm.emergencyContactRelation || '').trim();
      const oEmNum = (ownerForm.emergencyContactNumber || '').trim();

      // Check if there is an existing driver matching this owner's name or exact phone
      const matchedD = drivers.find(
        (d) =>
          (d.name && oName && d.name.trim().toLowerCase() === oName.toLowerCase()) ||
          (d.phone && oPhone && d.phone.trim() === oPhone && oPhone.length >= 10)
      );

      setDriverForm((prev) => ({
        ...prev,
        id: matchedD ? matchedD.id : undefined,
        name: oName,
        phone: oPhone,
        address: oAddress || (matchedD?.address || '') || prev.address || '',
        aadhaar: oAadhaar || (matchedD?.aadhaar || '') || prev.aadhaar || '',
        pan: oPan || (matchedD?.pan || '') || prev.pan || '',
        driverType: 'Owner-cum-Driver',
        licenceNumber: (matchedD?.licenceNumber || '') || prev.licenceNumber || '',
        licenceExpiry: (matchedD?.licenceExpiry || '') || prev.licenceExpiry || '',
        badgeNumber: (matchedD?.badgeNumber || '') || prev.badgeNumber || '',
        badgeExpiry: (matchedD?.badgeExpiry || '') || prev.badgeExpiry || '',
        salary: matchedD?.salary !== undefined ? matchedD.salary : (prev.salary !== undefined ? prev.salary : 0),
        status: matchedD?.status || prev.status || 'Active',
        joiningDate: matchedD?.joiningDate || prev.joiningDate || vehicleForm.joiningDate || new Date().toISOString().substring(0, 10),
        emergencyContactName: oEmName || (matchedD?.emergencyContactName || '') || prev.emergencyContactName || '',
        emergencyContactRelation: oEmRel || (matchedD?.emergencyContactRelation || '') || prev.emergencyContactRelation || '',
        emergencyContactNumber: oEmNum || (matchedD?.emergencyContactNumber || '') || prev.emergencyContactNumber || '',
        emergencyContact: formatCombinedEmergency(oEmName, oEmRel, oEmNum) || (matchedD?.emergencyContact || '') || prev.emergencyContact || '',
      }));

      setVehicleForm((prev) => ({
        ...prev,
        driverName: oName,
        driverId: matchedD ? matchedD.id : undefined,
      }));
    } else {
      setDriverForm((prev) => ({
        ...prev,
        driverType: 'Owner-Paid',
      }));
    }
  };

  const resetForms = () => {
    setVehicleForm({});
    setOwnerForm({});
    setDriverForm({});
    setCompanyForm({});
    setSiteForm({});
    setEditingId(null);
    setIsAdding(false);
    setFormError(null);
    setVehicleEditTab('all');
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanReg = (vehicleForm.registrationNumber || '').trim().toUpperCase();
    if (!cleanReg) {
      setFormError('Vehicle Registration Number is mandatory.');
      return;
    }
    if (!vehicleForm.model) {
      setFormError('Vehicle Model is mandatory.');
      return;
    }

    const ownerName = (ownerForm.name || vehicleForm.ownerName || '').trim();
    if (!ownerName) {
      setFormError('Owner Name is mandatory.');
      return;
    }

    const driverName = (driverForm.name || vehicleForm.driverName || '').trim();
    if (!driverName) {
      setFormError('Driver Name is mandatory.');
      return;
    }

    // Reg Num Unique Validation
    const isDuplicate = vehicles.some(
      (v) => v.registrationNumber.toUpperCase() === cleanReg && v.id !== vehicleForm.id && v.id !== editingId
    );

    if (isDuplicate) {
      setFormError(`Vehicle Registration Number "${cleanReg}" is already registered.`);
      return;
    }

    // 1. Process & Save Owner Record
    const cleanOwnerName = ownerName.trim();
    const existingOwnerByName = owners.find(
      (o) => o.name && o.name.trim().toLowerCase() === cleanOwnerName.toLowerCase()
    );
    const existingOwnerById = ownerForm.id ? owners.find((o) => o.id === ownerForm.id) : null;

    let finalOwnerId: string;
    let existingOwner: Owner | undefined;

    if (existingOwnerByName) {
      finalOwnerId = existingOwnerByName.id;
      existingOwner = existingOwnerByName;
    } else if (existingOwnerById && existingOwnerById.name.trim().toLowerCase() === cleanOwnerName.toLowerCase()) {
      finalOwnerId = existingOwnerById.id;
      existingOwner = existingOwnerById;
    } else {
      finalOwnerId = generateUniqueOwnerId(owners);
      existingOwner = undefined;
    }

    const ownerRecord: Owner = {
      id: finalOwnerId,
      name: cleanOwnerName,
      phone: (ownerForm.phone || existingOwner?.phone || '').trim(),
      email: ownerForm.email !== undefined ? ownerForm.email : (existingOwner?.email || ''),
      address: ownerForm.address !== undefined ? ownerForm.address : (existingOwner?.address || ''),
      bankName: ownerForm.bankName !== undefined ? ownerForm.bankName : (existingOwner?.bankName || ''),
      accountNumber: ownerForm.accountNumber !== undefined ? ownerForm.accountNumber : (existingOwner?.accountNumber || ''),
      ifsc: ownerForm.ifsc !== undefined ? ownerForm.ifsc : (existingOwner?.ifsc || ''),
      upiId: ownerForm.upiId !== undefined ? ownerForm.upiId : (existingOwner?.upiId || ''),
      pan: ownerForm.pan !== undefined ? ownerForm.pan : (existingOwner?.pan || ''),
      aadhaar: ownerForm.aadhaar !== undefined ? ownerForm.aadhaar : (existingOwner?.aadhaar || ''),
      remarks: ownerForm.remarks !== undefined ? ownerForm.remarks : (existingOwner?.remarks || ''),
      emergencyContactName: ownerForm.emergencyContactName !== undefined ? ownerForm.emergencyContactName : (existingOwner?.emergencyContactName || ''),
      emergencyContactNumber: ownerForm.emergencyContactNumber !== undefined ? ownerForm.emergencyContactNumber : (existingOwner?.emergencyContactNumber || ''),
      emergencyContactRelation: ownerForm.emergencyContactRelation !== undefined ? ownerForm.emergencyContactRelation : (existingOwner?.emergencyContactRelation || ''),
      comments: existingOwner?.comments || [],
    };

    let nextOwners: Owner[];
    if (owners.some((o) => o.id === finalOwnerId)) {
      nextOwners = owners.map((o) => (o.id === finalOwnerId ? ownerRecord : o));
    } else {
      nextOwners = [...owners, ownerRecord];
    }
    onUpdateOwners(nextOwners);

    // 2. Process & Save Driver Record
    const cleanDriverName = driverName.trim();
    const existingDriverByName = drivers.find(
      (d) => d.name && d.name.trim().toLowerCase() === cleanDriverName.toLowerCase()
    );
    const existingDriverById = driverForm.id ? drivers.find((d) => d.id === driverForm.id) : null;

    let finalDriverId: string;
    let existingDriver: Driver | undefined;

    if (existingDriverByName) {
      finalDriverId = existingDriverByName.id;
      existingDriver = existingDriverByName;
    } else if (existingDriverById && existingDriverById.name.trim().toLowerCase() === cleanDriverName.toLowerCase()) {
      finalDriverId = existingDriverById.id;
      existingDriver = existingDriverById;
    } else {
      finalDriverId = generateUniqueDriverId(drivers);
      existingDriver = undefined;
    }

    const driverEmName = driverForm.emergencyContactName !== undefined ? driverForm.emergencyContactName : (existingDriver?.emergencyContactName || '');
    const driverEmNum = driverForm.emergencyContactNumber !== undefined ? driverForm.emergencyContactNumber : (existingDriver?.emergencyContactNumber || '');
    const driverEmRel = driverForm.emergencyContactRelation !== undefined ? driverForm.emergencyContactRelation : (existingDriver?.emergencyContactRelation || '');
    const combinedEmergency = formatCombinedEmergency(driverEmName, driverEmRel, driverEmNum) || driverForm.emergencyContact || existingDriver?.emergencyContact || '';

    const driverRecord: Driver = {
      id: finalDriverId,
      name: cleanDriverName,
      phone: (driverForm.phone || existingDriver?.phone || '').trim(),
      address: driverForm.address !== undefined ? driverForm.address : (existingDriver?.address || ''),
      badgeNumber: driverForm.badgeNumber !== undefined ? driverForm.badgeNumber : (existingDriver?.badgeNumber || ''),
      badgeExpiry: driverForm.badgeExpiry !== undefined ? driverForm.badgeExpiry : (existingDriver?.badgeExpiry || ''),
      licenceNumber: driverForm.licenceNumber !== undefined ? driverForm.licenceNumber : (existingDriver?.licenceNumber || ''),
      licenceExpiry: driverForm.licenceExpiry !== undefined ? driverForm.licenceExpiry : (existingDriver?.licenceExpiry || ''),
      aadhaar: driverForm.aadhaar !== undefined ? driverForm.aadhaar : (existingDriver?.aadhaar || ''),
      pan: driverForm.pan !== undefined ? driverForm.pan : (existingDriver?.pan || ''),
      salary: driverForm.salary !== undefined ? Number(driverForm.salary) : (existingDriver?.salary || 0),
      joiningDate: driverForm.joiningDate || existingDriver?.joiningDate || new Date().toISOString().substring(0, 10),
      status: driverForm.status || existingDriver?.status || 'Active',
      driverType: driverForm.driverType || existingDriver?.driverType || 'Owner-Paid',
      emergencyContact: combinedEmergency,
      emergencyContactName: driverEmName,
      emergencyContactNumber: driverEmNum,
      emergencyContactRelation: driverEmRel,
      comments: existingDriver?.comments || [],
    };

    let nextDrivers: Driver[];
    if (drivers.some((d) => d.id === finalDriverId)) {
      nextDrivers = drivers.map((d) => (d.id === finalDriverId ? driverRecord : d));
    } else {
      nextDrivers = [...drivers, driverRecord];
    }
    onUpdateDrivers(nextDrivers);

    // 3. Process & Save Vehicle Record
    const vehicleRecord: Vehicle = {
      ...vehicleForm,
      id: editingId || vehicleForm.id || generateUniqueVehicleId(vehicles),
      registrationNumber: cleanReg,
      model: vehicleForm.model || 'Unknown',
      manufacturer: vehicleForm.manufacturer || 'Toyota',
      year: Number(vehicleForm.year) || 2022,
      registrationDate: vehicleForm.registrationDate || '',
      fuelType: vehicleForm.fuelType || 'Diesel',
      transmission: vehicleForm.transmission || 'Manual',
      vehicleType: vehicleForm.vehicleType || 'Sedan',
      ownerId: finalOwnerId,
      ownerName: cleanOwnerName,
      ownerPhone: ownerRecord.phone,
      ownerAddress: ownerRecord.address,
      driverId: finalDriverId,
      driverName: driverName,
      company: cleanSiteValue(vehicleForm.company || vehicleForm.sitePreference1),
      site: cleanSiteValue(vehicleForm.site || vehicleForm.sitePreference3),
      company2: cleanSiteValue(vehicleForm.company2 || vehicleForm.sitePreference2),
      site2: cleanSiteValue(vehicleForm.site2 || vehicleForm.sitePreference4),
      sitePreference1: cleanSiteValue(vehicleForm.company || vehicleForm.sitePreference1),
      sitePreference2: cleanSiteValue(vehicleForm.company2 || vehicleForm.sitePreference2),
      sitePreference3: cleanSiteValue(vehicleForm.site || vehicleForm.sitePreference3),
      sitePreference4: cleanSiteValue(vehicleForm.site2 || vehicleForm.sitePreference4),
      joiningDate: vehicleForm.joiningDate || new Date().toISOString().substring(0, 10),
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
      gpsRequired: vehicleForm.gpsRequired || (isGpsRequiredForVehicle(vehicleForm) ? 'Yes' : 'No'),
      gpsVendor: vehicleForm.gpsVendor || '',
      gpsImei: vehicleForm.gpsImei || '',
      gpsFittingDate: vehicleForm.gpsFittingDate || '',
      gpsReturned: (vehicleForm.gpsRequired === 'No' || vehicleForm.gpsRequired === false)
        ? true
        : vehicleForm.status === 'Inactive' ? (vehicleForm.gpsReturned ?? false) : (vehicleForm.gpsReturned ?? true),
      gpsReturnDate: vehicleForm.gpsReturnDate || '',
      gpsReturnRemarks: vehicleForm.gpsReturnRemarks || '',
      gpsReturnedBy: vehicleForm.gpsReturnedBy || '',
    };

    let nextVehicles: Vehicle[];
    if (editingId) {
      nextVehicles = vehicles.map((v) => (v.id === editingId ? vehicleRecord : v));
    } else {
      nextVehicles = [...vehicles, vehicleRecord];
    }
    onUpdateVehicles(nextVehicles);

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
      id: ownerForm.id || generateUniqueOwnerId(owners),
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
      emergencyContactName: ownerForm.emergencyContactName || '',
      emergencyContactNumber: ownerForm.emergencyContactNumber || '',
      emergencyContactRelation: ownerForm.emergencyContactRelation || '',
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

    const emName = driverForm.emergencyContactName || '';
    const emNum = driverForm.emergencyContactNumber || '';
    const emRel = driverForm.emergencyContactRelation || '';

    const combinedEmergency = formatCombinedEmergency(emName, emRel, emNum) || driverForm.emergencyContact || '';

    const driverRecord: Driver = {
      id: driverForm.id || generateUniqueDriverId(drivers),
      name: driverForm.name,
      phone: driverForm.phone,
      address: driverForm.address || '',
      badgeNumber: driverForm.badgeNumber || '',
      badgeExpiry: driverForm.badgeExpiry || '',
      licenceNumber: driverForm.licenceNumber || '',
      licenceExpiry: driverForm.licenceExpiry || '',
      aadhaar: driverForm.aadhaar || '',
      pan: driverForm.pan || '',
      emergencyContact: combinedEmergency,
      emergencyContactName: emName,
      emergencyContactNumber: emNum,
      emergencyContactRelation: emRel,
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

  // ----------------- Duplicate Vehicle Numbers Logic -----------------
  const normalizeRegNumber = (reg: string) => (reg || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();

  const duplicateVehicleGroups = useMemo(() => {
    const groups = new Map<string, Vehicle[]>();
    vehicles.forEach((v) => {
      const norm = normalizeRegNumber(v.registrationNumber);
      if (!norm) return;
      if (!groups.has(norm)) groups.set(norm, []);
      groups.get(norm)!.push(v);
    });

    const dupes = new Map<string, Vehicle[]>();
    groups.forEach((list, norm) => {
      if (list.length > 1) {
        dupes.set(norm, list);
      }
    });
    return dupes;
  }, [vehicles]);

  const handleCleanDuplicateVehicles = () => {
    const cleaned: Vehicle[] = [];
    const groups = new Map<string, Vehicle[]>();

    vehicles.forEach((v) => {
      const norm = normalizeRegNumber(v.registrationNumber);
      if (!norm) {
        cleaned.push(v);
        return;
      }
      if (!groups.has(norm)) groups.set(norm, []);
      groups.get(norm)!.push(v);
    });

    groups.forEach((list) => {
      if (list.length === 1) {
        cleaned.push(list[0]);
      } else {
        const sorted = [...list].sort((a, b) => {
          const scoreA =
            (a.status === 'Active' ? 100 : 0) +
            (a.insuranceExpiry ? 10 : 0) +
            (a.ownerName && a.ownerName !== 'Unknown Owner' ? 5 : 0) +
            (a.driverName && a.driverName !== 'Unknown Driver' ? 5 : 0) +
            (a.company ? 5 : 0);
          const scoreB =
            (b.status === 'Active' ? 100 : 0) +
            (b.insuranceExpiry ? 10 : 0) +
            (b.ownerName && b.ownerName !== 'Unknown Owner' ? 5 : 0) +
            (b.driverName && b.driverName !== 'Unknown Driver' ? 5 : 0) +
            (b.company ? 5 : 0);
          return scoreB - scoreA;
        });

        const primary = { ...sorted[0] };
        sorted.slice(1).forEach((dup) => {
          if (!primary.ownerName || primary.ownerName === 'Unknown Owner') primary.ownerName = dup.ownerName;
          if (!primary.ownerId || primary.ownerId === 'new') primary.ownerId = dup.ownerId;
          if (!primary.driverName || primary.driverName === 'Unknown Driver') primary.driverName = dup.driverName;
          if (!primary.driverId || primary.driverId === 'new') primary.driverId = dup.driverId;
          if (!primary.company) primary.company = dup.company;
          if (!primary.site) primary.site = dup.site;
          if (!primary.insuranceExpiry) primary.insuranceExpiry = dup.insuranceExpiry;
          if (!primary.fcExpiry) primary.fcExpiry = dup.fcExpiry;
          if (!primary.permitExpiry) primary.permitExpiry = dup.permitExpiry;
          if (!primary.fastagNumber) primary.fastagNumber = dup.fastagNumber;
        });

        cleaned.push(primary);
      }
    });

    onUpdateVehicles(cleaned);
    if (onSetVehicleFilter) onSetVehicleFilter('all');
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

    if (vehicleFilter === 'duplicates') {
      const norm = normalizeRegNumber(v.registrationNumber);
      return duplicateVehicleGroups.has(norm);
    }
    if (vehicleFilter === 'running') {
      return v.status === 'Active';
    }
    if (vehicleFilter === 'idle') {
      return v.status !== 'Active';
    }
    if (vehicleFilter === 'new') {
      const currentMonth = new Date().toISOString().substring(0, 7);
      return v.joiningDate && v.joiningDate.startsWith(currentMonth);
    }
    if (vehicleFilter === 'doc_pending') {
      return !v.officeDocSubmitted;
    }
    if (vehicleFilter === 'doc_submitted') {
      return !!v.officeDocSubmitted;
    }
    if (vehicleFilter === 'gps_hold') {
      return v.status === 'Inactive' && isGpsRequiredForVehicle(v) && !v.gpsReturned;
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
      v.attachedVehicles.some(
        (veh) =>
          veh.registrationNumber.toLowerCase().includes(q) ||
          veh.driverName.toLowerCase().includes(q) ||
          veh.ownerName.toLowerCase().includes(q)
      )
    );
  });

  // ----------------- Export Handlers -----------------
  const handleExportExcel = () => {
    // Helper to generate complete unified row with Vehicle, Owner, and Driver details
    const getComprehensiveRow = (v: Vehicle) => {
      const owner = owners.find(
        (o) => o.id === v.ownerId || (o.name && v.ownerName && o.name.trim().toLowerCase() === v.ownerName.trim().toLowerCase())
      );
      const driver = drivers.find(
        (d) => d.id === v.driverId || (d.name && v.driverName && d.name.trim().toLowerCase() === v.driverName.trim().toLowerCase())
      );
      const isOwnerDriver = Boolean(
        (v.ownerName && v.driverName && v.ownerName.trim().toLowerCase() === v.driverName.trim().toLowerCase()) ||
        driver?.driverType === 'Owner-cum-Driver'
      );

      return [
        // --- VEHICLE DATA ---
        v.id,
        v.registrationNumber,
        v.vehicleType,
        v.manufacturer,
        v.model,
        v.year || '',
        formatDate(v.registrationDate),
        v.fuelType,
        v.transmission,
        v.status,
        v.company || '',
        v.company2 || v.sitePreference2 || '',
        v.site || v.sitePreference3 || '',
        v.site2 || v.sitePreference4 || '',
        formatDate(v.joiningDate),
        v.fastagNumber || '',
        v.emiAmount ? Number(v.emiAmount) : 0,
        formatDate(v.emiDueDate),
        formatDate(v.insuranceExpiry),
        formatDate(v.fcExpiry),
        formatDate(v.permitExpiry),
        formatDate(v.pollutionExpiry),
        v.paymentCycle || 'Monthly',
        v.gpsRequired === 'Yes' || v.gpsRequired === true || !!v.gpsVendor ? 'Yes' : 'No',
        v.gpsVendor || '',
        v.gpsImei || '',
        formatDate(v.gpsFittingDate),
        v.gpsReturned ? 'Returned' : (v.status === 'Inactive' && !!v.gpsVendor ? 'Pending Return' : (v.gpsVendor ? 'Fitted' : 'Not Fitted')),
        formatDate(v.gpsReturnDate),
        v.gpsReturnRemarks || '',
        v.officeDocSubmitted ? 'Submitted' : 'Pending',
        v.officeDocVendorCompany || '',
        v.officeDocLetterpadRef || '',
        formatDate(v.officeDocSubmitDate),
        v.remarks || '',

        // --- OWNER DATA (FULL) ---
        owner?.id || v.ownerId || '',
        owner?.name || v.ownerName || '',
        owner?.phone || v.ownerPhone || '',
        owner?.email || '',
        owner?.address || v.ownerAddress || '',
        owner?.pan || '',
        owner?.aadhaar || '',
        owner?.bankName || '',
        owner?.accountNumber || '',
        owner?.ifsc || '',
        owner?.upiId || '',
        owner?.emergencyContactName || '',
        owner?.emergencyContactRelation || '',
        owner?.emergencyContactNumber || '',
        owner?.remarks || '',

        // --- DRIVER DATA (FULL) ---
        driver?.id || v.driverId || '',
        driver?.name || v.driverName || '',
        driver?.driverType || (isOwnerDriver ? 'Owner-cum-Driver' : 'Owner-Paid'),
        driver?.phone || '',
        driver?.address || '',
        driver?.licenceNumber || '',
        formatDate(driver?.licenceExpiry),
        driver?.badgeNumber || '',
        formatDate(driver?.badgeExpiry),
        driver?.aadhaar || '',
        driver?.pan || '',
        driver?.status || 'Active',
        driver?.salary !== undefined ? driver.salary : '',
        formatDate(driver?.joiningDate),
        driver ? parseEmergencyDetails(driver.emergencyContact, driver.emergencyContactName, driver.emergencyContactRelation, driver.emergencyContactNumber).name : '',
        driver ? parseEmergencyDetails(driver.emergencyContact, driver.emergencyContactName, driver.emergencyContactRelation, driver.emergencyContactNumber).relation : '',
        driver ? parseEmergencyDetails(driver.emergencyContact, driver.emergencyContactName, driver.emergencyContactRelation, driver.emergencyContactNumber).number : '',
      ];
    };

    const comprehensiveHeaders = [
      // VEHICLE
      'Vehicle ID',
      'Registration No',
      'Vehicle Type',
      'Manufacturer',
      'Model',
      'Mfg Year',
      'Registration Date',
      'Fuel Type',
      'Transmission',
      'Vehicle Status',
      'Assigned Site (Field 1)',
      'Site Preference 2',
      'Site Preference 3',
      'Site Preference 4',
      'Joining Date',
      'Fastag No',
      'EMI Amount (₹)',
      'EMI Due Date',
      'Insurance Expiry',
      'FC Expiry',
      'Permit Expiry',
      'Pollution Expiry',
      'Payment Cycle',
      'GPS Required / Fitted',
      'GPS Vendor',
      'GPS IMEI No',
      'GPS Fitting Date',
      'GPS Return Status',
      'GPS Return Date',
      'GPS Return Remarks',
      'Office Docs Status',
      'Office Docs Vendor',
      'Office Docs Letterpad Ref',
      'Office Docs Submit Date',
      'Vehicle Remarks',

      // OWNER
      'Owner ID',
      'Owner Name',
      'Owner Mobile Phone',
      'Owner Email',
      'Owner Address',
      'Owner PAN No',
      'Owner Aadhaar No',
      'Owner Bank Name',
      'Owner Account No',
      'Owner IFSC Code',
      'Owner UPI ID',
      'Owner Emergency Contact Name',
      'Owner Emergency Contact Relation',
      'Owner Emergency Contact Phone',
      'Owner Remarks',

      // DRIVER
      'Driver ID',
      'Driver Name',
      'Driver Type',
      'Driver Mobile Phone',
      'Driver Address',
      'Driving Licence No',
      'Licence Expiry',
      'Driver Badge No',
      'Driver Badge Expiry',
      'Driver Aadhaar No',
      'Driver PAN No',
      'Driver Status',
      'Driver Monthly Salary (₹)',
      'Driver Joining Date',
      'Driver Emergency Contact Name',
      'Driver Emergency Contact Relation',
      'Driver Emergency Contact Phone',
    ];

    if (activeSubView === 'Vehicle Master') {
      const comprehensiveRows = filteredVehicles.map(getComprehensiveRow);

      const vehicleHeaders = [
        'Vehicle ID',
        'Registration No',
        'Vehicle Type',
        'Manufacturer',
        'Model',
        'Mfg Year',
        'Fuel Type',
        'Transmission',
        'Status',
        'Assigned Site 1',
        'Site Preference 2',
        'Site Preference 3',
        'Site Preference 4',
        'Owner Name',
        'Owner Phone',
        'Driver Name',
        'Driver Phone',
        'Driver Type',
        'Joining Date',
        'Insurance Expiry',
        'FC Expiry',
        'Permit Expiry',
        'Pollution Expiry',
        'Fastag No',
        'EMI Amount (₹)',
        'EMI Due Date',
        'GPS Vendor',
        'GPS IMEI',
        'Office Docs Status',
        'Office Docs Ref',
        'Remarks',
      ];

      const vehicleRows = filteredVehicles.map((v) => {
        const o = owners.find(
          (own) => own.id === v.ownerId || (own.name && v.ownerName && own.name.trim().toLowerCase() === v.ownerName.trim().toLowerCase())
        );
        const d = drivers.find(
          (drv) => drv.id === v.driverId || (drv.name && v.driverName && drv.name.trim().toLowerCase() === v.driverName.trim().toLowerCase())
        );
        return [
          v.id,
          v.registrationNumber,
          v.vehicleType,
          v.manufacturer,
          v.model,
          v.year || '',
          v.fuelType,
          v.transmission,
          v.status,
          v.company || '',
          v.company2 || v.sitePreference2 || '',
          v.site || v.sitePreference3 || '',
          v.site2 || v.sitePreference4 || '',
          v.ownerName || '',
          o?.phone || v.ownerPhone || '',
          v.driverName || '',
          d?.phone || '',
          d?.driverType || (v.ownerName && v.driverName && v.ownerName.trim().toLowerCase() === v.driverName.trim().toLowerCase() ? 'Owner-cum-Driver' : 'Owner-Paid'),
          formatDate(v.joiningDate),
          formatDate(v.insuranceExpiry),
          formatDate(v.fcExpiry),
          formatDate(v.permitExpiry),
          formatDate(v.pollutionExpiry),
          v.fastagNumber || '',
          v.emiAmount ? Number(v.emiAmount) : 0,
          formatDate(v.emiDueDate),
          v.gpsVendor || '',
          v.gpsImei || '',
          v.officeDocSubmitted ? 'Submitted' : 'Pending',
          v.officeDocLetterpadRef || '',
          v.remarks || '',
        ];
      });

      const ownerHeaders = [
        'Owner ID',
        'Owner Name',
        'Phone',
        'Email',
        'Address',
        'Bank Name',
        'Account No',
        'IFSC Code',
        'UPI ID',
        'PAN No',
        'Aadhaar No',
        'Emergency Contact',
        'Attached Vehicles Count',
        'Attached Vehicle Numbers',
      ];

      const ownerRows = owners.map((o) => {
        const attachedVehicles = vehicles.filter((v) => v.ownerId === o.id || (v.ownerName && v.ownerName.trim().toLowerCase() === o.name.trim().toLowerCase()));
        return [
          o.id,
          o.name,
          o.phone || '',
          o.email || '',
          o.address || '',
          o.bankName || '',
          o.accountNumber || '',
          o.ifsc || '',
          o.upiId || '',
          o.pan || '',
          o.aadhaar || '',
          [o.emergencyContactName, o.emergencyContactRelation, o.emergencyContactNumber].filter(Boolean).join(' - '),
          attachedVehicles.length,
          attachedVehicles.map((v) => v.registrationNumber).join(', '),
        ];
      });

      const driverHeaders = [
        'Driver ID',
        'Driver Name',
        'Driver Type',
        'Phone',
        'Address',
        'Licence No',
        'Licence Expiry',
        'Badge No',
        'Badge Expiry',
        'Aadhaar No',
        'PAN No',
        'Status',
        'Monthly Salary',
        'Joining Date',
        'Emergency Contact',
        'Assigned Vehicle Reg No',
        'Assigned Vehicle Model',
        'Vehicle Owner Name',
      ];

      const driverRows = drivers.map((d) => {
        const assignedVeh = vehicles.find((v) => v.driverId === d.id || (v.driverName && v.driverName.trim().toLowerCase() === d.name.trim().toLowerCase()));
        return [
          d.id,
          d.name,
          d.driverType || 'Owner-Paid',
          d.phone || '',
          d.address || '',
          d.licenceNumber || '',
          formatDate(d.licenceExpiry),
          d.badgeNumber || '',
          formatDate(d.badgeExpiry),
          d.aadhaar || '',
          d.pan || '',
          d.status,
          d.salary !== undefined ? d.salary : '',
          formatDate(d.joiningDate),
          (() => {
            const pem = parseEmergencyDetails(d.emergencyContact, d.emergencyContactName, d.emergencyContactRelation, d.emergencyContactNumber);
            return formatCombinedEmergency(pem.name, pem.relation, pem.number);
          })(),
          assignedVeh?.registrationNumber || 'Unassigned',
          assignedVeh ? `${assignedVeh.manufacturer} ${assignedVeh.model}` : '',
          assignedVeh?.ownerName || '',
        ];
      });

      // Export Comprehensive Multi-Sheet Workbook
      exportMultiSheetExcel('E7_Travels_Master_Register_Complete', [
        { sheetName: 'Comprehensive Master', headers: comprehensiveHeaders, rows: comprehensiveRows },
        { sheetName: 'Vehicle Register', headers: vehicleHeaders, rows: vehicleRows },
        { sheetName: 'Owner Register', headers: ownerHeaders, rows: ownerRows },
        { sheetName: 'Driver Register', headers: driverHeaders, rows: driverRows },
      ]);
    } else if (activeSubView === 'Owner Master') {
      const headers = [
        'Owner ID',
        'Owner Name',
        'Phone',
        'Email',
        'Address',
        'Bank Name',
        'Account No',
        'IFSC Code',
        'UPI ID',
        'PAN No',
        'Aadhaar No',
        'Emergency Contact Name',
        'Emergency Contact Relation',
        'Emergency Contact Phone',
        'Attached Vehicles Count',
        'Attached Vehicle Numbers',
        'Remarks',
      ];
      const rows = filteredOwners.map((o) => {
        const attachedVehicles = vehicles.filter((v) => v.ownerId === o.id || (v.ownerName && v.ownerName.trim().toLowerCase() === o.name.trim().toLowerCase()));
        return [
          o.id,
          o.name,
          o.phone || '',
          o.email || '',
          o.address || '',
          o.bankName || '',
          o.accountNumber || '',
          o.ifsc || '',
          o.upiId || '',
          o.pan || '',
          o.aadhaar || '',
          o.emergencyContactName || '',
          o.emergencyContactRelation || '',
          o.emergencyContactNumber || '',
          attachedVehicles.length,
          attachedVehicles.map((v) => v.registrationNumber).join(', '),
          o.remarks || '',
        ];
      });

      const comprehensiveRows = vehicles.map(getComprehensiveRow);
      exportMultiSheetExcel('E7_Travels_Owner_Master_Register', [
        { sheetName: 'Owner Master', headers, rows },
        { sheetName: 'Comprehensive Fleet Master', headers: comprehensiveHeaders, rows: comprehensiveRows },
      ]);
    } else if (activeSubView === 'Driver Master') {
      const headers = [
        'Driver ID',
        'Driver Name',
        'Driver Type',
        'Phone',
        'Address',
        'Licence No',
        'Licence Expiry',
        'Badge No',
        'Badge Expiry',
        'Aadhaar No',
        'PAN No',
        'Status',
        'Monthly Salary (₹)',
        'Joining Date',
        'Emergency Contact Name',
        'Emergency Contact Relation',
        'Emergency Contact Phone',
        'Assigned Vehicle Reg No',
        'Assigned Vehicle Model',
        'Vehicle Owner Name',
        'Vehicle Owner Phone',
      ];
      const rows = filteredDrivers.map((d) => {
        const assignedVeh = vehicles.find((v) => v.driverId === d.id || (v.driverName && v.driverName.trim().toLowerCase() === d.name.trim().toLowerCase()));
        const owner = assignedVeh ? owners.find((o) => o.id === assignedVeh.ownerId || (o.name && assignedVeh.ownerName && o.name.trim().toLowerCase() === assignedVeh.ownerName.trim().toLowerCase())) : null;
        return [
          d.id,
          d.name,
          d.driverType || (assignedVeh && assignedVeh.ownerName && d.name && assignedVeh.ownerName.trim().toLowerCase() === d.name.trim().toLowerCase() ? 'Owner-cum-Driver' : 'Owner-Paid'),
          d.phone || '',
          d.address || '',
          d.licenceNumber || '',
          formatDate(d.licenceExpiry),
          d.badgeNumber || '',
          formatDate(d.badgeExpiry),
          d.aadhaar || '',
          d.pan || '',
          d.status,
          d.salary !== undefined ? d.salary : '',
          formatDate(d.joiningDate),
          (() => {
            const pem = parseEmergencyDetails(d.emergencyContact, d.emergencyContactName, d.emergencyContactRelation, d.emergencyContactNumber);
            return pem.name;
          })(),
          (() => {
            const pem = parseEmergencyDetails(d.emergencyContact, d.emergencyContactName, d.emergencyContactRelation, d.emergencyContactNumber);
            return pem.relation;
          })(),
          (() => {
            const pem = parseEmergencyDetails(d.emergencyContact, d.emergencyContactName, d.emergencyContactRelation, d.emergencyContactNumber);
            return pem.number;
          })(),
          assignedVeh?.registrationNumber || 'Unassigned',
          assignedVeh ? `${assignedVeh.manufacturer} ${assignedVeh.model}` : '',
          assignedVeh?.ownerName || '',
          owner?.phone || assignedVeh?.ownerPhone || '',
        ];
      });

      const comprehensiveRows = vehicles.map(getComprehensiveRow);
      exportMultiSheetExcel('E7_Travels_Driver_Master_Register', [
        { sheetName: 'Driver Master', headers, rows },
        { sheetName: 'Comprehensive Fleet Master', headers: comprehensiveHeaders, rows: comprehensiveRows },
      ]);
    } else if (activeSubView === 'Company Master') {
      const headers = ['Company Name', 'Contact Person', 'Phone', 'Email', 'Billing Cycle', 'Payment Terms', 'Address'];
      const rows = filteredCompanies.map((c) => [
        c.name,
        c.contactPerson || '',
        c.phone || '',
        c.email || '',
        c.billingCycle || '',
        c.paymentTerms || '',
        c.address || '',
      ]);
      exportToExcel('E7_Travels_Company_Master', 'Company Master', headers, rows);
    } else if (activeSubView === 'Site Master') {
      const headers = ['Site ID', 'Site Name', 'Company Name', 'Location', 'Contact Person', 'Contact Phone'];
      const rows = filteredSites.map((s) => [
        s.id,
        s.name,
        s.companyName || '',
        s.location || '',
        s.contactPerson || '',
        s.phone || '',
      ]);
      exportToExcel('E7_Travels_Site_Master', 'Site Master', headers, rows);
    } else if (activeSubView === 'Vendor Register') {
      const headers = ['Vendor Name', 'Clients / Sites', 'Running Vehicles', 'Idle Vehicles', 'Total Attached', 'Utilization'];
      const rows = filteredVendors.map((v) => [
        v.vendorName,
        v.clientSites.join(', '),
        v.runningCount,
        v.idleCount,
        v.totalCount,
        `${v.utilizationRate}%`,
      ]);
      exportToExcel('E7_Travels_Vendor_Register', 'Vendor Register', headers, rows);
    } else if (activeSubView === 'Deleted Vehicles') {
      const headers = ['Delete ID', 'Reg Number', 'Vehicle Type', 'Owner Name', 'Driver Name', 'Company', 'Deleted Date', 'Reason'];
      const rows = (deletedVehicles || []).map((dv) => [
        dv.id,
        dv.registrationNumber,
        dv.vehicleType,
        dv.ownerName || '',
        dv.driverName || '',
        dv.company || '',
        formatDate(dv.deletedAt),
        dv.deletionReason || '',
      ]);
      exportToExcel('E7_Travels_Deleted_Vehicles', 'Deleted Vehicles', headers, rows);
    }
  };

  const handleExportPDF = () => {
    if (activeSubView === 'Vehicle Master') {
      const headers = [
        'Vehicle & Reg No',
        'Deployment & Status',
        'Compliance & Expiries',
        'Owner Full Details',
        'Driver Full Details',
        'GPS & Office Docs',
      ];

      const rows = filteredVehicles.map((v) => {
        const owner = owners.find(
          (o) => o.id === v.ownerId || (o.name && v.ownerName && o.name.trim().toLowerCase() === v.ownerName.trim().toLowerCase())
        );
        const driver = drivers.find(
          (d) => d.id === v.driverId || (d.name && v.driverName && d.name.trim().toLowerCase() === v.driverName.trim().toLowerCase())
        );
        const isOwnerDriver = Boolean(
          (v.ownerName && v.driverName && v.ownerName.trim().toLowerCase() === v.driverName.trim().toLowerCase()) ||
          driver?.driverType === 'Owner-cum-Driver'
        );

        // Vehicle column
        const vehicleCol = [
          v.registrationNumber,
          `ID: ${v.id}`,
          `${v.manufacturer} ${v.model} (${v.year || '-'})`,
          `Type: ${v.vehicleType} | ${v.fuelType}`,
          `Trans: ${v.transmission}`,
          v.fastagNumber ? `Fastag: ${v.fastagNumber}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        // Deployment column
        const deployCol = [
          `Status: ${v.status.toUpperCase()}`,
          `Site 1: ${v.company || 'Unassigned'}`,
          v.company2 || v.sitePreference2 ? `Site 2: ${v.company2 || v.sitePreference2}` : '',
          v.site || v.sitePreference3 ? `Site 3: ${v.site || v.sitePreference3}` : '',
          v.site2 || v.sitePreference4 ? `Site 4: ${v.site2 || v.sitePreference4}` : '',
          `Joined: ${formatDate(v.joiningDate) || '-'}`,
          v.paymentCycle ? `Cycle: ${v.paymentCycle}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        // Compliance & Expiries column
        const expiriesCol = [
          `Ins: ${formatDate(v.insuranceExpiry) || '-'}`,
          `FC: ${formatDate(v.fcExpiry) || '-'}`,
          `Permit: ${formatDate(v.permitExpiry) || '-'}`,
          `PUC: ${formatDate(v.pollutionExpiry) || '-'}`,
          v.emiAmount > 0 ? `EMI: ₹${Number(v.emiAmount).toLocaleString('en-IN')}` : 'No EMI',
          v.emiDueDate ? `Due: ${formatDate(v.emiDueDate)}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        // Owner column (FULL DATA)
        const ownerEmg = [owner?.emergencyContactName, owner?.emergencyContactRelation, owner?.emergencyContactNumber]
          .filter(Boolean)
          .join(' - ');
        const ownerCol = [
          `${owner?.name || v.ownerName || '-'} [${owner?.id || v.ownerId || '-'}]`,
          `Ph: ${owner?.phone || v.ownerPhone || '-'}`,
          owner?.address || v.ownerAddress ? `Addr: ${owner?.address || v.ownerAddress}` : '',
          `PAN: ${owner?.pan || '-'} | Aadh: ${owner?.aadhaar || '-'}`,
          owner?.bankName ? `Bank: ${owner.bankName}` : '',
          owner?.accountNumber ? `A/c: ${owner.accountNumber} | IFSC: ${owner.ifsc || '-'}` : '',
          owner?.upiId ? `UPI: ${owner.upiId}` : '',
          ownerEmg ? `Emg: ${ownerEmg}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        // Driver column (FULL DATA)
        const driverEmg = (() => {
          if (!driver) return '';
          const pem = parseEmergencyDetails(driver.emergencyContact, driver.emergencyContactName, driver.emergencyContactRelation, driver.emergencyContactNumber);
          return formatCombinedEmergency(pem.name, pem.relation, pem.number);
        })();
        const driverCol = [
          `${driver?.name || v.driverName || '-'} [${driver?.id || v.driverId || '-'}]`,
          `Type: ${driver?.driverType || (isOwnerDriver ? 'Owner-cum-Driver' : 'Owner-Paid')}`,
          `Ph: ${driver?.phone || '-'}`,
          driver?.licenceNumber ? `DL: ${driver.licenceNumber} (Exp: ${formatDate(driver.licenceExpiry) || '-'})` : 'DL: -',
          driver?.badgeNumber ? `Badge: ${driver.badgeNumber} (Exp: ${formatDate(driver.badgeExpiry) || '-'})` : '',
          `PAN: ${driver?.pan || '-'} | Aadh: ${driver?.aadhaar || '-'}`,
          driver?.address ? `Addr: ${driver.address}` : '',
          driver?.salary ? `Salary: ₹${Number(driver.salary).toLocaleString('en-IN')}` : '',
          driverEmg ? `Emg: ${driverEmg}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        // GPS & Docs column
        const gpsCol = [
          v.gpsVendor ? `GPS: ${v.gpsVendor}` : (v.gpsRequired === 'Yes' || v.gpsRequired === true ? 'GPS: Required (Pending)' : 'GPS: No'),
          v.gpsImei ? `IMEI: ${v.gpsImei}` : '',
          v.gpsFittingDate ? `Fit: ${formatDate(v.gpsFittingDate)}` : '',
          v.gpsReturned ? 'Return: Yes' : (v.status === 'Inactive' && v.gpsVendor ? 'Return: Pending' : ''),
          `Docs: ${v.officeDocSubmitted ? `Submitted (${v.officeDocVendorCompany || 'Vendor'})` : 'Pending'}`,
          v.officeDocLetterpadRef ? `Ref: ${v.officeDocLetterpadRef}` : '',
          v.officeDocSubmitDate ? `Date: ${formatDate(v.officeDocSubmitDate)}` : '',
          v.remarks ? `Note: ${v.remarks}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        return [vehicleCol, deployCol, expiriesCol, ownerCol, driverCol, gpsCol];
      });

      exportToPDF(
        'E7_Travels_Complete_Fleet_Master_Register',
        'E7 Travels - Complete Fleet Master Register (Vehicle, Owner & Driver Data)',
        headers,
        rows,
        'landscape',
        {
          styles: {
            fontSize: 6.5,
            cellPadding: 3,
            textColor: [30, 41, 59],
            overflow: 'linebreak',
          },
          columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 105 },
            2: { cellWidth: 105 },
            3: { cellWidth: 175 },
            4: { cellWidth: 180 },
            5: { cellWidth: 115 },
          },
        }
      );
    } else if (activeSubView === 'Owner Master') {
      const headers = ['Owner Details', 'Contact & Address', 'Banking Information', 'Identity & KYC', 'Emergency Contact', 'Attached Vehicles & Drivers'];
      const rows = filteredOwners.map((o) => {
        const attachedVehicles = vehicles.filter((v) => v.ownerId === o.id || (v.ownerName && v.ownerName.trim().toLowerCase() === o.name.trim().toLowerCase()));
        
        const attachedVehiclesText = attachedVehicles.length > 0
          ? attachedVehicles
              .map((v) => `${v.registrationNumber} (${v.manufacturer} ${v.model}) - Site: ${v.company || '-'} [Driver: ${v.driverName || 'None'}]`)
              .join('\n')
          : 'No attached vehicles';

        return [
          `${o.name}\nID: ${o.id}`,
          `Ph: ${o.phone || '-'}\nEmail: ${o.email || '-'}\nAddr: ${o.address || '-'}`,
          `Bank: ${o.bankName || '-'}\nA/c: ${o.accountNumber || '-'}\nIFSC: ${o.ifsc || '-'}\nUPI: ${o.upiId || '-'}`,
          `PAN: ${o.pan || '-'}\nAadhaar: ${o.aadhaar || '-'}`,
          [o.emergencyContactName, o.emergencyContactRelation, o.emergencyContactNumber].filter(Boolean).join(' - ') || '-',
          attachedVehiclesText,
        ];
      });

      exportToPDF(
        'E7_Travels_Owner_Master_Register',
        'E7 Travels - Vehicle Owner Master Register',
        headers,
        rows,
        'landscape',
        {
          styles: {
            fontSize: 7,
            cellPadding: 3.5,
            textColor: [30, 41, 59],
            overflow: 'linebreak',
          },
          columnStyles: {
            0: { cellWidth: 110 },
            1: { cellWidth: 140 },
            2: { cellWidth: 140 },
            3: { cellWidth: 100 },
            4: { cellWidth: 110 },
            5: { cellWidth: 200 },
          },
        }
      );
    } else if (activeSubView === 'Driver Master') {
      const headers = ['Driver Details', 'Contact & Address', 'Licence & Badge Info', 'Identity & Salary', 'Emergency Contact', 'Assigned Vehicle & Owner'];
      const rows = filteredDrivers.map((d) => {
        const assignedVeh = vehicles.find((v) => v.driverId === d.id || (v.driverName && v.driverName.trim().toLowerCase() === d.name.trim().toLowerCase()));
        const owner = assignedVeh ? owners.find((o) => o.id === assignedVeh.ownerId || (o.name && assignedVeh.ownerName && o.name.trim().toLowerCase() === assignedVeh.ownerName.trim().toLowerCase())) : null;

        const assignedText = assignedVeh
          ? `Reg: ${assignedVeh.registrationNumber}\nModel: ${assignedVeh.manufacturer} ${assignedVeh.model}\nSite: ${assignedVeh.company || '-'}\nOwner: ${assignedVeh.ownerName || '-'} (Ph: ${owner?.phone || assignedVeh.ownerPhone || '-'})`
          : 'Unassigned';

        return [
          `${d.name}\nID: ${d.id}\nType: ${d.driverType || 'Owner-Paid'}\nStatus: ${d.status}`,
          `Ph: ${d.phone || '-'}\nAddr: ${d.address || '-'}\nJoined: ${formatDate(d.joiningDate) || '-'}`,
          `DL: ${d.licenceNumber || '-'} (Exp: ${formatDate(d.licenceExpiry) || '-'})\nBadge: ${d.badgeNumber || '-'} (Exp: ${formatDate(d.badgeExpiry) || '-'})`,
          `Aadhaar: ${d.aadhaar || '-'}\nPAN: ${d.pan || '-'}\nSalary: ${d.salary ? `₹${Number(d.salary).toLocaleString('en-IN')}` : '-'}`,
          (() => {
            const pem = parseEmergencyDetails(d.emergencyContact, d.emergencyContactName, d.emergencyContactRelation, d.emergencyContactNumber);
            return formatCombinedEmergency(pem.name, pem.relation, pem.number) || '-';
          })(),
          assignedText,
        ];
      });

      exportToPDF(
        'E7_Travels_Driver_Master_Register',
        'E7 Travels - Driver Master Register',
        headers,
        rows,
        'landscape',
        {
          styles: {
            fontSize: 7,
            cellPadding: 3.5,
            textColor: [30, 41, 59],
            overflow: 'linebreak',
          },
          columnStyles: {
            0: { cellWidth: 110 },
            1: { cellWidth: 130 },
            2: { cellWidth: 140 },
            3: { cellWidth: 110 },
            4: { cellWidth: 110 },
            5: { cellWidth: 200 },
          },
        }
      );
    } else if (activeSubView === 'Company Master') {
      const headers = ['Company Name', 'Contact Person', 'Phone', 'Email', 'Billing Cycle', 'Payment Terms'];
      const rows = filteredCompanies.map((c) => [
        c.name,
        c.contactPerson || '-',
        c.phone || '-',
        c.email || '-',
        c.billingCycle || '-',
        c.paymentTerms || '-',
      ]);
      exportToPDF('E7_Travels_Company_Master', 'E7 Travels - Client Company Master', headers, rows, 'landscape');
    } else if (activeSubView === 'Site Master') {
      const headers = ['Site ID', 'Site Name', 'Company Name', 'Location', 'Contact Person', 'Phone'];
      const rows = filteredSites.map((s) => [
        s.id,
        s.name,
        s.companyName || '-',
        s.location || '-',
        s.contactPerson || '-',
        s.phone || '-',
      ]);
      exportToPDF('E7_Travels_Site_Master', 'E7 Travels - Operational Site Master', headers, rows, 'landscape');
    } else if (activeSubView === 'Vendor Register') {
      const headers = ['Vendor Name', 'Clients / Sites', 'Running', 'Idle', 'Total', 'Utilization'];
      const rows = filteredVendors.map((v) => [
        v.vendorName,
        v.clientSites.join(', ') || '-',
        v.runningCount,
        v.idleCount,
        v.totalCount,
        `${v.utilizationRate}%`,
      ]);
      exportToPDF('E7_Travels_Vendor_Register', 'E7 Travels - Vendor Register Summary', headers, rows, 'landscape');
    } else if (activeSubView === 'Deleted Vehicles') {
      const headers = ['Delete ID', 'Reg Number', 'Vehicle Type', 'Owner Name', 'Driver Name', 'Company', 'Deleted Date', 'Reason'];
      const rows = (deletedVehicles || []).map((dv) => [
        dv.id,
        dv.registrationNumber,
        dv.vehicleType,
        dv.ownerName || '-',
        dv.driverName || '-',
        dv.company || '-',
        formatDate(dv.deletedAt),
        dv.deletionReason || '-',
      ]);
      exportToPDF('E7_Travels_Deleted_Vehicles', 'E7 Travels - Deleted Vehicles Register', headers, rows, 'landscape');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Duplicate Vehicles Warning Banner */}
      {activeSubView === 'Vehicle Master' && duplicateVehicleGroups.size > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 p-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 mt-0.5 sm:mt-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                Duplicate Vehicle Registration Numbers Detected
                <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-2xs font-extrabold rounded-full">
                  {duplicateVehicleGroups.size} Duplicate Plated Number{duplicateVehicleGroups.size === 1 ? '' : 's'}
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                The following vehicle plate numbers are registered multiple times in Master Register:
                <span className="font-mono text-xs font-bold text-rose-900 ml-1">
                  {Array.from(duplicateVehicleGroups.keys()).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              id="btn-filter-duplicates"
              onClick={() => onSetVehicleFilter('duplicates')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
            >
              View Duplicates ({Array.from(duplicateVehicleGroups.values()).reduce((acc: number, l: Vehicle[]) => acc + l.length, 0)})
            </button>
            <button
              id="btn-clean-duplicates"
              onClick={() => handleCleanDuplicateVehicles()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" /> Merge & Remove Duplicates
            </button>
          </div>
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
            {activeSubView === 'Deleted Vehicles' && <Trash2 className="text-rose-600" />}
            {activeSubView === 'Vendor Register' ? 'Vendor Register' : activeSubView === 'Deleted Vehicles' ? 'Deleted Vehicles Archive' : `${activeSubView} Register`}
          </h2>
          <p className="text-xs text-slate-500">Manage data, configure parameters, and review system settings</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <button
            id="btn-export-excel-master"
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
            title={`Export ${activeSubView} to Excel spreadsheet (.xlsx)`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
          </button>
          <button
            id="btn-export-pdf-master"
            onClick={handleExportPDF}
            className="px-3.5 py-2 text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
            title={`Export ${activeSubView} to PDF document`}
          >
            <FileText className="h-4 w-4 text-rose-600" /> Export PDF
          </button>
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
          {activeSubView !== 'Deleted Vehicles' && (
            <button
              id="add-record-btn"
              onClick={() => {
                setIsAdding(true);
                setFormError(null);
              }}
              className="px-4 py-2 text-sm font-semibold bg-[#006B57] hover:bg-[#004D40] text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" /> {activeSubView === 'Site Master' ? 'Add Campus Site / Hub' : 'Add Record'}
            </button>
          )}
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
                      ? vehicles.filter(v => v.status === 'Inactive' && isGpsRequiredForVehicle(v) && !v.gpsReturned).length
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
                        : 'bg-[#006B57] border-[#006B57] text-white shadow-3xs'
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
          {duplicateVehicleGroups.size > 0 && (
            <button
              id="filter-tab-duplicates"
              onClick={() => onSetVehicleFilter('duplicates')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                vehicleFilter === 'duplicates'
                  ? 'bg-rose-600 border-rose-600 text-white shadow-3xs'
                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
              }`}
            >
              ⚠️ Duplicate Vehicles
              <span className={`px-1.5 py-0.5 rounded-full text-3xs font-black ${
                vehicleFilter === 'duplicates' ? 'bg-black/20 text-white' : 'bg-rose-200 text-rose-900'
              }`}>
                {Array.from(duplicateVehicleGroups.values()).reduce((acc: number, l: Vehicle[]) => acc + l.length, 0)}
              </span>
            </button>
          )}
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

              {/* VEHICLE MASTER FORM (UNIFIED CAR + OWNER + DRIVER EDIT) */}
              {activeSubView === 'Vehicle Master' && (
                <form onSubmit={handleSaveVehicle} className="space-y-6">
                  {/* Sub-tab Navigation */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setVehicleEditTab('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          vehicleEditTab === 'all'
                            ? 'bg-[#006B57] text-white shadow-3xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" /> All Sections (Unified)
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleEditTab('car')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          vehicleEditTab === 'car'
                            ? 'bg-[#006B57] text-white shadow-3xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <Car className="h-3.5 w-3.5" /> 🚗 Car Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleEditTab('owner')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          vehicleEditTab === 'owner'
                            ? 'bg-[#006B57] text-white shadow-3xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" /> 👤 Owner Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleEditTab('driver')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          vehicleEditTab === 'driver'
                            ? 'bg-[#006B57] text-white shadow-3xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        <Briefcase className="h-3.5 w-3.5" /> 🪪 Driver Details
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {vehicleForm.registrationNumber && (
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {vehicleForm.registrationNumber}
                        </span>
                      )}
                      <span className="text-2xs text-slate-500 font-medium">
                        {editingId ? `Editing Vehicle (${editingId})` : 'New Fleet Entry'}
                      </span>
                    </div>
                  </div>

                  {/* SECTION 1: CAR / VEHICLE DETAILS */}
                  {(vehicleEditTab === 'all' || vehicleEditTab === 'car') && (
                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                            <Car className="h-4 w-4" />
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            1. Car / Vehicle Specifications
                          </h4>
                        </div>
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Vehicle Profile
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Registration Number *</label>
                          <input
                            id="field-registrationNumber"
                            type="text"
                            placeholder="e.g. TN-07-E7-1234"
                            value={vehicleForm.registrationNumber || ''}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-mono uppercase font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Manufacturer *</label>
                          <input
                            id="field-manufacturer"
                            type="text"
                            placeholder="e.g. Maruti Suzuki, Toyota"
                            value={vehicleForm.manufacturer || ''}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, manufacturer: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Model *</label>
                          <input
                            id="field-model"
                            type="text"
                            placeholder="e.g. Dzire, Etios, Ertiga"
                            value={vehicleForm.model || ''}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Manufacturing Year</label>
                          <input
                            id="field-mfd-year"
                            type="number"
                            placeholder="e.g. 2023 or 2025"
                            min={1995}
                            max={2030}
                            value={vehicleForm.year || ''}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Registration Date</label>
                          <input
                            id="field-registrationDate"
                            type="date"
                            value={toInputDateFormat(vehicleForm.registrationDate || '')}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, registrationDate: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Fuel Type</label>
                          <select
                            id="field-fuelType"
                            value={vehicleForm.fuelType || 'Diesel'}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value as any })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          >
                            {FUEL_TYPES.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Type</label>
                          <select
                            id="field-vehicleType"
                            value={vehicleForm.vehicleType || 'Sedan'}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value as any })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          >
                            {VEHICLE_TYPES.map((vt) => (
                              <option key={vt} value={vt}>
                                {vt}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Site:</label>
                          <select
                            id="field-company"
                            value={cleanSiteValue(vehicleForm.company || vehicleForm.sitePreference1)}
                            onChange={(e) =>
                              setVehicleForm({
                                ...vehicleForm,
                                company: e.target.value,
                                sitePreference1: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          >
                            {renderCommonSiteOptions(
                              companies,
                              sites,
                              cleanSiteValue(vehicleForm.company || vehicleForm.sitePreference1),
                              false,
                              '-- Select Assigned Site --'
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Site Preference 2:</label>
                          <select
                            id="field-company2"
                            value={cleanSiteValue(vehicleForm.company2 || vehicleForm.sitePreference2)}
                            onChange={(e) =>
                              setVehicleForm({
                                ...vehicleForm,
                                company2: e.target.value,
                                sitePreference2: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          >
                            {renderCommonSiteOptions(
                              companies,
                              sites,
                              cleanSiteValue(vehicleForm.company2 || vehicleForm.sitePreference2),
                              false,
                              '-- None / Empty --'
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Site Preference 3:</label>
                          <select
                            id="field-site"
                            value={cleanSiteValue(vehicleForm.site || vehicleForm.sitePreference3)}
                            onChange={(e) =>
                              setVehicleForm({
                                ...vehicleForm,
                                site: e.target.value,
                                sitePreference3: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          >
                            {renderCommonSiteOptions(
                              companies,
                              sites,
                              cleanSiteValue(vehicleForm.site || vehicleForm.sitePreference3),
                              false,
                              '-- None / Empty --'
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Site Preference 4:</label>
                          <select
                            id="field-site2"
                            value={cleanSiteValue(vehicleForm.site2 || vehicleForm.sitePreference4)}
                            onChange={(e) =>
                              setVehicleForm({
                                ...vehicleForm,
                                site2: e.target.value,
                                sitePreference4: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          >
                            {renderCommonSiteOptions(
                              companies,
                              sites,
                              cleanSiteValue(vehicleForm.site2 || vehicleForm.sitePreference4),
                              false,
                              '-- None / Empty --'
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Monthly EMI Amount (₹)</label>
                          <input
                            id="field-emiAmount"
                            type="number"
                            placeholder="e.g. 18500"
                            value={vehicleForm.emiAmount !== undefined ? vehicleForm.emiAmount : ''}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, emiAmount: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">EMI Due Date</label>
                          <input
                            id="field-emiDueDate"
                            type="date"
                            value={toInputDateFormat(vehicleForm.emiDueDate || '')}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, emiDueDate: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Insurance Expiry</label>
                          <input
                            id="field-insuranceExpiry"
                            type="date"
                            value={toInputDateFormat(vehicleForm.insuranceExpiry || '')}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Permit Expiry</label>
                          <input
                            id="field-permitExpiry"
                            type="date"
                            value={toInputDateFormat(vehicleForm.permitExpiry || '')}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, permitExpiry: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Fitness Certificate (FC) Expiry</label>
                          <input
                            id="field-fcExpiry"
                            type="date"
                            value={toInputDateFormat(vehicleForm.fcExpiry || '')}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, fcExpiry: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Pollution (PUCC) Expiry</label>
                          <input
                            id="field-pollutionExpiry"
                            type="date"
                            value={toInputDateFormat(vehicleForm.pollutionExpiry || '')}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, pollutionExpiry: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">FASTag ID / Tag Number</label>
                          <input
                            id="field-fastagNumber"
                            type="text"
                            placeholder="e.g. NETC-FASTAG-987654"
                            value={vehicleForm.fastagNumber || ''}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, fastagNumber: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Fleet Joining Date</label>
                          <input
                            id="field-joiningDate"
                            type="date"
                            value={toInputDateFormat(vehicleForm.joiningDate || '')}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, joiningDate: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Fleet Status</label>
                          <select
                            id="field-status"
                            value={vehicleForm.status || 'Active'}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                          >
                            {VEHICLE_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Payment Billing Cycle</label>
                          <select
                            id="field-paymentCycle"
                            value={vehicleForm.paymentCycle || 'Monthly'}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, paymentCycle: e.target.value as any })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Weekly">Weekly (15 Days)</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Remarks / Notes</label>
                          <input
                            id="field-remarks"
                            type="text"
                            placeholder="e.g. Clean vehicle, AC working fine, VIP trips enabled"
                            value={vehicleForm.remarks || ''}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, remarks: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* GPS Device Tracking Sub-Panel */}
                      <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Radio className="h-4 w-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              GPS Device Hardware Tracking
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xs font-semibold text-slate-500">GPS Installed:</span>
                            <button
                              type="button"
                              onClick={() => setVehicleForm({
                                ...vehicleForm,
                                gpsRequired: vehicleForm.gpsRequired === 'No' || vehicleForm.gpsRequired === false ? 'Yes' : 'No'
                              })}
                              className={`px-2.5 py-1 text-2xs font-extrabold rounded-md border transition-colors cursor-pointer ${
                                vehicleForm.gpsRequired === 'No' || vehicleForm.gpsRequired === false
                                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                                  : 'bg-indigo-600 text-white border-indigo-600 shadow-3xs'
                              }`}
                            >
                              {vehicleForm.gpsRequired === 'No' || vehicleForm.gpsRequired === false ? 'NO (Exempt)' : 'YES (Required)'}
                            </button>
                          </div>
                        </div>

                        {(vehicleForm.gpsRequired === undefined || vehicleForm.gpsRequired === 'Yes' || vehicleForm.gpsRequired === true) && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                            <div>
                              <label className="block text-2xs font-bold text-slate-600 mb-1">GPS Vendor / Brand</label>
                              <input
                                id="field-gpsVendor"
                                type="text"
                                placeholder="e.g. Autoplant GPS, Fiesta GPS, Fleetx"
                                value={vehicleForm.gpsVendor || ''}
                                onChange={(e) => setVehicleForm({ ...vehicleForm, gpsVendor: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-2xs font-bold text-slate-600 mb-1">GPS Device IMEI No.</label>
                              <input
                                id="field-gpsImei"
                                type="text"
                                placeholder="15-digit IMEI number"
                                value={vehicleForm.gpsImei || ''}
                                onChange={(e) => setVehicleForm({ ...vehicleForm, gpsImei: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-2xs font-bold text-slate-600 mb-1">GPS Installation Date</label>
                              <input
                                id="field-gpsFittingDate"
                                type="date"
                                value={toInputDateFormat(vehicleForm.gpsFittingDate || '')}
                                onChange={(e) => setVehicleForm({ ...vehicleForm, gpsFittingDate: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: OWNER PARTNER DETAILS */}
                  {(vehicleEditTab === 'all' || vehicleEditTab === 'owner') && (
                    <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                            <Users className="h-4 w-4" />
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            2. Linked Owner Partner Information
                          </h4>
                        </div>
                        <span className="text-2xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          Auto-saved to Owner Master
                        </span>
                      </div>

                      {/* Owner Quick Select Dropdown */}
                      <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Select Existing Owner or Fill Details Below
                        </label>
                        <select
                          id="field-owner-select-picker"
                          value={
                            ownerForm.id ||
                            (owners.some((o) => o.id === vehicleForm.ownerId)
                              ? vehicleForm.ownerId
                              : owners.find((o) => o.name && ownerForm.name && o.name.trim().toLowerCase() === ownerForm.name.trim().toLowerCase())?.id || '')
                          }
                          onChange={(e) => {
                            const selId = e.target.value;
                            if (!selId) {
                              setOwnerForm({
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
                                emergencyContactName: '',
                                emergencyContactRelation: '',
                                emergencyContactNumber: '',
                              });
                              setVehicleForm((prev) => ({ ...prev, ownerId: '', ownerName: '' }));
                              if (driverForm.driverType === 'Owner-cum-Driver') {
                                setDriverForm((prev) => ({
                                  ...prev,
                                  name: '',
                                  phone: '',
                                  address: '',
                                  aadhaar: '',
                                  pan: '',
                                  emergencyContactName: '',
                                  emergencyContactRelation: '',
                                  emergencyContactNumber: '',
                                  emergencyContact: '',
                                }));
                                setVehicleForm((prev) => ({ ...prev, driverName: '' }));
                              }
                              return;
                            }
                            const matched = owners.find((o) => o.id === selId);
                            if (matched) {
                              setOwnerForm({ ...matched });
                              setVehicleForm((prev) => ({ ...prev, ownerId: matched.id, ownerName: matched.name }));
                              if (driverForm.driverType === 'Owner-cum-Driver') {
                                setDriverForm((prev) => ({
                                  ...prev,
                                  name: matched.name,
                                  phone: matched.phone,
                                  address: matched.address || prev.address,
                                  aadhaar: matched.aadhaar || prev.aadhaar,
                                  pan: matched.pan || prev.pan,
                                  emergencyContactName: matched.emergencyContactName || prev.emergencyContactName,
                                  emergencyContactRelation: matched.emergencyContactRelation || prev.emergencyContactRelation,
                                  emergencyContactNumber: matched.emergencyContactNumber || prev.emergencyContactNumber,
                                  emergencyContact: formatCombinedEmergency(matched.emergencyContactName, matched.emergencyContactRelation, matched.emergencyContactNumber) || prev.emergencyContact,
                                }));
                                setVehicleForm((prev) => ({ ...prev, driverName: matched.name }));
                              }
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                        >
                          <option value="">➕ [Create / Enter New Owner Record]</option>
                          {owners.map((o, index) => (
                            <option key={`${o.id}-${index}`} value={o.id}>
                              {o.name} ({o.id}) {o.phone ? `- 📞 ${o.phone}` : ''} {o.bankName ? `[${o.bankName}]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Owner Full Name *</label>
                          <input
                            id="field-owner-name"
                            type="text"
                            placeholder="e.g. Rajesh Kumar"
                            value={ownerForm.name || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matchedOwner = owners.find((o) => o.name && o.name.trim().toLowerCase() === val.trim().toLowerCase());
                              setOwnerForm((prev) => ({
                                ...prev,
                                id: matchedOwner ? matchedOwner.id : undefined,
                                name: val,
                                phone: matchedOwner ? matchedOwner.phone : prev.phone,
                              }));
                              setVehicleForm((prev) => ({
                                ...prev,
                                ownerName: val,
                                ownerId: matchedOwner ? matchedOwner.id : undefined,
                              }));
                              if (driverForm.driverType === 'Owner-cum-Driver') {
                                const matchedDriver = drivers.find((d) => d.name && d.name.trim().toLowerCase() === val.trim().toLowerCase());
                                setDriverForm((prev) => ({
                                  ...prev,
                                  id: matchedDriver ? matchedDriver.id : undefined,
                                  name: val,
                                  phone: matchedDriver ? matchedDriver.phone : (matchedOwner ? matchedOwner.phone : prev.phone),
                                }));
                                setVehicleForm((prev) => ({
                                  ...prev,
                                  driverName: val,
                                  driverId: matchedDriver ? matchedDriver.id : undefined,
                                }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                          <input
                            id="field-owner-phone"
                            type="text"
                            placeholder="e.g. 9876543210"
                            value={ownerForm.phone || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOwnerForm({ ...ownerForm, phone: val });
                              if (driverForm.driverType === 'Owner-cum-Driver') {
                                setDriverForm((prev) => ({ ...prev, phone: val }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                          <input
                            id="field-owner-email"
                            type="email"
                            placeholder="owner@example.com"
                            value={ownerForm.email || ''}
                            onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
                          <input
                            id="field-owner-bankName"
                            type="text"
                            placeholder="e.g. HDFC Bank, SBI, ICICI"
                            value={ownerForm.bankName || ''}
                            onChange={(e) => setOwnerForm({ ...ownerForm, bankName: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Account Number</label>
                          <input
                            id="field-owner-accountNumber"
                            type="text"
                            placeholder="e.g. 50100234567890"
                            value={ownerForm.accountNumber || ''}
                            onChange={(e) => setOwnerForm({ ...ownerForm, accountNumber: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">IFSC Code</label>
                          <input
                            id="field-owner-ifsc"
                            type="text"
                            placeholder="e.g. HDFC0001234"
                            value={ownerForm.ifsc || ''}
                            onChange={(e) => setOwnerForm({ ...ownerForm, ifsc: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">UPI ID</label>
                          <input
                            id="field-owner-upiId"
                            type="text"
                            placeholder="e.g. rajesh@okaxis"
                            value={ownerForm.upiId || ''}
                            onChange={(e) => setOwnerForm({ ...ownerForm, upiId: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">PAN Card Number</label>
                          <input
                            id="field-owner-pan"
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            value={ownerForm.pan || ''}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setOwnerForm({ ...ownerForm, pan: val });
                              if (driverForm.driverType === 'Owner-cum-Driver' && (driverForm.name === ownerForm.name || !driverForm.name)) {
                                setDriverForm((prev) => ({ ...prev, pan: val }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Aadhaar Card Number</label>
                          <input
                            id="field-owner-aadhaar"
                            type="text"
                            placeholder="12-digit Aadhaar Number"
                            value={ownerForm.aadhaar || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOwnerForm({ ...ownerForm, aadhaar: val });
                              if (driverForm.driverType === 'Owner-cum-Driver' && (driverForm.name === ownerForm.name || !driverForm.name)) {
                                setDriverForm((prev) => ({ ...prev, aadhaar: val }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Residential Address</label>
                          <input
                            id="field-owner-address"
                            type="text"
                            placeholder="Street, Area, City, Pin code"
                            value={ownerForm.address || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOwnerForm({ ...ownerForm, address: val });
                              if (driverForm.driverType === 'Owner-cum-Driver' && (driverForm.name === ownerForm.name || !driverForm.name)) {
                                setDriverForm((prev) => ({ ...prev, address: val }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact Name</label>
                          <input
                            id="field-owner-emergencyContactName"
                            type="text"
                            placeholder="e.g. Suresh Kumar"
                            value={ownerForm.emergencyContactName || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOwnerForm({ ...ownerForm, emergencyContactName: val });
                              if (driverForm.driverType === 'Owner-cum-Driver' && (driverForm.name === ownerForm.name || !driverForm.name)) {
                                setDriverForm((prev) => ({ ...prev, emergencyContactName: val }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Relationship</label>
                          <select
                            id="field-owner-emergencyContactRelation"
                            value={ownerForm.emergencyContactRelation || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOwnerForm({ ...ownerForm, emergencyContactRelation: val });
                              if (driverForm.driverType === 'Owner-cum-Driver' && (driverForm.name === ownerForm.name || !driverForm.name)) {
                                setDriverForm((prev) => ({ ...prev, emergencyContactRelation: val }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          >
                            <option value="">-- Select Relation --</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Wife">Wife</option>
                            <option value="Husband">Husband</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Friend">Friend</option>
                            <option value="Relative">Relative</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Phone Number</label>
                          <input
                            id="field-owner-emergencyContactNumber"
                            type="text"
                            placeholder="e.g. 9876543211"
                            value={ownerForm.emergencyContactNumber || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOwnerForm({ ...ownerForm, emergencyContactNumber: val });
                              if (driverForm.driverType === 'Owner-cum-Driver' && (driverForm.name === ownerForm.name || !driverForm.name)) {
                                setDriverForm((prev) => ({ ...prev, emergencyContactNumber: val }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 3: ASSIGNED DRIVER DETAILS */}
                  {(vehicleEditTab === 'all' || vehicleEditTab === 'driver') && (
                    <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                            <Briefcase className="h-4 w-4" />
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            3. Assigned Driver Information
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                            Auto-saved to Driver Master
                          </span>
                        </div>
                      </div>

                      {/* OPTION: SET OWNER AS DRIVER (OWNER-CUM-DRIVER) */}
                      <div className={`p-3.5 rounded-xl border transition-all ${
                        driverForm.driverType === 'Owner-cum-Driver'
                          ? 'bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-purple-50/80 border-indigo-300 shadow-sm'
                          : 'bg-white border-emerald-200/80 shadow-2xs'
                      }`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                              <input
                                type="checkbox"
                                id="toggle-owner-as-driver"
                                checked={driverForm.driverType === 'Owner-cum-Driver'}
                                onChange={(e) => handleSetOwnerAsDriver(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <label
                                  htmlFor="toggle-owner-as-driver"
                                  className="text-xs font-black text-slate-900 cursor-pointer flex items-center gap-1.5"
                                >
                                  <UserCheck className="h-4 w-4 text-indigo-600" />
                                  SET OWNER AS DRIVER (Owner-cum-Driver / Self-Driven)
                                </label>
                                {driverForm.driverType === 'Owner-cum-Driver' ? (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-600 text-white shadow-2xs flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> OWNER-CUM-DRIVER ENABLED
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    Owner-Paid Mode
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1">
                                Enable this option if the owner drives this vehicle. Automatically populates & syncs Driver Name, Phone, Address, Aadhaar, PAN, and Emergency Contacts directly from Owner details.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {driverForm.driverType === 'Owner-cum-Driver' ? (
                              <button
                                type="button"
                                id="btn-resync-owner-details"
                                onClick={() => handleSetOwnerAsDriver(true)}
                                className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                title="Re-sync all details from Owner section"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Re-Sync from Owner
                              </button>
                            ) : (
                              <button
                                type="button"
                                id="btn-quick-set-owner-as-driver"
                                onClick={() => handleSetOwnerAsDriver(true)}
                                className="px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Set Owner as Driver with one click"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                                Set Owner as Driver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Driver Quick Select Dropdown */}
                      <div className="bg-white p-3 rounded-lg border border-emerald-200/80">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Select Existing Driver or Fill Details Below
                        </label>
                        <select
                          id="field-driver-select-picker"
                          value={
                            driverForm.id ||
                            (drivers.some((d) => d.id === vehicleForm.driverId)
                              ? vehicleForm.driverId
                              : drivers.find((d) => d.name && driverForm.name && d.name.trim().toLowerCase() === driverForm.name.trim().toLowerCase())?.id || '')
                          }
                          onChange={(e) => {
                            const selId = e.target.value;
                            if (!selId) {
                              setDriverForm({
                                name: '',
                                phone: '',
                                licenceNumber: '',
                                licenceExpiry: '',
                                badgeNumber: '',
                                badgeExpiry: '',
                                address: '',
                                salary: 0,
                                aadhaar: '',
                                pan: '',
                                driverType: 'Owner-Paid',
                                status: 'Active',
                                emergencyContactName: '',
                                emergencyContactRelation: '',
                                emergencyContactNumber: '',
                              });
                              setVehicleForm((prev) => ({ ...prev, driverId: '', driverName: '' }));
                              return;
                            }
                            const matched = drivers.find((d) => d.id === selId);
                            if (matched) {
                              setDriverForm({ ...matched });
                              setVehicleForm((prev) => ({ ...prev, driverId: matched.id, driverName: matched.name }));
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                        >
                          <option value="">➕ [Create / Enter New Driver Record]</option>
                          {drivers.map((d, index) => (
                            <option key={`${d.id}-${index}`} value={d.id}>
                              {d.name} ({d.id}) {d.phone ? `- 📞 ${d.phone}` : ''} {d.licenceNumber ? `[DL: ${d.licenceNumber}]` : ''} {d.driverType === 'Owner-cum-Driver' ? '(Owner-cum-Driver)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-slate-700">Driver Full Name *</label>
                            {driverForm.driverType === 'Owner-cum-Driver' && (
                              <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5">
                                <Sparkles className="h-2.5 w-2.5" /> (Owner)
                              </span>
                            )}
                          </div>
                          <input
                            id="field-driver-name"
                            type="text"
                            placeholder="e.g. Ramesh Kumar"
                            value={driverForm.name || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matchedDriver = drivers.find((d) => d.name && d.name.trim().toLowerCase() === val.trim().toLowerCase());
                              const isOwnerName = Boolean(ownerForm.name && val.trim().toLowerCase() === ownerForm.name.trim().toLowerCase());
                              setDriverForm((prev) => ({
                                ...prev,
                                id: matchedDriver ? matchedDriver.id : undefined,
                                name: val,
                                phone: matchedDriver ? matchedDriver.phone : prev.phone,
                                driverType: matchedDriver?.driverType || (isOwnerName ? 'Owner-cum-Driver' : 'Owner-Paid'),
                              }));
                              setVehicleForm((prev) => ({
                                ...prev,
                                driverName: val,
                                driverId: matchedDriver ? matchedDriver.id : undefined,
                              }));
                            }}
                            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white font-medium focus:ring-2 ${
                              driverForm.driverType === 'Owner-cum-Driver'
                                ? 'border-indigo-300 focus:ring-indigo-500 bg-indigo-50/20'
                                : 'border-slate-200 focus:ring-emerald-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-slate-700">Driver Phone Number *</label>
                            {driverForm.driverType === 'Owner-cum-Driver' && (
                              <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5">
                                <Sparkles className="h-2.5 w-2.5" /> (Owner)
                              </span>
                            )}
                          </div>
                          <input
                            id="field-driver-phone"
                            type="text"
                            placeholder="e.g. 9840123456"
                            value={driverForm.phone || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 ${
                              driverForm.driverType === 'Owner-cum-Driver'
                                ? 'border-indigo-300 focus:ring-indigo-500 bg-indigo-50/20'
                                : 'border-slate-200 focus:ring-emerald-500'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Driver Type</label>
                          <select
                            id="field-driverType"
                            value={driverForm.driverType || 'Owner-Paid'}
                            onChange={(e) => {
                              const val = e.target.value as 'Owner-Paid' | 'Owner-cum-Driver';
                              if (val === 'Owner-cum-Driver') {
                                handleSetOwnerAsDriver(true);
                              } else {
                                handleSetOwnerAsDriver(false);
                              }
                            }}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 font-bold ${
                              driverForm.driverType === 'Owner-cum-Driver'
                                ? 'border-indigo-300 focus:ring-indigo-500 bg-indigo-50/40 text-indigo-900'
                                : 'border-slate-200 focus:ring-emerald-500 bg-white text-slate-800'
                            }`}
                          >
                            <option value="Owner-Paid">Owner-Paid Driver</option>
                            <option value="Owner-cum-Driver">Owner-cum-Driver (Self Driven)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Driving Licence Number *</label>
                          <input
                            id="field-driver-licenceNumber"
                            type="text"
                            placeholder="e.g. TN-07-20150001234"
                            value={driverForm.licenceNumber || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, licenceNumber: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Licence Expiry Date</label>
                          <input
                            id="field-driver-licenceExpiry"
                            type="date"
                            value={toInputDateFormat(driverForm.licenceExpiry || '')}
                            onChange={(e) => setDriverForm({ ...driverForm, licenceExpiry: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Badge Number</label>
                          <input
                            id="field-driver-badgeNumber"
                            type="text"
                            placeholder="e.g. BDG-4458"
                            value={driverForm.badgeNumber || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, badgeNumber: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Badge Expiry Date</label>
                          <input
                            id="field-driver-badgeExpiry"
                            type="date"
                            value={toInputDateFormat(driverForm.badgeExpiry || '')}
                            onChange={(e) => setDriverForm({ ...driverForm, badgeExpiry: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Base Salary / Remuneration (₹)</label>
                          <input
                            id="field-driver-salary"
                            type="number"
                            placeholder="e.g. 20000"
                            value={driverForm.salary !== undefined ? driverForm.salary : ''}
                            onChange={(e) => setDriverForm({ ...driverForm, salary: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Driver Status</label>
                          <select
                            id="field-driver-status"
                            value={driverForm.status || 'Active'}
                            onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value as any })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Aadhaar Card Number</label>
                          <input
                            id="field-driver-aadhaar"
                            type="text"
                            placeholder="12-digit Aadhaar"
                            value={driverForm.aadhaar || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, aadhaar: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">PAN Card Number</label>
                          <input
                            id="field-driver-pan"
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            value={driverForm.pan || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, pan: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Joining Date</label>
                          <input
                            id="field-driver-joiningDate"
                            type="date"
                            value={toInputDateFormat(driverForm.joiningDate || '')}
                            onChange={(e) => setDriverForm({ ...driverForm, joiningDate: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Residential Address</label>
                          <input
                            id="field-driver-address"
                            type="text"
                            placeholder="Driver local residential address"
                            value={driverForm.address || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Contact Name</label>
                          <input
                            id="field-driver-emergencyContactName"
                            type="text"
                            placeholder="e.g. Meena (Wife)"
                            value={driverForm.emergencyContactName || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, emergencyContactName: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Relationship</label>
                          <select
                            id="field-driver-emergencyContactRelation"
                            value={driverForm.emergencyContactRelation || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, emergencyContactRelation: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          >
                            <option value="">-- Select Relation --</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Wife">Wife</option>
                            <option value="Husband">Husband</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Friend">Friend</option>
                            <option value="Relative">Relative</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Emergency Phone Number</label>
                          <input
                            id="field-driver-emergencyContactNumber"
                            type="text"
                            placeholder="e.g. 9840123457"
                            value={driverForm.emergencyContactNumber || ''}
                            onChange={(e) => setDriverForm({ ...driverForm, emergencyContactNumber: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STICKY BOTTOM FORM ACTIONS BAR */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white sticky bottom-0 z-10 py-2">
                    <div className="flex flex-wrap items-center gap-2 text-2xs text-slate-600">
                      <span className="font-semibold text-slate-400 uppercase">Save Summary:</span>
                      <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200 font-mono">
                        🚗 {vehicleForm.registrationNumber || 'No Reg Number'}
                      </span>
                      <span className="bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200">
                        👤 {ownerForm.name || vehicleForm.ownerName || 'No Owner'}
                      </span>
                      <span className="bg-emerald-50 text-emerald-900 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        🪪 {driverForm.name || vehicleForm.driverName || 'No Driver'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={resetForms}
                        className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-save-vehicle"
                        type="submit"
                        className="px-5 py-2 text-sm font-bold bg-[#006B57] hover:bg-[#004D40] text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {editingId ? 'Save All Changes (Car + Owner + Driver)' : 'Save New Record (Car + Owner + Driver)'}
                      </button>
                    </div>
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
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Name</label>
                <input
                  id="field-owner-emergencyContactName"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={ownerForm.emergencyContactName || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, emergencyContactName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Relationship</label>
                <div className="space-y-1">
                  <select
                    id="field-owner-emergencyContactRelation"
                    value={
                      ['Father', 'Mother', 'Wife', 'Husband', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Friend', 'Relative'].includes(ownerForm.emergencyContactRelation || '')
                        ? ownerForm.emergencyContactRelation
                        : (ownerForm.emergencyContactRelation ? 'Other' : '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const rel = val === 'Other' ? '' : val;
                      setOwnerForm({ ...ownerForm, emergencyContactRelation: rel });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select Relationship --</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Wife">Wife</option>
                    <option value="Husband">Husband</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Friend">Friend</option>
                    <option value="Relative">Relative</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                  {(!['Father', 'Mother', 'Wife', 'Husband', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Friend', 'Relative', ''].includes(ownerForm.emergencyContactRelation || '') || ownerForm.emergencyContactRelation === '') && (
                    <input
                      type="text"
                      placeholder="Specify Relationship..."
                      value={ownerForm.emergencyContactRelation || ''}
                      onChange={(e) => setOwnerForm({ ...ownerForm, emergencyContactRelation: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white mt-1"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Number</label>
                <input
                  id="field-owner-emergencyContactNumber"
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={ownerForm.emergencyContactNumber || ''}
                  onChange={(e) => setOwnerForm({ ...ownerForm, emergencyContactNumber: e.target.value })}
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
                  className="px-4 py-2 text-sm font-semibold bg-[#006B57] hover:bg-[#004D40] text-white rounded-lg shadow-xs transition-colors mr-2 cursor-pointer"
                >
                  Save Owner Details
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Name</label>
                <input
                  id="field-driver-emergencyContactName"
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={driverForm.emergencyContactName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const rel = driverForm.emergencyContactRelation || '';
                    const num = driverForm.emergencyContactNumber || '';
                    setDriverForm({
                      ...driverForm,
                      emergencyContactName: val,
                      emergencyContact: formatCombinedEmergency(val, rel, num)
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Relationship</label>
                <div className="space-y-1">
                  <select
                    id="field-driver-emergencyContactRelation"
                    value={
                      ['Father', 'Mother', 'Wife', 'Husband', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Friend', 'Relative'].includes(driverForm.emergencyContactRelation || '')
                        ? driverForm.emergencyContactRelation
                        : (driverForm.emergencyContactRelation ? 'Other' : '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const rel = val === 'Other' ? '' : val;
                      const name = driverForm.emergencyContactName || '';
                      const num = driverForm.emergencyContactNumber || '';
                      setDriverForm({
                        ...driverForm,
                        emergencyContactRelation: rel,
                        emergencyContact: formatCombinedEmergency(name, rel, num)
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select Relationship --</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Wife">Wife</option>
                    <option value="Husband">Husband</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Friend">Friend</option>
                    <option value="Relative">Relative</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                  {(!['Father', 'Mother', 'Wife', 'Husband', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Friend', 'Relative', ''].includes(driverForm.emergencyContactRelation || '') || driverForm.emergencyContactRelation === '') && (
                    <input
                      type="text"
                      placeholder="Specify Relationship (e.g. Uncle, Guardian)..."
                      value={driverForm.emergencyContactRelation || ''}
                      onChange={(e) => {
                        const rel = e.target.value;
                        const name = driverForm.emergencyContactName || '';
                        const num = driverForm.emergencyContactNumber || '';
                        setDriverForm({
                          ...driverForm,
                          emergencyContactRelation: rel,
                          emergencyContact: formatCombinedEmergency(name, rel, num)
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white mt-1"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Number</label>
                <input
                  id="field-driver-emergencyContactNumber"
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={driverForm.emergencyContactNumber || ''}
                  onChange={(e) => {
                    const num = e.target.value;
                    const name = driverForm.emergencyContactName || '';
                    const rel = driverForm.emergencyContactRelation || '';
                    setDriverForm({
                      ...driverForm,
                      emergencyContactNumber: num,
                      emergencyContact: formatCombinedEmergency(name, rel, num)
                    });
                  }}
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
                  className="px-4 py-2 text-sm font-semibold bg-[#006B57] hover:bg-[#004D40] text-white rounded-lg shadow-xs transition-colors mr-2 cursor-pointer"
                >
                  Save Driver Partner
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
                  className="px-4 py-2 text-sm font-semibold bg-[#006B57] hover:bg-[#004D40] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
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
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{v.registrationNumber}</span>
                        {duplicateVehicleGroups.has(normalizeRegNumber(v.registrationNumber)) && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold rounded uppercase tracking-wider">
                            Duplicate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-semibold text-slate-800">{v.manufacturer} {v.model}</div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500 font-medium">
                        {v.year ? <span>Mfg: {v.year}</span> : null}
                        {v.registrationDate ? <span className="text-blue-600 font-semibold">Reg: {formatDate(v.registrationDate)}</span> : null}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{v.vehicleType}</td>
                    <td className="py-3 px-4 text-xs">{getFuelTypeBadge(v.fuelType)}</td>
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
                            if (v.status === 'Inactive' || isGpsRequiredForVehicle(v)) {
                              setGpsModalVehicle(v);
                              setGpsModalForm({
                                gpsRequired: (v.gpsRequired === 'No' || v.gpsRequired === false) ? 'No' : (isGpsRequiredForVehicle(v) ? 'Yes' : 'No'),
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
                            v.status === 'Inactive' || isGpsRequiredForVehicle(v) ? 'cursor-pointer hover:scale-105 transition-transform shadow-3xs' : ''
                          }`}
                          title="Click to manage GPS Mandatory status & Device Return"
                        >
                          {badge.label}
                        </button>
                        
                        {isGpsRequiredForVehicle(v) ? (
                          <span className={`text-[9px] font-mono flex items-center gap-0.5 ${
                            v.status === 'Inactive' && !v.gpsReturned ? 'text-rose-600 font-extrabold' : 'text-slate-500'
                          }`}>
                            <Radio className="h-2.5 w-2.5 text-indigo-500 inline shrink-0" />
                            {v.gpsVendor || 'GPS'} {v.status === 'Inactive' ? (v.gpsReturned ? '(Returned)' : '🚨 HELD') : ''}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-mono italic">
                            GPS: Not Mandatory
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
                            setIsAdding(true);
                            setEditingId(v.id);
                            setVehicleEditTab('all');
                            setFormError(null);
                            const currentOwner = (v.ownerId ? owners.find(o => o.id === v.ownerId) : null) ||
                                                 (v.ownerName && v.ownerName.trim() ? owners.find(o => o.name && o.name.trim().toLowerCase() === v.ownerName.trim().toLowerCase()) : null);
                            const currentDriver = (v.driverId ? drivers.find(d => d.id === v.driverId) : null) ||
                                                  (v.driverName && v.driverName.trim() ? drivers.find(d => d.name && d.name.trim().toLowerCase() === v.driverName.trim().toLowerCase()) : null);
                            setVehicleForm({
                              ...v,
                              registrationDate: v.registrationDate || '',
                              company: cleanSiteValue(v.company || v.sitePreference1),
                              company2: cleanSiteValue(v.company2 || v.sitePreference2),
                              site: cleanSiteValue(v.site || v.sitePreference3),
                              site2: cleanSiteValue(v.site2 || v.sitePreference4),
                              sitePreference1: cleanSiteValue(v.company || v.sitePreference1),
                              sitePreference2: cleanSiteValue(v.company2 || v.sitePreference2),
                              sitePreference3: cleanSiteValue(v.site || v.sitePreference3),
                              sitePreference4: cleanSiteValue(v.site2 || v.sitePreference4),
                              gpsRequired: v.gpsRequired || (isGpsRequiredForVehicle(v) ? 'Yes' : 'No'),
                              ownerId: currentOwner ? currentOwner.id : v.ownerId,
                              ownerName: currentOwner ? currentOwner.name : v.ownerName,
                              driverId: currentDriver ? currentDriver.id : v.driverId,
                              driverName: currentDriver ? currentDriver.name : v.driverName
                            });
                            if (currentOwner) {
                              setOwnerForm({
                                ...currentOwner,
                                emergencyContactName: currentOwner.emergencyContactName || '',
                                emergencyContactNumber: currentOwner.emergencyContactNumber || '',
                                emergencyContactRelation: currentOwner.emergencyContactRelation || '',
                              });
                            } else {
                              setOwnerForm({
                                name: v.ownerName || '',
                                phone: v.ownerPhone || '',
                                address: v.ownerAddress || '',
                              });
                            }
                            const isOwnerSameAsDriver = Boolean(
                              (v.driverName && v.ownerName && v.driverName.trim().toLowerCase() === v.ownerName.trim().toLowerCase()) ||
                              (currentOwner && currentDriver && currentOwner.name.trim().toLowerCase() === currentDriver.name.trim().toLowerCase())
                            );

                            if (currentDriver) {
                              const parsedEm = parseEmergencyDetails(
                                currentDriver.emergencyContact,
                                currentDriver.emergencyContactName,
                                currentDriver.emergencyContactRelation,
                                currentDriver.emergencyContactNumber
                              );
                              setDriverForm({
                                ...currentDriver,
                                driverType: isOwnerSameAsDriver ? 'Owner-cum-Driver' : (currentDriver.driverType || 'Owner-Paid'),
                                emergencyContactName: parsedEm.name,
                                emergencyContactNumber: parsedEm.number,
                                emergencyContactRelation: parsedEm.relation,
                              });
                            } else if (isOwnerSameAsDriver && currentOwner) {
                              setDriverForm({
                                name: currentOwner.name,
                                phone: currentOwner.phone || '',
                                address: currentOwner.address || '',
                                aadhaar: currentOwner.aadhaar || '',
                                pan: currentOwner.pan || '',
                                licenceNumber: '',
                                driverType: 'Owner-cum-Driver',
                                status: 'Active',
                                emergencyContactName: currentOwner.emergencyContactName || '',
                                emergencyContactNumber: currentOwner.emergencyContactNumber || '',
                                emergencyContactRelation: currentOwner.emergencyContactRelation || '',
                              });
                            } else {
                              setDriverForm({
                                name: v.driverName || '',
                                phone: '',
                                licenceNumber: '',
                                driverType: isOwnerSameAsDriver ? 'Owner-cum-Driver' : 'Owner-Paid',
                                status: 'Active',
                              });
                            }
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                          title="Edit Vehicle, Owner & Driver Profile"
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
                    <td className="py-3 px-4 text-slate-700">
                      <div>{o.phone}</div>
                      {(o.emergencyContactName || o.emergencyContactRelation || o.emergencyContactNumber) && (
                        <div className="text-2xs text-rose-600 font-medium mt-0.5">
                          Emg: {
                            o.emergencyContactName
                              ? `${o.emergencyContactName}${o.emergencyContactRelation ? ` (${o.emergencyContactRelation})` : ''}${o.emergencyContactNumber ? ` - ${o.emergencyContactNumber}` : ''}`
                              : (o.emergencyContactRelation
                                  ? `${o.emergencyContactRelation}${o.emergencyContactNumber ? ` - ${o.emergencyContactNumber}` : ''}`
                                  : o.emergencyContactNumber)
                          }
                        </div>
                      )}
                    </td>
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
                            setOwnerForm({
                              ...o,
                              emergencyContactName: o.emergencyContactName || '',
                              emergencyContactNumber: o.emergencyContactNumber || '',
                              emergencyContactRelation: o.emergencyContactRelation || '',
                            });
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
                    <td className="py-3 px-4 text-slate-700">
                      <div>{d.phone}</div>
                      {(d.emergencyContactName || d.emergencyContactRelation || d.emergencyContactNumber || d.emergencyContact) && (
                        <div className="text-2xs text-rose-600 font-medium mt-0.5">
                          Emg: {
                            d.emergencyContactName
                              ? `${d.emergencyContactName}${d.emergencyContactRelation ? ` (${d.emergencyContactRelation})` : ''}${d.emergencyContactNumber ? ` - ${d.emergencyContactNumber}` : ''}`
                              : (d.emergencyContactRelation
                                  ? `${d.emergencyContactRelation}${d.emergencyContactNumber ? ` - ${d.emergencyContactNumber}` : ''}`
                                  : (d.emergencyContactNumber || d.emergencyContact))
                          }
                        </div>
                      )}
                    </td>
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
                        className={`inline-flex items-center justify-center px-3 py-1 text-2xs font-extrabold rounded-full border shadow-3xs ${
                          d.status === 'Active'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                            : 'bg-rose-100 border-rose-300 text-rose-900'
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
                            const parsedEm = parseEmergencyDetails(
                              d.emergencyContact,
                              d.emergencyContactName,
                              d.emergencyContactRelation,
                              d.emergencyContactNumber
                            );

                            setDriverForm({
                              ...d,
                              emergencyContactName: parsedEm.name,
                              emergencyContactNumber: parsedEm.number,
                              emergencyContactRelation: parsedEm.relation,
                            });
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
                      <th className="py-3.5 px-4 text-center bg-amber-100/70 text-amber-950 border-r border-amber-200">
                        IDLE VEHICLES
                      </th>
                      <th className="py-3.5 px-4">Running Vehicle Types</th>
                      <th className="py-3.5 px-4 text-center">Fleet Utilization</th>
                      <th className="py-3.5 px-4 text-center">View Fleet Details</th>
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
                          <button
                            id={`btn-total-${v.vendorName.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => {
                              setSelectedVendorForFleet(v.vendorName);
                              setVendorModalTab('all');
                              setVendorModalSearch('');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-800 rounded-lg font-black text-xs transition-all cursor-pointer border border-slate-200 shadow-3xs"
                            title={`Click to view all ${v.totalCount} attached vehicles for ${v.vendorName}`}
                          >
                            {v.totalCount}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center bg-emerald-50/40 border-x border-emerald-100">
                          <button
                            id={`btn-col-running-${v.vendorName.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => {
                              setSelectedVendorForFleet(v.vendorName);
                              setVendorModalTab('running');
                              setVendorModalSearch('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs transition-all cursor-pointer hover:scale-105"
                            title={`Click to view ${v.runningCount} active running vehicles for ${v.vendorName}`}
                          >
                            <Car className="h-3.5 w-3.5" />
                            {v.runningCount} RUNNING
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center bg-amber-50/30 border-r border-amber-100">
                          <button
                            id={`btn-col-idle-${v.vendorName.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => {
                              setSelectedVendorForFleet(v.vendorName);
                              setVendorModalTab('idle');
                              setVendorModalSearch('');
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer hover:scale-105 ${
                              v.idleCount > 0
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-3xs border border-amber-600'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                            }`}
                            title={`Click to view ${v.idleCount} idle / standby vehicles for ${v.vendorName}`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {v.idleCount} IDLE
                          </button>
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-view-running-${v.vendorName.toLowerCase().replace(/\s+/g, '-')}`}
                              onClick={() => {
                                setSelectedVendorForFleet(v.vendorName);
                                setVendorModalTab('running');
                                setVendorModalSearch('');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-3xs transition-all flex items-center gap-1 cursor-pointer"
                              title={`View ${v.runningCount} Running Vehicles`}
                            >
                              <Car className="h-3.5 w-3.5" /> Running ({v.runningCount})
                            </button>
                            <button
                              id={`btn-view-idle-${v.vendorName.toLowerCase().replace(/\s+/g, '-')}`}
                              onClick={() => {
                                setSelectedVendorForFleet(v.vendorName);
                                setVendorModalTab('idle');
                                setVendorModalSearch('');
                              }}
                              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg shadow-3xs transition-all flex items-center gap-1 cursor-pointer ${
                                v.idleCount > 0
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-3xs'
                                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              }`}
                              title={`View ${v.idleCount} Idle / Standby Vehicles`}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" /> Idle ({v.idleCount})
                            </button>
                          </div>
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

        {/* DELETED VEHICLES ARCHIVE VIEW */}
        {activeSubView === 'Deleted Vehicles' && (
          <div className="p-6 space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-rose-950 to-slate-900 text-white p-4 rounded-xl shadow-xs border border-rose-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">Deleted Fleet Archive</span>
                  <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                    <Trash2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-black tracking-tight">{deletedVehicles.length}</div>
                <div className="text-[10px] text-rose-200 mt-1 flex items-center gap-1 font-semibold">
                  <Archive className="h-3 w-3 text-rose-400" /> Preserved in System Archive
                </div>
              </div>

              <div className="bg-purple-50 text-purple-950 p-4 rounded-xl shadow-xs border border-purple-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">Deleted EV Vehicles</span>
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-900 tracking-tight">
                  {deletedVehicles.filter((dv) => dv.fuelType === 'EV').length}
                </div>
                <div className="text-[10px] text-purple-700 font-bold mt-1">
                  ⚡ Electric Fleet Archive Records
                </div>
              </div>

              <div className="bg-cyan-50 text-cyan-950 p-4 rounded-xl shadow-xs border border-cyan-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700">Deleted CNG Fleet</span>
                  <div className="p-2 bg-cyan-100 text-cyan-700 rounded-lg">
                    <Car className="h-5 w-5 text-cyan-600" />
                  </div>
                </div>
                <div className="text-2xl font-black text-cyan-900 tracking-tight">
                  {deletedVehicles.filter((dv) => dv.fuelType === 'CNG').length}
                </div>
                <div className="text-[10px] text-cyan-700 font-bold mt-1">
                  CNG Fuel Type Vehicles
                </div>
              </div>

              <div className="bg-amber-50 text-amber-950 p-4 rounded-xl shadow-xs border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Diesel / Petrol Deleted</span>
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <Car className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-900 tracking-tight">
                  {deletedVehicles.filter((dv) => dv.fuelType === 'Diesel' || dv.fuelType === 'Petrol').length}
                </div>
                <div className="text-[10px] text-amber-700 font-bold mt-1">
                  Diesel & Petrol Fleet Records
                </div>
              </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-rose-600" />
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Deleted Vehicles Master Register ({deletedVehicles.length})
                  </h3>
                </div>
                <div className="text-2xs text-slate-500 font-medium">
                  Vehicles deleted from any screen are safely preserved here with full details.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Reg Number</th>
                      <th className="py-3 px-4">Model & Make</th>
                      <th className="py-3 px-4">Fuel Type</th>
                      <th className="py-3 px-4">Owner & Driver</th>
                      <th className="py-3 px-4">Company & Site</th>
                      <th className="py-3 px-4">Deletion Time & Reason</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white">
                    {deletedVehicles
                      .filter((dv) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          !q ||
                          dv.registrationNumber.toLowerCase().includes(q) ||
                          (dv.model && dv.model.toLowerCase().includes(q)) ||
                          (dv.manufacturer && dv.manufacturer.toLowerCase().includes(q)) ||
                          (dv.ownerName && dv.ownerName.toLowerCase().includes(q)) ||
                          (dv.driverName && dv.driverName.toLowerCase().includes(q)) ||
                          (dv.company && dv.company.toLowerCase().includes(q)) ||
                          (dv.deletionReason && dv.deletionReason.toLowerCase().includes(q)) ||
                          (dv.fuelType && dv.fuelType.toLowerCase().includes(q))
                        );
                      })
                      .map((dv) => (
                        <tr key={dv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-black text-slate-900 tracking-wide whitespace-nowrap">
                            <span className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-md font-mono text-slate-800 shadow-3xs">
                              {dv.registrationNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{dv.model || 'N/A'}</div>
                            <div className="text-2xs text-slate-500">{dv.manufacturer || 'N/A'} • {dv.vehicleType || 'Sedan'} ({dv.year || '2024'})</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {getFuelTypeBadge(dv.fuelType)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{dv.ownerName || 'N/A'}</div>
                            <div className="text-2xs text-slate-500">Driver: {dv.driverName || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-700">{dv.company || 'N/A'}</div>
                            <div className="text-2xs text-slate-500">{dv.site || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-rose-700 text-[11px]">{dv.deletedAt}</div>
                            <div className="text-2xs text-slate-500">{dv.deletionReason || 'Deleted'}</div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                id={`btn-restore-veh-${dv.id}`}
                                onClick={() => setRestoreCandidate(dv)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-2xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Restore vehicle options"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Restore
                              </button>
                              <button
                                id={`btn-view-deleted-veh-${dv.id}`}
                                onClick={() => setViewDeletedVehicle(dv)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 text-2xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="View full details"
                              >
                                <Eye className="h-3.5 w-3.5" /> Details
                              </button>
                              <button
                                id={`btn-purge-deleted-veh-${dv.id}`}
                                onClick={() => setPermanentDeleteCandidate(dv)}
                                className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Permanently delete from archive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {deletedVehicles.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-slate-400">
                          <Archive className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-slate-700 text-sm">No Deleted Vehicles in Archive</p>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                            When vehicle details are deleted from any screen or register, they will be preserved here automatically for your record and restore options.
                          </p>
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
                {activeSubView === 'Vehicle Master' ? (
                  <span className="block mt-2 text-xs text-rose-700 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    ⚠️ Deleting this vehicle will automatically remove its associated <strong>Owner</strong> and <strong>Driver</strong> details from the Master Register.
                  </span>
                ) : (
                  ' This action is permanent and cannot be undone.'
                )}
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
                      const vehRegNorm = (vehicleToDelete.registrationNumber || '').replace(/\s+/g, '').toLowerCase();
                      const vehOwnerNameNorm = (vehicleToDelete.ownerName || '').trim().toLowerCase();
                      const vehDriverNameNorm = (vehicleToDelete.driverName || '').trim().toLowerCase();

                      const linkedOwner = owners.find(
                        (o) =>
                          (vehicleToDelete.ownerId && vehicleToDelete.ownerId !== 'new' && o.id === vehicleToDelete.ownerId) ||
                          (o.name && vehOwnerNameNorm && o.name.trim().toLowerCase() === vehOwnerNameNorm)
                      );
                      const linkedDriver = drivers.find(
                        (d) =>
                          (vehicleToDelete.driverId && vehicleToDelete.driverId !== 'new' && d.id === vehicleToDelete.driverId) ||
                          (d.name && vehDriverNameNorm && d.name.trim().toLowerCase() === vehDriverNameNorm)
                      );

                      const deletedRecord: DeletedVehicle = {
                        id: `DEL-VEH-${Date.now()}`,
                        originalVehicleId: vehicleToDelete.id,
                        registrationNumber: vehicleToDelete.registrationNumber,
                        model: vehicleToDelete.model,
                        manufacturer: vehicleToDelete.manufacturer,
                        year: vehicleToDelete.year,
                        fuelType: vehicleToDelete.fuelType,
                        vehicleType: vehicleToDelete.vehicleType,
                        ownerName: vehicleToDelete.ownerName || linkedOwner?.name || 'N/A',
                        driverName: vehicleToDelete.driverName || linkedDriver?.name || 'N/A',
                        company: vehicleToDelete.company || 'N/A',
                        site: vehicleToDelete.site || 'N/A',
                        joiningDate: vehicleToDelete.joiningDate || '',
                        deletedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
                        deletedBy: 'Admin / System',
                        deletionReason: 'Deleted from Master Registers',
                        originalVehicle: vehicleToDelete,
                        associatedOwner: linkedOwner,
                        associatedDriver: linkedDriver,
                      };
                      if (onUpdateDeletedVehicles) {
                        onUpdateDeletedVehicles([deletedRecord, ...(deletedVehicles || [])]);
                      }

                      // Automatically delete parallel owner and driver associated with this vehicle
                      const nextOwners = owners.filter((o) => {
                        if (vehicleToDelete.ownerId && vehicleToDelete.ownerId !== 'new' && o.id === vehicleToDelete.ownerId) return false;
                        if (linkedOwner && o.id === linkedOwner.id) return false;
                        if (vehOwnerNameNorm && vehOwnerNameNorm !== 'n/a' && vehOwnerNameNorm !== 'unknown owner' && o.name && o.name.trim().toLowerCase() === vehOwnerNameNorm) return false;
                        if (vehRegNorm && o.remarks && o.remarks.replace(/\s+/g, '').toLowerCase().includes(vehRegNorm)) return false;
                        return true;
                      });
                      onUpdateOwners(nextOwners);

                      const nextDrivers = drivers.filter((d) => {
                        if (vehicleToDelete.driverId && vehicleToDelete.driverId !== 'new' && d.id === vehicleToDelete.driverId) return false;
                        if (linkedDriver && d.id === linkedDriver.id) return false;
                        if (vehDriverNameNorm && vehDriverNameNorm !== 'n/a' && vehDriverNameNorm !== 'unknown driver' && d.name && d.name.trim().toLowerCase() === vehDriverNameNorm) return false;
                        return true;
                      });
                      onUpdateDrivers(nextDrivers);
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
          owners={owners}
          vehicles={vehicles}
          drivers={drivers}
          companies={companies}
          sites={sites}
          customLogo={customLogo}
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
                    {vendorModalTab === 'idle' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    ) : vendorModalTab === 'running' ? (
                      <Car className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Building className="h-5 w-5 text-blue-400" />
                    )}
                    {vendorModalTab === 'idle'
                      ? 'Idle & Standby Vehicles List'
                      : vendorModalTab === 'running'
                      ? 'Running Vehicles List'
                      : 'All Attached Vehicles Register'}
                    <span className="text-xs font-normal text-slate-300">
                      — Vendor: <strong className="text-white">{selectedVendorForFleet}</strong>
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {vendorModalTab === 'idle'
                      ? `Viewing idle / standby / inactive vehicles attached to ${selectedVendorForFleet}`
                      : vendorModalTab === 'running'
                      ? `Viewing active running vehicles operating under ${selectedVendorForFleet}`
                      : `Viewing all attached fleet for ${selectedVendorForFleet}`}
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

            {/* Modal Toolbar & Filter Tabs */}
            {(() => {
              const selectedVendorData = availableVendorCalculations.find((v) => v.vendorName === selectedVendorForFleet);
              const totalAttached = selectedVendorData?.totalCount || 0;
              const runningCount = selectedVendorData?.runningCount || 0;
              const idleCount = selectedVendorData?.idleCount || 0;

              return (
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* All Vehicles Tab */}
                    <button
                      type="button"
                      id="vendor-modal-tab-all"
                      onClick={() => setVendorModalTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                        vendorModalTab === 'all'
                          ? 'bg-slate-800 text-white border-slate-800 shadow-3xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Building className="h-3.5 w-3.5" />
                      All Attached ({totalAttached})
                    </button>

                    {/* Running Vehicles Tab */}
                    <button
                      type="button"
                      id="vendor-modal-tab-running"
                      onClick={() => setVendorModalTab('running')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                        vendorModalTab === 'running'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                          : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <Car className="h-3.5 w-3.5" />
                      Running Vehicles ({runningCount})
                    </button>

                    {/* Idle Vehicles Tab */}
                    <button
                      type="button"
                      id="vendor-modal-tab-idle"
                      onClick={() => setVendorModalTab('idle')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                        vendorModalTab === 'idle'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-3xs'
                          : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Idle Vehicles ({idleCount})
                    </button>
                  </div>

                  <div className="relative flex-1 max-w-xs min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search reg no, driver, owner, phone..."
                      value={vendorModalSearch}
                      onChange={(e) => setVendorModalSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full font-medium"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Modal Table Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const selectedVendorData = availableVendorCalculations.find((v) => v.vendorName === selectedVendorForFleet);
                if (!selectedVendorData) return null;

                const baseList =
                  vendorModalTab === 'running'
                    ? selectedVendorData.runningVehicles
                    : vendorModalTab === 'idle'
                    ? selectedVendorData.idleVehicles
                    : selectedVendorData.attachedVehicles;

                const filteredList = baseList.filter((v) => {
                  const q = vendorModalSearch.toLowerCase();
                  if (!q) return true;
                  const owner = owners.find((o) => o.id === v.ownerId);
                  const driver = drivers.find((d) => d.id === v.driverId);
                  return (
                    v.registrationNumber.toLowerCase().includes(q) ||
                    (v.driverName || driver?.name || '').toLowerCase().includes(q) ||
                    (driver?.phone || '').toLowerCase().includes(q) ||
                    (v.ownerName || owner?.name || '').toLowerCase().includes(q) ||
                    (owner?.phone || '').toLowerCase().includes(q) ||
                    (v.company || '').toLowerCase().includes(q) ||
                    (v.site || '').toLowerCase().includes(q) ||
                    (v.vehicleType || '').toLowerCase().includes(q) ||
                    (v.model || '').toLowerCase().includes(q)
                  );
                });

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
                        {filteredList.map((veh, idx) => {
                          const owner = owners.find((o) => o.id === veh.ownerId);
                          const driver = drivers.find((d) => d.id === veh.driverId);
                          const isRunning = veh.status !== 'Inactive';

                          return (
                            <tr key={veh.id} className={`hover:bg-slate-50 transition-colors ${!isRunning ? 'bg-amber-50/20' : ''}`}>
                              <td className="py-2.5 px-3 font-bold text-slate-400 text-[10px]">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-black text-slate-900 tracking-tight font-mono text-xs">
                                {veh.registrationNumber}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800 block">{veh.model || veh.vehicleType}</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[10px] text-slate-500 font-semibold">{veh.vehicleType}</span>
                                  <span className="text-slate-300 text-[10px]">&bull;</span>
                                  {getFuelTypeBadge(veh.fuelType)}
                                </div>
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
                                {isRunning ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                                    Running
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                                    Idle
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredList.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                              {vendorModalTab === 'idle' ? (
                                <div>
                                  <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto mb-2 opacity-60" />
                                  <p className="font-bold text-slate-600 text-xs">No idle vehicles found for {selectedVendorForFleet}.</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">All attached vehicles for this vendor are currently active and running.</p>
                                </div>
                              ) : vendorModalTab === 'running' ? (
                                <div>
                                  <Car className="h-6 w-6 text-slate-400 mx-auto mb-2 opacity-60" />
                                  <p className="font-bold text-slate-600 text-xs">No active running vehicles found for {selectedVendorForFleet}.</p>
                                </div>
                              ) : (
                                <div>
                                  <Building className="h-6 w-6 text-slate-400 mx-auto mb-2 opacity-60" />
                                  <p className="font-bold text-slate-600 text-xs">No vehicles found matching your search.</p>
                                </div>
                              )}
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
                const isReq = (gpsModalForm.gpsRequired ?? (isGpsRequiredForVehicle(gpsModalVehicle) ? 'Yes' : 'No')) === 'Yes';
                const updatedVehicles = vehicles.map((v) => {
                  if (v.id === gpsModalVehicle.id) {
                    return {
                      ...v,
                      gpsRequired: (isReq ? 'Yes' : 'No') as 'Yes' | 'No',
                      gpsVendor: isReq ? (gpsModalForm.gpsVendor || v.gpsVendor) : (v.gpsVendor || 'None'),
                      gpsImei: isReq ? (gpsModalForm.gpsImei || v.gpsImei) : v.gpsImei,
                      gpsReturned: !isReq ? true : gpsModalForm.gpsReturned,
                      gpsReturnDate: (!isReq || !gpsModalForm.gpsReturned) ? '' : gpsModalForm.gpsReturnDate,
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
              {/* GPS Mandatory Toggle Option */}
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-slate-800 uppercase block">
                    GPS Tracking Status
                  </span>
                  <span className="text-2xs text-slate-500">
                    Specify if GPS hardware is mandatory/installed for {gpsModalVehicle.registrationNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setGpsModalForm({ ...gpsModalForm, gpsRequired: 'Yes' })}
                    className={`px-2.5 py-1 rounded text-2xs font-extrabold uppercase transition-all cursor-pointer ${
                      (gpsModalForm.gpsRequired ?? (isGpsRequiredForVehicle(gpsModalVehicle) ? 'Yes' : 'No')) === 'Yes'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    GPS Enabled
                  </button>
                  <button
                    type="button"
                    onClick={() => setGpsModalForm({ ...gpsModalForm, gpsRequired: 'No', gpsReturned: true })}
                    className={`px-2.5 py-1 rounded text-2xs font-extrabold uppercase transition-all cursor-pointer ${
                      (gpsModalForm.gpsRequired ?? (isGpsRequiredForVehicle(gpsModalVehicle) ? 'Yes' : 'No')) === 'No'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    GPS Not Mandatory
                  </button>
                </div>
              </div>

              {((gpsModalForm.gpsRequired ?? (isGpsRequiredForVehicle(gpsModalVehicle) ? 'Yes' : 'No')) === 'No') ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-2xs uppercase text-emerald-800">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    GPS Not Mandatory Selected
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    By marking GPS as <strong>Not Mandatory</strong> for this vehicle, any status changes to <strong>Inactive</strong> will <strong>NOT hold payments</strong> or block financial transactions.
                  </p>
                </div>
              ) : (
                <>
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
                      <input
                        type="text"
                        placeholder="e.g. Autoplant GPS, Fiesta GPS"
                        value={gpsModalForm.gpsVendor || gpsModalVehicle.gpsVendor || ''}
                        onChange={(e) => setGpsModalForm({ ...gpsModalForm, gpsVendor: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-bold text-slate-900 border border-slate-200 rounded bg-white mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Device IMEI Number</span>
                      <input
                        type="text"
                        placeholder="15-digit IMEI"
                        value={gpsModalForm.gpsImei || gpsModalVehicle.gpsImei || ''}
                        onChange={(e) => setGpsModalForm({ ...gpsModalForm, gpsImei: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-mono font-bold text-slate-900 border border-slate-200 rounded bg-white mt-1"
                      />
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
                </>
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
          owners={owners}
          drivers={drivers}
          onClose={() => setShowPrintVehicleReport(false)}
          initialFilter={vehicleFilter}
        />
      )}

      {/* VIEW DELETED VEHICLE DETAILS MODAL */}
      {viewDeletedVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                  <Archive className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                    Deleted Vehicle Archive Record
                  </h3>
                  <p className="text-2xs text-slate-400 font-mono mt-0.5">
                    Reg: {viewDeletedVehicle.registrationNumber} • Deleted At: {viewDeletedVehicle.deletedAt}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDeletedVehicle(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Top Banner */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start justify-between gap-4">
                <div>
                  <span className="text-2xs font-extrabold text-rose-700 uppercase tracking-wider block mb-1">
                    Deletion Metadata
                  </span>
                  <p className="text-xs text-slate-700 font-semibold">
                    Reason: <span className="text-slate-900 font-bold">{viewDeletedVehicle.deletionReason || 'Deleted from System'}</span>
                  </p>
                  <p className="text-2xs text-slate-500 mt-1">
                    Deleted By: {viewDeletedVehicle.deletedBy || 'Admin'} • Time: {viewDeletedVehicle.deletedAt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRestoreCandidate(viewDeletedVehicle)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" /> Restore Vehicle
                </button>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Registration</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{viewDeletedVehicle.registrationNumber}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Fuel Type</span>
                  <div>{getFuelTypeBadge(viewDeletedVehicle.fuelType)}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Model / Make</span>
                  <span className="font-bold text-slate-800">{viewDeletedVehicle.model}</span>
                  <div className="text-2xs text-slate-500">{viewDeletedVehicle.manufacturer} ({viewDeletedVehicle.year})</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Owner Name</span>
                  <span className="font-bold text-slate-800">{viewDeletedVehicle.ownerName || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Driver Name</span>
                  <span className="font-bold text-slate-800">{viewDeletedVehicle.driverName || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Vehicle Type</span>
                  <span className="font-bold text-slate-800">{viewDeletedVehicle.vehicleType}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Assigned Company</span>
                  <span className="font-bold text-slate-800">{viewDeletedVehicle.company || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Assigned Site</span>
                  <span className="font-bold text-slate-800">{viewDeletedVehicle.site || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">Joining Date</span>
                  <span className="font-bold text-slate-800">{viewDeletedVehicle.joiningDate || 'N/A'}</span>
                </div>
              </div>

              {/* Full Original Object Preview */}
              {viewDeletedVehicle.originalVehicle && (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-2xs space-y-2">
                  <span className="font-extrabold text-slate-700 uppercase tracking-wider block">Preserved Original Vehicle Fields:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 font-mono">
                    <div>Insurance Expiry: {viewDeletedVehicle.originalVehicle.insuranceExpiry || 'N/A'}</div>
                    <div>FC Expiry: {viewDeletedVehicle.originalVehicle.fcExpiry || 'N/A'}</div>
                    <div>Permit Expiry: {viewDeletedVehicle.originalVehicle.permitExpiry || 'N/A'}</div>
                    <div>EMI Amount: ₹{viewDeletedVehicle.originalVehicle.emiAmount || 0}</div>
                    <div>EMI Due Date: {viewDeletedVehicle.originalVehicle.emiDueDate || 'N/A'}</div>
                    <div>Fastag: {viewDeletedVehicle.originalVehicle.fastagNumber || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewDeletedVehicle(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT PURGE CONFIRMATION MODAL */}
      {permanentDeleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Permanently Delete Record</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently purge vehicle <span className="font-extrabold text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">{permanentDeleteCandidate.registrationNumber}</span> from the deleted vehicle archive?
            </p>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-2xs text-rose-800 font-semibold">
              ⚠️ Warning: This operation will permanently remove the archived record from Firestore and browser persistence.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPermanentDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-bold bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (permanentDeleteCandidate) {
                    onUpdateDeletedVehicles(deletedVehicles.filter((dv) => dv.id !== permanentDeleteCandidate.id));
                    setPermanentDeleteCandidate(null);
                  }
                }}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Purge Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Destination Choice Modal */}
      {restoreCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Restore Deleted Vehicle</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Choose where you want to restore <span className="font-extrabold text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{restoreCandidate.registrationNumber}</span> ({restoreCandidate.model || 'Vehicle'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRestoreCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700">Archived Record Info:</span> Owner: <span className="font-semibold text-slate-900">{restoreCandidate.ownerName || 'N/A'}</span> • Driver: <span className="font-semibold text-slate-900">{restoreCandidate.driverName || 'N/A'}</span> • Reason: <span className="font-semibold text-rose-700">{restoreCandidate.deletionReason || 'Deleted'}</span>
            </p>

            <div className="pt-1">
              {/* Direct Restore to Master Register */}
              <button
                type="button"
                onClick={() => {
                  onRestoreVehicle(restoreCandidate, 'master');
                  setRestoreCandidate(null);
                  setViewDeletedVehicle(null);
                }}
                className="w-full p-4 rounded-xl border-2 border-emerald-200 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
                      <Car className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Active Fleet
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-900 mb-1">
                    Restore to Vehicle Master Register
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Restores directly as an active vehicle record in the Vehicle Master Fleet Register with all owner, driver, and site affiliations preserved.
                  </p>
                </div>
                <div className="mt-3 text-2xs font-extrabold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Confirm Restore to Master &rarr;
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestoreCandidate(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
