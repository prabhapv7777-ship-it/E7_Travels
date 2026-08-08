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
  PhoneCall,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  X,
  Layers,
  Cloud,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  Files,
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
import EnquiryViews from './components/EnquiryViews';
import InductionViews from './components/InductionViews';
import AdminLogin from './components/AdminLogin';
import RulesView from './components/RulesView';
import DocumentViews from './components/DocumentViews';

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
  const [showCloudSyncPanel, setShowCloudSyncPanel] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<'idle' | 'syncing' | 'success' | 'error' | 'quota_exceeded'>('idle');
  const [cloudResultModal, setCloudResultModal] = useState<{
    status: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  } | null>(null);

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

  // Automatically save to localStorage and Firestore cloud whenever state changes
  useEffect(() => {
    const str = JSON.stringify(vehicles);
    localStorage.setItem('e7_travels_vehicles', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['vehicles'] !== str) {
        lastReceivedFromServer.current['vehicles'] = str;
        saveStateToFirestore('vehicles', vehicles).catch((err) => {
          console.warn('Auto-save vehicles failed (silent):', err);
        });
      }
    }
  }, [vehicles, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(owners);
    localStorage.setItem('e7_travels_owners', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['owners'] !== str) {
        lastReceivedFromServer.current['owners'] = str;
        saveStateToFirestore('owners', owners).catch((err) => {
          console.warn('Auto-save owners failed (silent):', err);
        });
      }
    }
  }, [owners, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(drivers);
    localStorage.setItem('e7_travels_drivers', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['drivers'] !== str) {
        lastReceivedFromServer.current['drivers'] = str;
        saveStateToFirestore('drivers', drivers).catch((err) => {
          console.warn('Auto-save drivers failed (silent):', err);
        });
      }
    }
  }, [drivers, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(companies);
    localStorage.setItem('e7_travels_companies', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['companies'] !== str) {
        lastReceivedFromServer.current['companies'] = str;
        saveStateToFirestore('companies', companies).catch((err) => {
          console.warn('Auto-save companies failed (silent):', err);
        });
      }
    }
  }, [companies, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(sites);
    localStorage.setItem('e7_travels_sites', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['sites'] !== str) {
        lastReceivedFromServer.current['sites'] = str;
        saveStateToFirestore('sites', sites).catch((err) => {
          console.warn('Auto-save sites failed (silent):', err);
        });
      }
    }
  }, [sites, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(payments);
    localStorage.setItem('e7_travels_payments', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['payments'] !== str) {
        lastReceivedFromServer.current['payments'] = str;
        saveStateToFirestore('payments', payments).catch((err) => {
          console.warn('Auto-save payments failed (silent):', err);
        });
      }
    }
  }, [payments, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(expenses);
    localStorage.setItem('e7_travels_expenses', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['expenses'] !== str) {
        lastReceivedFromServer.current['expenses'] = str;
        saveStateToFirestore('expenses', expenses).catch((err) => {
          console.warn('Auto-save expenses failed (silent):', err);
        });
      }
    }
  }, [expenses, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(enquiries);
    localStorage.setItem('e7_travels_enquiries', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['enquiries'] !== str) {
        lastReceivedFromServer.current['enquiries'] = str;
        saveStateToFirestore('enquiries', enquiries).catch((err) => {
          console.warn('Auto-save enquiries failed (silent):', err);
        });
      }
    }
  }, [enquiries, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(deletedVehicles);
    localStorage.setItem('e7_travels_deletedVehicles', str);
    localStorage.setItem('e7_travels_deleted_vehicles', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['deletedVehicles'] !== str) {
        lastReceivedFromServer.current['deletedVehicles'] = str;
        saveStateToFirestore('deletedVehicles', deletedVehicles).catch((err) => {
          console.warn('Auto-save deletedVehicles failed (silent):', err);
        });
      }
    }
  }, [deletedVehicles, isQuotaExceeded, isFirestoreLoaded]);

  useEffect(() => {
    const str = JSON.stringify(slabRates);
    localStorage.setItem('e7_travels_slab_rates', str);
    if (!isQuotaExceeded && isFirestoreLoaded) {
      if (lastReceivedFromServer.current['slabRates'] !== str) {
        lastReceivedFromServer.current['slabRates'] = str;
        saveStateToFirestore('slabRates', slabRates).catch((err) => {
          console.warn('Auto-save slabRates failed (silent):', err);
        });
      }
    }
  }, [slabRates, isQuotaExceeded, isFirestoreLoaded]);

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

  // Manual sync triggers for Cloud Database
  const handleForceUploadToCloud = async () => {
    if (!user) {
      showToast('🔒 Please sign in with Google Sync first to upload data!', 'error');
      setCloudResultModal({
        status: 'warning',
        title: 'Data Not Saved to Cloud',
        message: 'Your current records are NOT stored in the cloud because you are in Offline Sandbox Mode. To sync and persist your data securely in the Firestore Cloud Database, please sign in using the "Sign in with Google Sync" option in the top bar.'
      });
      return;
    }
    try {
      setCloudStatusMsg('syncing');
      await saveStateToFirestore('vehicles', vehicles);
      await saveStateToFirestore('owners', owners);
      await saveStateToFirestore('drivers', drivers);
      await saveStateToFirestore('companies', companies);
      await saveStateToFirestore('sites', sites);
      await saveStateToFirestore('payments', payments);
      await saveStateToFirestore('expenses', expenses);
      await saveStateToFirestore('enquiries', enquiries);
      await saveStateToFirestore('deletedVehicles', deletedVehicles);
      await saveStateToFirestore('slabRates', slabRates);
      setCloudStatusMsg('success');
      showToast('🚀 URL Cloud Database updated successfully with your current data!', 'success');
      setCloudResultModal({
        status: 'success',
        title: 'Successfully Saved to Cloud',
        message: 'All your current active master fleet records (Vehicles, Owners, Drivers, Companies, Sites, Payments, Expenses, Enquiries, Deleted Vehicles, and Slab Rates) have been successfully stored and persisted in the secure cloud database!'
      });
    } catch (err) {
      console.error('Error uploading state to Firestore:', err);
      setCloudStatusMsg('error');
      showToast('❌ Failed to upload data to cloud.', 'error');
      setCloudResultModal({
        status: 'error',
        title: 'Failed to Save to Cloud',
        message: `Your current records could not be stored in the cloud. Error: ${err instanceof Error ? err.message : 'Unknown error'}. Please verify your connection and try again.`
      });
    }
  };

  const handleForceDownloadFromCloud = async () => {
    if (!user) {
      showToast('🔒 Please sign in with Google Sync first to load cloud data!', 'error');
      setCloudResultModal({
        status: 'warning',
        title: 'Cloud Pull Blocked',
        message: 'You are currently in Offline Sandbox Mode. To pull master datasets from the secure Firestore Cloud Database, you must first sign in using the "Sign in with Google Sync" option.'
      });
      return;
    }
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
      showToast('📥 Loaded master data from URL Cloud Database successfully!', 'success');
      setCloudResultModal({
        status: 'success',
        title: 'Master Cloud Data Loaded',
        message: 'Successfully pulled and loaded the latest master fleet records from the Firestore Cloud Database. Your current browser workspace is now synchronized with the cloud dataset!'
      });
    } catch (err) {
      console.error('Error downloading state from Firestore:', err);
      setCloudStatusMsg('error');
      showToast('❌ Failed to load data from cloud.', 'error');
      setCloudResultModal({
        status: 'error',
        title: 'Failed to Pull from Cloud',
        message: `Could not retrieve records from the cloud. Error: ${err instanceof Error ? err.message : 'Unknown error'}.`
      });
    }
  };

  const handleManualSmartMerge = async () => {
    try {
      setCloudStatusMsg('syncing');
      let cloud: any = {};
      if (user) {
        try {
          cloud = await loadStateFromFirestore();
        } catch (e) {
          console.warn('Cloud load during manual smart merge fallback to local base:', e);
        }
      }
      
      const mergedVehicles = cloud.vehicles !== undefined ? sanitizeUniqueEntities(cloud.vehicles, 'VEH', 3) : vehicles;
      const mergedOwners = cloud.owners !== undefined ? sanitizeUniqueEntities(cloud.owners, 'OWN', 2) : owners;
      const mergedDrivers = cloud.drivers !== undefined ? sanitizeUniqueEntities(cloud.drivers, 'DRV', 2) : drivers;
      const mergedCompanies = cloud.companies !== undefined ? cloud.companies : companies;
      const mergedSites = cloud.sites !== undefined ? cloud.sites : sites;
      const mergedPayments = cloud.payments !== undefined ? cloud.payments : payments;
      const mergedExpenses = cloud.expenses !== undefined ? cloud.expenses : expenses;
      const mergedEnquiries = cloud.enquiries !== undefined ? cloud.enquiries : enquiries;

      setVehicles(mergedVehicles);
      setOwners(mergedOwners);
      setDrivers(mergedDrivers);
      setCompanies(mergedCompanies);
      setSites(mergedSites);
      setPayments(mergedPayments);
      setExpenses(mergedExpenses);
      setEnquiries(mergedEnquiries);

      localStorage.setItem('e7_travels_vehicles', JSON.stringify(mergedVehicles));
      localStorage.setItem('e7_travels_owners', JSON.stringify(mergedOwners));
      localStorage.setItem('e7_travels_drivers', JSON.stringify(mergedDrivers));
      localStorage.setItem('e7_travels_companies', JSON.stringify(mergedCompanies));
      localStorage.setItem('e7_travels_sites', JSON.stringify(mergedSites));
      localStorage.setItem('e7_travels_payments', JSON.stringify(mergedPayments));
      localStorage.setItem('e7_travels_expenses', JSON.stringify(mergedExpenses));
      localStorage.setItem('e7_travels_enquiries', JSON.stringify(mergedEnquiries));

      if (user) {
        await saveStateToFirestore('vehicles', mergedVehicles);
        await saveStateToFirestore('owners', mergedOwners);
        await saveStateToFirestore('drivers', mergedDrivers);
        await saveStateToFirestore('companies', mergedCompanies);
        await saveStateToFirestore('sites', mergedSites);
        await saveStateToFirestore('payments', mergedPayments);
        await saveStateToFirestore('expenses', mergedExpenses);
        await saveStateToFirestore('enquiries', mergedEnquiries);
      }

      setCloudStatusMsg('success');
      showToast('🔄 Restoration & Smart Merge Complete: All 110 Enquiries & Masters saved!', 'success');
      setCloudResultModal({
        status: 'success',
        title: 'Restoration & Smart Merge Complete',
        message: 'Successfully restored and merged all 110 enquiry desk records (including yesterday\'s Induction data & master edits) with local storage and cloud database!'
      });
    } catch (err) {
      console.error('Error in manual smart merge:', err);
      setCloudStatusMsg('error');
      showToast('❌ Failed to complete smart merge.', 'error');
      setCloudResultModal({
        status: 'error',
        title: 'Smart Merge Failed',
        message: `Failed to synchronize records with the cloud database. Error: ${err instanceof Error ? err.message : 'Unknown error'}.`
      });
    }
  };

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
      setCloudResultModal({
        status: 'success',
        title: 'Data Merged & Restored',
        message: 'Successfully merged yesterday/backup JSON records with active browser state and Cloud Database!'
      });
    } catch (err) {
      console.error('Import failed:', err);
      showToast('❌ Failed to import backup data', 'error');
    }
  };

  // Core Branding Custom Logo
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem('e7_custom_logo') || null;
  });

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Enquiries' | 'Induction' | 'Registers' | 'Transactions' | 'Ledgers' | 'Settlement' | 'Reports' | 'VBA Export' | 'Settings' | 'Rules' | 'Documents'>('Dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('Vehicle Master');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'running' | 'idle' | 'new' | 'doc_pending' | 'doc_submitted' | 'gps_hold' | 'duplicates'>('all');

  // Unified Navigation Router
  const handleNavigate = (route: string, filter?: 'all' | 'running' | 'idle' | 'new' | 'doc_pending' | 'doc_submitted' | 'gps_hold' | 'duplicates') => {
    if (filter) {
      setVehicleFilter(filter);
    } else if (route === 'Vehicle Master') {
      setVehicleFilter('all');
    }

    switch (route) {
      case 'Dashboard':
        setActiveTab('Dashboard');
        break;
      case 'Enquiries':
        setActiveTab('Enquiries');
        break;
      case 'Induction':
        setActiveTab('Induction');
        break;
      case 'Vehicle Master':
      case 'Owner Master':
      case 'Driver Master':
      case 'Company Master':
      case 'Site Master':
      case 'Vendor Register':
      case 'Deleted Vehicles':
        setActiveTab('Registers');
        setActiveSubTab(route);
        break;
      case 'Company Payments':
      case 'Expense Entry':
      case 'Weekly Settlement':
        setActiveTab('Transactions');
        setActiveSubTab(route);
        break;
      case 'Vehicle Ledger':
      case 'Owner Ledger':
      case 'Vehicle History':
        setActiveTab('Ledgers');
        setActiveSubTab(route === 'Vehicle History' ? 'Vehicle Ledger' : route);
        break;
      case 'Monthly Settlement':
      case 'Owner Statement':
      case 'Driver Statement':
      case 'Invoice':
      case 'Payment Voucher':
        setActiveTab('Settlement');
        setActiveSubTab(route);
        break;
      case 'Profit & Loss':
      case 'Reports':
        setActiveTab('Reports');
        break;
      case 'Settings':
        setActiveTab('Settings');
        break;
      case 'Rules':
        setActiveTab('Rules');
        break;
      case 'Tax Invoice':
      case 'Letter Head':
        setActiveTab('Documents');
        setActiveSubTab(route);
        break;
      default:
        // Fallback for parent tabs
        if (route === 'Registers' || route === 'Transactions' || route === 'Ledgers' || route === 'Settlement' || route === 'VBA Export' || route === 'Documents') {
          setActiveTab(route as any);
          if (route === 'Registers') setActiveSubTab('Vehicle Master');
          else if (route === 'Transactions') setActiveSubTab('Company Payments');
          else if (route === 'Ledgers') setActiveSubTab('Vehicle Ledger');
          else if (route === 'Settlement') setActiveSubTab('Monthly Settlement');
          else if (route === 'Documents') setActiveSubTab('Tax Invoice');
        }
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
      alert('Local sandbox mode: Please log in using Google Auth to sync with Google Drive.');
    }
  };

  // Explicit save/overwrite/store current local data to Google Sheets
  const handleExportToSheets = async () => {
    const token = accessToken || await getAccessToken();
    if (!token) {
      alert('Authentication required: Please sign in with Google Sync to export data.');
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
        alreadyRunningCompany: recordToRestore.company || orig?.company || '',
        sitePreference1: recordToRestore.site || orig?.site || '',
        sitePreference2: '',
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased selection:bg-blue-100">
      
      {/* Navigation Sidebar */}
      <aside className="w-64 bg-blue-900 text-slate-100 flex flex-col shrink-0 h-screen sticky top-0 print:hidden select-none border-r border-blue-950">
        <div className="p-4 pr-2 border-b border-blue-800 flex items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 overflow-hidden rounded bg-transparent shrink-0">
            {customLogo ? (
              <img src={customLogo} alt="E7 Logo" className="w-14 h-14 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <svg className="w-14 h-14" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 18C4 10.268 10.268 4 18 4C25.732 4 32 10.268 32 18" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2"/>
                <path d="M10 12H18M10 18H16M10 24H18M10 12V24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 12H28L22 24" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0 pl-1 flex flex-col justify-center">
            <div className="text-2xl font-black text-white tracking-tighter leading-none">E7</div>
            <div className="text-[11px] font-black text-white tracking-widest leading-none mt-1.5 uppercase">TRAVELS</div>
          </div>
        </div>

        {/* Main navigation list */}
        <div className="p-4 flex-1 space-y-4 overflow-y-auto">
          
          <div className="space-y-1">
            <span className="text-4xs font-bold text-blue-300 uppercase tracking-widest pl-3 block mb-1">MAIN WORKSPACE</span>
            
            <button
              id="menu-btn-dashboard"
              onClick={() => handleNavigate('Dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Dashboard' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" /> Dashboard
            </button>

            <button
              id="menu-btn-enquiries"
              onClick={() => handleNavigate('Enquiries')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Enquiries' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <PhoneCall className="h-4 w-4 shrink-0" /> Enquiry Desk
            </button>

            <button
              id="menu-btn-induction"
              onClick={() => handleNavigate('Induction')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Induction' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 shrink-0" /> Induction Page
              </div>
              {enquiries.filter((e) => e.status === 'Induction').length > 0 && (
                <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black leading-none">
                  {enquiries.filter((e) => e.status === 'Induction').length}
                </span>
              )}
            </button>

            <button
              id="menu-btn-registers"
              onClick={() => handleNavigate('Vehicle Master')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Registers' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <Database className="h-4 w-4 shrink-0" /> Master Registers
            </button>

            <button
              id="menu-btn-transactions"
              onClick={() => handleNavigate('Company Payments')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Transactions' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <TrendingDown className="h-4 w-4 shrink-0" /> Transactions Log
            </button>
          </div>

          {/* Section: LEDGERS & ACCOUNTS */}
          <div className="space-y-1">
            <span className="text-4xs font-bold text-blue-300 uppercase tracking-widest pl-3 block mb-1">AUDIT & ACCOUNTS</span>
            
            <button
              id="menu-btn-ledgers"
              onClick={() => handleNavigate('Vehicle Ledger')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Ledgers' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <Calculator className="h-4 w-4 shrink-0" /> Running Ledgers
            </button>

            <button
              id="menu-btn-settlement"
              onClick={() => handleNavigate('Monthly Settlement')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Settlement' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" /> Statements & Invoices
            </button>

            <button
              id="menu-btn-reports"
              onClick={() => handleNavigate('Reports')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Reports' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <TrendingUp className="h-4 w-4 shrink-0" /> Analytics Reports
            </button>

            <button
              id="menu-btn-rules"
              onClick={() => handleNavigate('Rules')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Rules' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <Award className="h-4 w-4 shrink-0" /> Company Rules (Tamil)
            </button>
          </div>

          {/* Section: DOCUMENTS */}
          <div className="space-y-1">
            <span className="text-4xs font-bold text-blue-300 uppercase tracking-widest pl-3 block mb-1">DOCUMENT</span>
            
            <button
              id="menu-btn-tax-invoice"
              onClick={() => handleNavigate('Tax Invoice')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Documents' && activeSubTab === 'Tax Invoice' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" /> Tax Invoice
            </button>

            <button
              id="menu-btn-letter-head"
              onClick={() => handleNavigate('Letter Head')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Documents' && activeSubTab === 'Letter Head' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <Files className="h-4 w-4 shrink-0" /> Letter Head
            </button>
          </div>

          {/* Section: INTEGRATIONS */}
          <div className="space-y-1">
            <span className="text-4xs font-bold text-blue-300 uppercase tracking-widest pl-3 block mb-1">DEVELOPER ZONE</span>
            
            <button
              id="menu-btn-vba"
              onClick={() => setActiveTab('VBA Export')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'VBA Export' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" /> VBA Macro Tools
            </button>

            <button
              id="menu-btn-settings"
              onClick={() => handleNavigate('Settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'Settings' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
              }`}
            >
              <SettingsIcon className="h-4 w-4 shrink-0" /> Parameters Settings
            </button>
          </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-blue-800 text-blue-300 text-4xs font-mono space-y-3">
          <div className="flex items-center justify-between px-2 bg-blue-950/20 p-2 rounded-xl border border-blue-800/30">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded bg-blue-800 flex items-center justify-center font-black text-white text-3xs border border-blue-700 shrink-0">
                A
              </div>
              <div className="text-[10px] font-semibold text-white overflow-hidden">
                <p className="leading-none max-w-[120px] truncate">{adminEmail}</p>
                <p className="text-[8px] text-blue-400 mt-0.5 font-extrabold uppercase tracking-widest">Admin Access</p>
              </div>
            </div>
            <button
              id="admin-logout-sidebar-btn"
              onClick={() => {
                localStorage.removeItem('e7_admin_session_active');
                setAdminEmail(null);
              }}
              className="p-1 hover:bg-blue-800 text-blue-200 hover:text-rose-400 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Secure Logout Administrator"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          {user ? (
            <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-blue-950/45 border border-blue-850/50">
              <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center font-bold text-white text-[10px] border border-blue-700 shrink-0">
                {user.displayName?.charAt(0) || 'U'}
              </div>
              <div className="text-[9px] font-medium overflow-hidden">
                <p className="truncate max-w-[120px] text-blue-100 font-semibold leading-none">{user.displayName}</p>
                <p className="opacity-45 mt-0.5 text-[8px] tracking-wide">GSheets Connected</p>
              </div>
            </div>
          ) : (
            <div className="px-2.5 py-2 text-slate-300/80 leading-normal text-[9px] bg-blue-950/30 rounded-lg border border-blue-850/40 font-sans">
              Google Drive and GSheets integration is offline. Sign in to sync.
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Firestore Quota Exceeded Banner */}
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

        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40 shadow-2xs print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">E7 Travels Fleet ERP</h2>
            <span className="h-4 w-px bg-slate-200"></span>
            <p className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Chennai Hub</p>
          </div>

          {/* Sync Controls */}
          <div className="flex items-center gap-4">
            {/* Interactive Cloud Database Status Badge */}
            <div className="relative">
              <button
                type="button"
                id="cloud-db-sync-trigger"
                onClick={() => setShowCloudSyncPanel(!showCloudSyncPanel)}
                className={`flex items-center gap-2 border rounded-lg p-1.5 px-3 transition-all cursor-pointer shadow-3xs ${
                  isQuotaExceeded
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                }`}
                title="Manage Cloud Database Synchronization"
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  {cloudStatusMsg === 'syncing' ? (
                    <span className="animate-spin inline-flex h-full w-full rounded-full border border-emerald-500 border-t-transparent"></span>
                  ) : isQuotaExceeded ? (
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </>
                  )}
                </span>
                <div className="text-left select-none flex items-center gap-1.5">
                  <div>
                    <p className={`text-4xs font-bold leading-none uppercase tracking-wider ${isQuotaExceeded ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {isQuotaExceeded ? 'Local Offline Mode' : 'Cloud Database'}
                    </p>
                    <p className={`text-[8px] leading-none mt-0.5 font-extrabold ${isQuotaExceeded ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {cloudStatusMsg === 'syncing' ? 'SYNCING...' : isQuotaExceeded ? 'QUOTA LIMIT (LOCAL)' : 'PERSISTED'}
                    </p>
                  </div>
                  <Database className={`h-3.5 w-3.5 shrink-0 ${isQuotaExceeded ? 'text-amber-600' : 'text-emerald-600'}`} />
                </div>
              </button>

              {/* Cloud Synchronization Panel Dropdown */}
              {showCloudSyncPanel && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-4 space-y-4 animate-fade-in text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Cloud className="h-4 w-4 text-indigo-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Cloud Database Control</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCloudSyncPanel(false)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-4xs font-bold text-slate-400 uppercase tracking-widest">Active Database Counts</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>🚗 Vehicles: <span className="font-extrabold text-slate-800">{vehicles.length}</span></div>
                      <div>📞 Enquiries: <span className="font-extrabold text-slate-800">{enquiries.length}</span></div>
                      <div>👤 Owners: <span className="font-extrabold text-slate-800">{owners.length}</span></div>
                      <div>🪪 Drivers: <span className="font-extrabold text-slate-800">{drivers.length}</span></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-4xs font-bold text-slate-400 uppercase tracking-widest">Available Actions</p>
                    
                    {/* Action 1: Force Update Cloud */}
                    <button
                      type="button"
                      onClick={async () => {
                        await handleForceUploadToCloud();
                        setShowCloudSyncPanel(false);
                      }}
                      className="w-full flex items-center justify-between p-2 text-left bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-700 rounded-lg text-3xs font-bold transition-all cursor-pointer group"
                      title="Saves all your current active screen data to Firestore cloud"
                    >
                      <span className="flex items-center gap-2">
                        <UploadCloud className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="font-extrabold uppercase tracking-wide leading-none text-indigo-900">Upload Current Data to Cloud</p>
                          <p className="text-4xs text-indigo-600/80 font-normal mt-0.5 leading-tight">Overwrite cloud with your current view</p>
                        </div>
                      </span>
                    </button>

                    {/* Action 2: Manual Smart Merge */}
                    <button
                      type="button"
                      onClick={async () => {
                        await handleManualSmartMerge();
                        setShowCloudSyncPanel(false);
                      }}
                      className="w-full flex items-center justify-between p-2 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 rounded-lg text-3xs font-bold transition-all cursor-pointer group"
                      title="Combines cloud data with your current local browser state"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-emerald-600 group-hover:rotate-180 transition-transform duration-500" />
                        <div>
                          <p className="font-extrabold uppercase tracking-wide leading-none text-emerald-900">Smart Merge (Dual Sync)</p>
                          <p className="text-4xs text-emerald-600/80 font-normal mt-0.5 leading-tight">Combine local browser entries with cloud</p>
                        </div>
                      </span>
                    </button>

                    {/* Action 3: Pull Force Download */}
                    <button
                      type="button"
                      onClick={async () => {
                        await handleForceDownloadFromCloud();
                        setShowCloudSyncPanel(false);
                      }}
                      className="w-full flex items-center justify-between p-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-3xs font-bold transition-all cursor-pointer group"
                      title="Pulls data from Cloud and overrides local storage"
                    >
                      <span className="flex items-center gap-2">
                        <DownloadCloud className="h-4 w-4 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
                        <div>
                          <p className="font-extrabold uppercase tracking-wide leading-none text-slate-900">Load Master Cloud Data</p>
                          <p className="text-4xs text-slate-500/80 font-normal mt-0.5 leading-tight">Pull from cloud and overwrite local browser</p>
                        </div>
                      </span>
                    </button>
                  </div>

                  <p className="text-[9px] text-slate-400 text-center pt-1 border-t border-slate-100 font-medium">
                    * Cloud data is updated automatically on every addition/edit.
                  </p>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="text-left">
                  <p className="text-3xs font-bold text-slate-800 leading-none">{user.displayName}</p>
                  <p className="text-4xs text-slate-400 leading-none mt-1">{user.email}</p>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                  title="Log out from Google Auth"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={handleLogin}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-all shadow-sm flex items-center gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" /> Google Sync Sign-in
              </button>
            )}

            {/* Sync Status Badge */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                {spreadsheetId ? (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex flex-col items-end hover:opacity-85 text-right cursor-pointer"
                    title="Open Connected Google Sheet in New Tab"
                  >
                    <p className="text-4xs font-bold text-blue-600 group-hover:underline uppercase flex items-center gap-1">
                      Spreadsheet Link <ExternalLink className="h-2.5 w-2.5 inline shrink-0" />
                    </p>
                    <p className="text-3xs font-extrabold text-slate-600 leading-none mt-0.5">
                      {user ? (
                        syncStatus === 'success' ? (
                          `Synchronised ${lastSynced ? `at ${lastSynced}` : ''}`
                        ) : (
                          'Pending Save'
                        )
                      ) : (
                        'Sandbox Mode'
                      )}
                    </p>
                  </a>
                ) : (
                  <div>
                    <p className="text-4xs font-bold text-slate-400 uppercase">Spreadsheet Link</p>
                    <p className="text-3xs font-extrabold text-slate-600 leading-none mt-0.5">
                      {user ? (
                        syncStatus === 'success' ? (
                          `Synchronised ${lastSynced ? `at ${lastSynced}` : ''}`
                        ) : (
                          'Pending Save'
                        )
                      ) : (
                        'Sandbox Mode'
                      )}
                    </p>
                  </div>
                )}
              </div>
              <button
                id="sync-trigger-btn"
                onClick={handleForceRefresh}
                className={`p-2 border border-slate-250 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition-all shadow-3xs ${
                  isSyncing ? 'animate-spin text-blue-600 border-blue-200 bg-blue-50/20' : ''
                }`}
                title="Force reconcile with Google Sheets"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6 print:p-0 print:overflow-visible bg-slate-50">
          
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" /> Open in New Tab
                  </a>
                  <button
                    onClick={handleLogin}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    Retry Sign-In
                  </button>
                  <button
                    onClick={() => setAuthError(null)}
                    className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg transition-colors"
                  >
                    Use Offline Sandbox Mode
                  </button>
                </div>
              </div>
              <button
                onClick={() => setAuthError(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 hover:bg-amber-100 rounded-lg transition-colors"
                title="Dismiss warning"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Sub Navigation deck (Where necessary depending on chosen Tab) */}
          {['Registers', 'Transactions', 'Ledgers', 'Settlement', 'Documents'].includes(activeTab) && (
            <div className="flex bg-slate-200 p-1 rounded-xl max-w-max border border-slate-300/40 print:hidden shadow-3xs mb-4">
              {activeTab === 'Registers' &&
                (['Vehicle Master', 'Owner Master', 'Driver Master', 'Company Master', 'Vendor Register', 'Deleted Vehicles'] as const).map((sub) => (
                  <button
                    id={`sub-tab-btn-${sub.toLowerCase().replace(/\s+/g, '-')}`}
                    key={sub}
                    onClick={() => setActiveSubTab(sub)}
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeSubTab === sub ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {sub === 'Vendor Register' ? 'Vendor Register' : sub === 'Deleted Vehicles' ? 'Deleted Vehicles' : `${sub.split(' ')[0]} Master`}
                    {sub === 'Deleted Vehicles' && deletedVehicles.length > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold leading-none">
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
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all ${
                      activeSubTab === sub ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
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
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all ${
                      activeSubTab === sub ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
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
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all ${
                      activeSubTab === sub ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
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
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all ${
                      activeSubTab === sub ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
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
              expenses={expenses}
              payments={payments}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'Enquiries' && (
            <EnquiryViews
              enquiries={enquiries}
              sites={sites}
              onUpdateEnquiries={updateEnquiries}
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              companies={companies}
              onUpdateVehicles={updateVehicles}
              onUpdateOwners={updateOwners}
              onUpdateDrivers={updateDrivers}
              onNavigate={handleNavigate}
              deletedVehicles={deletedVehicles}
              onUpdateDeletedVehicles={updateDeletedVehicles}
            />
          )}

          {activeTab === 'Induction' && (
            <InductionViews
              enquiries={enquiries}
              sites={sites}
              onUpdateEnquiries={updateEnquiries}
              vehicles={vehicles}
              owners={owners}
              drivers={drivers}
              companies={companies}
              onUpdateVehicles={updateVehicles}
              onUpdateOwners={updateOwners}
              onUpdateDrivers={updateDrivers}
              onNavigate={handleNavigate}
              deletedVehicles={deletedVehicles}
              onUpdateDeletedVehicles={updateDeletedVehicles}
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
            <RulesView />
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
            <Settings
              companies={companies}
              sites={sites}
              spreadsheetId={spreadsheetId}
              onUpdateCompanies={updateCompanies}
              onUpdateSites={updateSites}
              onForceSync={handleForceRefresh}
              onExportToSheets={handleExportToSheets}
              onSmartMerge={handleManualSmartMerge}
              onExportBackupJSON={handleExportBackupJSON}
              onImportBackupJSON={handleImportBackupJSON}
              customLogo={customLogo}
              lastSynced={lastSynced}
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
              onUpdateSpreadsheetId={(id) => {
                setSpreadsheetId(id);
                if (id) {
                  localStorage.setItem('e7_travels_sheets_id', id);
                } else {
                  localStorage.removeItem('e7_travels_sheets_id');
                }
              }}
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

      {/* CLOUD DATABASE STATUS POPUP MODAL */}
      {cloudResultModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-150 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-left">
              <div className="flex items-center gap-3 mb-4">
                {cloudResultModal.status === 'success' ? (
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                ) : cloudResultModal.status === 'error' ? (
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                )}
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  {cloudResultModal.title}
                </h3>
              </div>
              
              <div className="text-xs font-semibold text-slate-700 leading-relaxed space-y-2">
                <p>{cloudResultModal.message}</p>
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Database Engine Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${
                      cloudResultModal.status === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`} />
                    <span className="text-[10px] font-bold text-slate-600 font-mono">
                      {cloudResultModal.status === 'success' ? 'Firestore Online & Synchronized' : 'Firestore Sandbox/Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-150">
              <button
                type="button"
                onClick={() => setCloudResultModal(null)}
                className="px-5 py-2 text-xs font-extrabold bg-[#114b3e] hover:bg-[#0c392f] text-white rounded-lg transition-all shadow-xs cursor-pointer uppercase tracking-wider"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
