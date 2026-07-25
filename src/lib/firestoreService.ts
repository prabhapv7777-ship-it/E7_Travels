/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, auth } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Vehicle, Owner, Driver, Company, Site, CompanyPayment, Expense, Enquiry, DeletedVehicle } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FleetState {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  companies: Company[];
  sites: Site[];
  payments: CompanyPayment[];
  expenses: Expense[];
  enquiries: Enquiry[];
  deletedVehicles?: DeletedVehicle[];
}

export interface FleetStateResult {
  state: Partial<FleetState>;
  isQuotaExceeded: boolean;
  error?: string;
}

const FLEET_COLLECTION = 'fleet';

const lastSavedHashes: Record<string, string> = {};

export const setLastSavedHash = (key: keyof FleetState, data: any) => {
  const sanitizedData = data === undefined ? [] : JSON.parse(JSON.stringify(data));
  lastSavedHashes[key] = JSON.stringify(sanitizedData);
};

export const isQuotaError = (error: unknown): boolean => {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.toLowerCase().includes('quota') ||
    msg.toLowerCase().includes('resource_exhausted') ||
    msg.toLowerCase().includes('limit exceeded')
  );
};

export const saveStateToFirestore = async (key: keyof FleetState, data: any) => {
  const docPath = `${FLEET_COLLECTION}/${key}`;
  try {
    const docRef = doc(db, FLEET_COLLECTION, key);
    // Sanitize data: convert undefined values/properties into clean JSON without undefined fields
    const sanitizedData = data === undefined ? [] : JSON.parse(JSON.stringify(data));
    const serialized = JSON.stringify(sanitizedData);

    // Read/Write Optimization: Skip network write if current data is identical to last known cloud state
    if (lastSavedHashes[key] === serialized) {
      return;
    }

    lastSavedHashes[key] = serialized;
    await setDoc(docRef, { data: sanitizedData }, { merge: false });
  } catch (error) {
    delete lastSavedHashes[key];
    if (isQuotaError(error)) {
      console.warn(`Firestore quota limit exceeded while auto-saving "${key}". Local storage fallback active.`);
      return; // Do not throw so caller doesn't log unhandled promise rejections
    }
    console.error(`Error saving ${key} to Firestore:`, error);
    handleFirestoreError(error, OperationType.WRITE, docPath);
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
    'deletedVehicles',
  ];
  for (const key of keys) {
    if (state[key]) {
      try {
        await saveStateToFirestore(key, state[key]);
      } catch (err) {
        if (isQuotaError(err)) break;
      }
    }
  }
};

export function smartMergeRecords<T extends Record<string, any>>(
  localList: T[] = [],
  cloudList: T[] = [],
  sampleList: T[] = [],
  keyFields: string[] = ['id', 'name', 'registrationNumber']
): T[] {
  const map = new Map<string, T>();

  const getKey = (item: T): string | null => {
    if (!item) return null;
    for (const f of keyFields) {
      if (item[f] !== undefined && item[f] !== null && String(item[f]).trim() !== '') {
        return String(item[f]).trim();
      }
    }
    return null;
  };

  const hasUserData =
    (Array.isArray(localList) && localList.length > 0) ||
    (Array.isArray(cloudList) && cloudList.length > 0);

  // 1. Seed with sampleList ONLY if user has no saved local or cloud data at all
  if (!hasUserData && Array.isArray(sampleList)) {
    sampleList.forEach((item) => {
      if (!item) return;
      const k = getKey(item);
      if (k) map.set(k, { ...item });
    });
  }

  // 2. Process cloudList (authoritative server-side persistence)
  if (Array.isArray(cloudList)) {
    cloudList.forEach((item) => {
      if (!item) return;
      const k = getKey(item);
      if (!k) return;

      const existing = map.get(k);
      if (!existing) {
        map.set(k, { ...item });
      } else {
        // Overlay cloud item over existing sample item
        map.set(k, { ...existing, ...item });
      }
    });
  }

  // 3. Process localList (user's active local inputs and updates on this device)
  if (Array.isArray(localList)) {
    localList.forEach((item) => {
      if (!item) return;
      const k = getKey(item);
      if (!k) return;

      const existing = map.get(k);
      if (!existing) {
        map.set(k, { ...item });
      } else {
        // User manual edits ALWAYS override existing values
        map.set(k, { ...existing, ...item });
      }
    });
  }

  return Array.from(map.values());
}

export function mergeArraysById<T extends Record<string, any>>(
  local: T[] = [],
  cloud: T[] = [],
  keyFields: string[] = ['id', 'name'],
  preferCloud: boolean = false
): T[] {
  return smartMergeRecords(local, cloud, [], keyFields);
}

export const loadStateFromFirestore = async (): Promise<Partial<FleetState> & { _isQuotaExceeded?: boolean }> => {
  const keys: (keyof FleetState)[] = [
    'vehicles',
    'owners',
    'drivers',
    'companies',
    'sites',
    'payments',
    'expenses',
    'enquiries',
    'deletedVehicles',
  ];
  
  const state: Partial<FleetState> & { _isQuotaExceeded?: boolean } = {};
  let quotaExceededDetected = false;
  
  for (const key of keys) {
    try {
      const docRef = doc(db, FLEET_COLLECTION, key);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const loadedData = snapshot.data().data;
        state[key] = loadedData;
        setLastSavedHash(key, loadedData);
      }
    } catch (error) {
      if (isQuotaError(error)) {
        quotaExceededDetected = true;
        console.warn(`Firestore quota limit reached for key "${key}". Falling back to local offline storage.`);
        // Don't throw for quota error - allow partial/local state load
        break;
      } else {
        console.error(`Error loading state for key "${key}" from Firestore:`, error);
        throw error;
      }
    }
  }

  if (quotaExceededDetected) {
    state._isQuotaExceeded = true;
  }
  
  return state;
};
