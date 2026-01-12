import {
  createFileRoute,
  redirect,
  Outlet
} from '@tanstack/react-router'

import type {
  ReactNode,
} from 'react';

import {
  ConfigProvider
} from '@/config';

import * as api from '@/api';


/**
 * Auth bypass for the dev environment
 * 
 * (IMPORTANT) - update the .env variables before deployment
 * @returns 
 */
export function shouldEnforceAuth() {
  const bypass = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'
  const prod = import.meta.env.VITE_MODE === 'production'

  return !(bypass && !prod)
}

/**
 * The query params for loading the Agno config.
 * (Moved from __root) confg is now fetched after the authentication is successful
 */
const configQuery = {
  queryKey: ['config'],
  queryFn: api.getConfig,
  staleTime: 'static'
} as const;

/**
 * Authenticated route
 */
export const Route = createFileRoute('/_authenticated')({
  // Route the user to the /login page if not authenticated yet
  beforeLoad: ({ context, location }) => {
    if (shouldEnforceAuth() && !context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href
        },
      })
    }
  },
  component: RouteComponent,
  loader: ({ context }) => {
    return context.client.ensureQueryData(configQuery);
  }
})

/**
 * The component that renders the authenticated route.
 */
function RouteComponent(): ReactNode {
  // Fetch the Agno config object.
  const config = Route.useLoaderData();

  // Return the rendered component.
  return (
    <ConfigProvider value={ config }>
      <Outlet />
    </ConfigProvider>
  );
}
