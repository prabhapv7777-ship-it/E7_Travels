import React, { useState, useRef, useEffect } from 'react';
import { Enquiry, Site, Vehicle, Owner, Driver, Company } from '../types';
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
  Printer,
  RotateCcw,
} from 'lucide-react';
import PrintJoiningForm from './PrintJoiningForm';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEnq, setEditingEnq] = useState<Enquiry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingEnqId, setDeletingEnqId] = useState<string | null>(null);
  const [restoringEnqId, setRestoringEnqId] = useState<string | null>(null);

  // Comments State
  const [activeCommentTarget, setActiveCommentTarget] = useState<Enquiry | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Selected Enquiry for print joining form
  const [selectedEnquiryForFormPrint, setSelectedEnquiryForFormPrint] = useState<Enquiry | null>(null);

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
    fuelType: 'Diesel' as 'CNG' | 'Diesel' | 'Petrol',
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

  const handleSaveStep1 = (id: string) => {
    let company = step1Company[id] || '';
    if (company === 'Other') {
      company = step1Company[id + '_custom'] || '';
    }
    const date = step1Date[id] || new Date().toISOString().substring(0, 10);
    if (!company) {
      alert('Please select or enter a reputed company.');
      return;
    }
    const updated = enquiries.map((enq) =>
      enq.id === id ? { ...enq, inductionCompany: company, inductionDate: date, inductionCompleted: true } : enq
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

  // Filtered by Search Query
  const filtered = inductionEnquiries.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.vehicleNumber || '').toLowerCase().includes(query) ||
      (item.vehicleType || '').toLowerCase().includes(query) ||
      (item.vehicleModelYear || '').toLowerCase().includes(query) ||
      (item.ownerNamePhone || '').toLowerCase().includes(query) ||
      (item.driverName || '').toLowerCase().includes(query) ||
      (item.driverPhone || '').toLowerCase().includes(query) ||
      (item.remarks || '').toLowerCase().includes(query)
    );
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
      const updated = enquiries.filter((item) => item.id !== deletingEnqId);
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

    const matchedOwner = owners.find(
      (o) =>
        o.name.toLowerCase() === ownerName.toLowerCase() ||
        (ownerPhone && o.phone.replace(/[^0-9]/g, '') === ownerPhone.replace(/[^0-9]/g, ''))
    );
    const matchedDriver = drivers.find(
      (d) =>
        d.name.toLowerCase() === driverName.toLowerCase() ||
        (driverPhone && d.phone.replace(/[^0-9]/g, '') === driverPhone.replace(/[^0-9]/g, ''))
    );

    let normalizedFuel: 'CNG' | 'Diesel' | 'Petrol' = 'Diesel';
    const fLower = (enq.fuelType || '').toLowerCase();
    if (fLower.includes('cng')) normalizedFuel = 'CNG';
    else if (fLower.includes('petrol')) normalizedFuel = 'Petrol';

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
      company: enq.inductionCompany || enq.alreadyRunningCompany || (companies.length > 0 ? companies[0].name : ''),
      site:
        enq.sitePreference1 && enq.sitePreference1 !== 'Open Preference'
          ? enq.sitePreference1
          : sites.length > 0
          ? sites[0].name
          : '',
      joiningDate: enq.routeStartDate || new Date().toISOString().substring(0, 10),
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

    if (promoteForm.ownerId !== 'new') {
      const existingOwner = owners.find((o) => o.id === promoteForm.ownerId);
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
        remarks: 'Promoted from Induction ' + (promotingEnquiry?.id || ''),
      };

      onUpdateOwners([...owners, newOwner]);
      finalOwnerId = newOwnerId;
      finalOwnerName = newOwner.name;
      owners.push(newOwner);
    }

    let finalDriverId = '';
    let finalDriverName = '';

    if (promoteForm.driverId !== 'new') {
      const existingDriver = drivers.find((d) => d.id === promoteForm.driverId);
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
      drivers.push(newDriver);
    }

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
        joiningDate: promoteForm.joiningDate || new Date().toISOString().substring(0, 10),
        status: 'Active',
        emiAmount: 0,
        emiDueDate: '',
        insuranceExpiry: promotingEnquiry?.insuranceExpiry || '',
        permitExpiry: promotingEnquiry?.permitExpiry || '',
        fcExpiry: promotingEnquiry?.fcExpiry || '',
        pollutionExpiry: '',
        fastagNumber: '',
        remarks: 'Promoted from Induction ' + (promotingEnquiry?.id || '') + (promotingEnquiry?.gpsVendor ? ` | GPS: ${promotingEnquiry.gpsVendor} (${promotingEnquiry.gpsImei || 'No IMEI'})` : ' | No GPS'),
      };

      onUpdateVehicles([...vehicles, newVehicle]);
    }

    if (promotingEnquiry) {
      const updatedEnquiries = enquiries.map((e) => {
        if (e.id === promotingEnquiry.id) {
          return {
            ...e,
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

  return (
    <div className="space-y-6">
      {/* Print Joining Form Render */}
      {selectedEnquiryForFormPrint && (
        <PrintJoiningForm
          enquiry={selectedEnquiryForFormPrint}
          onClose={() => setSelectedEnquiryForFormPrint(null)}
        />
      )}

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
                    
                    {/* Column 1: Vehicle Basic Info (Col Span 3) */}
                    <div className="lg:col-span-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-3xs font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {enq.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {enq.enquiryDate}
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
                      {enq.remarks && (
                        <div className="bg-white border border-slate-150 p-2 rounded-lg text-4xs leading-relaxed italic text-slate-500 max-w-full overflow-hidden">
                          <span className="font-bold not-italic text-slate-400 block mb-0.5 uppercase tracking-wider text-[8px]">Enquiry remarks:</span>
                          "{enq.remarks}"
                        </div>
                      )}
                    </div>

                    {/* Column 2: Crew/Driver & Owner Info (Col Span 3) */}
                    <div className="lg:col-span-3 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-200/60 pt-4 lg:pt-0 lg:pl-6">
                      <div>
                        <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[9px]">Owner attaching</span>
                        <span className="font-bold text-slate-700 text-xs truncate block">{enq.ownerNamePhone}</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[9px]">Crew Driver</span>
                        <span className="font-bold text-slate-700 text-xs truncate block">
                          {enq.driverName}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px] mt-0.5 block">{enq.driverPhone || 'No Phone'}</span>
                      </div>
                    </div>

                    {/* Column 3: Boarding Documents Checklist & Progress (Col Span 3) */}
                    <div className="lg:col-span-3 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-200/60 pt-4 lg:pt-0 lg:pl-6">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-3xs font-extrabold uppercase">
                          <span className="text-slate-500">Boarding Documents</span>
                          <span className="text-indigo-600 font-bold">{progress.completed}/{progress.total} Completed</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Compact Checklist Details */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-white p-2.5 rounded-lg border border-slate-150 text-[10px] font-bold">
                        {progress.checks.map((chk, i) => (
                          <div key={i} className="flex items-center gap-1.5 overflow-hidden">
                            {chk.ok ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            )}
                            <span className={`truncate ${chk.ok ? 'text-slate-700' : 'text-slate-400'}`}>
                              {chk.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: Quick Actions & Status Links (Col Span 3) */}
                    <div className="lg:col-span-3 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200/60 pt-4 lg:pt-0 lg:pl-6">
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        <button
                          onClick={() => setActiveCommentTarget(enq)}
                          className="flex-1 flex items-center justify-center lg:justify-start gap-1.5 text-indigo-600 hover:text-indigo-700 text-3xs font-extrabold uppercase tracking-wide cursor-pointer p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 shadow-3xs transition-all"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>Induction Notes ({enq.comments?.length || 0})</span>
                        </button>
                        <button
                          onClick={() => setSelectedEnquiryForFormPrint(enq)}
                          className="flex-1 flex items-center justify-center lg:justify-start gap-1.5 text-slate-600 hover:text-indigo-600 text-3xs font-extrabold uppercase tracking-wide cursor-pointer p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 shadow-3xs transition-all"
                        >
                          <Printer className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Print Join Sheet</span>
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
                            enq.gpsRequired 
                              ? 'bg-emerald-500 text-white' 
                              : enq.inductionCompleted 
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                                : 'bg-slate-100 text-slate-400'
                          }`}>
                            {enq.gpsRequired ? <Check className="h-3.5 w-3.5" /> : '2'}
                          </div>
                          <span className={`text-[10px] font-extrabold ${enq.inductionCompleted ? 'text-slate-700' : 'text-slate-400'}`}>GPS Fitting</span>
                        </div>

                        <div className={`flex-1 min-w-[24px] h-0.5 border-t-2 border-dashed ${enq.gpsRequired ? 'border-emerald-500' : 'border-slate-200'}`} />

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
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-xl text-2xs font-bold shadow-3xs">
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                            <div className="leading-tight">
                              <span className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider block">Induction Assigned</span>
                              <span>Inducted at <strong className="font-extrabold text-slate-800">{enq.inductionCompany}</strong> on <span className="font-mono">{enq.inductionDate}</span></span>
                            </div>
                          </div>
                        )}

                        {enq.gpsRequired && (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-xl text-2xs font-bold shadow-3xs">
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                            <div className="leading-tight">
                              <span className="text-slate-400 font-extrabold uppercase text-[8px] tracking-wider block">GPS Fitting Assignment</span>
                              {enq.gpsRequired === 'Yes' ? (
                                <span>Fitted by <strong className="font-extrabold text-slate-800">{enq.gpsVendor}</strong> (IMEI: <strong className="font-mono text-slate-800">{enq.gpsImei || 'N/A'}</strong>) on <span className="font-mono">{enq.gpsFittingDate}</span></span>
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
                              <span>Route officially activated and started on <span className="font-mono font-extrabold">{enq.routeStartDate}</span></span>
                            </div>
                          </div>
                        )}

                        {/* --- ACTIVE STEP FORM --- */}
                        
                        {/* 1. Induction Form (if not completed) */}
                        {!enq.inductionCompleted && (
                          <div className="p-4 rounded-xl border border-indigo-150 bg-white shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-wide">
                                Step 1 Action: Configure Induction Assignment
                              </h5>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700">IN PROGRESS</span>
                            </div>
                            <p className="text-3xs text-slate-500">Please assign this vehicle to a client/reputed company below to record their induction details:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Reputed Company *</label>
                                <select
                                  value={step1Company[enq.id] || ''}
                                  onChange={(e) => setStep1Company({ ...step1Company, [enq.id]: e.target.value })}
                                  className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
                                <label className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Induction Date *</label>
                                <input
                                  type="date"
                                  value={step1Date[enq.id] || new Date().toISOString().substring(0, 10)}
                                  onChange={(e) => setStep1Date({ ...step1Date, [enq.id]: e.target.value })}
                                  className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveStep1(enq.id)}
                              className="w-full mt-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold uppercase rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" /> Save Assignment
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
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Name & Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh (9876543210)"
                      value={editingEnq.ownerNamePhone || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, ownerNamePhone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none"
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
                  <div className="lg:col-span-3">
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Enquiry Remarks</label>
                    <textarea
                      placeholder="Enter remarks/notes about this vehicle or crew..."
                      value={editingEnq.remarks || ''}
                      onChange={(e) => setEditingEnq({ ...editingEnq, remarks: e.target.value })}
                      rows={2}
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
                            onChange={(e) => setPromoteForm({ ...promoteForm, model: e.target.value })}
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
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Linked Owner Profile</label>
                      <select
                        value={promoteForm.ownerId}
                        onChange={(e) =>
                          setPromoteForm({
                            ...promoteForm,
                            ownerId: e.target.value,
                            createOwner: e.target.value === 'new',
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="new">+ Create New Owner Profile</option>
                        {owners.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    {promoteForm.ownerId === 'new' && (
                      <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Owner Full Name *</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.ownerName}
                            onChange={(e) => setPromoteForm({ ...promoteForm, ownerName: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Mobile number *</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.ownerPhone}
                            onChange={(e) => setPromoteForm({ ...promoteForm, ownerPhone: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Driver Crew Profile */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">3. Driver Master</h4>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Linked Driver Profile</label>
                      <select
                        value={promoteForm.driverId}
                        onChange={(e) =>
                          setPromoteForm({
                            ...promoteForm,
                            driverId: e.target.value,
                            createDriver: e.target.value === 'new',
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                      >
                        <option value="new">+ Create New Driver Profile</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    {promoteForm.driverId === 'new' && (
                      <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Full Name *</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.driverName}
                            onChange={(e) => setPromoteForm({ ...promoteForm, driverName: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Mobile *</label>
                          <input
                            type="text"
                            required
                            value={promoteForm.driverPhone}
                            onChange={(e) => setPromoteForm({ ...promoteForm, driverPhone: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Driver Address</label>
                          <input
                            type="text"
                            value={promoteForm.driverAddress}
                            onChange={(e) => setPromoteForm({ ...promoteForm, driverAddress: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>
                      </div>
                    )}
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
                Delete Induction Vehicle
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Are you sure you want to delete this vehicle from the Induction stage? This action cannot be undone and will remove all entered details.
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
                Yes, Delete
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
    </div>
  );
}
