/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  googleSignIn,
  logout,
  getAccessToken,
  auth,
  db,
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import {
  saveStateToFirestore,
  loadStateFromFirestore,
  saveAllStateToFirestore,
  mergeArraysById,
  smartMergeRecords,
  isQuotaError,
  setLastSavedHash,
  FleetState,
} from './lib/firestoreService';
import {
  createFleetSpreadsheet,
  loadFromSpreadsheet,
  pushToSpreadsheet,
} from './lib/googleSheets';
import {
  SAMPLE_VEHICLES,
  SAMPLE_OWNERS,
  SAMPLE_DRIVERS,
  SAMPLE_COMPANIES,
  SAMPLE_SITES,
  SAMPLE_PAYMENTS,
  SAMPLE_EXPENSES,
  SAMPLE_ENQUIRIES,
} from './data/sampleData';
import {
  Vehicle,
  Owner,
  Driver,
  Company,
  Site,
  CompanyPayment,
  Expense,
  Enquiry,
  DeletedVehicle,
  SlabRate,
  AdvanceRecord,
  RecoveryRecord,
  DailyRunningEntry,
  InvoiceRecord,
  PaymentRecord,
  AttachmentRecord,
  FinancialSettings,
} from './types';
import { sanitizeUniqueEntities, deduplicateDeletedVehicles, getKeyFieldsForCollection } from './lib/idUtils';

// Icons
import {
  LayoutDashboard,
  Database,
  Calculator,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  LogIn,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Award,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  X,
  Cloud,
  CheckCircle2,
  Files,
  Search,
  Bell,
  Menu,
  Car,
  Users,
  Building2,
  Gauge,
  CreditCard,
  RotateCcw,
  Receipt,
  DollarSign,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

// Sub Components
import Dashboard from './components/Dashboard';
import MasterViews from './components/MasterViews';
import TransactionViews from './components/TransactionViews';
import LedgerViews from './components/LedgerViews';
import SettlementViews from './components/SettlementViews';
import Reports from './components/Reports';
import VbaExport from './components/VbaExport';
import Settings from './components/Settings';
import AdminLogin from './components/AdminLogin';
import RulesView from './components/RulesView';
import DocumentViews from './components/DocumentViews';

// Dedicated E7 Travels Redesign Views
import VehiclesView from './components/VehiclesView';
import OwnersView from './components/OwnersView';
import DriversView from './components/DriversView';
import CompaniesSitesView from './components/CompaniesSitesView';
import AttachmentsView from './components/AttachmentsView';
import DailyRunningView from './components/DailyRunningView';
import AdvancesView from './components/AdvancesView';
import RecoveriesView from './components/RecoveriesView';
import ExpensesView from './components/ExpensesView';
import InvoicesView from './components/InvoicesView';
import PaymentsView from './components/PaymentsView';
import ReportsMisView from './components/ReportsMisView';
import SettingsView from './components/SettingsView';

export default function App() {
  // Authentication & Sync State
  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    return localStorage.getItem('e7_admin_session_active') === 'true'
      ? (localStorage.getItem('e7_admin_remembered_email') || 'admin@e7travels.com')
      : null;
  });
  const [user, setUser] = useState<{ email: string | null; displayName: string | null } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    return localStorage.getItem('e7_travels_last_synced') || null;
  });

  const updateLastSyncedTime = () => {
    const formattedTime = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    setLastSynced(formattedTime);
    localStorage.setItem('e7_travels_last_synced', formattedTime);
  };
  const [authError, setAuthError] = useState<{ code: string; message: string } | null>(null);
  const [isFirestoreLoaded, setIsFirestoreLoaded] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<'idle' | 'syncing' | 'success' | 'error' | 'quota_exceeded'>('idle');

  // Keep track of the last data string received from the server to prevent redundant write-back loops
  const lastReceivedFromServer = React.useRef<Partial<Record<string, string>>>({});

  // Core ERP Master State
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('e7_travels_vehicles');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return SAMPLE_VEHICLES;
  });
  const [owners, setOwners] = useState<Owner[]>(() => {
    const saved = localStorage.getItem('e7_travels_owners');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return SAMPLE_OWNERS;
  });
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('e7_travels_drivers');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return SAMPLE_DRIVERS;
  });
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('e7_travels_companies');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return SAMPLE_COMPANIES;
  });
  const [sites, setSites] = useState<Site[]>(() => {
    const saved = localStorage.getItem('e7_travels_sites');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return SAMPLE_SITES;
  });
  const [payments, setPayments] = useState<CompanyPayment[]>(() => {
    const saved = localStorage.getItem('e7_travels_payments');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return SAMPLE_PAYMENTS;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('e7_travels_expenses');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return SAMPLE_EXPENSES;
  });
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    const saved = localStorage.getItem('e7_travels_enquiries');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return SAMPLE_ENQUIRIES;
  });
  const [deletedVehicles, setDeletedVehicles] = useState<DeletedVehicle[]>(() => {
    const saved = localStorage.getItem('e7_travels_deletedVehicles') || localStorage.getItem('e7_travels_deleted_vehicles');
    if (saved !== null) {
      try { return deduplicateDeletedVehicles(JSON.parse(saved)); } catch (e) { return []; }
    }
    return [];
  });
  const deletedVehiclesRef = React.useRef(deletedVehicles);
  useEffect(() => {
    deletedVehiclesRef.current = deletedVehicles;
  }, [deletedVehicles]);
  const [slabRates, setSlabRates] = useState<SlabRate[]>(() => {
    const saved = localStorage.getItem('e7_travels_slab_rates');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  // High-Fidelity Default Seeds for Operational Modules
  const DEFAULT_ADVANCES: AdvanceRecord[] = [
    {
      id: 'ADV-101',
      date: '2026-10-01',
      vehicleNumber: 'TN-01-AB-1234',
      type: 'CNG Advance',
      amount: 5000,
      cngPercent: 5,
      recoverable: 5000,
      recovered: 3000,
      balance: 2000,
      status: 'Partially Recovered',
      remarks: 'Routine CNG coupon issue'
    },
    {
      id: 'ADV-102',
      date: '2026-10-02',
      vehicleNumber: 'TN-09-CD-5678',
      type: 'EMI Advance',
      amount: 15000,
      cngPercent: 0,
      recoverable: 15000,
      recovered: 15000,
      balance: 0,
      status: 'Fully Recovered',
      remarks: 'Vehicle finance EMI support'
    },
    {
      id: 'ADV-103',
      date: '2026-10-03',
      vehicleNumber: 'TN-14-JK-7890',
      type: 'Driver Advance',
      amount: 4000,
      cngPercent: 0,
      recoverable: 4000,
      recovered: 2000,
      balance: 2000,
      status: 'Partially Recovered',
      remarks: 'Festival salary advance'
    },
    {
      id: 'ADV-104',
      date: '2026-10-04',
      vehicleNumber: 'TN-22-GH-3456',
      type: 'Maintenance',
      amount: 8500,
      cngPercent: 0,
      recoverable: 8500,
      recovered: 0,
      balance: 8500,
      status: 'Pending',
      remarks: 'Brake pad & AC compressor overhaul'
    },
    {
      id: 'ADV-105',
      date: '2026-10-05',
      vehicleNumber: 'TN-05-PQ-9012',
      type: 'CNG Advance',
      amount: 6000,
      cngPercent: 5,
      recoverable: 6000,
      recovered: 1500,
      balance: 4500,
      status: 'Partially Recovered',
      remarks: 'Fuel card replenishment'
    }
  ];

  const DEFAULT_RECOVERIES: RecoveryRecord[] = [
    {
      id: 'REC-201',
      date: '2026-10-02',
      vehicleNumber: 'TN-01-AB-1234',
      advanceId: 'ADV-101',
      amount: 3000,
      recoveryMonth: '2026-10',
      balance: 2000,
      status: 'Applied',
      remarks: 'Deducted from Weekly Payout W1'
    },
    {
      id: 'REC-202',
      date: '2026-10-03',
      vehicleNumber: 'TN-09-CD-5678',
      advanceId: 'ADV-102',
      amount: 15000,
      recoveryMonth: '2026-10',
      balance: 0,
      status: 'Applied',
      remarks: 'Settled in full against client billing'
    },
    {
      id: 'REC-203',
      date: '2026-10-04',
      vehicleNumber: 'TN-14-JK-7890',
      advanceId: 'ADV-103',
      amount: 2000,
      recoveryMonth: '2026-10',
      balance: 2000,
      status: 'Applied',
      remarks: 'Bi-monthly recovery cycle 1'
    },
    {
      id: 'REC-204',
      date: '2026-10-05',
      vehicleNumber: 'TN-05-PQ-9012',
      advanceId: 'ADV-105',
      amount: 1500,
      recoveryMonth: '2026-10',
      balance: 4500,
      status: 'Applied',
      remarks: 'First installment recovery'
    }
  ];

  const DEFAULT_DAILY_RUNNING: DailyRunningEntry[] = [
    {
      id: 'RUN-301',
      date: '2026-10-05',
      vehicleNumber: 'TN-01-AB-1234',
      driverName: 'Suresh Kumar',
      openingKm: 48200,
      closingKm: 48365,
      totalKm: 165,
      trips: 4,
      amount: 3450,
      remarks: 'Walmart OMR Regular Shift'
    },
    {
      id: 'RUN-302',
      date: '2026-10-05',
      vehicleNumber: 'TN-09-CD-5678',
      driverName: 'K. Murugan',
      openingKm: 62100,
      closingKm: 62280,
      totalKm: 180,
      trips: 5,
      amount: 3900,
      remarks: 'CTS MEPZ Tambaram Route'
    },
    {
      id: 'RUN-303',
      date: '2026-10-04',
      vehicleNumber: 'TN-14-JK-7890',
      driverName: 'P. Anandhan',
      openingKm: 31400,
      closingKm: 31540,
      totalKm: 140,
      trips: 3,
      amount: 2950,
      remarks: 'TCS Siruseri Shuttle'
    },
    {
      id: 'RUN-304',
      date: '2026-10-04',
      vehicleNumber: 'TN-22-GH-3456',
      driverName: 'R. Vignesh',
      openingKm: 75300,
      closingKm: 75490,
      totalKm: 190,
      trips: 4,
      amount: 4100,
      remarks: 'Optum DLF Tech Park'
    },
    {
      id: 'RUN-305',
      date: '2026-10-03',
      vehicleNumber: 'TN-05-PQ-9012',
      driverName: 'M. Selvam',
      openingKm: 55000,
      closingKm: 55150,
      totalKm: 150,
      trips: 4,
      amount: 3200,
      remarks: 'Omega Healthcare Chennai'
    }
  ];

  const DEFAULT_INVOICES: InvoiceRecord[] = [
    {
      id: 'INV-401',
      invoiceNumber: 'E7/2026-27/101',
      date: '2026-10-01',
      company: 'WALMART',
      vehicleNumber: 'TN-01-AB-1234',
      billingPeriod: 'October 2026',
      amount: 62500,
      deductions: 3500,
      netAmount: 59000,
      status: 'Sent',
      paymentTerms: 'Net 30 Days'
    },
    {
      id: 'INV-402',
      invoiceNumber: 'E7/2026-27/102',
      date: '2026-10-02',
      company: 'COGNIZANT (CTS)',
      vehicleNumber: 'TN-09-CD-5678',
      billingPeriod: 'October 2026',
      amount: 58000,
      deductions: 2800,
      netAmount: 55200,
      status: 'Paid',
      paymentTerms: 'Net 30 Days'
    },
    {
      id: 'INV-403',
      invoiceNumber: 'E7/2026-27/103',
      date: '2026-10-03',
      company: 'TATA CONSULTANCY (TCS)',
      vehicleNumber: 'TN-14-JK-7890',
      billingPeriod: 'October 2026',
      amount: 54000,
      deductions: 2000,
      netAmount: 52000,
      status: 'Sent',
      paymentTerms: 'Net 45 Days'
    },
    {
      id: 'INV-404',
      invoiceNumber: 'E7/2026-27/104',
      date: '2026-10-04',
      company: 'OPTUM GLOBAL',
      vehicleNumber: 'TN-22-GH-3456',
      billingPeriod: 'October 2026',
      amount: 49500,
      deductions: 1500,
      netAmount: 48000,
      status: 'Draft',
      paymentTerms: 'Net 30 Days'
    }
  ];

  const DEFAULT_PAYMENTS_RECORD: PaymentRecord[] = [
    {
      id: 'PAY-1001',
      date: '2026-10-02',
      paymentId: 'PAY-1001',
      invoiceNo: 'E7/2026-27/102',
      company: 'COGNIZANT (CTS)',
      amount: 58000,
      paid: 58000,
      balance: 0,
      status: 'Paid',
      paymentMode: 'NEFT Transfer'
    },
    {
      id: 'PAY-1002',
      date: '2026-10-04',
      paymentId: 'PAY-1002',
      invoiceNo: 'E7/2026-27/101',
      company: 'WALMART',
      amount: 62500,
      paid: 40000,
      balance: 22500,
      status: 'Partial',
      paymentMode: 'RTGS'
    },
    {
      id: 'PAY-1003',
      date: '2026-10-05',
      paymentId: 'PAY-1003',
      invoiceNo: 'E7/2026-27/103',
      company: 'TATA CONSULTANCY (TCS)',
      amount: 54000,
      paid: 0,
      balance: 54000,
      status: 'Pending',
      paymentMode: 'Pending Client Clearance'
    }
  ];

  const DEFAULT_ATTACHMENTS: AttachmentRecord[] = [
    {
      id: 'ATT-501',
      vehicleNumber: 'TN-01-AB-1234',
      ownerName: 'V. Ramanathan',
      driverName: 'Suresh Kumar',
      site: 'WALMART - OMR',
      attachDate: '2025-02-10',
      packageType: 'Monthly Fixed (2500 KM)',
      kmLimit: 2500,
      status: 'Active',
      remarks: 'Dedicated corporate cab'
    },
    {
      id: 'ATT-502',
      vehicleNumber: 'TN-09-CD-5678',
      ownerName: 'S. Balasubramanian',
      driverName: 'K. Murugan',
      site: 'CTS - MEPZ',
      attachDate: '2025-04-15',
      packageType: 'Monthly Fixed (2800 KM)',
      kmLimit: 2800,
      status: 'Active',
      remarks: 'Fleet attachment verified'
    },
    {
      id: 'ATT-503',
      vehicleNumber: 'TN-14-JK-7890',
      ownerName: 'M. Dhanasekaran',
      driverName: 'P. Anandhan',
      site: 'TCS - SIRUSERI',
      attachDate: '2025-06-01',
      packageType: 'Monthly Package (2500 KM)',
      kmLimit: 2500,
      status: 'Active',
      remarks: 'Compliant with all office docs'
    },
    {
      id: 'ATT-504',
      vehicleNumber: 'TN-22-GH-3456',
      ownerName: 'K. Rajagopal',
      driverName: 'R. Vignesh',
      site: 'OPTUM - DLF',
      attachDate: '2025-07-20',
      packageType: 'Monthly Package (3000 KM)',
      kmLimit: 3000,
      status: 'Active',
      remarks: 'GPS live tracking active'
    }
  ];

  const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
    cngProfitPercent: 5,
    e7TravelsCharge: 1500,
    fixedDeductionDefault: 1000,
    vehicleFixedDeductions: {},
    serviceCommissionPercent: 2,
    defaultGstPercent: 5,
    defaultTdsPercent: 1,
  };

  const [advances, setAdvances] = useState<AdvanceRecord[]>(() => {
    const saved = localStorage.getItem('e7_travels_advances');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return DEFAULT_ADVANCES;
  });

  const [recoveries, setRecoveries] = useState<RecoveryRecord[]>(() => {
    const saved = localStorage.getItem('e7_travels_recoveries');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return DEFAULT_RECOVERIES;
  });

  const [dailyRunning, setDailyRunning] = useState<DailyRunningEntry[]>(() => {
    const saved = localStorage.getItem('e7_travels_daily_running');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return DEFAULT_DAILY_RUNNING;
  });

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    const saved = localStorage.getItem('e7_travels_invoices');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return DEFAULT_INVOICES;
  });

  const [attachments, setAttachments] = useState<AttachmentRecord[]>(() => {
    const saved = localStorage.getItem('e7_travels_attachments');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return DEFAULT_ATTACHMENTS;
  });

  const [paymentsRecord, setPaymentsRecord] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('e7_travels_payment_records');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return DEFAULT_PAYMENTS_RECORD;
  });

  const [financialSettings, setFinancialSettings] = useState<FinancialSettings>(() => {
    const saved = localStorage.getItem('e7_travels_financial_settings');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_FINANCIAL_SETTINGS; }
    }
    return DEFAULT_FINANCIAL_SETTINGS;
  });

  // Tracks whether the initial sync has been performed for the current login session
  const [hasSyncedForSession, setHasSyncedForSession] = useState(false);
  const hasSyncedRef = React.useRef(false);

  // Cross-tab storage synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (e.key === 'e7_travels_vehicles') setVehicles(parsed);
        else if (e.key === 'e7_travels_owners') setOwners(parsed);
        else if (e.key === 'e7_travels_drivers') setDrivers(parsed);
        else if (e.key === 'e7_travels_companies') setCompanies(parsed);
        else if (e.key === 'e7_travels_sites') setSites(parsed);
        else if (e.key === 'e7_travels_payments') setPayments(parsed);
        else if (e.key === 'e7_travels_expenses') setExpenses(parsed);
        else if (e.key === 'e7_travels_enquiries') setEnquiries(parsed);
        else if (e.key === 'e7_travels_deletedVehicles') setDeletedVehicles(parsed);
        else if (e.key === 'e7_travels_slab_rates') setSlabRates(parsed);
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Automatically manage authentication state & Firestore sync lifecycle for all sessions
  useEffect(() => {
    let isMounted = true;

    const initCloudSync = async () => {
      if (!hasSyncedRef.current) {
        hasSyncedRef.current = true;
        try {
          setCloudStatusMsg('syncing');
          const cloud = await loadStateFromFirestore();

          const resolveInitialData = (cloudArray: any[] | undefined, localArray: any[], sampleArray: any[]) => {
            if (Array.isArray(cloudArray)) {
              return cloudArray;
            }
            return localArray.length > 0 ? localArray : sampleArray;
          };

          const initDeleted = deduplicateDeletedVehicles(resolveInitialData(cloud.deletedVehicles, deletedVehicles, []));
          setDeletedVehicles(initDeleted);
          localStorage.setItem('e7_travels_deletedVehicles', JSON.stringify(initDeleted));
          localStorage.setItem('e7_travels_deleted_vehicles', JSON.stringify(initDeleted));
          lastReceivedFromServer.current['deletedVehicles'] = JSON.stringify(initDeleted);
          setLastSavedHash('deletedVehicles', initDeleted);

          const rawVehicles = resolveInitialData(cloud.vehicles, vehicles, SAMPLE_VEHICLES);
          const deletedSet = new Set(
            (initDeleted || []).flatMap((dv: any) => [
              dv.id,
              dv.originalVehicleId,
              dv.registrationNumber ? dv.registrationNumber.trim().toUpperCase() : '',
            ].filter(Boolean))
          );
          const filteredVehicles = rawVehicles.filter((v: any) => {
            if (!v) return false;
            const vId = v.id ? String(v.id).trim() : '';
            const vReg = v.registrationNumber ? String(v.registrationNumber).trim().toUpperCase() : '';
            return (!vId || !deletedSet.has(vId)) && (!vReg || !deletedSet.has(vReg));
          });
          const initVehicles = sanitizeUniqueEntities(filteredVehicles, 'VEH', 3);
          setVehicles(initVehicles);
          localStorage.setItem('e7_travels_vehicles', JSON.stringify(initVehicles));
          lastReceivedFromServer.current['vehicles'] = JSON.stringify(initVehicles);
          setLastSavedHash('vehicles', initVehicles);

          const initOwners = sanitizeUniqueEntities(resolveInitialData(cloud.owners, owners, SAMPLE_OWNERS), 'OWN', 2);
          setOwners(initOwners);
          localStorage.setItem('e7_travels_owners', JSON.stringify(initOwners));
          lastReceivedFromServer.current['owners'] = JSON.stringify(initOwners);
          setLastSavedHash('owners', initOwners);

          const initDrivers = sanitizeUniqueEntities(resolveInitialData(cloud.drivers, drivers, SAMPLE_DRIVERS), 'DRV', 2);
          setDrivers(initDrivers);
          localStorage.setItem('e7_travels_drivers', JSON.stringify(initDrivers));
          lastReceivedFromServer.current['drivers'] = JSON.stringify(initDrivers);
          setLastSavedHash('drivers', initDrivers);

          const initCompanies = resolveInitialData(cloud.companies, companies, SAMPLE_COMPANIES);
          setCompanies(initCompanies);
          localStorage.setItem('e7_travels_companies', JSON.stringify(initCompanies));
          lastReceivedFromServer.current['companies'] = JSON.stringify(initCompanies);
          setLastSavedHash('companies', initCompanies);

          const initSites = resolveInitialData(cloud.sites, sites, SAMPLE_SITES);
          setSites(initSites);
          localStorage.setItem('e7_travels_sites', JSON.stringify(initSites));
          lastReceivedFromServer.current['sites'] = JSON.stringify(initSites);
          setLastSavedHash('sites', initSites);

          const initPayments = resolveInitialData(cloud.payments, payments, SAMPLE_PAYMENTS);
          setPayments(initPayments);
          localStorage.setItem('e7_travels_payments', JSON.stringify(initPayments));
          lastReceivedFromServer.current['payments'] = JSON.stringify(initPayments);
          setLastSavedHash('payments', initPayments);

          const initExpenses = resolveInitialData(cloud.expenses, expenses, SAMPLE_EXPENSES);
          setExpenses(initExpenses);
          localStorage.setItem('e7_travels_expenses', JSON.stringify(initExpenses));
          lastReceivedFromServer.current['expenses'] = JSON.stringify(initExpenses);
          setLastSavedHash('expenses', initExpenses);

          const initEnquiries = resolveInitialData(cloud.enquiries, enquiries, SAMPLE_ENQUIRIES);
          setEnquiries(initEnquiries);
          localStorage.setItem('e7_travels_enquiries', JSON.stringify(initEnquiries));
          lastReceivedFromServer.current['enquiries'] = JSON.stringify(initEnquiries);
          setLastSavedHash('enquiries', initEnquiries);

          const initSlabRates = resolveInitialData(cloud.slabRates, slabRates, []);
          setSlabRates(initSlabRates);
          localStorage.setItem('e7_travels_slab_rates', JSON.stringify(initSlabRates));
          lastReceivedFromServer.current['slabRates'] = JSON.stringify(initSlabRates);
          setLastSavedHash('slabRates', initSlabRates);

          if (!isMounted) return;

          // Automatically seed any missing collections to Firestore cloud so all data persists automatically
          if (!cloud._isQuotaExceeded) {
            const seedMissing = async () => {
              if (cloud.vehicles === undefined && initVehicles.length > 0) {
                await saveStateToFirestore('vehicles', initVehicles);
              }
              if (cloud.owners === undefined && initOwners.length > 0) {
                await saveStateToFirestore('owners', initOwners);
              }
              if (cloud.drivers === undefined && initDrivers.length > 0) {
                await saveStateToFirestore('drivers', initDrivers);
              }
              if (cloud.companies === undefined && initCompanies.length > 0) {
                await saveStateToFirestore('companies', initCompanies);
              }
              if (cloud.sites === undefined && initSites.length > 0) {
                await saveStateToFirestore('sites', initSites);
              }
              if (cloud.payments === undefined && initPayments.length > 0) {
                await saveStateToFirestore('payments', initPayments);
              }
              if (cloud.expenses === undefined && initExpenses.length > 0) {
                await saveStateToFirestore('expenses', initExpenses);
              }
              if (cloud.enquiries === undefined && initEnquiries.length > 0) {
                await saveStateToFirestore('enquiries', initEnquiries);
              }
              if (cloud.deletedVehicles === undefined && initDeleted.length > 0) {
                await saveStateToFirestore('deletedVehicles', initDeleted);
              }
              if (cloud.slabRates === undefined && initSlabRates.length > 0) {
                await saveStateToFirestore('slabRates', initSlabRates);
              }
            };
            seedMissing().catch((err) => console.warn('Auto-seed to Firestore completed with warning:', err));
          }

          if (cloud._isQuotaExceeded) {
            setIsQuotaExceeded(true);
            setCloudStatusMsg('quota_exceeded');
            setIsFirestoreLoaded(false); // Do NOT attach onSnapshot listeners when quota is exceeded
            setHasSyncedForSession(true);
            console.warn('Firestore daily read quota exceeded. Operating in Local Offline Mode with browser persistence.');
          } else {
            setIsFirestoreLoaded(true);
            setCloudStatusMsg('success');
            setHasSyncedForSession(true);
            console.log('Successfully loaded and connected to Firestore cloud database.');
          }
        } catch (err) {
          if (!isMounted) return;
          if (isQuotaError(err)) {
            setIsQuotaExceeded(true);
            setCloudStatusMsg('quota_exceeded');
            setIsFirestoreLoaded(false);
            setHasSyncedForSession(true);
            console.warn('Firestore daily read quota exceeded on session load. Switched to Local Offline Mode.');
          } else {
            console.error('Error syncing with Firestore cloud on active session:', err);
            setCloudStatusMsg('error');
            setIsFirestoreLoaded(true); // Fallback to local sandbox to allow standard app operations
          }
        }
      }
    };

    initCloudSync();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Real-time Firestore sync listeners to propagate changes instantly across tabs/devices
  useEffect(() => {
    if (!isFirestoreLoaded || isQuotaExceeded) return;

    const keys = [
      'vehicles',
      'owners',
      'drivers',
      'companies',
      'sites',
      'payments',
      'expenses',
      'enquiries',
      'deletedVehicles',
      'slabRates',
    ] as const;

    const setters: Record<typeof keys[number], React.Dispatch<React.SetStateAction<any>>> = {
      vehicles: setVehicles,
      owners: setOwners,
      drivers: setDrivers,
      companies: setCompanies,
      sites: setSites,
      payments: setPayments,
      expenses: setExpenses,
      enquiries: setEnquiries,
      deletedVehicles: setDeletedVehicles,
      slabRates: setSlabRates,
    };

    const unsubscribes = keys.map((key) => {
      return onSnapshot(doc(db, 'fleet', key), (snapshot) => {
        // Skip updating if snapshot is a local write that hasn't finished propagating
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }
        if (snapshot.exists()) {
          const cloudData = snapshot.data().data;
          if (!Array.isArray(cloudData)) return;

          setters[key]((currentLocal: any) => {
            let finalCloud = cloudData;
            if (key === 'vehicles') {
              const deletedSet = new Set(
                (deletedVehiclesRef.current || []).flatMap((dv) => [
                  dv.id,
                  dv.originalVehicleId,
                  dv.registrationNumber ? dv.registrationNumber.trim().toUpperCase() : '',
                ].filter(Boolean))
              );
              finalCloud = cloudData.filter((v: any) => {
                if (!v) return false;
                const vId = v.id ? String(v.id).trim() : '';
                const vReg = v.registrationNumber ? String(v.registrationNumber).trim().toUpperCase() : '';
                return (!vId || !deletedSet.has(vId)) && (!vReg || !deletedSet.has(vReg));
              });
            }

            if (key === 'vehicles' || key === 'owners' || key === 'drivers') {
              const prefix = key === 'vehicles' ? 'VEH' : key === 'owners' ? 'OWN' : 'DRV';
              const pad = key === 'vehicles' ? 3 : 2;
              finalCloud = sanitizeUniqueEntities(finalCloud, prefix, pad);
            } else if (key === 'deletedVehicles') {
              finalCloud = deduplicateDeletedVehicles(finalCloud);
            }

            const cloudStr = JSON.stringify(finalCloud);
            const localStr = JSON.stringify(currentLocal);

            if (cloudStr !== localStr) {
              console.log(`Real-time online cloud sync applied for key: ${key} (${finalCloud.length} items)`);
              localStorage.setItem(`e7_travels_${key}`, cloudStr);
              if (key === 'deletedVehicles') {
                localStorage.setItem('e7_travels_deleted_vehicles', cloudStr);
              }
              lastReceivedFromServer.current[key] = cloudStr;
              setLastSavedHash(key, finalCloud);
              return finalCloud;
            }
            return currentLocal;
          });
        }
      }, (error) => {
        if (isQuotaError(error)) {
          console.warn(`Real-time listener suspended for key "${key}" due to Firestore quota limits.`);
          setIsQuotaExceeded(true);
          setCloudStatusMsg('quota_exceeded');
          setIsFirestoreLoaded(false);
        } else {
          console.error(`Real-time subscription error for key ${key}:`, error);
        }
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [isFirestoreLoaded, user, isQuotaExceeded]);

  // Helper to automatically save state changes to Firestore cloud in real-time
  const autoSaveToFirestore = React.useCallback((key: keyof FleetState, data: any) => {
    if (isQuotaExceeded || !isFirestoreLoaded) return;
    const str = JSON.stringify(data);
    const keyStr = String(key);
    if (lastReceivedFromServer.current[keyStr] === str) return;
    lastReceivedFromServer.current[keyStr] = str;

    setCloudStatusMsg('syncing');
    saveStateToFirestore(key, data)
      .then(() => {
        setCloudStatusMsg('success');
      })
      .catch((err) => {
        console.warn(`Auto-save ${keyStr} to Firestore failed:`, err);
        if (!isQuotaError(err)) {
          setCloudStatusMsg('error');
        }
      });
  }, [isQuotaExceeded, isFirestoreLoaded]);

  // Automatically save to localStorage and Firestore cloud whenever state changes
  useEffect(() => {
    const str = JSON.stringify(vehicles);
    localStorage.setItem('e7_travels_vehicles', str);
    autoSaveToFirestore('vehicles', vehicles);
  }, [vehicles, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(owners);
    localStorage.setItem('e7_travels_owners', str);
    autoSaveToFirestore('owners', owners);
  }, [owners, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(drivers);
    localStorage.setItem('e7_travels_drivers', str);
    autoSaveToFirestore('drivers', drivers);
  }, [drivers, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(companies);
    localStorage.setItem('e7_travels_companies', str);
    autoSaveToFirestore('companies', companies);
  }, [companies, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(sites);
    localStorage.setItem('e7_travels_sites', str);
    autoSaveToFirestore('sites', sites);
  }, [sites, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(payments);
    localStorage.setItem('e7_travels_payments', str);
    autoSaveToFirestore('payments', payments);
  }, [payments, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(expenses);
    localStorage.setItem('e7_travels_expenses', str);
    autoSaveToFirestore('expenses', expenses);
  }, [expenses, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(enquiries);
    localStorage.setItem('e7_travels_enquiries', str);
    autoSaveToFirestore('enquiries', enquiries);
  }, [enquiries, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(deletedVehicles);
    localStorage.setItem('e7_travels_deletedVehicles', str);
    localStorage.setItem('e7_travels_deleted_vehicles', str);
    autoSaveToFirestore('deletedVehicles', deletedVehicles);
  }, [deletedVehicles, autoSaveToFirestore]);

  useEffect(() => {
    const str = JSON.stringify(slabRates);
    localStorage.setItem('e7_travels_slab_rates', str);
    autoSaveToFirestore('slabRates', slabRates);
  }, [slabRates, autoSaveToFirestore]);

  // Floating Toast notification state & auto-dismissal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleExportBackupJSON = () => {
    try {
      const backupData = {
        vehicles,
        owners,
        drivers,
        companies,
        sites,
        payments,
        expenses,
        enquiries,
        deletedVehicles,
        slabRates,
        exportTimestamp: new Date().toISOString(),
        version: '1.0'
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `E7_Travels_ERP_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('📥 Backup JSON exported successfully!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('❌ Failed to export backup JSON', 'error');
    }
  };

  const handleImportBackupJSON = async (importedData: any) => {
    try {
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid JSON backup file structure.');
      }

      const mergedVehicles = importedData.vehicles ? mergeArraysById(vehicles, importedData.vehicles) : vehicles;
      const mergedOwners = importedData.owners ? mergeArraysById(owners, importedData.owners) : owners;
      const mergedDrivers = importedData.drivers ? mergeArraysById(drivers, importedData.drivers) : drivers;
      const mergedCompanies = importedData.companies ? mergeArraysById(companies, importedData.companies, ['name', 'id']) : companies;
      const mergedSites = importedData.sites ? mergeArraysById(sites, importedData.sites) : sites;
      const mergedPayments = importedData.payments ? mergeArraysById(payments, importedData.payments) : payments;
      const mergedExpenses = importedData.expenses ? mergeArraysById(expenses, importedData.expenses) : expenses;
      const mergedEnquiries = importedData.enquiries ? mergeArraysById(enquiries, importedData.enquiries) : enquiries;
      const mergedDeleted = importedData.deletedVehicles ? mergeArraysById(deletedVehicles, importedData.deletedVehicles) : deletedVehicles;
      const mergedSlabRates = importedData.slabRates ? mergeArraysById(slabRates, importedData.slabRates) : slabRates;

      setVehicles(mergedVehicles);
      setOwners(mergedOwners);
      setDrivers(mergedDrivers);
      setCompanies(mergedCompanies);
      setSites(mergedSites);
      setPayments(mergedPayments);
      setExpenses(mergedExpenses);
      setEnquiries(mergedEnquiries);
      setDeletedVehicles(mergedDeleted);
      setSlabRates(mergedSlabRates);

      if (user) {
        await saveStateToFirestore('vehicles', mergedVehicles);
        await saveStateToFirestore('owners', mergedOwners);
        await saveStateToFirestore('drivers', mergedDrivers);
        await saveStateToFirestore('companies', mergedCompanies);
        await saveStateToFirestore('sites', mergedSites);
        await saveStateToFirestore('payments', mergedPayments);
        await saveStateToFirestore('expenses', mergedExpenses);
        await saveStateToFirestore('enquiries', mergedEnquiries);
        await saveStateToFirestore('deletedVehicles', mergedDeleted);
        await saveStateToFirestore('slabRates', mergedSlabRates);
      }

      showToast('✅ Yesterday/Backup data merged & imported successfully!', 'success');
    } catch (err) {
      console.error('Import failed:', err);
      showToast('❌ Failed to import backup data', 'error');
    }
  };

  const handleRestoreFromCloud = async () => {
    try {
      setCloudStatusMsg('syncing');
      const cloud = await loadStateFromFirestore();
      if (cloud.vehicles) setVehicles(cloud.vehicles);
      if (cloud.owners) setOwners(cloud.owners);
      if (cloud.drivers) setDrivers(cloud.drivers);
      if (cloud.companies) setCompanies(cloud.companies);
      if (cloud.sites) setSites(cloud.sites);
      if (cloud.payments) setPayments(cloud.payments);
      if (cloud.expenses) setExpenses(cloud.expenses);
      if (cloud.enquiries) setEnquiries(cloud.enquiries);
      if (cloud.deletedVehicles) setDeletedVehicles(cloud.deletedVehicles);
      if (cloud.slabRates) setSlabRates(cloud.slabRates);
      setCloudStatusMsg('success');
      showToast('📥 Loaded & synchronized latest records from Firebase!', 'success');
    } catch (err) {
      console.error('Error reloading from Firestore:', err);
      setCloudStatusMsg('error');
      showToast('❌ Failed to reload data from cloud.', 'error');
    }
  };

  // Core Branding Custom Logo
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('e7_custom_logo') || localStorage.getItem('e7_original_logo') || null;
    } catch {
      return null;
    }
  });

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<
    | 'Dashboard'
    | 'Vehicles'
    | 'Owners'
    | 'Drivers'
    | 'Companies / Sites'
    | 'Attachments'
    | 'Daily Running'
    | 'Advances'
    | 'Recoveries'
    | 'Expenses'
    | 'Invoices'
    | 'Payments'
    | 'Reports / MIS'
    | 'Documents'
    | 'Settings'
    | 'Registers'
    | 'Transactions'
    | 'Ledgers'
    | 'Settlement'
    | 'Reports'
    | 'VBA Export'
    | 'Rules'
  >('Dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('Vehicle Master');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'running' | 'idle' | 'new' | 'doc_pending' | 'doc_submitted' | 'gps_hold' | 'duplicates'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Search Results & Fleet Notification Counters
  const searchResults = React.useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return null;
    const matchVehicles = vehicles.filter(v =>
      (v.registrationNumber && v.registrationNumber.toLowerCase().includes(q)) ||
      (v.model && v.model.toLowerCase().includes(q)) ||
      (v.ownerName && v.ownerName.toLowerCase().includes(q)) ||
      (v.driverName && v.driverName.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchOwners = owners.filter(o =>
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.phone && o.phone.includes(q))
    ).slice(0, 4);

    const matchDrivers = drivers.filter(d =>
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.phone && d.phone.includes(q))
    ).slice(0, 4);

    return {
      vehicles: matchVehicles.map(v => ({ id: v.id, vehicleNumber: v.registrationNumber, makeModel: `${v.manufacturer} ${v.model}`, ownerName: v.ownerName })),
      owners: matchOwners.map(o => ({ id: o.id, name: o.name, mobile: o.phone })),
      drivers: matchDrivers.map(d => ({ id: d.id, name: d.name, mobile: d.phone })),
      total: matchVehicles.length + matchOwners.length + matchDrivers.length
    };
  }, [globalSearch, vehicles, owners, drivers]);

  const docPendingCount = vehicles.filter((v) => !v.officeDocSubmitted).length;
  const inactiveVehiclesCount = vehicles.filter((v) => v.status !== 'Active').length;
  const totalAlertsCount = (docPendingCount > 0 ? 1 : 0) + (inactiveVehiclesCount > 0 ? 1 : 0);

  // Unified Navigation Router
  const handleNavigate = (route: string, filter?: 'all' | 'running' | 'idle' | 'new' | 'doc_pending' | 'doc_submitted' | 'gps_hold' | 'duplicates') => {
    setMobileMenuOpen(false);
    if (filter) {
      setVehicleFilter(filter);
    } else if (route === 'Vehicles' || route === 'Vehicle Master') {
      setVehicleFilter('all');
    }

    switch (route) {
      case 'Dashboard':
        setActiveTab('Dashboard');
        break;
      case 'Vehicles':
      case 'Vehicle Master':
        setActiveTab('Vehicles');
        setActiveSubTab('Vehicle Master');
        break;
      case 'Owners':
      case 'Owner Master':
        setActiveTab('Owners');
        setActiveSubTab('Owner Master');
        break;
      case 'Drivers':
      case 'Driver Master':
        setActiveTab('Drivers');
        setActiveSubTab('Driver Master');
        break;
      case 'Companies / Sites':
      case 'Company Master':
      case 'Site Master':
        setActiveTab('Companies / Sites');
        setActiveSubTab(route);
        break;
      case 'Attachments':
        setActiveTab('Attachments');
        break;
      case 'Daily Running':
        setActiveTab('Daily Running');
        break;
      case 'Advances':
        setActiveTab('Advances');
        break;
      case 'Recoveries':
        setActiveTab('Recoveries');
        break;
      case 'Expenses':
      case 'Expense Entry':
        setActiveTab('Expenses');
        break;
      case 'Invoices':
      case 'Invoice':
        setActiveTab('Invoices');
        break;
      case 'Payments':
      case 'Company Payments':
        setActiveTab('Payments');
        break;
      case 'Reports / MIS':
      case 'Reports':
      case 'Profit & Loss':
        setActiveTab('Reports / MIS');
        break;
      case 'Documents':
      case 'Tax Invoice':
      case 'Letter Head':
        setActiveTab('Documents');
        setActiveSubTab(route === 'Documents' ? 'Tax Invoice' : route);
        break;
      case 'Settings':
        setActiveTab('Settings');
        break;
      case 'Rules':
        setActiveTab('Rules');
        break;
      case 'VBA Export':
        setActiveTab('VBA Export');
        break;
      case 'Vehicle Ledger':
      case 'Owner Ledger':
      case 'Ledgers':
        setActiveTab('Ledgers');
        setActiveSubTab(route === 'Ledgers' ? 'Vehicle Ledger' : route);
        break;
      case 'Monthly Settlement':
      case 'Owner Statement':
      case 'Driver Statement':
      case 'Settlement':
        setActiveTab('Settlement');
        setActiveSubTab(route === 'Settlement' ? 'Monthly Settlement' : route);
        break;
      default:
        setActiveTab((route as any) || 'Dashboard');
        break;
    }
  };

  // Handle Google Login Auth
  const handleLogin = async () => {
    try {
      setAuthError(null);
      const res = await googleSignIn();
      if (res && res.user) {
        setUser({
          email: res.user.email,
          displayName: res.user.displayName,
        });
        const token = res.accessToken;
        setAccessToken(token);
        if (token) {
          triggerSheetInit(token);
        }
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const errorCode = err?.code || 'unknown';
      let errorMessage = err?.message || 'Authentication failed. Please verify credentials and try again.';
      
      // Specifically target popup closed/blocked errors
      const isPopupIssue = 
        errorCode === 'auth/popup-closed-by-user' || 
        errorCode === 'auth/cancelled-popup-request' || 
        errorCode === 'auth/popup-blocked' || 
        errorMessage.toLowerCase().includes('popup-closed-by-user') || 
        errorMessage.toLowerCase().includes('cancelled-popup-request') || 
        errorMessage.toLowerCase().includes('popup-blocked') ||
        errorMessage.toLowerCase().includes('popup');

      const isInternalError = 
        errorCode === 'auth/internal-error' || 
        errorMessage.toLowerCase().includes('internal-error');

      if (isPopupIssue) {
        errorMessage = 'Google sign-in popup was blocked, closed, or cancelled before completion. This is extremely common when browser security settings prevent popups inside embedded preview frames. To log in successfully, please click "Open in New Tab" in the top bar to run the app in full-screen, or ensure your browser allows popups.';
      } else if (isInternalError) {
        errorMessage = 'Google Sign-In returned an internal error (auth/internal-error). This is common when Google Sign-In is not yet fully enabled in your Firebase console or when this preview URL is not listed in your project\'s Authorized Domains. To resolve this: 1. Ensure you have run/approved the Firebase setup tool to auto-provision authentication. 2. Verify Google is enabled under Firebase Authentication > Sign-in method. 3. Try clicking "Open in New Tab" in the top bar to bypass embedded iframe restrictions.';
      }
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSpreadsheetId(null);
    setSyncStatus('idle');
    setHasSyncedForSession(false);
    setIsFirestoreLoaded(false);
    setCloudStatusMsg('idle');
  };

  // Create or load sheets
  const triggerSheetInit = async (token: string) => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      // 1. Check if user already has an existing fleet sheet cached in local storage or create new one
      let sheetId = localStorage.getItem('e7_travels_sheets_id');
      if (!sheetId) {
        sheetId = await createFleetSpreadsheet(token, {
          vehicles,
          owners,
          drivers,
          companies,
          sites,
          payments,
          expenses,
          enquiries,
        });
        if (sheetId) {
          localStorage.setItem('e7_travels_sheets_id', sheetId);
        }
      }
      setSpreadsheetId(sheetId);

      // 2. Load data from sheet
      if (sheetId) {
        const remoteData = await loadFromSpreadsheet(token, sheetId);
        if (remoteData) {
          if (remoteData.vehicles && Array.isArray(remoteData.vehicles)) setVehicles(remoteData.vehicles);
          if (remoteData.owners && Array.isArray(remoteData.owners)) setOwners(remoteData.owners);
          if (remoteData.drivers && Array.isArray(remoteData.drivers)) setDrivers(remoteData.drivers);
          if (remoteData.companies && Array.isArray(remoteData.companies)) setCompanies(remoteData.companies);
          if (remoteData.sites && Array.isArray(remoteData.sites)) setSites(remoteData.sites);
          if (remoteData.payments && Array.isArray(remoteData.payments)) setPayments(remoteData.payments);
          if (remoteData.expenses && Array.isArray(remoteData.expenses)) setExpenses(remoteData.expenses);
          if (remoteData.enquiries && remoteData.enquiries.length > 0) {
            setEnquiries(remoteData.enquiries);
            localStorage.setItem('e7_travels_enquiries', JSON.stringify(remoteData.enquiries));
          }
        }
        setSyncStatus('success');
        updateLastSyncedTime();
      }
    } catch (err) {
      console.error('Sync sheets error:', err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Push state to sheets on data mutators
  const triggerPush = async (
    v = vehicles,
    o = owners,
    d = drivers,
    c = companies,
    s = sites,
    p = payments,
    e = expenses,
    enq = enquiries
  ) => {
    const token = accessToken || await getAccessToken();
    if (!token || !spreadsheetId) return;

    setIsSyncing(true);
    try {
      await pushToSpreadsheet(token, spreadsheetId, {
        vehicles: v,
        owners: o,
        drivers: d,
        companies: c,
        sites: s,
        payments: p,
        expenses: e,
        enquiries: enq,
      });
      setSyncStatus('success');
      updateLastSyncedTime();
    } catch (err) {
      console.error('Error during automatic data push:', err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Explicit refresh/reconcile trigger
  const handleForceRefresh = async () => {
    const token = accessToken || await getAccessToken();
    if (token) {
      triggerSheetInit(token);
    } else {
      showToast('ℹ️ Local sandbox mode: Please log in using Google Auth to sync with Google Drive.', 'info');
    }
  };

  // Explicit save/overwrite/store current local data to Google Sheets
  const handleExportToSheets = async () => {
    const token = accessToken || await getAccessToken();
    if (!token) {
      showToast('⚠️ Authentication required: Please sign in with Google Sync to export data.', 'error');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      let sheetId = spreadsheetId || localStorage.getItem('e7_travels_sheets_id');
      if (!sheetId) {
        sheetId = await createFleetSpreadsheet(token, {
          vehicles,
          owners,
          drivers,
          companies,
          sites,
          payments,
          expenses,
          enquiries,
        });
        if (sheetId) {
          localStorage.setItem('e7_travels_sheets_id', sheetId);
          setSpreadsheetId(sheetId);
        }
      } else {
        await pushToSpreadsheet(token, sheetId, {
          vehicles,
          owners,
          drivers,
          companies,
          sites,
          payments,
          expenses,
          enquiries,
        });
      }
      setSyncStatus('success');
      updateLastSyncedTime();
      alert('Success! Your current local database has been fully written and stored in your Google Sheet.');
    } catch (err: any) {
      console.error('Export sheets error:', err);
      setSyncStatus('error');
      alert(`Sync failed: ${err?.message || 'Unknown error occurred.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Mutators
  const updateVehicles = (newVehicles: Vehicle[]) => {
    const cleanVehicles = sanitizeUniqueEntities(newVehicles, 'VEH', 3);
    // Cross-sync owner and driver names from owners/drivers arrays if matched
    const synced = cleanVehicles.map((v) => {
      const d = (v.driverId ? drivers.find((drv) => drv.id === v.driverId) : null) ||
                (v.driverName && v.driverName.trim() ? drivers.find((drv) => drv.name && drv.name.trim().toLowerCase() === v.driverName.trim().toLowerCase()) : null);
      const o = (v.ownerId ? owners.find((own) => own.id === v.ownerId) : null) ||
                (v.ownerName && v.ownerName.trim() ? owners.find((own) => own.name && own.name.trim().toLowerCase() === v.ownerName.trim().toLowerCase()) : null);
      return {
        ...v,
        driverId: d ? d.id : v.driverId,
        driverName: d ? d.name : (v.driverName || 'Unknown Driver'),
        ownerId: o ? o.id : v.ownerId,
        ownerName: o ? o.name : (v.ownerName || 'Unknown Owner'),
      };
    });
    setVehicles(synced);
    triggerPush(synced, owners, drivers, companies, sites, payments, expenses);
  };
  const updateOwners = (newOwners: Owner[]) => {
    const cleanOwners = sanitizeUniqueEntities(newOwners, 'OWN', 2);
    setOwners(cleanOwners);
    const ownerIdMap = new Map<string, Owner>();
    const ownerNameMap = new Map<string, Owner>();
    cleanOwners.forEach((o) => {
      if (o.id) ownerIdMap.set(o.id, o);
      if (o.name && o.name.trim()) ownerNameMap.set(o.name.trim().toLowerCase(), o);
    });
    const updatedVehicles = vehicles.map((v) => {
      const match = (v.ownerId ? ownerIdMap.get(v.ownerId) : null) ||
                    (v.ownerName && v.ownerName.trim() ? ownerNameMap.get(v.ownerName.trim().toLowerCase()) : null);
      if (match && (v.ownerName !== match.name || v.ownerId !== match.id)) {
        return { ...v, ownerId: match.id, ownerName: match.name };
      }
      return v;
    });
    setVehicles(updatedVehicles);
    triggerPush(updatedVehicles, cleanOwners, drivers, companies, sites, payments, expenses);
  };
  const updateDrivers = (newDrivers: Driver[]) => {
    const cleanDrivers = sanitizeUniqueEntities(newDrivers, 'DRV', 2);
    setDrivers(cleanDrivers);
    const driverIdMap = new Map<string, Driver>();
    const driverNameMap = new Map<string, Driver>();
    cleanDrivers.forEach((d) => {
      if (d.id) driverIdMap.set(d.id, d);
      if (d.name && d.name.trim()) driverNameMap.set(d.name.trim().toLowerCase(), d);
    });
    const updatedVehicles = vehicles.map((v) => {
      const match = (v.driverId ? driverIdMap.get(v.driverId) : null) ||
                    (v.driverName && v.driverName.trim() ? driverNameMap.get(v.driverName.trim().toLowerCase()) : null);
      if (match && (v.driverName !== match.name || v.driverId !== match.id)) {
        return { ...v, driverId: match.id, driverName: match.name };
      }
      return v;
    });
    setVehicles(updatedVehicles);
    triggerPush(updatedVehicles, owners, cleanDrivers, companies, sites, payments, expenses);
  };
  const updateCompanies = (newCompanies: Company[]) => {
    let updatedVehicles = [...vehicles];
    let updatedPayments = [...payments];
    let updatedSites = [...sites];
    let hasChanges = false;

    // Compare old companies vs new companies by companySite
    companies.forEach((oldC) => {
      const match = newCompanies.find(
        (nc) => nc.companySite && oldC.companySite && nc.companySite.trim().toLowerCase() === oldC.companySite.trim().toLowerCase()
      );
      if (match && match.name && oldC.name !== match.name) {
        const oldName = oldC.name;
        const newName = match.name;

        // 1. Update Vehicles
        updatedVehicles = updatedVehicles.map((v) => {
          let changed = false;
          let nextCompany = v.company;
          let nextCompany2 = v.company2;
          if (v.company === oldName) {
            nextCompany = newName;
            changed = true;
          }
          if (v.company2 === oldName) {
            nextCompany2 = newName;
            changed = true;
          }
          return changed ? { ...v, company: nextCompany, company2: nextCompany2 } : v;
        });

        // 2. Update Sites
        updatedSites = updatedSites.map((s) => {
          if (s.companyName === oldName) {
            return { ...s, companyName: newName };
          }
          return s;
        });

        // 3. Update Payments
        updatedPayments = updatedPayments.map((p) => {
          if (p.company === oldName) {
            return { ...p, company: newName };
          }
          return p;
        });

        hasChanges = true;
      }
    });

    setCompanies(newCompanies);
    if (hasChanges) {
      setVehicles(updatedVehicles);
      setSites(updatedSites);
      setPayments(updatedPayments);
      triggerPush(updatedVehicles, owners, drivers, newCompanies, updatedSites, updatedPayments, expenses);
    } else {
      triggerPush(vehicles, owners, drivers, newCompanies, sites, payments, expenses);
    }
  };
  const updateSites = (newSites: Site[]) => {
    setSites(newSites);
    triggerPush(vehicles, owners, drivers, companies, newSites, payments, expenses);
  };
  const updatePayments = (newPayments: CompanyPayment[]) => {
    setPayments(newPayments);
    triggerPush(vehicles, owners, drivers, companies, sites, newPayments, expenses);
  };
  const updateExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    triggerPush(vehicles, owners, drivers, companies, sites, payments, newExpenses);
  };
  const updateEnquiries = (newEnquiries: Enquiry[]) => {
    setEnquiries(newEnquiries);
    localStorage.setItem('e7_travels_enquiries', JSON.stringify(newEnquiries));
    triggerPush(vehicles, owners, drivers, companies, sites, payments, expenses, newEnquiries);
  };
  const updateDeletedVehicles = (newDeletedVehicles: DeletedVehicle[]) => {
    const cleanList = deduplicateDeletedVehicles(newDeletedVehicles);
    setDeletedVehicles(cleanList);
    try {
      localStorage.setItem('e7_travels_deletedVehicles', JSON.stringify(cleanList));
      localStorage.setItem('e7_travels_deleted_vehicles', JSON.stringify(cleanList));
    } catch (err) {
      console.error('Failed to save deleted vehicles to localStorage:', err);
    }
    saveStateToFirestore('deletedVehicles', cleanList).catch((err) =>
      console.error('Auto-sync deletedVehicles to Firestore failed:', err)
    );
  };
  const updateSlabRates = (newRates: SlabRate[]) => {
    setSlabRates(newRates);
    try {
      localStorage.setItem('e7_travels_slab_rates', JSON.stringify(newRates));
    } catch (err) {
      console.error('Failed to save slab rates to localStorage:', err);
    }
    saveStateToFirestore('slabRates', newRates).catch((err) =>
      console.error('Auto-sync slabRates to Firestore failed:', err)
    );
  };

  const updateAdvances = (newAdv: AdvanceRecord[]) => {
    setAdvances(newAdv);
    try {
      localStorage.setItem('e7_travels_advances', JSON.stringify(newAdv));
    } catch (err) {
      console.error('Failed to save advances to localStorage:', err);
    }
  };

  const updateRecoveries = (newRec: RecoveryRecord[]) => {
    setRecoveries(newRec);
    try {
      localStorage.setItem('e7_travels_recoveries', JSON.stringify(newRec));
    } catch (err) {
      console.error('Failed to save recoveries to localStorage:', err);
    }
  };

  const updateDailyRunning = (newRun: DailyRunningEntry[]) => {
    setDailyRunning(newRun);
    try {
      localStorage.setItem('e7_travels_daily_running', JSON.stringify(newRun));
    } catch (err) {
      console.error('Failed to save daily running to localStorage:', err);
    }
  };

  const updateInvoices = (newInv: InvoiceRecord[]) => {
    setInvoices(newInv);
    try {
      localStorage.setItem('e7_travels_invoices', JSON.stringify(newInv));
    } catch (err) {
      console.error('Failed to save invoices to localStorage:', err);
    }
  };

  const updateAttachments = (newAtt: AttachmentRecord[]) => {
    setAttachments(newAtt);
    try {
      localStorage.setItem('e7_travels_attachments', JSON.stringify(newAtt));
    } catch (err) {
      console.error('Failed to save attachments to localStorage:', err);
    }
  };

  const updatePaymentsRecord = (newPay: PaymentRecord[]) => {
    setPaymentsRecord(newPay);
    try {
      localStorage.setItem('e7_travels_payment_records', JSON.stringify(newPay));
    } catch (err) {
      console.error('Failed to save payments record to localStorage:', err);
    }
  };

  const updateFinancialSettings = (newSettings: FinancialSettings) => {
    setFinancialSettings(newSettings);
    try {
      localStorage.setItem('e7_travels_financial_settings', JSON.stringify(newSettings));
    } catch (err) {
      console.error('Failed to save financial settings to localStorage:', err);
    }
  };

  const restoreVehicle = (recordToRestore: DeletedVehicle, target: 'master' | 'enquiry' = 'master') => {
    const orig = recordToRestore.originalVehicle;

    if (target === 'enquiry') {
      let maxNum = 0;
      enquiries.forEach((e) => {
        const match = e.id.match(/\d+/);
        if (match) {
          const val = parseInt(match[0], 10);
          if (val > maxNum) maxNum = val;
        }
      });
      const newEnqId = `ENQ${(maxNum + 1).toString().padStart(3, '0')}`;

      const newEnq: Enquiry = {
        id: newEnqId,
        vehicleNumber: recordToRestore.registrationNumber || orig?.registrationNumber || '',
        vehicleType: recordToRestore.vehicleType || orig?.vehicleType || 'Sedan',
        vehicleModelYear: recordToRestore.model
          ? `${recordToRestore.model} ${recordToRestore.year ? '(' + recordToRestore.year + ')' : ''}`.trim()
          : orig?.model || '',
        vehicleColor: '',
        ownerNamePhone: recordToRestore.ownerName || orig?.ownerName || '',
        reference: 'Restored from Deleted Vehicles',
        driverName: recordToRestore.driverName || orig?.driverName || '',
        driverAge: '',
        driverPhone: '',
        driverArea: '',
        driverBatchExp: orig?.remarks || '',
        alreadyRunningCompany: recordToRestore.company || orig?.company || orig?.sitePreference1 || '',
        sitePreference1: recordToRestore.company || orig?.company || orig?.sitePreference1 || '',
        sitePreference2: orig?.company2 || orig?.sitePreference2 || '',
        sitePreference3: recordToRestore.site || orig?.site || orig?.sitePreference3 || '',
        sitePreference4: orig?.site2 || orig?.sitePreference4 || '',
        enquiryDate: new Date().toISOString().substring(0, 10),
        status: 'New',
        remarks: `Restored from Deleted Vehicles (${recordToRestore.deletedAt || 'Previously Deleted'})`,
        ownerName: recordToRestore.ownerName || orig?.ownerName || '',
        fuelType: recordToRestore.fuelType || orig?.fuelType || '',
        insuranceExpiry: orig?.insuranceExpiry || '',
        permitExpiry: orig?.permitExpiry || '',
        fcExpiry: orig?.fcExpiry || '',
        comments: [
          {
            date: new Date().toISOString().substring(0, 10),
            text: `Restored to Enquiry Desk from Deleted Vehicles (Deletion Reason: ${recordToRestore.deletionReason || 'N/A'})`,
            author: adminEmail || 'Admin',
          },
        ],
      };

      // Reactivate any existing matching closed enquiry for this vehicle number
      const vehNoNorm = (recordToRestore.registrationNumber || orig?.registrationNumber || '').replace(/\s+/g, '').toUpperCase();
      const updatedList = enquiries.map((item) => {
        const itemVehNorm = (item.vehicleNumber || '').replace(/\s+/g, '').toUpperCase();
        if (vehNoNorm && itemVehNorm === vehNoNorm && item.status === 'Closed') {
          return {
            ...item,
            status: 'New' as const,
            remarks: `Reactivated from Deleted Vehicles restore on ${new Date().toISOString().substring(0, 10)}`,
          };
        }
        return item;
      });

      updateEnquiries([newEnq, ...updatedList]);
    } else {
      let nextVehicles = [...vehicles];
      if (orig) {
        if (!vehicles.some((v) => v.id === orig.id || v.registrationNumber === orig.registrationNumber)) {
          nextVehicles = [{ ...orig, status: 'Active' }, ...vehicles];
        } else {
          const restoredVeh: Vehicle = {
            ...orig,
            id: `VEH${(vehicles.length + 1).toString().padStart(3, '0')}`,
            status: 'Active',
            remarks: `Restored from Deleted Vehicles on ${new Date().toISOString().substring(0, 10)}`,
          };
          nextVehicles = [restoredVeh, ...vehicles];
        }
      } else {
        const fallbackVeh: Vehicle = {
          id: `VEH${(vehicles.length + 1).toString().padStart(3, '0')}`,
          registrationNumber: recordToRestore.registrationNumber,
          model: recordToRestore.model || 'Unknown Model',
          manufacturer: recordToRestore.manufacturer || 'Unknown',
          year: recordToRestore.year || new Date().getFullYear(),
          fuelType: recordToRestore.fuelType || 'Diesel',
          transmission: 'Manual',
          vehicleType: recordToRestore.vehicleType || 'Sedan',
          ownerId: 'new',
          ownerName: recordToRestore.ownerName || 'Unknown Owner',
          driverId: 'new',
          driverName: recordToRestore.driverName || 'Unknown Driver',
          company: recordToRestore.company || '',
          site: recordToRestore.site || '',
          joiningDate: recordToRestore.joiningDate || new Date().toISOString().substring(0, 10),
          status: 'Active',
          emiAmount: 0,
          emiDueDate: '',
          insuranceExpiry: '',
          permitExpiry: '',
          fcExpiry: '',
          pollutionExpiry: '',
          fastagNumber: '',
          remarks: 'Restored from Deleted Vehicles',
        };
        nextVehicles = [fallbackVeh, ...vehicles];
      }

      // Automatically restore/add Owner to Owner Master if missing
      const ownerNameCandidate = recordToRestore.ownerName || orig?.ownerName || '';
      const hasValidOwnerName = ownerNameCandidate && ownerNameCandidate.trim() && ownerNameCandidate.trim().toUpperCase() !== 'N/A' && ownerNameCandidate.trim().toLowerCase() !== 'unknown owner';

      const ownerExists = owners.some((o) => {
        if (recordToRestore.associatedOwner && o.id === recordToRestore.associatedOwner.id) return true;
        if (orig?.ownerId && orig.ownerId !== 'new' && o.id === orig.ownerId) return true;
        if (hasValidOwnerName && o.name && o.name.trim().toLowerCase() === ownerNameCandidate.trim().toLowerCase()) return true;
        return false;
      });

      if (!ownerExists && (recordToRestore.associatedOwner || hasValidOwnerName)) {
        const ownerToStore: Owner = recordToRestore.associatedOwner || {
          id: orig?.ownerId && orig.ownerId !== 'new' ? orig.ownerId : `OWN${(owners.length + 1).toString().padStart(2, '0')}`,
          name: ownerNameCandidate,
          phone: '',
          email: '',
          address: '',
          bankName: '',
          accountNumber: '',
          ifsc: '',
          upiId: '',
          pan: '',
          aadhaar: '',
          remarks: `Restored automatically with Vehicle ${recordToRestore.registrationNumber || ''}`,
        };
        updateOwners(sanitizeUniqueEntities([ownerToStore, ...owners], 'OWN', 2));
      }

      // Automatically restore/add Driver to Driver Master if missing
      const driverNameCandidate = recordToRestore.driverName || orig?.driverName || '';
      const hasValidDriverName = driverNameCandidate && driverNameCandidate.trim() && driverNameCandidate.trim().toUpperCase() !== 'N/A' && driverNameCandidate.trim().toLowerCase() !== 'unknown driver';

      const driverExists = drivers.some((d) => {
        if (recordToRestore.associatedDriver && d.id === recordToRestore.associatedDriver.id) return true;
        if (orig?.driverId && orig.driverId !== 'new' && d.id === orig.driverId) return true;
        if (hasValidDriverName && d.name && d.name.trim().toLowerCase() === driverNameCandidate.trim().toLowerCase()) return true;
        return false;
      });

      if (!driverExists && (recordToRestore.associatedDriver || hasValidDriverName)) {
        const driverToStore: Driver = recordToRestore.associatedDriver || {
          id: orig?.driverId && orig.driverId !== 'new' ? orig.driverId : `DRV${(drivers.length + 1).toString().padStart(2, '0')}`,
          name: driverNameCandidate,
          phone: '',
          address: '',
          badgeNumber: '',
          badgeExpiry: '',
          licenceNumber: '',
          licenceExpiry: '',
          aadhaar: '',
          pan: '',
          emergencyContact: '',
          salary: 0,
          joiningDate: new Date().toISOString().substring(0, 10),
          status: 'Active',
        };
        updateDrivers(sanitizeUniqueEntities([driverToStore, ...drivers], 'DRV', 2));
      }

      updateVehicles(nextVehicles);
    }

    updateDeletedVehicles(deletedVehicles.filter((dv) => dv.id !== recordToRestore.id));
  };

  if (!adminEmail) {
    return (
      <AdminLogin
        onLoginSuccess={(email) => {
          setAdminEmail(email);
        }}
      />
    );
  }

  const renderSidebarContent = () => {
    const navItems = [
      { name: 'Dashboard' as const, icon: LayoutDashboard },
      { name: 'Vehicles' as const, icon: Car },
      { name: 'Owners' as const, icon: Users },
      { name: 'Drivers' as const, icon: ShieldCheck },
      { name: 'Companies / Sites' as const, icon: Building2 },
      { name: 'Attachments' as const, icon: FileCheck2 },
      { name: 'Daily Running' as const, icon: Gauge },
      { name: 'Advances' as const, icon: CreditCard },
      { name: 'Recoveries' as const, icon: RotateCcw },
      { name: 'Expenses' as const, icon: TrendingDown },
      { name: 'Invoices' as const, icon: Receipt },
      { name: 'Payments' as const, icon: DollarSign },
      { name: 'Reports / MIS' as const, icon: TrendingUp },
      { name: 'Documents' as const, icon: Files },
      { name: 'Settings' as const, icon: SettingsIcon },
    ];

    return (
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.name;
          return (
            <button
              key={item.name}
              id={`sidebar-btn-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => handleNavigate(item.name)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#007A63] text-white shadow-xs font-bold'
                  : 'text-[#172033] hover:bg-[#006B57]/10 hover:text-[#006B57]'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[#D4A72C]' : 'text-[#64748B]'}`} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}

        <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
          <button
            id="sidebar-btn-logout"
            onClick={() => {
              localStorage.removeItem('e7_admin_session_active');
              setAdminEmail(null);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#F5F7F9] text-[#172033] flex flex-col font-sans antialiased selection:bg-[#006B57]/20 overflow-hidden">
      
      {/* 1. HEADER BAR - Dark Emerald with Gold Accents */}
      <header className="bg-[#004D40] text-white border-b border-[#00382E] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-40 shadow-sm print:hidden shrink-0">
        
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-[#006B57] lg:hidden transition-colors cursor-pointer"
            title="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => handleNavigate('Dashboard')}
          >
            <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-xl bg-[#00382E] border border-[#D4A72C]/40 shadow-xs shrink-0 group-hover:border-[#D4A72C] transition-all">
              {customLogo ? (
                <img src={customLogo} alt="E7 Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 18C4 10.268 10.268 4 18 4C25.732 4 32 10.268 32 18" stroke="#D4A72C" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2"/>
                  <path d="M10 12H18M10 18H16M10 24H18M10 12V24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 12H28L22 24" stroke="#D4A72C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-[#D4A72C] tracking-tighter leading-none">E7</span>
                <span className="text-sm font-black text-white tracking-widest leading-none uppercase">TRAVELS</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold text-[#F5E7B2] tracking-wider uppercase">FLEET ERP</span>
                <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-[#00382E] text-emerald-200 border border-emerald-600/40 font-semibold uppercase">Chennai Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="relative flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-300 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search vehicle number, owner, driver, site..."
              className="w-full bg-[#00382E] text-white placeholder-emerald-200/60 text-xs rounded-lg pl-9 pr-8 py-2 border border-[#006B57] focus:border-[#D4A72C] focus:ring-1 focus:ring-[#D4A72C] focus:outline-hidden transition-all shadow-inner"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-emerald-300 hover:text-white rounded cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Match Results Floating Dropdown */}
          {searchResults && globalSearch.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white text-[#172033] rounded-xl shadow-2xl border border-[#E2E8F0] overflow-hidden z-50 max-h-96 overflow-y-auto">
              <div className="p-2.5 border-b border-[#E2E8F0] bg-[#F5F7F9] flex items-center justify-between text-2xs font-bold text-[#64748B] uppercase">
                <span>Fleet Records Matched ({searchResults.total})</span>
                <button onClick={() => setGlobalSearch('')} className="text-slate-400 hover:text-slate-700 cursor-pointer">Close</button>
              </div>
              {searchResults.total === 0 ? (
                <div className="p-5 text-center text-xs text-slate-500 font-medium">
                  No matching fleet records found for "{globalSearch}"
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0] text-xs">
                  {searchResults.vehicles.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-bold text-[#006B57] uppercase tracking-wider block mb-1">Vehicles</span>
                      {searchResults.vehicles.map(v => (
                        <button
                          key={v.id}
                          onClick={() => {
                            handleNavigate('Vehicle Master');
                            setGlobalSearch('');
                          }}
                          className="w-full text-left p-1.5 hover:bg-[#006B57]/5 rounded-lg flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-bold text-[#172033]">{v.vehicleNumber}</span>
                          <span className="text-2xs text-[#64748B]">{v.makeModel} • {v.ownerName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.owners.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block mb-1">Owners</span>
                      {searchResults.owners.map(o => (
                        <button
                          key={o.id}
                          onClick={() => {
                            handleNavigate('Owner Master');
                            setGlobalSearch('');
                          }}
                          className="w-full text-left p-1.5 hover:bg-[#006B57]/5 rounded-lg flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-bold text-[#172033]">{o.name}</span>
                          <span className="text-2xs text-[#64748B]">{o.mobile}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.drivers.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider block mb-1">Drivers</span>
                      {searchResults.drivers.map(d => (
                        <button
                          key={d.id}
                          onClick={() => {
                            handleNavigate('Driver Master');
                            setGlobalSearch('');
                          }}
                          className="w-full text-left p-1.5 hover:bg-[#006B57]/5 rounded-lg flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-bold text-[#172033]">{d.name}</span>
                          <span className="text-2xs text-[#64748B]">{d.mobile}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Sync Controls, Notifications & Admin profile */}
        <div className="flex items-center gap-3">
          {/* Automatic Firebase Sync Status Indicator (Passive, non-interactive) */}
          <div
            id="cloud-db-sync-status"
            className={`hidden sm:flex items-center gap-2 border rounded-lg p-1.5 px-3 select-none transition-colors ${
              isQuotaExceeded
                ? 'bg-[#00382E] border-amber-500/50 text-amber-300'
                : 'bg-[#00382E] border-[#006B57] text-white'
            }`}
            title={
              isQuotaExceeded
                ? 'Firestore daily quota reached. Data safely saved locally in browser.'
                : 'All fleet changes are automatically saved to Firebase Firestore in real time.'
            }
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {cloudStatusMsg === 'syncing' ? (
                <span className="animate-spin inline-flex h-full w-full rounded-full border border-[#D4A72C] border-t-transparent"></span>
              ) : isQuotaExceeded ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </>
              )}
            </span>
            <div className="text-left select-none">
              <p className={`text-[9px] font-bold leading-none uppercase tracking-wider ${isQuotaExceeded ? 'text-amber-300' : 'text-[#F5E7B2]'}`}>
                {isQuotaExceeded ? 'Offline Mode' : 'Firebase Cloud'}
              </p>
              <p className={`text-[8px] leading-none mt-0.5 font-extrabold ${isQuotaExceeded ? 'text-amber-400' : 'text-emerald-300'}`}>
                {cloudStatusMsg === 'syncing' ? 'AUTO-SAVING...' : isQuotaExceeded ? 'QUOTA LIMIT' : 'AUTO-SAVED'}
              </p>
            </div>
          </div>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-[#00382E] hover:bg-[#006B57] text-emerald-100 hover:text-white border border-[#006B57] transition-colors relative cursor-pointer"
              title="Fleet Alerts & Notifications"
            >
              <Bell className="h-4 w-4" />
              {totalAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4A72C] text-[#172033] font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalAlertsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white text-[#172033] rounded-xl shadow-2xl border border-[#E2E8F0] p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-[#006B57]" /> Operations & Fleet Alerts
                  </h4>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  {docPendingCount > 0 && (
                    <div
                      onClick={() => {
                        handleNavigate('Vehicle Master', 'doc_pending');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer transition-colors flex items-start gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#7C3AED] mt-1 shrink-0"></span>
                      <div className="flex-1">
                        <p className="font-bold text-purple-900">{docPendingCount} Vehicles Pending Office Docs</p>
                        <p className="text-2xs text-purple-700 mt-0.5">Physical office document submission pending</p>
                      </div>
                    </div>
                  )}
                  {inactiveVehiclesCount > 0 && (
                    <div
                      onClick={() => {
                        handleNavigate('Vehicle Master', 'idle');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors flex items-start gap-2.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400 mt-1 shrink-0"></span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{inactiveVehiclesCount} Inactive Vehicles</p>
                        <p className="text-2xs text-slate-500 mt-0.5">Review readiness or maintenance status</p>
                      </div>
                    </div>
                  )}
                  <div className="p-2 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-2xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#006B57] shrink-0" />
                    <span>Firebase Cloud sync is operating in real time.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Card */}
          <div className="flex items-center gap-2 bg-[#00382E] border border-[#006B57] rounded-lg p-1.5 pl-2 pr-2 text-white">
            <div className="w-7 h-7 rounded-md bg-[#D4A72C] text-[#172033] font-black flex items-center justify-center text-xs shadow-xs shrink-0">
              A
            </div>
            <div className="hidden lg:block text-left overflow-hidden">
              <p className="text-[11px] font-bold text-white leading-none truncate max-w-[110px]">{adminEmail || 'admin'}</p>
              <p className="text-[8px] text-[#F5E7B2] font-semibold mt-0.5 tracking-wider uppercase">Administrator</p>
            </div>
            <button
              id="header-logout-btn"
              onClick={() => {
                localStorage.removeItem('e7_admin_session_active');
                setAdminEmail(null);
              }}
              className="p-1 hover:bg-[#004D40] text-emerald-200 hover:text-rose-400 rounded transition-colors cursor-pointer ml-1"
              title="Logout Administrator"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Google Sheets Sync Trigger */}
          <div className="hidden xl:flex items-center gap-2 pl-1 border-l border-[#006B57]">
            <button
              id="sync-trigger-btn"
              onClick={handleForceRefresh}
              className={`p-2 border border-[#006B57] bg-[#00382E] hover:bg-[#006B57] rounded-lg text-emerald-100 hover:text-white transition-all cursor-pointer ${
                isSyncing ? 'animate-spin text-[#D4A72C]' : ''
              }`}
              title="Reconcile with Google Sheets"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Quota Exceeded Banner */}
      {isQuotaExceeded && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold gap-2 border-b border-amber-600 shadow-xs print:hidden z-50">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <AlertTriangle className="h-4 w-4 shrink-0 text-slate-950" />
            <span>
              <strong>Firestore Free Tier Quota Exceeded:</strong> Cloud database sync is temporarily paused for today. App is safely running in <strong>Local Offline Mode</strong> with browser storage persistence.
            </span>
          </div>
          <a
            href="https://console.firebase.google.com/project/cedar-vial-g3bk6/firestore/databases/ai-studio-e7travelsfleeter-7831b2b1-8c2e-451d-8c58-df75c7d4aafc/data?openUpgradeDialog=true"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-950 text-white hover:bg-slate-800 px-3 py-1 rounded text-2xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors shadow-xs"
          >
            Manage / Upgrade Firestore Plan →
          </a>
        </div>
      )}

      {/* Main Body Layout: Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-white h-full flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-[#004D40] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#D4A72C]">E7</span>
                  <span className="text-xs font-black text-white tracking-widest uppercase">TRAVELS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-[#006B57]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-3 flex-1 overflow-y-auto">
                {renderSidebarContent()}
              </div>
            </div>
          </div>
        )}

        {/* 2. SIDEBAR - White Background, Dark Navy/Emerald Text, Emerald Active Background */}
        <aside className="w-64 bg-white text-[#172033] hidden lg:flex flex-col shrink-0 h-full border-r border-[#E2E8F0] shadow-xs select-none print:hidden">
          <div className="p-3 flex-1 overflow-y-auto">
            {renderSidebarContent()}
          </div>
          <div className="p-3 border-t border-[#E2E8F0] bg-[#F5F7F9] text-[#64748B] text-4xs font-mono shrink-0">
            <div className="flex items-center justify-between px-2 bg-white p-2 rounded-lg border border-[#E2E8F0]">
              <span className="font-semibold text-slate-700">Hub: Chennai HQ</span>
              <span className="text-[#006B57] font-bold">ONLINE</span>
            </div>
          </div>
        </aside>

        {/* 3. MAIN WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-5 print:p-0 print:overflow-visible bg-[#F5F7F9]">
          
          {authError && (
            <div id="auth-error-banner" className="bg-amber-50 border border-amber-200 text-slate-800 p-4 rounded-xl flex items-start gap-4 shadow-sm relative">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Google Sign-In Notice</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {authError.message}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg shadow-2xs"
                  >
                    <ExternalLink className="h-3 w-3" /> Open in New Tab
                  </a>
                  <button
                    onClick={handleLogin}
                    className="btn-gold px-3 py-1 text-[11px] font-bold rounded-lg shadow-2xs cursor-pointer"
                  >
                    Retry Sign-In
                  </button>
                  <button
                    onClick={() => setAuthError(null)}
                    className="btn-secondary px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    Use Offline Sandbox Mode
                  </button>
                </div>
              </div>
              <button
                onClick={() => setAuthError(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                title="Dismiss warning"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Sub Navigation deck (Where necessary depending on chosen Tab) */}
          {['Registers', 'Transactions', 'Ledgers', 'Settlement', 'Documents'].includes(activeTab) && (
            <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl max-w-max border border-[#E2E8F0] print:hidden shadow-xs mb-4">
              {activeTab === 'Registers' &&
                (['Vehicle Master', 'Owner Master', 'Driver Master', 'Company Master', 'Vendor Register', 'Deleted Vehicles'] as const).map((sub) => (
                  <button
                    id={`sub-tab-btn-${sub.toLowerCase().replace(/\s+/g, '-')}`}
                    key={sub}
                    onClick={() => setActiveSubTab(sub)}
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeSubTab === sub ? 'bg-[#006B57] text-white shadow-xs' : 'text-[#64748B] hover:text-[#006B57] hover:bg-[#006B57]/5'
                    }`}
                  >
                    {sub === 'Vendor Register' ? 'Vendor Register' : sub === 'Deleted Vehicles' ? 'Deleted Vehicles' : `${sub.split(' ')[0]} Master`}
                    {sub === 'Deleted Vehicles' && deletedVehicles.length > 0 && (
                      <span className="bg-[#EF4444] text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold leading-none">
                        {deletedVehicles.length}
                      </span>
                    )}
                  </button>
                ))}

              {activeTab === 'Transactions' &&
                (['Company Payments', 'Expense Entry', 'Weekly Settlement'] as const).map((sub) => (
                  <button
                    id={`sub-tab-btn-${sub}`}
                    key={sub}
                    onClick={() => setActiveSubTab(sub)}
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeSubTab === sub ? 'bg-[#006B57] text-white shadow-xs' : 'text-[#64748B] hover:text-[#006B57] hover:bg-[#006B57]/5'
                    }`}
                  >
                    {sub}
                  </button>
                ))}

              {activeTab === 'Ledgers' &&
                (['Vehicle Ledger', 'Owner Ledger'] as const).map((sub) => (
                  <button
                    id={`sub-tab-btn-${sub}`}
                    key={sub}
                    onClick={() => setActiveSubTab(sub)}
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeSubTab === sub ? 'bg-[#006B57] text-white shadow-xs' : 'text-[#64748B] hover:text-[#006B57] hover:bg-[#006B57]/5'
                    }`}
                  >
                    {sub}
                  </button>
                ))}

              {activeTab === 'Settlement' &&
                (['Monthly Settlement', 'Owner Statement', 'Driver Statement', 'Invoice', 'Payment Voucher'] as const).map((sub) => (
                  <button
                    id={`sub-tab-btn-${sub}`}
                    key={sub}
                    onClick={() => setActiveSubTab(sub)}
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeSubTab === sub ? 'bg-[#006B57] text-white shadow-xs' : 'text-[#64748B] hover:text-[#006B57] hover:bg-[#006B57]/5'
                    }`}
                  >
                    {sub.split(' ')[0]}
                  </button>
                ))}

              {activeTab === 'Documents' &&
                (['Tax Invoice', 'Letter Head'] as const).map((sub) => (
                  <button
                    id={`sub-tab-btn-${sub}`}
                    key={sub}
                    onClick={() => setActiveSubTab(sub as any)}
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeSubTab === sub ? 'bg-[#006B57] text-white shadow-xs' : 'text-[#64748B] hover:text-[#006B57] hover:bg-[#006B57]/5'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
            </div>
          )}

          {/* RENDER SELECTED MAIN TAB */}
          {activeTab === 'Dashboard' && (
            <Dashboard
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              companies={companies}
              sites={sites}
              expenses={expenses}
              payments={payments}
              advances={advances}
              recoveries={recoveries}
              onNavigate={handleNavigate}
              onQuickEntry={() => handleNavigate('Vehicles')}
            />
          )}

          {activeTab === 'Vehicles' && (
            <VehiclesView
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              companies={companies}
              sites={sites}
              payments={payments}
              expenses={expenses}
              advances={advances}
              recoveries={recoveries}
              dailyRunning={dailyRunning}
              invoices={invoices}
              onUpdateVehicles={updateVehicles}
              onNavigateToInvoice={() => handleNavigate('Invoices')}
              onNavigateToSettlement={() => handleNavigate('Settlement')}
            />
          )}

          {activeTab === 'Owners' && (
            <OwnersView
              owners={owners}
              vehicles={vehicles}
              advances={advances}
              onUpdateOwners={updateOwners}
            />
          )}

          {activeTab === 'Drivers' && (
            <DriversView
              drivers={drivers}
              vehicles={vehicles}
              onUpdateDrivers={updateDrivers}
            />
          )}

          {activeTab === 'Companies / Sites' && (
            <CompaniesSitesView
              companies={companies}
              sites={sites}
              vehicles={vehicles}
              onUpdateCompanies={updateCompanies}
              onUpdateSites={updateSites}
            />
          )}

          {activeTab === 'Attachments' && (
            <AttachmentsView
              attachments={attachments}
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              onUpdateAttachments={updateAttachments}
            />
          )}

          {activeTab === 'Daily Running' && (
            <DailyRunningView
              dailyRunning={dailyRunning}
              vehicles={vehicles}
              drivers={drivers}
              onUpdateDailyRunning={updateDailyRunning}
            />
          )}

          {activeTab === 'Advances' && (
            <AdvancesView
              advances={advances}
              vehicles={vehicles}
              onUpdateAdvances={updateAdvances}
              onNavigateToRecovery={() => handleNavigate('Recoveries')}
            />
          )}

          {activeTab === 'Recoveries' && (
            <RecoveriesView
              recoveries={recoveries}
              advances={advances}
              vehicles={vehicles}
              onUpdateRecoveries={updateRecoveries}
              onUpdateAdvances={updateAdvances}
            />
          )}

          {activeTab === 'Expenses' && (
            <ExpensesView
              expenses={expenses}
              vehicles={vehicles}
              onUpdateExpenses={updateExpenses}
            />
          )}

          {activeTab === 'Invoices' && (
            <InvoicesView
              invoices={invoices}
              vehicles={vehicles}
              companies={companies}
              onUpdateInvoices={updateInvoices}
            />
          )}

          {activeTab === 'Payments' && (
            <PaymentsView
              payments={paymentsRecord}
              companies={companies}
              invoices={invoices}
              onUpdatePayments={updatePaymentsRecord}
            />
          )}

          {activeTab === 'Reports / MIS' && (
            <ReportsMisView
              vehicles={vehicles}
              owners={owners}
              companies={companies}
              sites={sites}
              payments={payments}
              expenses={expenses}
              advances={advances}
              recoveries={recoveries}
            />
          )}

          {activeTab === 'Registers' && (
            <MasterViews
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              companies={companies}
              sites={sites}
              activeSubView={activeSubTab as any}
              vehicleFilter={vehicleFilter}
              onSetVehicleFilter={setVehicleFilter}
              onUpdateVehicles={updateVehicles}
              onUpdateOwners={updateOwners}
              onUpdateDrivers={updateDrivers}
              onUpdateCompanies={updateCompanies}
              onUpdateSites={updateSites}
              deletedVehicles={deletedVehicles}
              onUpdateDeletedVehicles={updateDeletedVehicles}
              onRestoreVehicle={restoreVehicle}
              customLogo={customLogo}
            />
          )}

          {activeTab === 'Transactions' && (
            <TransactionViews
              vehicles={vehicles}
              companies={companies}
              payments={payments}
              expenses={expenses}
              activeSubView={activeSubTab as any}
              onUpdatePayments={updatePayments}
              onUpdateExpenses={updateExpenses}
            />
          )}

          {activeTab === 'Ledgers' && (
            <LedgerViews
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              payments={payments}
              expenses={expenses}
              activeSubView={activeSubTab as any}
            />
          )}

          {activeTab === 'Settlement' && (
            <SettlementViews
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              payments={payments}
              expenses={expenses}
              activeSubView={activeSubTab as any}
              customLogo={customLogo}
            />
          )}

          {activeTab === 'Reports' && (
            <Reports
              vehicles={vehicles}
              expenses={expenses}
              payments={payments}
            />
          )}

          {activeTab === 'Rules' && (
            <RulesView customLogo={customLogo} />
          )}

          {activeTab === 'Documents' && (
            <DocumentViews
              vehicles={vehicles}
              companies={companies}
              owners={owners}
              drivers={drivers}
              activeSubView={activeSubTab as any}
              customLogo={customLogo}
              onUpdateLogo={(newLogo) => {
                setCustomLogo(newLogo);
                if (newLogo) {
                  try {
                    localStorage.setItem('e7_custom_logo', newLogo);
                  } catch (err) {
                    console.error('Failed to save custom logo to localStorage:', err);
                  }
                } else {
                  try {
                    localStorage.removeItem('e7_custom_logo');
                  } catch (err) {
                    console.error('Failed to remove custom logo from localStorage:', err);
                  }
                }
              }}
            />
          )}

          {activeTab === 'VBA Export' && (
            <VbaExport
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              payments={payments}
              expenses={expenses}
            />
          )}

          {activeTab === 'Settings' && (
            <SettingsView
              financialSettings={financialSettings}
              vehicles={vehicles}
              companies={companies}
              sites={sites}
              onUpdateFinancialSettings={updateFinancialSettings}
              onExportBackupJSON={handleExportBackupJSON}
              onImportBackupJSON={handleImportBackupJSON}
            />
          )}

        </main>
      </div>

      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl z-[9999] transition-all duration-300 animate-slide-up ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 animate-fade-in' 
            : toast.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200 animate-fade-in' 
            : 'bg-blue-50 text-blue-800 border-blue-200 animate-fade-in'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
          ) : (
            <Database className="h-4.5 w-4.5 text-blue-600 shrink-0" />
          )}
          <span className="text-[11px] font-bold tracking-tight">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="p-0.5 hover:bg-black/5 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
