/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Outlet, createRootRoute
} from '@tanstack/react-router';

import {
  TanStackRouterDevtools
} from '@tanstack/react-router-devtools';

import type {
  ReactNode
} from 'react';

import {
  Sidebar
} from '@/components/sidebar';


export
const Route = createRootRoute({
  component: RouteComponent
});


function RouteComponent(): ReactNode {
  return (
    <>
      <Sidebar />
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
