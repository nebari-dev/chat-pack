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
} from '@/components/metrics';

import {
  Metrics, MetricsConfigProvider
} from '@/components/metrics';


/**
 * Fetch the current date.
 */
const today = new Date();


/**
 * Fetch the current month using 1-based indexing.
 */
const currentMonth = today.getMonth() + 1;


/**
 * Fetch the current year.
 */
const currentYear = today.getFullYear();


/**
 * The schema for the route search params.
 */
const routeSearchSchema = v.object({
  month: v.fallback(v.number(), currentMonth),
  year: v.fallback(v.number(), currentYear),
});


/**
 * The route for the `/metrics` endpoint.
 */
export
const Route = createFileRoute('/metrics')({
  component: RouteComponent,
  validateSearch: routeSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps, context }) => {
    // Extract the query client from the context.
    const { client } = context;

    // Unpack the deps.
    const { year, month } = deps;

    // Compute the first and last days in the given month.
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

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

  // Create the callback for updating the config.
  const update = useCallback((options: MetricsConfigUpdateOptions) => {
    navigate({ search: { ...options } });
  }, []);

  // Create the metrics context.
  const context: MetricsConfig = { month, year, data, update };

  // Return the rendered component.
  return (
    <MetricsConfigProvider value={ context }>
      <Metrics />
    </MetricsConfigProvider>
  );
}
