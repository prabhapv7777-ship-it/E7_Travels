/**
 * Formats a date string (YYYY-MM-DD, ISO, or other) to DD/MM/YYYY format.
 * If the input is invalid or empty, it returns the fallback or original string.
 */
export function formatDate(dateStr: string | null | undefined, fallback: string = '-'): string {
  if (!dateStr) return fallback;
  const trimmed = dateStr.trim();
  if (!trimmed) return fallback;

  // If already in DD/MM/YYYY format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  }

  // Handle ISO datetime strings (e.g. 2026-07-09T00:25:39-07:00 or 2026-07-09T00:25:39Z)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  // Fallback: try standard Javascript date parsing
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // Ignore error and fall back
  }

  return trimmed;
}

/**
 * Normalizes an input value from a date input (YYYY-MM-DD) or other formats
 * to make sure we parse or display correctly.
 */
export function toInputDateFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  // If already in YYYY-MM-DD format, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // If in DD/MM/YYYY format, convert to YYYY-MM-DD for input fields
  const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }

  // Standard date parsing fallback
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Ignore
  }

  return trimmed;
}

/**
 * Formats a YYYY-MM month string into a human-readable month-wise format (e.g. July 2026)
 */
export function formatMonth(monthStr: string | null | undefined): string {
  if (!monthStr) return '-';
  const trimmed = monthStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthIndex = parseInt(match[2], 10) - 1;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }
  return trimmed;
}

/**
 * Returns today's date in YYYY-MM-DD format using local time.
 */
export function getTodayDateString(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Returns current month in YYYY-MM format using local time.
 */
export function getCurrentMonthString(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}`;
}
