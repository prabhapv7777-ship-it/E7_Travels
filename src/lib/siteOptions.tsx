import React from 'react';
import { Company, Site } from '../types';

export interface SiteOptionItem {
  value: string;
  label: string;
}

export const DEFAULT_CORPORATE_CLIENTS = [
  'AMAZON',
  'ASTRAZENICA',
  'BARCLAYS',
  'COGNIZANT',
  'COMCAST',
  'CTS',
  'EXL',
  'MEDEXPERT',
  'OPTUM',
  'REFEX',
  'RR DONNELLEY',
  'STATE STREET',
  'TCS',
  'WALMART',
  'WORKDAY',
];

/**
 * Strips out preference messages like 'Open Preference', 'Open', 'Any', etc.
 * Returns clean company/site name or empty string.
 */
export function cleanSiteValue(val?: string | null): string {
  if (!val) return '';
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === 'open preference' ||
    lower === 'open' ||
    lower === 'any' ||
    lower === 'none' ||
    lower === '-' ||
    lower.includes('open preference')
  ) {
    return '';
  }
  return trimmed;
}

/**
 * Common site data source & list builder
 * Aggregates all corporate companies, operating sites, and standard clients
 * into a single unified options list used across:
 * - Enquiry Desk
 * - Edit Vehicle Details (Master Register)
 * - Vehicle Joining Form
 * - Vehicle Induction Flow
 */
export function getCommonSiteOptions(
  companies: Company[] = [],
  sites: Site[] = [],
  currentVal?: string
): SiteOptionItem[] {
  const optionsMap = new Map<string, string>(); // value -> display label

  // 1. Add companies from Master
  companies.forEach((c) => {
    const siteVal = c.companySite || c.name;
    const label =
      c.companySite && c.companySite !== c.name
        ? `${c.name} - ${c.companySite}${c.vendorName ? ` [${c.vendorName}]` : ''}`
        : `${c.name}${c.vendorName ? ` [${c.vendorName}]` : ''}`;
    if (siteVal) optionsMap.set(siteVal, label);
    if (c.name && !optionsMap.has(c.name)) optionsMap.set(c.name, c.name);
  });

  // 2. Add sites from Master
  sites.forEach((s) => {
    const label = s.companyName ? `${s.companyName} - ${s.name}` : s.name;
    if (s.name && !optionsMap.has(s.name)) {
      optionsMap.set(s.name, label);
    }
  });

  // 3. Add standard known corporate clients if not already added
  DEFAULT_CORPORATE_CLIENTS.forEach((corp) => {
    if (!optionsMap.has(corp)) {
      optionsMap.set(corp, corp);
    }
  });

  // 4. Ensure current value is included if present and valid
  const cleanedVal = cleanSiteValue(currentVal);
  if (cleanedVal && !optionsMap.has(cleanedVal)) {
    optionsMap.set(cleanedVal, cleanedVal);
  }

  return Array.from(optionsMap.entries()).map(([value, label]) => ({
    value,
    label,
  }));
}

/**
 * Common JSX renderer for site options inside a <select> element
 */
export function renderCommonSiteOptions(
  companies: Company[] = [],
  sites: Site[] = [],
  currentVal?: string,
  includeOpenPreference = false,
  emptyOptionLabel = '-- None --'
) {
  const options = getCommonSiteOptions(companies, sites, currentVal);

  return (
    <>
      <option value="">{emptyOptionLabel}</option>
      {includeOpenPreference && (
        <option value="Open Preference">Open Preference / Any Site</option>
      )}
      <optgroup label="🏢 Corporate Companies & Operating Sites">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </optgroup>
    </>
  );
}

/**
 * Common helper to parse and format company, site, and vendor display from a site preference string
 */
export function getSitePrefCompanyDisplay(
  pref?: string,
  companies: Company[] = [],
  sites: Site[] = []
): { companyName: string; siteName: string; vendor: string } {
  const cleanPref = cleanSiteValue(pref);
  if (!cleanPref) {
    return { companyName: '', siteName: '', vendor: '' };
  }

  const matchedCompany = companies.find(
    (c) =>
      (c.companySite && c.companySite.toLowerCase() === cleanPref.toLowerCase()) ||
      (c.name && c.name.toLowerCase() === cleanPref.toLowerCase())
  );
  const matchedSite = sites.find(
    (s) => s.name && s.name.toLowerCase() === cleanPref.toLowerCase()
  );

  let companyName = matchedCompany?.name || matchedSite?.companyName || '';
  let siteName = matchedCompany?.companySite || matchedSite?.name || cleanPref;
  let vendor = matchedCompany?.vendorName || '';

  if (!companyName && cleanPref) {
    companyName = cleanPref;
  }

  return { companyName, siteName, vendor };
}
