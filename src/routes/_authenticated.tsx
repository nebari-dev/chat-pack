/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Outlet, createFileRoute, redirect
} from '@tanstack/react-router'

import type {
  ReactNode,
} from 'react';

import {
  getUser
} from '@/auth';

import {
  ConfigProvider
} from '@/config';

import {
  Sidebar
} from '@/sidebar';


// A flag controlling whether authentication is enabled.
const AUTH_ENABLED = (
  import.meta.env.VITE_MODE === 'prod' ||
  import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'
);


/**
 * The base route that enforces authentication.
 */
export
const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (AUTH_ENABLED && getUser() === null) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  loader: ({ context }) => {
    return context.client.ensureQueryData({
      queryKey: ['config'],
      queryFn: context.API.getConfig,
      staleTime: 'static'
    });
  },
  component: RouteComponent
});


/**
 * The component that renders the authenticated route.
 */
function RouteComponent(): ReactNode {
  // Fetch the Agno config object.
  const config = Route.useLoaderData();

  // Return the rendered component.
  return (
    <ConfigProvider value={ config }>
      <Sidebar />
      <Outlet />
    </ConfigProvider>
  );
}
