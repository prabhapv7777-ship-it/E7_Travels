/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

const VEHICLE_HEADERS = [
  'Vehicle ID',
  'Registration Number',
  'Vehicle Model',
  'Manufacturer',
  'Year',
  'Fuel Type',
  'Transmission',
  'Vehicle Type',
  'Owner ID',
  'Owner Name',
  'Driver ID',
  'Driver Name',
  'Company',
  'Site',
  'Joining Date',
  'Status',
  'EMI Amount',
  'EMI Due Date',
  'Insurance Expiry',
  'Permit Expiry',
  'FC Expiry',
  'Pollution Expiry',
  'FASTag Number',
  'Remarks',
];

const OWNER_HEADERS = [
  'Owner ID',
  'Owner Name',
  'Phone',
  'Email',
  'Address',
  'Bank',
  'Account Number',
  'IFSC',
  'UPI ID',
  'PAN',
  'Aadhaar',
  'Remarks',
];

const DRIVER_HEADERS = [
  'Driver ID',
  'Driver Name',
  'Phone',
  'Address',
  'Badge Number',
  'Badge Expiry',
  'Licence Number',
  'Licence Expiry',
  'Aadhaar',
  'PAN',
  'Emergency Contact',
  'Salary',
  'Joining Date',
  'Status',
];

const COMPANY_HEADERS = [
  'Company Name',
  'Billing Cycle',
  'Payment Terms',
  'Contact Person',
  'Phone',
  'Email',
  'Address',
];

const SITE_HEADERS = [
  'Site ID',
  'Site Name',
  'Company Name',
  'Location',
  'Contact Person',
  'Phone',
  'Remarks',
];

const PAYMENT_HEADERS = [
  'Month',
  'Vehicle Number',
  'Company',
  'Invoice Number',
  'Payment Date',
  'Amount Received',
  'Remarks',
];

const EXPENSE_HEADERS = [
  'Date',
  'Month',
  'Vehicle Number',
  'Expense Type',
  'Amount',
  'Remarks',
];

// Create a new beautifully formatted Google Spreadsheet for E7 Travels
export async function createFleetSpreadsheet(
  accessToken: string,
  data: SpreadsheetData
): Promise<string> {
  const title = 'E7 Travels Fleet ERP Database';
  
  // 1. Create Spreadsheet with correct Sheet titles
  const sheetsToCreate = [
    { properties: { title: 'Vehicles' } },
    { properties: { title: 'Owners' } },
    { properties: { title: 'Drivers' } },
    { properties: { title: 'Companies' } },
    { properties: { title: 'Sites' } },
    { properties: { title: 'Payments' } },
    { properties: { title: 'Expenses' } },
  ];

  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: sheetsToCreate,
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // 2. Prepare value ranges to populate sheets
  const valueRanges = [
    // Vehicles
    {
      range: 'Vehicles!A1',
      values: [
        VEHICLE_HEADERS,
        ...data.vehicles.map((v) => [
          v.id,
          v.registrationNumber,
          v.model,
          v.manufacturer,
          v.year,
          v.fuelType,
          v.transmission,
          v.vehicleType,
          v.ownerId,
          v.ownerName,
          v.driverId,
          v.driverName,
          v.company,
          v.site,
          v.joiningDate,
          v.status,
          v.emiAmount,
          v.emiDueDate,
          v.insuranceExpiry,
          v.permitExpiry,
          v.fcExpiry,
          v.pollutionExpiry,
          v.fastagNumber,
          v.remarks,
        ]),
      ],
    },
    // Owners
    {
      range: 'Owners!A1',
      values: [
        OWNER_HEADERS,
        ...data.owners.map((o) => [
          o.id,
          o.name,
          o.phone,
          o.email,
          o.address,
          o.bankName,
          o.accountNumber,
          o.ifsc,
          o.upiId,
          o.pan,
          o.aadhaar,
          o.remarks,
        ]),
      ],
    },
    // Drivers
    {
      range: 'Drivers!A1',
      values: [
        DRIVER_HEADERS,
        ...data.drivers.map((d) => [
          d.id,
          d.name,
          d.phone,
          d.address,
          d.badgeNumber,
          d.badgeExpiry,
          d.licenceNumber,
          d.licenceExpiry,
          d.aadhaar,
          d.pan,
          d.emergencyContact,
          d.salary,
          d.joiningDate,
          d.status,
        ]),
      ],
    },
    // Companies
    {
      range: 'Companies!A1',
      values: [
        COMPANY_HEADERS,
        ...data.companies.map((c) => [
          c.name,
          c.billingCycle,
          c.paymentTerms,
          c.contactPerson,
          c.phone,
          c.email,
          c.address,
        ]),
      ],
    },
    // Sites
    {
      range: 'Sites!A1',
      values: [
        SITE_HEADERS,
        ...data.sites.map((s) => [
          s.id,
          s.name,
          s.companyName,
          s.location,
          s.contactPerson,
          s.phone,
          s.remarks,
        ]),
      ],
    },
    // Payments
    {
      range: 'Payments!A1',
      values: [
        PAYMENT_HEADERS,
        ...data.payments.map((p) => [
          p.month,
          p.vehicleNumber,
          p.company,
          p.invoiceNumber,
          p.paymentDate,
          p.amountReceived,
          p.remarks,
        ]),
      ],
    },
    // Expenses
    {
      range: 'Expenses!A1',
      values: [
        EXPENSE_HEADERS,
        ...data.expenses.map((e) => [
          e.date,
          e.month,
          e.vehicleNumber,
          e.expenseType,
          e.amount,
          e.remarks,
        ]),
      ],
    },
  ];

  // Write values to the newly created spreadsheet
  const writeResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    }
  );

  if (!writeResponse.ok) {
    const errText = await writeResponse.text();
    throw new Error(`Failed to populate spreadsheet: ${errText}`);
  }

  return spreadsheetId;
}

// Push local state completely to an existing spreadsheet
export async function pushToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: SpreadsheetData
): Promise<void> {
  const valueRanges = [
    {
      range: 'Vehicles!A1:Z1000',
      values: [
        VEHICLE_HEADERS,
        ...data.vehicles.map((v) => [
          v.id,
          v.registrationNumber,
          v.model,
          v.manufacturer,
          v.year,
          v.fuelType,
          v.transmission,
          v.vehicleType,
          v.ownerId,
          v.ownerName,
          v.driverId,
          v.driverName,
          v.company,
          v.site,
          v.joiningDate,
          v.status,
          v.emiAmount,
          v.emiDueDate,
          v.insuranceExpiry,
          v.permitExpiry,
          v.fcExpiry,
          v.pollutionExpiry,
          v.fastagNumber,
          v.remarks,
        ]),
      ],
    },
    {
      range: 'Owners!A1:Z1000',
      values: [
        OWNER_HEADERS,
        ...data.owners.map((o) => [
          o.id,
          o.name,
          o.phone,
          o.email,
          o.address,
          o.bankName,
          o.accountNumber,
          o.ifsc,
          o.upiId,
          o.pan,
          o.aadhaar,
          o.remarks,
        ]),
      ],
    },
    {
      range: 'Drivers!A1:Z1000',
      values: [
        DRIVER_HEADERS,
        ...data.drivers.map((d) => [
          d.id,
          d.name,
          d.phone,
          d.address,
          d.badgeNumber,
          d.badgeExpiry,
          d.licenceNumber,
          d.licenceExpiry,
          d.aadhaar,
          d.pan,
          d.emergencyContact,
          d.salary,
          d.joiningDate,
          d.status,
        ]),
      ],
    },
    {
      range: 'Companies!A1:Z1000',
      values: [
        COMPANY_HEADERS,
        ...data.companies.map((c) => [
          c.name,
          c.billingCycle,
          c.paymentTerms,
          c.contactPerson,
          c.phone,
          c.email,
          c.address,
        ]),
      ],
    },
    {
      range: 'Sites!A1:Z1000',
      values: [
        SITE_HEADERS,
        ...data.sites.map((s) => [
          s.id,
          s.name,
          s.companyName,
          s.location,
          s.contactPerson,
          s.phone,
          s.remarks,
        ]),
      ],
    },
    {
      range: 'Payments!A1:Z1000',
      values: [
        PAYMENT_HEADERS,
        ...data.payments.map((p) => [
          p.month,
          p.vehicleNumber,
          p.company,
          p.invoiceNumber,
          p.paymentDate,
          p.amountReceived,
          p.remarks,
        ]),
      ],
    },
    {
      range: 'Expenses!A1:Z1000',
      values: [
        EXPENSE_HEADERS,
        ...data.expenses.map((e) => [
          e.date,
          e.month,
          e.vehicleNumber,
          e.expenseType,
          e.amount,
          e.remarks,
        ]),
      ],
    },
  ];

  // We should first clear sheets or use raw batch update that overrides existing cells
  const clearPromises = ['Vehicles', 'Owners', 'Drivers', 'Companies', 'Sites', 'Payments', 'Expenses'].map(
    (sheetName) =>
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z1000:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
  );
  await Promise.all(clearPromises);

  const writeResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    }
  );

  if (!writeResponse.ok) {
    const errText = await writeResponse.text();
    throw new Error(`Failed to sync updates to Google Sheet: ${errText}`);
  }
}

// Fetch all sheets and convert them back into typed arrays
export async function loadFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetData> {
  const ranges = 'ranges=Vehicles!A1:Z1000&ranges=Owners!A1:Z1000&ranges=Drivers!A1:Z1000&ranges=Companies!A1:Z1000&ranges=Sites!A1:Z1000&ranges=Payments!A1:Z1000&ranges=Expenses!A1:Z1000';
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Could not pull data from Google Sheet. Make sure the file exists and you have access.');
  }

  const batchData = await response.json();
  const valueRanges = batchData.valueRanges || [];

  const parseRow = (rows: any[], headersLength: number): any[][] => {
    if (!rows || rows.length <= 1) return [];
    return rows.slice(1);
  };

  // 0: Vehicles, 1: Owners, 2: Drivers, 3: Companies, 4: Sites, 5: Payments, 6: Expenses
  const vehicleRows = parseRow(valueRanges[0]?.values, VEHICLE_HEADERS.length);
  const ownerRows = parseRow(valueRanges[1]?.values, OWNER_HEADERS.length);
  const driverRows = parseRow(valueRanges[2]?.values, DRIVER_HEADERS.length);
  const companyRows = parseRow(valueRanges[3]?.values, COMPANY_HEADERS.length);
  const siteRows = parseRow(valueRanges[4]?.values, SITE_HEADERS.length);
  const paymentRows = parseRow(valueRanges[5]?.values, PAYMENT_HEADERS.length);
  const expenseRows = parseRow(valueRanges[6]?.values, EXPENSE_HEADERS.length);

  const vehicles: Vehicle[] = vehicleRows.map((row, i) => ({
    id: row[0] || `VEH${i.toString().padStart(3, '0')}`,
    registrationNumber: row[1] || '',
    model: row[2] || '',
    manufacturer: row[3] || '',
    year: Number(row[4]) || 2020,
    fuelType: (row[5] || 'Diesel') as any,
    transmission: (row[6] || 'Manual') as any,
    vehicleType: (row[7] || 'Sedan') as any,
    ownerId: row[8] || '',
    ownerName: row[9] || '',
    driverId: row[10] || '',
    driverName: row[11] || '',
    company: row[12] || '',
    site: row[13] || '',
    joiningDate: row[14] || '',
    status: (row[15] || 'Active') as any,
    emiAmount: Number(row[16]) || 0,
    emiDueDate: row[17] || '',
    insuranceExpiry: row[18] || '',
    permitExpiry: row[19] || '',
    fcExpiry: row[20] || '',
    pollutionExpiry: row[21] || '',
    fastagNumber: row[22] || '',
    remarks: row[23] || '',
  }));

  const owners: Owner[] = ownerRows.map((row, i) => ({
    id: row[0] || `OWN${i.toString().padStart(2, '0')}`,
    name: row[1] || '',
    phone: row[2] || '',
    email: row[3] || '',
    address: row[4] || '',
    bankName: row[5] || '',
    accountNumber: row[6] || '',
    ifsc: row[7] || '',
    upiId: row[8] || '',
    pan: row[9] || '',
    aadhaar: row[10] || '',
    remarks: row[11] || '',
  }));

  const drivers: Driver[] = driverRows.map((row, i) => ({
    id: row[0] || `DRV${i.toString().padStart(2, '0')}`,
    name: row[1] || '',
    phone: row[2] || '',
    address: row[3] || '',
    badgeNumber: row[4] || '',
    badgeExpiry: row[5] || '',
    licenceNumber: row[6] || '',
    licenceExpiry: row[7] || '',
    aadhaar: row[8] || '',
    pan: row[9] || '',
    emergencyContact: row[10] || '',
    salary: Number(row[11]) || 0,
    joiningDate: row[12] || '',
    status: (row[13] || 'Active') as any,
  }));

  const companies: Company[] = companyRows.map((row) => ({
    name: row[0] || '',
    billingCycle: row[1] || 'Monthly',
    paymentTerms: row[2] || 'Net 30',
    contactPerson: row[3] || '',
    phone: row[4] || '',
    email: row[5] || '',
    address: row[6] || '',
  }));

  const sites: Site[] = siteRows.map((row, i) => ({
    id: row[0] || `S${i.toString().padStart(2, '0')}`,
    name: row[1] || '',
    companyName: row[2] || '',
    location: row[3] || '',
    contactPerson: row[4] || '',
    phone: row[5] || '',
    remarks: row[6] || '',
  }));

  const payments: CompanyPayment[] = paymentRows.map((row, i) => ({
    id: `PAY-${i}`,
    month: row[0] || '',
    vehicleNumber: row[1] || '',
    company: row[2] || '',
    invoiceNumber: row[3] || '',
    paymentDate: row[4] || '',
    amountReceived: Number(row[5]) || 0,
    remarks: row[6] || '',
  }));

  const expenses: Expense[] = expenseRows.map((row, i) => ({
    id: `EXP-${i}`,
    date: row[0] || '',
    month: row[1] || '',
    vehicleNumber: row[2] || '',
    expenseType: (row[3] || 'Miscellaneous') as any,
    amount: Number(row[4]) || 0,
    remarks: row[5] || '',
  }));

  return {
    vehicles,
    owners,
    drivers,
    companies,
    sites,
    payments,
    expenses,
  };
}
