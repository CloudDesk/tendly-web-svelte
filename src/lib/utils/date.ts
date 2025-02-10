export function toUTCDate(localDate: string | undefined): string | undefined {
  if (!localDate) return undefined;
  const date = new Date(localDate);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

export function toUTCDateTime(localDateTime: string | undefined): string | undefined {
  if (!localDateTime) return undefined;
  const date = new Date(localDateTime);
  return date.toISOString();
}

export function toUTCTime(localTime: string | undefined): string | undefined {
  if (!localTime) return undefined;
  return new Date(`1970-01-01T${localTime}`).toISOString().split('T')[1].slice(0, 5);
}

export function fromUTCDate(utcDate: string | undefined): string | undefined {
  if (!utcDate) return undefined;
  return new Date(utcDate).toLocaleDateString();
}

export function fromUTCTime(utcTime: string | undefined): string | undefined {
  if (!utcTime) return undefined;
  try {
    const date = new Date(`1970-01-01T${utcTime}Z`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return utcTime;
  }
}

export function toDate(localDateTime: string | undefined): string | undefined {
  if (!localDateTime) return undefined;
  const date = new Date(localDateTime);
  return date.toISOString().split('T')[0];
}

export function getMonthStartEnd(
  year?: number,
  month?: number
): { start: string; end: string } {
  const now = new Date();

  // Default to current year and month if not provided
  const targetYear = year ?? now.getUTCFullYear();
  const targetMonth = month ? month - 1 : now.getUTCMonth(); // JS months are 0-based

  // Start of the month
  const start = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0)).toISOString();

  let end: string;
  if (year || month) {
    // If year/month is provided, return full month end
    end = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)).toISOString();
  } else {
    // If no params, return today's end time
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)).toISOString();
  }

  return { start, end };
}


/**
 * Formats a Date object or date string into YYYY-MM-DD format
 * @param date - Date to format (Date object or date string)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Adds specified number of days to a date
 * @param date - Starting date (Date object or date string)
 * @param days - Number of days to add (can be negative)
 * @returns New Date object
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Gets the difference in days between two dates
 * @param date1 - First date (Date object or date string)
 * @param date2 - Second date (Date object or date string)
 * @returns Number of days between dates (positive if date2 is later, negative if date1 is later)
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : new Date(date1);
  const d2 = typeof date2 === 'string' ? new Date(date2) : new Date(date2);

  // Reset time part for accurate day calculation
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  // Calculate difference in days
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Return negative if date1 is later than date2
  return d2 < d1 ? -diffDays : diffDays;
}



/**
 * Checks if a date is valid
 * @param date - Date to check (string)
 * @returns boolean indicating if date is valid
 */
export function isValidDate(date: string): boolean {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Gets tomorrow's date in YYYY-MM-DD format
 * @returns Tomorrow's date as string
 */
export function getTomorrow(): string {
  const tomorrow = addDays(new Date(), 1);
  const date = formatDate(tomorrow);
  return date
}

/**
 * Compares two dates
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns -1 if date1 is earlier, 0 if equal, 1 if date1 is later
 */
export function compareDates(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : new Date(date1);
  const d2 = typeof date2 === 'string' ? new Date(date2) : new Date(date2);

  // Reset time part for accurate comparison
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}