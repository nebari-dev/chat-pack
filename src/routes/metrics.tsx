/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import {
  useCallback
} from 'react';


import {
  Metrics,
  MetricsConfigProvider,
  type MetricsConfig
} from '@/components/metrics';

import * as v from 'valibot';

/**
 * The schema for the route search params.
 */
const routeSearchSchema = v.object({
  month: v.optional(v.number()),
  year: v.optional(v.number()),
});

/**
 * The route for the `/metrics` endpoint.
 */
export
const Route = createFileRoute('/metrics')({
  validateSearch: routeSearchSchema,
  component: RouteComponent
});

/**
 * The component that renders the `/metrics` route.
 */
function RouteComponent() {
  // Fetch the search parameters.
  const { month, year } = Route.useSearch();

  // Fetch the navigator.
  const navigate = Route.useNavigate();

  // Create the callback for setting the `month` and `year` search params.
  const setDate = useCallback((month: number, year: number) => {
    navigate({ search: { month,year } });
  }, []);

  // Create the metrics context.
  const context: MetricsConfig = {
    month,
    year,
    setDate
  };  

  // Return the rendered component.
  return (
    <MetricsConfigProvider value={ context }>
      <Metrics />
    </MetricsConfigProvider>
  )  
}
