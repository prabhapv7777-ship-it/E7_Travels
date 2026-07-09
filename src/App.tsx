/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  googleSignIn,
  logout,
  getAccessToken,
} from './lib/firebase';
import {
  subscribeToCollection,
  seedDatabase,
  isDatabaseEmpty,
  syncCollectionWithDatabase,
} from './lib/database';
import {
  SAMPLE_VEHICLES,
  SAMPLE_OWNERS,
  SAMPLE_DRIVERS,
  SAMPLE_COMPANIES,
  SAMPLE_SITES,
  SAMPLE_PAYMENTS,
  SAMPLE_EXPENSES,
} from './data/sampleData';
import {
  Vehicle,
  Owner,
  Driver,
  Company,
  Site,
  CompanyPayment,
  Expense,
} from './types';

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

export default function App() {
  // Authentication & Sync State
  const [user, setUser] = useState<{ email: string | null; displayName: string | null } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  // Core ERP Master State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Registers' | 'Transactions' | 'Ledgers' | 'Settlement' | 'Reports' | 'VBA Export' | 'Settings'>('Dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('Vehicle Master');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'running' | 'idle' | 'new'>('all');

  // Unified Navigation Router
  const handleNavigate = (route: string, filter?: 'all' | 'running' | 'idle' | 'new') => {
    if (filter) {
      setVehicleFilter(filter);
    } else if (route === 'Vehicle Master') {
      setVehicleFilter('all');
    }

    switch (route) {
      case 'Dashboard':
        setActiveTab('Dashboard');
        break;
      case 'Vehicle Master':
      case 'Owner Master':
      case 'Driver Master':
      case 'Company Master':
      case 'Site Master':
        setActiveTab('Registers');
        setActiveSubTab(route);
        break;
      case 'Company Payments':
      case 'Expense Entry':
        setActiveTab('Transactions');
        setActiveSubTab(route);
        break;
      case 'Vehicle Ledger':
      case 'Owner Ledger':
      case 'Driver Ledger':
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
      default:
        // Fallback for parent tabs
        if (route === 'Registers' || route === 'Transactions' || route === 'Ledgers' || route === 'Settlement' || route === 'VBA Export') {
          setActiveTab(route as any);
          if (route === 'Registers') setActiveSubTab('Vehicle Master');
          else if (route === 'Transactions') setActiveSubTab('Company Payments');
          else if (route === 'Ledgers') setActiveSubTab('Vehicle Ledger');
          else if (route === 'Settlement') setActiveSubTab('Monthly Settlement');
        }
        break;
    }
  };

  // Firestore connection and live-sync engine
  const [firestoreConnected, setFirestoreConnected] = useState(false);

  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const initializeFirestoreSync = async () => {
      setIsSyncing(true);
      setSyncStatus('idle');
      try {
        // Subscribe to real-time collections
        unsubscribes.push(subscribeToCollection<Vehicle>('vehicles', setVehicles));
        unsubscribes.push(subscribeToCollection<Owner>('owners', setOwners));
        unsubscribes.push(subscribeToCollection<Driver>('drivers', setDrivers));
        unsubscribes.push(subscribeToCollection<Company>('companies', setCompanies));
        unsubscribes.push(subscribeToCollection<Site>('sites', setSites));
        unsubscribes.push(subscribeToCollection<CompanyPayment>('payments', setPayments));
        unsubscribes.push(subscribeToCollection<Expense>('expenses', setExpenses));

        setFirestoreConnected(true);
        setSyncStatus('success');
        setLastSynced(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Error connecting to Firestore database. Running in local sandbox mode.', err);
        setFirestoreConnected(false);
        setSyncStatus('error');
      } finally {
        setIsSyncing(false);
      }
    };

    initializeFirestoreSync();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  // Handle Google Login Auth
  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        setUser({
          email: res.user.email,
          displayName: res.user.displayName,
        });
        const token = res.accessToken;
        setAccessToken(token);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      alert('Authentication failed. Please verify credentials and try again.');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSpreadsheetId(null);
    setSyncStatus('idle');
  };

  // Manual Reset / Re-seed action
  const handleForceRefresh = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      if (confirm('Are you sure you want to reset and re-seed the Firestore database with initial sample data?')) {
        await seedDatabase({
          vehicles: SAMPLE_VEHICLES,
          owners: SAMPLE_OWNERS,
          drivers: SAMPLE_DRIVERS,
          companies: SAMPLE_COMPANIES,
          sites: SAMPLE_SITES,
          payments: SAMPLE_PAYMENTS,
          expenses: SAMPLE_EXPENSES,
        });
        alert('Database successfully re-seeded!');
        setLastSynced(new Date().toLocaleTimeString());
        setSyncStatus('success');
      }
    } catch (err) {
      console.error('Failed to re-seed database:', err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Mutators mapped to Firestore Sync
  const updateVehicles = async (newVehicles: Vehicle[]) => {
    const current = vehicles;
    setVehicles(newVehicles);
    if (firestoreConnected) {
      try {
        await syncCollectionWithDatabase('vehicles', newVehicles, current);
      } catch (err) {
        console.error('Error syncing vehicles:', err);
      }
    }
  };

  const updateOwners = async (newOwners: Owner[]) => {
    const current = owners;
    setOwners(newOwners);
    if (firestoreConnected) {
      try {
        await syncCollectionWithDatabase('owners', newOwners, current);
      } catch (err) {
        console.error('Error syncing owners:', err);
      }
    }
  };

  const updateDrivers = async (newDrivers: Driver[]) => {
    const current = drivers;
    setDrivers(newDrivers);
    if (firestoreConnected) {
      try {
        await syncCollectionWithDatabase('drivers', newDrivers, current);
      } catch (err) {
        console.error('Error syncing drivers:', err);
      }
    }
  };

  const updateCompanies = async (newCompanies: Company[]) => {
    const current = companies;
    setCompanies(newCompanies);
    if (firestoreConnected) {
      try {
        await syncCollectionWithDatabase('companies', newCompanies, current);
      } catch (err) {
        console.error('Error syncing companies:', err);
      }
    }
  };

  const updateSites = async (newSites: Site[]) => {
    const current = sites;
    setSites(newSites);
    if (firestoreConnected) {
      try {
        await syncCollectionWithDatabase('sites', newSites, current);
      } catch (err) {
        console.error('Error syncing sites:', err);
      }
    }
  };

  const updatePayments = async (newPayments: CompanyPayment[]) => {
    const current = payments;
    setPayments(newPayments);
    if (firestoreConnected) {
      try {
        await syncCollectionWithDatabase('payments', newPayments, current);
      } catch (err) {
        console.error('Error syncing payments:', err);
      }
    }
  };

  const updateExpenses = async (newExpenses: Expense[]) => {
    const current = expenses;
    setExpenses(newExpenses);
    if (firestoreConnected) {
      try {
        await syncCollectionWithDatabase('expenses', newExpenses, current);
      } catch (err) {
        console.error('Error syncing expenses:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans antialiased selection:bg-blue-100">
      
      {/* Navigation Sidebar */}
      <aside className="w-64 bg-blue-900 text-slate-100 flex flex-col shrink-0 h-screen sticky top-0 print:hidden select-none border-r border-blue-950">
        <div className="p-6 border-b border-blue-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-blue-900 text-lg">E7</div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight leading-none uppercase">E7 Travels</h1>
            <p className="text-4xs font-bold text-blue-300 uppercase tracking-widest mt-1">Chennai Hub ERP</p>
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
        <div className="p-4 border-t border-blue-800 text-blue-300 text-4xs font-mono space-y-2">
          {user ? (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold text-white text-xs border border-blue-700 shrink-0">
                {user.displayName?.charAt(0) || 'U'}
              </div>
              <div className="text-xs font-medium overflow-hidden">
                <p className="truncate max-w-[120px] text-white font-semibold leading-none">{user.displayName}</p>
                <p className="opacity-50 mt-1">Admin User</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold text-white text-xs border border-blue-700 shrink-0">A</div>
              <div className="text-xs font-medium">
                <p className="text-white font-semibold">Admin User</p>
                <p className="opacity-50">Local Mode</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40 shadow-2xs print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase">E7 Travels Fleet ERP</h2>
            <span className="h-4 w-px bg-slate-200"></span>
            <p className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Chennai Hub</p>
          </div>

          {/* Sync Controls */}
          <div className="flex items-center gap-4">
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
                <p className="text-4xs font-bold text-slate-400 uppercase">Firestore DB</p>
                <p className="text-3xs font-extrabold text-slate-600 leading-none mt-0.5">
                  {firestoreConnected ? 'Live Database' : 'Sandbox Mode'}
                </p>
              </div>
              <button
                id="sync-trigger-btn"
                onClick={handleForceRefresh}
                className={`p-2 border border-slate-250 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition-all shadow-3xs ${
                  isSyncing ? 'animate-spin text-blue-600 border-blue-200 bg-blue-50/20' : ''
                }`}
                title="Reset and Seed Firestore Database"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6 print:p-0 print:overflow-visible bg-slate-50">
          
          {/* Sub Navigation deck (Where necessary depending on chosen Tab) */}
          {['Registers', 'Transactions', 'Ledgers', 'Settlement'].includes(activeTab) && (
            <div className="flex bg-slate-200 p-1 rounded-xl max-w-max border border-slate-300/40 print:hidden shadow-3xs mb-4">
              {activeTab === 'Registers' &&
                (['Vehicle Master', 'Owner Master', 'Driver Master', 'Company Master', 'Site Master'] as const).map((sub) => (
                  <button
                    id={`sub-tab-btn-${sub}`}
                    key={sub}
                    onClick={() => setActiveSubTab(sub)}
                    className={`px-4 py-1.5 text-2xs font-bold rounded-lg transition-all ${
                      activeSubTab === sub ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {sub.split(' ')[0]} Master
                  </button>
                ))}

              {activeTab === 'Transactions' &&
                (['Company Payments', 'Expense Entry'] as const).map((sub) => (
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
                (['Vehicle Ledger', 'Owner Ledger', 'Driver Ledger'] as const).map((sub) => (
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
            />
          )}

          {activeTab === 'Reports' && (
            <Reports
              vehicles={vehicles}
              expenses={expenses}
              payments={payments}
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
              spreadsheetId={firestoreConnected ? 'Firestore Connected (cedar-vial-g3bk6)' : 'Offline Sandbox Mode'}
              onUpdateCompanies={updateCompanies}
              onUpdateSites={updateSites}
              onForceSync={handleForceRefresh}
            />
          )}
        </main>
      </div>
    </div>
  );
}
