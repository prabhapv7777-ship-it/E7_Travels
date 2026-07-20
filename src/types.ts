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
  company2?: string;
  site2?: string;
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
  paymentCycle?: 'Monthly' | 'Weekly';
  comments?: Array<{ date: string; text: string; author: string }>;
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
  comments?: Array<{ date: string; text: string; author: string }>;
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
  driverType?: 'Owner-Paid' | 'Owner-cum-Driver';
  comments?: Array<{ date: string; text: string; author: string }>;
}

export interface Company {
  name: string; // Company Name (Primary Key)
  billingCycle: string; // e.g. "Monthly", "15 Days"
  paymentTerms: string; // e.g. "Net 30", "Net 45"
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  vendorName?: string;
  companySite?: string;
  comments?: Array<{ date: string; text: string; author: string }>;
}

export interface Site {
  id: string;
  name: string;
  companyName: string;
  location: string;
  contactPerson: string;
  phone: string;
  remarks: string;
  comments?: Array<{ date: string; text: string; author: string }>;
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
  | 'Deduct'
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
  'Deduct',
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

export interface Enquiry {
  id: string; // e.g., ENQ001
  
  // VEHICLE DETAILS
  vehicleNumber: string;      // NUMBER
  vehicleType: string;        // TYPE
  vehicleModelYear: string;   // MODEL/YEAR
  vehicleColor: string;       // COLOR
  ownerNamePhone: string;     // OWNER NAME/PHONE
  reference: string;          // REFERENCE

  // DRIVER DETAILS
  driverName: string;         // NAME
  driverAge: string;          // AGE
  driverPhone: string;        // PHONE NO
  driverArea: string;         // AREA
  driverBatchExp: string;     // BATCH EXP

  alreadyRunningCompany: string; // ALREADY RUNNING COMPANY
  sitePreference1: string;       // SITE PREFERENCE 1
  sitePreference2: string;       // SITE PREFERENCE 2

  enquiryDate: string; // YYYY-MM-DD
  status: 'New' | 'Interested' | 'Site Offered' | 'Induction' | 'Closed';
  remarks: string;
  comments?: Array<{ date: string; text: string; author: string }>;

  // ENHANCED VEHICLE JOINING FORM EXTRA FIELDS (for printing & full profile creation)
  inductionType?: 'OwnerAttach' | 'DriverAttach';
  ownerId?: string;
  ownerName?: string;
  ownerMobile?: string;
  mfdYear?: string;
  fuelType?: string;
  rcExpiry?: string;
  insuranceExpiry?: string;
  permitExpiry?: string;
  fcExpiry?: string;
  driverAltPhone?: string;
  driverEmail?: string;
  driverAadhaar?: string;
  driverDlNumber?: string;
  driverDlExpiry?: string;
  driverAddress?: string;
  gpsVendor?: string;
  gpsImei?: string;
  bankName?: string;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  sitePreference3?: string;
  sitePreference4?: string;

  // Induction Flow Step Fields
  inductionCompany?: string;
  inductionDate?: string;
  inductionCompleted?: boolean;
  gpsRequired?: 'Yes' | 'No';
  gpsFittingDate?: string;
  routeActivated?: boolean;
  routeStartDate?: string;
}

export const ENQUIRY_STATUSES = ['New', 'Interested', 'Site Offered', 'Induction', 'Closed'] as const;
