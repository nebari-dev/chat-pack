/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Outlet, createFileRoute
} from '@tanstack/react-router'

import type {
  ReactNode,
} from 'react';

import * as auth from '@/auth';

import {
  AppConfigContext
} from '@/context';

import {
  appConfigQuery
} from '@/queries';

import {
  Sidebar
} from '@/sidebar';


/**
 * The base route that enforces authentication.
 */
export
const Route = createFileRoute('/_authenticated')({
  beforeLoad: auth.login,
  loader: ({ context }) => {
    return context.client.fetchQuery(appConfigQuery);
  },
  component: RouteComponent
});


/**
 * The component that renders the authenticated route.
 */
function RouteComponent(): ReactNode {
  // Fetch the app config object.
  const appConfig = Route.useLoaderData();

  // TODO show an error page if there are no configured agents.

  // Return the rendered component.
  return (
    <AppConfigContext value={ appConfig }>
      <Sidebar />
      <Outlet />
    </AppConfigContext>
  );
}
