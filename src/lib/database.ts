/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { Vehicle, Owner, Driver, Company, Site, CompanyPayment, Expense } from '../types';

export interface SpreadsheetData {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  companies: Company[];
  sites: Site[];
  payments: CompanyPayment[];
  expenses: Expense[];
}

// Map collection name to its unique ID field
export function getDocId(collectionName: string, item: any): string {
  if (collectionName === 'companies') {
    return item.name;
  }
  return item.id;
}

// Subscribe to Firestore collection with real-time updates
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void
) {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push({ ...doc.data() } as T);
    });
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to collection ${collectionName}:`, error);
  });
}

// Add or update document in Firestore
export async function saveDocument(collectionName: string, item: any): Promise<void> {
  const id = getDocId(collectionName, item);
  if (!id) {
    throw new Error(`Cannot save item to ${collectionName}: Missing unique identifier.`);
  }
  const docRef = doc(db, collectionName, id);
  await setDoc(docRef, item);
}

// Delete document from Firestore
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

// Seed the entire database with sample data (e.g. if empty or requested by user)
export async function seedDatabase(data: SpreadsheetData): Promise<void> {
  const promises: Promise<void>[] = [];

  const addAll = (collectionName: string, items: any[]) => {
    items.forEach((item) => {
      promises.push(saveDocument(collectionName, item));
    });
  };

  addAll('vehicles', data.vehicles);
  addAll('owners', data.owners);
  addAll('drivers', data.drivers);
  addAll('companies', data.companies);
  addAll('sites', data.sites);
  addAll('payments', data.payments);
  addAll('expenses', data.expenses);

  await Promise.all(promises);
}

// Check if database is empty by querying if vehicles has any documents
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const q = collection(db, 'vehicles');
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking if database is empty:', error);
    // If permission is denied or Firestore hasn't been set up yet, default to true to allow seeding.
    return true;
  }
}

// Helper to sync array updates to Firestore by comparing new and old arrays
export async function syncCollectionWithDatabase<T>(
  collectionName: string,
  newList: T[],
  currentList: T[]
): Promise<void> {
  const promises: Promise<void>[] = [];

  // Find added or modified items
  newList.forEach((newItem) => {
    const id = getDocId(collectionName, newItem);
    const currentItem = currentList.find((c) => getDocId(collectionName, c) === id);
    if (!currentItem || JSON.stringify(newItem) !== JSON.stringify(currentItem)) {
      promises.push(saveDocument(collectionName, newItem));
    }
  });

  // Find deleted items
  currentList.forEach((currentItem) => {
    const id = getDocId(collectionName, currentItem);
    const stillExists = newList.some((n) => getDocId(collectionName, n) === id);
    if (!stillExists) {
      promises.push(deleteDocument(collectionName, id));
    }
  });

  await Promise.all(promises);
}
