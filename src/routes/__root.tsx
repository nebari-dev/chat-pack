/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Outlet, createRootRouteWithContext
} from '@tanstack/react-router';

import type {
  QueryClient
} from '@tanstack/react-query';

import type {
  ReactNode
} from 'react';

import type {
  API
} from '@/api';


/**
 * The root route context.
 */
type RouteContext = {
  client: QueryClient;
  API: API;
};


/**
 * The root route.
 */
export
const Route = createRootRouteWithContext<RouteContext>()({
  component: RouteComponent,
});


/**
 * The component that renders the root route.
 */
function RouteComponent(): ReactNode {
  return <Outlet />;
}
