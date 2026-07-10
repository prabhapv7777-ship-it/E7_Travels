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
  PhoneCall,
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
import AdminLogin from './components/AdminLogin';

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
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Core ERP Master State
  const [vehicles, setVehicles] = useState<Vehicle[]>(SAMPLE_VEHICLES);
  const [owners, setOwners] = useState<Owner[]>(SAMPLE_OWNERS);
  const [drivers, setDrivers] = useState<Driver[]>(SAMPLE_DRIVERS);
  const [companies, setCompanies] = useState<Company[]>(SAMPLE_COMPANIES);
  const [sites, setSites] = useState<Site[]>(SAMPLE_SITES);
  const [payments, setPayments] = useState<CompanyPayment[]>(SAMPLE_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(SAMPLE_EXPENSES);
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    const saved = localStorage.getItem('e7_travels_enquiries');
    return saved ? JSON.parse(saved) : SAMPLE_ENQUIRIES;
  });

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Enquiries' | 'Registers' | 'Transactions' | 'Ledgers' | 'Settlement' | 'Reports' | 'VBA Export' | 'Settings'>('Dashboard');
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
      case 'Enquiries':
        setActiveTab('Enquiries');
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
        if (token) {
          triggerSheetInit(token);
        }
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
          if (remoteData.vehicles.length > 0) setVehicles(remoteData.vehicles);
          if (remoteData.owners.length > 0) setOwners(remoteData.owners);
          if (remoteData.drivers.length > 0) setDrivers(remoteData.drivers);
          if (remoteData.companies.length > 0) setCompanies(remoteData.companies);
          if (remoteData.sites.length > 0) setSites(remoteData.sites);
          if (remoteData.payments.length > 0) setPayments(remoteData.payments);
          if (remoteData.expenses.length > 0) setExpenses(remoteData.expenses);
        }
        setSyncStatus('success');
        setLastSynced(new Date().toLocaleTimeString());
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
    e = expenses
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
      });
      setSyncStatus('success');
      setLastSynced(new Date().toLocaleTimeString());
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

  // Mutators
  const updateVehicles = (newVehicles: Vehicle[]) => {
    setVehicles(newVehicles);
    triggerPush(newVehicles, owners, drivers, companies, sites, payments, expenses);
  };
  const updateOwners = (newOwners: Owner[]) => {
    setOwners(newOwners);
    triggerPush(vehicles, newOwners, drivers, companies, sites, payments, expenses);
  };
  const updateDrivers = (newDrivers: Driver[]) => {
    setDrivers(newDrivers);
    triggerPush(vehicles, owners, newDrivers, companies, sites, payments, expenses);
  };
  const updateCompanies = (newCompanies: Company[]) => {
    setCompanies(newCompanies);
    triggerPush(vehicles, owners, drivers, newCompanies, sites, payments, expenses);
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
        <div className="p-6 border-b border-blue-800 flex items-center gap-3">
          <div className="flex items-center justify-center">
            <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18C4 10.268 10.268 4 18 4C25.732 4 32 10.268 32 18" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2"/>
              <path d="M10 12H18M10 18H16M10 24H18M10 12V24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 12H28L22 24" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight leading-none uppercase">E7 Travels</h1>
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
                <p className="text-4xs font-bold text-slate-400 uppercase">Spreadsheet Link</p>
                <p className="text-3xs font-extrabold text-slate-600 leading-none mt-0.5">
                  {user ? (syncStatus === 'success' ? 'Synchronised' : 'Pending Save') : 'Sandbox Mode'}
                </p>
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

          {activeTab === 'Enquiries' && (
            <EnquiryViews
              enquiries={enquiries}
              sites={sites}
              onUpdateEnquiries={updateEnquiries}
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
              spreadsheetId={spreadsheetId}
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
