import React, { useState, useRef, useEffect } from 'react';
import { Enquiry, Site, Vehicle, Owner, Driver, Company, DeletedVehicle, detectManufacturer } from '../types';
import { generateUniqueOwnerId, generateUniqueDriverId, generateUniqueVehicleId } from '../lib/idUtils';
import {
  Layers,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  Calendar,
  XCircle,
  MapPin,
  User,
  Car,
  Database,
  Sparkles,
  MessageSquare,
  ClipboardCheck,
  Building,
  Check,
  AlertCircle,
  RotateCcw,
  Printer,
  Filter,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  X,
} from 'lucide-react';

interface InductionViewsProps {
  enquiries: Enquiry[];
  sites: Site[];
  onUpdateEnquiries: (newEnquiries: Enquiry[]) => void;
  vehicles?: Vehicle[];
  owners?: Owner[];
  drivers?: Driver[];
  companies?: Company[];
  onUpdateVehicles?: (newVehicles: Vehicle[]) => void;
  onUpdateOwners?: (newOwners: Owner[]) => void;
  onUpdateDrivers?: (newDrivers: Driver[]) => void;
  onNavigate?: (route: string) => void;
  deletedVehicles?: DeletedVehicle[];
  onUpdateDeletedVehicles?: (newDeletedVehicles: DeletedVehicle[]) => void;
}

export default function InductionViews({
  enquiries,
  sites,
  onUpdateEnquiries,
  vehicles = [],
  owners = [],
  drivers = [],
  companies = [],
  onUpdateVehicles,
  onUpdateOwners,
  onUpdateDrivers,
  onNavigate,
}: InductionViewsProps) {
  // Helper to extract clean Owner Name and Phone Number for Induction view
  const getOwnerDisplayDetails = (enq: Enquiry) => {
    let name = enq.ownerName || '';
    let phone = enq.ownerMobile || '';

    if (!name && enq.ownerId) {
      const o = owners.find((item) => item.id === enq.ownerId);
      if (o) {
        name = o.name;
        if (!phone) phone = o.phone;
      }
    }

    if (!name && enq.ownerNamePhone) {
      const raw = enq.ownerNamePhone.trim();
      const parts = raw.split(/[-–—/]/);
      if (parts.length >= 2) {
        const part1 = parts[0].trim();
        const part2 = parts[1].trim();

        if (/^\+?\d[\d\s-]{6,}$/.test(part1) && !/^\+?\d[\d\s-]{6,}$/.test(part2)) {
          phone = part1;
          name = part2;
        } else {
          name = part1;
          phone = part2;
        }
      } else {
        if (/^\+?\d[\d\s-]{6,}$/.test(raw)) {
          phone = raw;
          const matchedByPhone = owners.find(
            (o) => o.phone.replace(/[^0-9]/g, '') === raw.replace(/[^0-9]/g, '')
          );
          if (matchedByPhone) {
            name = matchedByPhone.name;
          } else {
            name = 'Owner';
          }
        } else {
          name = raw;
        }
      }
    }

    if (name && !phone) {
      const matchedByName = owners.find((o) => o.name.toLowerCase() === name.toLowerCase());
      if (matchedByName) {
        phone = matchedByName.phone;
      }
    }

    return {
      displayName: name || enq.ownerNamePhone || 'Unspecified Owner',
      displayPhone: phone || '',
    };
  };

  // Helper to format dates to DD/MM/YYYY format
  const formatDateDDMMYYYY = (dateStr?: string | null): string => {
    if (!dateStr || dateStr.trim() === '' || dateStr.trim() === 'N/A') return 'N/A';
    const trimmed = dateStr.trim();

    // If ISO datetime or YYYY-MM-DD
    const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
      return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
    }

    // If already DD/MM/YYYY or DD-MM-YYYY
    const dmy = trimmed.match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})$/);
    if (dmy) {
      return `${dmy[1]}/${dmy[2]}/${dmy[3]}`;
    }

    // Standard JS Date parsing
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      // Ignore
    }

    return trimmed;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStep, setFilterStep] = useState<'All' | 'Step1' | 'Step2' | 'Step3'>('All');
  const [filterVehicleType, setFilterVehicleType] = useState<string>('All');
  const [filterCompany, setFilterCompany] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<
    | 'date-desc'
    | 'date-asc'
    | 'enq-asc'
    | 'enq-desc'
    | 'vehicle-asc'
    | 'owner-asc'
    | 'driver-asc'
    | 'site-asc'
  >('date-desc');

  const [editingEnq, setEditingEnq] = useState<Enquiry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingEnqId, setDeletingEnqId] = useState<string | null>(null);
  const [restoringEnqId, setRestoringEnqId] = useState<string | null>(null);

  // Comments State
  const [activeCommentTarget, setActiveCommentTarget] = useState<Enquiry | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Promotion/Master Register State
  const [promotingEnquiry, setPromotingEnquiry] = useState<Enquiry | null>(null);
  const [promoteForm, setPromoteForm] = useState({
    createVehicle: true,
    createOwner: false,
    createDriver: false,
    registrationNumber: '',
    model: '',
    manufacturer: 'Toyota',
    year: 2024,
    fuelType: 'Diesel' as 'CNG' | 'Diesel' | 'Petrol' | 'EV',
    transmission: 'Manual' as 'Manual' | 'Automatic',
    vehicleType: 'Sedan' as 'Sedan' | 'SUV' | 'Hatchback' | 'Bus' | 'Tempo Traveler',
    company: '',
    site: '',
    joiningDate: '',
    ownerId: 'new',
    ownerName: '',
    ownerPhone: '',
    driverId: 'new',
    driverName: '',
    driverPhone: '',
    driverDl: '',
    driverDlExp: '',
    driverAadhaar: '',
    driverAddress: '',
    officeDocSubmitted: false,
    officeDocSubmitDate: '',
    officeDocVendorCompany: '',
    officeDocLetterpadRef: '',
    officeDocRemarks: '',
  });
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);

  // Step-by-Step Induction Pipeline Local Input States
  const [step1Company, setStep1Company] = useState<Record<string, string>>({});
  const [step1Date, setStep1Date] = useState<Record<string, string>>({});
  const [step2Vendor, setStep2Vendor] = useState<Record<string, string>>({});
  const [step2Imei, setStep2Imei] = useState<Record<string, string>>({});
  const [step2Date, setStep2Date] = useState<Record<string, string>>({});
  const [step3Date, setStep3Date] = useState<Record<string, string>>({});
  const [showGpsForm, setShowGpsForm] = useState<Record<string, boolean>>({});

  // Edit Company & Site Preference Modal State
  const [editCompanyModalEnq, setEditCompanyModalEnq] = useState<Enquiry | null>(null);
  const [editCompanyVal, setEditCompanyVal] = useState<string>('');
  const [editCustomCompanyVal, setEditCustomCompanyVal] = useState<string>('');
  const [editSitePref1Val, setEditSitePref1Val] = useState<string>('');
  const [editSitePref2Val, setEditSitePref2Val] = useState<string>('');
  const [editInductionDateVal, setEditInductionDateVal] = useState<string>('');
  const [editInductionCompletedVal, setEditInductionCompletedVal] = useState<boolean>(false);

  const handleOpenEditCompanyModal = (enq: Enquiry) => {
    setEditCompanyModalEnq(enq);
    const currentCompany = enq.inductionCompany || enq.sitePreference1 || enq.alreadyRunningCompany || '';
    const isKnown = companies.some((c) => c.name.toLowerCase() === currentCompany.toLowerCase());
    if (currentCompany && !isKnown) {
      setEditCompanyVal('Other');
      setEditCustomCompanyVal(currentCompany);
    } else {
      setEditCompanyVal(currentCompany);
      setEditCustomCompanyVal('');
    }
    setEditSitePref1Val(enq.sitePreference1 || currentCompany);
    setEditSitePref2Val(enq.sitePreference2 || '');
    setEditInductionDateVal(enq.inductionDate || enq.enquiryDate || new Date().toISOString().substring(0, 10));
    setEditInductionCompletedVal(!!enq.inductionCompleted);
  };

  const handleSaveCompanyPreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyModalEnq) return;

    let targetCompany = editCompanyVal === 'Other' ? editCustomCompanyVal.trim() : editCompanyVal.trim();

    const updated = enquiries.map((item) => {
      if (item.id === editCompanyModalEnq.id) {
        return {
          ...item,
          inductionCompany: targetCompany || item.inductionCompany,
          sitePreference1: editSitePref1Val.trim() || targetCompany || item.sitePreference1,
          sitePreference2: editSitePref2Val.trim() || item.sitePreference2,
          inductionDate: editInductionDateVal || item.inductionDate || new Date().toISOString().substring(0, 10),
          inductionCompleted: editInductionCompletedVal,
        };
      }
      return item;
    });

    onUpdateEnquiries(updated);
    setEditCompanyModalEnq(null);
  };

  const handleSaveStep1 = (id: string) => {
    const targetEnq = enquiries.find((e) => e.id === id);
    let company = step1Company[id] || targetEnq?.inductionCompany || targetEnq?.sitePreference1 || '';
    if (company === 'Other') {
      company = step1Company[id + '_custom'] || '';
    }
    const date = step1Date[id] || targetEnq?.inductionDate || new Date().toISOString().substring(0, 10);
    if (!company) {
      alert('Please select or enter a reputed company.');
      return;
    }
    const updated = enquiries.map((enq) =>
      enq.id === id
        ? {
            ...enq,
            inductionCompany: company,
            sitePreference1: enq.sitePreference1 || company,
            inductionDate: date,
            inductionCompleted: true,
          }
        : enq
    );
    onUpdateEnquiries(updated);
  };

  const handleSaveStep2Gps = (id: string) => {
    const vendor = step2Vendor[id] || 'AssetTrack';
    const imei = step2Imei[id] || '';
    const date = step2Date[id] || new Date().toISOString().substring(0, 10);
    
    const updated = enquiries.map((enq) =>
      enq.id === id ? { ...enq, gpsRequired: 'Yes' as const, gpsVendor: vendor, gpsImei: imei, gpsFittingDate: date } : enq
    );
    onUpdateEnquiries(updated);
  };

  const handleSaveStep2NoGps = (id: string) => {
    const updated = enquiries.map((enq) =>
      enq.id === id ? { ...enq, gpsRequired: 'No' as const, gpsVendor: 'None', gpsImei: '' } : enq
    );
    onUpdateEnquiries(updated);
  };

  const handleSaveStep3Activate = (enq: Enquiry) => {
    const date = step3Date[enq.id] || new Date().toISOString().substring(0, 10);
    
    // First save route activation on the enquiry
    const updated = enquiries.map((item) =>
      item.id === enq.id ? { ...item, routeActivated: true, routeStartDate: date } : item
    );
    onUpdateEnquiries(updated);
    
    // Create updated reference to prefill
    const updatedEnq = {
      ...enq,
      routeActivated: true,
      routeStartDate: date,
      inductionCompany: enq.inductionCompany || ''
    };
    
    // Trigger promotion modal pre-filled
    handleOpenPromote(updatedEnq);
  };

  // Filter enquiries that are strictly in 'Induction' status
  const inductionEnquiries = enquiries.filter((e) => e.status === 'Induction');

  // Derive unique company list for dropdown
  const uniqueCompanies = Array.from(
    new Set(
      [
        ...companies.map((c) => c.name),
        ...inductionEnquiries.map((e) => e.inductionCompany || e.alreadyRunningCompany || '').filter(Boolean),
      ].filter(Boolean)
    )
  );

  // Counts for step filter buttons
  const step1Count = inductionEnquiries.filter((e) => !e.inductionCompleted).length;
  const step2Count = inductionEnquiries.filter((e) => e.inductionCompleted && !e.gpsRequired).length;
  const step3Count = inductionEnquiries.filter((e) => e.inductionCompleted && e.gpsRequired && !e.routeActivated).length;

  // Helper to reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStep('All');
    setFilterVehicleType('All');
    setFilterCompany('All');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    filterStep !== 'All' ||
    filterVehicleType !== 'All' ||
    filterCompany !== 'All' ||
    startDate !== '' ||
    endDate !== '' ||
    sortBy !== 'date-desc';

  // Filtered and Sorted Active Inductions List
  const filtered = inductionEnquiries
    .filter((item) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchSearch =
          (item.id || '').toLowerCase().includes(query) ||
          (item.vehicleNumber || '').toLowerCase().includes(query) ||
          (item.vehicleType || '').toLowerCase().includes(query) ||
          (item.vehicleModelYear || '').toLowerCase().includes(query) ||
          (item.ownerNamePhone || '').toLowerCase().includes(query) ||
          (item.ownerName || '').toLowerCase().includes(query) ||
          (item.ownerMobile || '').toLowerCase().includes(query) ||
          (item.driverName || '').toLowerCase().includes(query) ||
          (item.driverPhone || '').toLowerCase().includes(query) ||
          (item.inductionCompany || '').toLowerCase().includes(query) ||
          (item.sitePreference1 || '').toLowerCase().includes(query) ||
          (item.remarks || '').toLowerCase().includes(query);
        if (!matchSearch) return false;
      }

      // 2. Pipeline Step Filter
      if (filterStep === 'Step1' && item.inductionCompleted) return false;
      if (filterStep === 'Step2' && (!item.inductionCompleted || item.gpsRequired)) return false;
      if (filterStep === 'Step3' && (!item.inductionCompleted || !item.gpsRequired || item.routeActivated)) return false;

      // 3. Vehicle Type Filter
      if (filterVehicleType !== 'All') {
        const vType = (item.vehicleType || '').toLowerCase();
        if (vType !== filterVehicleType.toLowerCase()) return false;
      }

      // 4. Company Filter
      if (filterCompany !== 'All') {
        const comp = item.inductionCompany || item.alreadyRunningCompany || '';
        if (comp.toLowerCase() !== filterCompany.toLowerCase()) return false;
      }

      // 5. Date Range Filter
      const enqDateStr = item.inductionDate || item.enquiryDate || '';
      if (startDate && enqDateStr) {
        if (enqDateStr < startDate) return false;
      }
      if (endDate && enqDateStr) {
        if (enqDateStr > endDate) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        const dA = a.inductionDate || a.enquiryDate || '';
        const dB = b.inductionDate || b.enquiryDate || '';
        return dB.localeCompare(dA);
      }
      if (sortBy === 'date-asc') {
        const dA = a.inductionDate || a.enquiryDate || '';
        const dB = b.inductionDate || b.enquiryDate || '';
        return dA.localeCompare(dB);
      }
      if (sortBy === 'enq-asc') {
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      }
      if (sortBy === 'enq-desc') {
        return b.id.localeCompare(a.id, undefined, { numeric: true });
      }
      if (sortBy === 'vehicle-asc') {
        return (a.vehicleNumber || '').localeCompare(b.vehicleNumber || '');
      }
      if (sortBy === 'owner-asc') {
        const ownerA = getOwnerDisplayDetails(a).displayName;
        const ownerB = getOwnerDisplayDetails(b).displayName;
        return ownerA.localeCompare(ownerB);
      }
      if (sortBy === 'driver-asc') {
        return (a.driverName || '').localeCompare(b.driverName || '');
      }
      if (sortBy === 'site-asc') {
        const siteA = (a.sitePreference1 || '').trim();
        const siteB = (b.sitePreference1 || '').trim();
        return siteA.localeCompare(siteB);
      }
      return 0;
    });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentTarget || !newCommentText.trim()) return;

    const newComment = {
      date: new Date().toISOString().substring(0, 16).replace('T', ' '),
      text: newCommentText.trim(),
      author: 'Admin User',
    };

    const updatedComments = [...(activeCommentTarget.comments || []), newComment];
    const updated = enquiries.map((enq) =>
      enq.id === activeCommentTarget.id ? { ...enq, comments: updatedComments } : enq
    );
    onUpdateEnquiries(updated);

    setActiveCommentTarget({
      ...activeCommentTarget,
      comments: updatedComments,
    });
    setNewCommentText('');
  };

  const handleOpenEdit = (enq: Enquiry) => {
    setEditingEnq({ ...enq });
    setFormError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnq) return;

    if (!editingEnq.vehicleNumber?.trim()) {
      setFormError('Vehicle registration/temporary number is required.');
      return;
    }
    if (!editingEnq.ownerNamePhone?.trim()) {
      setFormError('Owner details are required.');
      return;
    }
    if (!editingEnq.driverName?.trim()) {
      setFormError('Driver name is required.');
      return;
    }

    const updated = enquiries.map((item) => (item.id === editingEnq.id ? editingEnq : item));
    onUpdateEnquiries(updated);
    setEditingEnq(null);
  };

  const handleDeleteVehicle = (id: string) => {
    setDeletingEnqId(id);
  };

  const confirmDeleteVehicle = () => {
    if (deletingEnqId) {
      const updated = enquiries.map((item) =>
        item.id === deletingEnqId
          ? {
              ...item,
              status: 'Interested' as const,
              inductionCompleted: false,
            }
          : item
      );
      onUpdateEnquiries(updated);
      setDeletingEnqId(null);
    }
  };

  const handleRestoreVehicle = (id: string) => {
    setRestoringEnqId(id);
  };

  const confirmRestoreVehicle = () => {
    if (restoringEnqId) {
      const updated = enquiries.map((item) =>
        item.id === restoringEnqId ? { ...item, status: 'Interested' as const } : item
      );
      onUpdateEnquiries(updated);
      setRestoringEnqId(null);
      if (onNavigate) {
        onNavigate('Enquiries');
      }
    }
  };

  const handleOpenPromote = (enq: Enquiry) => {
    let ownerName = enq.ownerName || '';
    let ownerPhone = enq.ownerMobile || '';
    if ((!ownerName || !ownerPhone) && enq.ownerNamePhone) {
      const raw = enq.ownerNamePhone.trim();
      const parenMatch = raw.match(/([^(]+)(?:\(([^)]+)\))?/);
      if (parenMatch && parenMatch[2]) {
        if (!ownerName) ownerName = parenMatch[1].trim();
        if (!ownerPhone) ownerPhone = parenMatch[2].trim();
      } else {
        const parts = raw.split(/[-–—/]/);
        if (parts.length >= 2) {
          const part1 = parts[0].trim();
          const part2 = parts[1].trim();
          if (/^\+?\d[\d\s-]{6,}$/.test(part1) && !/^\+?\d[\d\s-]{6,}$/.test(part2)) {
            if (!ownerPhone) ownerPhone = part1;
            if (!ownerName) ownerName = part2;
          } else {
            if (!ownerName) ownerName = part1;
            if (!ownerPhone) ownerPhone = part2;
          }
        } else if (!ownerName) {
          if (/^\+?\d[\d\s-]{6,}$/.test(raw)) {
            if (!ownerPhone) ownerPhone = raw;
          } else {
            ownerName = raw;
          }
        }
      }
    }

    const driverName = enq.driverName || '';
    const driverPhone = enq.driverPhone || '';

    const cleanOwnerName = ownerName.trim().toLowerCase();
    const cleanOwnerPhone = ownerPhone.replace(/[^0-9]/g, '');

    // Match exact name first, then phone
    let matchedOwner = cleanOwnerName
      ? owners.find((o) => (o.name || '').trim().toLowerCase() === cleanOwnerName)
      : undefined;

    if (!matchedOwner && cleanOwnerPhone && cleanOwnerPhone.length >= 10) {
      matchedOwner = owners.find((o) => (o.phone || '').replace(/[^0-9]/g, '') === cleanOwnerPhone);
    }

    const cleanDriverName = driverName.trim().toLowerCase();
    const cleanDriverPhone = driverPhone.replace(/[^0-9]/g, '');

    let matchedDriver = cleanDriverName
      ? drivers.find((d) => (d.name || '').trim().toLowerCase() === cleanDriverName)
      : undefined;

    if (!matchedDriver && cleanDriverPhone && cleanDriverPhone.length >= 10) {
      matchedDriver = drivers.find((d) => (d.phone || '').replace(/[^0-9]/g, '') === cleanDriverPhone);
    }

    let normalizedFuel: 'CNG' | 'Diesel' | 'Petrol' | 'EV' = 'Diesel';
    const fLower = (enq.fuelType || '').toLowerCase();
    if (fLower.includes('cng')) normalizedFuel = 'CNG';
    else if (fLower.includes('petrol')) normalizedFuel = 'Petrol';
    else if (fLower.includes('ev') || fLower.includes('electric')) normalizedFuel = 'EV';
    else if (fLower.includes('diesel')) normalizedFuel = 'Diesel';

    let normalizedType: 'Sedan' | 'SUV' | 'Hatchback' | 'Bus' | 'Tempo Traveler' = 'Sedan';
    const tLower = (enq.vehicleType || '').toLowerCase();
    if (tLower.includes('sedan')) normalizedType = 'Sedan';
    else if (tLower.includes('suv')) normalizedType = 'SUV';
    else if (tLower.includes('hatchback')) normalizedType = 'Hatchback';
    else if (tLower.includes('bus')) normalizedType = 'Bus';
    else if (tLower.includes('tempo') || tLower.includes('traveler') || tLower.includes('traveller'))
      normalizedType = 'Tempo Traveler';

    let parsedYear = 2024;
    let parsedModel = enq.vehicleModelYear || '';
    if (enq.vehicleModelYear) {
      const yearMatch = enq.vehicleModelYear.match(/\b(20\d{2}|19\d{2})\b/);
      if (yearMatch) {
        parsedYear = parseInt(yearMatch[1], 10);
        parsedModel = enq.vehicleModelYear.replace(yearMatch[0], '').replace(/[()]/g, '').trim();
      }
    }

    const detectedMfg = detectManufacturer(parsedModel || enq.vehicleModelYear || enq.vehicleNumber || '');

    setPromoteForm({
      createVehicle: true,
      createOwner: matchedOwner ? false : !!ownerName,
      createDriver: matchedDriver ? false : !!driverName,
      registrationNumber: enq.vehicleNumber || '',
      model: parsedModel || 'Innova Crysta',
      manufacturer: detectedMfg,
      year: parsedYear,
      fuelType: normalizedFuel,
      transmission: 'Manual',
      vehicleType: normalizedType,
      company: enq.inductionCompany || enq.alreadyRunningCompany || (companies.length > 0 ? companies[0].name : ''),
      site:
        enq.sitePreference1 && enq.sitePreference1 !== 'Open Preference'
          ? enq.sitePreference1
          : sites.length > 0
          ? sites[0].name
          : '',
      joiningDate: enq.routeStartDate || new Date().toISOString().substring(0, 10),
      ownerId: matchedOwner ? matchedOwner.id : 'new',
      ownerName: ownerName || (matchedOwner ? matchedOwner.name : ''),
      ownerPhone: ownerPhone || (matchedOwner ? matchedOwner.phone : ''),
      driverId: matchedDriver ? matchedDriver.id : 'new',
      driverName: driverName || (matchedDriver ? matchedDriver.name : ''),
      driverPhone: driverPhone || (matchedDriver ? matchedDriver.phone : ''),
      driverDl: enq.driverDlNumber || (matchedDriver?.licenceNumber || ''),
      driverDlExp: enq.driverDlExpiry || (matchedDriver?.licenceExpiry || ''),
      driverAadhaar: enq.driverAadhaar || '',
      driverAddress: enq.driverAddress || (matchedDriver?.address || ''),
      officeDocSubmitted: enq.officeDocSubmitted || false,
      officeDocSubmitDate: enq.officeDocSubmitDate || new Date().toISOString().substring(0, 10),
      officeDocVendorCompany: enq.officeDocVendorCompany || enq.inductionCompany || '',
      officeDocLetterpadRef: enq.officeDocLetterpadRef || '',
      officeDocRemarks: enq.officeDocRemarks || '',
    });

    setPromoteError(null);
    setPromoteSuccess(null);
    setPromotingEnquiry(enq);
  };

  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoteError(null);

    if (!onUpdateVehicles || !onUpdateOwners || !onUpdateDrivers) {
      setPromoteError('Master registers update handlers are not linked in parent layout.');
      return;
    }

    const cleanReg = (promoteForm.registrationNumber || '').replace(/\s+/g, '').toUpperCase();
    if (!cleanReg) {
      setPromoteError('Vehicle Registration Number is required.');
      return;
    }

    let finalOwnerId = '';
    let finalOwnerName = '';

    const cleanFormOwnerName = promoteForm.ownerName.trim();
    const cleanFormOwnerPhone = promoteForm.ownerPhone.replace(/[^0-9]/g, '');

    // Check if Owner already exists by ID, Name or Phone match
    let existingOwner = owners.find((o) => {
      if (promoteForm.ownerId !== 'new' && o.id === promoteForm.ownerId) return true;
      const oName = (o.name || '').trim().toLowerCase();
      const oPhone = (o.phone || '').replace(/[^0-9]/g, '');
      if (cleanFormOwnerName && oName === cleanFormOwnerName.toLowerCase()) return true;
      if (cleanFormOwnerPhone && cleanFormOwnerPhone.length >= 10 && oPhone === cleanFormOwnerPhone) return true;
      return false;
    });

    if (existingOwner) {
      // Owner exists - link to existing record instead of creating duplicate
      finalOwnerId = existingOwner.id;
      finalOwnerName = cleanFormOwnerName || existingOwner.name;

      const updatedOwnerList = owners.map((o) =>
        o.id === existingOwner.id
          ? {
              ...o,
              name: cleanFormOwnerName || o.name,
              phone: promoteForm.ownerPhone.trim() || o.phone,
              address: promoteForm.driverAddress.trim() || o.address,
              bankName: promotingEnquiry?.bankName || o.bankName,
              accountNumber: promotingEnquiry?.bankAccountNumber || o.accountNumber,
              ifsc: promotingEnquiry?.bankIfsc || o.ifsc,
            }
          : o
      );
      onUpdateOwners(updatedOwnerList);
    } else {
      // Create new Owner only if owner does not exist
      if (!cleanFormOwnerName) {
        setPromoteError('Owner Name is required.');
        return;
      }
      if (!promoteForm.ownerPhone.trim()) {
        setPromoteError('Owner Phone Number is required.');
        return;
      }

      const newOwnerId = generateUniqueOwnerId(owners);
      const newOwner: Owner = {
        id: newOwnerId,
        name: cleanFormOwnerName,
        phone: promoteForm.ownerPhone.trim(),
        email: promotingEnquiry?.driverEmail || '',
        address: promoteForm.driverAddress.trim() || '',
        bankName: promotingEnquiry?.bankName || '',
        accountNumber: promotingEnquiry?.bankAccountNumber || '',
        ifsc: promotingEnquiry?.bankIfsc || '',
        upiId: '',
        pan: '',
        aadhaar: promotingEnquiry?.driverAadhaar || '',
        remarks: 'Promoted from Induction ' + (promotingEnquiry?.id || ''),
      };

      onUpdateOwners([...owners, newOwner]);
      finalOwnerId = newOwnerId;
      finalOwnerName = newOwner.name;
    }

    let finalDriverId = '';
    let finalDriverName = '';

    const cleanFormDriverName = promoteForm.driverName.trim();
    const cleanFormDriverPhone = promoteForm.driverPhone.replace(/[^0-9]/g, '');

    // Check if Driver already exists by ID, Name or Phone match
    let existingDriver = drivers.find((d) => {
      if (promoteForm.driverId !== 'new' && d.id === promoteForm.driverId) return true;
      const dName = (d.name || '').trim().toLowerCase();
      const dPhone = (d.phone || '').replace(/[^0-9]/g, '');
      if (cleanFormDriverName && dName === cleanFormDriverName.toLowerCase()) return true;
      if (cleanFormDriverPhone && cleanFormDriverPhone.length >= 10 && dPhone === cleanFormDriverPhone) return true;
      return false;
    });

    if (existingDriver) {
      // Driver exists - update assigned vehicle and status to Active instead of creating duplicate
      finalDriverId = existingDriver.id;
      finalDriverName = cleanFormDriverName || existingDriver.name;

      const updatedDriverList = drivers.map((d) =>
        d.id === existingDriver.id
          ? {
              ...d,
              name: cleanFormDriverName || d.name,
              phone: promoteForm.driverPhone.trim() || d.phone,
              licenceNumber: promoteForm.driverDl.trim() || d.licenceNumber,
              licenceExpiry: promoteForm.driverDlExp || d.licenceExpiry,
              aadhaar: promoteForm.driverAadhaar.trim() || d.aadhaar,
              address: promoteForm.driverAddress.trim() || d.address,
              status: 'Active' as const,
            }
          : d
      );
      onUpdateDrivers(updatedDriverList);
    } else {
      // Create new Driver only if driver does not exist
      if (!cleanFormDriverName) {
        setPromoteError('Driver Name is required.');
        return;
      }
      if (!promoteForm.driverPhone.trim()) {
        setPromoteError('Driver Phone is required.');
        return;
      }

      const newDriverId = generateUniqueDriverId(drivers);
      const newDriver: Driver = {
        id: newDriverId,
        name: cleanFormDriverName,
        phone: promoteForm.driverPhone.trim(),
        address: promoteForm.driverAddress.trim() || '',
        badgeNumber: '',
        badgeExpiry: promotingEnquiry?.driverBatchExp || '',
        licenceNumber: promoteForm.driverDl.trim() || '',
        licenceExpiry: promoteForm.driverDlExp || '',
        aadhaar: promoteForm.driverAadhaar.trim() || '',
        pan: '',
        emergencyContact: '',
        salary: 0,
        joiningDate: new Date().toISOString().substring(0, 10),
        status: 'Active',
      };

      onUpdateDrivers([...drivers, newDriver]);
      finalDriverId = newDriverId;
      finalDriverName = newDriver.name;
    }

    // Vehicle Master: Create or update using existing Vehicle ID if vehicle exists
    const existingVehicle = vehicles.find(
      (v) => v.registrationNumber.replace(/\s+/g, '').toUpperCase() === cleanReg
    );

    if (existingVehicle) {
      // Update existing Vehicle in Master Register
      const updatedVehicles = vehicles.map((v) =>
        v.id === existingVehicle.id
          ? {
              ...v,
              registrationNumber: cleanReg,
              model: promoteForm.model.trim() || v.model,
              manufacturer: promoteForm.manufacturer.trim() || v.manufacturer,
              year: Number(promoteForm.year) || v.year,
              fuelType: promoteForm.fuelType,
              transmission: promoteForm.transmission,
              vehicleType: promoteForm.vehicleType,
              ownerId: finalOwnerId,
              ownerName: finalOwnerName || v.ownerName,
              driverId: finalDriverId,
              driverName: finalDriverName || v.driverName,
              company: promoteForm.company || v.company,
              site: promoteForm.site || v.site,
              joiningDate: promoteForm.joiningDate || v.joiningDate,
              status: 'Active' as const,
              insuranceExpiry: promotingEnquiry?.insuranceExpiry || v.insuranceExpiry,
              permitExpiry: promotingEnquiry?.permitExpiry || v.permitExpiry,
              fcExpiry: promotingEnquiry?.fcExpiry || v.fcExpiry,
              officeDocSubmitted: promotingEnquiry?.officeDocSubmitted ?? v.officeDocSubmitted,
              officeDocSubmitDate: promotingEnquiry?.officeDocSubmitDate || v.officeDocSubmitDate,
              officeDocVendorCompany: promotingEnquiry?.officeDocVendorCompany || v.officeDocVendorCompany,
              officeDocLetterpadRef: promotingEnquiry?.officeDocLetterpadRef || v.officeDocLetterpadRef,
              officeDocRemarks: promotingEnquiry?.officeDocRemarks || v.officeDocRemarks,
              officeDocChecklist: promotingEnquiry?.officeDocChecklist || v.officeDocChecklist,
              remarks: (v.remarks ? v.remarks + '\n' : '') + `Updated from Induction ${promotingEnquiry?.id || ''}`,
            }
          : v
      );
      onUpdateVehicles(updatedVehicles);
    } else {
      // Create new Vehicle in Master Register
      const newVehicleId = generateUniqueVehicleId(vehicles);
      const newVehicle: Vehicle = {
        id: newVehicleId,
        registrationNumber: cleanReg,
        model: promoteForm.model.trim() || 'Innova',
        manufacturer: promoteForm.manufacturer.trim() || 'Toyota',
        year: Number(promoteForm.year) || 2024,
        fuelType: promoteForm.fuelType,
        transmission: promoteForm.transmission,
        vehicleType: promoteForm.vehicleType,
        ownerId: finalOwnerId,
        ownerName: finalOwnerName || 'Unknown Owner',
        driverId: finalDriverId,
        driverName: finalDriverName || 'Unknown Driver',
        company: promoteForm.company || '',
        site: promoteForm.site || '',
        joiningDate: promoteForm.joiningDate || new Date().toISOString().substring(0, 10),
        status: 'Active',
        emiAmount: 0,
        emiDueDate: '',
        insuranceExpiry: promotingEnquiry?.insuranceExpiry || '',
        permitExpiry: promotingEnquiry?.permitExpiry || '',
        fcExpiry: promotingEnquiry?.fcExpiry || '',
        pollutionExpiry: '',
        fastagNumber: '',
        officeDocSubmitted: promotingEnquiry?.officeDocSubmitted || false,
        officeDocSubmitDate: promotingEnquiry?.officeDocSubmitDate || '',
        officeDocVendorCompany: promotingEnquiry?.officeDocVendorCompany || promoteForm.company || '',
        officeDocLetterpadRef: promotingEnquiry?.officeDocLetterpadRef || '',
        officeDocRemarks: promotingEnquiry?.officeDocRemarks || '',
        officeDocChecklist: promotingEnquiry?.officeDocChecklist,
        remarks: 'Promoted from Induction ' + (promotingEnquiry?.id || ''),
      };

      onUpdateVehicles([...vehicles, newVehicle]);
    }

    if (promotingEnquiry) {
      const updatedEnquiries = enquiries.map((e) => {
        if (e.id === promotingEnquiry.id) {
          const oName = finalOwnerName || e.ownerName || promoteForm.ownerName.trim();
          const oPhone = promoteForm.ownerPhone.trim() || e.ownerMobile || '';
          const dName = finalDriverName || e.driverName || promoteForm.driverName.trim();
          const dPhone = promoteForm.driverPhone.trim() || e.driverPhone || '';
          return {
            ...e,
            ownerName: oName,
            ownerMobile: oPhone,
            ownerNamePhone: oPhone ? `${oName} - ${oPhone}` : oName,
            driverName: dName,
            driverPhone: dPhone,
            status: 'Closed' as const,
            remarks:
              (e.remarks ? e.remarks + '\n' : '') +
              `[SYSTEM] Induction finished & promoted to Master Registers on ${new Date().toLocaleDateString()}`,
          };
        }
        return e;
      });
      onUpdateEnquiries(updatedEnquiries);
    }

    setPromoteSuccess('Successfully finished induction and added records to Master Registers!');
    setTimeout(() => {
      setPromotingEnquiry(null);
      setPromoteSuccess(null);
    }, 1500);
  };

  // Helper to calculate document status checklist
  const getDocumentProgress = (enq: Enquiry) => {
    const checks = [
      { label: 'RC Details', ok: !!enq.vehicleNumber && !!enq.rcExpiry },
      { label: 'Insurance Valid', ok: !!enq.insuranceExpiry },
      { label: 'Permit Details', ok: !!enq.permitExpiry && enq.permitExpiry.trim() !== '' },
      { label: 'Fitness Cert (FC)', ok: !!enq.fcExpiry },
      { label: 'Driver License', ok: !!enq.driverDlNumber && !!enq.driverDlExpiry },
      { label: 'Aadhaar Card', ok: !!enq.driverAadhaar },
      { label: 'GPS Configured', ok: !!enq.gpsVendor && !!enq.gpsImei },
      { label: 'Bank Acc Linked', ok: !!enq.bankName && !!enq.bankAccountNumber },
    ];
    const completed = checks.filter((c) => c.ok).length;
    return {
      checks,
      completed,
      total: checks.length,
      percentage: Math.round((completed / checks.length) * 100),
    };
  };

  const handlePrintActiveInductionTable = () => {
    const printRows = filtered.map((enq) => {
      const { displayName, displayPhone } = getOwnerDisplayDetails(enq);
      const prefs = [
        enq.sitePreference1,
        enq.sitePreference2,
        enq.sitePreference3,
        enq.sitePreference4,
      ].filter(Boolean);
      const prefText = prefs.length > 0 ? prefs.join(', ') : (enq.inductionCompany || enq.alreadyRunningCompany || 'N/A');

      const latestComment = enq.comments && enq.comments.length > 0
        ? enq.comments[enq.comments.length - 1].text
        : (enq.remarks || 'No comments');

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-family: monospace; font-weight: bold; font-size: 11px;">${enq.id}</td>
          <td style="padding: 10px 12px;">
            <div style="font-weight: 800; font-size: 13px; font-family: monospace;">${enq.vehicleNumber}</div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">${enq.vehicleType || ''} ${enq.vehicleModelYear ? '&bull; ' + enq.vehicleModelYear : ''}</div>
          </td>
          <td style="padding: 10px 12px;">
            <div style="font-weight: 700; font-size: 12px;">${displayName}</div>
            <div style="font-size: 10px; color: #64748b; font-family: monospace;">${displayPhone || 'N/A'}</div>
          </td>
          <td style="padding: 10px 12px;">
            <div style="font-weight: 700; font-size: 12px;">${enq.driverName || 'N/A'}</div>
            <div style="font-size: 10px; color: #64748b; font-family: monospace;">${enq.driverPhone || 'N/A'}</div>
          </td>
          <td style="padding: 10px 12px; font-size: 11px; font-weight: bold; color: #0f172a;">
            📍 ${enq.driverArea || enq.driverAddress || 'N/A'}
          </td>
          <td style="padding: 10px 12px; font-size: 11px; max-width: 180px;">${prefText}</td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 11px; font-weight: 700;">${formatDateDDMMYYYY(enq.inductionDate || enq.enquiryDate)}</td>
          <td style="padding: 10px 12px;">
            <span style="display: inline-block; padding: 2px 8px; background-color: #e0e7ff; color: #3730a3; font-weight: 800; font-size: 10px; border-radius: 4px; text-transform: uppercase;">
              ${enq.status}
            </span>
          </td>
          <td style="padding: 10px 12px; font-size: 11px; color: #334155; max-width: 200px;">${latestComment}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Active Vehicle Induction Report - E7 Travels</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; background-color: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #1e1b4b; text-transform: uppercase; }
          .subtitle { font-size: 12px; color: #475569; font-weight: 700; margin-top: 2px; }
          .meta { text-align: right; font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 10px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-family: monospace; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; padding: 12px 16px; background: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; font-size: 13px; color: #3730a3;">🖨️ Active Vehicle Induction Report - Print Preview</span>
          <button onclick="window.print()" style="padding: 8px 16px; background: #4338ca; color: white; font-weight: 800; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">Click to Print (Ctrl+P)</button>
        </div>

        <div class="header">
          <div>
            <div class="title">E7 TRAVELS FLEET MANAGEMENT</div>
            <div class="subtitle">ACTIVE VEHICLE INDUCTION REGISTER</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Active Inductions:</strong> ${filtered.length} Vehicles</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ENQ ID</th>
              <th>CAR NO</th>
              <th>OWNER NAME & NUMBER</th>
              <th>DRIVER & NUMBER</th>
              <th>LOCATION / AREA</th>
              <th>SITE PREFERENCE</th>
              <th>INDUCTION DATE</th>
              <th>STATUS</th>
              <th>COMMENTS</th>
            </tr>
          </thead>
          <tbody>
            ${printRows || '<tr><td colspan="9" style="padding: 20px; text-align: center; color: #94a3b8;">No active induction records found.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          E7 Travels Fleet Operations &bull; Confidential Official Report &bull; Page 1 of 1
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-3xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600 animate-pulse" /> Vehicle Induction Page
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete compliance checksheets, register GPS trackers, verify bank accounts and DL badges, and promote finalized vehicles to Master Registers.
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 text-right">
          <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">Vehicles Under Induction</p>
          <p className="text-lg font-black text-indigo-700 leading-none mt-1">{inductionEnquiries.length}</p>
        </div>
      </div>

      {/* FILTER & SORT CONTROLS CARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-3xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Filter & Sort Active Inductions</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="self-start md:self-auto text-3xs font-extrabold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Clear All Filters
            </button>
          )}
        </div>

        {/* Search & Pipeline Stage Pills */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Reg No, Owner, Driver, ENQ ID, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-sm font-extrabold"
              >
                ×
              </button>
            )}
          </div>

          {/* Pipeline Step Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 shrink-0">
            <button
              onClick={() => setFilterStep('All')}
              className={`px-3 py-2 text-3xs font-extrabold uppercase tracking-wider rounded-xl transition-all border cursor-pointer ${
                filterStep === 'All'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Stages ({inductionEnquiries.length})
            </button>
            <button
              onClick={() => setFilterStep('Step1')}
              className={`px-3 py-2 text-3xs font-extrabold uppercase tracking-wider rounded-xl transition-all border cursor-pointer ${
                filterStep === 'Step1'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Step 1: Induction ({step1Count})
            </button>
            <button
              onClick={() => setFilterStep('Step2')}
              className={`px-3 py-2 text-3xs font-extrabold uppercase tracking-wider rounded-xl transition-all border cursor-pointer ${
                filterStep === 'Step2'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Step 2: GPS ({step2Count})
            </button>
            <button
              onClick={() => setFilterStep('Step3')}
              className={`px-3 py-2 text-3xs font-extrabold uppercase tracking-wider rounded-xl transition-all border cursor-pointer ${
                filterStep === 'Step3'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Step 3: Route ({step3Count})
            </button>
          </div>
        </div>

        {/* Dropdowns Row: Vehicle Type, Company, Date Range, Sort By */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
          {/* Vehicle Type Filter */}
          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Vehicle Type
            </label>
            <select
              value={filterVehicleType}
              onChange={(e) => setFilterVehicleType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Types</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Bus">Bus</option>
              <option value="Tempo Traveler">Tempo Traveler</option>
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Company / Deployment
            </label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 truncate"
            >
              <option value="All">All Companies</option>
              {uniqueCompanies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Sort By Selector */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3 text-indigo-500" /> Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs border border-indigo-200 bg-indigo-50/50 rounded-lg text-indigo-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="date-desc">📅 Date (Newest First)</option>
              <option value="date-asc">📅 Date (Oldest First)</option>
              <option value="enq-asc">🔢 ENQ ID (Ascending)</option>
              <option value="enq-desc">🔢 ENQ ID (Descending)</option>
              <option value="vehicle-asc">🚗 Car No (A-Z)</option>
              <option value="owner-asc">👤 Owner Name (A-Z)</option>
              <option value="driver-asc">👨‍✈️ Driver Name (A-Z)</option>
              <option value="site-asc">📍 Site Preference (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Induction Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-2 justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
              <ClipboardCheck className="h-4 w-4 text-indigo-600" /> Active Induction Table
            </h3>
            <p className="text-3xs text-slate-500 font-medium mt-0.5">
              Tabular view of all active vehicle induction records with ENQ ID, Car No, Owner Name & Number, Driver & Number, Site Preference, Induction Date, Status, Comments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintActiveInductionTable}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-3xs font-extrabold uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Print Active Induction Table"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Table</span>
            </button>
            <span className="text-3xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-wider">
              {filtered.length} Active Rows
            </span>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full min-w-[1200px] text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-3xs font-extrabold uppercase tracking-wider text-slate-500 font-mono whitespace-nowrap">
              <tr>
                <th className="py-3 px-3">ENQ ID</th>
                <th className="py-3 px-3">CAR NO</th>
                <th className="py-3 px-3">VEHICLE TYPE</th>
                <th className="py-3 px-3">YEAR / MODEL</th>
                <th className="py-3 px-3">OWNER NAME & NO</th>
                <th className="py-3 px-3">DRIVER & NO</th>
                <th className="py-3 px-3">LOCATION / AREA</th>
                <th className="py-3 px-3">COMPANY PREFERENCE</th>
                <th className="py-3 px-3">INDUCTION DATE</th>
                <th className="py-3 px-3">INDUCTION HIGHLIGHT</th>
                <th className="py-3 px-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-2xs font-semibold text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-bold">
                    No active induction records found.
                  </td>
                </tr>
              ) : (
                filtered.map((enq) => {
                  const { displayName, displayPhone } = getOwnerDisplayDetails(enq);
                  const prefs = [
                    enq.sitePreference1,
                    enq.sitePreference2,
                    enq.sitePreference3,
                    enq.sitePreference4,
                  ].filter(Boolean);
                  const prefText = enq.inductionCompany || (prefs.length > 0 ? prefs.join(', ') : enq.alreadyRunningCompany || 'N/A');

                  const latestComment = enq.comments && enq.comments.length > 0
                    ? enq.comments[enq.comments.length - 1].text
                    : (enq.remarks || 'No comments');
                  const commentCount = enq.comments?.length || 0;

                  return (
                    <tr
                      key={enq.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        enq.inductionCompleted ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-3xs font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {enq.id}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-black text-slate-900 text-xs">
                          {enq.vehicleNumber}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-3xs font-extrabold uppercase tracking-wide">
                          {enq.vehicleType || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-3xs font-black">
                          {enq.vehicleModelYear || enq.mfdYear || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col min-w-[120px]">
                          <span className="font-bold text-slate-800 text-xs truncate">{displayName}</span>
                          {displayPhone ? (
                            <span className="font-mono text-[10px] text-slate-500 font-semibold mt-0.5">{displayPhone}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic mt-0.5">No phone</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col min-w-[120px]">
                          <span className="font-bold text-slate-800 text-xs truncate">{enq.driverName || 'N/A'}</span>
                          {enq.driverPhone ? (
                            <span className="font-mono text-[10px] text-slate-500 font-semibold mt-0.5">{enq.driverPhone}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic mt-0.5">No phone</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 min-w-[120px]">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs truncate max-w-[140px]" title={enq.driverArea || enq.driverAddress || 'N/A'}>
                              {enq.driverArea || enq.driverAddress || 'N/A'}
                            </span>
                            {enq.driverArea && enq.driverAddress && (
                              <span className="text-[9px] text-slate-400 truncate max-w-[130px]" title={enq.driverAddress}>
                                {enq.driverAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between gap-1.5 min-w-[140px] max-w-[200px]">
                          <div className="text-xs font-bold text-slate-800 truncate" title={prefText}>
                            {prefText}
                          </div>
                          <button
                            onClick={() => handleOpenEditCompanyModal(enq)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-md transition-all cursor-pointer shrink-0"
                            title="Edit Company / Site Preference"
                          >
                            <Building className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <input
                            type="date"
                            value={enq.inductionDate || enq.enquiryDate || new Date().toISOString().substring(0, 10)}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              const updated = enquiries.map((item) =>
                                item.id === enq.id ? { ...item, inductionDate: newDate } : item
                              );
                              onUpdateEnquiries(updated);
                            }}
                            className="p-1 text-3xs font-mono font-extrabold border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-800 cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {enq.inductionCompleted ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-2xs uppercase tracking-wide shadow-xs border border-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              <span>INDUCTION FINISHED</span>
                            </span>
                            <span className="text-[9px] font-extrabold text-emerald-700 font-mono">
                              Finished on: {formatDateDDMMYYYY(enq.inductionDate)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-amber-50 text-amber-800 border border-amber-300">
                              <AlertCircle className="h-3 w-3 text-amber-600" />
                              <span>WAITING FOR INDUCTION</span>
                            </span>
                            <span className="text-[9px] font-bold text-amber-700 font-mono">
                              Scheduled: {formatDateDDMMYYYY(enq.inductionDate || enq.enquiryDate)}
                            </span>
                            <button
                              onClick={() => {
                                const today = new Date().toISOString().substring(0, 10);
                                const updated = enquiries.map((item) =>
                                  item.id === enq.id
                                    ? {
                                        ...item,
                                        inductionCompleted: true,
                                        inductionDate: item.inductionDate || today,
                                      }
                                    : item
                                );
                                onUpdateEnquiries(updated);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                              title="Click to mark induction finished on this date"
                            >
                              <CheckCircle className="h-3 w-3" /> Finish Induction
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditCompanyModal(enq)}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                            title="Edit Company Preference"
                          >
                            <Building className="h-3 w-3 text-indigo-600" />
                            <span>Edit Pref</span>
                          </button>
                          <button
                            onClick={() => setActiveCommentTarget(enq)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                            title="View or add comments"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>{commentCount}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Induction List Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden">
        {/* Search Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active inductions by reg no, crew name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest">
            Showing {filtered.length} of {inductionEnquiries.length} active inductions
          </span>
        </div>

        {/* Induction Cards Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-4">
            <ClipboardCheck className="h-12 w-12 mx-auto text-slate-300 stroke-1" />
            <div>
              <p className="text-sm font-bold text-slate-600">No Vehicles in Induction Stage</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Vehicles whose status is set to "Induction" in the Enquiry Desk will automatically appear here to complete the boarding flow.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {filtered.map((enq) => {
              const progress = getDocumentProgress(enq);
              return (
                <div
                  key={enq.id}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-3xs hover:shadow-2xs transition-all flex flex-col overflow-hidden group"
                >
                  {/* Top Section - Structured Horizontal Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-slate-50/40 border-b border-slate-150">
                    
                    {/* Column 1: Vehicle Basic Info (Col Span 4) */}
                    <div className="lg:col-span-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-3xs font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {enq.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatDateDDMMYYYY(enq.enquiryDate)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight group-hover:text-indigo-700 transition-colors">
                          {enq.vehicleNumber}
                        </h3>
                        <p className="text-3xs text-slate-500 font-bold uppercase mt-0.5">
                          {enq.vehicleType} &bull; {enq.vehicleModelYear || 'Unknown Model'}
                        </p>
                      </div>
                    </div>
                    {/* Column 2: Crew/Driver & Owner Info (Col Span 4) */}
                    <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-200/60 pt-4 lg:pt-0 lg:pl-6">
                      <div>
                        <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[9px]">Owner attaching</span>
                        {(() => {
                          const { displayName, displayPhone } = getOwnerDisplayDetails(enq);
                          return (
                            <div className="mt-0.5">
                              <span className="font-black text-slate-800 text-xs truncate block tracking-tight">
                                {displayName}
                              </span>
                              {displayPhone && (
                                <span className="text-slate-500 font-mono text-[10px] block font-semibold mt-0.5">
                                  {displayPhone}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[9px]">Crew Driver</span>
                        <span className="font-bold text-slate-700 text-xs truncate block">
                          {enq.driverName}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px] mt-0.5 block">{enq.driverPhone || 'No Phone'}</span>
                      </div>
                    </div>

                    {/* Column 3: Quick Actions & Status Links (Col Span 4) */}
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200/60 pt-4 lg:pt-0 lg:pl-6">
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        <button
                          onClick={() => setActiveCommentTarget(enq)}
                          className="w-full flex items-center justify-center lg:justify-start gap-1.5 text-indigo-600 hover:text-indigo-700 text-3xs font-extrabold uppercase tracking-wide cursor-pointer p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 shadow-3xs transition-all"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>Induction Notes ({enq.comments?.length || 0})</span>
                        </button>
                      </div>

                      {/* Big Action Buttons */}
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleOpenEdit(enq)}
                          className="flex-1 min-w-[75px] px-2 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-2xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                          title="Edit Vehicle & Crew Details"
                        >
                          <Edit className="h-3.5 w-3.5 text-indigo-500" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(enq.id)}
                          className="px-2 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-2xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                          title="Delete Vehicle Enquiry"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Delete
                        </button>
                        <button
                          onClick={() => handleRestoreVehicle(enq.id)}
                          className="px-2 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-2xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                          title="Restore to Enquiry Desk"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-emerald-500" /> Restore
                        </button>
                        <button
                          onClick={() => handleOpenPromote(enq)}
                          className="flex-1 min-w-[100px] px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-2xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Database className="h-3.5 w-3.5" /> Finish & Move
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Section - Induction & Deployment Pipeline */}
                  <div className="p-6 bg-white space-y-4">
                    {/* INDUCTION PIPELINE INTERACTIVE STEPPER */}
                    <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-amber-500" /> Induction Pipeline
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200/60 px-2 py-0.5 rounded-full">
                          Step {!enq.inductionCompleted ? '1' : !enq.gpsRequired ? '2' : !enq.routeActivated ? '3' : '3'} of 3
                        </span>
                      </div>

                      {/* Connected horizontal tracker line */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-150 rounded-xl overflow-x-auto gap-4">
                        {/* Step 1 Indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black ${
                            enq.inductionCompleted ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                          }`}>
                            {enq.inductionCompleted ? <Check className="h-3.5 w-3.5" /> : '1'}
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-700">Induction</span>
                        </div>

                        <div className={`flex-1 min-w-[24px] h-0.5 border-t-2 border-dashed ${enq.inductionCompleted ? 'border-emerald-500' : 'border-slate-200'}`} />

                        {/* Step 2 Indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black ${
                            (enq.inductionCompleted && enq.gpsRequired)
                              ? 'bg-emerald-500 text-white' 
                              : enq.inductionCompleted 
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                                : 'bg-slate-100 text-slate-400'
                          }`}>
                            {(enq.inductionCompleted && enq.gpsRequired) ? <Check className="h-3.5 w-3.5" /> : '2'}
                          </div>
                          <span className={`text-[10px] font-extrabold ${enq.inductionCompleted ? 'text-slate-700' : 'text-slate-400'}`}>GPS Fitting</span>
                        </div>

                        <div className={`flex-1 min-w-[24px] h-0.5 border-t-2 border-dashed ${(enq.inductionCompleted && enq.gpsRequired) ? 'border-emerald-500' : 'border-slate-200'}`} />

                        {/* Step 3 Indicator */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black ${
                            enq.routeActivated 
                              ? 'bg-emerald-500 text-white' 
                              : (enq.inductionCompleted && enq.gpsRequired) 
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                                : 'bg-slate-100 text-slate-400'
                          }`}>
                            {enq.routeActivated ? <Check className="h-3.5 w-3.5" /> : '3'}
                          </div>
                          <span className={`text-[10px] font-extrabold ${enq.routeActivated ? 'text-slate-700' : (enq.inductionCompleted && enq.gpsRequired) ? 'text-slate-700' : 'text-slate-400'}`}>Route Start</span>
                        </div>
                      </div>

                      {/* Interactive Wizard Forms - Stretched to full horizontal width of container */}
                      <div className="space-y-3">
                        {/* Completed Step Badges */}
                        {enq.inductionCompleted && (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl text-2xs font-bold shadow-3xs">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="leading-tight">
                              <span className="text-emerald-700 font-extrabold uppercase text-[9px] tracking-wider block">Status: INDUCTION FINISHED</span>
                              <span>Induction finished at <strong className="font-extrabold text-slate-800">{enq.inductionCompany || enq.sitePreference1}</strong> on <span className="font-mono">{formatDateDDMMYYYY(enq.inductionDate)}</span></span>
                            </div>
                          </div>
                        )}

                        {enq.inductionCompleted && enq.gpsRequired && (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl text-2xs font-bold shadow-3xs">
                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="leading-tight">
                              <span className="text-emerald-700 font-extrabold uppercase text-[9px] tracking-wider block">Status: GPS FITTED</span>
                              {enq.gpsRequired === 'Yes' ? (
                                <span>Fitted by <strong className="font-extrabold text-slate-800">{enq.gpsVendor || 'Vendor'}</strong> (IMEI: <strong className="font-mono text-slate-800">{enq.gpsImei || 'N/A'}</strong>) on <span className="font-mono">{formatDateDDMMYYYY(enq.gpsFittingDate)}</span></span>
                              ) : (
                                <span>No GPS device required for this company deployment</span>
                              )}
                            </div>
                          </div>
                        )}

                        {enq.routeActivated && (
                          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 border border-indigo-100 p-2.5 rounded-xl text-2xs font-bold shadow-3xs">
                            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                            <div className="leading-tight">
                              <span className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider block">Deployment Active</span>
                              <span>Route officially activated and started on <span className="font-mono font-extrabold">{formatDateDDMMYYYY(enq.routeStartDate)}</span></span>
                            </div>
                          </div>
                        )}

                        {/* --- ACTIVE STEP FORM --- */}
                        
                        {/* 1. Induction Form (if not completed) */}
                        {!enq.inductionCompleted && (
                          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-amber-150 pb-2">
                              <h5 className="text-[10px] font-black uppercase text-amber-800 tracking-wide flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                Step 1 Action: Waiting for Induction
                              </h5>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-800">
                                WAITING FOR INDUCTION
                              </span>
                            </div>
                            <p className="text-3xs text-slate-600 font-medium">
                              This vehicle is scheduled for induction. Verify company preference & date below, then click finish induction when completed:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Reputed Company *</label>
                                <select
                                  value={step1Company[enq.id] !== undefined ? step1Company[enq.id] : (enq.inductionCompany || enq.sitePreference1 || '')}
                                  onChange={(e) => setStep1Company({ ...step1Company, [enq.id]: e.target.value })}
                                  className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                >
                                  <option value="">-- Select Company --</option>
                                  {companies.map((c) => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                  ))}
                                  <option value="Wipro">Wipro Technologies</option>
                                  <option value="Infosys">Infosys Limited</option>
                                  <option value="TCS">TCS (Tata Consultancy)</option>
                                  <option value="Cognizant">Cognizant Tech Solutions</option>
                                  <option value="Accenture">Accenture Services</option>
                                  <option value="Other">+ Enter Custom Company</option>
                                </select>
                                {step1Company[enq.id] === 'Other' && (
                                  <input
                                    type="text"
                                    placeholder="Type custom company name"
                                    value={step1Company[enq.id + '_custom'] || ''}
                                    onChange={(e) => setStep1Company({ ...step1Company, [enq.id + '_custom']: e.target.value })}
                                    className="w-full mt-2 p-2 text-xs border border-slate-250 rounded-lg bg-white"
                                  />
                                )}
                              </div>
                              <div>
                                <label className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Scheduled Induction Date *</label>
                                <input
                                  type="date"
                                  value={step1Date[enq.id] || enq.inductionDate || enq.enquiryDate || new Date().toISOString().substring(0, 10)}
                                  onChange={(e) => setStep1Date({ ...step1Date, [enq.id]: e.target.value })}
                                  className="w-full p-2 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white focus:outline-none text-slate-800"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveStep1(enq.id)}
                              className="w-full mt-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="h-4 w-4" /> Finish Induction & Advance to GPS Fitting
                            </button>
                          </div>
                        )}

                        {/* 2. GPS Fitting Form (if Step 1 is done, but Step 2 is not) */}
                        {enq.inductionCompleted && !enq.gpsRequired && (
                          <div className="p-4 rounded-xl border border-amber-200 bg-white shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h5 className="text-[10px] font-black uppercase text-amber-600 tracking-wide">
                                Step 2 Action: Configure GPS Device Fitting
                              </h5>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-700">IN PROGRESS</span>
                            </div>
                            <p className="text-3xs text-slate-500">Determine if this deployment requires GPS tracking device installation:</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <button
                                type="button"
                                onClick={() => setShowGpsForm({ ...showGpsForm, [enq.id]: true })}
                                className={`py-2 rounded-lg border text-xs font-black uppercase shadow-3xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                  showGpsForm[enq.id] 
                                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                Yes, Fit GPS
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveStep2NoGps(enq.id)}
                                className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-black uppercase shadow-3xs transition-all cursor-pointer"
                              >
                                No GPS Required
                              </button>
                            </div>

                            {showGpsForm[enq.id] && (
                              <div className="mt-2 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">GPS Vendor Name</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. AssetTrack"
                                      value={step2Vendor[enq.id] || ''}
                                      onChange={(e) => setStep2Vendor({ ...step2Vendor, [enq.id]: e.target.value })}
                                      className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">IMEI Number</label>
                                    <input
                                      type="text"
                                      placeholder="Enter device IMEI"
                                      value={step2Imei[enq.id] || ''}
                                      onChange={(e) => setStep2Imei({ ...step2Imei, [enq.id]: e.target.value })}
                                      className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Installation Date</label>
                                    <input
                                      type="date"
                                      value={step2Date[enq.id] || new Date().toISOString().substring(0, 10)}
                                      onChange={(e) => setStep2Date({ ...step2Date, [enq.id]: e.target.value })}
                                      className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSaveStep2Gps(enq.id)}
                                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" /> Save GPS Configuration
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Route Activation Form (if Step 1 & 2 done, but Step 3 is not) */}
                        {enq.inductionCompleted && enq.gpsRequired && !enq.routeActivated && (
                          <div className="p-4 rounded-xl border border-indigo-200 bg-white shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-wide">
                                Step 3 Action: Activate Vehicle Route
                              </h5>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700">IN PROGRESS</span>
                            </div>
                            <p className="text-3xs text-slate-500">All preliminary checks and GPS installations are completed. Specify the official route start date to launch this vehicle:</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                              <div>
                                <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Route Start / Joining Date *</label>
                                <input
                                  type="date"
                                  value={step3Date[enq.id] || new Date().toISOString().substring(0, 10)}
                                  onChange={(e) => setStep3Date({ ...step3Date, [enq.id]: e.target.value })}
                                  className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSaveStep3Activate(enq)}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                🚀 Activate Route & Promote
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 4. Completely Deployed State */}
                        {enq.routeActivated && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center space-y-2">
                            <span className="inline-flex h-8 w-8 rounded-full bg-emerald-500 text-white items-center justify-center text-lg animate-bounce">
                              🚀
                            </span>
                            <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Fully Onboarded & Deployed!</h5>
                            <p className="text-2xs text-emerald-700 max-w-xl mx-auto leading-normal">
                              This vehicle has successfully passed through the Induction assigned client, GPS tracking configuration, and Route activation. It is now registered in the Master Records.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMMENTS SIDE-PANEL / MODAL */}
      {activeCommentTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Induction Follow-Up Log</h3>
                <p className="text-4xs text-indigo-600 font-extrabold uppercase tracking-wider mt-0.5">
                  {activeCommentTarget.vehicleNumber} ({activeCommentTarget.driverName})
                </p>
              </div>
              <button
                onClick={() => setActiveCommentTarget(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {!activeCommentTarget.comments || activeCommentTarget.comments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <MessageSquare className="h-10 w-10 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-bold">No Induction Notes Recorded</p>
                  <p className="text-[10px] text-slate-400">Record verification calls, document issues, or supervisor feedback below.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeCommentTarget.comments.map((cmt, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-4xs font-extrabold text-slate-400 uppercase tracking-widest">
                        <span>{cmt.author}</span>
                        <span>{cmt.date}</span>
                      </div>
                      <p className="text-2xs text-slate-700 font-medium leading-relaxed">{cmt.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-slate-150 bg-slate-50/50 space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Type follow-up note (e.g. GPS provider verified / Insurance waiting)..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-250 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              ></textarea>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCommentTarget(null)}
                  className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-600 text-3xs font-extrabold uppercase transition-all hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-3xs font-extrabold uppercase transition-all hover:bg-indigo-700 cursor-pointer shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMPLIANCE DETAIL DIALOG */}
      {editingEnq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Update Boarding & Compliance Data: {editingEnq.vehicleNumber}
                </h3>
              </div>
              <button
                onClick={() => setEditingEnq(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs border border-rose-200 rounded-lg flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-2xs font-extrabold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1.5">
                  Basic Vehicle Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Registration/Temporary No *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TN 31 CJ 6721"
                      value={editingEnq.vehicleNumber || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, vehicleNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Vehicle Type *</label>
                    <select
                      value={editingEnq.vehicleType || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, vehicleType: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Select Type --</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Bus">Bus</option>
                      <option value="Tempo Traveler">Tempo Traveler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Model & Year</label>
                    <input
                      type="text"
                      placeholder="e.g. Innova Crysta (2024)"
                      value={editingEnq.vehicleModelYear || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, vehicleModelYear: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Vehicle Color</label>
                    <input
                      type="text"
                      placeholder="e.g. White"
                      value={editingEnq.vehicleColor || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, vehicleColor: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh"
                      value={editingEnq.ownerName || (editingEnq.ownerNamePhone ? editingEnq.ownerNamePhone.split(/[-–—/]/)[0]?.trim() : '')}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const phone = editingEnq.ownerMobile || (editingEnq.ownerNamePhone && editingEnq.ownerNamePhone.split(/[-–—/]/)[1] ? editingEnq.ownerNamePhone.split(/[-–—/]/)[1].trim() : '');
                        const combined = phone ? `${newName} - ${phone}` : newName;
                        setEditingEnq({ ...editingEnq, ownerName: newName, ownerNamePhone: combined });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Phone / Mobile</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={editingEnq.ownerMobile || (editingEnq.ownerNamePhone && editingEnq.ownerNamePhone.split(/[-–—/]/)[1] ? editingEnq.ownerNamePhone.split(/[-–—/]/)[1].trim() : '')}
                      onChange={(e) => {
                        const newPhone = e.target.value;
                        const name = editingEnq.ownerName || (editingEnq.ownerNamePhone ? editingEnq.ownerNamePhone.split(/[-–—/]/)[0]?.trim() : '');
                        const combined = newPhone ? `${name} - ${newPhone}` : name;
                        setEditingEnq({ ...editingEnq, ownerMobile: newPhone, ownerNamePhone: combined });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Already Running Company</label>
                    <input
                      type="text"
                      placeholder="e.g. TCS"
                      value={editingEnq.alreadyRunningCompany || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, alreadyRunningCompany: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xs font-extrabold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-1.5">
                  Driver & Crew Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kumar"
                      value={editingEnq.driverName || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, driverName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={editingEnq.driverPhone || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, driverPhone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Age</label>
                    <input
                      type="text"
                      placeholder="e.g. 32"
                      value={editingEnq.driverAge || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, driverAge: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Resident Area</label>
                    <input
                      type="text"
                      placeholder="e.g. Tambaram"
                      value={editingEnq.driverArea || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, driverArea: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xs font-extrabold text-violet-600 uppercase tracking-widest border-b border-violet-100 pb-1.5">
                  Induction & Deployment Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Reputed Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Wipro / TCS"
                      value={editingEnq.inductionCompany || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, inductionCompany: e.target.value, inductionCompleted: !!e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Induction Date</label>
                    <input
                      type="date"
                      value={editingEnq.inductionDate || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, inductionDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">GPS Fitting Required?</label>
                    <select
                      value={editingEnq.gpsRequired || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, gpsRequired: e.target.value as 'Yes' | 'No' | undefined })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                    >
                      <option value="">-- Select Option --</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">GPS Fitting Date</label>
                    <input
                      type="date"
                      value={editingEnq.gpsFittingDate || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, gpsFittingDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Route Activated?</label>
                    <select
                      value={editingEnq.routeActivated ? 'Yes' : 'No'}
                      onChange={(e) => setEditingEnq({ ...editingEnq, routeActivated: e.target.value === 'Yes' })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Route Start Date</label>
                    <input
                      type="date"
                      value={editingEnq.routeStartDate || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, routeStartDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xs font-extrabold text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1.5">
                  GPS Configuration details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">GPS Device Vendor</label>
                    <input
                      type="text"
                      placeholder="e.g. AssetTrack / MapmyIndia"
                      value={editingEnq.gpsVendor || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, gpsVendor: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">GPS IMEI Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 863452048892110"
                      value={editingEnq.gpsImei || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, gpsImei: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xs font-extrabold text-amber-600 uppercase tracking-widest border-b border-amber-100 pb-1.5">
                  Document Expiries
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">RC Expiry Date</label>
                    <input
                      type="date"
                      value={editingEnq.rcExpiry || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, rcExpiry: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Insurance Expiry Date</label>
                    <input
                      type="date"
                      value={editingEnq.insuranceExpiry || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, insuranceExpiry: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Permit Type / Validity</label>
                    <input
                      type="text"
                      placeholder="e.g. All India Permit (2028-10-15)"
                      value={editingEnq.permitExpiry || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, permitExpiry: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">FC Expiry Date</label>
                    <input
                      type="date"
                      value={editingEnq.fcExpiry || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, fcExpiry: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xs font-extrabold text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-1.5">
                  Driver & Crew Compliance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">DL Number</label>
                    <input
                      type="text"
                      value={editingEnq.driverDlNumber || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, driverDlNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">DL Expiry Date</label>
                    <input
                      type="date"
                      value={editingEnq.driverDlExpiry || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, driverDlExpiry: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Aadhaar No</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234 5678 9012"
                      value={editingEnq.driverAadhaar || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, driverAadhaar: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Badge Expiry</label>
                    <input
                      type="date"
                      value={editingEnq.driverBatchExp || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, driverBatchExp: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xs font-extrabold text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-1.5">
                  Settlement Bank Account details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editingEnq.bankName || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, bankName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Holder Name</label>
                    <input
                      type="text"
                      value={editingEnq.bankAccountHolder || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, bankAccountHolder: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                    <input
                      type="text"
                      value={editingEnq.bankAccountNumber || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={editingEnq.bankIfsc || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, bankIfsc: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEnq(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Save boarding Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTION DIALOG (Finish Induction & Move to Master Register) */}
      {promotingEnquiry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-emerald-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Database className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">
                    Induction Completed: Register Vehicle
                  </h3>
                </div>
                <p className="text-3xs text-slate-500 font-extrabold uppercase tracking-wider">
                  Transition {promotingEnquiry.vehicleNumber} and its crew out of induction into active Master registers
                </p>
              </div>
              <button
                onClick={() => setPromotingEnquiry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="flex-1 overflow-y-auto p-6 space-y-6">
              {promoteError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <span className="font-bold">Error:</span>
                  <span>{promoteError}</span>
                </div>
              )}

              {promoteSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-start gap-2 animate-bounce">
                  <span className="font-bold">Success:</span>
                  <span>{promoteSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Vehicle Master Profile */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-indigo-600" />
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">1. Vehicle Master</h4>
                    </div>
                    <input
                      type="checkbox"
                      checked={promoteForm.createVehicle}
                      onChange={(e) => setPromoteForm({ ...promoteForm, createVehicle: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 border-slate-300 rounded"
                    />
                  </div>

                  {promoteForm.createVehicle && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Registration No *</label>
                        <input
                          type="text"
                          required
                          value={promoteForm.registrationNumber}
                          onChange={(e) => setPromoteForm({ ...promoteForm, registrationNumber: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Manufacturer</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.manufacturer}
                            onChange={(e) => setPromoteForm({ ...promoteForm, manufacturer: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Model Name</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.model}
                            onChange={(e) => {
                              const newModel = e.target.value;
                              const autoMfg = detectManufacturer(newModel);
                              setPromoteForm({
                                ...promoteForm,
                                model: newModel,
                                manufacturer: autoMfg || promoteForm.manufacturer,
                              });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Mfg Year</label>
                          <input
                            type="number"
                            required
                            value={promoteForm.year}
                            onChange={(e) => setPromoteForm({ ...promoteForm, year: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                          <select
                            value={promoteForm.vehicleType}
                            onChange={(e) => setPromoteForm({ ...promoteForm, vehicleType: e.target.value as any })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                          >
                            <option value="Sedan">Sedan</option>
                            <option value="SUV">SUV</option>
                            <option value="Hatchback">Hatchback</option>
                            <option value="Bus">Bus</option>
                            <option value="Tempo Traveler">Tempo Traveler</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fuel Type</label>
                          <select
                            value={promoteForm.fuelType}
                            onChange={(e) => setPromoteForm({ ...promoteForm, fuelType: e.target.value as any })}
                            className="w-full px-2 py-1.5 text-xs border"
                          >
                            <option value="CNG">CNG</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Petrol">Petrol</option>
                            <option value="EV">EV</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Deployment Company</label>
                          <select
                            value={promoteForm.company}
                            onChange={(e) => setPromoteForm({ ...promoteForm, company: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border"
                          >
                            <option value="">No Active Company</option>
                            {companies.map((c) => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Route Start / Joining Date</label>
                        <input
                          type="date"
                          required
                          value={promoteForm.joiningDate}
                          onChange={(e) => setPromoteForm({ ...promoteForm, joiningDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Owner Master Profile */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">2. Owner Master</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const oName = promoteForm.ownerName.trim();
                        const oPhone = promoteForm.ownerPhone.trim();
                        if (!oName) return;
                        const matchedD = (drivers || []).find(
                          (d) =>
                            (oName && d.name && d.name.trim().toLowerCase() === oName.toLowerCase()) ||
                            (oPhone && d.phone && d.phone.replace(/[^0-9]/g, '') === oPhone.replace(/[^0-9]/g, ''))
                        );
                        setPromoteForm((prev) => ({
                          ...prev,
                          driverName: oName,
                          driverPhone: oPhone,
                          driverId: matchedD ? matchedD.id : 'new',
                          createDriver: matchedD ? false : true,
                        }));
                      }}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                      title="Set Owner as Driver (Owner-cum-Driver)"
                    >
                      <Sparkles className="h-3 w-3 text-indigo-600" /> Owner-cum-Driver
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Master Selection</label>
                      <select
                        value={promoteForm.ownerId}
                        onChange={(e) => {
                          const selId = e.target.value;
                          if (selId === 'new') {
                            setPromoteForm({
                              ...promoteForm,
                              ownerId: 'new',
                              createOwner: true,
                            });
                          } else {
                            const selOwner = (owners || []).find((o) => o.id === selId);
                            setPromoteForm({
                              ...promoteForm,
                              ownerId: selId,
                              createOwner: false,
                              ownerName: selOwner ? selOwner.name : promoteForm.ownerName,
                              ownerPhone: selOwner ? selOwner.phone : promoteForm.ownerPhone,
                            });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
                      >
                        <option value="new">+ Create New Owner Profile</option>
                        {(owners || []).map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Full Name *</label>
                        <input
                          type="text"
                          required
                          value={promoteForm.ownerName}
                          onChange={(e) => setPromoteForm({ ...promoteForm, ownerName: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                          placeholder="Owner Full Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Mobile *</label>
                        <input
                          type="text"
                          required
                          value={promoteForm.ownerPhone}
                          onChange={(e) => setPromoteForm({ ...promoteForm, ownerPhone: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
                          placeholder="10-digit mobile number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Driver Crew Profile */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">3. Driver Master</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const oName = promoteForm.ownerName.trim();
                        const oPhone = promoteForm.ownerPhone.trim();
                        if (!oName) return;
                        const matchedD = (drivers || []).find(
                          (d) =>
                            (oName && d.name && d.name.trim().toLowerCase() === oName.toLowerCase()) ||
                            (oPhone && d.phone && d.phone.replace(/[^0-9]/g, '') === oPhone.replace(/[^0-9]/g, ''))
                        );
                        setPromoteForm((prev) => ({
                          ...prev,
                          driverName: oName,
                          driverPhone: oPhone,
                          driverId: matchedD ? matchedD.id : 'new',
                          createDriver: matchedD ? false : true,
                        }));
                      }}
                      className="text-[10px] font-black text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200 transition-all flex items-center gap-1 cursor-pointer"
                      title="Copy Owner Name & Mobile to Driver"
                    >
                      <Sparkles className="h-3 w-3 text-purple-600" /> Copy Owner Info
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Master Selection</label>
                      <select
                        value={promoteForm.driverId}
                        onChange={(e) => {
                          const selId = e.target.value;
                          if (selId === 'new') {
                            setPromoteForm({
                              ...promoteForm,
                              driverId: 'new',
                              createDriver: true,
                            });
                          } else {
                            const selDriver = (drivers || []).find((d) => d.id === selId);
                            setPromoteForm({
                              ...promoteForm,
                              driverId: selId,
                              createDriver: false,
                              driverName: selDriver ? selDriver.name : promoteForm.driverName,
                              driverPhone: selDriver ? selDriver.phone : promoteForm.driverPhone,
                              driverDl: selDriver && selDriver.licenceNumber ? selDriver.licenceNumber : promoteForm.driverDl,
                              driverDlExp: selDriver && selDriver.licenceExpiry ? selDriver.licenceExpiry : promoteForm.driverDlExp,
                              driverAddress: selDriver && selDriver.address ? selDriver.address : promoteForm.driverAddress,
                            });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
                      >
                        <option value="new">+ Create New Driver Profile</option>
                        {(drivers || []).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Full Name *</label>
                        <input
                          type="text"
                          required
                          value={promoteForm.driverName}
                          onChange={(e) => setPromoteForm({ ...promoteForm, driverName: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 bg-white"
                          placeholder="Driver Full Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Mobile *</label>
                        <input
                          type="text"
                          required
                          value={promoteForm.driverPhone}
                          onChange={(e) => setPromoteForm({ ...promoteForm, driverPhone: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 bg-white"
                          placeholder="10-digit mobile number"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Address</label>
                        <input
                          type="text"
                          value={promoteForm.driverAddress}
                          onChange={(e) => setPromoteForm({ ...promoteForm, driverAddress: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 bg-white"
                          placeholder="Driver Residence / Address"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPromotingEnquiry(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Register Car & Complete Induction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingEnqId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-full">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                Remove from Induction
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Are you sure you want to remove this vehicle from the Induction stage? The vehicle details will be safely preserved and stored in the <strong className="text-slate-800 font-extrabold">Enquiry Desk</strong>.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEnqId(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteVehicle}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Yes, Store in Enquiry Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Restore Confirmation Modal */}
      {restoringEnqId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2.5 bg-emerald-50 rounded-full">
                <RotateCcw className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                Restore Vehicle to Enquiry Desk
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Are you sure you want to restore this vehicle back to the Enquiry Desk? It will be moved out of the Induction stage, and you will be redirected to the Enquiry Desk.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestoringEnqId(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRestoreVehicle}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Yes, Restore & Go to Enquiry Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Preference Modal */}
      {editCompanyModalEnq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Edit Company & Site Preference
                  </h3>
                  <p className="text-3xs font-mono font-bold text-slate-500">
                    Vehicle: {editCompanyModalEnq.vehicleNumber} ({editCompanyModalEnq.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditCompanyModalEnq(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompanyPreference} className="space-y-4">
              <div>
                <label className="block text-2xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                  Reputed Company Preference *
                </label>
                <select
                  value={editCompanyVal}
                  onChange={(e) => setEditCompanyVal(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Wipro">Wipro Technologies</option>
                  <option value="Infosys">Infosys Limited</option>
                  <option value="TCS">TCS (Tata Consultancy)</option>
                  <option value="Cognizant">Cognizant Tech Solutions</option>
                  <option value="Accenture">Accenture Services</option>
                  <option value="Other">+ Enter Custom Company</option>
                </select>
                {editCompanyVal === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom company name"
                    value={editCustomCompanyVal}
                    onChange={(e) => setEditCustomCompanyVal(e.target.value)}
                    className="w-full mt-2 p-2.5 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                    Site Preference 1
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EC Phase 1 / OMR"
                    value={editSitePref1Val}
                    onChange={(e) => setEditSitePref1Val(e.target.value)}
                    className="w-full p-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                    Site Preference 2
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Whitefield"
                    value={editSitePref2Val}
                    onChange={(e) => setEditSitePref2Val(e.target.value)}
                    className="w-full p-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-2xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">
                    Induction Date
                  </label>
                  <input
                    type="date"
                    value={editInductionDateVal}
                    onChange={(e) => setEditInductionDateVal(e.target.value)}
                    className="w-full p-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editInductionCompletedVal}
                      onChange={(e) => setEditInductionCompletedVal(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-2xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Induction Finished / Inducted
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditCompanyModalEnq(null)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Save Preference</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
