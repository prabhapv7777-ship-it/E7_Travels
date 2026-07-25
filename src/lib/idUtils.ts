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
