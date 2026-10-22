/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

/**
 * The relative-time units, largest first, with their length in seconds.
 */
const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

/**
 * Format a timestamp relative to now, e.g. "12 minutes ago" or "yesterday".
 *
 * Anything under a minute, or in the future (clock skew), reads "just now".
 *
 * @param iso - The ISO timestamp to format.
 * @param now - The reference time; defaults to the current time.
 * @param locale - The locale; defaults to the user's.
 * @returns The formatted relative time.
 */
export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
  locale?: string,
): string {
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) {
    return 'just now';
  }
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (seconds >= size) {
      return format.format(-Math.floor(seconds / size), unit);
    }
  }
  return 'just now';
}

/**
 * Format a timestamp as an absolute local date and time, for tooltips.
 *
 * @param iso - The ISO timestamp to format.
 * @param locale - The locale; defaults to the user's.
 * @returns The formatted date and time.
 */
export function formatDateTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
