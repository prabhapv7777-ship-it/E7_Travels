/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle, Owner, Driver, Company, Site, CompanyPayment, Expense, Enquiry } from '../types';

export interface SpreadsheetData {
  vehicles: Vehicle[];
  owners: Owner[];
  drivers: Driver[];
  companies: Company[];
  sites: Site[];
  payments: CompanyPayment[];
  expenses: Expense[];
  enquiries: Enquiry[];
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
  'Company 2',
  'Site 2',
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

const ENQUIRY_HEADERS = [
  'Enquiry ID',
  'Vehicle Number',
  'Vehicle Type',
  'Vehicle Model Year',
  'Vehicle Color',
  'Owner Name/Phone',
  'Reference',
  'Driver Name',
  'Driver Age',
  'Driver Phone',
  'Driver Area',
  'Driver Batch/Exp',
  'Already Running Company',
  'Site Preference 1',
  'Site Preference 2',
  'Enquiry Date',
  'Status',
  'Remarks',
  'Comments JSON',
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
    { properties: { title: 'Enquiries' } },
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
          v.company2 || '',
          v.site2 || '',
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
    // Enquiries
    {
      range: 'Enquiries!A1',
      values: [
        ENQUIRY_HEADERS,
        ...(data.enquiries || []).map((e) => [
          e.id,
          e.vehicleNumber,
          e.vehicleType,
          e.vehicleModelYear,
          e.vehicleColor,
          e.ownerNamePhone,
          e.reference,
          e.driverName,
          e.driverAge,
          e.driverPhone,
          e.driverArea,
          e.driverBatchExp,
          e.alreadyRunningCompany,
          e.sitePreference1,
          e.sitePreference2,
          e.enquiryDate,
          e.status,
          e.remarks,
          e.comments ? JSON.stringify(e.comments) : '',
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
  // Check and upgrade spreadsheet to add missing tabs if any
  try {
    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      const existingTitles = (metaData.sheets || []).map((s: any) => s.properties?.title).filter(Boolean);
      if (!existingTitles.includes('Enquiries')) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Enquiries',
                  },
                },
              },
            ],
          }),
        });
      }
    }
  } catch (err) {
    console.warn('Could not check or auto-create Enquiries sheet:', err);
  }

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
          v.company2 || '',
          v.site2 || '',
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
    {
      range: 'Enquiries!A1:Z1000',
      values: [
        ENQUIRY_HEADERS,
        ...(data.enquiries || []).map((e) => [
          e.id,
          e.vehicleNumber,
          e.vehicleType,
          e.vehicleModelYear,
          e.vehicleColor,
          e.ownerNamePhone,
          e.reference,
          e.driverName,
          e.driverAge,
          e.driverPhone,
          e.driverArea,
          e.driverBatchExp,
          e.alreadyRunningCompany,
          e.sitePreference1,
          e.sitePreference2,
          e.enquiryDate,
          e.status,
          e.remarks,
          e.comments ? JSON.stringify(e.comments) : '',
        ]),
      ],
    },
  ];

  // We should first clear sheets or use raw batch update that overrides existing cells
  const clearPromises = ['Vehicles', 'Owners', 'Drivers', 'Companies', 'Sites', 'Payments', 'Expenses', 'Enquiries'].map(
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
  // 1. Get spreadsheet metadata to see what sheets exist
  let sheetNames = ['Vehicles', 'Owners', 'Drivers', 'Companies', 'Sites', 'Payments', 'Expenses'];
  try {
    const metaResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      const existingTitles = (metaData.sheets || []).map((s: any) => s.properties?.title).filter(Boolean);
      if (existingTitles.includes('Enquiries')) {
        sheetNames.push('Enquiries');
      }
    }
  } catch (err) {
    console.warn('Could not determine sheet titles, falling back to defaults:', err);
  }

  const ranges = sheetNames.map((name) => `ranges=${name}!A1:Z1000`).join('&');
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

  const getSheetValues = (sheetName: string): any[][] => {
    const idx = sheetNames.indexOf(sheetName);
    if (idx === -1 || idx >= valueRanges.length) return [];
    const rows = valueRanges[idx]?.values;
    if (!rows || rows.length <= 1) return [];
    return rows.slice(1);
  };

  const vehicleRows = getSheetValues('Vehicles');
  const ownerRows = getSheetValues('Owners');
  const driverRows = getSheetValues('Drivers');
  const companyRows = getSheetValues('Companies');
  const siteRows = getSheetValues('Sites');
  const paymentRows = getSheetValues('Payments');
  const expenseRows = getSheetValues('Expenses');
  const enquiryRows = getSheetValues('Enquiries');

  const vehicleHeadersFromSheet = valueRanges[0]?.values?.[0] || VEHICLE_HEADERS;
  const vehicleHeaderIndices = {
    id: vehicleHeadersFromSheet.indexOf('Vehicle ID'),
    registrationNumber: vehicleHeadersFromSheet.indexOf('Registration Number'),
    model: vehicleHeadersFromSheet.indexOf('Vehicle Model'),
    manufacturer: vehicleHeadersFromSheet.indexOf('Manufacturer'),
    year: vehicleHeadersFromSheet.indexOf('Year'),
    fuelType: vehicleHeadersFromSheet.indexOf('Fuel Type'),
    transmission: vehicleHeadersFromSheet.indexOf('Transmission'),
    vehicleType: vehicleHeadersFromSheet.indexOf('Vehicle Type'),
    ownerId: vehicleHeadersFromSheet.indexOf('Owner ID'),
    ownerName: vehicleHeadersFromSheet.indexOf('Owner Name'),
    driverId: vehicleHeadersFromSheet.indexOf('Driver ID'),
    driverName: vehicleHeadersFromSheet.indexOf('Driver Name'),
    company: vehicleHeadersFromSheet.indexOf('Company'),
    site: vehicleHeadersFromSheet.indexOf('Site'),
    company2: vehicleHeadersFromSheet.indexOf('Company 2'),
    site2: vehicleHeadersFromSheet.indexOf('Site 2'),
    joiningDate: vehicleHeadersFromSheet.indexOf('Joining Date'),
    status: vehicleHeadersFromSheet.indexOf('Status'),
    emiAmount: vehicleHeadersFromSheet.indexOf('EMI Amount'),
    emiDueDate: vehicleHeadersFromSheet.indexOf('EMI Due Date'),
    insuranceExpiry: vehicleHeadersFromSheet.indexOf('Insurance Expiry'),
    permitExpiry: vehicleHeadersFromSheet.indexOf('Permit Expiry'),
    fcExpiry: vehicleHeadersFromSheet.indexOf('FC Expiry'),
    pollutionExpiry: vehicleHeadersFromSheet.indexOf('Pollution Expiry'),
    fastagNumber: vehicleHeadersFromSheet.indexOf('FASTag Number'),
    remarks: vehicleHeadersFromSheet.indexOf('Remarks'),
  };

  const vehicles: Vehicle[] = vehicleRows.map((row, i) => {
    const val = (idx: number, def = '') => idx !== -1 && idx < row.length ? row[idx] : def;
    return {
      id: val(vehicleHeaderIndices.id) || `VEH${i.toString().padStart(3, '0')}`,
      registrationNumber: val(vehicleHeaderIndices.registrationNumber),
      model: val(vehicleHeaderIndices.model),
      manufacturer: val(vehicleHeaderIndices.manufacturer),
      year: Number(val(vehicleHeaderIndices.year)) || 2020,
      fuelType: (val(vehicleHeaderIndices.fuelType) || 'Diesel') as any,
      transmission: (val(vehicleHeaderIndices.transmission) || 'Manual') as any,
      vehicleType: (val(vehicleHeaderIndices.vehicleType) || 'Sedan') as any,
      ownerId: val(vehicleHeaderIndices.ownerId),
      ownerName: val(vehicleHeaderIndices.ownerName),
      driverId: val(vehicleHeaderIndices.driverId),
      driverName: val(vehicleHeaderIndices.driverName),
      company: val(vehicleHeaderIndices.company),
      site: val(vehicleHeaderIndices.site),
      company2: val(vehicleHeaderIndices.company2) || undefined,
      site2: val(vehicleHeaderIndices.site2) || undefined,
      joiningDate: val(vehicleHeaderIndices.joiningDate),
      status: (val(vehicleHeaderIndices.status) || 'Active') as any,
      emiAmount: Number(val(vehicleHeaderIndices.emiAmount)) || 0,
      emiDueDate: val(vehicleHeaderIndices.emiDueDate),
      insuranceExpiry: val(vehicleHeaderIndices.insuranceExpiry),
      permitExpiry: val(vehicleHeaderIndices.permitExpiry),
      fcExpiry: val(vehicleHeaderIndices.fcExpiry),
      pollutionExpiry: val(vehicleHeaderIndices.pollutionExpiry),
      fastagNumber: val(vehicleHeaderIndices.fastagNumber),
      remarks: val(vehicleHeaderIndices.remarks),
    };
  });

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

  const enquiries: Enquiry[] = enquiryRows.map((row, i) => {
    let commentsArr = [];
    try {
      if (row[18]) {
        commentsArr = JSON.parse(row[18]);
      }
    } catch (e) {
      // ignore
    }
    return {
      id: row[0] || `ENQ${(i + 1).toString().padStart(3, '0')}`,
      vehicleNumber: row[1] || '',
      vehicleType: row[2] || '',
      vehicleModelYear: row[3] || '',
      vehicleColor: row[4] || '',
      ownerNamePhone: row[5] || '',
      reference: row[6] || '',
      driverName: row[7] || '',
      driverAge: row[8] || '',
      driverPhone: row[9] || '',
      driverArea: row[10] || '',
      driverBatchExp: row[11] || '',
      alreadyRunningCompany: row[12] || '',
      sitePreference1: row[13] || '',
      sitePreference2: row[14] || '',
      enquiryDate: row[15] || '',
      status: (row[16] || 'New') as any,
      remarks: row[17] || '',
      comments: commentsArr,
    };
  });

  return {
    vehicles,
    owners,
    drivers,
    companies,
    sites,
    payments,
    expenses,
    enquiries,
  };
}
