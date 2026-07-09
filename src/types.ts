/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vehicle {
  id: string; // Vehicle ID
  registrationNumber: string; // Unique Reg Number
  model: string;
  manufacturer: string;
  year: number;
  fuelType: 'CNG' | 'Diesel' | 'Petrol';
  transmission: 'Manual' | 'Automatic';
  vehicleType: 'Sedan' | 'SUV' | 'Hatchback' | 'Bus' | 'Tempo Traveler';
  ownerId: string;
  ownerName: string;
  driverId: string;
  driverName: string;
  company: string;
  site: string;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  emiAmount: number;
  emiDueDate: string; // YYYY-MM-DD
  insuranceExpiry: string; // YYYY-MM-DD
  permitExpiry: string; // YYYY-MM-DD
  fcExpiry: string; // YYYY-MM-DD
  pollutionExpiry: string; // YYYY-MM-DD
  fastagNumber: string;
  remarks: string;
}

export interface Owner {
  id: string; // Owner ID
  name: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  pan: string;
  aadhaar: string;
  remarks: string;
}

export interface Driver {
  id: string; // Driver ID
  name: string;
  phone: string;
  address: string;
  badgeNumber: string;
  badgeExpiry: string; // YYYY-MM-DD
  licenceNumber: string;
  licenceExpiry: string; // YYYY-MM-DD
  aadhaar: string;
  pan: string;
  emergencyContact: string;
  salary: number;
  joiningDate: string;
  status: 'Active' | 'Inactive';
}

export interface Company {
  name: string; // Company Name (Primary Key)
  billingCycle: string; // e.g. "Monthly", "15 Days"
  paymentTerms: string; // e.g. "Net 30", "Net 45"
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface Site {
  id: string;
  name: string;
  companyName: string;
  location: string;
  contactPerson: string;
  phone: string;
  remarks: string;
}

export interface CompanyPayment {
  id: string;
  month: string; // YYYY-MM
  vehicleNumber: string;
  company: string;
  invoiceNumber: string;
  paymentDate: string;
  amountReceived: number;
  remarks: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  vehicleNumber: string;
  expenseType: ExpenseType;
  amount: number;
  remarks: string;
}

export type ExpenseType =
  | 'CNG'
  | 'Fuel'
  | 'EMI'
  | 'FASTag'
  | 'Advance'
  | 'Service'
  | 'Repair'
  | 'Tyre'
  | 'Battery'
  | 'Insurance'
  | 'Permit'
  | 'FC'
  | 'Pollution'
  | 'Penalty'
  | 'Driver Salary'
  | 'Driver Advance'
  | 'Miscellaneous';

export const EXPENSE_TYPES: ExpenseType[] = [
  'CNG',
  'Fuel',
  'EMI',
  'FASTag',
  'Advance',
  'Service',
  'Repair',
  'Tyre',
  'Battery',
  'Insurance',
  'Permit',
  'FC',
  'Pollution',
  'Penalty',
  'Driver Salary',
  'Driver Advance',
  'Miscellaneous',
];

export const FUEL_TYPES = ['CNG', 'Diesel', 'Petrol'] as const;
export const TRANSMISSION_TYPES = ['Manual', 'Automatic'] as const;
export const VEHICLE_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Bus', 'Tempo Traveler'] as const;
export const VEHICLE_STATUSES = ['Active', 'Inactive'] as const;
