/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import type {
  QueryClient
} from '@tanstack/react-query';

import {
  ConfigDetails,
  ConfigContext
} from '@/components/agent-config'

import * as v from 'valibot';
import * as api from '@/api';

/**
 * The schema for the config page parameters
 */
const baseSchema = v.object({
  type: v.union([
    v.literal("agents"),
    v.literal("teams"),
    v.literal("workflows"),
  ]),
  id: v.string(),
});

/**
 * Config query definition
 */
const configQuery = (type: string, id: string) =>
  ({
    queryKey: ["config", type, id],
    queryFn: () => api.getAgentsConfig(type, id),
    staleTime: 'static',
  } as const);

/**
 * The loader function for the config query.
 */
function loadConfig(client: QueryClient, type: string, id: string) {
  return client.ensureQueryData(configQuery(type, id));
}

/**
 * The route for the `/config` endpoint.
 */
export
const Route = createFileRoute('/config')({
  validateSearch: baseSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => loadConfig(context.queryClient, deps.type, deps.id),
  component: RouteComponent,
});

/**
 * The component that renders the `/config` route.
 */
function RouteComponent() {
  // Fetch config from the __root
  const config = Route.useLoaderData();

  // Return the rendered component.
  return (
    <ConfigContext value={ config }>
      <ConfigDetails/>
    </ConfigContext>
  );
}
