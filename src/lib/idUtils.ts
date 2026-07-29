/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function generateUniqueEnquiryId(enquiries: { id: string }[]): string {
  let maxNum = 0;
  enquiries.forEach((e) => {
    if (e && e.id) {
      const match = e.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });
  let nextNum = Math.max(maxNum + 1, enquiries.length + 1);
  let candidate = `ENQ${nextNum.toString().padStart(3, '0')}`;
  while (enquiries.some((e) => e.id === candidate)) {
    nextNum++;
    candidate = `ENQ${nextNum.toString().padStart(3, '0')}`;
  }
  return candidate;
}

export function generateUniqueOwnerId(owners: { id: string }[]): string {
  let maxNum = 0;
  owners.forEach((o) => {
    if (o && o.id) {
      const match = o.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });
  let nextNum = Math.max(maxNum + 1, owners.length + 1);
  let candidate = `OWN${nextNum.toString().padStart(2, '0')}`;
  while (owners.some((o) => o.id === candidate)) {
    nextNum++;
    candidate = `OWN${nextNum.toString().padStart(2, '0')}`;
  }
  return candidate;
}

export function generateUniqueDriverId(drivers: { id: string }[]): string {
  let maxNum = 0;
  drivers.forEach((d) => {
    if (d && d.id) {
      const match = d.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });
  let nextNum = Math.max(maxNum + 1, drivers.length + 1);
  let candidate = `DRV${nextNum.toString().padStart(2, '0')}`;
  while (drivers.some((d) => d.id === candidate)) {
    nextNum++;
    candidate = `DRV${nextNum.toString().padStart(2, '0')}`;
  }
  return candidate;
}

export function generateUniqueVehicleId(vehicles: { id: string }[]): string {
  let maxNum = 0;
  vehicles.forEach((v) => {
    if (v && v.id) {
      const match = v.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });
  let nextNum = Math.max(maxNum + 1, vehicles.length + 1);
  let candidate = `VEH${nextNum.toString().padStart(3, '0')}`;
  while (vehicles.some((v) => v.id === candidate)) {
    nextNum++;
    candidate = `VEH${nextNum.toString().padStart(3, '0')}`;
  }
  return candidate;
}

export function sanitizeUniqueEntities<T extends { id: string }>(items: T[], prefix: string, padLength: number = 2): T[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  let maxNum = 0;

  items.forEach((item) => {
    if (item && item.id) {
      const match = item.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });

  const result: T[] = [];

  for (const item of items) {
    if (!item) continue;

    // Deduplicate exact duplicate objects or same id + name combo
    const signature = `${item.id || ''}-${(item as any).name || (item as any).registrationNumber || ''}-${(item as any).phone || ''}`;
    if (seenSignatures.has(signature)) {
      continue;
    }
    seenSignatures.add(signature);

    if (!item.id || seenIds.has(item.id)) {
      maxNum++;
      let newId = `${prefix}${maxNum.toString().padStart(padLength, '0')}`;
      while (seenIds.has(newId)) {
        maxNum++;
        newId = `${prefix}${maxNum.toString().padStart(padLength, '0')}`;
      }
      seenIds.add(newId);
      result.push({ ...item, id: newId });
    } else {
      seenIds.add(item.id);
      result.push(item);
    }
  }

  return result;
}

export function deduplicateDeletedVehicles<T extends { id: string; originalVehicleId?: string; registrationNumber?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenOrigIds = new Set<string>();
  const seenRegs = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!item) continue;
    const id = item.id ? String(item.id).trim() : '';
    const origId = item.originalVehicleId ? String(item.originalVehicleId).trim() : '';
    const reg = item.registrationNumber ? String(item.registrationNumber).trim().toUpperCase() : '';

    if (id && seenIds.has(id)) continue;
    if (origId && origId !== 'N/A' && origId !== '' && seenOrigIds.has(origId)) continue;
    if (reg && reg !== 'N/A' && reg !== '' && seenRegs.has(reg)) continue;

    if (id) seenIds.add(id);
    if (origId && origId !== 'N/A' && origId !== '') seenOrigIds.add(origId);
    if (reg && reg !== 'N/A' && reg !== '') seenRegs.add(reg);

    result.push(item);
  }

  return result;
}

export function getKeyFieldsForCollection(key: string): string[] {
  switch (key) {
    case 'vehicles':
      return ['id', 'registrationNumber'];
    case 'owners':
      return ['id', 'name'];
    case 'drivers':
      return ['id', 'name'];
    case 'companies':
      return ['companySite', 'name', 'id'];
    case 'sites':
      return ['id', 'name'];
    case 'payments':
      return ['id'];
    case 'expenses':
      return ['id'];
    case 'enquiries':
      return ['id'];
    case 'deletedVehicles':
      return ['registrationNumber', 'originalVehicleId', 'id'];
    case 'slabRates':
      return ['id', 'vehicleType'];
    default:
      return ['id', 'name'];
  }
}

