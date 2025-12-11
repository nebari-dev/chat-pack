import type * as api from "@/api";

export type MetricRow = api.MetricsResponse["metrics"][number];

/**
 * Get the current month for the selector.
 */
export function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth());
}

/**
 * Build a Map<day, number> from a list of metric rows and a selector.
 */
export function buildDayMap(
  items: MetricRow[],
  selector: (m: MetricRow) => number | undefined,
) {
  const map = new Map<number, number>();

  for (const m of items) {
    const day = new Date(m.date).getDate();
    const value = selector(m) ?? 0;
    map.set(day, value);
  }

  return map;
}

/**
 * Build an array of { label: string, [key]: value } for each day of the month.
 */
export function buildDailySeries<TKey extends string>(
  days: number,
  map: Map<number, number>,
  key: TKey,
) {
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const value = map.get(day) ?? 0;
    return {
      label: String(day),
      [key]: value,
    } as { label: string } & Record<TKey, number>;
  });
}

/**
 * Sum a numeric metric over a list of rows.
 */
export function sumMetric(
  rows: MetricRow[],
  selector: (m: MetricRow) => number | undefined,
) {
  return rows.reduce((sum, m) => sum + (selector(m) ?? 0), 0);
}
