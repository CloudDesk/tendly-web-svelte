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