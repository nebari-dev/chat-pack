/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

/**
 * A labelled bucket of items that share a recency group.
 */
export type RecencyGroup<T> = {
  /**
   * The display label, e.g. `Today` or `Previous 7 days`.
   */
  readonly label: string;

  /**
   * The items in the group, newest first.
   */
  readonly items: readonly T[];
};

/**
 * The recency buckets, in display order, with the age in whole days at which
 * each one ends. `Older` catches everything past the last bound.
 */
const BUCKETS = [
  { label: 'Today', maxDays: 0 },
  { label: 'Yesterday', maxDays: 1 },
  { label: 'Previous 7 days', maxDays: 7 },
  { label: 'Previous 30 days', maxDays: 30 },
  { label: 'Older', maxDays: Number.POSITIVE_INFINITY },
] as const;

/**
 * The number of whole calendar days between two instants, in local time.
 */
function calendarDaysBetween(earlier: Date, later: Date): number {
  const a = new Date(
    earlier.getFullYear(),
    earlier.getMonth(),
    earlier.getDate(),
  );
  const b = new Date(later.getFullYear(), later.getMonth(), later.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Group items into recency buckets by calendar day.
 *
 * Items are sorted newest first, empty buckets are dropped, and items dated
 * in the future (clock skew) count as today.
 *
 * @param items - The items to group.
 * @param getTimestamp - Returns an ISO timestamp for an item.
 * @param now - The reference time; defaults to the current time.
 * @returns The non-empty groups in display order.
 */
export function groupByRecency<T>(
  items: readonly T[],
  getTimestamp: (item: T) => string,
  now: Date = new Date(),
): RecencyGroup<T>[] {
  const sorted = items
    .map((item) => ({ item, ts: getTimestamp(item) }))
    .sort((a, b) => b.ts.localeCompare(a.ts));

  const buckets = BUCKETS.map((b) => ({ label: b.label, items: [] as T[] }));

  for (const { item, ts } of sorted) {
    const age = Math.max(0, calendarDaysBetween(new Date(ts), now));
    const index = BUCKETS.findIndex((b) => age <= b.maxDays);
    buckets[index].items.push(item);
  }

  return buckets.filter((b) => b.items.length > 0);
}
