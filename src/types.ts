/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DeletedVehicle {
  id: string; // Unique ID for deleted record
  originalVehicleId: string;
  registrationNumber: string;
  model: string;
  manufacturer: string;
  year: number;
  fuelType: 'CNG' | 'Diesel' | 'Petrol' | 'EV';
  vehicleType: 'Sedan' | 'SUV' | 'Hatchback' | 'Bus' | 'Tempo Traveler';
  ownerName: string;
  driverName: string;
  company: string;
  site: string;
  joiningDate: string;
  deletedAt: string; // Formatted date & time
  deletedBy?: string;
  deletionReason?: string;
  originalVehicle: Vehicle; // Complete Vehicle object preserved for restore
  associatedOwner?: Owner;
  associatedDriver?: Driver;
}

export interface Vehicle {
  id: string; // Vehicle ID
  registrationNumber: string; // Unique Reg Number
  model: string;
  manufacturer: string;
  year: number;
  fuelType: 'CNG' | 'Diesel' | 'Petrol' | 'EV';
  transmission: 'Manual' | 'Automatic';
  vehicleType: 'Sedan' | 'SUV' | 'Hatchback' | 'Bus' | 'Tempo Traveler';
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  ownerAddress?: string;
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
  // VENDOR COMPANY OFFICE DOCUMENT SUBMISSION TRACKING (FOR FIESTA, ECO, TCS, ETC.)
  officeDocSubmitted?: boolean;
  officeDocSubmitDate?: string;
  officeDocVendorCompany?: string; // e.g. 'Fiesta', 'Eco Mobility', 'TCS', etc.
  officeDocLetterpadRef?: string;  // Letterpad ref / memo no. e.g. 'LP-FIESTA-2026-001'
  officeDocRemarks?: string;
  officeDocChecklist?: OfficeDocChecklist;
  // GPS INSTALLATION & INACTIVATION RETURN TRACKING
  gpsRequired?: 'Yes' | 'No' | boolean; // Whether GPS is mandatory/installed for this vehicle
  gpsVendor?: string;              // e.g. 'Fiesta GPS', 'Autoplant', 'Fleetx'
  gpsImei?: string;                // GPS IMEI number
  gpsFittingDate?: string;         // YYYY-MM-DD
  gpsReturned?: boolean;           // true if returned when vehicle went inactive
  gpsReturnDate?: string;          // YYYY-MM-DD
  gpsReturnRemarks?: string;       // Notes on removal / return
  gpsReturnedBy?: string;          // Person who handed over or received
}

export function isGpsRequiredForVehicle(v?: {
  gpsRequired?: 'Yes' | 'No' | boolean;
  gpsVendor?: string;
  gpsImei?: string;
  gpsFittingDate?: string;
} | null): boolean {
  if (!v) return false;
  if (v.gpsRequired === 'No' || v.gpsRequired === false) return false;
  if (v.gpsRequired === 'Yes' || v.gpsRequired === true) return true;
  const vendor = v.gpsVendor?.trim().toLowerCase();
  if (!vendor || vendor === 'none' || vendor === 'no' || vendor === 'n/a' || vendor === 'not required' || vendor === 'not mandatory' || vendor === 'disabled') {
    return false;
  }
  return !!(v.gpsVendor || v.gpsImei || v.gpsFittingDate);
}

export interface OfficeDocChecklist {
  rc?: boolean;
  insurance?: boolean;
  permit?: boolean;
  pollution?: boolean;
  aadhaarCard?: boolean;
  policeVerification?: boolean;
  drivingLicense?: boolean;
  medicalCertificate?: boolean;
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
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
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
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
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
  fromDate?: string;
  toDate?: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  vehicleNumber: string;
  expenseType: ExpenseType;
  amount: number;
  remarks: string;
  adjustedInInvoice?: string; // Tracks weekly payment invoice this advance was adjusted/deducted in
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

export const FUEL_TYPES = ['CNG', 'Diesel', 'Petrol', 'EV'] as const;
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
  ownerAddress?: string;
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

  // Office / Vendor Document Submission Track (Fiesta, Eco, etc.)
  officeDocSubmitted?: boolean;
  officeDocSubmitDate?: string;
  officeDocVendorCompany?: string;
  officeDocLetterpadRef?: string;
  officeDocRemarks?: string;
  officeDocChecklist?: OfficeDocChecklist;
}

export const ENQUIRY_STATUSES = ['New', 'Interested', 'Site Offered', 'Induction', 'Closed'] as const;

export type RateSource = 'Vendor Rate' | 'Direct Rate' | 'Dual Rate (Vendor & Direct)';
export type RateCategory = 'Kilometer Slab' | 'Package' | 'Flat Rate';

export interface KmSlabRow {
  id: string;
  fromKm: number;
  toKm: number | string;
  vendorAmount: number; // Company Rate (Charged to client) (₹)
  directAmount: number; // Driver Rate (Payout to driver) (₹)
  amount?: number;      // Legacy compatibility
}

export interface PackageDetails {
  packageName: string;
  includedKm: number;
  vendorPackageAmount: number; // Company Package Rate (Client billing) (₹)
  directPackageAmount: number; // Driver Package Rate (Driver payout) (₹)
  packageAmount?: number;      // Legacy compatibility
  vendorExtraKmRate?: number;  // Company Extra KM Rate (₹)
  directExtraKmRate?: number;  // Driver Extra KM Rate (₹)
  extraKmRate?: number;        // Legacy compatibility
  description?: string;
}

export interface FlatRateDetails {
  tripName: string;
  vendorFlatAmount: number; // Company Flat Rate (Client billing) (₹)
  directFlatAmount: number; // Driver Flat Rate (Driver payout) (₹)
  flatAmount?: number;      // Legacy compatibility
  description?: string;
}

export interface SlabRate {
  id: string;
  slabName: string;
  rateSource: RateSource;
  companyName?: string; // Company providing this slab rate e.g. 'TCS', 'Amazon', 'Optum', 'All Companies'
  vehicleType: string; // Primary Vehicle Type: 'Sedan' | 'SUV' | 'EV' | 'Tempo Traveller'
  applicableVehicles?: string[]; // Array of vehicles provided by this company e.g. ['Sedan', 'SUV']
  rateCategory: RateCategory;
  isTwoWayKm?: boolean; // Company provides Two Way KM option
  kmType?: 'One Way KM' | 'Two Way KM'; // KM Calculation method
  kmSlabs?: KmSlabRow[];
  packageDetails?: PackageDetails;
  flatRateDetails?: FlatRateDetails;
  status: 'Active' | 'Inactive';
  createdDate: string; // YYYY-MM-DD
  updatedDate?: string;
  description?: string;
}

export function detectManufacturer(modelStr?: string): string {
  if (!modelStr) return 'Toyota';
  const str = modelStr.toLowerCase();
  if (str.includes('toyota') || str.includes('innova') || str.includes('crysta') || str.includes('hycross') || str.includes('etios') || str.includes('fortuner') || str.includes('glanza') || str.includes('rumion') || str.includes('urban cruiser')) return 'Toyota';
  if (str.includes('maruti') || str.includes('suzuki') || str.includes('dzire') || str.includes('ertiga') || str.includes('swift') || str.includes('baleno') || str.includes('wagon') || str.includes('eeco') || str.includes('tour s') || str.includes('ciaz') || str.includes('xl6') || str.includes('brezza') || str.includes('invicto')) return 'Maruti Suzuki';
  if (str.includes('hyundai') || str.includes('aura') || str.includes('verna') || str.includes('creta') || str.includes('i10') || str.includes('i20') || str.includes('venue') || str.includes('alcazar')) return 'Hyundai';
  if (str.includes('mahindra') || str.includes('bolero') || str.includes('scorpio') || str.includes('xuv') || str.includes('thar') || str.includes('marazzo')) return 'Mahindra';
  if (str.includes('tata') || str.includes('tigor') || str.includes('tiago') || str.includes('nexon') || str.includes('harrier') || str.includes('safari') || str.includes('express') || str.includes('altroz') || str.includes('punch')) return 'Tata Motors';
  if (str.includes('force') || str.includes('traveller') || str.includes('traveler') || str.includes('urbania') || str.includes('trax')) return 'Force Motors';
  if (str.includes('honda') || str.includes('city') || str.includes('amaze') || str.includes('elevate')) return 'Honda';
  if (str.includes('kia') || str.includes('carens') || str.includes('seltos') || str.includes('sonet') || str.includes('carnival')) return 'Kia';
  if (str.includes('mg') || str.includes('hector') || str.includes('comet')) return 'MG Motors';
  if (str.includes('chevrolet') || str.includes('tavera') || str.includes('beat')) return 'Chevrolet';
  if (str.includes('ford') || str.includes('aspire') || str.includes('figo') || str.includes('endeavour')) return 'Ford';
  if (str.includes('nissan') || str.includes('sunny') || str.includes('magnite')) return 'Nissan';
  if (str.includes('renault') || str.includes('triber') || str.includes('kiger') || str.includes('kwid')) return 'Renault';
  if (str.includes('volkswagen') || str.includes('vento') || str.includes('virtus')) return 'Volkswagen';
  if (str.includes('skoda') || str.includes('slavia') || str.includes('kushaq')) return 'Skoda';

  const clean = modelStr.trim();
  const firstWord = clean.split(/\s+/)[0];
  if (firstWord && firstWord.length > 2 && !/\d/.test(firstWord)) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }
  return 'Toyota';
}
