/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ManualLedgerRecord {
  tdsRate?: number; // e.g. 1 for 1%, 2 for 2%
  tdsOverride?: number; // manual TDS ₹ override
  penalty?: number;
  dnr?: number; // Damage & Recovery ₹
  cautionDeposit?: number; // Caution Deposit ₹
  adminCharges?: number; // Admin Charges ₹
  gpsRent?: number; // GPS Rent ₹
}

export type ManualLedgerStore = Record<string, ManualLedgerRecord>;

const STORAGE_KEY = 'e7_manual_ledger_entries';

export function getManualLedgerStore(): ManualLedgerStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load manual ledger entries from localStorage', err);
    return {};
  }
}

export function saveManualLedgerEntry(
  vehicleNumber: string,
  month: string,
  record: Partial<ManualLedgerRecord>
): ManualLedgerStore {
  const store = getManualLedgerStore();
  const key = `${vehicleNumber}_${month || 'default'}`;
  const existing = store[key] || {};
  store[key] = { ...existing, ...record };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to save manual ledger entry to localStorage', err);
  }
  return store;
}

export function getManualLedgerEntry(
  vehicleNumber: string,
  month: string,
  store?: ManualLedgerStore
): ManualLedgerRecord {
  const currentStore = store || getManualLedgerStore();
  const key = `${vehicleNumber}_${month || 'default'}`;
  return currentStore[key] || {};
}
