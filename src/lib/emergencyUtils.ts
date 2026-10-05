export const KNOWN_RELATIONS: string[] = [
  'Wife',
  'Husband',
  'Spouse',
  'Father',
  'Mother',
  'Parent',
  'Parents',
  'Brother',
  'Sister',
  'Bro',
  'Sis',
  'Son',
  'Daughter',
  'Child',
  'Children',
  'Friend',
  'Relative',
  'Family',
  'Uncle',
  'Aunt',
  'Cousin',
  'Neighbour',
  'Neighbor',
  'Guardian',
  'Self',
  'Owner',
  'Other'
];

export interface ParsedEmergencyContact {
  name: string;
  relation: string;
  number: string;
}

/**
 * Robustly parses emergency contact details from raw combined string and/or explicit fields.
 * Guarantees that relationship terms (e.g. "Wife", "Father") are never mistakenly returned as the person's name.
 */
export function parseEmergencyDetails(
  raw?: string,
  explicitName?: string,
  explicitRel?: string,
  explicitNum?: string
): ParsedEmergencyContact {
  let name = (explicitName || '').trim();
  let relation = (explicitRel || '').trim();
  let number = (explicitNum || '').trim();

  // 1. Sanitize explicitName: if someone entered a relationship keyword (e.g. "Wife") in the Name field
  if (name) {
    const isRel = KNOWN_RELATIONS.some(r => r.toLowerCase() === name.toLowerCase());
    if (isRel) {
      if (!relation) {
        const canonical = KNOWN_RELATIONS.find(r => r.toLowerCase() === name.toLowerCase());
        relation = canonical || name;
      }
      name = ''; // Clear name so relationship is not displayed as name!
    } else {
      // Check if explicitName contains parentheses e.g. "Priya (Wife)"
      const parenMatch = name.match(/^(.*?)\s*\(([^)]+)\)$/);
      if (parenMatch) {
        const part1 = parenMatch[1].trim();
        const part2 = parenMatch[2].trim();
        const part2IsRel = KNOWN_RELATIONS.some(r => r.toLowerCase() === part2.toLowerCase());
        if (part2IsRel) {
          name = part1;
          if (!relation) relation = part2;
        } else {
          name = part1;
          if (!relation) relation = part2;
        }
      }
    }
  }

  // 2. Parse from raw string if name, relation, or number is missing
  if (raw && raw.trim()) {
    const cleanRaw = raw.trim();

    // Try extracting phone number first if missing
    if (!number) {
      const phoneMatch = cleanRaw.match(/(?:^|[^\d])(\+?\d[\d\s-]{7,}\d)(?:$|[^\d])/);
      if (phoneMatch) {
        number = phoneMatch[1].replace(/[^\d+]/g, '').trim();
      }
    }

    // Check for "Name (Relation) - Phone" or "Relation (Name) - Phone"
    const parenPattern = /^(.*?)\s*\(([^)]+)\)\s*(?:[-:–—]\s*(.*))?$/;
    const pMatch = cleanRaw.match(parenPattern);
    if (pMatch) {
      const p1 = pMatch[1].trim();
      const p2 = pMatch[2].trim();
      const pPhone = pMatch[3]?.trim();

      if (!number && pPhone) {
        number = pPhone.replace(/[^\d+]/g, '').trim();
      }

      const p1IsRel = KNOWN_RELATIONS.some(r => r.toLowerCase() === p1.toLowerCase());
      const p2IsRel = KNOWN_RELATIONS.some(r => r.toLowerCase() === p2.toLowerCase());

      if (p2IsRel) {
        if (!name && !p1IsRel) name = p1;
        if (!relation) {
          const canonical = KNOWN_RELATIONS.find(r => r.toLowerCase() === p2.toLowerCase());
          relation = canonical || p2;
        }
      } else if (p1IsRel) {
        if (!relation) {
          const canonical = KNOWN_RELATIONS.find(r => r.toLowerCase() === p1.toLowerCase());
          relation = canonical || p1;
        }
        if (!name && !p2IsRel) name = p2;
      } else {
        if (!name) name = p1;
        if (!relation) relation = p2;
      }
    } else {
      // Split by hyphen, dash, or colon delimiter
      const parts = cleanRaw.split(/\s*[-:–—]\s*/).filter(Boolean);

      if (parts.length >= 3) {
        // e.g. ["Priya", "Wife", "9876543204"] or ["Wife", "Priya", "9876543204"]
        const lastPart = parts[parts.length - 1].trim();
        const lastIsNum = /^\+?[\d\s]{7,}$/.test(lastPart);
        if (lastIsNum && !number) {
          number = lastPart.replace(/[^\d+]/g, '').trim();
        }

        const remaining = lastIsNum ? parts.slice(0, parts.length - 1) : parts;
        for (const rem of remaining) {
          const isRel = KNOWN_RELATIONS.some(r => r.toLowerCase() === rem.toLowerCase());
          if (isRel && !relation) {
            const canonical = KNOWN_RELATIONS.find(r => r.toLowerCase() === rem.toLowerCase());
            relation = canonical || rem;
          } else if (!isRel && !name) {
            name = rem;
          }
        }
      } else if (parts.length === 2) {
        const [first, second] = parts;
        const firstClean = first.trim();
        const secondClean = second.trim();
        const firstIsNum = /^\+?[\d\s]{7,}$/.test(firstClean);
        const secondIsNum = /^\+?[\d\s]{7,}$/.test(secondClean);

        if (secondIsNum && !number) {
          number = secondClean.replace(/[^\d+]/g, '').trim();
        } else if (firstIsNum && !number) {
          number = firstClean.replace(/[^\d+]/g, '').trim();
        }

        const textPart = secondIsNum ? firstClean : (firstIsNum ? secondClean : firstClean);
        const isRel = KNOWN_RELATIONS.some(r => r.toLowerCase() === textPart.toLowerCase());

        if (isRel) {
          if (!relation) {
            const canonical = KNOWN_RELATIONS.find(r => r.toLowerCase() === textPart.toLowerCase());
            relation = canonical || textPart;
          }
          // IMPORTANT: Do NOT assign textPart to name if it is a relationship!
        } else {
          if (!name) name = textPart;
        }
      } else if (parts.length === 1) {
        const single = parts[0].trim();
        if (/^\+?[\d\s]{7,}$/.test(single)) {
          if (!number) number = single.replace(/[^\d+]/g, '').trim();
        } else {
          const isRel = KNOWN_RELATIONS.some(r => r.toLowerCase() === single.toLowerCase());
          if (isRel) {
            if (!relation) {
              const canonical = KNOWN_RELATIONS.find(r => r.toLowerCase() === single.toLowerCase());
              relation = canonical || single;
            }
          } else {
            if (!name) name = single;
          }
        }
      }
    }
  }

  // Final check: Never let name equal a relationship term
  if (name && KNOWN_RELATIONS.some(r => r.toLowerCase() === name.toLowerCase())) {
    if (!relation) {
      const canonical = KNOWN_RELATIONS.find(r => r.toLowerCase() === name.toLowerCase());
      relation = canonical || name;
    }
    name = '';
  }

  return { name, relation, number };
}

/**
 * Formats name, relation, and phone into a clean standard string: e.g. "Priya (Wife) - 9876543210"
 */
export function formatCombinedEmergency(name?: string, rel?: string, num?: string): string {
  const cleanName = (name || '').trim();
  const cleanRel = (rel || '').trim();
  const cleanNum = (num || '').trim();

  const parts: string[] = [];
  if (cleanName && cleanRel) {
    parts.push(`${cleanName} (${cleanRel})`);
  } else if (cleanName) {
    parts.push(cleanName);
  } else if (cleanRel) {
    parts.push(cleanRel);
  }

  if (cleanNum) {
    if (parts.length > 0) {
      return `${parts.join(' ')} - ${cleanNum}`;
    }
    return cleanNum;
  }
  return parts.join(' ');
}
