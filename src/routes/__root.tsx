/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Outlet, createRootRouteWithContext
} from '@tanstack/react-router';

import {
  TanStackRouterDevtools
} from '@tanstack/react-router-devtools';

import type {
  QueryClient
} from '@tanstack/react-query';

import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  ConfigProvider
} from '@/components/common';

import {
  Sidebar
} from '@/components/sidebar';


/**
 * The root route context.
 */
type RouteContext = {
  queryClient: QueryClient;
};


/**
 * The query params for loading the Agno config.
 */
const configQuery = {
  queryKey: ['config'],
  queryFn: api.getConfig,
  staleTime: 'static'
} as const;


/**
 * The loader function for the config query.
 */
function loadConfig(client: QueryClient): Promise<api.Config> {
  return client.ensureQueryData(configQuery);
}


/**
 * The root route.
 */
export
const Route = createRootRouteWithContext<RouteContext>()({
  loader: ({ context }) => loadConfig(context.queryClient),
  component: RouteComponent
});


/**
 * The component that renders the root route.
 */
function RouteComponent(): ReactNode {
  // Fetch the Agno config object.
  const config = Route.useLoaderData();

  // Return the rendered component.
  return (
    <ConfigProvider value={ config }>
      <Sidebar />
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </ConfigProvider>
  );
}
