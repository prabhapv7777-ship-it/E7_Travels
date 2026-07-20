import React, { useState, useRef, useEffect } from 'react';
import { Enquiry, Site, Vehicle, Owner, Driver, Company } from '../types';
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
  Database,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Printer,
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
}: EnquiryViewsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Interested' | 'Site Offered' | 'Closed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
    fuelType: 'Diesel' as 'CNG' | 'Diesel' | 'Petrol',
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
    if (isAdding || editingId || promotingEnquiry || isPrintingReport || selectedEnquiryForFormPrint) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdding, editingId, promotingEnquiry, isPrintingReport, selectedEnquiryForFormPrint]);

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
      sitePreference1: sites.length > 0 ? sites[0].name : 'Open Preference',
      sitePreference2: sites.length > 1 ? sites[1].name : 'Open Preference',
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

  const handleOpenPromote = (enq: Enquiry) => {
    let ownerName = enq.ownerName || '';
    let ownerPhone = enq.ownerMobile || '';
    if (!ownerName && enq.ownerNamePhone) {
      const regex = /([^(]+)(?:\(([^)]+)\))?/;
      const match = enq.ownerNamePhone.match(regex);
      if (match) {
        ownerName = match[1].trim();
        ownerPhone = match[2] ? match[2].trim() : '';
      } else {
        ownerName = enq.ownerNamePhone;
      }
    }

    const driverName = enq.driverName || '';
    const driverPhone = enq.driverPhone || '';

    // Look for matches in existing masters to reuse profiles
    const matchedOwner = owners.find(o => 
      o.name.toLowerCase() === ownerName.toLowerCase() || 
      (ownerPhone && o.phone.replace(/[^0-9]/g, '') === ownerPhone.replace(/[^0-9]/g, ''))
    );
    const matchedDriver = drivers.find(d => 
      d.name.toLowerCase() === driverName.toLowerCase() || 
      (driverPhone && d.phone.replace(/[^0-9]/g, '') === driverPhone.replace(/[^0-9]/g, ''))
    );

    let normalizedFuel: 'CNG' | 'Diesel' | 'Petrol' = 'Diesel';
    const fLower = (enq.fuelType || '').toLowerCase();
    if (fLower.includes('cng')) normalizedFuel = 'CNG';
    else if (fLower.includes('petrol')) normalizedFuel = 'Petrol';
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

    setPromoteForm({
      createVehicle: true,
      createOwner: matchedOwner ? false : !!ownerName,
      createDriver: matchedDriver ? false : !!driverName,
      registrationNumber: enq.vehicleNumber || '',
      model: parsedModel || 'Innova Crysta',
      manufacturer: 'Toyota',
      year: parsedYear,
      fuelType: normalizedFuel,
      transmission: 'Manual',
      vehicleType: normalizedType,
      company: enq.alreadyRunningCompany || (companies.length > 0 ? companies[0].name : ''),
      site: enq.sitePreference1 && enq.sitePreference1 !== 'Open Preference' ? enq.sitePreference1 : (sites.length > 0 ? sites[0].name : ''),
      ownerId: matchedOwner ? matchedOwner.id : 'new',
      ownerName: ownerName,
      ownerPhone: ownerPhone,
      driverId: matchedDriver ? matchedDriver.id : 'new',
      driverName: driverName,
      driverPhone: driverPhone,
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

    // Vehicle duplication check
    if (promoteForm.createVehicle) {
      const exists = vehicles.some(
        (v) => v.registrationNumber.replace(/\s+/g, '').toUpperCase() === cleanReg
      );
      if (exists) {
        setPromoteError(`Vehicle with registration number "${cleanReg}" already exists in Master Registers.`);
        return;
      }
    }

    let finalOwnerId = '';
    let finalOwnerName = '';

    // Handle Owner Addition/Linking
    if (promoteForm.ownerId !== 'new') {
      const existingOwner = owners.find(o => o.id === promoteForm.ownerId);
      if (existingOwner) {
        finalOwnerId = existingOwner.id;
        finalOwnerName = existingOwner.name;
      } else {
        setPromoteError('Selected Owner profile was not found.');
        return;
      }
    } else if (promoteForm.createOwner) {
      if (!promoteForm.ownerName.trim()) {
        setPromoteError('Owner Name is required to create a new profile.');
        return;
      }
      if (!promoteForm.ownerPhone.trim()) {
        setPromoteError('Owner Phone Number is required to create a new profile.');
        return;
      }

      const newOwnerId = `OWN${(owners.length + 1).toString().padStart(2, '0')}`;
      const newOwner: Owner = {
        id: newOwnerId,
        name: promoteForm.ownerName.trim(),
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
      owners.push(newOwner); // local reference update for sync in this run
    }

    let finalDriverId = '';
    let finalDriverName = '';

    // Handle Driver Addition/Linking
    if (promoteForm.driverId !== 'new') {
      const existingDriver = drivers.find(d => d.id === promoteForm.driverId);
      if (existingDriver) {
        finalDriverId = existingDriver.id;
        finalDriverName = existingDriver.name;
      } else {
        setPromoteError('Selected Driver profile was not found.');
        return;
      }
    } else if (promoteForm.createDriver) {
      if (!promoteForm.driverName.trim()) {
        setPromoteError('Driver Name is required.');
        return;
      }
      if (!promoteForm.driverPhone.trim()) {
        setPromoteError('Driver Phone is required.');
        return;
      }

      const newDriverId = `DRV${(drivers.length + 1).toString().padStart(2, '0')}`;
      const newDriver: Driver = {
        id: newDriverId,
        name: promoteForm.driverName.trim(),
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
      drivers.push(newDriver); // local reference update
    }

    // Handle Vehicle Addition
    if (promoteForm.createVehicle) {
      const newVehicleId = `VEH${(vehicles.length + 1).toString().padStart(3, '0')}`;
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
        remarks: 'Promoted from Enquiry ' + (promotingEnquiry?.id || ''),
      };

      onUpdateVehicles([...vehicles, newVehicle]);
    }

    // Update enquiry status to 'Closed' and add confirmation log in remarks
    if (promotingEnquiry) {
      const updatedEnquiries = enquiries.map((e) => {
        if (e.id === promotingEnquiry.id) {
          return {
            ...e,
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
        <div className="flex flex-wrap gap-2.5 self-start md:self-auto">
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

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Fuel Type</label>
                  <input
                    id="enq-form-fuelType"
                    type="text"
                    placeholder="e.g. Diesel / CNG / Petrol"
                    value={formState.fuelType || ''}
                    onChange={(e) => setFormState({ ...formState, fuelType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                    <option value="Open Preference">Open Preference / Any Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
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
                    <option value="Open Preference">Open Preference / Any Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
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
                    <option value="Open Preference">Open Preference / Any Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
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
                    <option value="Open Preference">Open Preference / Any Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
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
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
          </form>
            </div>
          </div>
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
          className="overflow-x-auto scrollbar-visible"
        >
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
                            id={`enq-btn-print-${enq.id}`}
                            onClick={() => setSelectedEnquiryForFormPrint(enq)}
                            className="p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Print Vehicle Joining Form"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`enq-btn-comments-${enq.id}`}
                            onClick={() => setActiveCommentTarget({
                              id: enq.id,
                              name: `${enq.vehicleNumber} (${enq.driverName})`,
                              type: 'Enquiry',
                              comments: enq.comments || []
                            })}
                            className="p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors cursor-pointer relative"
                            title="View / Add Comments"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {enq.comments && enq.comments.length > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[7px] font-bold text-white">
                                {enq.comments.length}
                              </span>
                            )}
                          </button>
                          <button
                            id={`enq-btn-promote-${enq.id}`}
                            onClick={() => handleOpenPromote(enq)}
                            disabled={enq.status === 'Closed'}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              enq.status === 'Closed'
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                            title={enq.status === 'Closed' ? "Already Closed / Promoted" : "Promote Car to Master Registers"}
                          >
                            <Database className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`enq-btn-edit-${enq.id}`}
                            onClick={() => handleOpenEdit(enq)}
                            className="p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`enq-btn-delete-${enq.id}`}
                            onClick={() => handleDelete(enq.id)}
                            className="p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 rounded transition-colors cursor-pointer"
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
                            onChange={(e) => setPromoteForm({ ...promoteForm, model: e.target.value })}
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Link / Add</span>
                      <input
                        type="checkbox"
                        checked={promoteForm.createOwner || promoteForm.ownerId !== 'new'}
                        disabled={promoteForm.ownerId !== 'new'}
                        onChange={(e) => setPromoteForm({ ...promoteForm, createOwner: e.target.checked })}
                        className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Registry Option</label>
                      <select
                        value={promoteForm.ownerId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPromoteForm({
                            ...promoteForm,
                            ownerId: val,
                            createOwner: val === 'new'
                          });
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 bg-white font-extrabold text-amber-800"
                      >
                        <option value="new">🆕 Create New Owner Profile</option>
                        {owners.map(o => (
                          <option key={o.id} value={o.id}>👤 {o.name} ({o.phone})</option>
                        ))}
                      </select>
                    </div>

                    {promoteForm.createOwner && promoteForm.ownerId === 'new' && (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-150">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Legal Name *</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.ownerName}
                            onChange={(e) => setPromoteForm({ ...promoteForm, ownerName: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 bg-white"
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
                          />
                        </div>

                        <div className="text-[10px] text-slate-400 font-extrabold uppercase leading-relaxed bg-amber-50/50 p-2 border border-amber-100 rounded-lg">
                          💡 Bank accounts & other billing parameters will be automatically synced from the enquiry printable form fields.
                        </div>
                      </div>
                    )}

                    {promoteForm.ownerId !== 'new' && (
                      <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100 text-3xs text-amber-800 font-extrabold uppercase">
                        ✅ Linking this vehicle to existing owner registry record: ID {promoteForm.ownerId}.
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Driver Register */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">3. Driver Master</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Link / Add</span>
                      <input
                        type="checkbox"
                        checked={promoteForm.createDriver || promoteForm.driverId !== 'new'}
                        disabled={promoteForm.driverId !== 'new'}
                        onChange={(e) => setPromoteForm({ ...promoteForm, createDriver: e.target.checked })}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Registry Option</label>
                      <select
                        value={promoteForm.driverId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPromoteForm({
                            ...promoteForm,
                            driverId: val,
                            createDriver: val === 'new'
                          });
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white font-extrabold text-emerald-800"
                      >
                        <option value="new">🆕 Create New Driver Profile</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>💂 {d.name} ({d.phone})</option>
                        ))}
                      </select>
                    </div>

                    {promoteForm.createDriver && promoteForm.driverId === 'new' && (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-150">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Full Name *</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.driverName}
                            onChange={(e) => setPromoteForm({ ...promoteForm, driverName: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white"
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
                    )}

                    {promoteForm.driverId !== 'new' && (
                      <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 text-3xs text-emerald-800 font-extrabold uppercase">
                        ✅ Linking this vehicle to existing driver registry record: ID {promoteForm.driverId}.
                      </div>
                    )}
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
          onClose={() => setSelectedEnquiryForFormPrint(null)}
        />
      )}
    </div>
  );
}
