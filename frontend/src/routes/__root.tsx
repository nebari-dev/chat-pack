/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import type { ReactNode } from 'react';

/**
 * The root route context.
 */
type RouteContext = {
  client: QueryClient;
};

/**
 * The root route.
 */
export const Route = createRootRouteWithContext<RouteContext>()({
  component: RouteComponent,
});

/**
 * The component that renders the root route.
 */
function RouteComponent(): ReactNode {
  return <Outlet />;
}
