import { Timestamp } from 'firebase/firestore';

export function ensureDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    return new Date(value.seconds * 1000 + value.nanoseconds / 1_000_000);
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const fallback = new Date(value.replace(/\s+/g, ' '));
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return null;
}
