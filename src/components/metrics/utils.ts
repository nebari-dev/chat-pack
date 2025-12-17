/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as api from '@/api';


/**
 * A function that creates a range of 1-based days for a month.
 *
 * @param year - The year of interest.
 *
 * @param month - The 1-based month of interest.
 *
 * @returns An array of 1-based days for the month.
 */
export
function createDayRange(year: number, month: number): number[] {
  // Create the array to hold the days.
  const range: number[] = [];

  // Compute the number of days in the month.
  const dayCount = (new Date(year, month, 0)).getDate();

  // Fill the array with 1-based days.
  for (let i = 1; i <= dayCount; i++) {
    range.push(i);
  }

  // Return the result.
  return range;
}


/**
 * A function that collects metrics by days they appeared.
 *
 * @param data - The metrics api data response.
 *
 * @param key - The key in the metrics rows to extract.
 *
 * @returns A map of day -> extracted metric.
 */
export
function collectMetricsByDay<T extends keyof api.MetricsRow>(
  data: api.MetricsResponse, key: T
): Map<number, api.MetricsRow[T]> {
  // Create the map to hold the results
  const map = new Map<number, api.MetricsRow[T]>();

  // Iterate the metrics array to collect the metrics.
  for (const row of data.metrics) {
    // Compute the day for the metrics entry.
    const day = new Date(row.date).getDate();

    // Update the map with the requested metric.
    map.set(day, row[key]);
  }

  // Return the results.
  return map;
}
