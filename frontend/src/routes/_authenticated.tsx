/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import { createFileRoute, Outlet } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import * as auth from '@/auth';
import { ConfigErrorScreen } from '@/components/config-error-screen';
import { AppConfigContext, PermissionsContext } from '@/context';
import { agentsQuery, appConfigQuery, userQuery } from '@/queries';

import { Sidebar } from '@/sidebar';

/**
 * The required permissions for the app to function.
 */
const REQUIRED_PERMISSIONS = [
  'threads:read',
  'threads:write',
  'threads:delete',
  'agents:read',
] as const;

/**
 * The type of loader data for the authenticated route.
 */
type LoaderData = {
  agents: import('@/api').AgentConfig[];
  permissions: Set<string>;
};

/**
 * The base route that enforces authentication.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: auth.login,
  loader: async ({
    context,
  }): Promise<LoaderData | ConfigErrorScreen.Props> => {
    const { client } = context;

    // Fetch the application config to check storage.
    const appConfig = await client.fetchQuery(appConfigQuery);

    // If storage is not enabled, show an error screen.
    if (!appConfig.storageEnabled) {
      return {
        title: 'Storage Not Enabled',
        message:
          'This application requires storage to function, but it is currently disabled.\n\nPlease contact an administrator to enable storage.',
      };
    }

    // Fetch the available agents.
    const agents = await client.fetchQuery(agentsQuery);

    // Fetch the current user and permissions.
    const user = await client.fetchQuery(userQuery);
    const permissions = new Set(user.permissions);

    // Check for required permissions.
    const missingPermissions = REQUIRED_PERMISSIONS.filter(
      (p) => !permissions.has(p),
    );

    // If permissions are missing, show an error screen.
    if (missingPermissions.length > 0) {
      return {
        title: 'Insufficient Permissions',
        message: `You are missing the following required permissions:\n\n${missingPermissions.map((p) => `• ${p}`).join('\n')}\n\nPlease contact an administrator to grant these permissions.`,
      };
    }

    // Return the loader data.
    return { agents, permissions };
  },
  component: RouteComponent,
});

/**
 * The component that renders the authenticated route.
 */
function RouteComponent(): ReactNode {
  // Fetch the loader data.
  const loaderData = Route.useLoaderData();

  // If the loader data is an error config, render the error screen.
  if ('title' in loaderData && 'message' in loaderData) {
    return <ConfigErrorScreen {...loaderData} />;
  }

  // Extract the agent and permissions data.
  const { agents, permissions } = loaderData;

  // Return the rendered component.
  return (
    <AppConfigContext value={agents}>
      <PermissionsContext value={permissions}>
        <Sidebar />
        <Outlet />
      </PermissionsContext>
    </AppConfigContext>
  );
}
