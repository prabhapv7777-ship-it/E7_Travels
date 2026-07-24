import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RotateCcw,
  Save,
  Check,
  X,
  Car,
  Zap,
  Truck,
  ShieldAlert,
  ArrowRight,
  Layers,
  Sparkles,
  Printer,
  DollarSign,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Scale,
  Percent,
  HelpCircle,
  Repeat
} from 'lucide-react';
import { SlabRate, RateSource, RateCategory, KmSlabRow, PackageDetails, FlatRateDetails } from '../types';

// Default initial slab rates with Dual Rates (Vendor Company Rate & Direct Driver Rate)
const DEFAULT_SLAB_RATES: SlabRate[] = [
  {
    id: 'SLAB-001',
    slabName: 'Corporate Sedan Standard Slab (TCS)',
    rateSource: 'Dual Rate (Vendor & Direct)',
    companyName: 'TCS',
    vehicleType: 'Sedan',
    applicableVehicles: ['Sedan', 'SUV'],
    rateCategory: 'Kilometer Slab',
    isTwoWayKm: true,
    kmType: 'Two Way KM',
    kmSlabs: [
      { id: 'km-1', fromKm: 0, toKm: 10, vendorAmount: 250, directAmount: 200 },
      { id: 'km-2', fromKm: 10, toKm: 20, vendorAmount: 450, directAmount: 360 },
      { id: 'km-3', fromKm: 20, toKm: 30, vendorAmount: 650, directAmount: 520 },
      { id: 'km-4', fromKm: 30, toKm: 40, vendorAmount: 850, directAmount: 680 },
      { id: 'km-5', fromKm: 40, toKm: 50, vendorAmount: 1050, directAmount: 840 },
      { id: 'km-6', fromKm: 50, toKm: '50+', vendorAmount: 22, directAmount: 18 },
    ],
    status: 'Active',
    createdDate: '2026-01-15',
    description: 'TCS Company rate card (Sedan & SUV provided by company). Two Way KM billing calculation.',
  },
  {
    id: 'SLAB-002',
    slabName: 'Monthly Executive SUV Contract (Amazon)',
    rateSource: 'Dual Rate (Vendor & Direct)',
    companyName: 'Amazon',
    vehicleType: 'SUV',
    applicableVehicles: ['Sedan', 'SUV', 'EV', 'Tempo Traveller'],
    rateCategory: 'Package',
    isTwoWayKm: false,
    kmType: 'One Way KM',
    packageDetails: {
      packageName: 'Monthly Executive 2000 KM Package',
      includedKm: 2000,
      vendorPackageAmount: 38000,
      directPackageAmount: 32000,
      vendorExtraKmRate: 18,
      directExtraKmRate: 15,
      description: 'Monthly executive contract: Company Rate ₹38,000 vs Driver Payout ₹32,000 (Company Margin ₹6,000)',
    },
    status: 'Active',
    createdDate: '2026-02-01',
    description: 'Amazon corporate contract providing Sedan, SUV, EV, & Tempo Traveller slabs.',
  },
  {
    id: 'SLAB-003',
    slabName: 'EV Airport Transfer Fixed Tariff (Optum)',
    rateSource: 'Dual Rate (Vendor & Direct)',
    companyName: 'Optum',
    vehicleType: 'EV',
    applicableVehicles: ['Sedan', 'SUV', 'EV'],
    rateCategory: 'Flat Rate',
    isTwoWayKm: true,
    kmType: 'Two Way KM',
    flatRateDetails: {
      tripName: 'Airport Drop & Pickup',
      vendorFlatAmount: 1200,
      directFlatAmount: 950,
      description: 'Point-to-point airport transfer: Company Rate ₹1,200 vs Driver Rate ₹950 (Company Margin ₹250)',
    },
    status: 'Active',
    createdDate: '2026-03-10',
    description: 'Optum Health zero-emission EV airport transfers with Two Way KM options.',
  },
  {
    id: 'SLAB-004',
    slabName: 'Outstation Tempo Traveller Slab (Amazon)',
    rateSource: 'Dual Rate (Vendor & Direct)',
    companyName: 'Amazon',
    vehicleType: 'Tempo Traveller',
    applicableVehicles: ['Sedan', 'SUV', 'EV', 'Tempo Traveller'],
    rateCategory: 'Kilometer Slab',
    isTwoWayKm: true,
    kmType: 'Two Way KM',
    kmSlabs: [
      { id: 'km-tt-1', fromKm: 0, toKm: 50, vendorAmount: 1800, directAmount: 1500 },
      { id: 'km-tt-2', fromKm: 50, toKm: 100, vendorAmount: 3200, directAmount: 2700 },
      { id: 'km-tt-3', fromKm: 100, toKm: 150, vendorAmount: 4800, directAmount: 4000 },
      { id: 'km-tt-4', fromKm: 150, toKm: 200, vendorAmount: 6200, directAmount: 5200 },
      { id: 'km-tt-5', fromKm: 200, toKm: '200+', vendorAmount: 28, directAmount: 24 },
    ],
    status: 'Active',
    createdDate: '2026-04-05',
    description: 'Amazon Outstation long distance Company Rate vs Driver Payout for 12/17 seater TTs.',
  },
  {
    id: 'SLAB-005',
    slabName: 'SUV Local Sightseeing 8Hr/80Km (Cognizant)',
    rateSource: 'Dual Rate (Vendor & Direct)',
    companyName: 'Cognizant',
    vehicleType: 'SUV',
    applicableVehicles: ['Sedan', 'SUV'],
    rateCategory: 'Package',
    packageDetails: {
      packageName: 'Local Sightseeing Package',
      includedKm: 80,
      vendorPackageAmount: 3500,
      directPackageAmount: 2900,
      vendorExtraKmRate: 20,
      directExtraKmRate: 16,
      description: '8 Hours / 80 KM local tour: Company Rate ₹3,500 vs Driver Rate ₹2,900',
    },
    status: 'Inactive',
    createdDate: '2026-05-12',
    description: 'Cognizant OMR Campus sightseeing package rate card.',
  },
];

export default function SlabRateManagement() {
  // Rates state
  const [slabRates, setSlabRates] = useState<SlabRate[]>(() => {
    try {
      const saved = localStorage.getItem('e7_travels_slab_rates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize legacy data if needed
          return parsed.map((item: any) => {
            if (item.kmSlabs) {
              item.kmSlabs = item.kmSlabs.map((row: any) => ({
                ...row,
                vendorAmount: row.vendorAmount !== undefined ? row.vendorAmount : (row.amount || 0),
                directAmount: row.directAmount !== undefined ? row.directAmount : (row.amount ? Math.round(row.amount * 0.8) : 0),
              }));
            }
            if (item.packageDetails) {
              item.packageDetails.vendorPackageAmount = item.packageDetails.vendorPackageAmount !== undefined ? item.packageDetails.vendorPackageAmount : (item.packageDetails.packageAmount || 0);
              item.packageDetails.directPackageAmount = item.packageDetails.directPackageAmount !== undefined ? item.packageDetails.directPackageAmount : (item.packageDetails.packageAmount ? Math.round(item.packageDetails.packageAmount * 0.82) : 0);
              item.packageDetails.vendorExtraKmRate = item.packageDetails.vendorExtraKmRate !== undefined ? item.packageDetails.vendorExtraKmRate : (item.packageDetails.extraKmRate || 18);
              item.packageDetails.directExtraKmRate = item.packageDetails.directExtraKmRate !== undefined ? item.packageDetails.directExtraKmRate : 15;
            }
            if (item.flatRateDetails) {
              item.flatRateDetails.vendorFlatAmount = item.flatRateDetails.vendorFlatAmount !== undefined ? item.flatRateDetails.vendorFlatAmount : (item.flatRateDetails.flatAmount || 0);
              item.flatRateDetails.directFlatAmount = item.flatRateDetails.directFlatAmount !== undefined ? item.flatRateDetails.directFlatAmount : (item.flatRateDetails.flatAmount ? Math.round(item.flatRateDetails.flatAmount * 0.8) : 0);
            }
            if (!item.rateSource || item.rateSource === 'Direct Rate' || item.rateSource === 'Vendor Rate') {
              item.rateSource = 'Dual Rate (Vendor & Direct)';
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.error('Error loading slab rates from localStorage:', e);
    }
    return DEFAULT_SLAB_RATES;
  });

  // Save to localStorage whenever slabRates changes
  useEffect(() => {
    try {
      localStorage.setItem('e7_travels_slab_rates', JSON.stringify(slabRates));
    } catch (e) {
      console.error('Error saving slab rates to localStorage:', e);
    }
  }, [slabRates]);

  // Toast / notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Company & Multi-Vehicle Allocation State
  const PRESET_COMPANIES = ['TCS', 'Amazon', 'Optum', 'Cognizant', 'Walmart', 'AstraZeneca', 'Standard / All Companies'];
  const AVAILABLE_VEHICLES = ['Sedan', 'SUV', 'EV', 'Tempo Traveller'];

  const [companyChoice, setCompanyChoice] = useState<string>('TCS');
  const [customCompanyName, setCustomCompanyName] = useState<string>('');
  const [applicableVehicles, setApplicableVehicles] = useState<string[]>(['Sedan', 'SUV']);

  // View Mode: 'table' vs 'matrix' (Company Directory)
  const [viewMode, setViewMode] = useState<'table' | 'matrix'>('table');
  const [filterCompany, setFilterCompany] = useState<string>('All');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slabName, setSlabName] = useState<string>('');
  const [rateSource, setRateSource] = useState<RateSource>('Dual Rate (Vendor & Direct)');
  const [vehicleType, setVehicleType] = useState<string>('Sedan');
  const [rateCategory, setRateCategory] = useState<RateCategory>('Kilometer Slab');
  const [isTwoWayKm, setIsTwoWayKm] = useState<boolean>(false);
  const [kmType, setKmType] = useState<'One Way KM' | 'Two Way KM'>('One Way KM');
  const [description, setDescription] = useState<string>('');

  // Dual Rate KM Slabs State
  const [kmSlabs, setKmSlabs] = useState<KmSlabRow[]>([
    { id: '1', fromKm: 0, toKm: 10, vendorAmount: 250, directAmount: 200 },
    { id: '2', fromKm: 10, toKm: 20, vendorAmount: 450, directAmount: 360 },
    { id: '3', fromKm: 20, toKm: 30, vendorAmount: 650, directAmount: 520 },
    { id: '4', fromKm: 30, toKm: 40, vendorAmount: 850, directAmount: 680 },
    { id: '5', fromKm: 40, toKm: 50, vendorAmount: 1050, directAmount: 840 },
    { id: '6', fromKm: 50, toKm: '50+', vendorAmount: 22, directAmount: 18 },
  ]);

  // Dual Rate Package State
  const [packageName, setPackageName] = useState<string>('Monthly Executive Package');
  const [includedKm, setIncludedKm] = useState<number>(2000);
  const [vendorPackageAmount, setVendorPackageAmount] = useState<number>(38000);
  const [directPackageAmount, setDirectPackageAmount] = useState<number>(32000);
  const [vendorExtraKmRate, setVendorExtraKmRate] = useState<number>(18);
  const [directExtraKmRate, setDirectExtraKmRate] = useState<number>(15);
  const [packageDesc, setPackageDesc] = useState<string>('');

  // Dual Rate Flat Rate State
  const [tripName, setTripName] = useState<string>('Airport Drop');
  const [vendorFlatAmount, setVendorFlatAmount] = useState<number>(1200);
  const [directFlatAmount, setDirectFlatAmount] = useState<number>(950);
  const [flatDesc, setFlatDesc] = useState<string>('');

  // Form Validation
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('All');
  const [filterVehicle, setFilterVehicle] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterKmType, setFilterKmType] = useState<string>('All');

  // Modal / Drawer state for full side-by-side comparison
  const [viewingSlab, setViewingSlab] = useState<SlabRate | null>(null);

  // Delete confirmation modal state
  const [deletingSlab, setDeletingSlab] = useState<{ id: string; name: string } | null>(null);

  // Helper to reset form
  const resetForm = () => {
    setEditingId(null);
    setSlabName('');
    setCompanyChoice('TCS');
    setCustomCompanyName('');
    setApplicableVehicles(['Sedan', 'SUV']);
    setRateSource('Dual Rate (Vendor & Direct)');
    setVehicleType('Sedan');
    setRateCategory('Kilometer Slab');
    setIsTwoWayKm(false);
    setKmType('One Way KM');
    setDescription('');
    setKmSlabs([
      { id: '1', fromKm: 0, toKm: 10, vendorAmount: 250, directAmount: 200 },
      { id: '2', fromKm: 10, toKm: 20, vendorAmount: 450, directAmount: 360 },
      { id: '3', fromKm: 20, toKm: 30, vendorAmount: 650, directAmount: 520 },
      { id: '4', fromKm: 30, toKm: 40, vendorAmount: 850, directAmount: 680 },
      { id: '5', fromKm: 40, toKm: 50, vendorAmount: 1050, directAmount: 840 },
      { id: '6', fromKm: 50, toKm: '50+', vendorAmount: 22, directAmount: 18 },
    ]);
    setPackageName('Monthly Executive Package');
    setIncludedKm(2000);
    setVendorPackageAmount(38000);
    setDirectPackageAmount(32000);
    setVendorExtraKmRate(18);
    setDirectExtraKmRate(15);
    setPackageDesc('');
    setTripName('Airport Drop');
    setVendorFlatAmount(1200);
    setDirectFlatAmount(950);
    setFlatDesc('');
    setFormErrors({});
  };

  // Populate form for Editing
  const handleEdit = (slab: SlabRate) => {
    setEditingId(slab.id);
    setSlabName(slab.slabName);

    const existingComp = slab.companyName || 'Standard / All Companies';
    if (PRESET_COMPANIES.includes(existingComp)) {
      setCompanyChoice(existingComp);
      setCustomCompanyName('');
    } else {
      setCompanyChoice('Custom');
      setCustomCompanyName(existingComp);
    }

    setApplicableVehicles(
      slab.applicableVehicles && slab.applicableVehicles.length > 0
        ? slab.applicableVehicles
        : [slab.vehicleType]
    );

    setRateSource(slab.rateSource || 'Dual Rate (Vendor & Direct)');
    setVehicleType(slab.vehicleType);
    setRateCategory(slab.rateCategory);
    setIsTwoWayKm(Boolean(slab.isTwoWayKm || slab.kmType === 'Two Way KM'));
    setKmType(slab.kmType || (slab.isTwoWayKm ? 'Two Way KM' : 'One Way KM'));
    setDescription(slab.description || '');

    if (slab.rateCategory === 'Kilometer Slab' && slab.kmSlabs) {
      setKmSlabs(
        slab.kmSlabs.map((row) => ({
          ...row,
          vendorAmount: row.vendorAmount !== undefined ? row.vendorAmount : (row.amount || 0),
          directAmount: row.directAmount !== undefined ? row.directAmount : (row.amount ? Math.round(row.amount * 0.8) : 0),
        }))
      );
    } else if (slab.rateCategory === 'Package' && slab.packageDetails) {
      setPackageName(slab.packageDetails.packageName);
      setIncludedKm(slab.packageDetails.includedKm);
      setVendorPackageAmount(
        slab.packageDetails.vendorPackageAmount !== undefined
          ? slab.packageDetails.vendorPackageAmount
          : (slab.packageDetails.packageAmount || 0)
      );
      setDirectPackageAmount(
        slab.packageDetails.directPackageAmount !== undefined
          ? slab.packageDetails.directPackageAmount
          : (slab.packageDetails.packageAmount ? Math.round(slab.packageDetails.packageAmount * 0.82) : 0)
      );
      setVendorExtraKmRate(slab.packageDetails.vendorExtraKmRate || (slab.packageDetails.extraKmRate || 18));
      setDirectExtraKmRate(slab.packageDetails.directExtraKmRate || 15);
      setPackageDesc(slab.packageDetails.description || '');
    } else if (slab.rateCategory === 'Flat Rate' && slab.flatRateDetails) {
      setTripName(slab.flatRateDetails.tripName);
      setVendorFlatAmount(
        slab.flatRateDetails.vendorFlatAmount !== undefined
          ? slab.flatRateDetails.vendorFlatAmount
          : (slab.flatRateDetails.flatAmount || 0)
      );
      setDirectFlatAmount(
        slab.flatRateDetails.directFlatAmount !== undefined
          ? slab.flatRateDetails.directFlatAmount
          : (slab.flatRateDetails.flatAmount ? Math.round(slab.flatRateDetails.flatAmount * 0.8) : 0)
      );
      setFlatDesc(slab.flatRateDetails.description || '');
    }

    setFormErrors({});
    const formEl = document.getElementById('slab-rate-form-container');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Duplicate slab
  const handleDuplicate = (slab: SlabRate) => {
    handleEdit(slab);
    setEditingId(null);
    setSlabName(`${slab.slabName} (Copy)`);
    showToast(`Duplicated "${slab.slabName}" into template form. Adjust details and click Save.`);
  };

  // Delete slab
  const handleDelete = (id: string, name: string) => {
    setDeletingSlab({ id, name });
  };

  // Confirm delete slab
  const confirmDeleteSlab = () => {
    if (!deletingSlab) return;
    const { id, name } = deletingSlab;
    setSlabRates((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    showToast(`Slab rate "${name}" deleted successfully.`);
    setDeletingSlab(null);
  };

  // Toggle active/inactive
  const handleToggleStatus = (id: string) => {
    setSlabRates((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
          showToast(`Slab "${item.slabName}" set to ${nextStatus}.`);
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  // Add Row to KM Slab table
  const handleAddKmRow = () => {
    setKmSlabs((prev) => {
      const lastRow = prev[prev.length - 1];
      let newFromKm = 0;
      if (lastRow) {
        if (typeof lastRow.toKm === 'number') {
          newFromKm = lastRow.toKm;
        } else {
          const matched = String(lastRow.toKm).match(/\d+/);
          newFromKm = matched ? parseInt(matched[0], 10) : 50;
        }
      }
      const newToKm = newFromKm + 10;
      const lastVendor = lastRow ? Number(lastRow.vendorAmount || 0) : 200;
      const lastDirect = lastRow ? Number(lastRow.directAmount || 0) : 250;
      return [
        ...prev,
        {
          id: String(Date.now()),
          fromKm: newFromKm,
          toKm: newToKm,
          vendorAmount: lastVendor + 120,
          directAmount: lastDirect + 150,
        },
      ];
    });
  };

  // Remove Row from KM Slab table
  const handleRemoveKmRow = (rowId: string) => {
    if (kmSlabs.length <= 1) {
      showToast('At least one kilometer slab row is required.');
      return;
    }
    setKmSlabs((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Update KM Row fields
  const handleKmRowChange = (rowId: string, field: keyof KmSlabRow, value: any) => {
    setKmSlabs((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  // Validate Form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!slabName.trim()) {
      errors.slabName = 'Slab Name is required';
    }

    if (rateCategory === 'Package') {
      if (!packageName.trim()) errors.packageName = 'Package Name is required';
      if (!includedKm || includedKm <= 0) errors.includedKm = 'Included KM must be greater than 0';
      if (rateSource !== 'Vendor Rate' && (!directPackageAmount || directPackageAmount <= 0)) {
        errors.directPackageAmount = 'Direct Package Amount is required';
      }
      if (rateSource !== 'Direct Rate' && (!vendorPackageAmount || vendorPackageAmount <= 0)) {
        errors.vendorPackageAmount = 'Vendor Package Amount is required';
      }
    } else if (rateCategory === 'Flat Rate') {
      if (!tripName.trim()) errors.tripName = 'Trip Name is required';
      if (rateSource !== 'Vendor Rate' && (!directFlatAmount || directFlatAmount <= 0)) {
        errors.directFlatAmount = 'Direct Flat Amount is required';
      }
      if (rateSource !== 'Direct Rate' && (!vendorFlatAmount || vendorFlatAmount <= 0)) {
        errors.vendorFlatAmount = 'Vendor Flat Amount is required';
      }
    } else if (rateCategory === 'Kilometer Slab') {
      if (kmSlabs.length === 0) {
        errors.kmSlabs = 'At least one slab row is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save or Update Submit
  const handleSaveSlab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const today = new Date().toISOString().split('T')[0];
    const effectiveCompany = companyChoice === 'Custom' ? customCompanyName.trim() : companyChoice;

    const newSlabItem: SlabRate = {
      id: editingId || `SLAB-${String(Date.now()).slice(-4)}`,
      slabName: slabName.trim(),
      rateSource,
      companyName: effectiveCompany || 'Standard / All Companies',
      vehicleType,
      applicableVehicles: applicableVehicles.length > 0 ? applicableVehicles : [vehicleType],
      rateCategory,
      isTwoWayKm: isTwoWayKm || kmType === 'Two Way KM',
      kmType: kmType,
      status: 'Active',
      createdDate: editingId
        ? slabRates.find((s) => s.id === editingId)?.createdDate || today
        : today,
      updatedDate: today,
      description: description.trim(),
    };

    if (rateCategory === 'Kilometer Slab') {
      newSlabItem.kmSlabs = kmSlabs;
    } else if (rateCategory === 'Package') {
      newSlabItem.packageDetails = {
        packageName: packageName.trim(),
        includedKm: Number(includedKm),
        vendorPackageAmount: Number(vendorPackageAmount || 0),
        directPackageAmount: Number(directPackageAmount || 0),
        vendorExtraKmRate: Number(vendorExtraKmRate || 0),
        directExtraKmRate: Number(directExtraKmRate || 0),
        description: packageDesc.trim(),
      };
    } else if (rateCategory === 'Flat Rate') {
      newSlabItem.flatRateDetails = {
        tripName: tripName.trim(),
        vendorFlatAmount: Number(vendorFlatAmount || 0),
        directFlatAmount: Number(directFlatAmount || 0),
        description: flatDesc.trim(),
      };
    }

    if (editingId) {
      setSlabRates((prev) =>
        prev.map((item) => (item.id === editingId ? newSlabItem : item))
      );
      showToast(`Slab rate "${newSlabItem.slabName}" updated for ${newSlabItem.companyName}!`);
    } else {
      setSlabRates((prev) => [newSlabItem, ...prev]);
      showToast(`New slab rate "${newSlabItem.slabName}" created for ${newSlabItem.companyName}!`);
    }

    resetForm();
  };

  // Filtered Slab Rates List
  const filteredRates = slabRates.filter((item) => {
    const matchesSearch =
      item.slabName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.companyName && item.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource =
      filterSource === 'All' ||
      (filterSource === 'Dual' && item.rateSource.includes('Dual')) ||
      item.rateSource === filterSource;

    const matchesVehicle =
      filterVehicle === 'All' ||
      item.vehicleType === filterVehicle ||
      (item.applicableVehicles && item.applicableVehicles.includes(filterVehicle));

    const matchesCategory = filterCategory === 'All' || item.rateCategory === filterCategory;

    const matchesKmType =
      filterKmType === 'All' ||
      (filterKmType === 'Two Way KM' && (item.isTwoWayKm || item.kmType === 'Two Way KM')) ||
      (filterKmType === 'One Way KM' && (!item.isTwoWayKm && item.kmType !== 'Two Way KM'));

    const matchesCompany =
      filterCompany === 'All' ||
      item.companyName === filterCompany ||
      (!item.companyName && filterCompany === 'Standard / All Companies');

    return matchesSearch && matchesSource && matchesVehicle && matchesCategory && matchesKmType && matchesCompany;
  });

  // KPI Calculations
  const totalSlabsCount = slabRates.length;
  const activeCount = slabRates.filter((s) => s.status === 'Active').length;

  // Calculate average company profit margin across all active dual slabs (Vendor Company Rate - Direct Driver Rate)
  const calculateSlabProfit = (slab: SlabRate) => {
    if (slab.rateCategory === 'Kilometer Slab' && slab.kmSlabs && slab.kmSlabs.length > 0) {
      let totalDiff = 0;
      let count = 0;
      slab.kmSlabs.forEach((row) => {
        totalDiff += (row.vendorAmount || 0) - (row.directAmount || 0);
        count++;
      });
      return count > 0 ? Math.round(totalDiff / count) : 0;
    } else if (slab.rateCategory === 'Package' && slab.packageDetails) {
      return (slab.packageDetails.vendorPackageAmount || 0) - (slab.packageDetails.directPackageAmount || 0);
    } else if (slab.rateCategory === 'Flat Rate' && slab.flatRateDetails) {
      return (slab.flatRateDetails.vendorFlatAmount || 0) - (slab.flatRateDetails.directFlatAmount || 0);
    }
    return 0;
  };

  // Compute total profit margin across active slabs
  const totalEstimatedMargin = slabRates
    .filter((s) => s.status === 'Active')
    .reduce((acc, curr) => acc + calculateSlabProfit(curr), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Slab Rate Management
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-4xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-widest flex items-center gap-1">
                  <ArrowRightLeft className="h-3 w-3" /> Vendor (Company) vs Direct (Driver)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Vendor Rate = Company Rate billed to client | Direct Rate = Price given to driver | Difference = Company Profit Margin
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              const el = document.getElementById('slab-rate-form-container');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Dual-Rate Slab
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Total Tariff Slabs</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalSlabsCount}</p>
            <p className="text-4xs text-slate-500 mt-0.5 font-medium">Configured rate matrices</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Company Rate (Vendor)</p>
            <p className="text-2xl font-black text-blue-700 mt-1">
              {slabRates.filter(s => s.rateCategory === 'Kilometer Slab').length} Slabs
            </p>
            <p className="text-4xs text-blue-600 mt-0.5 font-medium">Client billing matrix</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Driver Rate (Direct)</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {slabRates.filter(s => s.rateCategory === 'Package' || s.rateCategory === 'Flat Rate').length} Packages
            </p>
            <p className="text-4xs text-emerald-600 mt-0.5 font-medium">Driver payout matrix</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Truck className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Two Way KM Option */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-indigo-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-3xs font-bold text-indigo-600 uppercase tracking-wider">Two Way KM Slabs</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">
              {slabRates.filter(s => s.isTwoWayKm || s.kmType === 'Two Way KM').length} Slabs
            </p>
            <p className="text-4xs text-indigo-700 mt-0.5 font-medium">Round trip KM calculation</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Repeat className="h-6 w-6" />
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Avg Company Margin</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              +₹{totalEstimatedMargin > 0 ? (totalEstimatedMargin / (activeCount || 1)).toFixed(0) : 0}
            </p>
            <p className="text-4xs text-emerald-700 mt-0.5 font-semibold">Net profit per slab (Vendor - Direct)</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* CREATE / EDIT SLAB FORM CONTAINER */}
      <div 
        id="slab-rate-form-container"
        className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 relative overflow-hidden transition-all duration-300"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white font-bold text-xs ${editingId ? 'bg-indigo-600' : 'bg-blue-600'}`}>
              {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                {editingId ? 'Update Existing Slab Rate' : 'Create Unified Slab Rate (Vendor & Direct)'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {editingId ? `Editing ID: ${editingId}` : 'Enter Vendor Payout and Direct Client billing side-by-side to calculate profit margins'}
              </p>
            </div>
          </div>

          {editingId && (
            <span className="bg-indigo-50 text-indigo-700 text-3xs font-bold px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Edit Mode Active
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSlab} className="space-y-8">
          
          {/* SECTION 1: SLAB NAME */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Section 1: Slab Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={slabName}
              onChange={(e) => {
                setSlabName(e.target.value);
                if (formErrors.slabName) setFormErrors((prev) => ({ ...prev, slabName: '' }));
              }}
              placeholder="e.g. Corporate Sedan Standard Slab / SUV Monthly Contract"
              className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                formErrors.slabName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300 bg-slate-50/50 focus:bg-white'
              }`}
            />
            {formErrors.slabName && (
              <p className="text-2xs font-semibold text-rose-500 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> {formErrors.slabName}
              </p>
            )}
          </div>

          {/* SECTION 1.5: COMPANY & VEHICLE ALLOCATION (COMPANY SPECIFIC VEHICLE COMBINATIONS) */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" /> Company & Vehicle Allocation
                </label>
                <p className="text-3xs text-slate-500 font-medium mt-0.5">
                  Link slab rate to a specific corporate client and select which vehicle types this company provides
                </p>
              </div>

              <span className="text-4xs font-black bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 uppercase tracking-wider">
                Multi-Vehicle Company Support
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Company Selection */}
              <div className="space-y-2">
                <label className="block text-3xs font-bold text-slate-700 uppercase tracking-wider">
                  Company / Client Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={companyChoice}
                  onChange={(e) => setCompanyChoice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {PRESET_COMPANIES.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp === 'Standard / All Companies' ? '🏢 Standard / All Companies' : `🏢 ${comp}`}
                    </option>
                  ))}
                  <option value="Custom">✏️ + Custom Company Name...</option>
                </select>

                {companyChoice === 'Custom' && (
                  <input
                    type="text"
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                    placeholder="Enter custom company name (e.g. Infosys, Wipro, Ford)"
                    className="w-full mt-2 px-4 py-2 rounded-xl border border-blue-300 bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>

              {/* Vehicles Provided by Company Checkboxes */}
              <div className="space-y-2">
                <label className="block text-3xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Vehicles Provided by this Company</span>
                  <span className="text-4xs text-blue-600 font-bold">
                    {applicableVehicles.length} Vehicles Selected
                  </span>
                </label>

                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_VEHICLES.map((v) => {
                    const isChecked = applicableVehicles.includes(v);
                    return (
                      <button
                        type="button"
                        key={v}
                        onClick={() => {
                          if (isChecked) {
                            if (applicableVehicles.length > 1) {
                              setApplicableVehicles(applicableVehicles.filter((item) => item !== v));
                            }
                          } else {
                            setApplicableVehicles([...applicableVehicles, v]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isChecked
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5 text-slate-400" />}
                        {v}
                      </button>
                    );
                  })}
                </div>
                <p className="text-4xs text-slate-500 font-medium">
                  e.g., TCS provides [Sedan, SUV] | Amazon provides [Sedan, SUV, EV, Tempo Traveller]
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: RATE SOURCE (REQUIRED - DUAL RATE HIGHLIGHTED) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Section 2: Rate Source Mode <span className="text-rose-500">*</span>
              </label>
              <span className="text-3xs text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                ★ Select "Dual Rate" to input and compare both rates in one single slab
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Option 1: Dual Rate (Vendor & Direct) - RECOMMENDED */}
              <label
                onClick={() => setRateSource('Dual Rate (Vendor & Direct)')}
                className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                  rateSource === 'Dual Rate (Vendor & Direct)'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-400'
                    : 'border-slate-200 bg-slate-50/30 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="rateSource"
                    checked={rateSource === 'Dual Rate (Vendor & Direct)'}
                    onChange={() => setRateSource('Dual Rate (Vendor & Direct)')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <ArrowRightLeft className="h-4 w-4 text-blue-600" /> Dual Rate (Company & Driver)
                    </p>
                    <p className="text-4xs text-slate-500 font-medium mt-0.5">
                      Vendor Rate (Company) + Direct Rate (Driver) for profit margin analysis
                    </p>
                  </div>
                </div>
                <span className="text-4xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase">
                  Single Slab
                </span>
              </label>

              {/* Option 2: Vendor Rate Only (Company Rate) */}
              <label
                onClick={() => setRateSource('Vendor Rate')}
                className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                  rateSource === 'Vendor Rate'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/30 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="rateSource"
                    checked={rateSource === 'Vendor Rate'}
                    onChange={() => setRateSource('Vendor Rate')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-blue-600" /> Vendor Rate Only (Company)
                    </p>
                    <p className="text-4xs text-slate-500 font-medium mt-0.5">
                      Corporate client rate card billed by company
                    </p>
                  </div>
                </div>
              </label>

              {/* Option 3: Direct Rate Only (Driver Rate) */}
              <label
                onClick={() => setRateSource('Direct Rate')}
                className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                  rateSource === 'Direct Rate'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/30 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="rateSource"
                    checked={rateSource === 'Direct Rate'}
                    onChange={() => setRateSource('Direct Rate')}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-emerald-600" /> Direct Rate Only (Driver)
                    </p>
                    <p className="text-4xs text-slate-500 font-medium mt-0.5">
                      Driver payout price given to attached drivers
                    </p>
                  </div>
                </div>
              </label>

            </div>
          </div>

          {/* SECTION 3 & 4 GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SECTION 3: VEHICLE TYPE */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Section 3: Vehicle Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Sedan">Sedan (Dzire, Etios, Aura)</option>
                  <option value="SUV">SUV (Innova, Ertiga, Crysta)</option>
                  <option value="EV">EV (Tigor EV, Nexon EV, ZS EV)</option>
                  <option value="Tempo Traveller">Tempo Traveller (12/17/26 Seater)</option>
                  <option value="Hatchback">Hatchback (WagonR, Swift)</option>
                  <option value="Bus">Luxury Bus (32/45 Seater)</option>
                </select>
                <div className="absolute right-3.5 top-3 pointer-events-none text-slate-400">
                  <Car className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* SECTION 4: RATE CATEGORY */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Section 4: Rate Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={rateCategory}
                  onChange={(e) => setRateCategory(e.target.value as RateCategory)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Kilometer Slab">Kilometer Slab (Tiered Distance)</option>
                  <option value="Package">Package (Monthly / Fixed KM Bundle)</option>
                  <option value="Flat Rate">Flat Rate (Fixed Trip Tariff)</option>
                </select>
                <div className="absolute right-3.5 top-3 pointer-events-none text-slate-400">
                  <Tags className="h-4 w-4" />
                </div>
              </div>
            </div>

          </div>

          {/* SECTION 5: KM CALCULATION MODE (TWO WAY KM OPTION) */}
          <div className="space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-indigo-600" /> Section 5: Kilometer Calculation Mode (Two Way KM Option)
                </label>
                <p className="text-3xs text-slate-500 font-medium mt-0.5">
                  Select whether company rate is calculated on One Way KM or Two Way KM (To & Fro Round Trip)
                </p>
              </div>

              <span className="text-4xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md border border-indigo-200 uppercase tracking-wide">
                Company Provision
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: One Way KM */}
              <label
                onClick={() => {
                  setKmType('One Way KM');
                  setIsTwoWayKm(false);
                }}
                className={`cursor-pointer p-3.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                  kmType === 'One Way KM' && !isTwoWayKm
                    ? 'border-blue-600 bg-white shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="kmType"
                    checked={kmType === 'One Way KM' && !isTwoWayKm}
                    onChange={() => {
                      setKmType('One Way KM');
                      setIsTwoWayKm(false);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <ArrowRight className="h-4 w-4 text-blue-600" /> One Way KM (Single Direction)
                    </p>
                    <p className="text-4xs text-slate-500 font-medium mt-0.5">
                      Standard single direction distance calculation
                    </p>
                  </div>
                </div>
              </label>

              {/* Option 2: Two Way KM */}
              <label
                onClick={() => {
                  setKmType('Two Way KM');
                  setIsTwoWayKm(true);
                }}
                className={`cursor-pointer p-3.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                  kmType === 'Two Way KM' || isTwoWayKm
                    ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-400'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="kmType"
                    checked={kmType === 'Two Way KM' || isTwoWayKm}
                    onChange={() => {
                      setKmType('Two Way KM');
                      setIsTwoWayKm(true);
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                      <Repeat className="h-4 w-4 text-indigo-600" /> Two Way KM (Round Trip / To & Fro)
                    </p>
                    <p className="text-4xs text-indigo-700 font-medium mt-0.5">
                      Distance is calculated for both directions (2 x Base Distance) as provided by company
                    </p>
                  </div>
                </div>
                <span className="text-4xs font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded uppercase">
                  2-WAY KM
                </span>
              </label>
            </div>

            {/* Quick Toggle Checkbox */}
            <div className="pt-1.5 flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTwoWayKm || kmType === 'Two Way KM'}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsTwoWayKm(checked);
                    setKmType(checked ? 'Two Way KM' : 'One Way KM');
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-slate-800">
                  Enable Two Way KM Billing Option for this Company Rate Slab
                </span>
              </label>
            </div>
          </div>

          {/* DYNAMIC RATE INPUT SECTION WITH SIDE-BY-SIDE VENDOR & DIRECT COMPARISON */}
          <div className="bg-slate-50/80 p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4">
            
            {/* IF RATE CATEGORY = Kilometer Slab */}
            {rateCategory === 'Kilometer Slab' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-600" /> Kilometer Slab Rate Comparison Matrix
                    </h3>
                    <p className="text-3xs text-slate-500 font-medium">
                      Vendor Rate = Company Rate billed to client | Direct Rate = Driver payout price
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddKmRow}
                    className="self-start sm:self-auto flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Slab Row
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-3xs uppercase tracking-wider">
                        <th className="py-3 px-3 w-10 text-center">#</th>
                        <th className="py-3 px-3 w-28">From KM</th>
                        <th className="py-3 px-3 w-28">To KM</th>
                        <th className="py-3 px-3 text-blue-800 bg-blue-50/60">
                          <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> Vendor Rate (Company) (₹)</span>
                        </th>
                        <th className="py-3 px-3 text-emerald-800 bg-emerald-50/60">
                          <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Direct Rate (Driver) (₹)</span>
                        </th>
                        <th className="py-3 px-3 text-indigo-800 bg-indigo-50/60 font-black">
                          <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Company Margin (Vendor - Direct)</span>
                        </th>
                        <th className="py-3 px-3 text-center w-16">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kmSlabs.map((row, idx) => {
                        const diff = (Number(row.vendorAmount) || 0) - (Number(row.directAmount) || 0);
                        const marginPercent = Number(row.vendorAmount) > 0 
                          ? ((diff / Number(row.vendorAmount)) * 100).toFixed(1)
                          : '0.0';

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-bold text-3xs">
                              {idx + 1}
                            </td>

                            {/* From KM */}
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                value={row.fromKm}
                                onChange={(e) => handleKmRowChange(row.id, 'fromKm', Number(e.target.value))}
                                className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>

                            {/* To KM */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={row.toKm}
                                onChange={(e) => handleKmRowChange(row.id, 'toKm', e.target.value)}
                                placeholder="e.g. 20 or 50+"
                                className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>

                            {/* Vendor Rate (Company Rate) */}
                            <td className="py-2.5 px-3 bg-blue-50/30">
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-blue-500 text-xs font-bold">₹</span>
                                <input
                                  type="number"
                                  value={row.vendorAmount}
                                  onChange={(e) => handleKmRowChange(row.id, 'vendorAmount', Number(e.target.value))}
                                  className="w-28 pl-6 pr-2 py-1.5 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            </td>

                            {/* Direct Rate (Driver Rate) */}
                            <td className="py-2.5 px-3 bg-emerald-50/30">
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-emerald-500 text-xs font-bold">₹</span>
                                <input
                                  type="number"
                                  value={row.directAmount}
                                  onChange={(e) => handleKmRowChange(row.id, 'directAmount', Number(e.target.value))}
                                  className="w-28 pl-6 pr-2 py-1.5 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </div>
                            </td>

                            {/* Difference / Company Margin */}
                            <td className="py-2.5 px-3 bg-indigo-50/30 font-bold">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-black ${
                                  diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-600' : 'text-slate-500'
                                }`}>
                                  {diff > 0 ? `+₹${diff}` : diff < 0 ? `-₹${Math.abs(diff)}` : '₹0'}
                                </span>
                                {diff !== 0 && (
                                  <span className={`text-4xs font-extrabold px-1.5 py-0.5 rounded ${
                                    diff > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {marginPercent}% Margin
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Delete Row */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveKmRow(row.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Row"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* IF RATE CATEGORY = Package */}
            {rateCategory === 'Package' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" /> Package Dual-Rate Configuration
                  </h3>
                  <p className="text-3xs text-slate-500 font-medium">Vendor Rate = Company Billing | Direct Rate = Driver Payout</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                      Package Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="e.g. Monthly Executive Package"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                      Included KM <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={includedKm}
                      onChange={(e) => setIncludedKm(Number(e.target.value))}
                      placeholder="e.g. 2000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* SIDE-BY-SIDE PACKAGE COMPARISON */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                  
                  {/* Vendor Side (Company Rate) */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                      <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-blue-700" /> Vendor Rate (Company Billing)
                      </span>
                      <span className="text-4xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Company</span>
                    </div>

                    <div>
                      <label className="block text-4xs font-bold text-blue-800 uppercase mb-1">
                        Vendor Package Rate (Company ₹)
                      </label>
                      <input
                        type="number"
                        value={vendorPackageAmount}
                        onChange={(e) => setVendorPackageAmount(Number(e.target.value))}
                        placeholder="e.g. 38000"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs font-bold text-blue-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-4xs font-bold text-blue-800 uppercase mb-1">
                        Vendor Extra KM Rate (Company ₹ / KM)
                      </label>
                      <input
                        type="number"
                        value={vendorExtraKmRate}
                        onChange={(e) => setVendorExtraKmRate(Number(e.target.value))}
                        placeholder="e.g. 18"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs font-semibold text-blue-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Direct Side (Driver Rate) */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-700" /> Direct Rate (Driver Payout)
                      </span>
                      <span className="text-4xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Driver</span>
                    </div>

                    <div>
                      <label className="block text-4xs font-bold text-emerald-800 uppercase mb-1">
                        Direct Package Rate (Driver ₹)
                      </label>
                      <input
                        type="number"
                        value={directPackageAmount}
                        onChange={(e) => setDirectPackageAmount(Number(e.target.value))}
                        placeholder="e.g. 32000"
                        className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-4xs font-bold text-emerald-800 uppercase mb-1">
                        Direct Extra KM Rate (Driver ₹ / KM)
                      </label>
                      <input
                        type="number"
                        value={directExtraKmRate}
                        onChange={(e) => setDirectExtraKmRate(Number(e.target.value))}
                        placeholder="e.g. 15"
                        className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                </div>

                {/* CALCULATED MARGIN BANNER FOR PACKAGE */}
                {vendorPackageAmount > 0 && directPackageAmount > 0 && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-extrabold text-slate-800">
                        Company Package Profit Margin:
                      </span>
                      <span className={`text-xs font-black ${
                        vendorPackageAmount - directPackageAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        ₹{vendorPackageAmount - directPackageAmount} profit
                      </span>
                    </div>
                    <span className="text-3xs font-bold text-indigo-700">
                      Extra KM Margin: +₹{vendorExtraKmRate - directExtraKmRate}/KM
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                    Package Notes / Terms
                  </label>
                  <input
                    type="text"
                    value={packageDesc}
                    onChange={(e) => setPackageDesc(e.target.value)}
                    placeholder="e.g. Inclusive of fuel, driver allowance, and taxes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* IF RATE CATEGORY = Flat Rate */}
            {rateCategory === 'Flat Rate' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" /> Point-to-Point Dual Flat Rate Details
                  </h3>
                  <p className="text-3xs text-slate-500 font-medium">Compare Vendor Rate (Company) vs Direct Rate (Driver)</p>
                </div>

                <div>
                  <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                    Trip / Route Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="e.g. Airport Drop & Pickup"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                    <label className="block text-3xs font-bold text-blue-900 uppercase mb-1">
                      Vendor Flat Rate (Company Rate ₹)
                    </label>
                    <input
                      type="number"
                      value={vendorFlatAmount}
                      onChange={(e) => setVendorFlatAmount(Number(e.target.value))}
                      placeholder="e.g. 1200"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs font-bold text-blue-900 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <label className="block text-3xs font-bold text-emerald-900 uppercase mb-1">
                      Direct Flat Rate (Driver Payout ₹)
                    </label>
                    <input
                      type="number"
                      value={directFlatAmount}
                      onChange={(e) => setDirectFlatAmount(Number(e.target.value))}
                      placeholder="e.g. 950"
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {vendorFlatAmount > 0 && directFlatAmount > 0 && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">
                      Flat Trip Company Margin:
                    </span>
                    <span className={`text-xs font-black ${
                      vendorFlatAmount - directFlatAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      +₹{vendorFlatAmount - directFlatAmount} Profit ({(((vendorFlatAmount - directFlatAmount) / vendorFlatAmount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                    Route Description
                  </label>
                  <input
                    type="text"
                    value={flatDesc}
                    onChange={(e) => setFlatDesc(e.target.value)}
                    placeholder="e.g. Includes toll charges and parking fees"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <div>
              <label className="block text-3xs font-bold text-slate-700 uppercase mb-1">
                Additional Notes / Tariff Remarks
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional internal remarks regarding this tariff slab..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          {/* SAVE SECTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md transition-all cursor-pointer ${
                  editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                }`}
              >
                <Save className="h-4 w-4" />
                {editingId ? 'Update Slab Rate' : 'Save Dual-Rate Slab'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" /> Cancel Edit
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Form
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* VIEW SWITCHER & SEARCH CONTROLS */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Company Name, Slab Name, Vehicle, or ID..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" /> Table View
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'matrix' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="h-4 w-4 text-blue-600" /> Company Slab Directory
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter by Company */}
            <div className="flex items-center gap-1">
              <span className="text-3xs font-bold text-slate-500">Company:</span>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-3xs font-extrabold bg-slate-50 text-slate-900 outline-none cursor-pointer focus:bg-white"
              >
                <option value="All">All Companies</option>
                {Array.from(new Set(slabRates.map((s) => s.companyName || 'Standard / All Companies'))).map((comp) => (
                  <option key={comp} value={comp}>
                    🏢 {comp}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Vehicle */}
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-3xs font-bold bg-white text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Vehicles</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="EV">EV</option>
              <option value="Tempo Traveller">Tempo Traveller</option>
            </select>

            {/* Filter by Category */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-3xs font-bold bg-white text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Kilometer Slab">Kilometer Slab</option>
              <option value="Package">Package</option>
              <option value="Flat Rate">Flat Rate</option>
            </select>

            {/* Filter by KM Calculation Type (Two Way KM) */}
            <select
              value={filterKmType}
              onChange={(e) => setFilterKmType(e.target.value)}
              className="px-3 py-1.5 border border-indigo-300 rounded-xl text-3xs font-extrabold bg-indigo-50/60 text-indigo-900 outline-none cursor-pointer"
            >
              <option value="All">All KM Types</option>
              <option value="One Way KM">One Way KM</option>
              <option value="Two Way KM">Two Way KM (2-Way)</option>
            </select>

            {(searchTerm || filterSource !== 'All' || filterVehicle !== 'All' || filterCategory !== 'All' || filterKmType !== 'All' || filterCompany !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSource('All');
                  setFilterVehicle('All');
                  setFilterCategory('All');
                  setFilterKmType('All');
                  setFilterCompany('All');
                }}
                className="px-2.5 py-1 text-3xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Reset Filters
              </button>
            )}
          </div>

          <div className="text-3xs font-bold text-slate-500">
            Showing <span className="text-slate-900 font-extrabold">{filteredRates.length}</span> Slabs Across <span className="text-blue-600 font-extrabold">{Array.from(new Set(filteredRates.map(s => s.companyName || 'Standard / All Companies'))).length}</span> Companies
          </div>
        </div>
      </div>

      {/* COMPANY SLAB DIRECTORY / MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <div className="space-y-6">
          {Array.from(new Set(filteredRates.map((s) => s.companyName || 'Standard / All Companies'))).length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Briefcase className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No company slab records found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            Array.from(new Set(filteredRates.map((s) => s.companyName || 'Standard / All Companies'))).map((companyName) => {
              const companySlabs = filteredRates.filter((s) => (s.companyName || 'Standard / All Companies') === companyName);
              const allCoveredVehicles = Array.from(
                new Set(
                  companySlabs.flatMap((s) => (s.applicableVehicles && s.applicableVehicles.length > 0 ? s.applicableVehicles : [s.vehicleType]))
                )
              );

              return (
                <div key={companyName} className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                  
                  {/* Company Card Header */}
                  <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600 rounded-xl text-white font-black">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{companyName}</h3>
                          <span className="text-4xs font-bold uppercase bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                            {companySlabs.length} Active Slabs
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Provided Vehicle Types: {allCoveredVehicles.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                        <span className="text-4xs font-bold text-slate-400 uppercase tracking-wider">Vehicles Provided:</span>
                        {AVAILABLE_VEHICLES.map((v) => {
                          const isProvided = allCoveredVehicles.includes(v);
                          return (
                            <span
                              key={v}
                              className={`px-2 py-0.5 rounded text-4xs font-black ${
                                isProvided
                                  ? 'bg-emerald-500 text-white shadow-2xs'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}
                            >
                              {v}
                            </span>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => {
                          const cName = String(companyName);
                          setCompanyChoice(PRESET_COMPANIES.includes(cName) ? cName : 'Custom');
                          if (!PRESET_COMPANIES.includes(cName)) setCustomCompanyName(cName);
                          setApplicableVehicles(allCoveredVehicles);
                          const formEl = document.getElementById('slab-rate-form-container');
                          if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-3xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Slab for {companyName}
                      </button>
                    </div>
                  </div>

                  {/* Company Slabs Grid */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
                    {companySlabs.map((slab) => {
                      const profit = calculateSlabProfit(slab);
                      const isTwoWay = slab.isTwoWayKm || slab.kmType === 'Two Way KM';

                      return (
                        <div
                          key={slab.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-xs font-black text-slate-900 block">{slab.slabName}</span>
                                <span className="text-4xs font-mono text-slate-400">{slab.id}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-4xs font-bold uppercase shrink-0 ${
                                slab.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {slab.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap text-4xs font-bold">
                              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                                <Car className="h-3 w-3 text-blue-600" /> {slab.vehicleType}
                              </span>
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {slab.rateCategory}
                              </span>
                              {isTwoWay && (
                                <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1 font-extrabold uppercase">
                                  <Repeat className="h-3 w-3 text-indigo-600" /> 2-Way KM
                                </span>
                              )}
                            </div>

                            {/* Rates Breakdown */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1 text-3xs">
                              {slab.rateCategory === 'Kilometer Slab' && slab.kmSlabs ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Base Tier (0-10 KM):</span>
                                    <span className="font-bold text-blue-900">₹{slab.kmSlabs[0]?.vendorAmount} (Co) vs ₹{slab.kmSlabs[0]?.directAmount} (Driver)</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Extra KM Rate:</span>
                                    <span className="font-bold text-blue-900">₹{slab.kmSlabs[slab.kmSlabs.length - 1]?.vendorAmount}/km vs ₹{slab.kmSlabs[slab.kmSlabs.length - 1]?.directAmount}/km</span>
                                  </div>
                                </>
                              ) : slab.rateCategory === 'Package' && slab.packageDetails ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Package ({slab.packageDetails.includedKm} KM):</span>
                                    <span className="font-bold text-blue-900">₹{slab.packageDetails.vendorPackageAmount} vs ₹{slab.packageDetails.directPackageAmount}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Extra KM Rate:</span>
                                    <span className="font-bold text-blue-900">₹{slab.packageDetails.vendorExtraKmRate}/km vs ₹{slab.packageDetails.directExtraKmRate}/km</span>
                                  </div>
                                </>
                              ) : slab.rateCategory === 'Flat Rate' && slab.flatRateDetails ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Flat Rate ({slab.flatRateDetails.tripName}):</span>
                                  <span className="font-bold text-blue-900">₹{slab.flatRateDetails.vendorFlatAmount} vs ₹{slab.flatRateDetails.directFlatAmount}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-3xs">
                            <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                              Profit: +₹{profit.toFixed(0)}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewingSlab(slab)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEdit(slab)}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                title="Edit Slab"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SAVED RATE TABLE WITH DUAL RATE SIDE-BY-SIDE COMPARISON */}
      {viewMode === 'table' && (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-600" /> Unified Rate Matrix Repository (Direct vs Vendor Comparison)
              </h2>
              <p className="text-3xs text-slate-500 font-medium mt-0.5">
                Showing {filteredRates.length} of {slabRates.length} active rate matrices
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-extrabold text-4xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company & Slab Name</th>
                  <th className="py-3.5 px-4">Vehicle & Category</th>
                  <th className="py-3.5 px-4 text-blue-900 bg-blue-50/50">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3 text-blue-600" /> Vendor Rate (Company)</span>
                  </th>
                  <th className="py-3.5 px-4 text-emerald-900 bg-emerald-50/50">
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-emerald-600" /> Direct Rate (Driver)</span>
                  </th>
                  <th className="py-3.5 px-4 text-indigo-900 bg-indigo-50/50">
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-indigo-600" /> Company Profit Margin</span>
                  </th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Filter className="h-8 w-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">No matching slab rates found</p>
                        <p className="text-3xs text-slate-400">Try adjusting your search criteria or create a new slab rate.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRates.map((slab) => {
                    const profit = calculateSlabProfit(slab);

                    return (
                      <tr key={slab.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Company & Slab Name */}
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-4xs font-black uppercase">
                              <Briefcase className="h-3 w-3 text-blue-600" /> {slab.companyName || 'Standard / All Companies'}
                            </span>
                            <span className="block text-xs font-black text-slate-900">{slab.slabName}</span>
                            <span className="text-4xs font-mono text-slate-400">{slab.id}</span>
                          </div>
                        </td>

                        {/* Vehicle & Category */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded text-3xs font-bold">
                                <Car className="h-3 w-3 text-blue-600" /> {slab.vehicleType}
                              </span>
                              {(slab.isTwoWayKm || slab.kmType === 'Two Way KM') && (
                                <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded text-4xs font-extrabold uppercase">
                                  <Repeat className="h-3 w-3 text-indigo-600" /> 2-Way KM
                                </span>
                              )}
                            </div>
                            <div className="text-4xs font-bold text-slate-500 uppercase">
                              {slab.rateCategory}
                              {slab.applicableVehicles && slab.applicableVehicles.length > 0 && (
                                <span className="text-slate-400 block font-normal text-5xs">
                                  Co Vehicles: {slab.applicableVehicles.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                      {/* Vendor Rate (Company Rate) */}
                      <td className="py-3.5 px-4 bg-blue-50/20 font-bold text-blue-900">
                        {slab.rateCategory === 'Kilometer Slab' && slab.kmSlabs ? (
                          <div className="text-3xs space-y-0.5">
                            <span className="text-blue-700 font-extrabold block">
                              Base: ₹{slab.kmSlabs[0]?.vendorAmount || 0}
                            </span>
                            <span className="text-4xs text-slate-500 font-medium">
                              Max: ₹{slab.kmSlabs[slab.kmSlabs.length - 2]?.vendorAmount || slab.kmSlabs[0]?.vendorAmount || 0} ({slab.kmSlabs[slab.kmSlabs.length - 1]?.vendorAmount}/km extra)
                            </span>
                          </div>
                        ) : slab.rateCategory === 'Package' && slab.packageDetails ? (
                          <div className="text-3xs">
                            <span className="text-xs font-black text-blue-800 block">
                              ₹{slab.packageDetails.vendorPackageAmount}
                            </span>
                            <span className="text-4xs text-slate-500">
                              {slab.packageDetails.includedKm} KM (+₹{slab.packageDetails.vendorExtraKmRate}/KM)
                            </span>
                          </div>
                        ) : slab.rateCategory === 'Flat Rate' && slab.flatRateDetails ? (
                          <div className="text-3xs">
                            <span className="text-xs font-black text-blue-800 block">
                              ₹{slab.flatRateDetails.vendorFlatAmount}
                            </span>
                            <span className="text-4xs text-slate-500">{slab.flatRateDetails.tripName}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Direct Rate (Driver Rate) */}
                      <td className="py-3.5 px-4 bg-emerald-50/20 font-bold text-emerald-900">
                        {slab.rateCategory === 'Kilometer Slab' && slab.kmSlabs ? (
                          <div className="text-3xs space-y-0.5">
                            <span className="text-emerald-700 font-extrabold block">
                              Base: ₹{slab.kmSlabs[0]?.directAmount || 0}
                            </span>
                            <span className="text-4xs text-slate-500 font-medium">
                              Max: ₹{slab.kmSlabs[slab.kmSlabs.length - 2]?.directAmount || slab.kmSlabs[0]?.directAmount || 0} ({slab.kmSlabs[slab.kmSlabs.length - 1]?.directAmount}/km extra)
                            </span>
                          </div>
                        ) : slab.rateCategory === 'Package' && slab.packageDetails ? (
                          <div className="text-3xs">
                            <span className="text-xs font-black text-emerald-800 block">
                              ₹{slab.packageDetails.directPackageAmount}
                            </span>
                            <span className="text-4xs text-slate-500">
                              {slab.packageDetails.includedKm} KM (+₹{slab.packageDetails.directExtraKmRate}/KM)
                            </span>
                          </div>
                        ) : slab.rateCategory === 'Flat Rate' && slab.flatRateDetails ? (
                          <div className="text-3xs">
                            <span className="text-xs font-black text-emerald-800 block">
                              ₹{slab.flatRateDetails.directFlatAmount}
                            </span>
                            <span className="text-4xs text-slate-500">{slab.flatRateDetails.tripName}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Profit Margin / Difference (Vendor - Direct) */}
                      <td className="py-3.5 px-4 bg-indigo-50/20">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black ${
                            profit > 0 ? 'text-emerald-700' : profit < 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}>
                            {profit > 0 ? `+₹${profit}` : profit < 0 ? `-₹${Math.abs(profit)}` : '₹0'}
                          </span>
                          <span className={`text-4xs font-bold px-1.5 py-0.5 rounded ${
                            profit > 0 ? 'bg-emerald-100 text-emerald-800' : profit < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {profit > 0 ? 'Company Margin' : profit < 0 ? 'Loss Alert' : 'Break-even'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(slab.id)}
                          className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-4xs font-extrabold transition-all ${
                            slab.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {slab.status === 'Active' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-slate-400" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingSlab(slab)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View / Compare Slabs Side-by-Side"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleEdit(slab)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Slab"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(slab)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Duplicate Slab"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(slab.id, slab.slabName)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Slab"
                          >
                            <Trash2 className="h-4 w-4" />
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
    )}

      {/* VIEW / COMPARE MODAL (SIDE-BY-SIDE DETAIL MATRIX) */}
      {viewingSlab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Scale className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black">{viewingSlab.slabName}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Detailed Rate Comparison: Vendor Rate (Company) vs Direct Rate (Driver)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingSlab(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Key Overview Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-4xs font-bold text-slate-400 uppercase block">Client / Company</span>
                  <span className="font-extrabold text-blue-900 flex items-center gap-1 mt-0.5">
                    <Briefcase className="h-3.5 w-3.5 text-blue-600" /> {viewingSlab.companyName || 'Standard / All Companies'}
                  </span>
                </div>
                <div>
                  <span className="text-4xs font-bold text-slate-400 uppercase block">Vehicle Type</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Car className="h-3.5 w-3.5 text-blue-600" /> {viewingSlab.vehicleType}
                  </span>
                </div>
                <div>
                  <span className="text-4xs font-bold text-slate-400 uppercase block">Rate Category</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{viewingSlab.rateCategory}</span>
                </div>
                <div>
                  <span className="text-4xs font-bold text-slate-400 uppercase block">KM Calculation</span>
                  <span className={`font-extrabold text-3xs mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                    viewingSlab.isTwoWayKm || viewingSlab.kmType === 'Two Way KM'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {viewingSlab.isTwoWayKm || viewingSlab.kmType === 'Two Way KM' ? (
                      <>
                        <Repeat className="h-3 w-3 text-indigo-600" /> Two Way KM (2-Way)
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-3 w-3 text-blue-600" /> One Way KM (1-Way)
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-4xs font-bold text-slate-400 uppercase block">Status</span>
                  <span className={`font-extrabold text-3xs mt-0.5 inline-block px-2 py-0.5 rounded ${
                    viewingSlab.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {viewingSlab.status}
                  </span>
                </div>
              </div>

              {/* Company Vehicle Allocation Info */}
              {viewingSlab.applicableVehicles && viewingSlab.applicableVehicles.length > 0 && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-slate-800">
                      Vehicles Provided by {viewingSlab.companyName || 'this Company'}:
                    </span>
                    <span className="font-extrabold text-blue-900">
                      {viewingSlab.applicableVehicles.join(', ')}
                    </span>
                  </div>
                  <span className="text-4xs font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
                    {viewingSlab.applicableVehicles.length} Types
                  </span>
                </div>
              )}

              {/* Two Way KM Info Banner */}
              {(viewingSlab.isTwoWayKm || viewingSlab.kmType === 'Two Way KM') && (
                <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-2xs">
                      <Repeat className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-indigo-950 block">Two Way KM Option Active</span>
                      <span className="text-3xs text-indigo-800 font-medium">
                        Distance is calculated for round trips / both ways (2 x Base Distance) according to company agreement terms.
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-black text-4xs rounded-md uppercase tracking-wider shrink-0">
                    2-WAY KM
                  </span>
                </div>
              )}

              {/* KM Slab Comparison Table */}
              {viewingSlab.rateCategory === 'Kilometer Slab' && viewingSlab.kmSlabs && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-600" /> Distance Tier Side-by-Side Breakdown
                  </h4>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold text-3xs uppercase">
                          <th className="py-2.5 px-3">From KM</th>
                          <th className="py-2.5 px-3">To KM</th>
                          <th className="py-2.5 px-3 text-blue-800 bg-blue-50">Vendor Rate (Company) (₹)</th>
                          <th className="py-2.5 px-3 text-emerald-800 bg-emerald-50">Direct Rate (Driver) (₹)</th>
                          <th className="py-2.5 px-3 text-indigo-900 bg-indigo-50">Company Profit Margin (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingSlab.kmSlabs.map((row, idx) => {
                          const diff = (Number(row.vendorAmount) || 0) - (Number(row.directAmount) || 0);
                          const marginPercent = Number(row.vendorAmount) > 0 
                            ? ((diff / Number(row.vendorAmount)) * 100).toFixed(1)
                            : '0.0';

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{row.fromKm} KM</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{row.toKm} KM</td>
                              <td className="py-2.5 px-3 font-extrabold text-blue-900 bg-blue-50/20">
                                ₹{row.vendorAmount}
                              </td>
                              <td className="py-2.5 px-3 font-extrabold text-emerald-900 bg-emerald-50/20">
                                ₹{row.directAmount}
                              </td>
                              <td className="py-2.5 px-3 font-black bg-indigo-50/20">
                                <span className={diff >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                  {diff >= 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`} ({marginPercent}%)
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Package Comparison View */}
              {viewingSlab.rateCategory === 'Package' && viewingSlab.packageDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                    <span className="text-3xs font-extrabold text-blue-800 uppercase block">Vendor Rate (Company Billing)</span>
                    <p className="text-xl font-black text-blue-900">₹{viewingSlab.packageDetails.vendorPackageAmount}</p>
                    <p className="text-xs text-blue-700 font-semibold">Includes {viewingSlab.packageDetails.includedKm} KM</p>
                    <p className="text-3xs text-blue-600">Extra KM: ₹{viewingSlab.packageDetails.vendorExtraKmRate}/KM</p>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                    <span className="text-3xs font-extrabold text-emerald-800 uppercase block">Direct Rate (Driver Payout)</span>
                    <p className="text-xl font-black text-emerald-900">₹{viewingSlab.packageDetails.directPackageAmount}</p>
                    <p className="text-xs text-emerald-700 font-semibold">Includes {viewingSlab.packageDetails.includedKm} KM</p>
                    <p className="text-3xs text-emerald-600">Extra KM: ₹{viewingSlab.packageDetails.directExtraKmRate}/KM</p>
                  </div>
                </div>
              )}

              {/* Flat Rate Comparison View */}
              {viewingSlab.rateCategory === 'Flat Rate' && viewingSlab.flatRateDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                    <span className="text-3xs font-extrabold text-blue-800 uppercase block">Vendor Rate (Company Rate)</span>
                    <p className="text-xl font-black text-blue-900">₹{viewingSlab.flatRateDetails.vendorFlatAmount}</p>
                    <p className="text-xs text-blue-700 font-semibold">{viewingSlab.flatRateDetails.tripName}</p>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                    <span className="text-3xs font-extrabold text-emerald-800 uppercase block">Direct Rate (Driver Payout)</span>
                    <p className="text-xl font-black text-emerald-900">₹{viewingSlab.flatRateDetails.directFlatAmount}</p>
                    <p className="text-xs text-emerald-700 font-semibold">{viewingSlab.flatRateDetails.tripName}</p>
                  </div>
                </div>
              )}

              {viewingSlab.description && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-600">
                  <span className="font-bold text-slate-800 block mb-0.5">Remarks:</span>
                  {viewingSlab.description}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Rate Card
              </button>

              <button
                onClick={() => setViewingSlab(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingSlab && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Slab Rate</h3>
                <p className="text-xs text-slate-500 font-medium">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              Are you sure you want to delete <span className="font-black text-slate-900">"{deletingSlab.name}"</span> from the Rate Matrix Repository?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSlab(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSlab}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
