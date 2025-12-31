/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import {
  useCallback
} from 'react';

import * as v from 'valibot';

import * as api from '@/api';

import type {
  MetricsConfig, MetricsConfigUpdateOptions
} from '@/metrics';

import {
  Metrics, MetricsConfigProvider
} from '@/metrics';


/**
 * The schema for the route search params.
 */
const routeSearchSchema = v.object({
  month: v.fallback(v.optional(v.number()), undefined),
  year: v.fallback(v.optional(v.number()), undefined),
});


/**
 * A function which validates the route search parameters.
 */
function validateSearch(search: Record<string, unknown>) {
  // Parse the initial search parameters.
  const { year, month } = v.parse(routeSearchSchema, search);

  // Fetch the epoch date.
  const epoch = new Date(0);

  // Fetch the current date.
  const today = new Date();

  // Compute the effective selected date.
  const selectedYear = year ?? today.getUTCFullYear();
  const selectedMonth = month ?? today.getUTCMonth() + 1;
  const selectedTimestamp = Date.UTC(selectedYear, selectedMonth - 1);
  const selected = new Date(selectedTimestamp);

  // Calculate the chosen date via max(epoch, min(selected, today))
  const chosen = (
    selected < epoch ? epoch :
      selected > today ? today :
        selected
  );

  // Return the fully processed search params.
  return {
    year: chosen.getUTCFullYear(),
    month: chosen.getUTCMonth() + 1
  };
}


/**
 * The route for the `/metrics` endpoint.
 */
export
const Route = createFileRoute('/metrics')({
  component: RouteComponent,
  validateSearch: validateSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    // Extract the query client from the context.
    const { client } = context;

    // Unpack the deps.
    const { year, month } = deps;

    // Compute the UTC timestamps for the first and last days.
    const firstDayTimestamp = Date.UTC(year, month - 1, 1);
    const lastDayTimestamp = Date.UTC(year, month, 0);

    // Convert the UTC timestamps to date objects.
    const firstDay = new Date(firstDayTimestamp);
    const lastDay = new Date(lastDayTimestamp);

    // Create the function to load the metrics for the date range.
    const loadMetrics = () => {
      // Convert the start date to YYYY-MM-DD
      const starting_date = firstDay.toISOString().split('T')[0];

      // Convert the end date to YYYY-MM-DD
      const ending_date = lastDay.toISOString().split('T')[0];

      // Fetch the metrics from the API.
      return api.getMetrics({ starting_date, ending_date });
    };

    // Create the metrics query.
    const metricsQuery = {
      queryKey: ['metrics', year, month],
      queryFn: loadMetrics
    } as const;

    // Fetch the query.
    return client.fetchQuery(metricsQuery);
  }
});


/**
 * The component that renders the `/metrics` route.
 */
function RouteComponent() {
  // Fetch the search parameters.
  const { month, year } = Route.useSearch();

  // Fetch the loaded metrics data.
  const data = Route.useLoaderData();

  // Fetch the navigator.
  const navigate = Route.useNavigate();

  // Fetch the epoch date.
  const epoch = new Date(0);

  // Fetch the current date.
  const today = new Date();

  // Determine whether the selected month is the first available.
  const atStart = (
    year === epoch.getUTCFullYear() && (month - 1) === epoch.getUTCMonth()
  );

  // Determine whether the selected month is the last available.
  const atEnd = (
    year === today.getUTCFullYear() && (month - 1) === today.getUTCMonth()
  );

  // Create the callback for updating the config.
  const update = useCallback((options: MetricsConfigUpdateOptions) => {
    navigate({ search: { ...options } });
  }, []);

  // Create the metrics config.
  const config: MetricsConfig = {
    month, year, atStart, atEnd, data, update
  };

  // Return the rendered component.
  return (
    <MetricsConfigProvider value={ config }>
      <Metrics />
    </MetricsConfigProvider>
  );
}
