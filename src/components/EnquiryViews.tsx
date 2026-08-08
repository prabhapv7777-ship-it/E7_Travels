import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Enquiry, Site, Vehicle, Owner, Driver, Company, DeletedVehicle, detectManufacturer } from '../types';
import { formatDate } from '../lib/dateUtils';
import { generateUniqueEnquiryId, generateUniqueOwnerId, generateUniqueDriverId, generateUniqueVehicleId } from '../lib/idUtils';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';

export function calculateBatchExperience(batchExpStr?: string | null): string {
  if (!batchExpStr || !batchExpStr.trim() || batchExpStr === '-') return 'EXP: No Exp';
  const val = batchExpStr.trim();

  // If already user-typed text with year/month keywords e.g. "2 YEARS", "6 MONTH"
  if (/\d+\s*(yrs?|years?|months?|mos?)/i.test(val)) {
    return val.toUpperCase().startsWith('EXP') ? val : `EXP: ${val}`;
  }

  // If it's a simple number e.g. "2", "8", "1.5", "20"
  if (/^\d+(\.\d+)?$/.test(val)) {
    const num = parseFloat(val);
    if (num < 50) {
      return `EXP: ${num} Yr${num > 1 ? 's' : ''}`;
    }
    const nowYr = new Date().getFullYear();
    const diff = nowYr - num;
    if (diff >= 0) {
      return `EXP: ${diff} Yr${diff !== 1 ? 's' : ''}`;
    } else {
      return `EXP: Valid (${Math.abs(diff)} Yr${Math.abs(diff) !== 1 ? 's' : ''})`;
    }
  }

  // MM/YYYY format e.g. "05/2026", "01/2022"
  const mmYyyyMatch = val.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyyMatch) {
    const m = parseInt(mmYyyyMatch[1], 10) - 1;
    const y = parseInt(mmYyyyMatch[2], 10);
    const batchDate = new Date(y, m, 1);
    const now = new Date();
    let months = (now.getFullYear() - batchDate.getFullYear()) * 12 + (now.getMonth() - batchDate.getMonth());
    if (months < 0) {
      const absMos = Math.abs(months);
      const yrs = Math.floor(absMos / 12);
      const rem = absMos % 12;
      return yrs > 0 ? `EXP: Valid (${yrs} Yr${yrs > 1 ? 's' : ''})` : `EXP: Valid (${rem} Mo${rem > 1 ? 's' : ''})`;
    }
    const yrs = Math.floor(months / 12);
    const remMonths = months % 12;
    if (yrs === 0 && remMonths === 0) return 'EXP: < 1 Mo';
    if (yrs === 0) return `EXP: ${remMonths} Mo${remMonths > 1 ? 's' : ''}`;
    if (remMonths === 0) return `EXP: ${yrs} Yr${yrs > 1 ? 's' : ''}`;
    return `EXP: ${yrs} Yr${yrs > 1 ? 's' : ''} ${remMonths} Mo${remMonths > 1 ? 's' : ''}`;
  }

  // YYYY-MM-DD or DD/MM/YYYY date
  let batchDate: Date | null = null;
  const ymdMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    batchDate = new Date(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[3], 10));
  } else {
    const dmyMatch = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmyMatch) {
      batchDate = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
    }
  }

  if (batchDate && !isNaN(batchDate.getTime())) {
    const now = new Date();
    let months = (now.getFullYear() - batchDate.getFullYear()) * 12 + (now.getMonth() - batchDate.getMonth());
    if (now.getDate() < batchDate.getDate()) {
      months--;
    }
    if (months < 0) {
      const absMos = Math.abs(months);
      const yrs = Math.floor(absMos / 12);
      const rem = absMos % 12;
      return yrs > 0 ? `EXP: Valid (${yrs} Yr${yrs > 1 ? 's' : ''})` : `EXP: Valid (${rem} Mo${rem > 1 ? 's' : ''})`;
    }
    const yrs = Math.floor(months / 12);
    const remMonths = months % 12;
    if (yrs === 0 && remMonths === 0) return 'EXP: < 1 Mo';
    if (yrs === 0) return `EXP: ${remMonths} Mo${remMonths > 1 ? 's' : ''}`;
    if (remMonths === 0) return `EXP: ${yrs} Yr${yrs > 1 ? 's' : ''}`;
    return `EXP: ${yrs} Yr${yrs > 1 ? 's' : ''} ${remMonths} Mo${remMonths > 1 ? 's' : ''}`;
  }

  return `EXP: ${val}`;
}
import {
  PhoneCall,
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  Building2,
  CheckCircle,
  Calendar,
  XCircle,
  MapPin,
  User,
  FileText,
  FileSpreadsheet,
  Car,
  Tag,
  Briefcase,
  Layers,
  Sparkles,
  Database,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Printer,
  ExternalLink,
  BookmarkCheck,
  Eye,
  Share2,
  Copy,
  Check,
  Send,
  AlertTriangle,
  ShieldAlert,
  GitMerge,
  CheckCircle2,
} from 'lucide-react';
import PrintJoiningForm from './PrintJoiningForm';
import PrintEnquiryReport from './PrintEnquiryReport';

interface EnquiryViewsProps {
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

export default function EnquiryViews({
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
  deletedVehicles = [],
  onUpdateDeletedVehicles,
}: EnquiryViewsProps) {
  // Helper to parse Site Preference into Company Name, Site Name, and Vendor Badge
  const getSitePrefCompanyDisplay = (pref: string | undefined) => {
    if (!pref || pref === 'Open Preference' || pref.trim() === '') {
      return { companyName: null, siteName: 'Open Preference', vendor: null };
    }

    const cleanPref = pref.trim();

    // 1. Check if pref matches a Company in companies array
    const matchedCompany = companies.find(
      (c) =>
        c.name.toLowerCase() === cleanPref.toLowerCase() ||
        (c.companySite && c.companySite.toLowerCase() === cleanPref.toLowerCase())
    );

    // 2. Check if pref matches a Site in sites array
    const matchedSite = sites.find(
      (s) => s.name.toLowerCase() === cleanPref.toLowerCase() || s.id.toLowerCase() === cleanPref.toLowerCase()
    );

    let companyName = matchedCompany?.name || matchedSite?.companyName || '';
    let siteName = matchedCompany?.companySite || matchedSite?.name || cleanPref;
    let vendor = matchedCompany?.vendorName || '';

    // If no specific company was mapped but pref exists, treat pref as the Company/Site name
    if (!companyName && cleanPref) {
      companyName = cleanPref;
    }

    return { companyName, siteName, vendor };
  };

  // Helper to render Site Preference select options including all Corporate Companies and Sites
  const renderSitePrefOptions = (currentVal: string) => {
    const optionsMap = new Map<string, string>(); // value -> display label

    // Add companies first
    companies.forEach((c) => {
      const siteVal = c.companySite || c.name;
      const label = c.companySite && c.companySite !== c.name
        ? `${c.name} - ${c.companySite}${c.vendorName ? ` [${c.vendorName}]` : ''}`
        : `${c.name}${c.vendorName ? ` [${c.vendorName}]` : ''}`;
      if (siteVal) optionsMap.set(siteVal, label);
      if (c.name && !optionsMap.has(c.name)) optionsMap.set(c.name, c.name);
    });

    // Add sites
    sites.forEach((s) => {
      const label = s.companyName ? `${s.companyName} - ${s.name}` : s.name;
      if (s.name && !optionsMap.has(s.name)) {
        optionsMap.set(s.name, label);
      }
    });

    // Add standard known corporate clients if not already added
    const defaultCorporates = [
      'AMAZON', 'ASTRAZENICA', 'BARCLAYS', 'COGNIZANT', 'CTS', 'MEDEXPERT',
      'OPTUM', 'STATE STREET', 'TCS', 'WALMART', 'WORKDAY'
    ];
    defaultCorporates.forEach((corp) => {
      if (!optionsMap.has(corp)) {
        optionsMap.set(corp, corp);
      }
    });

    if (currentVal && currentVal !== 'Open Preference' && !optionsMap.has(currentVal)) {
      optionsMap.set(currentVal, currentVal);
    }

    return (
      <>
        <option value="Open Preference">Open Preference / Any Site</option>
        <optgroup label="🏢 Corporate Companies & Operating Sites">
          {Array.from(optionsMap.entries()).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </optgroup>
      </>
    );
  };

  // Helper to extract Owner Name only
  const getOwnerNameOnly = (enq: Enquiry) => {
    if (enq.ownerName) return enq.ownerName;
    if (enq.ownerNamePhone) {
      const raw = enq.ownerNamePhone.trim();
      const parts = raw.split(/[-–—/]/);
      if (parts.length >= 2) {
        const part1 = parts[0].trim();
        const part2 = parts[1].trim();
        if (/^\+?\d[\d\s-]{6,}$/.test(part1) && !/^\+?\d[\d\s-]{6,}$/.test(part2)) {
          return part2;
        }
        return part1;
      }
      if (!/^\+?\d[\d\s-]{6,}$/.test(raw)) {
        return raw;
      }
    }
    return 'Unspecified';
  };

  // Helper to extract Owner Phone only
  const getOwnerPhone = (enq: Enquiry) => {
    if (enq.ownerMobile) return enq.ownerMobile;
    if (enq.ownerNamePhone) {
      const raw = enq.ownerNamePhone.trim();
      const parts = raw.split(/[-–—/]/);
      if (parts.length >= 2) {
        const part1 = parts[0].trim();
        const part2 = parts[1].trim();
        if (/^\+?\d[\d\s-]{6,}$/.test(part1)) return part1;
        if (/^\+?\d[\d\s-]{6,}$/.test(part2)) return part2;
      }
      if (/^\+?\d[\d\s-]{6,}$/.test(raw)) {
        return raw;
      }
    }
    return '';
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Interested' | 'Site Offered' | 'Induction' | 'Closed'>('all');
  const [referenceOnlyFilter, setReferenceOnlyFilter] = useState(false);

  // Column Toggle Visibility States
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    vehicleDetails: true,
    ownerDetails: true,
    referenceTag: true,
    driverDetails: true,
    runningCompany: true,
    sitePref1: true,
    sitePref2: true,
    status: true,
  });
  const [showColumnToggleMenu, setShowColumnToggleMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'enquiryDate' | 'id' | 'vehicleNumber' | 'driverName' | 'status'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingEnquiry, setDeletingEnquiry] = useState<Enquiry | null>(null);

  // Print States
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  const [selectedEnquiryForFormPrint, setSelectedEnquiryForFormPrint] = useState<Enquiry | null>(null);

  // Promotion to Master Registers State
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
  });
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);
  const [infoNotification, setInfoNotification] = useState<string | null>(null);

  // Merge Duplicate Vehicles States & Handlers
  const [mergingGroupNorm, setMergingGroupNorm] = useState<string | null>(null);
  const [selectedPrimaryEnquiryId, setSelectedPrimaryEnquiryId] = useState<string | null>(null);
  const [mergeConsolidateRemarks, setMergeConsolidateRemarks] = useState<boolean>(true);

  const handleOpenMergeModal = (normVehPlate: string) => {
    setMergingGroupNorm(normVehPlate);
    const group = duplicateEnquiryVehicleGroups.get(normVehPlate) || [];
    if (group.length > 0) {
      setSelectedPrimaryEnquiryId(group[0].id);
    }
    setMergeConsolidateRemarks(true);
  };

  const handleConfirmMergeSingleGroup = () => {
    if (!mergingGroupNorm) return;
    const group = duplicateEnquiryVehicleGroups.get(mergingGroupNorm) || [];
    if (group.length < 2) {
      setMergingGroupNorm(null);
      return;
    }

    const primaryEnq = group.find((e) => e.id === selectedPrimaryEnquiryId) || group[0];
    const duplicates = group.filter((e) => e.id !== primaryEnq.id);

    let merged: Enquiry = { ...primaryEnq };

    duplicates.forEach((dup) => {
      if (!merged.vehicleType && dup.vehicleType) merged.vehicleType = dup.vehicleType;
      if (!merged.fuelType && dup.fuelType) merged.fuelType = dup.fuelType;
      if (!merged.vehicleModelYear && dup.vehicleModelYear) merged.vehicleModelYear = dup.vehicleModelYear;
      if (!merged.vehicleColor && dup.vehicleColor) merged.vehicleColor = dup.vehicleColor;
      if (!merged.ownerName && dup.ownerName) merged.ownerName = dup.ownerName;
      if (!merged.ownerMobile && dup.ownerMobile) merged.ownerMobile = dup.ownerMobile;
      if (!merged.ownerNamePhone && dup.ownerNamePhone) merged.ownerNamePhone = dup.ownerNamePhone;
      if (!merged.driverName && dup.driverName) merged.driverName = dup.driverName;
      if (!merged.driverPhone && dup.driverPhone) merged.driverPhone = dup.driverPhone;
      if (!merged.driverArea && dup.driverArea) merged.driverArea = dup.driverArea;
      if (!merged.alreadyRunningCompany && dup.alreadyRunningCompany) merged.alreadyRunningCompany = dup.alreadyRunningCompany;
      if (!merged.sitePreference1 && dup.sitePreference1) merged.sitePreference1 = dup.sitePreference1;
      if (!merged.sitePreference2 && dup.sitePreference2) merged.sitePreference2 = dup.sitePreference2;
      if (!merged.sitePreference3 && dup.sitePreference3) merged.sitePreference3 = dup.sitePreference3;
      if (!merged.reference && dup.reference) merged.reference = dup.reference;

      if (mergeConsolidateRemarks && dup.remarks && dup.remarks.trim()) {
        if (!merged.remarks || merged.remarks.trim() === '') {
          merged.remarks = `[Merged from ${dup.id}]: ${dup.remarks}`;
        } else if (!merged.remarks.includes(dup.remarks)) {
          merged.remarks += `\n[Merged from ${dup.id}]: ${dup.remarks}`;
        }
      }

      if (dup.comments && dup.comments.length > 0) {
        const existingComments = merged.comments || [];
        const newComms = dup.comments.filter(
          (c) => !existingComments.some((ec) => ec.text === c.text && ec.date === c.date)
        );
        merged.comments = [...existingComments, ...newComms];
      }
    });

    const dupIds = new Set(duplicates.map((d) => d.id));
    const updatedList = enquiries
      .map((e) => (e.id === primaryEnq.id ? merged : e))
      .filter((e) => !dupIds.has(e.id));

    onUpdateEnquiries(updatedList);
    setMergingGroupNorm(null);
    setInfoNotification(
      `Successfully merged ${group.length} duplicate enquiry records for ${merged.vehicleNumber} into Primary Record ${merged.id}!`
    );
  };

  const handleMergeAllDuplicatesBatch = () => {
    if (duplicateEnquiryVehicleGroups.size === 0) return;

    let updatedList = [...enquiries];
    let totalMergedCount = 0;
    const vehicleCount = duplicateEnquiryVehicleGroups.size;

    duplicateEnquiryVehicleGroups.forEach((group) => {
      if (group.length < 2) return;
      const primaryEnq = group[0];
      const duplicates = group.slice(1);

      let merged: Enquiry = { ...primaryEnq };

      duplicates.forEach((dup) => {
        if (!merged.vehicleType && dup.vehicleType) merged.vehicleType = dup.vehicleType;
        if (!merged.fuelType && dup.fuelType) merged.fuelType = dup.fuelType;
        if (!merged.vehicleModelYear && dup.vehicleModelYear) merged.vehicleModelYear = dup.vehicleModelYear;
        if (!merged.vehicleColor && dup.vehicleColor) merged.vehicleColor = dup.vehicleColor;
        if (!merged.ownerName && dup.ownerName) merged.ownerName = dup.ownerName;
        if (!merged.ownerMobile && dup.ownerMobile) merged.ownerMobile = dup.ownerMobile;
        if (!merged.ownerNamePhone && dup.ownerNamePhone) merged.ownerNamePhone = dup.ownerNamePhone;
        if (!merged.driverName && dup.driverName) merged.driverName = dup.driverName;
        if (!merged.driverPhone && dup.driverPhone) merged.driverPhone = dup.driverPhone;
        if (!merged.driverArea && dup.driverArea) merged.driverArea = dup.driverArea;
        if (!merged.alreadyRunningCompany && dup.alreadyRunningCompany) merged.alreadyRunningCompany = dup.alreadyRunningCompany;
        if (!merged.sitePreference1 && dup.sitePreference1) merged.sitePreference1 = dup.sitePreference1;
        if (!merged.reference && dup.reference) merged.reference = dup.reference;

        if (dup.remarks && dup.remarks.trim()) {
          if (!merged.remarks || merged.remarks.trim() === '') {
            merged.remarks = `[Merged from ${dup.id}]: ${dup.remarks}`;
          } else if (!merged.remarks.includes(dup.remarks)) {
            merged.remarks += `\n[Merged from ${dup.id}]: ${dup.remarks}`;
          }
        }

        if (dup.comments && dup.comments.length > 0) {
          const existingComments = merged.comments || [];
          const newComms = dup.comments.filter(
            (c) => !existingComments.some((ec) => ec.text === c.text && ec.date === c.date)
          );
          merged.comments = [...existingComments, ...newComms];
        }
      });

      totalMergedCount += duplicates.length;

      const dupIds = new Set(duplicates.map((d) => d.id));
      updatedList = updatedList
        .map((e) => (e.id === primaryEnq.id ? merged : e))
        .filter((e) => !dupIds.has(e.id));
    });

    onUpdateEnquiries(updatedList);
    setInfoNotification(
      `Successfully merged ${totalMergedCount} duplicate enquiry records across ${vehicleCount} vehicle registration numbers!`
    );
  };

  // Vehicle Induction Dialog States
  const [inductionModalEnquiry, setInductionModalEnquiry] = useState<Enquiry | null>(null);
  const [inductionCompanyChoice, setInductionCompanyChoice] = useState<string>('');
  const [customInductionCompany, setCustomInductionCompany] = useState<string>('');
  const [inductionSiteChoice, setInductionSiteChoice] = useState<string>('');
  const [inductionDateInput, setInductionDateInput] = useState<string>(new Date().toISOString().substring(0, 10));
  const [inductionRemarksInput, setInductionRemarksInput] = useState<string>('');
  const [inductionModalError, setInductionModalError] = useState<string | null>(null);

  // Share / Message Format State
  const [sharingEnquiryMessage, setSharingEnquiryMessage] = useState<Enquiry | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Helper to generate formatted message string as requested:
  // "COMPANY SITE, CAR NUMBER, TYPE, DRIVER NAME, DRIVER NUMBER, AGE, BATCH EXPERIENCE, AREA"
  const generateEnquiryMessageFormat = (enq: Partial<Enquiry>): string => {
    const { companyName, siteName } = getSitePrefCompanyDisplay(enq.sitePreference1);
    let companySiteStr = '';
    if (companyName && siteName && companyName !== siteName) {
      companySiteStr = `${companyName} (${siteName})`;
    } else if (companyName || siteName) {
      companySiteStr = companyName || siteName;
    } else {
      companySiteStr = enq.sitePreference1 || 'Open Preference';
    }
    if (enq.alreadyRunningCompany && enq.alreadyRunningCompany.trim() !== '') {
      companySiteStr += ` [Running: ${enq.alreadyRunningCompany}]`;
    }

    const carNumberStr = enq.vehicleNumber || '-';
    
    const typeParts = [enq.vehicleType, enq.fuelType].filter(Boolean);
    const typeStr = typeParts.length > 0 ? typeParts.join(' - ') : '-';

    const driverNameStr = enq.driverName || '-';
    const driverNumberStr = enq.driverPhone || '-';
    const ageStr = enq.driverAge ? `${enq.driverAge}` : '-';
    const batchExpStr = enq.driverBatchExp || '-';
    const areaStr = enq.driverArea || '-';

    return `COMPANY SITE: ${companySiteStr}
CAR NUMBER: ${carNumberStr}
TYPE: ${typeStr}
DRIVER NAME: ${driverNameStr}
DRIVER NUMBER: ${driverNumberStr}
AGE: ${ageStr}
BATCH EXPERIENCE: ${batchExpStr}
AREA: ${areaStr}`;
  };

  const handleCopyEnquiryMessage = (enq: Enquiry) => {
    const msgText = generateEnquiryMessageFormat(enq);
    navigator.clipboard.writeText(msgText);
    setIsCopied(true);
    setSharingEnquiryMessage(enq);
    setInfoNotification(`Enquiry details message copied to clipboard!`);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
    setTimeout(() => {
      setInfoNotification((curr) => (curr?.includes('copied') ? null : curr));
    }, 5000);
  };

  const [activeCommentTarget, setActiveCommentTarget] = useState<{
    id: string;
    name: string;
    type: 'Enquiry';
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
    const updated = enquiries.map(enq => enq.id === activeCommentTarget.id ? { ...enq, comments: updatedComments } : enq);
    onUpdateEnquiries(updated);

    setActiveCommentTarget({
      ...activeCommentTarget,
      comments: updatedComments
    });
    setNewCommentText('');
  };

  const formRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' || 
      target.tagName === 'INPUT' || 
      target.tagName === 'SELECT' || 
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('a')
    ) {
      return;
    }
    if (tableContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - tableContainerRef.current.offsetLeft);
      setScrollLeftState(tableContainerRef.current.scrollLeft);
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = 400;
      tableContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToSection = (section: 'id' | 'vehicle' | 'driver' | 'company' | 'status') => {
    if (tableContainerRef.current) {
      let scrollPosition = 0;
      if (section === 'id') scrollPosition = 0;
      else if (section === 'vehicle') scrollPosition = 110;
      else if (section === 'driver') scrollPosition = 750;
      else if (section === 'company') scrollPosition = 1250;
      else if (section === 'status') scrollPosition = 1600;

      tableContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (editingId) {
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const firstInput = formRef.current.querySelector('input, select') as HTMLInputElement | HTMLSelectElement;
          if (firstInput) {
            firstInput.focus();
          }
        }
      }, 100);
    }
  }, [editingId]);

  useEffect(() => {
    if (isAdding || editingId || promotingEnquiry || isPrintingReport || selectedEnquiryForFormPrint || sharingEnquiryMessage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdding, editingId, promotingEnquiry, isPrintingReport, selectedEnquiryForFormPrint, sharingEnquiryMessage]);

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

    // Extra Printable Form Fields
    inductionType: 'OwnerAttach',
    ownerId: '',
    ownerName: '',
    ownerMobile: '',
    mfdYear: '',
    fuelType: 'Diesel',
    rcExpiry: '',
    insuranceExpiry: '',
    permitExpiry: '',
    fcExpiry: '',
    driverAltPhone: '',
    driverEmail: '',
    driverAadhaar: '',
    driverDlNumber: '',
    driverDlExpiry: '',
    driverAddress: '',
    gpsVendor: '',
    gpsImei: '',
    bankName: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    bankIfsc: '',
    sitePreference3: '',
    sitePreference4: '',
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
      sitePreference1: 'Open Preference',
      sitePreference2: 'Open Preference',
      enquiryDate: new Date().toISOString().substring(0, 10),
      status: 'New',
      remarks: '',

      // Extra Printable Form Fields
      inductionType: 'OwnerAttach',
      ownerId: '',
      ownerName: '',
      ownerMobile: '',
      mfdYear: '',
      fuelType: 'Diesel',
      rcExpiry: '',
      insuranceExpiry: '',
      permitExpiry: '',
      fcExpiry: '',
      driverAltPhone: '',
      driverEmail: '',
      driverAadhaar: '',
      driverDlNumber: '',
      driverDlExpiry: '',
      driverAddress: '',
      gpsVendor: '',
      gpsImei: '',
      bankName: '',
      bankAccountHolder: '',
      bankAccountNumber: '',
      bankIfsc: '',
      sitePreference3: '',
      sitePreference4: '',
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

  const hasSitePref = (e: {
    sitePreference1?: string;
    sitePreference2?: string;
    sitePreference3?: string;
    sitePreference4?: string;
    inductionSite?: string;
    site?: string;
  }) => {
    const prefs = [
      e.sitePreference1,
      e.sitePreference2,
      e.sitePreference3,
      e.sitePreference4,
      e.inductionSite,
      e.site,
    ];
    return prefs.some((p) => {
      if (!p) return false;
      const s = p.trim().toLowerCase();
      return (
        s !== '' &&
        s !== 'open preference' &&
        s !== 'open preference / any site' &&
        s !== 'none' &&
        s !== '-' &&
        s !== 'select site' &&
        s !== 'none / tour operator'
      );
    });
  };

  const getEffectiveStatus = (e: Enquiry) => {
    if (e.status === 'Induction' || e.status === 'Closed') {
      return e.status;
    }
    if (e.status === 'Site Offered' || hasSitePref(e)) {
      return 'Site Offered';
    }
    return e.status || 'New';
  };

  // Duplicate Vehicle Modal State & Helper
  const [duplicateModalMatch, setDuplicateModalMatch] = useState<{
    type: 'Enquiry' | 'MasterVehicle';
    enquiry?: Enquiry;
    vehicle?: Vehicle;
    vehicleNumber: string;
  } | null>(null);

  const normalizeCarNo = (val: string | undefined | null): string => {
    if (!val) return '';
    return val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  };

  const getExistingVehicleMatch = (vNo: string | undefined | null, currentEditingId?: string | null) => {
    const norm = normalizeCarNo(vNo);
    if (!norm || norm.length < 3) return null;

    const existingEnq = enquiries.find(
      (e) => e.id !== currentEditingId && normalizeCarNo(e.vehicleNumber) === norm
    );
    if (existingEnq) {
      return {
        type: 'Enquiry' as const,
        enquiry: existingEnq,
        vehicleNumber: existingEnq.vehicleNumber || norm,
      };
    }

    const existingVeh = vehicles.find(
      (v) => normalizeCarNo(v.registrationNumber || (v as any).vehicleNumber) === norm
    );
    if (existingVeh) {
      return {
        type: 'MasterVehicle' as const,
        vehicle: existingVeh,
        vehicleNumber: existingVeh.registrationNumber || norm,
      };
    }

    return null;
  };

  const liveMatch = getExistingVehicleMatch(formState.vehicleNumber, editingId);

  const executeForceSave = () => {
    let nextStatus = formState.status || 'New';
    if (hasSitePref(formState) && (nextStatus === 'New' || nextStatus === 'Interested')) {
      nextStatus = 'Site Offered';
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const resolvedInductionCompany = formState.inductionCompany || formState.sitePreference1 || formState.alreadyRunningCompany || '';
    const resolvedInductionDate = formState.inductionDate || formState.enquiryDate || todayStr;

    if (editingId) {
      // Update existing
      const updated = enquiries.map((item) =>
        item.id === editingId
          ? {
              ...(formState as Enquiry),
              status: nextStatus,
              inductionCompany: nextStatus === 'Induction' ? (item.inductionCompany || resolvedInductionCompany) : item.inductionCompany,
              inductionDate: nextStatus === 'Induction' ? (item.inductionDate || resolvedInductionDate) : item.inductionDate,
            }
          : item
      );
      onUpdateEnquiries(updated);
    } else {
      // Add new enquiry - generate unique Enquiry ID
      const newId = generateUniqueEnquiryId(enquiries);
      
      const newEnq: Enquiry = {
        ...(formState as Enquiry),
        id: newId,
        enquiryDate: formState.enquiryDate || todayStr,
        status: nextStatus,
        inductionCompany: nextStatus === 'Induction' ? resolvedInductionCompany : formState.inductionCompany,
        inductionDate: nextStatus === 'Induction' ? resolvedInductionDate : formState.inductionDate,
      };
      onUpdateEnquiries([newEnq, ...enquiries]);
    }

    handleCloseForm();
    setDuplicateModalMatch(null);
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

    // Check if vehicle is already registered in Enquiry Desk or Master Fleet
    const duplicateMatch = getExistingVehicleMatch(formState.vehicleNumber, editingId);
    if (duplicateMatch) {
      setDuplicateModalMatch(duplicateMatch);
      return;
    }

    executeForceSave();
  };

  const handleDelete = (idOrEnq: string | Enquiry) => {
    if (typeof idOrEnq === 'string') {
      const target = enquiries.find((item) => item.id === idOrEnq);
      if (target) {
        setDeletingEnquiry(target);
      }
    } else {
      setDeletingEnquiry(idOrEnq);
    }
  };

  const confirmDelete = () => {
    if (!deletingEnquiry) return;

    if (onUpdateDeletedVehicles && deletedVehicles) {
      const vType = (deletingEnquiry.vehicleType && ['Sedan', 'SUV', 'Hatchback', 'Bus', 'Tempo Traveler'].includes(deletingEnquiry.vehicleType))
        ? (deletingEnquiry.vehicleType as 'Sedan' | 'SUV' | 'Hatchback' | 'Bus' | 'Tempo Traveler')
        : 'Sedan';
      
      const fType = (deletingEnquiry.fuelType && ['CNG', 'Diesel', 'Petrol', 'EV'].includes(deletingEnquiry.fuelType))
        ? (deletingEnquiry.fuelType as 'CNG' | 'Diesel' | 'Petrol' | 'EV')
        : 'Diesel';

      const mockVeh: Vehicle = {
        id: deletingEnquiry.id,
        registrationNumber: deletingEnquiry.vehicleNumber || 'N/A',
        model: deletingEnquiry.vehicleModelYear || '',
        manufacturer: 'Maruti',
        year: new Date().getFullYear(),
        fuelType: fType,
        transmission: 'Manual',
        vehicleType: vType,
        ownerId: '',
        ownerName: deletingEnquiry.ownerNamePhone || '',
        driverId: '',
        driverName: deletingEnquiry.driverName || '',
        company: deletingEnquiry.alreadyRunningCompany || '',
        site: deletingEnquiry.sitePreference1 || '',
        joiningDate: deletingEnquiry.enquiryDate || new Date().toISOString().substring(0, 10),
        status: 'Inactive',
        emiAmount: 0,
        emiDueDate: '',
        insuranceExpiry: '',
        permitExpiry: '',
        fcExpiry: '',
        pollutionExpiry: '',
        fastagNumber: '',
        remarks: deletingEnquiry.remarks || '',
        officeDocSubmitted: false,
      };

      const newDelRec: DeletedVehicle = {
        id: `DEL_ENQ_${deletingEnquiry.id}_${Date.now().toString().slice(-4)}`,
        originalVehicleId: deletingEnquiry.id,
        registrationNumber: deletingEnquiry.vehicleNumber || 'N/A',
        model: deletingEnquiry.vehicleModelYear || '',
        manufacturer: 'Maruti',
        year: new Date().getFullYear(),
        fuelType: fType,
        vehicleType: vType,
        ownerName: deletingEnquiry.ownerNamePhone || '',
        driverName: deletingEnquiry.driverName || '',
        company: deletingEnquiry.alreadyRunningCompany || '',
        site: deletingEnquiry.sitePreference1 || '',
        joiningDate: deletingEnquiry.enquiryDate || new Date().toISOString().substring(0, 10),
        deletedAt: new Date().toLocaleString('en-IN'),
        deletedBy: 'Enquiry Desk Supervisor',
        deletionReason: `Deleted from Enquiry Desk (${deletingEnquiry.status || 'Enquiry'})`,
        originalVehicle: mockVeh,
      };
      onUpdateDeletedVehicles([newDelRec, ...deletedVehicles]);
    }

    const updated = enquiries.filter((item) => item.id !== deletingEnquiry.id);
    onUpdateEnquiries(updated);
    setInfoNotification(`Enquiry ${deletingEnquiry.id} (${deletingEnquiry.vehicleNumber || 'Record'}) deleted successfully.`);
    setDeletingEnquiry(null);
  };

  // Start Induction dialog to select target company
  const handleStartInductionModal = (enq: Enquiry) => {
    setInductionModalEnquiry(enq);
    setInductionModalError(null);
    setInductionRemarksInput('');
    setInductionDateInput(new Date().toISOString().substring(0, 10));

    let initialCompany = '';
    let initialCustom = '';
    const pref1 = (enq.sitePreference1 || '').trim();
    const running = (enq.alreadyRunningCompany || '').trim();

    // Look up matching company in companies list
    const matched = companies.find(
      (c) =>
        (pref1 && c.name.toLowerCase() === pref1.toLowerCase()) ||
        (running && c.name.toLowerCase() === running.toLowerCase())
    );

    if (matched) {
      initialCompany = matched.name;
    } else if (companies.length > 0) {
      if (pref1 && pref1 !== 'Open Preference' && pref1 !== '-') {
        initialCompany = 'Other';
        initialCustom = pref1;
      } else {
        initialCompany = companies[0].name;
      }
    } else if (pref1 && pref1 !== 'Open Preference' && pref1 !== '-') {
      initialCompany = 'Other';
      initialCustom = pref1;
    }

    setInductionCompanyChoice(initialCompany);
    setCustomInductionCompany(initialCustom);
    setInductionSiteChoice(enq.sitePreference2 || '');
  };

  const handleMoveToInduction = (id: string) => {
    const enq = enquiries.find((e) => e.id === id);
    if (enq) {
      handleStartInductionModal(enq);
    }
  };

  const handleConfirmMoveToInduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inductionModalEnquiry) return;

    let targetCompany = '';
    if (inductionCompanyChoice === 'Other') {
      targetCompany = customInductionCompany.trim();
    } else {
      targetCompany = inductionCompanyChoice.trim();
    }

    if (!targetCompany) {
      setInductionModalError('Please select or enter the company going for induction.');
      return;
    }

    const enqId = inductionModalEnquiry.id;
    const vehicleNo = inductionModalEnquiry.vehicleNumber || enqId;

    const updated = enquiries.map((item) => {
      if (item.id === enqId) {
        return {
          ...item,
          status: 'Induction' as const,
          inductionCompany: targetCompany,
          sitePreference1: targetCompany, // Set primary site/company preference
          inductionDate: inductionDateInput || new Date().toISOString().substring(0, 10),
          inductionCompleted: false,
          remarks: inductionRemarksInput.trim()
            ? (item.remarks ? item.remarks + '\n' : '') + `[INDUCTION] Assigned to company: ${targetCompany}. Note: ${inductionRemarksInput.trim()}`
            : item.remarks,
        };
      }
      return item;
    });

    onUpdateEnquiries(updated);

    const label = `${vehicleNo} (${inductionModalEnquiry.driverName || 'Driver'})`;
    setInfoNotification(`Successfully assigned "${label}" to company "${targetCompany}" and moved to Vehicle Induction!`);

    setInductionModalEnquiry(null);

    // Automatically navigate to Induction Page
    onNavigate?.('Induction');
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
    else if (tLower.includes('tempo') || tLower.includes('traveler') || tLower.includes('traveller')) normalizedType = 'Tempo Traveler';

    // Model & Year parsing
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
      company: enq.alreadyRunningCompany || (companies.length > 0 ? companies[0].name : ''),
      site: enq.sitePreference1 && enq.sitePreference1 !== 'Open Preference' ? enq.sitePreference1 : (sites.length > 0 ? sites[0].name : ''),
      ownerId: matchedOwner ? matchedOwner.id : 'new',
      ownerName: ownerName || (matchedOwner ? matchedOwner.name : ''),
      ownerPhone: ownerPhone || (matchedOwner ? matchedOwner.phone : ''),
      driverId: matchedDriver ? matchedDriver.id : 'new',
      driverName: driverName || (matchedDriver ? matchedDriver.name : ''),
      driverPhone: driverPhone || (matchedDriver ? matchedDriver.phone : ''),
      driverDl: enq.driverDlNumber || '',
      driverDlExp: enq.driverDlExpiry || '',
      driverAadhaar: enq.driverAadhaar || '',
      driverAddress: enq.driverAddress || '',
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
        remarks: 'Promoted from Enquiry ' + (promotingEnquiry?.id || ''),
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
              remarks: (v.remarks ? v.remarks + '\n' : '') + `Updated from Enquiry ${promotingEnquiry?.id || ''}`,
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
        joiningDate: new Date().toISOString().substring(0, 10),
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
        remarks: 'Promoted from Enquiry ' + (promotingEnquiry?.id || ''),
      };

      onUpdateVehicles([...vehicles, newVehicle]);
    }

    // Update enquiry status to 'Closed' and add confirmation log in remarks
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
            remarks: (e.remarks ? e.remarks + '\n' : '') + `[SYSTEM] Vehicle selected & promoted to Master Registers on ${new Date().toLocaleDateString()}`,
          };
        }
        return e;
      });
      onUpdateEnquiries(updatedEnquiries);
    }

    setPromoteSuccess('Successfully promoted and added records into Master Registers!');
    setTimeout(() => {
      setPromotingEnquiry(null);
      setPromoteSuccess(null);
    }, 1500);
  };

  // Filter out any enquiries that have been moved to the Master Register (present in vehicles list)
  const masterVehicleNumbers = new Set(
    (vehicles || []).map((v) => (v.registrationNumber || '').replace(/\s+/g, '').toUpperCase())
  );

  const visibleEnquiries = enquiries.filter((item) => {
    const regNum = (item.vehicleNumber || '').replace(/\s+/g, '').toUpperCase();
    if (regNum && masterVehicleNumbers.has(regNum)) {
      return false; // Exclude
    }
    return true; // Keep
  });

  // Duplicate Vehicle Groups in Enquiry Register
  const duplicateEnquiryVehicleGroups = useMemo(() => {
    const groups = new Map<string, Enquiry[]>();
    visibleEnquiries.forEach((e) => {
      const norm = normalizeCarNo(e.vehicleNumber);
      if (!norm) return;
      if (!groups.has(norm)) groups.set(norm, []);
      groups.get(norm)!.push(e);
    });
    const dupes = new Map<string, Enquiry[]>();
    groups.forEach((list, norm) => {
      if (list.length > 1) {
        dupes.set(norm, list);
      }
    });
    return dupes;
  }, [visibleEnquiries]);

  // Excel & PDF Exports
  const handleExportExcel = () => {
    const headers = [
      'Enquiry ID',
      'Enquiry Date',
      'Vehicle Number',
      'Vehicle Type',
      'Fuel Type',
      'Model Year',
      'Color',
      'Owner Name',
      'Owner Mobile',
      'Driver Name',
      'Driver Phone',
      'Driver Area',
      'Running Company',
      'Site Preference 1',
      'Status',
      'Reference',
      'Remarks',
    ];

    const rows = sortedAndFiltered.map((e) => [
      e.id,
      formatDate(e.enquiryDate),
      e.vehicleNumber || '',
      e.vehicleType || '',
      e.fuelType || '',
      e.vehicleModelYear || '',
      e.vehicleColor || '',
      getOwnerNameOnly(e),
      getOwnerPhone(e),
      e.driverName || '',
      e.driverPhone || '',
      e.driverArea || '',
      e.alreadyRunningCompany || '',
      e.sitePreference1 || '',
      getEffectiveStatus(e),
      e.reference || '',
      e.remarks || '',
    ]);

    exportToExcel('E7_Travels_Enquiries', 'Enquiry Desk', headers, rows);
  };

  const handleExportPDF = () => {
    const headers = [
      'Enquiry ID',
      'Date',
      'Vehicle No',
      'Type / Fuel',
      'Owner Name & Phone',
      'Driver Name & Phone',
      'Area',
      'Site Pref 1',
      'Status',
      'Reference',
    ];

    const rows = sortedAndFiltered.map((e) => [
      e.id,
      formatDate(e.enquiryDate),
      e.vehicleNumber || '',
      `${e.vehicleType || 'Sedan'} (${e.fuelType || 'Diesel'})`,
      `${getOwnerNameOnly(e)} ${getOwnerPhone(e) ? `\nPh: ${getOwnerPhone(e)}` : ''}`,
      `${e.driverName || ''} ${e.driverPhone ? `\nPh: ${e.driverPhone}` : ''}`,
      e.driverArea || '-',
      e.sitePreference1 || 'Open',
      getEffectiveStatus(e),
      e.reference || '-',
    ]);

    exportToPDF('E7_Travels_Enquiries', 'E7 Travels - Telephone Enquiry Register', headers, rows, 'landscape');
  };

  // Filter & Search Logic
  const filtered = visibleEnquiries.filter((item) => {
    const matchesSearch =
      (item.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehicleType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehicleModelYear || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehicleColor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ownerNamePhone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.ownerMobile || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.driverName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.driverPhone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.driverArea || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.alreadyRunningCompany || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.fuelType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sitePreference1 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sitePreference2 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sitePreference3 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sitePreference4 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.remarks || '').toLowerCase().includes(searchQuery.toLowerCase());

    const effStatus = getEffectiveStatus(item);
    let matchesStatus = statusFilter === 'all' || effStatus === statusFilter;
    if (statusFilter === 'duplicates') {
      const norm = normalizeCarNo(item.vehicleNumber);
      matchesStatus = duplicateEnquiryVehicleGroups.has(norm);
    }

    const hasReference = !!(item.reference && item.reference.trim() !== '' && item.reference.trim() !== '-');
    if (referenceOnlyFilter && !hasReference) return false;

    return matchesSearch && matchesStatus;
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    let valA = a[sortBy] || '';
    let valB = b[sortBy] || '';

    // Simple alphanumeric sort
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    }
    return 0;
  });

  // KPI Calculations
  const totalCount = visibleEnquiries.length;
  const newCount = visibleEnquiries.filter((e) => getEffectiveStatus(e) === 'New').length;
  const interestedCount = visibleEnquiries.filter((e) => getEffectiveStatus(e) === 'Interested').length;
  const siteOfferedCount = visibleEnquiries.filter((e) => getEffectiveStatus(e) === 'Site Offered').length;
  const inductionCount = visibleEnquiries.filter((e) => getEffectiveStatus(e) === 'Induction').length;
  const closedCount = visibleEnquiries.filter((e) => getEffectiveStatus(e) === 'Closed').length;
  const referencedCount = visibleEnquiries.filter((e) => e.reference && e.reference.trim() !== '' && e.reference.trim() !== '-').length;

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
        <div className="flex flex-wrap gap-2.5 self-start md:self-auto">
          <button
            id="btn-export-excel-enquiry"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-3xs cursor-pointer"
            title="Export Enquiry records to Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
          </button>
          <button
            id="btn-export-pdf-enquiry"
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-3xs cursor-pointer"
            title="Export Enquiry records to PDF document"
          >
            <FileText className="h-4 w-4 text-rose-600" /> Export PDF
          </button>
          <button
            id="btn-print-enquiries"
            onClick={() => setIsPrintingReport(true)}
            className="px-4 py-2.5 bg-white border border-slate-300 text-slate-750 rounded-lg hover:bg-slate-50 font-bold text-xs transition-all flex items-center gap-2 shadow-3xs cursor-pointer"
            title="Print and filter call lead reports"
          >
            <Printer className="h-4 w-4 text-slate-500" /> Print Report / List
          </button>
          <button
            id="btn-add-enquiry-top"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Call / Enquiry
          </button>
        </div>
      </div>

      {/* Duplicate Vehicles Warning Banner */}
      {duplicateEnquiryVehicleGroups.size > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 mt-0.5 sm:mt-0 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                Duplicate Vehicle Registration Numbers Detected
                <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-2xs font-extrabold rounded-full">
                  {duplicateEnquiryVehicleGroups.size} Duplicate Car Number{duplicateEnquiryVehicleGroups.size === 1 ? '' : 's'}
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                The following vehicle plate numbers have multiple telephone enquiry records:
                <span className="font-mono text-xs font-bold text-rose-900 ml-1">
                  {Array.from(duplicateEnquiryVehicleGroups.keys()).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              id="btn-filter-enq-duplicates"
              onClick={() => setStatusFilter('duplicates')}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              View Duplicates ({Array.from(duplicateEnquiryVehicleGroups.values()).reduce((acc: number, l: Enquiry[]) => acc + l.length, 0)})
            </button>
            <button
              id="btn-merge-duplicate-modal-open"
              onClick={() => {
                const firstNorm = (Array.from(duplicateEnquiryVehicleGroups.keys()) as string[])[0];
                if (firstNorm) handleOpenMergeModal(firstNorm);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Merge Modal to compare and combine duplicate vehicle enquiries"
            >
              <GitMerge className="h-4 w-4" /> Merge Duplicate Vehicles
            </button>
            <button
              id="btn-merge-all-duplicates-batch"
              onClick={handleMergeAllDuplicatesBatch}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Auto-merge all duplicate enquiry records across detected vehicles"
            >
              <CheckCircle2 className="h-4 w-4" /> Merge All
            </button>
          </div>
        </div>
      )}

      {infoNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-xl p-4 flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-emerald-900">{infoNotification}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">The enquiry details are now accessible on the Vehicle Induction Page.</p>
            </div>
          </div>
          <button 
            onClick={() => setInfoNotification(null)}
            className="p-1 hover:bg-emerald-100/50 rounded-lg text-emerald-500 hover:text-emerald-700 transition-all cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          id="kpi-card-total-calls"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-indigo-400 ${
            statusFilter === 'all' && !referenceOnlyFilter ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Calls</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{totalCount}</p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <PhoneCall className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-new-leads"
          onClick={() => setStatusFilter('New')}
          className={`p-3.5 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-amber-400 ${
            statusFilter === 'New' && !referenceOnlyFilter ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">New Leads</p>
            <p className="text-lg font-bold text-amber-600 mt-0.5">{newCount}</p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Tag className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-interested"
          onClick={() => setStatusFilter('Interested')}
          className={`p-3.5 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-blue-400 ${
            statusFilter === 'Interested' && !referenceOnlyFilter ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Interested</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{interestedCount}</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <User className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-site-offered"
          onClick={() => setStatusFilter('Site Offered')}
          className={`p-3.5 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-emerald-400 ${
            statusFilter === 'Site Offered' && !referenceOnlyFilter ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Site Offered</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{siteOfferedCount}</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Building className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-induction"
          onClick={() => setStatusFilter('Induction')}
          className={`p-3.5 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-indigo-400 ${
            statusFilter === 'Induction' && !referenceOnlyFilter ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Induction</p>
            <p className="text-lg font-bold text-indigo-600 mt-0.5">{inductionCount}</p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-closed"
          onClick={() => setStatusFilter('Closed')}
          className={`p-3.5 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-slate-400 ${
            statusFilter === 'Closed' && !referenceOnlyFilter ? 'ring-2 ring-slate-500 border-slate-500 bg-slate-50' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Closed</p>
            <p className="text-lg font-bold text-slate-500 mt-0.5">{closedCount}</p>
          </div>
          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
            <CheckCircle className="h-4 w-4" />
          </div>
        </button>

        <button
          id="kpi-card-referenced"
          onClick={() => setReferenceOnlyFilter(!referenceOnlyFilter)}
          className={`p-3.5 bg-white rounded-xl border flex items-center justify-between shadow-3xs transition-all cursor-pointer text-left focus:outline-none hover:shadow-xs hover:border-purple-400 ${
            referenceOnlyFilter ? 'ring-2 ring-purple-600 border-purple-600 bg-purple-50/40' : 'border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-1">
              <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Referenced</p>
              {referenceOnlyFilter && (
                <span className="px-1.5 py-0.2 bg-purple-600 text-white text-[8px] font-black rounded-full uppercase">ON</span>
              )}
            </div>
            <p className="text-lg font-bold text-purple-700 mt-0.5">{referencedCount}</p>
          </div>
          <div className={`p-2 rounded-lg ${referenceOnlyFilter ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600'}`}>
            <BookmarkCheck className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* Search and Sort Controls Block placed BELOW Enquiry Desk KPI Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-80">
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

          {/* Reference Enable Button */}
          <button
            id="btn-toggle-reference-key"
            onClick={() => setReferenceOnlyFilter(!referenceOnlyFilter)}
            className={`w-full sm:w-auto px-3.5 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-3xs shrink-0 ${
              referenceOnlyFilter
                ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-300 shadow-xs'
                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
            }`}
            title="Enable Reference Key to filter and display referenced vehicle details"
          >
            <BookmarkCheck className={`h-4 w-4 ${referenceOnlyFilter ? 'text-white' : 'text-purple-600'}`} />
            <span>{referenceOnlyFilter ? 'Referenced Vehicles ONLY (ON)' : 'Show Referenced Vehicles'}</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${referenceOnlyFilter ? 'bg-white text-purple-800' : 'bg-purple-200 text-purple-800'}`}>
              {referencedCount}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
          {/* Sort Options */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-3xs hover:border-slate-300 transition-all shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sort By:</span>
            <select
              id="enq-sort-by"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="text-3xs font-black uppercase tracking-wider text-slate-700 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="enquiryDate-desc">Date (Latest First)</option>
              <option value="enquiryDate-asc">Date (Oldest First)</option>
              <option value="id-desc">Enquiry ID (Newest)</option>
              <option value="id-asc">Enquiry ID (Oldest)</option>
              <option value="vehicleNumber-asc">Vehicle No (A-Z)</option>
              <option value="vehicleNumber-desc">Vehicle No (Z-A)</option>
              <option value="driverName-asc">Driver Name (A-Z)</option>
              <option value="driverName-desc">Driver Name (Z-A)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
            </select>
          </div>

          {/* Column Toggle Visibility Popover Dropdown */}
          <div className="relative">
            <button
              id="btn-column-visibility-toggle"
              type="button"
              onClick={() => setShowColumnToggleMenu(!showColumnToggleMenu)}
              className={`px-3 py-1.5 text-3xs font-black uppercase tracking-wider rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                !columnVisibility.referenceTag
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="Toggle Column Visibility"
            >
              <Eye className="h-3.5 w-3.5 text-indigo-600" />
              <span>Column Toggle Visibility</span>
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[9px] rounded-full font-black">
                {Object.values(columnVisibility).filter(Boolean).length}
              </span>
            </button>

            {showColumnToggleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-indigo-600" />
                    Column Toggle Visibility
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowColumnToggleMenu(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {[
                    { key: 'id', label: 'Enquiry ID' },
                    { key: 'vehicleDetails', label: 'Vehicle Specs & Number' },
                    { key: 'ownerDetails', label: 'Owner Details' },
                    { key: 'referenceTag', label: '★ Reference Tag (REFERENCE)' },
                    { key: 'driverDetails', label: 'Driver Details' },
                    { key: 'runningCompany', label: 'Already Running Company' },
                    { key: 'sitePref1', label: 'Site Preference 1' },
                    { key: 'sitePref2', label: 'Site Preference 2' },
                    { key: 'status', label: 'Status' },
                  ].map((col) => (
                    <label
                      key={col.key}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer select-none text-xs font-bold transition-colors ${
                        col.key === 'referenceTag'
                          ? 'bg-purple-50/80 hover:bg-purple-100/80 text-purple-900 border border-purple-200/60'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(columnVisibility as any)[col.key]}
                          onChange={() =>
                            setColumnVisibility({
                              ...columnVisibility,
                              [col.key]: !(columnVisibility as any)[col.key],
                            })
                          }
                          className="h-3.5 w-3.5 rounded text-purple-600 border-slate-300 focus:ring-0 cursor-pointer"
                        />
                        <span className={col.key === 'referenceTag' ? 'font-black text-purple-900' : ''}>
                          {col.label}
                        </span>
                      </div>
                      {(columnVisibility as any)[col.key] && (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded uppercase">
                          ON
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <button
                    type="button"
                    onClick={() =>
                      setColumnVisibility({
                        id: true,
                        vehicleDetails: true,
                        ownerDetails: true,
                        referenceTag: true,
                        driverDetails: true,
                        runningCompany: true,
                        sitePref1: true,
                        sitePref2: true,
                        status: true,
                      })
                    }
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Reset All ON
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowColumnToggleMenu(false)}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-md font-bold cursor-pointer hover:bg-indigo-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {referenceOnlyFilter && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-xl p-3.5 px-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <BookmarkCheck className="h-4 w-4 text-purple-700" />
            </span>
            <span>
              Reference Key Active: Displaying <strong>{sortedAndFiltered.length}</strong> referenced vehicle records on Enquiry Desk.
            </span>
          </div>
          <button
            onClick={() => setReferenceOnlyFilter(false)}
            className="px-3 py-1 bg-white text-purple-700 border border-purple-200 rounded-lg text-2xs font-extrabold hover:bg-purple-100 cursor-pointer transition-all shadow-3xs"
          >
            Show All Vehicles
          </button>
        </div>
      )}

      {/* Adding & Editing Form Panel */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div ref={formRef} className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? `Modify Enquiry Record: ${editingId}` : 'Log New Telephone Enquiry Spec Sheet'}
                </h3>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {formError && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs border border-rose-200 rounded-lg flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
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
                    className={`w-full px-3 py-2 text-xs border rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono font-bold ${
                      liveMatch ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  />
                  {liveMatch && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-2xs text-amber-900 flex items-start justify-between gap-2 shadow-2xs animate-fade-in">
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black uppercase tracking-wide block text-amber-800 text-[10px]">
                            Vehicle Already Registered!
                          </span>
                          <p className="mt-0.5 font-medium text-slate-700 leading-tight">
                            Tracked under <strong className="font-mono text-slate-900 font-bold">{liveMatch.type === 'Enquiry' ? liveMatch.enquiry?.id : liveMatch.vehicle?.id}</strong> ({liveMatch.type === 'Enquiry' ? liveMatch.enquiry?.driverName : liveMatch.vehicle?.driverName || 'N/A'}).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDuplicateModalMatch(liveMatch)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-black uppercase shrink-0 transition-all cursor-pointer shadow-2xs"
                      >
                        Track Data
                      </button>
                    </div>
                  )}
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
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Name *</label>
                  <input
                    id="enq-form-ownerName"
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={formState.ownerName || (formState.ownerNamePhone ? formState.ownerNamePhone.split(/[-–—/]/)[0]?.trim() : '')}
                    onChange={(e) => {
                      const name = e.target.value;
                      const phone = formState.ownerMobile || (formState.ownerNamePhone && formState.ownerNamePhone.split(/[-–—/]/)[1] ? formState.ownerNamePhone.split(/[-–—/]/)[1].trim() : '');
                      const combined = phone ? `${name} - ${phone}` : name;
                      setFormState({ ...formState, ownerName: name, ownerNamePhone: combined });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Phone / Mobile *</label>
                  <input
                    id="enq-form-ownerMobile"
                    type="text"
                    required
                    placeholder="e.g. 9841234560"
                    value={formState.ownerMobile || (formState.ownerNamePhone && formState.ownerNamePhone.split(/[-–—/]/)[1] ? formState.ownerNamePhone.split(/[-–—/]/)[1].trim() : '')}
                    onChange={(e) => {
                      const phone = e.target.value;
                      const name = formState.ownerName || (formState.ownerNamePhone ? formState.ownerNamePhone.split(/[-–—/]/)[0]?.trim() : '');
                      const combined = phone ? `${name} - ${phone}` : name;
                      setFormState({ ...formState, ownerMobile: phone, ownerNamePhone: combined });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
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

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fuel Type (Scroll & Select)</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 snap-x snap-mandatory max-w-full" style={{ scrollBehavior: 'smooth' }}>
                    {['CNG', 'PETROL', 'DIESEL', 'EV'].map((fuel) => {
                      const isSelected = (formState.fuelType || '').toUpperCase() === fuel;
                      return (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => setFormState({ ...formState, fuelType: fuel })}
                          className={`snap-start px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 border-amber-600 text-white shadow-xs scale-[1.02]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {fuel}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    id="enq-form-fuelType"
                    type="hidden"
                    value={formState.fuelType || ''}
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">RC Expiry Date</label>
                  <input
                    id="enq-form-rcExpiry"
                    type="date"
                    value={formState.rcExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, rcExpiry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Insurance Expiry Date</label>
                  <input
                    id="enq-form-insuranceExpiry"
                    type="date"
                    value={formState.insuranceExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, insuranceExpiry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Permit Type / Expiry</label>
                  <input
                    id="enq-form-permitExpiry"
                    type="text"
                    placeholder="e.g. All India Permit (2028-10-15)"
                    value={formState.permitExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, permitExpiry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fitness Cert Expiry</label>
                  <input
                    id="enq-form-fcExpiry"
                    type="date"
                    value={formState.fcExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, fcExpiry: e.target.value })}
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

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Alt. Mobile No</label>
                  <input
                    id="enq-form-driverAltPhone"
                    type="text"
                    placeholder="e.g. 9840112233"
                    value={formState.driverAltPhone || ''}
                    onChange={(e) => setFormState({ ...formState, driverAltPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Email ID</label>
                  <input
                    id="enq-form-driverEmail"
                    type="email"
                    placeholder="e.g. driver@e7travels.com"
                    value={formState.driverEmail || ''}
                    onChange={(e) => setFormState({ ...formState, driverEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Aadhaar Number</label>
                  <input
                    id="enq-form-driverAadhaar"
                    type="text"
                    placeholder="e.g. 1234 5678 9012"
                    value={formState.driverAadhaar || ''}
                    onChange={(e) => setFormState({ ...formState, driverAadhaar: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">DL Number</label>
                  <input
                    id="enq-form-driverDlNumber"
                    type="text"
                    placeholder="e.g. TN072015000213"
                    value={formState.driverDlNumber || ''}
                    onChange={(e) => setFormState({ ...formState, driverDlNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">DL Validity Date</label>
                  <input
                    id="enq-form-driverDlExpiry"
                    type="date"
                    value={formState.driverDlExpiry || ''}
                    onChange={(e) => setFormState({ ...formState, driverDlExpiry: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Permanent Address</label>
                  <input
                    id="enq-form-driverAddress"
                    type="text"
                    placeholder="e.g. No. 12, Main Street, Adyar, Chennai - 600020"
                    value={formState.driverAddress || ''}
                    onChange={(e) => setFormState({ ...formState, driverAddress: e.target.value })}
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
                    {renderSitePrefOptions(formState.sitePreference1 || '')}
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Site Preference 2 (Backup 1)</label>
                  <select
                    id="enq-form-sitePref2"
                    value={formState.sitePreference2 || ''}
                    onChange={(e) => setFormState({ ...formState, sitePreference2: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    {renderSitePrefOptions(formState.sitePreference2 || '')}
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Site Preference 3 (Backup 2)</label>
                  <select
                    id="enq-form-sitePref3"
                    value={formState.sitePreference3 || ''}
                    onChange={(e) => setFormState({ ...formState, sitePreference3: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {renderSitePrefOptions(formState.sitePreference3 || '')}
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Site Preference 4 (Backup 3)</label>
                  <select
                    id="enq-form-sitePref4"
                    value={formState.sitePreference4 || ''}
                    onChange={(e) => setFormState({ ...formState, sitePreference4: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {renderSitePrefOptions(formState.sitePreference4 || '')}
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Induction Type</label>
                  <select
                    id="enq-form-inductionType"
                    value={formState.inductionType || 'OwnerAttach'}
                    onChange={(e) => setFormState({ ...formState, inductionType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="OwnerAttach">Owner Attach (Single/Multi)</option>
                    <option value="CoAttached">Co-Attached</option>
                    <option value="SubContract">Sub-Contract</option>
                    <option value="Adhoc">Adhoc Spot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner ID (If registered)</label>
                  <input
                    id="enq-form-ownerId"
                    type="text"
                    placeholder="e.g. OWN-021"
                    value={formState.ownerId || ''}
                    onChange={(e) => setFormState({ ...formState, ownerId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Legal Name</label>
                  <input
                    id="enq-form-ownerName"
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={formState.ownerName || ''}
                    onChange={(e) => setFormState({ ...formState, ownerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Mobile No</label>
                  <input
                    id="enq-form-ownerMobile"
                    type="text"
                    placeholder="e.g. 9841234560"
                    value={formState.ownerMobile || ''}
                    onChange={(e) => setFormState({ ...formState, ownerMobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
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
                    <option value="Induction">Induction</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. GPS & BANK ACCOUNT DETAILS */}
            <div className="space-y-4 pt-2">
              <h4 className="text-2xs font-extrabold text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-1.5">
                GPS & Bank Account Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">GPS Device Vendor</label>
                  <input
                    id="enq-form-gpsVendor"
                    type="text"
                    placeholder="e.g. AssetTrack / MapmyIndia"
                    value={formState.gpsVendor || ''}
                    onChange={(e) => setFormState({ ...formState, gpsVendor: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">GPS IMEI Number</label>
                  <input
                    id="enq-form-gpsImei"
                    type="text"
                    placeholder="e.g. 863452048892110"
                    value={formState.gpsImei || ''}
                    onChange={(e) => setFormState({ ...formState, gpsImei: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
                  <input
                    id="enq-form-bankName"
                    type="text"
                    placeholder="e.g. HDFC Bank Ltd"
                    value={formState.bankName || ''}
                    onChange={(e) => setFormState({ ...formState, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Account Holder Name</label>
                  <input
                    id="enq-form-bankAccountHolder"
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={formState.bankAccountHolder || ''}
                    onChange={(e) => setFormState({ ...formState, bankAccountHolder: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                  <input
                    id="enq-form-bankAccountNumber"
                    type="text"
                    placeholder="e.g. 50100234129988"
                    value={formState.bankAccountNumber || ''}
                    onChange={(e) => setFormState({ ...formState, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">IFSC Code</label>
                  <input
                    id="enq-form-bankIfsc"
                    type="text"
                    placeholder="e.g. HDFC0000120"
                    value={formState.bankIfsc || ''}
                    onChange={(e) => setFormState({ ...formState, bankIfsc: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. DATE AND REMARKS */}
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
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                {formState.vehicleNumber && (
                  <button
                    id="enq-form-btn-copy-msg"
                    type="button"
                    onClick={() => {
                      const msgText = generateEnquiryMessageFormat(formState);
                      navigator.clipboard.writeText(msgText);
                      setInfoNotification("Enquiry message format copied to clipboard!");
                      setTimeout(() => setInfoNotification(null), 4000);
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Share2 className="h-3.5 w-3.5 text-emerald-600" /> Copy Message Format
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  id="enq-form-btn-cancel"
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="enq-form-btn-save"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  {editingId ? 'Update Log' : 'Save Enquiry Log'}
                </button>
              </div>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet List Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden">
        
        {/* Scroll Control Panel */}
        <div className="px-5 py-3 bg-slate-100/50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jump to Section:</span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => scrollToSection('id')}
                className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-3xs font-extrabold text-slate-600 uppercase transition-all cursor-pointer"
              >
                🔢 Enquiry ID
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('vehicle')}
                className="px-2 py-1 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-md text-3xs font-extrabold text-amber-800 uppercase transition-all cursor-pointer"
              >
                🚗 Vehicle Details
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('driver')}
                className="px-2 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300 rounded-md text-3xs font-extrabold text-emerald-800 uppercase transition-all cursor-pointer"
              >
                💂 Driver Details
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('company')}
                className="px-2 py-1 bg-white hover:bg-orange-50 border border-orange-200 hover:border-orange-300 rounded-md text-3xs font-extrabold text-orange-800 uppercase transition-all cursor-pointer"
              >
                🏢 Company & Preferences
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('status')}
                className="px-2 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 rounded-md text-3xs font-extrabold text-indigo-800 uppercase transition-all cursor-pointer"
              >
                ⚙️ Status & Actions
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manual Scroll:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => scrollTable('left')}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollTable('right')}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Outer container for scrollable spreadsheet table */}
        <div 
          ref={tableContainerRef}
          className="overflow-auto max-h-[600px] scrollbar-visible"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{ cursor: isDragging ? 'grabbing' : 'default', userSelect: isDragging ? 'none' : 'text' }}
        >
          {sortedAndFiltered.length === 0 ? (
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
                <tr className="border-b border-slate-200 font-extrabold uppercase tracking-wider text-3xs h-[32px]">
                  {/* ENQ001 Header Column */}
                  {columnVisibility.id && (
                    <th rowSpan={2} className="sticky top-0 z-20 py-3 px-3 text-center align-middle bg-purple-100 text-purple-900 border-r border-b border-purple-200 font-black font-mono w-[110px]">
                      ENQUIRY ID
                    </th>
                  )}

                  {/* VEHICLE DETAILS Group Header */}
                  {((columnVisibility.vehicleDetails ? 5 : 0) + (columnVisibility.ownerDetails ? 2 : 0) + (columnVisibility.referenceTag ? 1 : 0)) > 0 && (
                    <th
                      colSpan={(columnVisibility.vehicleDetails ? 5 : 0) + (columnVisibility.ownerDetails ? 2 : 0) + (columnVisibility.referenceTag ? 1 : 0)}
                      className="sticky top-0 z-20 py-1.5 px-4 text-center bg-amber-100 text-amber-950 border-r border-b border-amber-200 font-black text-2xs uppercase tracking-widest h-[32px]"
                    >
                      VEHICLE & OWNER DETAILS
                    </th>
                  )}

                  {/* DRIVER DETAILS Group Header */}
                  {columnVisibility.driverDetails && (
                    <th colSpan={5} className="sticky top-0 z-20 py-1.5 px-4 text-center bg-emerald-100 text-emerald-950 border-r border-b border-emerald-200 font-black text-2xs uppercase tracking-widest h-[32px]">
                      DRIVER DETAILS
                    </th>
                  )}

                  {/* ALREADY RUNNING COMPANY */}
                  {columnVisibility.runningCompany && (
                    <th rowSpan={2} className="sticky top-0 z-20 py-3 px-3 text-center align-middle bg-orange-100 text-orange-950 border-r border-b border-orange-200 font-black leading-tight w-[160px]">
                      ALREADY RUNNING COMPANY
                    </th>
                  )}

                  {/* SITE PREFERENCE 1 */}
                  {columnVisibility.sitePref1 && (
                    <th rowSpan={2} className="sticky top-0 z-20 py-3 px-3 text-center align-middle bg-amber-50 text-amber-950 border-r border-b border-amber-200 font-black leading-tight w-[150px]">
                      SITE PREFERENCE 1
                    </th>
                  )}

                  {/* SITE PREFERENCE 2 */}
                  {columnVisibility.sitePref2 && (
                    <th rowSpan={2} className="sticky top-0 z-20 py-3 px-3 text-center align-middle bg-rose-100 text-rose-950 border-r border-b border-rose-200 font-black leading-tight w-[150px]">
                      SITE PREFERENCE 2
                    </th>
                  )}

                  {/* STATUS & ACTIONS */}
                  {columnVisibility.status && (
                    <th rowSpan={2} className="sticky top-0 z-20 py-3 px-4 text-center align-middle bg-slate-100 text-slate-700 border-r border-b border-slate-200 font-extrabold w-[110px]">
                      STATUS
                    </th>
                  )}
                  <th rowSpan={2} className="sticky top-0 z-20 py-3 px-4 text-center align-middle bg-slate-100 text-slate-700 border-b border-slate-200 font-extrabold w-[100px]">
                    ACTIONS
                  </th>
                </tr>

                {/* SECONDARY DETAILED SUB-HEADERS */}
                <tr className="bg-slate-50 border-b border-slate-200 font-black text-4xs uppercase tracking-wider text-slate-500">
                  {/* Vehicle Sub-columns */}
                  {columnVisibility.vehicleDetails && (
                    <>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-amber-50">NUMBER</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-amber-50">TYPE</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-amber-50">FUEL TYPE</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-amber-50">MODEL/YEAR</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-amber-50">COLOR</th>
                    </>
                  )}
                  {columnVisibility.ownerDetails && (
                    <>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-amber-50">OWNER NAME</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-amber-50">OWNER PHONE</th>
                    </>
                  )}
                  {columnVisibility.referenceTag && (
                    <th className={`sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 transition-colors ${
                      referenceOnlyFilter ? 'bg-purple-200 text-purple-950 font-black' : 'bg-amber-50 text-slate-700'
                    }`}>
                      REFERENCE {referenceOnlyFilter && '★'}
                    </th>
                  )}

                  {/* Driver Sub-columns */}
                  {columnVisibility.driverDetails && (
                    <>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-emerald-50">NAME</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-emerald-50">AGE</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-emerald-50">PHONE NO</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-emerald-50">AREA</th>
                      <th className="sticky top-[32px] z-20 py-2 px-3 border-r border-slate-200 bg-emerald-50">BATCH EXP</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedAndFiltered.map((enq) => {
                  const displayStatus = getEffectiveStatus(enq);
                  let badgeColor = 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-3xs';
                  if (displayStatus === 'New') badgeColor = 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-3xs';
                  if (displayStatus === 'Interested') badgeColor = 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold shadow-3xs';
                  if (displayStatus === 'Site Offered') badgeColor = 'bg-teal-100 text-teal-900 border-teal-300 font-extrabold shadow-3xs';
                  if (displayStatus === 'Induction') badgeColor = 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold shadow-3xs';
                  if (displayStatus === 'Closed') badgeColor = 'bg-slate-200 text-slate-800 border-slate-300 font-extrabold shadow-3xs';

                  return (
                    <tr
                      id={`enq-row-${enq.id}`}
                      key={enq.id}
                      className="hover:bg-slate-50/60 transition-colors align-middle text-2xs"
                    >
                      {/* ID (Purple background theme column) */}
                      {columnVisibility.id && (
                        <td className="py-3 px-3 font-mono text-center border-r border-purple-100/50 bg-purple-50/20 text-purple-800 whitespace-nowrap">
                          <div className="font-black text-xs">{enq.id}</div>
                        </td>
                      )}

                      {/* Vehicle Sub-columns */}
                      {columnVisibility.vehicleDetails && (
                        <>
                          <td className="py-3 px-3 border-r border-slate-100 font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span>{enq.vehicleNumber}</span>
                              {duplicateEnquiryVehicleGroups.has(normalizeCarNo(enq.vehicleNumber)) && (
                                <button
                                  type="button"
                                  onClick={() => setDuplicateModalMatch(getExistingVehicleMatch(enq.vehicleNumber, enq.id))}
                                  className="px-1.5 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 text-[10px] font-extrabold rounded uppercase tracking-wider cursor-pointer shadow-2xs shrink-0"
                                  title="Click to view duplicate vehicle details"
                                >
                                  Duplicate
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100">
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-100">
                              {enq.vehicleType}
                            </span>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider inline-flex items-center gap-1.5 shadow-3xs ${
                                (enq.fuelType || '').toUpperCase() === 'CNG'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : (enq.fuelType || '').toUpperCase() === 'PETROL'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : (enq.fuelType || '').toUpperCase() === 'EV'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {(enq.fuelType || '').toUpperCase() === 'EV' && <span className="text-[11px] leading-none">⚡</span>}
                              {(enq.fuelType || '').toUpperCase() === 'CNG' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>}
                              {(enq.fuelType || '').toUpperCase() === 'PETROL' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>}
                              {((enq.fuelType || '').toUpperCase() === 'DIESEL' || (!['CNG', 'PETROL', 'EV'].includes((enq.fuelType || '').toUpperCase()))) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>}
                              {enq.fuelType || 'Diesel'}
                            </span>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100 text-slate-600">
                            {enq.vehicleModelYear || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100 text-slate-600">
                            {enq.vehicleColor || <span className="text-slate-300">-</span>}
                          </td>
                        </>
                      )}

                      {/* Owner Sub-columns */}
                      {columnVisibility.ownerDetails && (
                        <>
                          <td className="py-3 px-3 border-r border-slate-100 font-bold text-slate-800">
                            {getOwnerNameOnly(enq)}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-100 font-mono text-indigo-700 font-bold">
                            {getOwnerPhone(enq) || <span className="text-slate-300 font-sans font-normal">-</span>}
                          </td>
                        </>
                      )}

                      {/* Reference Tag Column */}
                      {columnVisibility.referenceTag && (
                        <td className={`py-3 px-3 border-r border-slate-100 text-[11px] font-bold ${
                          referenceOnlyFilter ? 'bg-purple-50/60' : ''
                        }`}>
                          {enq.reference && enq.reference.trim() !== '' && enq.reference.trim() !== '-' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 font-extrabold text-[11px] shadow-2xs">
                              <BookmarkCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                              <span>{enq.reference}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal italic">-</span>
                          )}
                        </td>
                      )}

                      {/* Driver Sub-columns */}
                      {columnVisibility.driverDetails && (
                        <>
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
                            {enq.driverBatchExp && enq.driverBatchExp.trim() !== '' ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-block text-[10px] font-black text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-1.5 py-0.5 rounded max-w-max">
                                  {calculateBatchExperience(enq.driverBatchExp)}
                                </span>
                                {formatDate(enq.driverBatchExp) !== calculateBatchExperience(enq.driverBatchExp).replace('EXP: ', '') && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 mt-0.5">
                                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span>{formatDate(enq.driverBatchExp)}</span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* ALREADY RUNNING COMPANY */}
                      {columnVisibility.runningCompany && (
                        <td className="py-3 px-3 border-r border-slate-100 bg-orange-50/10 font-medium text-orange-950">
                          {enq.alreadyRunningCompany || (
                            <span className="text-slate-300 italic">None / Tour Operator</span>
                          )}
                        </td>
                      )}

                      {/* SITE PREFERENCE 1 */}
                      {columnVisibility.sitePref1 && (
                        <td className="py-3 px-3 border-r border-slate-100 bg-amber-50/10 text-slate-700">
                          {(() => {
                            const { companyName, siteName, vendor } = getSitePrefCompanyDisplay(enq.sitePreference1);
                            if (!enq.sitePreference1 || enq.sitePreference1 === 'Open Preference') {
                              return (
                                <div className="flex items-center gap-1 text-slate-400 italic text-xs">
                                  <MapPin className="h-3 w-3 text-slate-300" />
                                  <span>Open Preference</span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex flex-col gap-0.5">
                                {companyName && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3 text-amber-600 shrink-0" />
                                    <span className="font-extrabold text-amber-950 text-xs tracking-tight">
                                      {companyName}
                                    </span>
                                    {vendor && (
                                      <span className="text-[9px] font-bold px-1 py-0.2 bg-amber-100 text-amber-800 rounded">
                                        {vendor}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                                  <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                                  <span>{siteName}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      )}

                      {/* SITE PREFERENCE 2 */}
                      {columnVisibility.sitePref2 && (
                        <td className="py-3 px-3 border-r border-slate-100 bg-rose-50/10 text-slate-700">
                          {(() => {
                            const { companyName, siteName, vendor } = getSitePrefCompanyDisplay(enq.sitePreference2);
                            if (!enq.sitePreference2 || enq.sitePreference2 === 'Open Preference') {
                              return (
                                <div className="flex items-center gap-1 text-slate-400 italic text-xs">
                                  <MapPin className="h-3 w-3 text-slate-300" />
                                  <span>Open Preference</span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex flex-col gap-0.5">
                                {companyName && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3 text-rose-600 shrink-0" />
                                    <span className="font-extrabold text-rose-950 text-xs tracking-tight">
                                      {companyName}
                                    </span>
                                    {vendor && (
                                      <span className="text-[9px] font-bold px-1 py-0.2 bg-rose-100 text-rose-800 rounded">
                                        {vendor}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                                  <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                                  <span>{siteName}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      )}

                      {/* STATUS */}
                      {columnVisibility.status && (
                        <td className="py-3 px-4 border-r border-slate-100 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${badgeColor} leading-none align-middle min-w-[75px]`}>
                            {displayStatus}
                          </span>
                        </td>
                      )}

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`enq-btn-share-msg-${enq.id}`}
                            onClick={() => handleCopyEnquiryMessage(enq)}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                            title="Copy / Share Enquiry Details in Message Format"
                          >
                            <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                          </button>
                          <button
                            id={`enq-btn-print-${enq.id}`}
                            onClick={() => setSelectedEnquiryForFormPrint(enq)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                            title="Print Vehicle Joining Form"
                          >
                            <Printer className="h-3.5 w-3.5 text-blue-600" />
                          </button>
                          <button
                            id={`enq-btn-comments-${enq.id}`}
                            onClick={() => setActiveCommentTarget({
                              id: enq.id,
                              name: `${enq.vehicleNumber} (${enq.driverName})`,
                              type: 'Enquiry',
                              comments: enq.comments || []
                            })}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-purple-600 rounded-lg transition-all cursor-pointer relative flex items-center justify-center"
                            title="View / Add Comments"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                            {enq.comments && enq.comments.length > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[8px] font-black text-white border border-white shadow-xs">
                                {enq.comments.length}
                              </span>
                            )}
                          </button>
                          {duplicateEnquiryVehicleGroups.has(normalizeCarNo(enq.vehicleNumber)) && (
                            <button
                              id={`enq-btn-merge-${enq.id}`}
                              onClick={() => handleOpenMergeModal(normalizeCarNo(enq.vehicleNumber))}
                              className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                              title="Merge Duplicate Vehicle Enquiries"
                            >
                              <GitMerge className="h-3.5 w-3.5 text-indigo-600" />
                            </button>
                          )}
                          <button
                            id={`enq-btn-induction-${enq.id}`}
                            onClick={() => handleMoveToInduction(enq.id)}
                            className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                            title="Move to Vehicle Induction Stage"
                          >
                            <Layers className="h-3.5 w-3.5 text-teal-600" />
                          </button>
                          {enq.status === 'Induction' && (
                            <button
                              id={`enq-btn-goto-induction-${enq.id}`}
                              onClick={() => onNavigate?.('Induction')}
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-2xs"
                              title="Go to Vehicle Induction Page"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                            </button>
                          )}
                          <button
                            id={`enq-btn-edit-${enq.id}`}
                            onClick={() => handleOpenEdit(enq)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                            title="Edit Record"
                          >
                            <Edit className="h-3.5 w-3.5 text-amber-500" />
                          </button>
                          <button
                            id={`enq-btn-delete-${enq.id}`}
                            onClick={() => handleDelete(enq.id)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
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
          <span>Showing {sortedAndFiltered.length} of {enquiries.length} logged telephone enquiries</span>
        </div>
      </div>

      {/* PROMOTION MODAL */}
      {promotingEnquiry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-emerald-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Database className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">
                    Promote to Master Registers
                  </h3>
                </div>
                <p className="text-3xs text-slate-500 font-extrabold uppercase tracking-wider">
                  Log vehicle {promotingEnquiry.vehicleNumber} and crew as master reference records
                </p>
              </div>
              <button
                onClick={() => setPromotingEnquiry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePromotion} className="flex-1 overflow-y-auto p-6 space-y-6">
              {promoteError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-start gap-2 animate-pulse">
                  <span className="font-bold">Error:</span>
                  <span>{promoteError}</span>
                </div>
              )}

              {promoteSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-start gap-2">
                  <span className="font-bold">Success:</span>
                  <span>{promoteSuccess}</span>
                </div>
              )}

              {/* Grid Layout of Registers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Vehicle Register */}
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
                      className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
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
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Make/Manufacturer</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.manufacturer}
                            onChange={(e) => setPromoteForm({ ...promoteForm, manufacturer: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
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
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
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
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                          <select
                            value={promoteForm.vehicleType}
                            onChange={(e) => setPromoteForm({ ...promoteForm, vehicleType: e.target.value as any })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
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
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                          >
                            <option value="Diesel">Diesel</option>
                            <option value="Petrol">Petrol</option>
                            <option value="CNG">CNG</option>
                            <option value="EV">EV</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Transmission</label>
                          <select
                            value={promoteForm.transmission}
                            onChange={(e) => setPromoteForm({ ...promoteForm, transmission: e.target.value as any })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                          >
                            <option value="Manual">Manual</option>
                            <option value="Automatic">Automatic</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Running Company</label>
                        <select
                          value={promoteForm.company}
                          onChange={(e) => setPromoteForm({ ...promoteForm, company: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                        >
                          <option value="">No Assigned Company</option>
                          {companies.map((c) => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Reporting Site</label>
                        <select
                          value={promoteForm.site}
                          onChange={(e) => setPromoteForm({ ...promoteForm, site: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white"
                        >
                          <option value="">No Assigned Site</option>
                          {sites.map((s) => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2: Owner Register */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-amber-600" />
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
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 bg-white font-extrabold text-amber-800"
                      >
                        <option value="new">🆕 Create New Owner Profile</option>
                        {owners.map(o => (
                          <option key={o.id} value={o.id}>👤 {o.name} ({o.phone})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Legal Name *</label>
                        <input
                          type="text"
                          required
                          value={promoteForm.ownerName}
                          onChange={(e) => setPromoteForm({ ...promoteForm, ownerName: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 bg-white"
                          placeholder="Owner Legal Name"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Contact Phone *</label>
                        <input
                          type="text"
                          required
                          value={promoteForm.ownerPhone}
                          onChange={(e) => setPromoteForm({ ...promoteForm, ownerPhone: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 bg-white"
                          placeholder="10-digit phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Driver Register */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-emerald-600" />
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
                      className="text-[10px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
                      title="Copy Owner Info to Driver"
                    >
                      <Sparkles className="h-3 w-3 text-emerald-600" /> Copy Owner Info
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
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white font-extrabold text-emerald-800"
                      >
                        <option value="new">🆕 Create New Driver Profile</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>💂 {d.name} ({d.phone})</option>
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
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white"
                          placeholder="Driver Full Name"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Mobile No *</label>
                        <input
                          type="text"
                          required
                          value={promoteForm.driverPhone}
                          onChange={(e) => setPromoteForm({ ...promoteForm, driverPhone: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white"
                          placeholder="10-digit mobile number"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Licence / DL Number</label>
                        <input
                          type="text"
                          placeholder="e.g. TN-07-2018223344"
                          value={promoteForm.driverDl}
                          onChange={(e) => setPromoteForm({ ...promoteForm, driverDl: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">DL Expiry Date</label>
                        <input
                          type="date"
                          value={promoteForm.driverDlExp}
                          onChange={(e) => setPromoteForm({ ...promoteForm, driverDlExp: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Aadhaar Card No</label>
                        <input
                          type="text"
                          placeholder="e.g. 5432 1100 2233"
                          value={promoteForm.driverAadhaar}
                          onChange={(e) => setPromoteForm({ ...promoteForm, driverAadhaar: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Address</label>
                        <textarea
                          rows={2}
                          value={promoteForm.driverAddress}
                          onChange={(e) => setPromoteForm({ ...promoteForm, driverAddress: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white resize-none"
                          placeholder="Full residential address details"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPromotingEnquiry(null)}
                className="px-4 py-2 text-xs font-black text-slate-500 uppercase tracking-wider border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePromotion}
                type="button"
                className="px-5 py-2 text-xs font-black text-white uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-sm rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="h-4 w-4" />
                Save to Registers
              </button>
            </div>
          </div>
        </div>
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

      {/* Enquiry List Print Report & Filters Center */}
      {isPrintingReport && (
        <PrintEnquiryReport
          enquiries={enquiries}
          sites={sites}
          onClose={() => setIsPrintingReport(false)}
          initialStatusFilter={statusFilter}
        />
      )}

      {/* Individual Joining Form Print Modal */}
      {selectedEnquiryForFormPrint && (
        <PrintJoiningForm
          enquiry={selectedEnquiryForFormPrint}
          owners={owners}
          vehicles={vehicles}
          onClose={() => setSelectedEnquiryForFormPrint(null)}
        />
      )}

      {/* SHARE / COPY MESSAGE FORMAT MODAL */}
      {sharingEnquiryMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Enquiry Message Details</h3>
                  <p className="text-xs text-slate-500 font-medium">Ready to send via WhatsApp, SMS or Chat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSharingEnquiryMessage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Formatted Text Preview Box */}
            <div className="relative group">
              <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Formatted Message Preview</label>
              <textarea
                readOnly
                rows={9}
                value={generateEnquiryMessageFormat(sharingEnquiryMessage)}
                className="w-full p-4 bg-slate-50 text-slate-900 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none resize-none leading-relaxed shadow-inner"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(generateEnquiryMessageFormat(sharingEnquiryMessage))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" /> Share via WhatsApp
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generateEnquiryMessageFormat(sharingEnquiryMessage));
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2500);
                  }}
                  className={`px-4 py-2.5 font-bold text-xs rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-xs'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy Text
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSharingEnquiryMessage(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE INDUCTION - SELECT TARGET COMPANY MODAL */}
      {inductionModalEnquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/20 rounded-xl border border-teal-400/30 text-teal-300">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide text-white uppercase">
                    Select Company for Induction
                  </h3>
                  <p className="text-xs text-teal-200/90 font-medium">
                    Choose the company where this vehicle will be inducted & deployed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInductionModalEnquiry(null)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmMoveToInduction} className="p-6 space-y-4">
              {/* Summary Card for Vehicle */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Vehicle Enquiry Details
                  </span>
                  <span className="px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-mono font-black rounded-md border border-teal-200">
                    {inductionModalEnquiry.vehicleNumber || 'NO REG'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-medium pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Type & Model</span>
                    <p className="font-bold text-slate-900">{inductionModalEnquiry.vehicleType || 'Vehicle'} - {inductionModalEnquiry.vehicleModelYear || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Driver Name</span>
                    <p className="font-bold text-slate-900">{inductionModalEnquiry.driverName || '-'} ({inductionModalEnquiry.driverPhone || 'No Phone'})</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Owner Name</span>
                    <p className="font-bold text-slate-900">{inductionModalEnquiry.ownerNamePhone || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Site Pref</span>
                    <p className="font-bold text-amber-700">{inductionModalEnquiry.sitePreference1 || 'Open Preference'}</p>
                  </div>
                </div>
              </div>

              {inductionModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{inductionModalError}</span>
                </div>
              )}

              {/* Target Company Selection Field */}
              <div>
                <label className="block text-3xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Company Going For Induction <span className="text-rose-500">*</span>
                </label>
                <select
                  id="induction-modal-company-select"
                  value={inductionCompanyChoice}
                  onChange={(e) => {
                    setInductionCompanyChoice(e.target.value);
                    setInductionModalError(null);
                  }}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
                  required
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((comp) => (
                    <option key={comp.name} value={comp.name}>
                      {comp.name} {comp.companySite ? `(${comp.companySite})` : ''}
                    </option>
                  ))}
                  <option value="Other">+ Enter Custom Company Name</option>
                </select>
              </div>

              {/* Custom Company Input if "Other" is chosen */}
              {inductionCompanyChoice === 'Other' && (
                <div>
                  <label className="block text-3xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Custom Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="induction-modal-custom-company"
                    placeholder="e.g. AMAZON, CTS, OPTUM, WALMART, ASTRAZENICA"
                    value={customInductionCompany}
                    onChange={(e) => {
                      setCustomInductionCompany(e.target.value);
                      setInductionModalError(null);
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                    required
                  />
                </div>
              )}

              {/* Induction Date & Site */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Induction Date
                  </label>
                  <input
                    type="date"
                    id="induction-modal-date"
                    value={inductionDateInput}
                    onChange={(e) => setInductionDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Site / Branch Location
                  </label>
                  <input
                    type="text"
                    id="induction-modal-site"
                    placeholder="e.g. OMR Campus / Main Site"
                    value={inductionSiteChoice}
                    onChange={(e) => setInductionSiteChoice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-3xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Induction Remarks / Notes
                </label>
                <input
                  type="text"
                  id="induction-modal-remarks"
                  placeholder="e.g. Driver documents verified, scheduled for orientation"
                  value={inductionRemarksInput}
                  onChange={(e) => setInductionRemarksInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInductionModalEnquiry(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-induction-company"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm & Go to Induction Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingEnquiry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Delete Enquiry Record</h3>
                  <p className="text-xs text-slate-500 font-medium">Confirm permanent removal from Enquiry Desk</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingEnquiry(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete the enquiry record for{' '}
                <span className="font-bold text-slate-800">
                  {deletingEnquiry.vehicleNumber ? `${deletingEnquiry.vehicleNumber} (${deletingEnquiry.id})` : deletingEnquiry.id}
                </span>
                ?
              </p>

              {(deletingEnquiry.driverName || deletingEnquiry.vehicleType || deletingEnquiry.sitePreference1) && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                  {deletingEnquiry.driverName && (
                    <div>
                      <span className="font-semibold text-slate-500">Driver:</span> {deletingEnquiry.driverName}{' '}
                      {deletingEnquiry.driverPhone ? `(${deletingEnquiry.driverPhone})` : ''}
                    </div>
                  )}
                  {deletingEnquiry.vehicleType && (
                    <div>
                      <span className="font-semibold text-slate-500">Vehicle Type:</span> {deletingEnquiry.vehicleType}
                    </div>
                  )}
                  {deletingEnquiry.sitePreference1 && (
                    <div>
                      <span className="font-semibold text-slate-500">Site Preference:</span> {deletingEnquiry.sitePreference1}
                    </div>
                  )}
                </div>
              )}

              <p className="text-3xs text-rose-600 font-medium bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                ⚠️ This record will be moved to Deleted Vehicles archive so it can be audited or restored later if required.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                id="btn-cancel-delete-enquiry"
                onClick={() => setDeletingEnquiry(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-enquiry"
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Vehicle Popup Message Modal */}
      {duplicateModalMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-5 relative">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <AlertTriangle className="h-3 w-3 text-amber-700" /> Duplicate Car Number Alert
                </div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Vehicle Already Registered!
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Car Number <strong className="font-mono text-slate-900 font-bold">{duplicateModalMatch.vehicleNumber}</strong> is already tracked in the <strong className="text-slate-800 font-bold">{duplicateModalMatch.type === 'Enquiry' ? 'Enquiry Register' : 'Master Fleet Register'}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateModalMatch(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Tracked Data Card for Enquiry */}
            {duplicateModalMatch.type === 'Enquiry' && duplicateModalMatch.enquiry && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tracked Enquiry ID</span>
                    <span className="font-mono font-black text-indigo-700 text-sm">{duplicateModalMatch.enquiry.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Enquiry Date</span>
                    <span className="font-mono font-bold text-slate-700">{formatDate(duplicateModalMatch.enquiry.enquiryDate)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Vehicle Type & Fuel</span>
                    <span className="font-bold text-slate-900">{duplicateModalMatch.enquiry.vehicleType || 'Vehicle'} ({duplicateModalMatch.enquiry.fuelType || 'Fuel'})</span>
                    <span className="block text-2xs text-slate-500">{duplicateModalMatch.enquiry.vehicleModelYear || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Status</span>
                    <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-black text-[10px] uppercase mt-0.5">
                      {duplicateModalMatch.enquiry.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Owner Name & Mobile</span>
                    <span className="font-bold text-slate-900 block">{duplicateModalMatch.enquiry.ownerName || duplicateModalMatch.enquiry.ownerNamePhone || 'N/A'}</span>
                    <span className="text-2xs font-mono text-slate-500">{duplicateModalMatch.enquiry.ownerMobile || ''}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Driver Name & Mobile</span>
                    <span className="font-bold text-slate-900 block">{duplicateModalMatch.enquiry.driverName || 'N/A'}</span>
                    <span className="text-2xs font-mono text-slate-500">{duplicateModalMatch.enquiry.driverPhone || ''}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Driver Area / Location</span>
                    <span className="font-bold text-slate-900 block">{duplicateModalMatch.enquiry.driverArea || duplicateModalMatch.enquiry.driverAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Company Preference</span>
                    <span className="font-bold text-slate-900 block">{duplicateModalMatch.enquiry.inductionCompany || duplicateModalMatch.enquiry.sitePreference1 || 'Open Preference'}</span>
                  </div>
                </div>

                {(duplicateModalMatch.enquiry.remarks || (duplicateModalMatch.enquiry.comments && duplicateModalMatch.enquiry.comments.length > 0)) && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Latest Remarks / Comment</span>
                    <p className="text-2xs text-slate-600 font-medium italic mt-0.5">
                      "{duplicateModalMatch.enquiry.comments && duplicateModalMatch.enquiry.comments.length > 0
                        ? duplicateModalMatch.enquiry.comments[duplicateModalMatch.enquiry.comments.length - 1].text
                        : duplicateModalMatch.enquiry.remarks}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tracked Data Card for Master Vehicle */}
            {duplicateModalMatch.type === 'MasterVehicle' && duplicateModalMatch.vehicle && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Master Vehicle ID</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">{duplicateModalMatch.vehicle.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Joining Date</span>
                    <span className="font-mono font-bold text-slate-700">{formatDate(duplicateModalMatch.vehicle.joiningDate)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Vehicle Type & Fuel</span>
                    <span className="font-bold text-slate-900">{duplicateModalMatch.vehicle.vehicleType} ({duplicateModalMatch.vehicle.fuelType})</span>
                    <span className="block text-2xs text-slate-500">{duplicateModalMatch.vehicle.manufacturer} {duplicateModalMatch.vehicle.model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Fleet Status</span>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px] uppercase mt-0.5">
                      {duplicateModalMatch.vehicle.status} MASTER FLEET
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Owner Name</span>
                    <span className="font-bold text-slate-900 block">{duplicateModalMatch.vehicle.ownerName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Driver Name</span>
                    <span className="font-bold text-slate-900 block">{duplicateModalMatch.vehicle.driverName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Company & Site</span>
                    <span className="font-bold text-slate-900 block">{duplicateModalMatch.vehicle.company} - {duplicateModalMatch.vehicle.site}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDuplicateModalMatch(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 bg-white cursor-pointer"
              >
                Cancel & Fix Car No
              </button>

              {duplicateModalMatch.type === 'Enquiry' && duplicateModalMatch.enquiry && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const norm = normalizeCarNo(duplicateModalMatch.vehicleNumber);
                      setDuplicateModalMatch(null);
                      if (norm) handleOpenMergeModal(norm);
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <GitMerge className="h-3.5 w-3.5" />
                    <span>Merge Duplicate Enquiries</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetEnq = duplicateModalMatch.enquiry!;
                      setDuplicateModalMatch(null);
                      handleOpenEdit(targetEnq);
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Open Tracked Record</span>
                  </button>
                </>
              )}

              {duplicateModalMatch.type === 'MasterVehicle' && (
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateModalMatch(null);
                    handleCloseForm();
                    if (onNavigate) onNavigate('Master Fleet');
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Go to Master Fleet</span>
                </button>
              )}

              <button
                type="button"
                onClick={executeForceSave}
                className="w-full sm:w-auto px-3 py-2 text-2xs font-extrabold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
                title="Save duplicate entry anyway if required"
              >
                Proceed & Save Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MERGE DUPLICATE VEHICLES MODAL */}
      {mergingGroupNorm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
                  <GitMerge className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase tracking-wider text-white">
                      Merge Duplicate Vehicle Enquiries
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-400/20 border border-amber-400/40 text-amber-200 text-2xs font-mono font-black rounded-full">
                      {mergingGroupNorm}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/90 font-medium mt-0.5">
                    Select the primary record to retain and consolidate duplicate enquiry details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMergingGroupNorm(null)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Group Selector if multiple groups exist */}
              {duplicateEnquiryVehicleGroups.size > 1 && (
                <div className="bg-indigo-50/60 border border-indigo-100 p-3.5 rounded-xl flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-indigo-600" /> Select Duplicate Vehicle Group:
                  </span>
                  <select
                    value={mergingGroupNorm}
                    onChange={(e) => handleOpenMergeModal(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-indigo-200 text-xs font-bold text-slate-900 rounded-lg focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {Array.from(duplicateEnquiryVehicleGroups.entries()).map(([norm, list]) => (
                      <option key={norm} value={norm}>
                        {norm} ({list.length} Duplicate Records)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Records Comparison List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Detected Duplicate Records ({duplicateEnquiryVehicleGroups.get(mergingGroupNorm)?.length || 0})
                  </h4>
                  <span className="text-2xs text-slate-500 font-semibold">
                    Select radio button on the left to set Primary Record
                  </span>
                </div>

                <div className="space-y-3">
                  {(duplicateEnquiryVehicleGroups.get(mergingGroupNorm) || []).map((enq, idx) => {
                    const isSelected = selectedPrimaryEnquiryId === enq.id;
                    return (
                      <div
                        key={enq.id}
                        onClick={() => setSelectedPrimaryEnquiryId(enq.id)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="primaryEnqSelection"
                              checked={isSelected}
                              onChange={() => setSelectedPrimaryEnquiryId(enq.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-indigo-900">{enq.id}</span>
                                {isSelected && (
                                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold uppercase rounded-full">
                                    Primary Record
                                  </span>
                                )}
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                                  {enq.status}
                                </span>
                              </div>
                              <span className="text-2xs text-slate-500 font-medium">
                                Enquiry Date: <strong className="font-mono text-slate-700">{formatDate(enq.enquiryDate)}</strong>
                              </span>
                            </div>
                          </div>
                          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">
                            Record #{idx + 1}
                          </span>
                        </div>

                        {/* Record Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-700">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle</span>
                            <span className="font-bold text-slate-900">{enq.vehicleType || '-'} ({enq.fuelType || '-'})</span>
                            <span className="block text-2xs text-slate-500">{enq.vehicleModelYear || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Owner</span>
                            <span className="font-bold text-slate-900 block">{enq.ownerName || enq.ownerNamePhone || '-'}</span>
                            <span className="text-2xs font-mono text-slate-500">{enq.ownerMobile || ''}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Driver</span>
                            <span className="font-bold text-slate-900 block">{enq.driverName || '-'}</span>
                            <span className="text-2xs font-mono text-slate-500">{enq.driverPhone || ''}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Site Pref / Running</span>
                            <span className="font-bold text-slate-900 block">{enq.sitePreference1 || 'Open Preference'}</span>
                            <span className="text-2xs text-slate-500">{enq.alreadyRunningCompany || ''}</span>
                          </div>
                        </div>

                        {enq.remarks && (
                          <div className="mt-2 text-2xs bg-slate-100/80 p-2 rounded text-slate-700 font-mono">
                            <strong className="text-slate-500">Remarks:</strong> {enq.remarks}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Merge Options */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Smart Merge Rules
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside font-medium">
                  <li>Missing details in the selected Primary Record will be automatically backfilled from duplicate records.</li>
                  <li>Duplicate enquiry entries will be removed from the register to eliminate clutter.</li>
                </ul>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <input
                    type="checkbox"
                    id="chk-merge-consolidate-remarks"
                    checked={mergeConsolidateRemarks}
                    onChange={(e) => setMergeConsolidateRemarks(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="chk-merge-consolidate-remarks" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Consolidate and preserve remarks & comments from all duplicate records
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMergingGroupNorm(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-merge-enquiry-records"
                onClick={handleConfirmMergeSingleGroup}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <GitMerge className="h-4 w-4" />
                Confirm & Merge Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
