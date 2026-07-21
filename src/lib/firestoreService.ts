/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Vehicle, Owner, Driver, Company, Site, CompanyPayment, Expense, Enquiry } from '../types';

export interface FleetState {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  companies: Company[];
  sites: Site[];
  payments: CompanyPayment[];
  expenses: Expense[];
  enquiries: Enquiry[];
}

const FLEET_COLLECTION = 'fleet';

export const saveStateToFirestore = async (key: keyof FleetState, data: any) => {
  try {
    const docRef = doc(db, FLEET_COLLECTION, key);
    await setDoc(docRef, { data }, { merge: false });
  } catch (error) {
    console.error(`Error saving ${key} to Firestore:`, error);
    throw error;
  }
};

export const saveAllStateToFirestore = async (state: FleetState) => {
  const keys: (keyof FleetState)[] = [
    'vehicles',
    'owners',
    'drivers',
    'companies',
    'sites',
    'payments',
    'expenses',
    'enquiries',
  ];
  for (const key of keys) {
    if (state[key]) {
      await saveStateToFirestore(key, state[key]);
    }
  }
};

export function mergeArraysById<T extends Record<string, any>>(
  local: T[] = [],
  cloud: T[] = [],
  keyFields: string[] = ['id', 'name'],
  preferCloud: boolean = false
): T[] {
  const mergedMap = new Map<string, T>();
  
  const getKey = (item: T): string | null => {
    for (const field of keyFields) {
      if (item && item[field]) {
        return String(item[field]);
      }
    }
    return null;
  };

  if (preferCloud) {
    // Add local items first
    if (local && Array.isArray(local)) {
      local.forEach((item) => {
        const k = getKey(item);
        if (k) mergedMap.set(k, item);
      });
    }

    // Add cloud items (overwriting local items with cloud values)
    if (cloud && Array.isArray(cloud)) {
      cloud.forEach((item) => {
        const k = getKey(item);
        if (k) {
          const existing = mergedMap.get(k);
          if (existing) {
            // Overwrite with cloud properties
            mergedMap.set(k, { ...existing, ...item, ...item });
          } else {
            mergedMap.set(k, item);
          }
        }
      });
    }
  } else {
    // Add cloud items first
    if (cloud && Array.isArray(cloud)) {
      cloud.forEach((item) => {
        const k = getKey(item);
        if (k) mergedMap.set(k, item);
      });
    }

    // Add local items (overwriting or merging with cloud, giving preference to local)
    if (local && Array.isArray(local)) {
      local.forEach((item) => {
        const k = getKey(item);
        if (k) {
          const existing = mergedMap.get(k);
          if (existing) {
            // Merge properties, giving preference to local
            mergedMap.set(k, { ...existing, ...item });
          } else {
            mergedMap.set(k, item);
          }
        }
      });
    }
  }

  return Array.from(mergedMap.values());
}

export const loadStateFromFirestore = async (): Promise<Partial<FleetState>> => {
  const keys: (keyof FleetState)[] = [
    'vehicles',
    'owners',
    'drivers',
    'companies',
    'sites',
    'payments',
    'expenses',
    'enquiries',
  ];
  
  const state: Partial<FleetState> = {};
  
  for (const key of keys) {
    try {
      const docRef = doc(db, FLEET_COLLECTION, key);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        state[key] = snapshot.data().data;
      }
    } catch (error) {
      console.error(`Error loading state for key "${key}" from Firestore:`, error);
      throw error;
    }
  }
  
  return state;
};
